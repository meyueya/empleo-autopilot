import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AutopilotPanel from './components/AutopilotPanel';
import PipelineBoard from './components/PipelineBoard';
import ProfileManager from './components/ProfileManager';
import SettingsPanel from './components/SettingsPanel';
import FlowSimulator from './components/FlowSimulator';
import JobModal from './components/JobModal';
import { Eye, Briefcase, CheckCircle, Mail, HelpCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('autopilot'); // 'autopilot', 'pipeline', 'profile', 'settings'
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      addToast('Error al conectar con la base de datos local', 'error');
    }
  };

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const clearJobsHistory = async () => {
    try {
      const res = await fetch('/api/jobs/clear', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setJobs([]);
        addToast(data.message || 'Historial de candidaturas reseteado con éxito', 'success');
      } else {
        throw new Error(data.error || 'No se pudo vaciar el historial.');
      }
    } catch (err) {
      console.error('Error al limpiar el historial:', err);
      addToast(err.message || 'Error al conectar con el servidor', 'error');
    }
  };

  // Funnel / Stat calculations
  const totalJobs = jobs.length;
  const newMatches = jobs.filter(j => j.status === 'Found').length;
  const pendingReview = jobs.filter(j => j.status === 'Needs Approval').length;
  const appliedCount = jobs.filter(j => j.status === 'Applied').length;
  const interviewsCount = jobs.filter(j => j.status === 'Interviewing').length;

  return (
    <div className="app-shell">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        autopilotRunning={autopilotRunning} 
        clearJobsHistory={clearJobsHistory}
      />

      <main className="main-content">
        {/* Top Funnel Statistics Row */}
        <section className="dashboard-grid">
          <div className="glass-card stat-card primary">
            <div className="stat-icon-wrapper">
              <Eye size={22} />
            </div>
            <div className="stat-info">
              <h3>Matches Nuevos</h3>
              <p>{newMatches}</p>
            </div>
          </div>

          <div className="glass-card stat-card secondary">
            <div className="stat-icon-wrapper">
              <HelpCircle size={22} />
            </div>
            <div className="stat-info">
              <h3>En Revisión</h3>
              <p>{pendingReview}</p>
            </div>
          </div>

          <div className="glass-card stat-card" style={{ borderLeft: '3px solid var(--color-success)' }}>
            <div className="stat-icon-wrapper" style={{ color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.08)' }}>
              <Mail size={22} />
            </div>
            <div className="stat-info">
              <h3>Postulados</h3>
              <p>{appliedCount}</p>
            </div>
          </div>

          <div className="glass-card stat-card" style={{ borderLeft: '3px solid var(--color-warning)' }}>
            <div className="stat-icon-wrapper" style={{ color: 'var(--color-warning)', background: 'rgba(245, 158, 11, 0.08)' }}>
              <Briefcase size={22} />
            </div>
            <div className="stat-info">
              <h3>Entrevistas</h3>
              <p>{interviewsCount}</p>
            </div>
          </div>
        </section>

        {/* Dynamic Routing Main Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {activeTab === 'autopilot' && (
            <AutopilotPanel 
              autopilotRunning={autopilotRunning}
              setAutopilotRunning={setAutopilotRunning}
              addToast={addToast}
              fetchJobs={fetchJobs}
            />
          )}

          {activeTab === 'pipeline' && (
            <PipelineBoard 
              jobs={jobs}
              setSelectedJob={setSelectedJob}
              addToast={addToast}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileManager 
              addToast={addToast}
            />
          )}

          {activeTab === 'simulation' && (
            <FlowSimulator />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel 
              addToast={addToast}
            />
          )}
        </div>
      </main>

      {/* Slide-in Job Inspection Dialog */}
      {selectedJob && (
        <JobModal 
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          addToast={addToast}
          fetchJobs={fetchJobs}
        />
      )}

      {/* Real-time floating toast notifier stack */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div className={`toast ${toast.type}`} key={toast.id}>
            <CheckCircle size={18} style={{ color: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }} />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
