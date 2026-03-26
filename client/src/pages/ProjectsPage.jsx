import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, X, Layers, Users, Clock, Zap, Search } from 'lucide-react';

const TECH_OPTIONS = ['React','Node.js','Python','MongoDB','PostgreSQL','TypeScript','Next.js','GraphQL','Docker','AWS','Flutter','Django','FastAPI','Redis','Prisma'];

function ProjectCard({ project, onApply, currentUserId }) {
  const hasApplied = project.applicants?.some(a => (a._id || a) === currentUserId);
  const isOwner = (project.user._id || project.user) === currentUserId;
  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="glass-dark p-5 card-hover flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-white text-base truncate">{project.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <img src={project.user?.avatar} alt="" className="w-4 h-4 rounded-full" />
            <span className="text-xs text-gray-500 font-body">{project.user?.name}</span>
          </div>
        </div>
        <span className="tag-aqua text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-mono flex-shrink-0"
          style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)', color: '#5eead4' }}>
          {project.status}
        </span>
      </div>

      <p className="text-sm text-gray-400 font-body leading-relaxed line-clamp-2">{project.description}</p>

      {project.techStack?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.techStack.map(t => <span key={t} className="tag text-[10px]">{t}</span>)}
        </div>
      )}

      {project.rolesNeeded?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.rolesNeeded.map(r => (
            <span key={r} className="tag-pink text-[10px] px-2 py-0.5 rounded-full font-mono"
              style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.25)', color: '#f9a8d4' }}>
              🔍 {r}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-3 text-xs text-gray-600 font-mono">
          <span className="flex items-center gap-1"><Users size={11} /> {project.applicants?.length || 0} applicants</span>
          {project.duration && <span className="flex items-center gap-1"><Clock size={11} /> {project.duration}</span>}
        </div>
        {!isOwner && (
          <button onClick={() => onApply(project._id)} disabled={hasApplied}
            className={`text-xs px-4 py-1.5 rounded-xl font-body font-medium transition-all ${hasApplied
              ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
              : 'btn-primary py-1.5 px-4 text-xs'}`}>
            {hasApplied ? 'Applied ✓' : 'Apply'}
          </button>
        )}
        {isOwner && <span className="text-xs font-mono text-purple-light">Your project</span>}
      </div>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', description: '', techStack: [], rolesNeeded: [], duration: '' });
  const [techInput, setTechInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, sugRes] = await Promise.all([
          api.get('/api/projects'),
          api.get('/api/projects/suggest/me').catch(() => ({ data: [] }))
        ]);
        setProjects(projRes.data);
        setSuggested(sugRes.data);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleApply = async (id) => {
    try {
      await api.put(`/api/projects/apply/${id}`);
      setProjects(projects.map(p => p._id === id
        ? { ...p, applicants: [...(p.applicants || []), { _id: user?.id }] } : p));
      toast.success('Application sent!');
    } catch { toast.error('Could not apply'); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/api/projects', form);
      setProjects([res.data, ...projects]);
      setShowForm(false);
      setForm({ title: '', description: '', techStack: [], rolesNeeded: [], duration: '' });
      toast.success('Project posted!');
    } catch { toast.error('Failed to post project'); }
    finally { setSubmitting(false); }
  };

  const addTech = t => { if (t && !form.techStack.includes(t)) setForm({ ...form, techStack: [...form.techStack, t] }); setTechInput(''); };
  const addRole = r => { if (r && !form.rolesNeeded.includes(r)) setForm({ ...form, rolesNeeded: [...form.rolesNeeded, r] }); setRoleInput(''); };

  const filtered = projects.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.techStack?.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
    p.rolesNeeded?.some(r => r.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-4xl text-white mb-1">
            Project <span className="gradient-text">Matchmaking</span>
          </h1>
          <p className="text-gray-400 font-body">Find collaborators or post your project</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Post Project'}
        </button>
      </motion.div>

      {/* Post Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
            <form onSubmit={handleSubmit} className="glass-dark p-6 space-y-4">
              <h2 className="font-display font-semibold text-white mb-2">Post a New Project</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Project Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="input-glass" placeholder="e.g. Build a real-time chat app" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Description *</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="input-glass resize-none w-full" rows={3} placeholder="What are you building? What's the goal?" required />
                </div>
                <div>
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Tech Stack</label>
                  <div className="flex gap-2 mb-2">
                    <input value={techInput} onChange={e => setTechInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech(techInput))}
                      className="input-glass flex-1 text-sm" placeholder="Add tech..." />
                    <button type="button" onClick={() => addTech(techInput)} className="btn-ghost py-2 px-3 text-sm">+</button>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {TECH_OPTIONS.slice(0, 8).map(t => (
                      <button type="button" key={t} onClick={() => addTech(t)}
                        className={`tag text-[10px] cursor-pointer transition-all ${form.techStack.includes(t) ? 'bg-purple/30 border-purple/60' : ''}`}>{t}</button>
                    ))}
                  </div>
                  <div className="flex gap-1 flex-wrap mt-2">
                    {form.techStack.map(t => (
                      <span key={t} className="flex items-center gap-1 tag">
                        {t}
                        <button type="button" onClick={() => setForm({ ...form, techStack: form.techStack.filter(x => x !== t) })}
                          className="hover:text-red-400"><X size={9} /></button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Roles Needed</label>
                  <div className="flex gap-2 mb-2">
                    <input value={roleInput} onChange={e => setRoleInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRole(roleInput))}
                      className="input-glass flex-1 text-sm" placeholder="e.g. Backend Dev" />
                    <button type="button" onClick={() => addRole(roleInput)} className="btn-ghost py-2 px-3 text-sm">+</button>
                  </div>
                  {['Frontend Dev','Backend Dev','UI/UX Designer','ML Engineer','DevOps'].map(r => (
                    <button type="button" key={r} onClick={() => addRole(r)}
                      className={`tag-pink text-[10px] mr-1 mb-1 cursor-pointer inline-block rounded-full px-2 py-0.5 font-mono transition-all ${form.rolesNeeded.includes(r) ? 'opacity-50' : ''}`}
                      style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.25)', color: '#f9a8d4' }}>
                      {r}
                    </button>
                  ))}
                  <div className="flex gap-1 flex-wrap mt-2">
                    {form.rolesNeeded.map(r => (
                      <span key={r} className="flex items-center gap-1 tag-pink text-[10px] px-2 py-0.5 rounded-full font-mono"
                        style={{ background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.3)', color: '#f9a8d4' }}>
                        {r}
                        <button type="button" onClick={() => setForm({ ...form, rolesNeeded: form.rolesNeeded.filter(x => x !== r) })}
                          className="hover:text-red-300"><X size={9} /></button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Duration</label>
                  <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                    className="input-glass" placeholder="e.g. 2 weeks, 1 month" />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Layers size={14} />}
                Post Project
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested for you */}
      {suggested.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} style={{ color: '#f472b6' }} />
            <h2 className="font-display font-semibold text-white text-sm">Matched for your skills</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggested.map(p => <ProjectCard key={p._id} project={p} onApply={handleApply} currentUserId={user?.id} />)}
          </div>
        </motion.div>
      )}

      {/* All Projects */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display font-semibold text-white flex items-center gap-2">
            <Layers size={15} style={{ color: '#2dd4bf' }} /> All Open Projects
          </h2>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input-glass pl-9 py-2 text-sm w-52" placeholder="Filter projects..." />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-purple rounded-full border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500 font-body">
            {projects.length === 0 ? 'No projects yet. Be the first to post one!' : 'No projects match your search.'}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => <ProjectCard key={p._id} project={p} onApply={handleApply} currentUserId={user?.id} />)}
          </motion.div>
        )}
      </div>
    </div>
  );
}
