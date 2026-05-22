import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'jobs_db.json');

const defaultDb = {
  jobs: [
    {
      id: "demo-job-1",
      title: "Senior Product Designer (UX/UI)",
      company: "TechNova Solutions",
      location: "Remoto (España)",
      salary: "45,000€ - 55,000€",
      url: "https://www.linkedin.com/jobs/view/demo1",
      source: "LinkedIn",
      description: "Buscamos un Diseñador de Producto Senior con experiencia sólida en sistemas de diseño complejos (Figma), investigación con usuarios (User Research) y prototipado de alta fidelidad. Trabajarás codo con codo con el equipo de ingeniería para definir la visión de nuestro producto principal SaaS.",
      matchScore: 92,
      matchAnalysis: {
        strengths: ["Experiencia sólida en Figma y Design Systems", "Habilidades avanzadas de User Research y prototipado", "Enfoque de colaboración estrecha con ingeniería"],
        gaps: ["No se menciona experiencia previa con metodologías SaaS específicas, pero tus habilidades core cubren el 90%."],
        salaryRelevance: "Excelente, encaja exactamente dentro de tu rango mínimo configurado."
      },
      status: "Needs Approval", // Stages: Found, Needs Approval, Ready to Send, Applied, Interviewing, Offer, Rejected, Declined
      cvTailored: "Diseñador de Producto Senior con especial enfoque en Sistemas de Diseño y Figma. Experto en transformar hallazgos de User Research en interfaces elegantes y funcionales, facilitando la integración con equipos de ingeniería para crear productos SaaS de alto impacto.",
      coverLetter: "Estimado equipo de selección de TechNova Solutions,\n\nMe pongo en contacto con vosotros con gran entusiasmo en relación a la vacante de Senior Product Designer (UX/UI). He seguido de cerca vuestra trayectoria en productos SaaS y me apasiona la idea de aportar mis habilidades para escalar vuestro sistema de diseño.\n\nEn mi rol más reciente, he liderado la creación y gobernanza de sistemas de diseño en Figma que redujeron los tiempos de desarrollo en un 25%, coordinándome de forma fluida con el equipo técnico. Mi metodología se centra en la investigación de usuario (User Research) y pruebas de usabilidad continuas para garantizar decisiones de diseño informadas por datos.\n\nDado vuestro enfoque de producto robusto, estoy seguro de que puedo sumarme de inmediato y aportar valor. Adjunto mi CV adaptado para vuestra revisión.\n\nAtentamente,\nTu Nombre Completo",
      recruiterEmail: "careers@technova.io",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "demo-job-2",
      title: "Diseñador UX Remoto",
      company: "DigitalFlow Apps",
      location: "Remoto",
      salary: "38,000€ - 42,000€",
      url: "https://www.indeed.com/viewjob/demo2",
      source: "Indeed",
      description: "Estamos contratando un Diseñador UX apasionado para crear experiencias móviles intuitivas. Responsabilidades: Realizar wireframes, pruebas con usuarios reales, iteración de prototipos rápidos y documentación de flujos de interacción.",
      matchScore: 84,
      matchAnalysis: {
        strengths: ["Enfoque claro en pruebas de usuarios y prototipado rápido", "Dominio de arquitectura de información y flujos de usuario (wireframes)"],
        gaps: ["La vacante está muy enfocada en entornos móviles nativos (iOS/Android), tu perfil es más web/SaaS, aunque transferible."],
        salaryRelevance: "Aceptable, cumple con el mínimo requerido."
      },
      status: "Found",
      cvTailored: "Diseñador UX orientado a resultados y apasionado por la creación de flujos de interacción intuitivos y pruebas con usuarios. Experiencia demostrada estructurando arquitecturas de información complejas y diseñando wireframes de alta fidelidad.",
      coverLetter: "Hola equipo de DigitalFlow Apps,\n\nMe dirijo a vosotros para manifestar mi interés en el puesto de Diseñador UX Remoto. Me atrae enormemente vuestro compromiso por diseñar experiencias móviles sencillas y de alta calidad.\n\nA lo largo de mi trayectoria, he perfeccionado metodologías ágiles de wireframing e iteración de prototipos rápidos basados en pruebas de usabilidad directas con clientes. Considero que el diseño UX no es solo estético, sino empático y respaldado por la experiencia de uso de las personas.\n\nMe encantaría conversar más sobre cómo mi enfoque de investigación e interacción puede impulsar vuestras apps móviles.\n\nUn cordial saludo,\nTu Nombre Completo",
      recruiterEmail: "jobs@digitalflow.net",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ],
  profile: {
    name: "Tu Nombre Completo",
    email: "tu.correo@example.com",
    phone: "+34 600 000 000",
    location: "Remoto / Madrid, España",
    title: "Senior Full Stack Developer / Project Leader",
    skills: ["Java", "Angular", "Spring Boot", "Scrum", "REST APIs", "GDPR"],
    cvText: "Ingeniero en Informática con amplia experiencia en desarrollo Full Stack (Java & Angular), Spring Boot, APIs REST y la gestión de proyectos de alto impacto tecnológico mediante metodologías ágiles como Scrum. Apasionado por diseñar arquitecturas seguras y conformes con GDPR.",
    targetKeywords: ["Tech Lead", "Project Leader", "Senior Full Stack Developer", "Engineering Manager"],
    targetLocation: "Remote",
    minSalary: 35000
  },
  settings: {
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    pushoverUserKey: "",
    pushoverToken: "",
    googleSheetId: "",
    autopilotInterval: 24,
    autoApprove: false
  }
};

export function readDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2), 'utf-8');
    return defaultDb;
  }
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return defaultDb;
  }
}

export function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error("Error writing database:", error);
    return false;
  }
}

export function updateJob(jobId, updatedFields) {
  const db = readDb();
  const index = db.jobs.findIndex(j => j.id === jobId);
  if (index !== -1) {
    db.jobs[index] = { ...db.jobs[index], ...updatedFields };
    writeDb(db);
    return db.jobs[index];
  }
  return null;
}

export function deleteJob(jobId) {
  const db = readDb();
  db.jobs = db.jobs.filter(j => j.id !== jobId);
  writeDb(db);
  return true;
}

export function addJob(job) {
  const db = readDb();
  db.jobs.push(job);
  writeDb(db);
  return job;
}
