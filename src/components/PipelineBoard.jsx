import React from 'react';
import { Briefcase, Calendar, MapPin, DollarSign, ArrowRight } from 'lucide-react';

const COLUMNS = [
  { id: 'Found', title: 'Nuevos Matches', color: 'var(--color-primary)' },
  { id: 'Needs Approval', title: 'Revisión / IA', color: 'var(--color-secondary)' },
  { id: 'Applied', title: 'Postulados', color: 'var(--color-success)' },
  { id: 'Interviewing', title: 'Entrevistas', color: 'var(--color-warning)' },
  { id: 'Offer', title: 'Ofertas / Éxito', color: '#ff7300' }
];

export default function PipelineBoard({ jobs, setSelectedJob, updateJobStatus }) {
  
  const getJobsByStatus = (statusId) => {
    return jobs.filter(job => job.status === statusId);
  };

  const getScoreColorClass = (score) => {
    if (score >= 85) return 'high';
    if (score >= 70) return 'med';
    return 'low';
  };

  const formatSalary = (salary) => {
    if (!salary || salary === 'No especificado') return 'No especificado';
    return salary;
  };

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="page-header">
        <div className="page-title">
          <h1>Pipeline CRM de Empleo</h1>
          <p>Gestiona el estado de tus candidaturas desde su detección hasta la firma del contrato.</p>
        </div>
      </div>

      <div className="pipeline-container">
        {COLUMNS.map((col) => {
          const colJobs = getJobsByStatus(col.id);
          return (
            <div className="pipeline-column" key={col.id}>
              <div className="pipeline-column-header">
                <div className="pipeline-column-title">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color, boxShadow: `0 0 8px ${col.color}` }}></div>
                  <span>{col.title}</span>
                </div>
                <span className="pipeline-column-count">{colJobs.length}</span>
              </div>

              <div className="pipeline-column-cards">
                {colJobs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '2rem', fontStyle: 'italic' }}>
                    Vacío
                  </div>
                ) : (
                  colJobs.map((job) => (
                    <div 
                      className={`glass-card job-card ${getScoreColorClass(job.matchScore) === 'high' ? 'match-high' : getScoreColorClass(job.matchScore) === 'med' ? 'match-med' : 'match-low'}`}
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                    >
                      <div className="card-header">
                        <div className="card-title">{job.title}</div>
                        <span className={`card-score ${getScoreColorClass(job.matchScore)}`}>
                          {job.matchScore}% Match
                        </span>
                      </div>
                      
                      <div className="card-company">{job.company}</div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <MapPin size={12} />
                          <span>{job.location}</span>
                        </div>
                        {job.salary && job.salary !== 'No especificado' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <DollarSign size={12} />
                            <span>{formatSalary(job.salary)}</span>
                          </div>
                        )}
                      </div>

                      <div className="card-meta">
                        <span className="card-source" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: job.isSimulated === false ? 'var(--color-success)' : 'var(--color-warning)', flexShrink: 0 }}></span>
                          {job.source}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={11} />
                          <span>{formatDate(job.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
