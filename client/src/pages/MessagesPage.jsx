import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { Send, MessageSquare, ArrowLeft, Search, X } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)   return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// WhatsApp-style: "10:45 AM · Mon, 3 Jun"
function formatBubbleTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `${time} · Yesterday`;
  if (diffDays < 7)   return `${time} · ${d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}`;
  return `${time} · ${d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function formatDateDivider(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

// Group messages by date for dividers
function groupByDate(msgs) {
  const groups = [];
  let lastDate = null;
  for (const msg of msgs) {
    const day = new Date(msg.createdAt).toDateString();
    if (day !== lastDate) {
      groups.push({ type: 'divider', label: formatDateDivider(msg.createdAt), key: `div_${msg.createdAt}` });
      lastDate = day;
    }
    groups.push({ type: 'msg', msg, key: msg._id });
  }
  return groups;
}

function ConvoItem({ convo, isActive, onClick }) {
  const name = convo.peer?.name || 'Developer';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-150 text-left relative
        ${isActive
          ? 'bg-white/8'
          : 'hover:bg-white/4'}`}
      style={isActive ? { background: 'rgba(168,85,247,0.12)' } : {}}>

      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
          style={{ background: 'linear-gradient(180deg,#a855f7,#f472b6)' }} />
      )}

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {convo.peer?.avatar ? (
          <img src={convo.peer.avatar} alt={name}
            className="w-11 h-11 rounded-full object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-semibold text-white truncate font-body">{name}</span>
          <span className="text-[10px] text-gray-500 font-mono flex-shrink-0 ml-2">{formatTime(convo.lastAt)}</span>
        </div>
        <p className={`text-xs truncate font-body ${convo.unread > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
          {convo.lastMessage}
        </p>
      </div>

      {/* Unread badge */}
      {convo.unread > 0 && (
        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white ml-1"
          style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
          {convo.unread > 99 ? '99+' : convo.unread}
        </span>
      )}
    </button>
  );
}

function Bubble({ msg, isMine, showAvatar, peerAvatar, peerName }) {
  const initials = (peerName || 'D').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Peer avatar — only shown on last message in a sequence */}
      {!isMine && (
        <div className="w-7 h-7 flex-shrink-0 mb-0.5">
          {showAvatar && (
            peerAvatar
              ? <img src={peerAvatar} alt={peerName} className="w-7 h-7 rounded-full object-cover" />
              : <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>{initials}</div>
          )}
        </div>
      )}

      <div className={`group flex flex-col gap-0.5 max-w-[65%] ${isMine ? 'items-end' : 'items-start'}`}>
        <div className={`px-3.5 py-2 text-sm font-body leading-relaxed break-words
          ${isMine
            ? 'text-white rounded-2xl rounded-br-sm'
            : 'text-gray-100 rounded-2xl rounded-bl-sm'}`}
          style={isMine
            ? { background: 'linear-gradient(135deg,#a855f7,#f472b6)' }
            : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {msg.text}
        </div>
        <span className="text-[10px] text-gray-500 font-mono px-1">
          {formatBubbleTime(msg.createdAt)}
        </span>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { peerId: urlPeerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [inbox, setInbox]               = useState([]);
  const [activePeer, setActivePeer]     = useState(null);
  const [messages, setMessages]         = useState([]);
  const [text, setText]                 = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [search, setSearch]             = useState('');
  const [mobileView, setMobileView]     = useState('list'); // 'list' | 'chat'

  const socketRef    = useRef(null);
  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const activeConvId = useRef(null);
  const textareaRef  = useRef(null);

  // ── Load inbox ─────────────────────────────────────────────────────────────
  const loadInbox = useCallback(async () => {
    try {
      const res = await api.get('/api/messages/inbox');
      setInbox(res.data);
    } catch { /* silent */ } finally {
      setInboxLoading(false);
    }
  }, []);

  // ── Open conversation ───────────────────────────────────────────────────────
  const openConversation = useCallback(async (pid) => {
    if (!pid || !user) return;
    setLoadingHistory(true);
    setMessages([]);
    setMobileView('chat');

    try {
      const [histRes, peerRes] = await Promise.all([
        api.get(`/api/messages/${pid}`),
        api.get(`/api/profile/user/${pid}`).catch(() => null)
      ]);
      const peer = peerRes?.data?.user || { _id: pid, name: 'Developer', avatar: '' };
      setActivePeer(peer);

      const myId = user.id || user._id;
      const [idA, idB] = [myId.toString(), pid.toString()].sort();
      activeConvId.current = `${idA}_${idB}`;

      setMessages(histRes.data);
      navigate(`/messages/${pid}`, { replace: true });

      // Mark read → refresh inbox badge
      setTimeout(loadInbox, 500);
    } catch { /* silent */ } finally {
      setLoadingHistory(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [user, navigate, loadInbox]);

  // ── Socket ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;
    socket.emit('dm_join', { userId: user.id || user._id });

    socket.on('dm_receive', (msg) => {
      if (msg.conversationId === activeConvId.current) {
        setMessages(prev => {
          // Swap optimistic → confirmed
          if (msg.sender?.toString() === (user.id || user._id)?.toString()) {
            const optIdx = prev.findIndex(m => m._id?.toString().startsWith('opt_') && m.text === msg.text);
            if (optIdx !== -1) {
              const next = [...prev];
              next[optIdx] = msg;
              return next;
            }
          }
          // Avoid exact duplicate
          if (prev.some(m => !m._id?.startsWith?.('opt_') && m._id?.toString() === msg._id?.toString())) return prev;
          return [...prev, msg];
        });
      }
      loadInbox();
    });

    return () => socket.disconnect();
  }, [user, loadInbox]);

  useEffect(() => { loadInbox(); }, [loadInbox]);

  useEffect(() => {
    if (urlPeerId && user) openConversation(urlPeerId);
  }, [urlPeerId, user]); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  // ── Send ────────────────────────────────────────────────────────────────────
  function sendMessage() {
    if (!text.trim() || !activePeer) return;
    const myId = user.id || user._id;
    const pId  = activePeer._id;

    const optimistic = {
      _id: `opt_${Date.now()}`,
      conversationId: activeConvId.current,
      sender: myId, receiver: pId,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimistic]);
    setText('');

    socketRef.current?.emit('dm_send', {
      senderId: myId,
      senderName: user.name,
      senderAvatar: user.avatar,
      receiverId: pId,
      text: optimistic.text
    });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const myId         = user?.id || user?._id;
  const grouped      = groupByDate(messages);
  const filteredInbox = inbox.filter(c =>
    !search || c.peer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 pt-[72px] flex" style={{ background: '#050508' }}>

      {/* ════ SIDEBAR ════════════════════════════════════════════════════════ */}
      <div className={`flex flex-col flex-shrink-0 border-r
        w-full md:w-[320px] lg:w-[360px]
        ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
        `}
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>

        {/* Sidebar header */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h1 className="font-display font-bold text-xl text-white mb-3">Messages</h1>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm font-body outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f0f8' }} />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {inboxLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-2 border-purple-500 rounded-full border-t-transparent animate-spin" />
            </div>
          ) : filteredInbox.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
              <MessageSquare size={28} className="text-gray-700" />
              {search
                ? <p className="text-sm text-gray-500 font-body">No results for "{search}"</p>
                : <>
                    <p className="text-sm text-gray-400 font-body font-medium">No conversations yet</p>
                    <p className="text-xs text-gray-600 font-body">Go to a developer's profile and tap <span className="text-purple-400">Message</span></p>
                    <Link to="/explore"
                      className="mt-1 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                      style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
                      Explore Developers
                    </Link>
                  </>
              }
            </div>
          ) : (
            filteredInbox.map(c => (
              <ConvoItem key={c.conversationId} convo={c}
                isActive={activePeer?._id?.toString() === c.peer?._id?.toString()}
                onClick={() => openConversation(c.peer?._id)} />
            ))
          )}
        </div>
      </div>

      {/* ════ CHAT PANEL ═════════════════════════════════════════════════════ */}
      <div className={`flex flex-col flex-1 min-w-0
        ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>

        {!activePeer ? (
          /* ── No chat selected ── */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-2"
              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
              <MessageSquare size={32} className="text-purple-400 opacity-60" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-white text-xl mb-2">Your messages</h2>
              <p className="text-sm text-gray-500 font-body">Select a conversation from the sidebar<br />or start a new one by visiting a profile.</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Chat header ── */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Back button (mobile) */}
              <button onClick={() => { setMobileView('list'); navigate('/messages'); }}
                className="md:hidden p-2 -ml-1 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-white flex-shrink-0">
                <ArrowLeft size={18} />
              </button>

              {/* Peer info */}
              <Link to={`/profile/${activePeer._id}`} className="flex items-center gap-3 min-w-0 flex-1 group">
                {activePeer.avatar
                  ? <img src={activePeer.avatar} alt={activePeer.name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
                      {(activePeer.name||'D').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                }
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white font-body group-hover:text-purple-300 transition-colors truncate">
                    {activePeer.name}
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono">tap to view profile</p>
                </div>
              </Link>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4"
              style={{ background: 'rgba(0,0,0,0.15)' }}>
              {loadingHistory ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 border-purple-500 rounded-full border-t-transparent animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <p className="text-sm text-gray-500 font-body">No messages yet</p>
                    <p className="text-xs text-gray-600 font-body">Say something 👋</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <AnimatePresence initial={false}>
                    {grouped.map((item, i) => {
                      if (item.type === 'divider') {
                        return (
                          <div key={item.key} className="flex items-center gap-3 my-3">
                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                            <span className="text-[10px] font-mono text-gray-600 px-2">{item.label}</span>
                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                          </div>
                        );
                      }
                      const msg    = item.msg;
                      const isMine = msg.sender?.toString() === myId?.toString();
                      // Show avatar only on the last message in a consecutive block from same sender
                      const nextItem = grouped[i + 1];
                      const nextMsg  = nextItem?.type === 'msg' ? nextItem.msg : null;
                      const showAvatar = !isMine && (!nextMsg || nextMsg.sender?.toString() !== msg.sender?.toString());

                      return (
                        <motion.div key={item.key}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}>
                          <Bubble msg={msg} isMine={isMine}
                            showAvatar={showAvatar}
                            peerAvatar={activePeer?.avatar}
                            peerName={activePeer?.name} />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* ── Input bar ── */}
            <div className="flex items-end gap-2 px-3 py-3 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex-1 flex items-end rounded-2xl px-4 py-2.5 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <textarea
                  ref={el => { inputRef.current = el; textareaRef.current = el; }}
                  rows={1} value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${activePeer.name?.split(' ')[0]}…`}
                  className="flex-1 bg-transparent outline-none resize-none text-sm font-body text-white placeholder-gray-600 leading-relaxed w-full"
                  style={{ maxHeight: '120px' }} />
              </div>
              <button onClick={sendMessage} disabled={!text.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
                style={{
                  background: text.trim() ? 'linear-gradient(135deg,#a855f7,#f472b6)' : 'rgba(255,255,255,0.06)',
                  boxShadow: text.trim() ? '0 0 16px rgba(168,85,247,0.35)' : 'none'
                }}>
                <Send size={15} className={text.trim() ? 'text-white' : 'text-gray-600'} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
