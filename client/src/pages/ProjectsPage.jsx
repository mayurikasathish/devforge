import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, X, Layers, Users, Clock, Search, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';
import ApplyModal   from '../components/ui/ApplyModal';

const TECH_OPTIONS = ['React','Node.js','Python','MongoDB','PostgreSQL','TypeScript','Next.js','GraphQL','Docker','AWS','Flutter','Django','FastAPI','Redis','Prisma'];

const STATUS_STYLES = {
  open:        { bg: 'rgba(45,212,191,0.1)',  border: '1px solid rgba(45,212,191,0.25)',  color: '#5eead4', label: 'Open' },
  in_progress: { bg: 'rgba(168,85,247,0.1)',  border: '1px solid rgba(168,85,247,0.25)', color: '#c084fc', label: 'In Progress' },
  completed:   { bg: 'rgba(74,222,128,0.1)',  border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80', label: 'Completed' },
};

// FIX: normalise both sides to string for reliable comparison
function userIdStr(id) {
  return (id?._id || id)?.toString() || '';
}

function ProjectCard({ project, onApply, onDelete, onEdit, onStatusUpdate, currentUserId }) {
  const hasApplied = project.applicants?.some(a => userIdStr(a) === currentUserId);
  const isAccepted = project.members?.some(m => userIdStr(m) === currentUserId);
  const isOwner    = userIdStr(project.user) === currentUserId;
  const style      = STATUS_STYLES[project.status] || STATUS_STYLES.open;

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="glass-dark p-5 card-hover flex flex-col gap-3">

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-white text-base truncate">{project.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            {project.user?.avatar && <img src={project.user.avatar} alt="" className="w-4 h-4 rounded-full" />}
            <span className="text-xs text-gray-500 font-body">{project.user?.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded-lg whitespace-nowrap font-mono"
            style={{ background: style.bg, border: style.border, color: style.color }}>
            {style.label}
          </span>
          {isOwner && (
            <>
              <button onClick={() => onEdit(project)}
                className="p-1.5 rounded-lg text-gray-600 hover:text-purple-light hover:bg-purple/10 transition-all">
                <Edit2 size={13} />
              </button>
              <button onClick={() => onDelete(project._id)}
                className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
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
            <span key={r} className="text-[10px] px-2 py-0.5 rounded-lg font-mono"
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

        {isOwner ? (
          <select value={project.status} onChange={e => onStatusUpdate(project._id, e.target.value)}
            className="text-xs font-mono bg-transparent border border-purple/30 text-purple-light rounded-lg px-2 py-1 cursor-pointer outline-none">
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        ) : isAccepted ? (
          <span className="flex items-center gap-1.5 text-xs font-body text-purple-400 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <CheckCircle2 size={12} /> Accepted
          </span>
        ) : hasApplied ? (
          <span className="flex items-center gap-1.5 text-xs font-body text-green-400 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <CheckCircle2 size={12} /> Applied
          </span>
        ) : (
          <button onClick={() => onApply(project)}
            className="btn-primary text-xs py-1.5 px-4">
            Apply
          </button>
        )}
      </div>
    </motion.div>
  );
}

const emptyForm = { title: '', description: '', techStack: [], rolesNeeded: [], duration: '', status: 'open' };

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState('others');
  const [form, setForm]                 = useState(emptyForm);
  const [techInput, setTechInput]       = useState('');
  const [roleInput, setRoleInput]       = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [applyModal, setApplyModal]     = useState({ open: false, project: null });

  const currentUserId = user?.id || user?._id || '';

  useEffect(() => {
    api.get('/api/projects')
      .then(res => setProjects(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Apply — opens confirmation modal first ────────────────────────────────
  const handleApply = (project) => {
    setApplyModal({ open: true, project });
  };

  const confirmApply = async () => {
    const project = applyModal.project;
    setApplyModal({ open: false, project: null });
    try {
      const res = await api.put(`/api/projects/apply/${project._id}`);
      // Use the updated project from backend which has proper applicants array
      setProjects(prev => prev.map(p =>
        p._id === project._id ? res.data : p
      ));
      toast.success('Application sent! The project owner has been notified.', { duration: 4000 });
    } catch (err) {
      const msg = err.response?.data?.msg;
      if (msg === 'Already applied') toast.error('You already applied to this project');
      else if (msg === 'You cannot apply to your own project') toast.error("That's your own project!");
      else toast.error('Could not send application');
    }
  };

  const handleDelete = (id) => setConfirmModal({ open: true, id });

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/projects/${confirmModal.id}`);
      setProjects(prev => prev.filter(p => p._id !== confirmModal.id));
      toast.success('Project deleted');
    } catch { toast.error('Could not delete'); }
    finally { setConfirmModal({ open: false, id: null }); }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setForm({
      title: project.title, description: project.description,
      techStack: project.techStack || [], rolesNeeded: project.rolesNeeded || [],
      duration: project.duration || '', status: project.status || 'open',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/api/projects/status/${id}`, { status });
      setProjects(prev => prev.map(p => p._id === id ? { ...p, status } : p));
      toast.success('Status updated');
    } catch { toast.error('Could not update status'); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingProject) {
        await api.put(`/api/projects/${editingProject._id}`, form);
        setProjects(prev => prev.map(p => p._id === editingProject._id ? { ...p, ...form } : p));
        toast.success('Project updated!');
      } else {
        const res = await api.post('/api/projects', form);
        setProjects(prev => [res.data, ...prev]);
        toast.success('Project posted!');
      }
      setShowForm(false); setEditingProject(null); setForm(emptyForm);
    } catch { toast.error(editingProject ? 'Failed to update' : 'Failed to post project'); }
    finally { setSubmitting(false); }
  };

  const cancelForm = () => { setShowForm(false); setEditingProject(null); setForm(emptyForm); };
  const addTech = t => { if (t && !form.techStack.includes(t)) setForm({ ...form, techStack: [...form.techStack, t] }); setTechInput(''); };
  const addRole = r => { if (r && !form.rolesNeeded.includes(r)) setForm({ ...form, rolesNeeded: [...form.rolesNeeded, r] }); setRoleInput(''); };

  const myProjects     = projects.filter(p => userIdStr(p.user) === currentUserId.toString());
  const othersProjects = projects.filter(p => userIdStr(p.user) !== currentUserId.toString());
  const filterProjects = list => list.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.techStack?.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
    p.rolesNeeded?.some(r => r.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      {/* Apply confirmation modal */}
      {applyModal.open && (
        <ApplyModal project={applyModal.project} onConfirm={confirmApply}
          onCancel={() => setApplyModal({ open: false, project: null })} />
      )}

      <ConfirmModal isOpen={confirmModal.open} title="Delete Project"
        message="This will permanently delete your project and all applications. This cannot be undone."
        onConfirm={confirmDelete} onCancel={() => setConfirmModal({ open: false, id: null })} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-4xl text-white mb-1">
            Project <span className="gradient-text">Matchmaking</span>
          </h1>
          <p className="text-gray-400 font-body">Find collaborators or post your project</p>
        </div>
        <button onClick={() => showForm && !editingProject ? cancelForm() : setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Post Project'}
        </button>
      </motion.div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
            <form onSubmit={handleSubmit} className="glass-dark p-6 space-y-4">
              <h2 className="font-display font-semibold text-white mb-2">
                {editingProject ? 'Edit Project' : 'Post a New Project'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Project Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="input-glass" placeholder="e.g. Build a real-time chat app" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Description *</label>
                  <textarea value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value.slice(0, 800) })}
                    className="input-glass resize-none w-full" rows={3}
                    placeholder="What are you building? What's the goal?" required />
                  <p className={`text-right text-xs font-mono mt-1 ${form.description.length > 750 ? 'text-red-400' : 'text-gray-600'}`}>
                    {form.description.length}/800
                  </p>
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
                      className={`text-[10px] mr-1 mb-1 cursor-pointer inline-block rounded-lg px-2 py-0.5 font-mono transition-all ${form.rolesNeeded.includes(r) ? 'opacity-40' : ''}`}
                      style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.25)', color: '#f9a8d4' }}>
                      {r}
                    </button>
                  ))}
                  <div className="flex gap-1 flex-wrap mt-2">
                    {form.rolesNeeded.map(r => (
                      <span key={r} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg font-mono"
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
                <div>
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="input-glass">
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                  {submitting
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Layers size={14} />}
                  {editingProject ? 'Save Changes' : 'Post Project'}
                </button>
                <button type="button" onClick={cancelForm} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex gap-1 p-1 glass-dark rounded-xl w-fit">
          {[{ key: 'others', label: 'All Projects' }, { key: 'mine', label: 'My Projects' }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-all
                ${activeTab === tab.key ? 'bg-purple/25 text-white border border-purple/40' : 'text-gray-500 hover:text-gray-300'}`}>
              {tab.label}
              {tab.key === 'mine' && myProjects.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-purple/30 text-purple-light px-1.5 py-0.5 rounded font-mono">{myProjects.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-glass pl-9 py-2 text-sm w-56" placeholder="Filter projects..." />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-purple rounded-full border-t-transparent animate-spin" />
        </div>
      ) : activeTab === 'mine' ? (
        myProjects.length === 0
          ? <div className="text-center py-16 text-gray-500 font-body">You haven't posted any projects yet.</div>
          : <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filterProjects(myProjects).map(p => (
                  <ProjectCard key={p._id} project={p} onApply={handleApply} onDelete={handleDelete}
                    onEdit={handleEdit} onStatusUpdate={handleStatusUpdate} currentUserId={currentUserId} />
                ))}
              </AnimatePresence>
            </motion.div>
      ) : (
        othersProjects.length === 0
          ? <div className="text-center py-16 text-gray-500 font-body">No projects yet. Be the first to post one!</div>
          : <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filterProjects(othersProjects).map(p => (
                  <ProjectCard key={p._id} project={p} onApply={handleApply} onDelete={handleDelete}
                    onEdit={handleEdit} onStatusUpdate={handleStatusUpdate} currentUserId={currentUserId} />
                ))}
              </AnimatePresence>
            </motion.div>
      )}
    </div>
  );
}
