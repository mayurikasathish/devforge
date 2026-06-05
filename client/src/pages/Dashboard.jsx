import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Star, Users, Layers, Zap, ArrowRight, TrendingUp, X, Clock,
  Bell, Radio, CheckCircle2, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

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

function calculateMatch(mySkills=[], otherSkills=[], availability) {
  if (!mySkills.length || !otherSkills.length) return 0;
  const mine  = mySkills.map(s => s.name?.toLowerCase().trim());
  const other = otherSkills.map(s => s.name?.toLowerCase().trim());
  const common = mine.filter(s => other.includes(s));
  const unique = new Set([...mine, ...other]);
  let score = (common.length / unique.size) * 100;
  if (availability === 'available') score += 5;
  if (availability === 'open_to_collaborate') score += 3;
  return Math.min(100, Math.round(score));
}

// ─── Live Feed ────────────────────────────────────────────────────────────────
const FEED_CONF = {
  project_posted:  { color: '#a855f7', emoji: '🚀', label: (a) => `${a.actor?.name} posted a project`, sub: a => a.meta?.projectTitle, link: '/projects' },
  doubt_posted:    { color: '#f472b6', emoji: '💬', label: (a) => `${a.actor?.name} posted a doubt`,   sub: a => a.meta?.doubtTitle,   link: '/doubts'   },
  project_applied: { color: '#34d399', emoji: '⚡',  label: (a) => `${a.actor?.name} applied to a project`, sub: a => a.meta?.projectTitle, link: '/projects' },
};

