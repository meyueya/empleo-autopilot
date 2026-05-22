import React, { useState, useEffect } from 'react';
import { Save, User, Mail, Phone, MapPin, Briefcase, Plus, X } from 'lucide-react';

export default function ProfileManager({ addToast }) {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    title: 'Senior Full Stack Developer / Project Leader',
    skills: ["Java", "Angular", "Spring Boot", "Scrum", "REST APIs", "GDPR"],
    cvText: '',
    targetKeywords: ["Tech Lead", "Project Leader", "Senior Full Stack Developer", "Engineering Manager"],
    targetLocation: 'Remote',
    minSalary: 35000
  });

  const [newSkill, setNewSkill] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      addToast('Error al cargar el perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        addToast('Perfil guardado con éxito', 'success');
      } else {
        throw new Error();
      }
    } catch (err) {
      addToast('Error al guardar el perfil', 'error');
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !profile.targetKeywords.includes(newKeyword.trim())) {
      setProfile({ ...profile, targetKeywords: [...profile.targetKeywords, newKeyword.trim()] });
      setNewKeyword('');
    }
  };

  const removeKeyword = (kw) => {
    setProfile({ ...profile, targetKeywords: profile.targetKeywords.filter(k => k !== kw) });
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Cargando perfil...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
      <div className="page-header">
        <div className="page-title">
          <h1>Mi Perfil de Candidato</h1>
          <p>Define tus datos básicos, tu currículum base y tus preferencias de búsqueda.</p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignState: 'center', gap: '0.5rem' }}>
            <User size={20} style={{ color: 'var(--color-primary)' }} /> Datos Profesionales
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Nombre Completo</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Título Profesional</label>
              <input 
                type="text" 
                className="form-input" 
                value={profile.title}
                placeholder="Ej. Senior Full Stack Developer / Project Leader"
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Correo de Contacto</label>
              <input 
                type="email" 
                className="form-input" 
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input 
                type="text" 
                className="form-input" 
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Ubicación / Residencia</label>
            <input 
              type="text" 
              className="form-input" 
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Currículum en Texto (CV Base para la IA)</label>
            <textarea 
              className="form-input" 
              rows={8}
              style={{ resize: 'vertical' }}
              value={profile.cvText}
              onChange={(e) => setProfile({ ...profile, cvText: e.target.value })}
              required
              placeholder="Pega aquí todo el texto de tu currículum vitae. Gemini lo utilizará como contexto principal para adaptar tus habilidades a las ofertas de empleo encontradas."
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignState: 'center', gap: '0.5rem' }}>
              <Briefcase size={20} style={{ color: 'var(--color-secondary)' }} /> Preferencias del Autopilot
            </h2>

            <div className="form-group">
              <label>Palabras Clave de Búsqueda (Puestos)</label>
              <div className="tags-input-container">
                {profile.targetKeywords.map((kw) => (
                  <span className="tag-badge" key={kw} style={{ background: 'var(--color-secondary-glow)', color: 'var(--color-secondary)', borderColor: 'rgba(141, 55, 255, 0.2)' }}>
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)}><X size={12} /></button>
                  </span>
                ))}
                <input 
                  type="text" 
                  className="tags-input" 
                  placeholder="Escribe y pulsa +" 
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <button type="button" onClick={addKeyword} className="btn-icon-only" style={{ width: '28px', height: '28px' }}><Plus size={14} /></button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Salario Mínimo Anual (€)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={profile.minSalary}
                  onChange={(e) => setProfile({ ...profile, minSalary: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label>Preferencia Geográfica</label>
                <select 
                  className="form-select"
                  value={profile.targetLocation}
                  onChange={(e) => setProfile({ ...profile, targetLocation: e.target.value })}
                >
                  <option value="Remote">100% Remoto</option>
                  <option value="Hybrid">Híbrido</option>
                  <option value="Onsite">Presencial</option>
                  <option value="All">Cualquiera</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 className="panel-title">Habilidades Técnicas / Core</h2>
            <div className="form-group">
              <label>Listado de Skills (Para emparejamiento NLP)</label>
              <div className="tags-input-container">
                {profile.skills.map((skill) => (
                  <span className="tag-badge" key={skill}>
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}><X size={12} /></button>
                  </span>
                ))}
                <input 
                  type="text" 
                  className="tags-input" 
                  placeholder="Nueva skill..." 
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button type="button" onClick={addSkill} className="btn-icon-only" style={{ width: '28px', height: '28px' }}><Plus size={14} /></button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <Save size={18} /> Guardar Perfil Completo
          </button>
        </div>
      </form>
    </div>
  );
}
