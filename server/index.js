import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { readDb, writeDb, updateJob, deleteJob, addJob } from './db.js';
import { scrapeJobUrl } from './scraper.js';
import { analyzeAndPersonalize } from './ai.js';
import { sendApplicationEmail, logToSpreadsheet, sendIphoneNotification } from './integrations.js';
import { startAutopilot, getAutopilotStatus, registerLogListener, clearLogs } from './worker.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API: Get all jobs
app.get('/api/jobs', (req, res) => {
  const db = readDb();
  res.json(db.jobs);
});

// API: Manually import job or scrape URL
app.post('/api/jobs', async (req, res) => {
  const { url, title, company, location, salary, description } = req.body;
  const db = readDb();
  const profile = db.profile;
  const settings = db.settings;

  try {
    let jobData;

    if (url && url.startsWith('http')) {
      // Scrape URL
      console.log(`Manual URL scrape requested: ${url}`);
      const scraped = await scrapeJobUrl(url);
      jobData = {
        id: `manual-${Date.now()}`,
        ...scraped,
        createdAt: new Date().toISOString(),
        status: 'Found'
      };
    } else {
      // Create manual job
      jobData = {
        id: `manual-${Date.now()}`,
        title: title || 'Puesto de Empleo Manual',
        company: company || 'Empresa Empleadora',
        location: location || 'Remoto',
        salary: salary || 'No especificado',
        url: url || '',
        source: 'Manual',
        description: description || 'Sin descripción',
        createdAt: new Date().toISOString(),
        status: 'Found'
      };
    }

    // Personalize using AI
    console.log(`Running AI NLP matching for manual job...`);
    const aiResults = await analyzeAndPersonalize(jobData, profile, settings.geminiApiKey);

    const enrichedJob = {
      ...jobData,
      matchScore: aiResults.matchScore,
      matchAnalysis: {
        strengths: aiResults.strengths,
        gaps: aiResults.gaps,
        salaryRelevance: aiResults.salaryRelevance
      },
      cvTailored: aiResults.cvTailored,
      coverLetter: aiResults.coverLetter
    };

    // Save
    addJob(enrichedJob);
    
    // Log to CSV
    await logToSpreadsheet(enrichedJob, profile, settings);

    res.status(201).json(enrichedJob);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Update job status or fields
app.put('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  const updated = updateJob(id, req.body);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: "Job not found." });
  }
});

// API: Delete job
app.delete('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  deleteJob(id);
  res.json({ success: true });
});

