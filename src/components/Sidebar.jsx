import React from 'react';
import { Play, Briefcase, FileText, Settings, Download, Cpu, Trash, Zap } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, autopilotRunning, clearJobsHistory }) {
  const handleDownloadCSV = () => {
    window.open('/api/csv/download', '_blank');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Cpu className="glow-text" style={{ color: 'var(--color-primary)' }} size={28} />
        <span className="gradient-text">EmpleoAutopilot</span>
      </div>

      <nav className="sidebar-menu">
        <button 
          onClick={() => setActiveTab('autopilot')}
          className={`sidebar-btn ${activeTab === 'autopilot' ? 'active' : ''}`}
        >
          <Play size={20} />
          <span>Autopilot Room</span>
        </button>

        <button 
          onClick={() => setActiveTab('pipeline')}
          className={`sidebar-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
        >
          <Briefcase size={20} />
          <span>Pipeline CRM</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <FileText size={20} />
          <span>Mi Perfil y CV</span>
        </button>

        <button 
          onClick={() => setActiveTab('simulation')}
          className={`sidebar-btn ${activeTab === 'simulation' ? 'active' : ''}`}
        >
          <Zap size={20} />
          <span>Simulador de Flujo</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={`sidebar-btn ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <Settings size={20} />
          <span>Ajustes</span>
        </button>
      </nav>

      <div className="sidebar-status">
        <button 
          onClick={handleDownloadCSV}
          className="sidebar-btn" 
          style={{ marginBottom: '1rem', background: 'rgba(0, 242, 254, 0.05)', border: '1px dashed var(--border-glass-glow)' }}
        >
          <Download size={18} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>Descargar Excel/CSV</span>
        </button>

        <button 
          onClick={() => {
            if (window.confirm("¿Estás seguro de que deseas eliminar por completo todas las candidaturas del tablero? Esta acción no se puede deshacer y mantendrá intactos los ajustes de configuración.")) {
              clearJobsHistory();
            }
          }}
          className="sidebar-btn danger" 
          style={{ marginBottom: '1rem' }}
        >
          <Trash size={18} />
          <span style={{ fontSize: '0.85rem' }}>Resetear Tablero</span>
        </button>

        <div className="status-badge">
          <div className={`status-dot ${autopilotRunning ? 'pulsing' : ''}`} style={{ backgroundColor: autopilotRunning ? 'var(--color-primary)' : 'var(--color-success)' }}></div>
          <span>{autopilotRunning ? 'Autopilot: Buscando' : 'Agente Listo'}</span>
        </div>
      </div>
    </aside>
  );
}