function FeedItem({ item, isNew }) {
  const cfg = FEED_CONF[item.type];
  if (!cfg) return null;
  return (
    <Link to={cfg.link}>
      <motion.div layout
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/4 cursor-pointer"
        style={isNew ? { background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' } : {}}>
        <div className="relative flex-shrink-0 mt-0.5">
          {item.actor?.avatar
            ? <img src={item.actor.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
            : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
                {(item.actor?.name||'?')[0].toUpperCase()}
              </div>
          }
          <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">{cfg.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-300 font-body leading-snug">{cfg.label(item)}</p>
          {cfg.sub(item) && <p className="text-[11px] font-mono truncate mt-0.5" style={{ color: cfg.color }}>{cfg.sub(item)}</p>}
          <p className="text-[10px] text-gray-600 font-mono mt-0.5">{timeAgo(item.createdAt)}</p>
        </div>
        {isNew && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: cfg.color }} />}
      </motion.div>
    </Link>
  );
}

// ─── Applicants panel (shown inside My Projects card) ─────────────────────────
function ApplicantsPanel({ project, onAction }) {
  const [loading, setLoading] = useState(false);

  const handle = async (applicantId, action) => {
    setLoading(true);
    try {
      await api.put(`/api/projects/applicant/${project._id}`, { applicantId, action });
      onAction(project._id, applicantId, action);
      toast.success(action === 'accept' ? '✅ Accepted!' : 'Applicant rejected');
    } catch { toast.error('Could not update applicant'); }
    finally { setLoading(false); }
  };

  if (!project.applicants?.length) return (
    <p className="text-xs text-gray-600 font-mono text-center py-2">No pending applicants</p>
  );

  return (
    <div className="space-y-2 mt-2">
      {project.applicants.map(a => {
        // applicants are now populated objects from the API
        const id     = a._id?.toString() || a.toString();
        const name   = a.name   || 'Applicant';
        const avatar = a.avatar || null;
        return (
          <div key={id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Clickable avatar + name → profile */}
            <Link to={`/profile/${id}`} className="flex items-center gap-2 flex-1 min-w-0 group">
              {avatar
                ? <img src={avatar} className="w-7 h-7 rounded-full object-cover flex-shrink-0" alt={name} />
                : <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
                    {name[0].toUpperCase()}
                  </div>
              }
              <span className="flex-1 text-xs text-gray-300 font-body truncate group-hover:text-purple-300 transition-colors">{name}</span>
            </Link>
            <button disabled={loading} onClick={() => handle(id, 'accept')}
              className="p-1.5 rounded-lg transition-all hover:bg-green-400/10 text-gray-600 hover:text-green-400"
              title="Accept">
              <CheckCircle2 size={15} />
            </button>
            <button disabled={loading} onClick={() => handle(id, 'reject')}
              className="p-1.5 rounded-lg transition-all hover:bg-red-400/10 text-gray-600 hover:text-red-400"
              title="Reject">
              <XCircle size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Notification bell ────────────────────────────────────────────────────────
function NotifBell({ notifs, onClear }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-white/8 transition-all text-gray-400 hover:text-white">
        <Bell size={18} />
        {notifs.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
            {notifs.length > 9 ? '9+' : notifs.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-10 w-80 z-50 glass-dark overflow-hidden"
            style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm font-display font-semibold text-white">Notifications</span>
              {notifs.length > 0 && (
                <button onClick={onClear} className="text-[10px] font-mono text-gray-500 hover:text-purple-300 transition-colors">
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Bell size={20} className="text-gray-700" />
                  <p className="text-xs text-gray-600 font-body">You're all caught up</p>
                </div>
              ) : (
                notifs.map((n, i) => (
                  <button key={i} onClick={() => { if (n.projectId) navigate('/projects'); setOpen(false); }}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-base flex-shrink-0 mt-0.5">
                      {n.type === 'application_accepted' ? '🎉'
                       : n.type === 'application_rejected' ? '😔'
                       : n.type === 'project_applied' ? '⚡'
                       : '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 font-body leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-600 font-mono mt-0.5">just now</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile]     = useState(null);
  const [suggested, setSuggested] = useState([]);
  const [projects, setProjects]   = useState([]);
  const [myProjects, setMyProjects] = useState([]); // owner's projects for applicant mgmt
  const [loading, setLoading]     = useState(true);
  const [notifs, setNotifs]       = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [newFeedIds, setNewFeedIds]   = useState(new Set());
  const [followingIds, setFollowingIds] = useState([]);
  const [expandedApplicants, setExpandedApplicants] = useState({}); // projectId → bool
  const socketRef = useRef(null);
  const myIdRef   = useRef(null); // stable ref so socket closure always has current user id

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, projectsRes, activityRes, followingRes] = await Promise.all([
          api.get('/api/profile/me').catch(() => ({ data: null })),
          api.get('/api/projects').catch(() => ({ data: [] })),
          api.get('/api/activity').catch(() => ({ data: [] })),
          api.get('/api/activity/following').catch(() => ({ data: [] })),
        ]);
        setProfile(profileRes.data);
        const allProjects = projectsRes.data;
        const myId = user?.id || user?._id;
        setMyProjects(allProjects.filter(p => (p.user?._id || p.user) === myId));
        setProjects(allProjects.filter(p => (p.user?._id || p.user) !== myId).slice(0, 3));
        setFeedItems(activityRes.data);
        // Load persistent notifications (accept/reject results)
        const [persistentNotifsRes, fRes] = await Promise.all([
          api.get('/api/notifications').catch(() => ({ data: [] })),
          api.get('/api/profile/following/ids').catch(() => ({ data: [] })),
        ]);
        const myIdStr = (user?.id || user?._id)?.toString();
        const fIds = fRes.data.map(id => id.toString());
        setFollowingIds(fIds);

        // Persistent notifs (accept/reject) go into bell
        const persistentMapped = persistentNotifsRes.data.map(n => ({
          type: n.type, message: n.message,
          projectId: n.meta?.projectId, createdAt: n.createdAt, _id: n._id
        }));

        // Following activity — exclude self
        const followingActivity = followingRes.data
          .filter(a => a.actor?._id?.toString() !== myIdStr)
          .slice(0, 20)
          .map(a => ({
            type: a.type,
            message: a.type === 'project_posted' ? `${a.actor?.name} posted "${a.meta?.projectTitle}"`
                   : a.type === 'doubt_posted'    ? `${a.actor?.name} posted a doubt: "${a.meta?.doubtTitle}"`
                   : `${a.actor?.name} applied to "${a.meta?.projectTitle}"`,
            projectId: a.meta?.projectId,
            doubtId: a.meta?.doubtId,
            createdAt: a.createdAt,
          }));

        setNotifs([...persistentMapped, ...followingActivity]);

        if (profileRes.data?.skills?.length) {
          const skills = profileRes.data.skills.map(s => s.name).join(',');
          const sugRes = await api.get(`/api/profile/match/${skills}`).catch(() => ({ data: [] }));
          setSuggested(sugRes.data.slice(0, 4));
        } else {
          const allRes = await api.get('/api/profile').catch(() => ({ data: [] }));
          setSuggested(allRes.data.filter(p => p.user._id !== myId).slice(0, 4));
        }
      } finally {
        setLoading(false);
        setFeedLoading(false);
      }
    };
    load();
  }, []);

  // ── Socket — connect once, re-join room when user resolves ─────────────────
  useEffect(() => {
    // Connect immediately (user may be null initially, that's fine)
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket']
    });
    socketRef.current = socket;

    // ── Live feed events (project posted, doubt posted, someone applied) ──
    socket.on('activity', (event) => {
      const evActorId = event.actor?._id?.toString() || event.actor?.toString();
      // Don't show own actions in feed — use ref so closure always has latest user id
      if (myIdRef.current && evActorId === myIdRef.current) return;
      setFeedItems(prev => [event, ...prev].slice(0, 30));
      setNewFeedIds(prev => new Set([...prev, event._id]));
      setTimeout(() => setNewFeedIds(prev => { const n=new Set(prev); n.delete(event._id); return n; }), 8000);

      // Only push to bell if actor is someone we follow AND not ourselves
      const actorId = event.actor?._id?.toString() || event.actor?.toString();
      setFollowingIds(currentFollowing => {
        if (actorId !== myIdRef.current && currentFollowing.includes(actorId)) {
          const MSGS = {
            project_posted:  (a) => `${a.actor?.name} posted a new project: "${a.meta?.projectTitle}"`,
            doubt_posted:    (a) => `${a.actor?.name} posted a doubt: "${a.meta?.doubtTitle}"`,
            project_applied: (a) => `${a.actor?.name} applied to "${a.meta?.projectTitle}"`,
          };
          const msgFn = MSGS[event.type];
          if (msgFn) {
            setNotifs(prev => [{ type: event.type, message: msgFn(event),
              projectId: event.meta?.projectId, doubtId: event.meta?.doubtId,
              createdAt: new Date().toISOString(), _feedItem: true }, ...prev]);
          }
        }
        return currentFollowing; // no mutation, just reading
      });
    });

    // ── Direct notifications (apply accepted/rejected, owner gets apply alert) ──
    socket.on('notification', (notif) => {
      setNotifs(prev => [notif, ...prev]);
      toast(notif.message, {
        icon: notif.type === 'application_accepted' ? '🎉'
              : notif.type === 'application_rejected' ? '😔'
              : '⚡',
        duration: 5000,
      });
      if (notif.type === 'project_applied') {
        api.get('/api/projects').then(r => {
          const myId = user?.id || user?._id;
          setMyProjects(r.data.filter(p => (p.user?._id || p.user)?.toString() === myId?.toString()));
        }).catch(() => {});
      }
    });

    return () => socket.disconnect();
  }, []); // connect once on mount

  // ── Keep myIdRef current + join personal notification room ───────────────
  useEffect(() => {
    const uid = user?.id || user?._id;
    if (uid) {
      myIdRef.current = uid.toString();
      if (socketRef.current) socketRef.current.emit('dm_join', { userId: uid });
    }
  }, [user]);

  // ── Applicant accept/reject ───────────────────────────────────────────────
  const handleApplicantAction = (projectId, applicantId, action) => {
    setMyProjects(prev => prev.map(p => {
      if (p._id !== projectId) return p;
      const newApplicants = p.applicants.filter(a => (a._id||a).toString() !== applicantId.toString());
      const newMembers    = action === 'accept'
        ? [...(p.members||[]), p.applicants.find(a => (a._id||a).toString() === applicantId.toString())]
        : p.members;
      return { ...p, applicants: newApplicants, members: newMembers };
    }));
  };

  const radarData = profile?.skills?.slice(0, 6).map(s => ({
    skill: s.name?.length > 8 ? s.name.slice(0, 8) : s.name,
    value: (s.level || 3) * 20
  })) || [];

  const handleApply = async (id) => {
    try {
      await api.put(`/api/projects/apply/${id}`);
      setProjects(prev => prev.map(p => p._id === id
        ? { ...p, applicants: [...(p.applicants||[]), { _id: user?.id }] } : p));
      toast.success('Application sent!');
    } catch { toast.error('Could not apply'); }
  };

  const sortedSuggested = [...suggested].sort((a, b) =>
    calculateMatch(profile?.skills||[], b.skills||[], b.availability) -
    calculateMatch(profile?.skills||[], a.skills||[], a.availability)
  );

  if (loading) return (
    <div className="min-h-screen pt-28 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple rounded-full border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      {/* Header row with notif bell */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display font-bold text-4xl text-white">
            Hey, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-400 font-body mt-2">Here's what's happening in your forge.</p>
        </div>
        <NotifBell notifs={notifs} onClear={() => {
    setNotifs([]);
    api.put('/api/notifications/read-all').catch(() => {});
  }} />
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

        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-6">

          {/* Skill Radar */}
          <motion.div variants={fadeUp} className="glass-dark p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} style={{ color: '#a855f7' }} />
              <h2 className="font-display font-semibold text-white">Skill Radar</h2>
            </div>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'DM Sans' }} />
                  <Radar dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: 'rgba(15,12,30,0.95)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, fontSize: 12 }}
                    formatter={v => [`${v/20}/5`, 'Level']} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-gray-600 text-sm">
                <Zap size={28} className="mb-2 opacity-30" /><span>Add skills to see your radar</span>
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

          {/* ── Live Feed ─────────────────────────────────────────────────── */}
          <motion.div variants={fadeUp} className="glass-dark overflow-hidden" style={{ borderRadius: '16px' }}>
            <div className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-purple-400" />
                <span className="text-sm font-display font-semibold text-white">Live Feed</span>
              </div>
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#a855f7' }} />
                <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: '#a855f7' }} />
              </span>
            </div>
            <div className="overflow-y-auto p-2" style={{ maxHeight: '320px' }}>
              {feedLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-purple-500 rounded-full border-t-transparent animate-spin" />
                </div>
              ) : feedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                  <Radio size={20} className="text-gray-700" />
                  <p className="text-xs text-gray-600 font-body">No activity yet</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {feedItems.map(item => (
                    <FeedItem key={item._id} item={item} isNew={newFeedIds.has(item._id)} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* My Projects — applicant management */}
          {myProjects.length > 0 && (
            <motion.div variants={fadeUp} className="glass-dark p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers size={16} style={{ color: '#a855f7' }} />
                  <h2 className="font-display font-semibold text-white">My Projects</h2>
                </div>
                <Link to="/projects?tab=mine" className="text-xs font-mono text-gray-500 hover:text-purple-light transition-colors flex items-center gap-1">
                  Manage <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-3">
                {myProjects.map(proj => {
                  const pendingCount = proj.applicants?.length || 0;
                  const memberCount  = proj.members?.length || 0;
                  const isExpanded   = expandedApplicants[proj._id];
                  return (
                    <div key={proj._id} className="glass p-4 rounded-xl">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-display font-semibold text-white truncate">{proj.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1">
                              <Users size={10} /> {pendingCount} pending
                            </span>
                            {memberCount > 0 && (
                              <span className="text-[11px] font-mono text-green-400 flex items-center gap-1">
                                <CheckCircle2 size={10} /> {memberCount} accepted
                              </span>
                            )}
                          </div>
                        </div>
                        {pendingCount > 0 && (
                          <button onClick={() => setExpandedApplicants(prev => ({ ...prev, [proj._id]: !isExpanded }))}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
                            style={{ background: 'rgba(168,85,247,0.12)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)' }}>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {pendingCount} applicant{pendingCount > 1 ? 's' : ''}
                          </button>
                        )}
                        {pendingCount === 0 && (
                          <span className="text-[10px] font-mono text-gray-600 px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(255,255,255,0.03)' }}>No pending</span>
                        )}
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <ApplicantsPanel project={proj} onAction={handleApplicantAction} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

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
            {sortedSuggested.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sortedSuggested.map(p => {
                  const matchPct = calculateMatch(profile?.skills||[], p.skills||[], p.availability);
                  const myNames  = (profile?.skills||[]).map(s=>s.name?.toLowerCase());
                  const common   = (p.skills||[]).filter(s=>myNames.includes(s.name?.toLowerCase())).length;
                  return (
                    <Link key={p._id} to={`/profile/${p.user._id}`}
                      className="glass p-4 rounded-xl card-hover flex items-center gap-3 group">
                      <img src={p.user.avatar} alt={p.user.name}
                        className="w-10 h-10 rounded-full border border-purple/30 object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-display font-semibold text-white truncate">{p.user.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 font-body truncate">{p.status}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                            style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
                            {matchPct}% Match
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{common} shared skill{common!==1?'s':''}</div>
                      </div>
                      <div className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${
                        p.availability==='available' ? 'bg-green-400'
                        : p.availability==='open_to_collaborate' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                    </Link>
                  );
                })}
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
                  const myId = user?.id || user?._id;
                  const hasApplied = proj.applicants?.some(a => (a._id||a)?.toString() === myId?.toString());
                  return (
                    <div key={proj._id} className="glass p-4 rounded-xl card-hover">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-display font-semibold text-white">{proj.title}</h3>
                          <p className="text-xs text-gray-500 font-body mt-0.5 line-clamp-2">{proj.description}</p>
                        </div>
                        <span className="tag-aqua text-[10px] px-2 py-0.5 rounded-lg whitespace-nowrap font-mono flex-shrink-0"
                          style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)', color: '#5eead4' }}>
                          {proj.status}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {proj.techStack?.slice(0,4).map(t=><span key={t} className="tag text-[10px]">{t}</span>)}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-600 font-mono flex items-center gap-1">
                          <Users size={10}/> {proj.applicants?.length||0} applicants
                        </span>
                        {hasApplied ? (
                          <span className="flex items-center gap-1 text-xs text-green-400 font-body px-3 py-1 rounded-xl"
                            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                            <CheckCircle2 size={11}/> Applied
                          </span>
                        ) : (
                          <button onClick={() => handleApply(proj._id)}
                            className="btn-primary text-xs py-1.5 px-4">Apply</button>
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
