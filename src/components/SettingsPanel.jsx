import React, { useState, useEffect } from 'react';
import { Save, Settings, Key, Mail, AlertTriangle, Send, Smartphone, Table, Globe } from 'lucide-react';

export default function SettingsPanel({ addToast }) {
  const [settings, setSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    pushoverUserKey: '',
    pushoverToken: '',
    googleSheetId: '',
    autopilotInterval: 24,
    autoApprove: false,
    geminiApiKey: '',
    // Nuevos portales europeos
    joobleApiKey: '',
    adzunaAppId: '',
    adzunaAppKey: ''
  });

  const [loading, setLoading] = useState(true);
  const [testingPush, setTestingPush] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
      addToast('Error al cargar ajustes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        addToast('Ajustes guardados con éxito', 'success');
      } else {
        throw new Error();
      }
    } catch (err) {
      addToast('Error al guardar ajustes', 'error');
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      const res = await fetch('/api/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message, 'success');
      } else {
        addToast(data.error || 'Error al enviar notificación de prueba', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error de red al conectar con el servidor', 'error');
    } finally {
      setTestingPush(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Cargando ajustes...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
      <div className="page-header">
        <div className="page-title">
          <h1>Configuración e Integraciones</h1>
          <p>Enlaza tus API de Inteligencia Artificial, servidores de correo y notificaciones automáticas.</p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key style={{ color: 'var(--color-primary)' }} size={20} /> Inteligencia Artificial
          </h2>
          
          <div className="form-group">
            <label>Google Gemini API Key (Opcional)</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="AIzaSy..."
              value={settings.geminiApiKey}
              onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Consigue una clave API gratuita en <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>Google AI Studio</a> para activar la comparación de vacantes real en español mediante NLP y adaptar tu CV a cada oferta. Si se deja en blanco, la app operará con un motor simulador local de alta fidelidad.
            </span>
          </div>

          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <Mail style={{ color: 'var(--color-secondary)' }} size={20} /> Correo SMTP (Gmail / Outlook)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Configura tus credenciales para enviar las solicitudes directamente al reclutador desde el panel.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Host SMTP</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="smtp.gmail.com"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Puerto</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="587"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Usuario SMTP / Email de Envío</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="tu.correo@gmail.com"
              value={settings.smtpUser}
              onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Contraseña SMTP / Contraseña de Aplicación</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••••••••••"
              value={settings.smtpPass}
              onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              <strong>Importante para Gmail:</strong> Si usas verificación en dos pasos, debes generar una <strong>Contraseña de Aplicación</strong> en la configuración de seguridad de tu cuenta Google para conectarte de forma segura.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone style={{ color: 'var(--color-success)' }} size={20} /> Notificaciones Móviles (Pushover)
            </h2>
            <div className="form-group">
              <label>Pushover User Key</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="u1234567890abcdefghijklmnopqrst..."
                value={settings.pushoverUserKey || ''}
                onChange={(e) => setSettings({ ...settings, pushoverUserKey: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Pushover API Token</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="a1234567890abcdefghijklmnopqrst..."
                value={settings.pushoverToken || ''}
                onChange={(e) => setSettings({ ...settings, pushoverToken: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block', lineHeight: '1.4' }}>
                Envía notificaciones push nativas al instante a tu iPhone cada vez que el Autopilot descubra un puesto compatible con match alto (&gt;= 85%).
              </span>
            </div>
            
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestPush}
              disabled={testingPush}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                border: '1px dashed var(--color-success)',
                background: 'rgba(16, 185, 129, 0.05)',
                color: 'var(--color-success)',
                marginTop: '0.25rem'
              }}
            >
              <Send size={16} />
              {testingPush ? 'Enviando prueba...' : 'Probar Notificación iPhone'}
            </button>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Table style={{ color: 'var(--color-warning)' }} size={20} /> Base de Datos (Google Sheets / Airtable)
            </h2>
            <div className="form-group">
              <label>Google Sheet ID (Opcional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                value={settings.googleSheetId}
                onChange={(e) => setSettings({ ...settings, googleSheetId: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Conéctate con Google Sheets. Los datos se guardan en el archivo de copia de seguridad local (Excel/CSV) de forma nativa.
              </span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid rgba(99, 179, 237, 0.25)' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe style={{ color: '#63B3ED' }} size={20} /> Portales Europa/España (Opcionales)
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5', background: 'rgba(99,179,237,0.07)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #63B3ED' }}>
              🇪🇸 Amplía la búsqueda a los mejores portales europeos. <strong>5 portales ya funcionan sin key</strong> (Remotive, Arbeitnow, Jobicy, WeWorkRemotely, Tecnoempleo). Añade estas keys opcionales para maximizar resultados.
            </p>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                🌍 Jooble API Key
                <a href="https://jooble.org/api/about" target="_blank" rel="noreferrer" 
                   style={{ fontSize: '0.7rem', color: '#63B3ED', background: 'rgba(99,179,237,0.1)', padding: '2px 6px', borderRadius: '4px', textDecoration: 'none' }}
                >Obtener GRATIS →</a>
              </label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Tu Jooble API Key (registro gratuito)"
                value={settings.joobleApiKey || ''}
                onChange={(e) => setSettings({ ...settings, joobleApiKey: e.target.value })}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Jooble agrega millones de empleos en <strong>España, toda Europa y mundial</strong>. Ideal para búsqueda por ciudad y país.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  🇬🇧🇩🇪 Adzuna App ID
                  <a href="https://developer.adzuna.com" target="_blank" rel="noreferrer"
                     style={{ fontSize: '0.7rem', color: '#63B3ED', background: 'rgba(99,179,237,0.1)', padding: '2px 6px', borderRadius: '4px', textDecoration: 'none' }}
                  >Registro gratis →</a>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="App ID"
                  value={settings.adzunaAppId || ''}
                  onChange={(e) => setSettings({ ...settings, adzunaAppId: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Adzuna App Key</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="App Key"
                  value={settings.adzunaAppKey || ''}
                  onChange={(e) => setSettings({ ...settings, adzunaAppKey: e.target.value })}
                />
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '-0.5rem' }}>
              Adzuna cubre <strong>UK, Alemania, Francia, Países Bajos, Austria y Polonia</strong> con millones de vacantes activas.
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 className="panel-title">Políticas del Agente</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input 
                type="checkbox" 
                id="autoApprove" 
                checked={settings.autoApprove}
                onChange={(e) => setSettings({ ...settings, autoApprove: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
              />
              <label htmlFor="autoApprove" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                Aprobar postulaciones automáticamente
              </label>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
              * Si se marca, el agente preparará los correos y los enviará de forma autónoma sin pedir confirmación. (No recomendado para comenzar).
            </p>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <Save size={18} /> Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  );
}
