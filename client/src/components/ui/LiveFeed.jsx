import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { Zap, HelpCircle, Users, Radio } from 'lucide-react';
import api from '../../utils/api';

// ─── helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)  return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TYPE_CONFIG = {
  project_posted: {
    icon: Zap,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.1)',
    border: 'rgba(168,85,247,0.2)',
    label: (a) => a.meta?.projectTitle
      ? <><span className="text-white font-medium">{a.actor?.name}</span> posted a new project</>
      : null,
    link: (a) => a.meta?.projectId ? `/projects` : null,
    sub:  (a) => a.meta?.projectTitle
  },
  doubt_posted: {
    icon: HelpCircle,
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.08)',
    border: 'rgba(244,114,182,0.2)',
    label: (a) => <><span className="text-white font-medium">{a.actor?.name}</span> posted a doubt</>,
    link: () => '/doubts',
    sub: (a) => a.meta?.doubtTitle
  },
  project_applied: {
    icon: Users,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.2)',
    label: (a) => <><span className="text-white font-medium">{a.actor?.name}</span> applied to a project</>,
    link: () => '/projects',
    sub: (a) => a.meta?.projectTitle
  }
};

function FeedItem({ item, isNew }) {
  const cfg = TYPE_CONFIG[item.type];
  if (!cfg) return null;
  const Icon = cfg.icon;
  const link = cfg.link(item);

  const inner = (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, x: -10, height: 0 } : { opacity: 1 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-150 group cursor-pointer hover:bg-white/4"
      style={{ border: `1px solid ${isNew ? cfg.border : 'transparent'}`,
               background: isNew ? cfg.bg : 'transparent' }}>

      {/* Avatar + icon overlay */}
      <div className="relative flex-shrink-0">
        {item.actor?.avatar
          ? <img src={item.actor.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
          : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
              {(item.actor?.name || 'U')[0].toUpperCase()}
            </div>
        }
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: cfg.color }}>
          <Icon size={9} className="text-white" />
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-body leading-relaxed">
          {cfg.label(item)}
        </p>
        {cfg.sub(item) && (
          <p className="text-[11px] font-mono mt-0.5 truncate" style={{ color: cfg.color }}>
            {cfg.sub(item)}
          </p>
        )}
        <p className="text-[10px] text-gray-600 font-mono mt-0.5">{timeAgo(item.createdAt)}</p>
      </div>

      {isNew && (
        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: cfg.color }} />
      )}
    </motion.div>
  );

  return link ? <Link to={link}>{inner}</Link> : inner;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LiveFeed() {
  const [items, setItems]         = useState([]);
  const [newIds, setNewIds]       = useState(new Set());
  const [loading, setLoading]     = useState(true);
  const socketRef                 = useRef(null);

  // Get current user ID from localStorage (set by AuthContext)
  const getCurrentUserId = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        return (parsed.id || parsed._id)?.toString();
      } catch {}
    }
    return null;
  };

  // Initial load — filter by following + doubt_posted from everyone
  useEffect(() => {
    const myId = getCurrentUserId();
    console.log('[LiveFeed] Loading filtered activity feed...');
    api.get('/api/activity/filtered')
      .then(r => {
        console.log('[LiveFeed] Filtered feed loaded:', r.data.length, 'items');
        // Backend already filters: project events from following only, doubts from everyone
        setItems(r.data);
      })
      .catch((err) => {
        console.error('[LiveFeed] Failed to load filtered feed:', err.response?.status, err.response?.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Live socket — fetch following list for client-side filtering
  useEffect(() => {
    const myId = getCurrentUserId();
    const followingIdsRef = { current: [] };

    // Fetch who I follow (async, but store in ref so socket handler always has latest)
    console.log('[LiveFeed] Fetching following list...');
    api.get('/api/profile/me')
      .then(r => {
        followingIdsRef.current = (r.data.following || []).map(id => id.toString());
        console.log('[LiveFeed] Following loaded:', followingIdsRef.current.length, 'users', followingIdsRef.current);
      })
      .catch((err) => {
        console.error('[LiveFeed] Failed to load following:', err);
      });

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[LiveFeed] Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('[LiveFeed] Socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[LiveFeed] Socket disconnected:', reason);
    });

    socket.on('activity', (event) => {
      const actorId = (event.actor?._id || event.actor)?.toString();
      console.log('[LiveFeed] Socket event received:', event.type, 'from actor:', actorId, 'following:', followingIdsRef.current);

      // Don't show own activities
      if (myId && actorId === myId) {
        console.log('[LiveFeed] Filtered out own activity');
        return;
      }

      // For project events, only show from people I follow
      if (event.type === 'project_posted' || event.type === 'project_applied') {
        if (!followingIdsRef.current.includes(actorId)) {
          console.log('[LiveFeed] Filtered out project event from non-followed user');
          return;
        }
      }
      // For doubt_posted, show from everyone (no filter)
      console.log('[LiveFeed] Showing activity in feed');

      setItems(prev => [event, ...prev].slice(0, 30)); // cap at 30
      setNewIds(prev => new Set([...prev, event._id]));
      // Clear "new" highlight after 8s
      setTimeout(() => {
        setNewIds(prev => { const n = new Set(prev); n.delete(event._id); return n; });
      }, 8000);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="glass-dark flex flex-col overflow-hidden" style={{ borderRadius: '16px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-purple-400" />
          <span className="text-sm font-display font-semibold text-white">Live Feed</span>
        </div>
        {/* Pulse dot */}
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: '#a855f7' }} />
          <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: '#a855f7' }} />
        </span>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: '420px' }}>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-purple-500 rounded-full border-t-transparent animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <Radio size={24} className="text-gray-700" />
            <p className="text-xs text-gray-600 font-body">No activity yet.<br />Be the first to post!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {items.map(item => (
              <FeedItem key={item._id} item={item} isNew={newIds.has(item._id)} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