// API: Re-run AI analysis for an existing job (uses improved prompt with new key)
app.post('/api/jobs/:id/reanalyze', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const job = db.jobs.find(j => j.id === id);
  if (!job) return res.status(404).json({ error: 'Job not found.' });

  try {
    console.log(`[Reanalyze] Re-running Gemini analysis for: "${job.title}" @ ${job.company}`);
    const analysis = await analyzeAndPersonalize(job, db.profile);
    const updated = updateJob(id, {
      matchScore: analysis.matchScore,
      matchAnalysis: {
        strengths: analysis.strengths,
        gaps: analysis.gaps,
        salaryRelevance: analysis.salaryRelevance
      },
      cvTailored: analysis.cvTailored,
      coverLetter: analysis.coverLetter
    });
    res.json(updated);
  } catch (err) {
    console.error('[Reanalyze] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// API: Clear all jobs
app.post('/api/jobs/clear', (req, res) => {
  const db = readDb();
  db.jobs = [];
  const success = writeDb(db);
  if (success) {
    console.log("🧹 Database jobs array cleared successfully.");
    res.json({ success: true, message: "Historial de candidaturas reseteado con éxito." });
  } else {
    res.status(500).json({ error: "No se pudo actualizar la base de datos." });
  }
});

// API: Get Profile CV
app.get('/api/profile', (req, res) => {
  const db = readDb();
  res.json(db.profile);
});

// API: Update Profile CV
app.post('/api/profile', (req, res) => {
  const db = readDb();
  db.profile = { ...db.profile, ...req.body };
  writeDb(db);
  res.json(db.profile);
});

// API: Get settings
app.get('/api/settings', (req, res) => {
  const db = readDb();
  res.json(db.settings);
});

// API: Update settings
app.post('/api/settings', (req, res) => {
  const db = readDb();
  db.settings = { ...db.settings, ...req.body };
  writeDb(db);

  // Sync credentials and settings to .env file and process.env dynamically
  const envMapping = {
    geminiApiKey: 'GEMINI_API_KEY',
    pushoverUserKey: 'PUSHOVER_USER_KEY',
    pushoverToken: 'PUSHOVER_TOKEN',
    smtpHost: 'SMTP_HOST',
    smtpPort: 'SMTP_PORT',
    smtpUser: 'SMTP_USER',
    smtpPass: 'SMTP_PASS',
    googleSheetId: 'GOOGLE_SHEET_ID',
    // Nuevos portales europeos/españoles
    joobleApiKey: 'JOOBLE_API_KEY',
    adzunaAppId: 'ADZUNA_APP_ID',
    adzunaAppKey: 'ADZUNA_APP_KEY'
  };

  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    try {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      for (const [bodyKey, envKey] of Object.entries(envMapping)) {
        const val = req.body[bodyKey];
        if (val !== undefined) {
          // Update process.env in memory immediately
          process.env[envKey] = String(val);

          const regex = new RegExp(`^${envKey}=.*`, 'm');
          if (envContent.match(regex)) {
            envContent = envContent.replace(regex, `${envKey}=${val}`);
          } else {
            envContent += `\n${envKey}=${val}`;
          }
        }
      }
      
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log("💾 Credentials and settings successfully written to .env file and process.env.");
    } catch (err) {
      console.error("Error writing settings to .env file:", err);
    }
  }

  res.json(db.settings);
});

// API: Test Pushover Push Notification
app.post('/api/test-push', async (req, res) => {
  try {
    const db = readDb();
    const settings = db.settings;
    
    if (!settings.pushoverToken || !settings.pushoverUserKey) {
      return res.status(400).json({ 
        success: false, 
        error: "Debes configurar y guardar tu Pushover User Key y API Token antes de realizar la prueba." 
      });
    }

    const result = await sendIphoneNotification(
      "Prueba Local", 
      "Hola Pedro, tu infraestructura local funciona", 
      settings
    );

    if (result.success) {
      res.json({ success: true, message: "¡Notificación de prueba enviada con éxito a tu iPhone!" });
    } else {
      res.status(500).json({ success: false, error: result.error || "Pushover no pudo procesar la notificación." });
    }
  } catch (error) {
    console.error("Error in test-push endpoint:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Start Autopilot Search Scraper
app.post('/api/autopilot/start', async (req, res) => {
  const result = await startAutopilot();
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// API: Get Autopilot status
app.get('/api/autopilot/status', (req, res) => {
  res.json(getAutopilotStatus());
});

// API: Clear Logs
app.post('/api/autopilot/clear-logs', (req, res) => {
  clearLogs();
  res.json({ success: true });
});

// API: Server-Sent Events for Live Terminal Logs
app.get('/api/autopilot/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial event to establish SSE connection
  res.write(`data: ${JSON.stringify({ status: 'info', message: '🔌 SSE log pipeline connected.' })}\n\n`);

  const cleanup = registerLogListener((log) => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  req.on('close', () => {
    cleanup();
    res.end();
  });
});

// API: Send email (Approve & Send Application)
app.post('/api/jobs/:id/send', async (req, res) => {
  const { id } = req.params;
  const { coverLetter, cvTailored } = req.body;
  
  const db = readDb();
  const job = db.jobs.find(j => j.id === id);
  
  if (!job) {
    return res.status(404).json({ error: "Job not found." });
  }

  try {
    const result = await sendApplicationEmail(job, db.profile, db.settings, coverLetter, cvTailored);
    
    // Update status to 'Applied'
    const updated = updateJob(id, { 
      status: 'Applied',
      recruiterEmail: job.recruiterEmail,
      coverLetter: coverLetter || job.coverLetter,
      cvTailored: cvTailored || job.cvTailored
    });

    res.json({
      success: true,
      job: updated,
      ...result
    });
  } catch (error) {
    console.error("Error sending application email:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Download Local Spreadsheet CSV Backup
app.get('/api/csv/download', (req, res) => {
  const csvPath = path.join(__dirname, 'spreadsheets_backup.csv');
  if (fs.existsSync(csvPath)) {
    res.download(csvPath, 'postulaciones_empleo.csv');
  } else {
    // Generate headers on the fly if not exists
    const headers = 'Fecha de Registro,Empresa,Puesto,Salario,Ubicacion,Enlace Vacante,Contacto,Match %,Estado Postulacion\n';
    fs.writeFileSync(csvPath, headers, 'utf-8');
    res.download(csvPath, 'postulaciones_empleo.csv');
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 EmpleoAutopilot Server running on http://localhost:${PORT}`);
});
