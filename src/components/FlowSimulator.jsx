import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Terminal, Cpu, Database, Mail, Globe, Zap, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export default function FlowSimulator() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Idle, 1: Scraping, 2: Found, 3: IA Cascade, 4: Personalization, 5: Saving & Sending, 6: Completed
  const [logs, setLogs] = useState([]);
  const [activePortal, setActivePortal] = useState(null);
  const [activeModel, setActiveModel] = useState(null);
  const [typedCvPreview, setTypedCvPreview] = useState('');
  const logsEndRef = useRef(null);

  const portals = [
    { name: 'Remotive', region: 'Global' },
    { name: 'Arbeitnow', region: 'Europa' },
    { name: 'Jobicy', region: 'Europa' },
    { name: 'The Muse', region: 'EEUU' },
    { name: 'We Work Remotely', region: 'Global' },
    { name: 'RemoteOK', region: 'Global' },
    { name: 'Jooble', region: 'España' },
    { name: 'Adzuna', region: 'España' }
  ];

  const models = [
    { id: 'gemini-2.5-flash', status: 'rate-limit', label: 'Gemini 2.5 Flash', desc: 'Cuota de API Excedida (Error 429)' },
    { id: 'gemini-2.0-flash', status: 'success', label: 'Gemini 2.0 Flash', desc: 'Conexión Exitosa (Servidor OK)' },
    { id: 'gemini-2.0-flash-lite', status: 'idle', label: 'Gemini 2.0 Lite', desc: 'En espera (Fallback)' },
    { id: 'offline-nlp', status: 'idle', label: 'Offline NLP Engine', desc: 'En espera (Último recurso)' }
  ];

  const cvLines = [
    "PEDRO CASTILLO CARRILLO - RESUMEN EJECUTIVO ADAPTADO",
    "---------------------------------------------------",
    "Puesto: Senior Full Stack Developer & Project Leader",
    "Coincidencia con la oferta: 94.7% (Match de Alta Prioridad)",
    "",
    "PERFIL PROFESIONAL:",
    "Desarrollador Senior con más de 8 años de experiencia liderando",
    "proyectos críticos basados en arquitecturas robustas Java,",
    "Angular y Spring Boot. Especialista en la implementación de APIs",
    "REST seguras, cumplimiento normativo GDPR y metodologías Scrum.",
    "",
    "APTITUDES ADAPTADAS DESTAQUE:",
    "✔ Microservicios en Spring Cloud & Docker",
    "✔ Frontend modular con Angular 14+ y RxJS",
    "✔ Seguridad y autenticación OAuth2 / GDPR",
    "✔ Liderazgo de equipos y agilidad técnica",
    "",
    "EXPERIENCIA SELECCIONADA ADAPTADA AL PUESTO:",
    "• Senior Tech Lead - Desarrollo de APIs transaccionales escalables",
    "  optimizadas bajo Spring Boot, reduciendo tiempos de respuesta en 35%.",
    "• Frontend Lead - Refactorización de portal web empresarial en Angular,",
    "  mejorando la retención de usuarios gracias a micro-animaciones y UX premium."
  ];

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Simulation steps and logic
  useEffect(() => {
    let interval = null;

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prevStep) => {
          const nextStep = prevStep + 1;
          if (nextStep > 6) {
            setIsPlaying(false);
            return 6;
          }
          executeStepActions(nextStep);
          return nextStep;
        });
      }, 4500);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isPlaying]);

  const addLog = (text, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, text, type }]);
  };

  const startSimulation = () => {
    if (currentStep === 6) {
      // Reset first
      resetSimulation();
      setTimeout(() => {
        setIsPlaying(true);
        setCurrentStep(1);
        executeStepActions(1);
      }, 500);
    } else {
      setIsPlaying(true);
      if (currentStep === 0) {
        setCurrentStep(1);
        executeStepActions(1);
      } else {
        executeStepActions(currentStep);
      }
    }
  };

  const pauseSimulation = () => {
    setIsPlaying(false);
    addLog("Simulación pausada por el usuario", "warning");
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setLogs([]);
    setActivePortal(null);
    setActiveModel(null);
    setTypedCvPreview('');
    addLog("Simulador de Flujo reiniciado. Listo para comenzar.", "info");
  };

  const executeStepActions = (step) => {
    switch (step) {
      case 1: // Scraping Portals
        addLog("Iniciando Simulación de Arquitectura EmpleoAutopilot...", "info");
        addLog("Cargando perfil local de Pedro Castillo Carrillo (Senior Full Stack)...", "info");
        addLog("Activando Smart Scraper en Node.js...", "scrape");
        addLog("Escaneando 8 fuentes de empleo en paralelo (Globales y de España)...", "scrape");
        
        // Portal cycling animation simulation
        let portalIdx = 0;
        const portalInterval = setInterval(() => {
          if (portalIdx < portals.length) {
            setActivePortal(portals[portalIdx].name);
            addLog(`Consultando portal: ${portals[portalIdx].name} (${portals[portalIdx].region})...`, "scrape");
            portalIdx++;
          } else {
            clearInterval(portalInterval);
          }
        }, 500);
        break;

      case 2: // Match Found
        setActivePortal(null);
        setActivePortal("Remotive"); // Highlight where match was found
        addLog("¡Match de empleo identificado!", "success");
        addLog("[REMOTIVE] Encontrado: 'Senior Java/Spring Boot & Angular Developer' - Remoto Europa", "success");
        addLog("Cargando descripción de la oferta y requisitos para análisis de IA...", "info");
        break;

      case 3: // IA Cascade
        setActivePortal(null);
        addLog("Iniciando motor de IA en cascada (Gemini AI Cascade)...", "nlp");
        
        // Cascade animation
        setActiveModel("gemini-2.5-flash");
        addLog("[CASCADA] Intentando procesar con el modelo primario: gemini-2.5-flash...", "nlp");
        
        setTimeout(() => {
          addLog("[ALERTA] gemini-2.5-flash: Rate limit excedido (429 - Límite de cuota diaria alcanzado)!", "error");
          addLog("[CASCADA] Iniciando mecanismo de resiliencia (Fallback automático)...", "warning");
          
          setTimeout(() => {
            setActiveModel("gemini-2.0-flash");
            addLog("[CASCADA] Intentando con el segundo modelo de la cascada: gemini-2.0-flash...", "nlp");
            addLog("[CASCADA] Conexión establecida con éxito con gemini-2.0-flash (Tiempo de respuesta: 1.2s)", "success");
          }, 1200);
        }, 1200);
        break;

      case 4: // Personalization
        setActiveModel(null);
        addLog("Iniciando CV Personalizer con respuesta estructurada JSON de Gemini...", "nlp");
        addLog("Mapeando habilidades requeridas vs perfil del candidato...", "nlp");
        addLog("Generando CV personalizado dinámicamente (>600 palabras)...", "nlp");
        
        // Typing effect for CV preview
        let lineIdx = 0;
        let accumulatedText = "";
        const cvInterval = setInterval(() => {
          if (lineIdx < cvLines.length) {
            accumulatedText += cvLines[lineIdx] + "\n";
            setTypedCvPreview(accumulatedText);
            lineIdx++;
          } else {
            clearInterval(cvInterval);
          }
        }, 150);
        break;

      case 5: // Saving & Sending
        addLog("Guardando la candidatura personalizada en el tablero local (CRM)...", "info");
        addLog("[DATABASE] Guardado exitoso en 'server/jobs_db.json' con estado 'Needs Approval'.", "success");
        addLog("Preparando correo de postulación para el reclutador...", "info");
        addLog("[SMTP] Conectando con servidor de correo empresarial...", "info");
        addLog("[SMTP] Enviando correo con CV y Carta de Presentación adaptada adjuntas...", "success");
        addLog("[SMTP] Correo enviado exitosamente a: jobs@remotive-tech.io", "success");
        break;

      case 6: // Completed
        addLog("===================================================", "success");
        addLog("PROCESO DE AUTOPILOT COMPLETADO CON ÉXITO", "success");
        addLog("El candidato ya tiene su postulación lista y registrada.", "success");
        addLog("===================================================", "success");
        break;

      default:
        break;
    }
  };

  return (
    <div className="autopilot-view-wrapper" style={{ flexDirection: 'column', height: '100%', gap: '1.25rem' }}>
      
      {/* Simulation Controls Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={22} className="glow-text animate-pulse" style={{ color: 'var(--color-primary)' }} />
            Simulador de Arquitectura en Tiempo Real
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Visualiza cómo funciona el motor del Autopilot de forma interactiva y cómo maneja errores de red.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isPlaying ? (
            <button onClick={pauseSimulation} className="btn btn-secondary" style={{ borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}>
              <Pause size={16} /> Pausar
            </button>
          ) : (
            <button onClick={startSimulation} className="btn btn-primary" style={{ boxShadow: '0 0 15px rgba(0,242,254,0.3)' }}>
              <Play size={16} /> {currentStep === 6 ? 'Iniciar Nueva' : currentStep === 0 ? 'Iniciar Simulación' : 'Reanudar'}
            </button>
          )}
          <button onClick={resetSimulation} className="btn btn-secondary">
            <RotateCcw size={16} /> Reiniciar
          </button>
        </div>
      </div>

      {/* Main Split View: Diagram vs Terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', flex: 1, minHeight: 0 }}>
        
        {/* Visual Flow Diagram Container */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto', position: 'relative' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={16} /> Diagrama Dinámico de la Plataforma
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, justifyContent: 'space-around', position: 'relative' }}>
            
            {/* Layer 1: Portales */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 2 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Capa 1: Fuentes de Empleo (8 Portales Reales)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {portals.map((portal) => (
                  <div 
                    key={portal.name}
                    className={`glass-card ${activePortal === portal.name ? 'pulse-glow-border active-portal' : ''}`}
                    style={{ 
                      padding: '0.6rem', 
                      textAlign: 'center', 
                      fontSize: '0.75rem', 
                      fontWeight: 500,
                      background: activePortal === portal.name ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      borderColor: activePortal === portal.name ? 'var(--color-primary)' : 'var(--border-glass)',
                      transition: 'all 0.3s ease',
                      boxShadow: activePortal === portal.name ? '0 0 15px rgba(0, 242, 254, 0.2)' : 'none'
                    }}
                  >
                    <Globe size={12} style={{ display: 'block', margin: '0 auto 0.25rem', color: activePortal === portal.name ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                    {portal.name}
                    <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{portal.region}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SVG Connecting Flow Lines Layer 1 -> Layer 2 */}
            <div style={{ position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)', height: '14%', width: '80%', zIndex: 1, pointerEvents: 'none' }}>
              <svg width="100%" height="100%" viewBox="0 0 400 60" fill="none">
                <path d="M 50,0 Q 200,45 350,0" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
                <path d="M 200,0 L 200,60" stroke={currentStep === 1 || currentStep === 2 ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)'} strokeWidth="2.5" fill="none" 
                  strokeDasharray={currentStep === 1 ? "8 4" : "none"} 
                  className={currentStep === 1 ? "flow-line-animate" : ""} 
                  style={{ transition: 'stroke 0.5s' }}
                />
              </svg>
            </div>

            {/* Layer 2: Backend Motor Node.js */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 2, marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Capa 2: Motor Backend Node.js (Servicios IA)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: '0.75rem' }}>
                
                {/* Box 1: Smart Scraper */}
                <div 
                  className="glass-card" 
                  style={{ 
                    padding: '0.75rem', 
                    background: (currentStep === 1 || currentStep === 2) ? 'rgba(0, 242, 254, 0.05)' : 'rgba(255,255,255,0.02)',
                    borderColor: (currentStep === 1 || currentStep === 2) ? 'var(--color-primary)' : 'var(--border-glass)',
                    boxShadow: (currentStep === 1 || currentStep === 2) ? '0 0 10px rgba(0, 242, 254, 0.1)' : 'none',
                    transition: 'all 0.4s'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: (currentStep === 1 || currentStep === 2) ? 'var(--color-primary)' : 'inherit' }}>
                    <Cpu size={14} /> Smart Scraper
                  </div>
                  <ul style={{ fontSize: '0.65rem', color: 'var(--text-muted)', paddingLeft: '0.75rem', marginTop: '0.4rem', lineHeight: 1.4 }}>
                    <li>Async generator</li>
                    <li>Filtro email/spam</li>
                    <li>Deduplicación</li>
                  </ul>
                </div>

                {/* Box 2: Gemini AI Cascade */}
                <div 
                  className="glass-card" 
                  style={{ 
                    padding: '0.75rem', 
                    background: currentStep === 3 ? 'rgba(141, 55, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    borderColor: currentStep === 3 ? 'var(--color-secondary)' : 'var(--border-glass)',
                    boxShadow: currentStep === 3 ? '0 0 15px rgba(141, 55, 255, 0.15)' : 'none',
                    transition: 'all 0.4s'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: currentStep === 3 ? 'var(--color-secondary)' : 'inherit' }}>
                    <Zap size={14} /> Gemini Cascade
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.4rem' }}>
                    {models.map((model) => (
                      <div 
                        key={model.id}
                        style={{ 
                          fontSize: '0.6rem', 
                          padding: '0.15rem 0.3rem', 
                          borderRadius: '3px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: activeModel === model.id 
                            ? (model.status === 'rate-limit' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(141, 55, 255, 0.2)')
                            : 'rgba(255, 255, 255, 0.02)',
                          border: activeModel === model.id
                            ? (model.status === 'rate-limit' ? '1px solid var(--color-danger)' : '1px solid var(--color-secondary)')
                            : '1px solid transparent',
                          color: activeModel === model.id
                            ? (model.status === 'rate-limit' ? 'var(--color-danger)' : '#fff')
                            : 'var(--text-muted)',
                          fontWeight: activeModel === model.id ? 'bold' : 'normal',
                          transition: 'all 0.3s'
                        }}
                      >
                        <span>{model.label}</span>
                        {activeModel === model.id && model.status === 'rate-limit' && <AlertTriangle size={8} className="animate-pulse" />}
                        {activeModel === model.id && model.status === 'success' && <CheckCircle size={8} style={{ color: 'var(--color-success)' }} />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Box 3: CV Personalizer */}
                <div 
                  className="glass-card" 
                  style={{ 
                    padding: '0.75rem', 
                    background: currentStep === 4 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    borderColor: currentStep === 4 ? 'var(--color-success)' : 'var(--border-glass)',
                    boxShadow: currentStep === 4 ? '0 0 10px rgba(16, 185, 129, 0.1)' : 'none',
                    transition: 'all 0.4s'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: currentStep === 4 ? 'var(--color-success)' : 'inherit' }}>
                    <Mail size={14} /> CV Personalizer
                  </div>
                  <ul style={{ fontSize: '0.65rem', color: 'var(--text-muted)', paddingLeft: '0.75rem', marginTop: '0.4rem', lineHeight: 1.4 }}>
                    <li>Personalizado 100%</li>
                    <li>Adaptación dinám.</li>
                    <li>Foco en aptitudes</li>
                  </ul>
                </div>

              </div>
            </div>

            {/* SVG Connecting Flow Lines Layer 2 -> Layer 3 */}
            <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', height: '14%', width: '80%', zIndex: 1, pointerEvents: 'none' }}>
              <svg width="100%" height="100%" viewBox="0 0 400 60" fill="none">
                <path d="M 100,0 L 100,50 Q 100,60 120,60 L 280,60 Q 300,60 300,50 L 300,0" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" fill="none" />
                <path d="M 200,0 L 80,60" stroke={currentStep === 5 ? 'var(--color-success)' : 'rgba(255,255,255,0.08)'} strokeWidth="2.5" fill="none"
                  strokeDasharray={currentStep === 5 ? "8 4" : "none"}
                  className={currentStep === 5 ? "flow-line-animate" : ""}
                  style={{ transition: 'stroke 0.5s' }}
                />
                <path d="M 200,0 L 320,60" stroke={currentStep === 5 ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)'} strokeWidth="2.5" fill="none"
                  strokeDasharray={currentStep === 5 ? "8 4" : "none"}
                  className={currentStep === 5 ? "flow-line-animate" : ""}
                  style={{ transition: 'stroke 0.5s' }}
                />
              </svg>
            </div>

            {/* Layer 3: Destinos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 2 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Capa 3: Destinos y Notificaciones
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                
                {/* Destination 1: Local DB */}
                <div 
                  className="glass-card" 
                  style={{ 
                    padding: '0.75rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    background: currentStep >= 5 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    borderColor: currentStep >= 5 ? 'var(--color-success)' : 'var(--border-glass)',
                    transition: 'all 0.4s'
                  }}
                >
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '4px', 
                    background: currentStep >= 5 ? 'var(--color-success-glow)' : 'rgba(255,255,255,0.02)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: currentStep >= 5 ? 'var(--color-success)' : 'var(--text-muted)'
                  }}>
                    <Database size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Base de Datos Local</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>jobs_db.json (Guardado)</div>
                  </div>
                </div>

                {/* Destination 2: SMTP Email */}
                <div 
                  className="glass-card" 
                  style={{ 
                    padding: '0.75rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    background: currentStep >= 5 ? 'rgba(0, 242, 254, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    borderColor: currentStep >= 5 ? 'var(--color-primary)' : 'var(--border-glass)',
                    transition: 'all 0.4s'
                  }}
                >
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '4px', 
                    background: currentStep >= 5 ? 'var(--color-primary-glow)' : 'rgba(255,255,255,0.02)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: currentStep >= 5 ? 'var(--color-primary)' : 'var(--text-muted)'
                  }}>
                    <Mail size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Servidor SMTP</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Envío de Candidatura</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Console / CV Output Tabbed Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          
          <div className="terminal-console" style={{ height: '100%' }}>
            <div className="terminal-header">
              <div className="terminal-dots">
                <div className="terminal-dot red"></div>
                <div className="terminal-dot yellow"></div>
                <div className="terminal-dot green"></div>
              </div>
              <div className="terminal-title">EMPLEOAUTOPILOT - LIVE FLUX TERMINAL</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>● REC</div>
            </div>

            {/* Split Console: Top half logs, bottom half live CV rewrite preview */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              
              {/* Logs area */}
              <div className="terminal-logs" style={{ flex: 1.2, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                {logs.length === 0 ? (
                  <div style={{ color: '#4c566a', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 'auto' }}>
                    <Terminal size={14} /> Haz clic en "Iniciar Simulación" para arrancar el flujo de datos.
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="log-entry">
                      <span className="log-timestamp">[{log.timestamp}]</span>
                      <span className={`log-content ${log.type}`}>{log.text}</span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>

              {/* Live CV Rewrite Typing view */}
              <div style={{ flex: 1, background: '#020305', padding: '1rem', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px dashed rgba(16, 185, 129, 0.2)', paddingBottom: '0.25rem' }}>
                  <span>[CV PERSONALIZER OUTPUT PREVIEW]</span>
                  {currentStep === 4 && <span className="terminal-cursor"></span>}
                </div>
                {typedCvPreview ? (
                  <pre style={{ whiteSpace: 'pre-wrap', color: '#a3be8c', lineHeight: 1.4, margin: 0 }}>{typedCvPreview}</pre>
                ) : (
                  <div style={{ color: '#3b4252', fontStyle: 'italic', padding: '0.5rem 0' }}>
                    {currentStep < 4 ? "Esperando que se complete el match y la cascada de Gemini..." : "Redactando CV personalizado dinámico..."}
                  </div>
                )}
              </div>
            </div>

            <div className="terminal-footer">
              <div className="terminal-stats">
                Paso: {currentStep}/6 | {currentStep === 0 ? 'En Espera' : currentStep === 6 ? 'Completado' : 'Simulando...'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Frecuencia: <span style={{ color: 'var(--color-primary)' }}>4.5s/step</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
