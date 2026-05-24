EmpleoAutopilot — Automatización Inteligente de Búsqueda de Empleo con IA

EmpleoAutopilot** es un ecosistema de automatización diseñado para revolucionar la forma en que los desarrolladores y profesionales de TI se postulan a ofertas de trabajo. En lugar de enviar CVs genéricos de forma masiva, la plataforma rastrea ofertas en **8 portales de empleo de España y globales**, compara los requisitos con tu perfil profesional y utiliza una **arquitectura de Inteligencia Artificial en cascada** para redactar un currículum y una carta de presentación adaptados al 100% para cada oferta, postulándote automáticamente vía correo electrónico.

---

Arquitectura del Sistema

La arquitectura de EmpleoAutopilot está diseñada con una filosofía robusta de desacoplamiento, tolerancia a fallos y optimización de costes.

```
       [ 8 FUENTES DE EMPLEO ]
       (Remotive, Arbeitnow, Jobicy, We Work Remotely, Jooble, etc.)
                   │
                   ▼ (Scrapeo Asíncrono / Generadores)
      ┌──────────────────────────────────────────────┐
      │          ENGINE BACKEND (Node.js + Express)  │
      │                                              │
      │   ┌───────────────┐   ┌──────────────────┐   │
      │   │ Smart Scraper │ ➡️ │ Cascading IA (*) │   │
      │   └───────────────┘   └────────┬─────────┘   │
      │                                │ (CV Reescrito JSON)
      │                                ▼   
      │                       ┌──────────────────┐   │
      │                       │  CV Personalizer │   │
      │                       └────────┬─────────┘   │
      └────────────────────────────────┼─────────────┘
                                       ▼ (Candidatura Lista)
                       ┌───────────────┴───────────────┐
                       ▼                               ▼
             [ BASE DE DATOS LOCAL ]            [ SERVIDOR SMTP ]
             (jobs_db.json / Kanban)            (Envío a Reclutador)
```

 Algoritmo de Resiliencia en Cascada de IA (Tolerancia a Fallos)
Para garantizar un funcionamiento ininterrumpido sin bloqueos por límites de cuota (Rate Limits / Error 429) o caídas de servidor (Error 503), el backend implementa una **cascada jerárquica multimodelo**:

1. **`gemini-2.5-flash` (Primario):** Intenta el análisis premium y la reescritura extendida.
2. **`gemini-2.0-flash` (Segundo nivel):** Si el primario responde con 429 o 503, realiza un reintento automático y escala a este modelo estable.
3. **`gemini-2.0-flash-lite` (Tercer nivel):** Tercer fallback de alta velocidad y bajo consumo.
4. **`Offline NLP Engine` (Último recurso):** Si toda la red o las APIs fallan, un motor local compila un CV estructurado y adaptado usando técnicas locales de procesamiento para asegurar que nunca pierdas una oportunidad.



 Características Principales

*   **Scraper Inteligente Multicanal:** Rastreo concurrente en tiempo real de 8 portales líderes:
    1.  *Remotive* (Global, remoto)
    2.  *Arbeitnow* (Europa)
    3.  *Jobicy* (Europa y España)
    4.  *The Muse* (EEUU y Global)
    5.  *We Work Remotely* (RSS Remoto)
    6.  *RemoteOK* (Remoto internacional)
    7.  *Jooble* (Excelente cobertura nacional en España, requiere API Key gratuita)
    8.  *Adzuna* (Gran agregador global, requiere API Key gratuita)
*   **CV Personalizer Pro:** Analiza la descripción completa del puesto de trabajo, extrae palabras clave técnicas y blandas, y reescribe dinámicamente tu perfil profesional (basándose en tus más de 3,000 caracteres de historial) generando un documento único de más de 600 palabras adaptado milimétricamente al puesto.
*   **Kanban CRM Pipeline Board:** Gestiona visualmente tus candidaturas en columnas interactivas: *Matches Nuevos (Found)*, *En Revisión (Needs Approval)*, *Postulado (Applied)*, y *Entrevistando (Interviewing)*.
*   **Simulador de Flujo en Vivo:** Panel interactivo en el frontend para realizar demostraciones técnicas visuales del flujo de datos en tiempo real (con partículas animadas SVG, reintentos de cascada simulados y consola de logs retro).

---

 Stack Tecnológico

*   **Frontend:** React (Vite), Lucide Icons, CSS Glassmorphism nativo, animaciones dinámicas SVG.
*   **Backend:** Node.js, Express, Cheerio (scraping semántico de texto), Nodemailer (envío de correos por SMTP con adjuntos).
*   **Inteligencia Artificial:** SDK de Google Gen AI (`@google/genai`), Cascada de modelos Gemini, Esquemas de salida JSON estructurados.
*   **Base de datos:** Sistema de archivos local basado en almacenamiento JSON (`jobs_db.json`).

---

 Instalación y Uso

 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/empleo-autopilot.git
cd empleo-autopilot
```

2. Instalar dependencias
Instala los paquetes tanto para el frontend como para el servidor de desarrollo:
```bash
npm install
```

3. Configurar variables de entorno
Copia el archivo `.env.example` y renómbralo a `.env`:
```bash
cp .env.example .env
```
Abre el archivo `.env` y rellena tus datos correspondientes (como tu clave API de Gemini y tus credenciales SMTP).

4. Ejecutar en modo desarrollo
Inicia el backend en el puerto `3001` y el frontend en el puerto `5173` de forma simultánea con un solo comando:
```bash
npm run dev
```

Navega a [http://localhost:5173](http://localhost:5173) en tu navegador para ver la plataforma funcionando.

---

 📂 Estructura del Proyecto

```text
├── public/                # Recursos estáticos públicos
├── server/                # Servidor Backend Express & Scripts
│   ├── ai.js              # Integración de Gemini AI y Lógica de Cascada
│   ├── db.js              # Manejo del almacenamiento local JSON
│   ├── index.js           # Rutas y configuración de Express
│   ├── integrations.js    # Notificaciones push y backups
│   ├── scraper.js         # Lógica de scraping concurrente para los 8 portales
│   └── worker.js          # Agente asíncrono en segundo plano
├── src/                   # Código Fuente Frontend (React)
│   ├── components/        # Componentes UI (Pipeline CRM, Settings, FlowSimulator, etc.)
│   ├── App.jsx            # Shell de enrutamiento y estado global
│   ├── styles.css         # Reset y tokens CSS globales
│   └── app.css            # Estilos del dashboard y glassmorphism
├── package.json           # Configuración del proyecto y scripts
└── vite.config.js         # Configuración del empaquetador Vite
```

---

Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---

Desarrollado con ❤️ para empoderar a los ingenieros de software a encontrar su próximo gran desafío técnico de forma inteligente y optimizada.
