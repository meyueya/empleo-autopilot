import React, { useState, useEffect, useRef } from 'react';
import { Play, Clipboard, Trash2, Globe, Cpu, AlertCircle, Link } from 'lucide-react';

export default function AutopilotPanel({ autopilotRunning, setAutopilotRunning, addToast, fetchJobs }) {
  const [logs, setLogs] = useState([]);
  const [manualUrl, setManualUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const terminalEndRef = useRef(null);
  const sseRef = useRef(null);

  // Stats derived from logs
  const [scrapedCount, setScrapedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);

  useEffect(() => {
    // Check initial status
    fetchStatus();

    // Setup active log connection immediately to catch any background worker logs
    connectSSE();

    return () => {
      disconnectSSE();
    };
  }, []);

  useEffect(() => {
    // Auto scroll terminal
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/autopilot/status');
      const data = await res.json();
      setAutopilotRunning(data.isRunning);
      if (data.logs && data.logs.length > 0) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Error fetching status:", err);
    }
  };

  const connectSSE = () => {
    disconnectSSE(); // Ensure single active connection

    console.log("Connecting Server-Sent Events stream for logs...");
    const sse = new EventSource('/api/autopilot/logs');
    sseRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        
        // Append log to list
        setLogs(prev => {
          // Avoid duplicate logs if they are sent in bulk re-connection
          if (prev.some(p => p.id === log.id)) return prev;
          return [...prev, log];
        });

        // Tally statistics
        if (log.status === 'scrape') {
          setScrapedCount(c => c + 1);
        } else if (log.status === 'success') {
          setSuccessCount(c => c + 1);
        }

        // Check if autopilot finished or changed state
        if (log.message.includes('finalizado') || log.message.includes('apagado')) {
          setAutopilotRunning(false);
          fetchJobs();
        }
      } catch (err) {
        console.error("Error parsing log payload:", err);
      }
    };

    sse.onerror = (err) => {
      console.warn("SSE connection encountered an error, reconnecting automatically...", err);
    };
  };

  const disconnectSSE = () => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  };

  const handleStartAutopilot = async () => {
    if (autopilotRunning) return;
    
    setLogs([]);
    setScrapedCount(0);
    setSuccessCount(0);
    setAutopilotRunning(true);

    try {
      const res = await fetch('/api/autopilot/start', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('Piloto Automático Iniciado', 'success');
        // Force reconnect SSE
        connectSSE();
      } else {
        setAutopilotRunning(false);
        addToast(data.message || 'Error al iniciar Autopilot', 'error');
      }
    } catch (err) {
      setAutopilotRunning(false);
      addToast('Error al conectar con el servidor', 'error');
    }
  };

  const handleManualImport = async (e) => {
    e.preventDefault();
    if (!manualUrl.trim() || importing) return;

    setImporting(true);
    addToast('Extrayendo vacante con IA...', 'success');

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: manualUrl.trim() })
      });
      
      if (res.ok) {
        const enrichedJob = await res.json();
        addToast(`Importado con éxito (${enrichedJob.matchScore}% Match)`, 'success');
        setManualUrl('');
        fetchJobs();
      } else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (err) {
      addToast(err.message || 'Error al importar empleo por URL', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/autopilot/clear-logs', { method: 'POST' });
      setLogs([]);
      setScrapedCount(0);
      setSuccessCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="autopilot-view-wrapper animate-fade-in">
      <div className="control-panel glass-card">
        <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu style={{ color: 'var(--color-primary)' }} /> Centro de Control de Autopilot
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          El módulo busca vacantes reales en <strong>9 portales de empleo</strong> (España + Europa + mundial). Cada portal aporta fuentes distintas: empleos IT en España, remotos europeos, agregadores con millones de ofertas. Las URLs de LinkedIn o Indeed se pueden importar manualmente abajo.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
          {[
            { name: 'Remotive', flag: '🌐', desc: 'Remote Tech' },
            { name: 'Arbeitnow', flag: '🇪🇺', desc: 'Europa' },
            { name: 'Jobicy', flag: '🌍', desc: 'EMEA/España' },
            { name: 'We Work Remotely', flag: '🌐', desc: 'Remote Global' },
            { name: 'RemoteOK', flag: '🔍', desc: 'Tech Remote' },
            { name: 'The Muse', flag: '✨', desc: 'Startups EU' },
            { name: 'Jooble', flag: '🇪🇸', desc: 'Agrega España' },
            { name: 'Adzuna', flag: '🇬🇧🇩🇪', desc: 'UK+Europa' },
            { name: '+InfoJobs/LinkedIn', flag: '🔗', desc: 'Import manual' },
          ].map(p => (
            <div key={p.name} style={{ padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-glass)', fontSize: '0.72rem' }}>
              <span>{p.flag}</span> <strong style={{ color: 'var(--text-main)' }}>{p.name}</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{p.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
          <button 
            onClick={handleStartAutopilot}
            disabled={autopilotRunning}
            className="btn btn-primary"
            style={{ width: '100%', height: '52px', fontSize: '1.05rem', opacity: autopilotRunning ? 0.7 : 1 }}
          >
            <Play size={20} fill="currentColor" /> 
            {autopilotRunning ? 'Buscando en 9 portales...' : 'Lanzar Autopilot (9 Portales España + Europa)'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Páginas Escaneadas: <strong style={{ color: '#fff' }}>{scrapedCount}</strong></span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Matches Encontrados: <strong style={{ color: 'var(--color-success)' }}>{successCount}</strong></span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
          <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <Globe style={{ color: 'var(--color-secondary)' }} size={18} /> Extracción Rápida de URL
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            ¿Has encontrado un puesto tú mismo? Pega el enlace directo de LinkedIn, Indeed o cualquier web pública de empleo. El agente ingresará, extraerá la información y redactará la propuesta al instante.
          </p>

          <form onSubmit={handleManualImport} style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                type="url" 
                className="form-input" 
                placeholder="https://www.linkedin.com/jobs/view/..."
                value={manualUrl}
                disabled={importing}
                onChange={(e) => setManualUrl(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <Link size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            <button type="submit" className="btn btn-secondary" disabled={importing} style={{ flexShrink: 0 }}>
              {importing ? 'Scraping...' : 'Analizar con IA'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'var(--color-primary-glow)', border: '1px solid rgba(0, 242, 254, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', marginTop: 'auto' }}>
          <AlertCircle size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
            <strong>Human-in-the-Loop activado:</strong> Ningún correo será enviado de forma automática. Siempre podrás revisar el CV optimizado y la carta redactada antes de presionar el botón de enviar.
          </div>
        </div>
      </div>

      <div className="terminal-console">
        <div className="terminal-header">
          <div className="terminal-dots">
            <div className="terminal-dot red"></div>
            <div className="terminal-dot yellow"></div>
            <div className="terminal-dot green"></div>
          </div>
          <span className="terminal-title">autopilot_agent@empleo-node:~</span>
          <button onClick={handleClearLogs} className="btn-icon-only" style={{ width: '28px', height: '28px', border: 'none' }} title="Limpiar logs">
            <Trash2 size={13} />
          </button>
        </div>

        <div className="terminal-logs">
          {logs.length === 0 ? (
            <div style={{ color: '#5e677a', fontStyle: 'italic', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
              Consola lista. Haz clic en "Lanzar Autopilot" para visualizar el agente en tiempo real.
            </div>
          ) : (
            logs.map((log) => (
              <div className="log-entry" key={log.id}>
                <span className="log-timestamp">[{formatTime(log.timestamp)}]</span>
                <span className={`log-content ${log.status}`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          {autopilotRunning && (
            <div className="log-entry">
              <span className="log-timestamp">[{formatTime(new Date().toISOString())}]</span>
              <span className="log-content info">
                Navegando y extrayendo datos...<span className="terminal-cursor"></span>
              </span>
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>

        <div className="terminal-footer">
          <span className="terminal-stats">
            Status: {autopilotRunning ? 'ACTIVE' : 'IDLE'} | Connections: 1
          </span>
          <span className="terminal-stats" style={{ color: 'var(--color-primary)' }}>
            EmpleoAutopilot v2.0 | 9 Portales Activos 🇪🇸🇪🇺🌍
          </span>
        </div>
      </div>
    </div>
  );
}
