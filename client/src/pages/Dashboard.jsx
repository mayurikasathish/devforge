import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Star, Users, Layers, Zap, ArrowRight, TrendingUp, X, Clock } from 'lucide-react';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function SkillStars({ level }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11}
          className={i <= level ? 'fill-pink text-pink' : 'text-gray-700'}
          style={i <= level ? { filter: 'drop-shadow(0 0 4px rgba(244,114,182,0.6))' } : {}} />
      ))}
    </div>
  );
}

function ProjectModal({ project, onClose, onApply, currentUserId }) {
  if (!project) return null;
  const isOwner = (project.user?._id || project.user) === currentUserId;
  const hasApplied = project.applicants?.some(a => (a._id || a) === currentUserId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-dark p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 pr-3">
              <h2 className="font-display font-bold text-xl text-white">{project.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <img src={project.user?.avatar} alt="" className="w-4 h-4 rounded-full" />
                <span className="text-xs text-gray-500 font-body">{project.user?.name}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-all flex-shrink-0">
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-300 font-body leading-relaxed whitespace-pre-wrap">{project.description}</p>

            {project.techStack?.length > 0 && (
              <div>
                <p className="text-xs font-mono text-gray-500 mb-2">Tech Stack</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.map(t => <span key={t} className="tag text-[10px]">{t}</span>)}
                </div>
              </div>
            )}

            {project.rolesNeeded?.length > 0 && (
              <div>
                <p className="text-xs font-mono text-gray-500 mb-2">Roles Needed</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.rolesNeeded.map(r => (
                    <span key={r} className="text-[10px] px-2 py-0.5 rounded-lg font-mono"
                      style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.25)', color: '#f9a8d4' }}>
                      🔍 {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-600 font-mono">
              <span className="flex items-center gap-1"><Users size={11} /> {project.applicants?.length || 0} applicants</span>
              {project.duration && <span className="flex items-center gap-1"><Clock size={11} /> {project.duration}</span>}
            </div>

            {!isOwner && (
              <button
                onClick={() => { onApply(project._id); onClose(); }}
                disabled={hasApplied}
                className={`w-full py-3 rounded-xl font-body font-medium text-sm transition-all ${hasApplied
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
                  : 'btn-primary'}`}>
                {hasApplied ? 'Already Applied ✓' : 'Apply to Project'}
              </button>
            )}
            {isOwner && (
              <div className="text-center text-xs font-mono text-purple-light py-2">This is your project</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [suggested, setSuggested] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, projectsRes] = await Promise.all([
          api.get('/api/profile/me').catch(() => ({ data: null })),
          api.get('/api/projects').catch(() => ({ data: [] }))
        ]);
        setProfile(profileRes.data);
        setProjects(projectsRes.data.slice(0, 3));
        if (profileRes.data?.skills?.length) {
          const skills = profileRes.data.skills.map(s => s.name).join(',');
          const sugRes = await api.get(`/api/profile/match/${skills}`).catch(() => ({ data: [] }));
          setSuggested(sugRes.data.slice(0, 4));
        } else {
          const allRes = await api.get('/api/profile').catch(() => ({ data: [] }));
          setSuggested(allRes.data.filter(p => p.user._id !== user?._id).slice(0, 4));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const radarData = profile?.skills?.slice(0, 6).map(s => ({
    skill: s.name?.length > 8 ? s.name.slice(0, 8) : s.name,
    value: (s.level || 3) * 20
  })) || [];

  const handleApply = async (id) => {
    try {
      await api.put(`/api/projects/apply/${id}`);
      setProjects(projects.map(p => p._id === id
        ? { ...p, applicants: [...(p.applicants || []), { _id: user?.id }] } : p));
      toast.success('Application sent!');
    } catch { toast.error('Could not apply'); }
  };

  if (loading) return (
    <div className="min-h-screen pt-28 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple rounded-full border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      {/* Project Modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onApply={handleApply}
          currentUserId={user?.id}
        />
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="font-display font-bold text-4xl text-white">
          Hey, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-gray-400 font-body mt-2">Here's what's happening in your forge.</p>
      </motion.div>

      {!profile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-dark p-6 mb-8 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-white mb-1">Complete your profile</h3>
            <p className="text-gray-400 text-sm font-body">Add skills, experience, and GitHub to get matched with collaborators.</p>
          </div>
          <Link to="/edit-profile" className="btn-primary flex items-center gap-2 whitespace-nowrap ml-4">
            Setup Profile <ArrowRight size={14} />
          </Link>
        </motion.div>
      )}

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Skill Radar */}
        <motion.div variants={fadeUp} className="glass-dark p-6 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: '#a855f7' }} />
            <h2 className="font-display font-semibold text-white">Skill Radar</h2>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'DM Sans' }} />
                <Radar dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,12,30,0.95)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, fontSize: 12 }}
                  formatter={v => [`${v / 20}/5`, 'Level']}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-gray-600 text-sm">
              <Zap size={32} className="mb-2 opacity-30" />
              <span>Add skills to see your radar</span>
            </div>
          )}

          {profile?.skills?.length > 0 && (
            <div className="mt-4 space-y-2">
              {profile.skills.slice(0, 5).map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="text-sm font-mono text-gray-300">{s.name}</span>
                  <SkillStars level={s.level || 3} />
                </div>
              ))}
              {profile.skills.length > 5 && (
                <Link to="/profile/me" className="text-xs text-purple-light hover:text-white transition-colors font-mono">
                  +{profile.skills.length - 5} more
                </Link>
              )}
            </div>
          )}
        </motion.div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Suggested Collaborators */}
          <motion.div variants={fadeUp} className="glass-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} style={{ color: '#f472b6' }} />
                <h2 className="font-display font-semibold text-white">Suggested Collaborators</h2>
              </div>
              <Link to="/explore" className="text-xs font-mono text-gray-500 hover:text-purple-light transition-colors flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {suggested.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggested.map(p => (
                  <Link key={p._id} to={`/profile/${p.user._id}`}
                    className="glass p-4 rounded-xl card-hover flex items-center gap-3 group">
                    <img src={p.user.avatar} alt={p.user.name}
                      className="w-10 h-10 rounded-full border border-purple/30 object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-display font-semibold text-white truncate">{p.user.name}</div>
                      <div className="text-xs text-gray-500 font-body truncate">{p.status}</div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {p.skills?.slice(0, 2).map(s => (
                          <span key={s.name} className="tag text-[10px] px-2 py-0.5">{s.name}</span>
                        ))}
                      </div>
                    </div>
                    <div className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${p.availability === 'available' ? 'bg-green-400' : p.availability === 'open_to_collaborate' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-6 font-body">No suggestions yet. Add skills to get matched!</p>
            )}
          </motion.div>

          {/* Open Projects */}
          <motion.div variants={fadeUp} className="glass-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers size={16} style={{ color: '#2dd4bf' }} />
                <h2 className="font-display font-semibold text-white">Open Projects</h2>
              </div>
              <Link to="/projects" className="text-xs font-mono text-gray-500 hover:text-purple-light transition-colors flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map(proj => {
                  const isOwner = (proj.user?._id || proj.user) === user?.id;
                  const hasApplied = proj.applicants?.some(a => (a._id || a) === user?.id);
                  const isLong = proj.description?.length > 120;
                  return (
                    <div key={proj._id} className="glass p-4 rounded-xl card-hover">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-display font-semibold text-white">{proj.title}</h3>
                          <p className="text-xs text-gray-500 font-body mt-0.5 line-clamp-2">{proj.description}</p>
                          {isLong && (
                            <button onClick={() => setSelectedProject(proj)}
                              className="text-xs text-purple-light hover:text-white font-mono mt-1 transition-colors">
                              Read more →
                            </button>
                          )}
                        </div>
                        <span className="tag-aqua text-[10px] px-2 py-0.5 rounded-lg whitespace-nowrap font-mono flex-shrink-0"
                          style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)', color: '#5eead4' }}>
                          {proj.status}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {proj.techStack?.slice(0, 4).map(t => <span key={t} className="tag text-[10px]">{t}</span>)}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-600 font-mono flex items-center gap-1">
                          <Users size={10} /> {proj.applicants?.length || 0} applicants
                        </span>
                        {!isOwner && (
                          <button
                            onClick={() => handleApply(proj._id)}
                            disabled={hasApplied}
                            className={`text-xs px-4 py-1.5 rounded-xl font-body font-medium transition-all ${hasApplied
                              ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
                              : 'btn-primary py-1.5 px-4 text-xs'}`}>
                            {hasApplied ? 'Applied ✓' : 'Apply'}
                          </button>
                        )}
                        {isOwner && (
                          <span className="text-xs font-mono text-purple-light">Your project</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm font-body mb-3">No open projects yet.</p>
                <Link to="/projects" className="btn-primary text-sm py-2">Post a Project</Link>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}