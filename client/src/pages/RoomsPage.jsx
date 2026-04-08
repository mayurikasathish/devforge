import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, X, Users, Zap, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';

const TECH_OPTIONS = ['React','Node.js','Python','MongoDB','TypeScript','Next.js','Django','FastAPI','Flutter','Go'];

function RoomCard({ room, onJoin, onDelete, userId }) {
  const isMember = room.members?.some(m => (m._id || m) === userId);
  const isCreator = (room.creator?._id || room.creator) === userId;

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="glass-dark p-5 card-hover flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-mono text-green-400">LIVE</span>
          </div>
          <h3 className="font-display font-semibold text-white text-base leading-snug">{room.title}</h3>
          {room.goal && <p className="text-xs text-purple-light font-mono mt-0.5">🎯 {room.goal}</p>}
        </div>
        {isCreator && (
          <button onClick={() => onDelete(room._id)}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Delete room">
            <Trash2 size={14} />
          </button>
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
        <div className="flex items-center gap-2">
          {!isMember && !isCreator && (
            <button onClick={() => onJoin(room._id)}
              className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1">
              <Zap size={11} /> Join
            </button>
          )}
          {(isMember || isCreator) && (
            <Link to={`/rooms/${room._id}`}
              className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1">
              Enter <ArrowRight size={11} />
            </Link>
          )}
        </div>
      </div>

      {room.members?.length > 0 && (
        <div className="flex items-center gap-1">
          {room.members.slice(0, 5).map((m, i) => (
            <img key={i} src={m.avatar} alt={m.name}
              className="w-6 h-6 rounded-full border border-black object-cover"
              style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: 5 - i }} />
          ))}
          {room.members.length > 5 && (
            <span className="text-xs font-mono text-gray-600 ml-2">+{room.members.length - 5}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', goal: '', deadline: '', techStack: [] });
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });

  useEffect(() => {
    api.get('/api/rooms').then(res => setRooms(res.data)).catch(() => {}).finally(() => setLoading(false));
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
    } catch { toast.error('Failed to create room'); }
    finally { setSubmitting(false); }
  };

  const handleJoin = async id => {
    try {
      await api.put(`/api/rooms/join/${id}`);
      setRooms(rooms.map(r => r._id === id
        ? { ...r, members: [...(r.members || []), { _id: user?.id, name: user?.name, avatar: user?.avatar }] }
        : r));
      toast.success('Joined room!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not join');
    }
  };

  const handleDelete = async id => {
    setConfirmModal({ open: true, id });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/rooms/${confirmModal.id}`);
      setRooms(rooms.filter(r => r._id !== confirmModal.id));
      toast.success('Room deleted');
    } catch { toast.error('Could not delete'); }
    finally { setConfirmModal({ open: false, id: null }); }
  };

  const toggleTech = t => setForm(f => ({
    ...f, techStack: f.techStack.includes(t) ? f.techStack.filter(x => x !== t) : [...f.techStack, t]
  }));

  const myRooms = rooms.filter(r => (r.creator?._id || r.creator) === user?.id);
  const othersRooms = rooms.filter(r => (r.creator?._id || r.creator) !== user?.id);

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      <ConfirmModal
        isOpen={confirmModal.open}
        title="Delete Room"
        message="This will permanently delete this room and remove all members. This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ open: false, id: null })}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8 flex-wrap gap-4">
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
                Create Room
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
          {myRooms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={15} style={{ color: '#a855f7' }} />
                <h2 className="font-display font-semibold text-white">My Rooms</h2>
                <span className="text-xs font-mono text-gray-500">({myRooms.length})</span>
              </div>
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {myRooms.map(r => <RoomCard key={r._id} room={r} onJoin={handleJoin} onDelete={handleDelete} userId={user?.id} />)}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users size={15} style={{ color: '#2dd4bf' }} />
              <h2 className="font-display font-semibold text-white">Active Rooms</h2>
              <span className="text-xs font-mono text-gray-500">({othersRooms.length})</span>
            </div>
            {othersRooms.length === 0 ? (
              <div className="text-center py-16 text-gray-500 font-body">
                No active rooms from others. Create one and start building!
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {othersRooms.map(r => <RoomCard key={r._id} room={r} onJoin={handleJoin} onDelete={handleDelete} userId={user?.id} />)}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
