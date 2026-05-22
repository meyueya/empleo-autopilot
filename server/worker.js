import { runAutopilotSimulation } from './scraper.js';
import { readDb, addJob } from './db.js';
import { analyzeAndPersonalize } from './ai.js';
import { sendIphoneNotification, logToSpreadsheet } from './integrations.js';

let isRunning = false;
let activeLogs = [];
const logListeners = new Set();

export function getAutopilotStatus() {
  return { isRunning, logs: activeLogs };
}

export function registerLogListener(listener) {
  logListeners.add(listener);
  // Send existing logs on registration
  activeLogs.forEach(log => listener(log));
  return () => {
    logListeners.delete(listener);
  };
}

export function clearLogs() {
  activeLogs = [];
  broadcastLog('info', '🧹 Log de consola limpiado.');
}

function broadcastLog(status, message) {
  const logEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    status, // 'info', 'scrape', 'nlp', 'success', 'warning', 'error'
    message
  };
  activeLogs.push(logEntry);
  if (activeLogs.length > 200) activeLogs.shift();
  
  logListeners.forEach(listener => listener(logEntry));
}

export async function startAutopilot() {
  if (isRunning) {
    return { success: false, message: "El piloto automático ya está ejecutándose." };
  }
  
  isRunning = true;
  activeLogs = [];
  broadcastLog('info', '🚦 Iniciando ciclo de búsqueda automatizado...');

  // Async Background Automation Loop
  (async () => {
    try {
      const db = readDb();
      const profile = db.profile;
      const settings = db.settings;
      const keywords = profile.targetKeywords && profile.targetKeywords.length > 0
        ? profile.targetKeywords
        : ["Software Engineer"];
      const minSalary = profile.minSalary || 0;

      const simulator = runAutopilotSimulation(keywords, minSalary);

      for await (const step of simulator) {
        if (step.status === 'job_found') {
          const rawJob = step.data;
          broadcastLog('nlp', `🧠 Personalizando CV y Carta de Presentación con IA para: "${rawJob.title}" en ${rawJob.company}...`);
          
          try {
            // Run AI analysis
            const aiResults = await analyzeAndPersonalize(rawJob, profile, settings.geminiApiKey);
            
            const enrichedJob = {
              ...rawJob,
              matchScore: aiResults.matchScore,
              matchAnalysis: {
                strengths: aiResults.strengths,
                gaps: aiResults.gaps,
                salaryRelevance: aiResults.salaryRelevance
              },
              cvTailored: aiResults.cvTailored,
              coverLetter: aiResults.coverLetter
            };

            // Appends to local Excel CSV & triggers Sheets simulation
            await logToSpreadsheet(enrichedJob, profile, settings);

            // Triggers Pushover iPhone alert if match score is high (>= 85%)
            if (enrichedJob.matchScore >= 85) {
              const alertTitle = `🎯 ¡Match Alto Encontrado! ${enrichedJob.matchScore}%`;
              const alertMessage = `Empresa: ${enrichedJob.company}\nPuesto: ${enrichedJob.title}`;
              await sendIphoneNotification(alertTitle, alertMessage, settings);
            }

            // Save to internal JSON DB
            addJob(enrichedJob);
            
            broadcastLog('success', `💾 Empleo guardado y notificado con éxito: Match ${enrichedJob.matchScore}%`);
          } catch (aiErr) {
            console.error("AI customization error:", aiErr);
            addJob(rawJob); // Save base job anyway
            broadcastLog('warning', `⚠️ Empleo guardado pero falló el enriquecimiento IA: ${aiErr.message}`);
          }
        } else {
          broadcastLog(step.status, step.message);
        }
      }
      
      broadcastLog('success', '🏆 Autopilot ha finalizado la búsqueda con éxito.');
    } catch (error) {
      console.error("Autopilot process crashed:", error);
      broadcastLog('error', `❌ Error crítico en Autopilot: ${error.message}`);
    } finally {
      isRunning = false;
      // Send a terminal signal that autopilot is off
      broadcastLog('info', '🔌 Piloto automático apagado (En espera).');
    }
  })();

  return { success: true, message: "Piloto automático iniciado con éxito en segundo plano." };
}
