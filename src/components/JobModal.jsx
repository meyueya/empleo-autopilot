import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, MapPin, DollarSign, ExternalLink, Mail, Send, Award, AlertCircle, FileText, CheckCircle, RefreshCcw } from 'lucide-react';

export default function JobModal({ job, onClose, updateJobStatus, addToast, fetchJobs }) {
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis', 'cv', 'cover', 'sender'
  
  // Editable fields
  const [cvTailored, setCvTailored] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    if (job) {
      setCvTailored(job.cvTailored || '');
      setCoverLetter(job.coverLetter || '');
      dialogRef.current?.showModal();
      setActiveTab('analysis');
      checkSmtpStatus();
    }
  }, [job]);

  // Fallback for light-dismiss on clicking outside dialog content
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClickOutside = (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isDialogContent) {
        handleClose();
      }
    };

    dialog.addEventListener('click', handleClickOutside);
    return () => {
      dialog.removeEventListener('click', handleClickOutside);
    };
  }, [job]);

  const checkSmtpStatus = async () => {
    try {
      const res = await fetch('/api/settings');
      const settings = await res.json();
      setSmtpConfigured(!!(settings.smtpUser && settings.smtpPass && settings.smtpUser !== 'your_email@gmail.com'));
    } catch (e) {
      setSmtpConfigured(false);
    }
  };

  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          cvTailored,
          coverLetter
        })
      });
      if (res.ok) {
        addToast(`Estado cambiado a ${newStatus}`, 'success');
        fetchJobs();
        // Update local object
        job.status = newStatus;
      }
    } catch (err) {
      addToast('Error al actualizar estado', 'error');
    }
  };

  const handleSaveChanges = async () => {
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cvTailored,
          coverLetter
        })
      });
      if (res.ok) {
        addToast('Documentos actualizados en la base de datos', 'success');
        fetchJobs();
      }
    } catch (err) {
      addToast('Error al guardar cambios', 'error');
    }
  };

  const handleSendApplication = async () => {
    if (sendingEmail) return;
    setSendingEmail(true);
    addToast('Enviando candidatura...', 'success');

    try {
      const res = await fetch(`/api/jobs/${job.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          coverLetter,
          cvTailored
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message, 'success');
        
        // If it was simulated, open mailto link automatically in browser!
        if (data.simulated && data.mailtoLink) {
          window.open(data.mailtoLink, '_blank');
        }

        fetchJobs();
        handleClose();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      addToast(err.message || 'Error al enviar candidatura', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleReanalyze = async () => {
    if (reanalyzing) return;
    setReanalyzing(true);
    addToast('Regenerando análisis con Gemini AI...', 'success');
    try {
      const res = await fetch(`/api/jobs/${job.id}/reanalyze`, { method: 'POST' });
      const updated = await res.json();
      if (res.ok) {
        setCvTailored(updated.cvTailored || '');
        setCoverLetter(updated.coverLetter || '');
        job.matchScore = updated.matchScore;
        job.matchAnalysis = updated.matchAnalysis;
        job.cvTailored = updated.cvTailored;
        job.coverLetter = updated.coverLetter;
        fetchJobs();
        addToast('✨ CV y carta regenerados específicamente para esta oferta', 'success');
      } else {
        throw new Error(updated.error);
      }
    } catch (err) {
      addToast(err.message || 'Error al regenerar análisis', 'error');
    } finally {
      setReanalyzing(false);
    }
  };

  if (!job) return null;

  // Visual matching score dash offsets
  const circumference = 2 * Math.PI * 36; // stroke-width is 8, radius is 36
  const strokeDashoffset = circumference - (job.matchScore / 100) * circumference;

  return (
    <dialog ref={dialogRef} onClose={onClose} closedby="any" style={{ overflow: 'visible' }}>
      <div className="modal-content glass-card">
        <div className="modal-header">
          <div>
            <h2 className="gradient-text" style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{job.title}</h2>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              <span>{job.company}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} /> {job.location}</span>
            </div>
          </div>
          <button onClick={handleClose} className="btn-icon-only"><X size={18} /></button>
        </div>

        <div className="tab-container" style={{ padding: '0 1.5rem', background: '#0e1424' }}>
          <button onClick={() => setActiveTab('analysis')} className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}>
            Análisis de Match
          </button>
          <button onClick={() => setActiveTab('cv')} className={`tab-btn ${activeTab === 'cv' ? 'active' : ''}`}>
            CV Adaptado
          </button>
          <button onClick={() => setActiveTab('cover')} className={`tab-btn ${activeTab === 'cover' ? 'active' : ''}`}>
            Carta Redactada
          </button>
          <button onClick={() => setActiveTab('sender')} className={`tab-btn ${activeTab === 'sender' ? 'active' : ''}`}>
            Enviar Candidatura
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'analysis' && (
            <div className="modal-split-view">
              <div className="modal-split-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div className="circle-progress-container">
                    <svg className="circle-progress-svg">
                      <circle className="circle-bg" cx="45" cy="45" r="36" />
                      <circle 
                        className={`circle-fill ${job.matchScore >= 85 ? 'high' : job.matchScore >= 70 ? 'med' : 'low'}`}
                        cx="45" 
                        cy="45" 
                        r="36" 
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <div className="circle-text">
                      {job.matchScore}%
                      <span>Match</span>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Compatibilidad General</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Calculado por NLP analizando la sintonía entre tus habilidades declaradas y los requisitos técnicos de la oferta.
                    </p>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Award size={14} /> Fortalezas de tu Perfil</label>
                  <ul className="bullet-list" style={{ marginTop: '0.25rem' }}>
                    {job.matchAnalysis?.strengths?.map((str, idx) => (
                      <li className="bullet-item" key={idx}>
                        <div className="bullet-dot success"></div>
                        <span>{str}</span>
                      </li>
                    )) || <li>Sin fortalezas mapeadas</li>}
                  </ul>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-warning)' }}><AlertCircle size={14} /> Posibles Brechas / Gaps</label>
                  <ul className="bullet-list" style={{ marginTop: '0.25rem' }}>
                    {job.matchAnalysis?.gaps?.map((gap, idx) => (
                      <li className="bullet-item" key={idx}>
                        <div className="bullet-dot danger"></div>
                        <span>{gap}</span>
                      </li>
                    )) || <li>Sin gaps detectados</li>}
                  </ul>
                </div>

                {job.salary && (
                  <div className="form-group">
                    <label>Ajuste de Salario</label>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', fontSize: '0.85rem' }}>
                      {job.matchAnalysis?.salaryRelevance || `Salario de la oferta: ${job.salary}`}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', height: '360px', paddingRight: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Descripción de la Oferta</h3>
                  {job.url ? (
                    <a href={job.url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.25rem' }}>
                      Ver Original <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '999px', background: 'rgba(139,92,246,0.15)', color: 'var(--color-primary)', border: '1px solid rgba(139,92,246,0.3)', fontWeight: 600, letterSpacing: '0.04em' }}>
                      🤖 Vacante Simulada
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                  {job.description}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cv' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>CV Completo Adaptado a la Oferta (Markdown)</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    onClick={handleReanalyze} 
                    disabled={reanalyzing}
                    className="btn-icon-only" 
                    style={{ background: 'transparent', border: '1px solid var(--border-glass)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'center', color: 'var(--text-main)', cursor: 'pointer' }}
                    title="Regenerar análisis con el nuevo prompt"
                  >
                    <RefreshCcw size={12} className={reanalyzing ? 'spin' : ''} />
                    {reanalyzing ? 'Regenerando...' : 'Regenerar IA'}
                  </button>
                  {job.isSimulated ? (
                    <span title="Generado por el simulador local offline" style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700 }}>
                      ⚙️ Simulador Local
                    </span>
                  ) : (
                    <span title="Generado por Gemini AI en tiempo real" style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700 }}>
                      ✨ Gemini AI Real
                    </span>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Editable · Se envía con la candidatura</span>
                </div>
              </div>
              <textarea 
                className="form-input" 
                rows={20}
                style={{ fontFamily: 'var(--font-sans)', lineHeight: '1.6', fontSize: '0.95rem' }}
                value={cvTailored}
                onChange={(e) => setCvTailored(e.target.value)}
                placeholder="Extracto de CV optimizado..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button onClick={handleSaveChanges} className="btn btn-secondary">Guardar Cambios</button>
              </div>
            </div>
          )}

          {activeTab === 'cover' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Carta de Presentación (Cover Letter) Redactada</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Personalizada con los nombres de la empresa y ajustada al tono del puesto de trabajo.
                </span>
              </div>
              <textarea 
                className="form-input" 
                rows={12}
                style={{ fontFamily: 'var(--font-sans)', lineHeight: '1.6', fontSize: '0.95rem' }}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Escribe o edita la carta de presentación aquí..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button onClick={handleSaveChanges} className="btn btn-secondary">Guardar Cambios</button>
              </div>
            </div>
          )}

          {activeTab === 'sender' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail style={{ color: 'var(--color-primary)' }} /> Canal de Envío de Candidatura
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                <div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Contacto del Reclutador (Destinatario)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={job.recruiterEmail || ''} 
                      onChange={(e) => {
                        job.recruiterEmail = e.target.value;
                      }}
                      placeholder="ejemplo@empresa.com"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Adjuntos Automáticos:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', fontSize: '0.8rem' }}>
                      <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                      <span>CV_Optimizado_${job.company.replace(/\s/g, '')}.pdf (Simulado)</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.75rem', borderLeft: '1px solid var(--border-glass)', paddingLeft: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: smtpConfigured ? 'var(--color-success)' : 'var(--color-warning)' }}></div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {smtpConfigured ? 'Servidor SMTP Conectado' : 'Modo Simulador de Email Activado'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {smtpConfigured 
                      ? 'Los correos se enviarán de forma real utilizando tus credenciales SMTP configuradas en la pestaña Ajustes.'
                      : 'Al no tener SMTP configurado en el panel, se simulará el correo electrónico con éxito y se te ofrecerá un enlace mailto nativo para enviarlo con un clic desde tu cliente de correo personal.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyState: 'flex-end', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button 
                  onClick={handleSendApplication} 
                  disabled={sendingEmail} 
                  className="btn btn-primary" 
                  style={{ width: '100%', height: '48px', fontSize: '1rem' }}
                >
                  <Send size={16} /> {sendingEmail ? 'Enviando candidatura...' : '¡Aprobar y Enviar Candidatura!'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div style={{ marginRight: 'auto', display: 'flex', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginRight: '0.5rem' }}>Estado:</label>
            <select 
              className="form-select" 
              style={{ padding: '0.35rem 1rem', width: 'auto', fontSize: '0.8rem' }}
              value={job.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="Found">Nuevos Matches</option>
              <option value="Needs Approval">Revisión / IA</option>
              <option value="Applied">Postulado</option>
              <option value="Interviewing">En Entrevista</option>
              <option value="Offer">Ofertas / Éxito</option>
            </select>
          </div>
          
          <button onClick={handleClose} className="btn btn-secondary">Cerrar</button>
        </div>
      </div>
    </dialog>
  );
}
