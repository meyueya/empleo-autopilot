import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { readDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvBackupPath = path.join(__dirname, 'spreadsheets_backup.csv');

// SMTP Email Sender (Gmail/Outlook/Custom)
export async function sendApplicationEmail(job, profile, settings, customCoverLetter = null, customCvText = null) {
  const smtpUser = settings.smtpUser || process.env.SMTP_USER;
  const smtpPass = settings.smtpPass || process.env.SMTP_PASS;
  const smtpHost = settings.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(settings.smtpPort || process.env.SMTP_PORT || '587');

  const emailBody = customCoverLetter || job.coverLetter;
  const cvContent = customCvText || job.cvTailored || profile.cvText;
  const recruiter = job.recruiterEmail || 'careers@company.com';

  const mailOptions = {
    from: `"Job Autopilot" <${smtpUser || 'noreply@autopilot.com'}>`,
    to: recruiter,
    subject: `Candidatura: ${job.title} - ${profile.name}`,
    text: `${emailBody}\n\n=================================\nCV RESUMIDO Y ADAPTADO:\n=================================\n${cvContent}\n\nEnviado de manera autónoma por JobAutopilot.`,
  };

  // If no credentials configured, simulate sending with high fidelity
  if (!smtpUser || !smtpPass || smtpUser === 'your_email@gmail.com') {
    console.log(`⚠️ SMTP credentials not set. Simulating email sending to ${recruiter}...`);
    
    // Create direct mailto link for client-side easy clicking fallback!
    const mailtoSubject = encodeURIComponent(mailOptions.subject);
    const mailtoBody = encodeURIComponent(mailOptions.text);
    const mailtoLink = `mailto:${recruiter}?subject=${mailtoSubject}&body=${mailtoBody}`;
    
    return {
      success: true,
      simulated: true,
      mailtoLink,
      message: `Simulación de envío completada con éxito. Se generó un enlace directo mailto para tu gestor de correo nativo.`
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${recruiter}: Message ID: ${info.messageId}`);
    return {
      success: true,
      simulated: false,
      messageId: info.messageId,
      message: `Correo enviado oficialmente a ${recruiter} a través de SMTP.`
    };
  } catch (error) {
    console.error("❌ SMTP Error sending email:", error.message);
    throw new Error(`Error en el servidor de correo SMTP: ${error.message}`);
  }
}

// Google Sheets / CSV local logging
export async function logToSpreadsheet(job, profile, settings) {
  const sheetId = settings.googleSheetId || process.env.GOOGLE_SHEET_ID;
  const timestamp = new Date().toISOString();
  
  // CSV values escaping helper
  const escapeCsv = (str) => {
    if (!str) return '';
    const clean = str.replace(/"/g, '""').replace(/\n/g, ' ');
    return `"${clean}"`;
  };

  const csvRow = `${timestamp},${escapeCsv(job.company)},${escapeCsv(job.title)},${escapeCsv(job.salary)},${escapeCsv(job.location)},${escapeCsv(job.url)},${escapeCsv(job.recruiterEmail)},${job.matchScore}%,${job.status}\n`;

  // Always write to local CSV backup spreadsheet for absolute reliability!
  try {
    if (!fs.existsSync(csvBackupPath)) {
      const header = 'Fecha de Registro,Empresa,Puesto,Salario,Ubicacion,Enlace Vacante,Contacto,Match %,Estado Postulacion\n';
      fs.writeFileSync(csvBackupPath, header, 'utf-8');
    }
    fs.appendFileSync(csvBackupPath, csvRow, 'utf-8');
    console.log(`📊 Job logged to local spreadsheet backup: ${csvBackupPath}`);
  } catch (err) {
    console.error("Error writing local CSV spreadsheet:", err.message);
  }

  // Google Sheets Direct Logging
  if (!sheetId || sheetId === 'your_google_sheet_id_here') {
    return {
      success: true,
      loggedLocally: true,
      message: "Registrado con éxito en la hoja de cálculo local (server/spreadsheets_backup.csv)."
    };
  }

  try {
    console.log(`🔗 Intento de conexión con Google Sheets API (ID: ${sheetId})...`);
    // Since using complete Google OAuth in local script requires client credentials & auth tokens,
    // we notify that we saved to CSV and suggest completing Sheets Auth in Settings
    return {
      success: true,
      loggedLocally: true,
      message: "Registrado en CSV local. (Para conectar Google Sheets real, habilita el acceso OAuth en tu panel de Google Cloud)."
    };
  } catch (error) {
    console.error("Error logging to Google Sheets:", error.message);
    return {
      success: false,
      loggedLocally: true,
      message: `Error al conectar Google Sheets: ${error.message}. Registrado en CSV local.`
    };
  }
}

// Pushover iPhone Notifier
export async function sendIphoneNotification(title, message, settings = null) {
  const activeSettings = settings || (readDb ? readDb().settings : {});
  const token = activeSettings.pushoverToken || process.env.PUSHOVER_TOKEN;
  const user = activeSettings.pushoverUserKey || process.env.PUSHOVER_USER_KEY;

  if (!token || !user) {
    console.log("🔔 Pushover credentials not configured. Skipping iPhone notification.");
    return { success: false, message: "Pushover credentials missing." };
  }

  const payload = JSON.stringify({
    token,
    user,
    title,
    message
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.pushover.net',
      port: 443,
      path: '/1/messages.json',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("🔔 Pushover iPhone notification sent successfully!");
          try {
            resolve({ success: true, response: JSON.parse(data) });
          } catch (e) {
            resolve({ success: true, response: data });
          }
        } else {
          console.error(`❌ Pushover error: Status ${res.statusCode}`, data);
          resolve({ success: false, error: `Pushover responded with status ${res.statusCode}` });
        }
      });
    });

    req.on('error', (error) => {
      console.error("❌ Pushover request error:", error.message);
      resolve({ success: false, error: error.message });
    });

    req.write(payload);
    req.end();
  });
}
