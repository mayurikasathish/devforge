import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Plus, X, Users, Zap, Calendar, ArrowRight,
  Trash2, Edit2, Check, Radio
} from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';

const TECH_OPTIONS = ['React','Node.js','Python','MongoDB','TypeScript','Next.js','Django','FastAPI','Flutter','Go','Rust','GraphQL'];

// Normalise any id shape to string for reliable comparison
const sid = (id) => (id?._id || id)?.toString() || '';

// ── Join requests panel ───────────────────────────────────────────────────────
function JoinRequestsPanel({ room, onApprove }) {
  const reqs = room.joinRequests || [];
  if (!reqs.length) return (
    <p className="text-xs font-mono text-gray-600 text-center py-2">No pending requests</p>
  );
  return (
    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">Join Requests</p>
      {reqs.map(r => {
        const id     = r._id?.toString() || r.toString();
        const name   = r.name   || 'Developer';
        const avatar = r.avatar || null;
        return (
          <div key={id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {avatar
              ? <img src={avatar} className="w-7 h-7 rounded-full object-cover flex-shrink-0" alt={name} />
              : <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
                  {name[0].toUpperCase()}
                </div>
            }
            <span className="flex-1 text-xs text-gray-300 font-body truncate">{name}</span>
            <button onClick={() => onApprove(room._id, id, 'approve')}
              className="p-1.5 rounded-lg hover:bg-green-400/10 text-gray-600 hover:text-green-400 transition-all" title="Approve">
              <Check size={14} />
            </button>
            <button onClick={() => onApprove(room._id, id, 'reject')}
              className="p-1.5 rounded-lg hover:bg-red-400/10 text-gray-600 hover:text-red-400 transition-all" title="Reject">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function RoomCard({ room, onRequest, onApprove, onDelete, onToggleActive, onEdit, userId }) {
  const isMember  = room.members?.some(m => sid(m) === userId);
  const isCreator = sid(room.creator) === userId;

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="glass-dark p-5 card-hover flex flex-col gap-3"
      style={{ opacity: room.isActive ? 1 : 0.55 }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {room.isActive
              ? <><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-green-400">LIVE</span></>
              : <><div className="w-2 h-2 rounded-full bg-gray-600" />
                  <span className="text-[10px] font-mono text-gray-500">CLOSED</span></>
            }
          </div>
          <h3 className="font-display font-semibold text-white text-base leading-snug">{room.title}</h3>
          {room.goal && <p className="text-xs text-purple-light font-mono mt-0.5">🎯 {room.goal}</p>}
        </div>

        {/* Creator controls */}
        {isCreator && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(room)}
              className="p-1.5 rounded-lg text-gray-600 hover:text-purple-light hover:bg-purple/10 transition-all"
              title="Edit room">
              <Edit2 size={13} />
            </button>
            <button onClick={() => onToggleActive(room)}
              className={`p-1.5 rounded-lg transition-all text-xs font-mono ${
                room.isActive
                  ? 'text-gray-600 hover:text-yellow-400 hover:bg-yellow-400/10'
                  : 'text-gray-600 hover:text-green-400 hover:bg-green-400/10'}`}
              title={room.isActive ? 'Close room' : 'Reopen room'}>
              <Radio size={13} />
            </button>
            <button onClick={() => onDelete(room._id)}
              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Delete room">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {room.description && (
        <p className="text-sm text-gray-400 font-body line-clamp-2">{room.description}</p>
      )}

      {room.techStack?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {room.techStack.map(t => <span key={t} className="tag text-[10px]">{t}</span>)}
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-3 text-xs text-gray-600 font-mono">
          <span className="flex items-center gap-1">
            <Users size={11} />
            {room.members?.length || 0} member{room.members?.length !== 1 ? 's' : ''}
          </span>
          {room.deadline && (
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {new Date(room.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Action button */}
        {(() => {
          const hasPending = room.joinRequests?.some(r => sid(r) === userId || r?._id?.toString() === userId);
          if (isMember || isCreator) return (
            <Link to={`/rooms/${room._id}`}
              className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1">
              Enter <ArrowRight size={11} />
            </Link>
          );
          if (hasPending) return (
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc' }}>
              ⏳ Pending
            </span>
          );
          if (!room.isActive) return (
            <span className="text-xs font-mono text-gray-600 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              Closed
            </span>
          );
          return (
            <button onClick={() => onRequest(room._id)}
              className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1">
              <Zap size={11} /> Request to Join
            </button>
          );
        })()}
      </div>

      {/* Member avatars */}
      {room.members?.length > 0 && (
        <div className="flex items-center gap-1">
          {room.members.slice(0, 6).map((m, i) => (
            <img key={i} src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`}
              alt={m.name} title={m.name}
              className="w-6 h-6 rounded-full border border-black object-cover"
              style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: 6 - i }} />
          ))}
          {room.members.length > 6 && (
            <span className="text-xs font-mono text-gray-600 ml-2">+{room.members.length - 6}</span>
          )}
        </div>
      )}
      {/* Join requests panel — visible to creator only */}
      {isCreator && room.joinRequests?.length > 0 && (
        <JoinRequestsPanel room={room} onApprove={onApprove} />
      )}
    </motion.div>
  );
}

// ── Edit room modal ────────────────────────────────────────────────────────────
function EditModal({ room, onSave, onClose }) {
  const [form, setForm] = useState({
    title:       room.title       || '',
    description: room.description || '',
    goal:        room.goal        || '',
    deadline:    room.deadline ? room.deadline.split('T')[0] : '',
    techStack:   room.techStack   || [],
  });
  const [saving, setSaving] = useState(false);

  const toggleTech = t => setForm(f => ({
    ...f, techStack: f.techStack.includes(t) ? f.techStack.filter(x => x !== t) : [...f.techStack, t]
  }));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(room._id, form); onClose(); }
    catch { toast.error('Could not update room'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
        onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg glass-dark p-6 z-10" style={{ borderRadius: '20px' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-all">
          <X size={16} />
        </button>
        <h2 className="font-display font-bold text-white text-lg mb-5">Edit Room</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-gray-400 mb-1.5 block">Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="input-glass" required />
          </div>
          <div>
            <label className="text-xs font-mono text-gray-400 mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-glass resize-none w-full" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-gray-400 mb-1.5 block">Goal</label>
              <input value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}
                className="input-glass" />
            </div>
            <div>
              <label className="text-xs font-mono text-gray-400 mb-1.5 block">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="input-glass" />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-gray-400 mb-2 block">Tech Stack</label>
            <div className="flex flex-wrap gap-1.5">
              {TECH_OPTIONS.map(t => (
                <button type="button" key={t} onClick={() => toggleTech(t)}
                  className={`tag text-xs cursor-pointer transition-all ${form.techStack.includes(t) ? 'bg-purple/30 border-purple/60 text-white' : ''}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Check size={14} />}
              Save Changes
            </button>
            <button type="button" onClick={onClose} className="btn-ghost px-6">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function RoomsPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [rooms, setRooms]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm]             = useState({ title: '', description: '', goal: '', deadline: '', techStack: [] });
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });

  const userId = user?.id?.toString() || user?._id?.toString() || '';

  useEffect(() => {
    api.get('/api/rooms')
      .then(res => setRooms(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/api/rooms', form);
      setRooms([res.data, ...rooms]);
      setShowForm(false);
      setForm({ title: '', description: '', goal: '', deadline: '', techStack: [] });
      toast.success('Room created!');
      // Navigate straight into the room you just created
      navigate(`/rooms/${res.data._id}`);
    } catch { toast.error('Failed to create room'); }
    finally { setSubmitting(false); }
  };

  const handleRequest = async id => {
    try {
      await api.post(`/api/rooms/request/${id}`);
      toast.success('Join request sent! Waiting for creator to approve.');
      setRooms(rooms.map(r => r._id === id
        ? { ...r, joinRequests: [...(r.joinRequests || []), { _id: userId }] }
        : r));
    } catch (err) {
      const msg = err.response?.data?.msg;
      if (msg === 'Request already sent') toast.error('You already sent a request');
      else toast.error(msg || 'Could not send request');
    }
  };

  const handleApprove = async (roomId, applicantId, action) => {
    try {
      const res = await api.put(`/api/rooms/approve/${roomId}`, { userId: applicantId, action });
      setRooms(rooms.map(r => r._id === roomId ? res.data : r));
      toast.success(action === 'approve' ? 'Member approved!' : 'Request rejected');
    } catch { toast.error('Could not update request'); }
  };

  const handleDelete = id => setConfirmModal({ open: true, id });

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/rooms/${confirmModal.id}`);
      setRooms(rooms.filter(r => r._id !== confirmModal.id));
      toast.success('Room deleted');
    } catch { toast.error('Could not delete'); }
    finally { setConfirmModal({ open: false, id: null }); }
  };

  const handleToggleActive = async (room) => {
    try {
      const res = await api.put(`/api/rooms/toggle/${room._id}`);
      setRooms(rooms.map(r => r._id === room._id ? { ...r, isActive: res.data.isActive } : r));
      toast.success(res.data.isActive ? 'Room reopened' : 'Room closed');
    } catch { toast.error('Could not update room status'); }
  };

  const handleEdit = (room) => setEditingRoom(room);

  const handleSaveEdit = async (id, data) => {
    const res = await api.put(`/api/rooms/${id}`, data);
    setRooms(rooms.map(r => r._id === id ? { ...r, ...res.data } : r));
    toast.success('Room updated!');
  };

  const toggleTech = t => setForm(f => ({
    ...f, techStack: f.techStack.includes(t) ? f.techStack.filter(x => x !== t) : [...f.techStack, t]
  }));

  const myRooms     = rooms.filter(r => sid(r.creator) === userId);
  const joinedRooms = rooms.filter(r => sid(r.creator) !== userId && r.members?.some(m => sid(m) === userId));
  const otherRooms  = rooms.filter(r => sid(r.creator) !== userId && !r.members?.some(m => sid(m) === userId));

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      <ConfirmModal isOpen={confirmModal.open} title="Delete Room"
        message="This will permanently delete this room. This cannot be undone."
        onConfirm={confirmDelete} onCancel={() => setConfirmModal({ open: false, id: null })} />

      {editingRoom && (
        <EditModal room={editingRoom} onSave={handleSaveEdit} onClose={() => setEditingRoom(null)} />
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-4xl text-white mb-1">
            Build <span className="gradient-text">Together</span> Rooms
          </h1>
          <p className="text-gray-400 font-body">Real-time collaborative spaces for building</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Create Room'}
        </button>
      </motion.div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
            <form onSubmit={handleCreate} className="glass-dark p-6 space-y-4">
              <h2 className="font-display font-semibold text-white">Create a Room</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Room Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="input-glass" placeholder="e.g. Build a MERN Chat App in 3 Days" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="input-glass resize-none w-full" rows={2} placeholder="What will you build together?" />
                </div>
                <div>
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Goal</label>
                  <input value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}
                    className="input-glass" placeholder="e.g. Ship MVP by Friday" />
                </div>
                <div>
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                    className="input-glass" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-gray-400 mb-2 block">Tech Stack</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TECH_OPTIONS.map(t => (
                      <button type="button" key={t} onClick={() => toggleTech(t)}
                        className={`tag text-xs cursor-pointer transition-all ${form.techStack.includes(t) ? 'bg-purple/30 border-purple/60 text-white' : ''}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={14} />}
                Create & Enter Room
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-purple rounded-full border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-10">
          {/* My Rooms */}
          {myRooms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={15} style={{ color: '#a855f7' }} />
                <h2 className="font-display font-semibold text-white">My Rooms</h2>
                <span className="text-xs font-mono text-gray-500">({myRooms.length})</span>
              </div>
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {myRooms.map(r => (
                    <RoomCard key={r._id} room={r} onRequest={handleRequest} onApprove={handleApprove} onDelete={handleDelete}
                      onToggleActive={handleToggleActive} onEdit={handleEdit} userId={userId} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {/* Rooms I've joined */}
          {joinedRooms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users size={15} style={{ color: '#f472b6' }} />
                <h2 className="font-display font-semibold text-white">Joined Rooms</h2>
                <span className="text-xs font-mono text-gray-500">({joinedRooms.length})</span>
              </div>
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {joinedRooms.map(r => (
                    <RoomCard key={r._id} room={r} onRequest={handleRequest} onApprove={handleApprove} onDelete={handleDelete}
                      onToggleActive={handleToggleActive} onEdit={handleEdit} userId={userId} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {/* Other active rooms */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users size={15} style={{ color: '#2dd4bf' }} />
              <h2 className="font-display font-semibold text-white">Active Rooms</h2>
              <span className="text-xs font-mono text-gray-500">({otherRooms.length})</span>
            </div>
            {otherRooms.length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-body">
                No other active rooms. Create one and start building!
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {otherRooms.map(r => (
                    <RoomCard key={r._id} room={r} onRequest={handleRequest} onApprove={handleApprove} onDelete={handleDelete}
                      onToggleActive={handleToggleActive} onEdit={handleEdit} userId={userId} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
