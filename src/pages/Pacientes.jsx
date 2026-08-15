import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Search, ChevronRight, Phone, Mail } from 'lucide-react';
import Layout from '../components/Layout';
import { sql } from '../lib/db';

export default function Pacientes({ user }) {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPacientes() {
      try {
        setLoading(true);
        let nutId = user?.id;
        if (!nutId && user?.email) {
          const res = await sql`SELECT id FROM nutricionistas WHERE email = ${user.email} LIMIT 1`;
          if (res.length > 0) nutId = res[0].id;
        }

        if (nutId) {
          const list = await sql`
            SELECT id, nome, email, whatsapp, objetivo_texto, created_at 
            FROM pacientes 
            WHERE nutricionista_id = ${nutId} 
            ORDER BY nome ASC
          `;
          setPacientes(list || []);
        }
      } catch (err) {
        console.error('Erro ao buscar pacientes:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPacientes();
  }, [user]);

  const filteredPacientes = pacientes.filter(p => 
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.whatsapp?.includes(searchTerm)
  );

  return (
    <Layout user={user}>
      <div className="dashboard-content">
        <div className="dashboard-topbar">
          <div>
            <span className="current-date-badge">Gestão de Pacientes</span>
            <h1 className="dashboard-greeting">Meus Pacientes</h1>
            <p className="dashboard-subtext">
              Consulte e gerencie o histórico e prontuário de cada paciente.
            </p>
          </div>
        </div>

        <div className="stat-card" style={{ marginTop: '1.5rem' }}>
          <div className="search-filter-bar">
            <div className="search-input-wrapper">
              <Search size={18} color="#6c757d" />
              <input 
                type="text" 
                placeholder="Buscar por nome, email ou whatsapp..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            {loading ? (
              <div className="skeleton-list">
                <div className="skeleton skeleton-row"></div>
                <div className="skeleton skeleton-row"></div>
                <div className="skeleton skeleton-row"></div>
              </div>
            ) : filteredPacientes.length === 0 ? (
              <div className="empty-state-container">
                <div className="empty-state-icon">
                  <Users size={36} color="#00b4d8" />
                </div>
                <h4 className="empty-state-title">
                  {searchTerm ? 'Nenhum paciente encontrado para esta busca' : 'Nenhum paciente cadastrado'}
                </h4>
                <p className="empty-state-subtitle">
                  {searchTerm ? 'Tente buscar por outro termo.' : 'Cadastre seus pacientes para acompanhar as consultas e planos alimentares.'}
                </p>
              </div>
            ) : (
              <div className="patients-no-return-list">
                {filteredPacientes.map((paciente) => (
                  <div 
                    key={paciente.id} 
                    className="patient-return-item"
                    onClick={() => navigate(`/pacientes/${paciente.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="patient-avatar-mini">
                      {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : 'P'}
                    </div>
                    
                    <div className="patient-info-main">
                      <span className="patient-name">{paciente.nome}</span>
                      <div className="patient-meta">
                        {paciente.whatsapp && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} /> {paciente.whatsapp}
                          </span>
                        )}
                        {paciente.email && (
                          <>
                            <span className="meta-bullet">•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={12} /> {paciente.email}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="patient-action-btn">
                      <span>Ver perfil</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
