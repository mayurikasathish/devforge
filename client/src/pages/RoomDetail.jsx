import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Send, Plus, Trash2, CheckSquare, Circle, Clock,
  ArrowLeft, Code2, MessageSquare, ClipboardList,
  Link2, FileText, ExternalLink, X, Copy, Play,
  ChevronDown, Users, Loader
} from 'lucide-react';

// ─── Piston API for code execution ───────────────────────────────────────────
const PISTON_LANGS = {
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3'   },
  python:     { language: 'python',     version: '3.10.0'  },
  java:       { language: 'java',       version: '15.0.2'  },
  cpp:        { language: 'c++',        version: '10.2.0'  },
  go:         { language: 'go',         version: '1.16.2'  },
  rust:       { language: 'rust',       version: '1.50.0'  },
  bash:       { language: 'bash',       version: '5.2.0'   },
};

async function runCode(lang, code) {
  const cfg = PISTON_LANGS[lang];
  if (!cfg) return { output: `Execution not supported for ${lang}`, error: true };
  try {
    const res = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: cfg.language,
        version:  cfg.version,
        files: [{ name: 'main', content: code }],
        stdin: '',        // provide empty stdin so cin/input() don't hang
        run_timeout: 5000 // 5s max
      })
    });
    if (!res.ok) return { output: `API error: ${res.status}`, error: true };
    const data = await res.json();
    const run  = data.run || {};
    // Piston returns stdout, stderr and combines into output
    const stdout = run.stdout || '';
    const stderr = run.stderr || '';
    const out    = stdout + stderr;
    const isErr  = run.code !== 0 || (!stdout && !!stderr);
    return { output: out.trim() || '(no output)', error: isErr };
  } catch (e) {
    return { output: 'Network error — could not reach execution API', error: true };
  }
}

// ─── Code editor ─────────────────────────────────────────────────────────────
function CodeEditor({ value, onChange, lang, onLangChange }) {
  const textareaRef = useRef(null);
  const lineNumRef  = useRef(null);
  const [running, setRunning]   = useState(false);
  const [output, setOutput]     = useState(null); // { output, error }
  const [showOutput, setShowOutput] = useState(false);

  const LANGS = ['javascript','typescript','python','java','cpp','go','rust','html','css','sql','bash'];

  const syncScroll = () => {
    if (lineNumRef.current && textareaRef.current)
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
  };

  const lineCount = (value || '').split('\n').length;

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = e.target.selectionStart, end = e.target.selectionEnd;
      onChange(value.substring(0, s) + '  ' + value.substring(end));
      setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 2; }, 0);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setShowOutput(true);
    setOutput(null);
    try {
      const result = await runCode(lang, value);
      setOutput(result);
    } catch {
      setOutput({ output: 'Execution failed. Check your connection.', error: true });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <select value={lang} onChange={e => onLangChange(e.target.value)}
            className="text-xs font-mono bg-transparent text-gray-400 border border-white/10 rounded px-2 py-0.5 outline-none cursor-pointer">
            {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { navigator.clipboard.writeText(value); toast.success('Copied!'); }}
            className="flex items-center gap-1.5 text-xs font-mono text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5">
            <Copy size={11} /> Copy
          </button>
          {PISTON_LANGS[lang] && (
            <button onClick={handleRun} disabled={running || !value.trim()}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)', color: '#fff' }}>
              {running ? <Loader size={11} className="animate-spin" /> : <Play size={11} />}
              {running ? 'Running…' : 'Run'}
            </button>
          )}
          {showOutput && (
            <button onClick={() => setShowOutput(!showOutput)}
              className="text-xs font-mono text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5">
              {showOutput ? 'Hide output' : 'Show output'}
            </button>
          )}
        </div>
      </div>

      {/* Editor + output split */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Editor */}
        <div className={`flex font-mono overflow-hidden ${showOutput ? 'flex-1' : 'h-full'}`}
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          {/* Line numbers */}
          <div ref={lineNumRef}
            className="flex flex-col text-right pr-3 pt-4 pb-4 select-none overflow-hidden flex-shrink-0"
            style={{ minWidth: '44px', color: 'rgba(255,255,255,0.2)', fontSize: '12px', lineHeight: '1.6' }}>
            {Array.from({ length: lineCount }, (_, i) => <span key={i}>{i + 1}</span>)}
          </div>
          <textarea ref={textareaRef} value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown} onScroll={syncScroll}
            spellCheck={false}
            className="flex-1 bg-transparent text-gray-100 outline-none resize-none py-4 pr-4 leading-relaxed"
            style={{ fontSize: '13px', lineHeight: '1.6', caretColor: '#a855f7', tabSize: 2 }}
            placeholder="// Start coding together..." />
        </div>

        {/* Output panel */}
        {showOutput && (
          <div className="flex-shrink-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between px-4 py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1.5">
                <Play size={10} /> Output
              </span>
              {output && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  output.error ? 'text-red-400 bg-red-400/10' : 'text-green-400 bg-green-400/10'}`}>
                  {output.error ? 'error' : 'success'}
                </span>
              )}
            </div>
            <div className="px-4 py-3 font-mono text-xs overflow-y-auto" style={{ maxHeight: '160px' }}>
              {running ? (
                <span className="text-gray-500 animate-pulse">Executing...</span>
              ) : output ? (
                <pre className={`whitespace-pre-wrap leading-relaxed ${output.error ? 'text-red-400' : 'text-green-300'}`}>
                  {output.output}
                </pre>
              ) : (
                <span className="text-gray-600">Run your code to see output here</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Task board ───────────────────────────────────────────────────────────────
const COL_CONFIG = {
  todo:        { label: 'To Do',       color: '#9ca3af', bg: 'rgba(156,163,175,0.1)',  border: 'rgba(156,163,175,0.2)',  icon: Circle      },
  in_progress: { label: 'In Progress', color: '#f472b6', bg: 'rgba(244,114,182,0.1)',  border: 'rgba(244,114,182,0.25)', icon: Clock       },
  done:        { label: 'Done',        color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.2)',   icon: CheckSquare },
};

function TaskBoard({ tasks, onUpdate, members }) {
  const [newTitle, setNewTitle]             = useState('');
  const [assignDropdown, setAssignDropdown] = useState(null);

  const addTask = () => {
    if (!newTitle.trim()) return;
    onUpdate([...tasks, {
      id: Date.now().toString(), title: newTitle.trim(),
      description: '', status: 'todo',
      assigneeId: '', assigneeName: '', createdAt: new Date().toISOString()
    }]);
    setNewTitle('');
  };

  const moveTask    = (id, status) => onUpdate(tasks.map(t => t.id === id ? { ...t, status } : t));
  const deleteTask  = (id)         => onUpdate(tasks.filter(t => t.id !== id));
  const assignTask  = (taskId, member) => {
    onUpdate(tasks.map(t => t.id === taskId ? { ...t, assigneeId: member._id || '', assigneeName: member.name || '' } : t));
    setAssignDropdown(null);
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Add task input */}
      <div className="flex gap-2 flex-shrink-0">
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          className="input-glass flex-1 py-2.5 text-sm" placeholder="Add a task and press Enter…" />
        <button onClick={addTask} className="btn-primary py-2.5 px-4 text-sm flex items-center gap-1.5">
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {Object.entries(COL_CONFIG).map(([col, cfg]) => {
          const Icon     = cfg.icon;
          const colTasks = tasks.filter(t => t.status === col);
          return (
            <div key={col} className="flex flex-col min-h-0 rounded-2xl overflow-hidden"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              {/* Column header */}
              <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
                style={{ borderBottom: `1px solid ${cfg.border}` }}>
                <Icon size={14} style={{ color: cfg.color }} />
                <span className="text-sm font-display font-semibold" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                <span className="ml-auto text-xs font-mono font-bold px-2 py-0.5 rounded-full"
                  style={{ color: cfg.color, background: 'rgba(0,0,0,0.25)' }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Task cards */}
              <div className="flex flex-col gap-2 p-3 overflow-y-auto flex-1">
                {colTasks.length === 0 && (
                  <p className="text-[11px] font-mono text-center py-4" style={{ color: cfg.color, opacity: 0.4 }}>
                    No tasks
                  </p>
                )}
                {colTasks.map(task => (
                  <div key={task.id} className="glass p-3 rounded-xl group relative flex flex-col gap-2"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-sm text-gray-200 font-body leading-relaxed pr-5">{task.title}</p>

                    {/* Assignee */}
                    <div className="relative">
                      <button onClick={() => setAssignDropdown(assignDropdown === task.id ? null : task.id)}
                        className="flex items-center gap-1.5 text-[11px] font-mono transition-colors hover:text-purple-300"
                        style={{ color: task.assigneeName ? '#c084fc' : '#6b7280' }}>
                        {task.assigneeName ? (
                          <><div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
                              {task.assigneeName[0]}
                            </div>
                            {task.assigneeName.split(' ')[0]}</>
                        ) : '+ assign'}
                      </button>
                      {assignDropdown === task.id && (
                        <div className="absolute left-0 top-6 z-30 glass-dark rounded-xl p-1.5 min-w-[150px] shadow-2xl"
                          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          <button onClick={() => assignTask(task.id, {})}
                            className="w-full text-left text-xs font-mono text-gray-500 px-3 py-1.5 hover:bg-white/5 rounded-lg">
                            Unassign
                          </button>
                          {members.map(m => (
                            <button key={m._id} onClick={() => assignTask(task.id, m)}
                              className="w-full flex items-center gap-2 text-left text-xs font-mono text-gray-300 px-3 py-1.5 hover:bg-white/5 rounded-lg">
                              <img src={m.avatar} className="w-4 h-4 rounded-full object-cover" alt="" />
                              {m.name.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Move buttons */}
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(COL_CONFIG).filter(([c]) => c !== col).map(([c, cc]) => (
                        <button key={c} onClick={() => moveTask(task.id, c)}
                          className="text-[10px] font-mono px-2 py-1 rounded-lg transition-all hover:opacity-100 opacity-60"
                          style={{ background: cc.bg, border: `1px solid ${cc.border}`, color: cc.color }}>
                          → {cc.label}
                        </button>
                      ))}
                    </div>

                    <button onClick={() => deleteTask(task.id)}
                      className="absolute top-2.5 right-2.5 text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Notes + Links ────────────────────────────────────────────────────────────
function NotesLinks({ notes, onNotesChange, links, onAddLink, onRemoveLink }) {
  const [linkForm, setLinkForm]       = useState({ label: '', url: '' });
  const [showLinkForm, setShowLinkForm] = useState(false);

  const submitLink = () => {
    if (!linkForm.url.trim()) return;
    let url = linkForm.url.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    onAddLink({ label: linkForm.label || url, url });
    setLinkForm({ label: '', url: '' });
    setShowLinkForm(false);
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto">
      <div className="glass-dark rounded-xl p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link2 size={14} className="text-purple-400" />
            <span className="text-sm font-display font-semibold text-white">Pinned Links</span>
          </div>
          <button onClick={() => setShowLinkForm(!showLinkForm)}
            className="text-xs font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
            <Plus size={11} /> Add
          </button>
        </div>
        <AnimatePresence>
          {showLinkForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
              <div className="flex flex-col gap-2 p-3 rounded-xl"
                style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
                <input value={linkForm.label} onChange={e => setLinkForm({ ...linkForm, label: e.target.value })}
                  className="input-glass text-xs py-1.5" placeholder="Label (optional)" />
                <input value={linkForm.url} onChange={e => setLinkForm({ ...linkForm, url: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && submitLink()}
                  className="input-glass text-xs py-1.5" placeholder="https://..." />
                <div className="flex gap-2">
                  <button onClick={submitLink} className="btn-primary text-xs py-1.5 px-3 flex-1">Pin Link</button>
                  <button onClick={() => setShowLinkForm(false)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {links.length === 0
          ? <p className="text-xs text-gray-600 font-mono text-center py-3">No pinned links yet</p>
          : <div className="flex flex-col gap-2">
              {links.map(link => (
                <div key={link.id} className="flex items-center gap-2 px-3 py-2 rounded-xl group"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Link2 size={11} className="text-gray-600 flex-shrink-0" />
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-xs font-mono text-purple-300 hover:text-purple-200 truncate flex items-center gap-1 transition-colors">
                    {link.label} <ExternalLink size={9} className="flex-shrink-0" />
                  </a>
                  <button onClick={() => onRemoveLink(link.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
        }
      </div>
      <div className="glass-dark rounded-xl p-4 flex flex-col flex-1 min-h-[240px]">
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <FileText size={14} className="text-pink-400" />
          <span className="text-sm font-display font-semibold text-white">Shared Notes</span>
          <span className="text-[10px] font-mono text-gray-600 ml-auto">synced live</span>
        </div>
        <textarea value={notes} onChange={e => onNotesChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-gray-300 font-body outline-none resize-none leading-relaxed placeholder-gray-700"
          placeholder="Shared notes, meeting minutes, ideas..." />
      </div>
    </div>
  );
}

// ─── Members dropdown ─────────────────────────────────────────────────────────
function MembersDropdown({ members, onlineUsers, myId }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);
  const onlineIds       = new Set(onlineUsers.map(u => u.userId?.toString()));
  const onlineCount     = onlineUsers.filter(u => u.userId?.toString() !== myId).length;

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all">
        {/* Stacked avatars */}
        <div className="flex items-center">
          {members.slice(0, 4).map((m, i) => {
            const isOnline = onlineIds.has(m._id?.toString());
            return (
              <div key={m._id} className="relative"
                style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: members.length - i }}>
                <img src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`}
                  alt={m.name}
                  className="w-7 h-7 rounded-full border-2 object-cover"
                  style={{ borderColor: isOnline ? '#4ade80' : 'rgba(20,20,30,1)',
                           opacity: isOnline ? 1 : 0.5 }} />
              </div>
            );
          })}
          {members.length > 4 && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono text-gray-400 border-2"
              style={{ marginLeft: '-8px', background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(20,20,30,1)' }}>
              +{members.length - 4}
            </div>
          )}
        </div>
        <span className="text-xs font-mono text-gray-400">{onlineCount} online</span>
        <ChevronDown size={12} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-10 z-50 w-56 glass-dark rounded-2xl overflow-hidden shadow-2xl"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Users size={13} className="text-purple-400" />
              <span className="text-xs font-display font-semibold text-white">Members ({members.length})</span>
            </div>
            <div className="py-1.5 max-h-72 overflow-y-auto">
              {members.map(m => {
                const isOnline = onlineIds.has(m._id?.toString());
                return (
                  <div key={m._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/4 transition-all">
                    <div className="relative flex-shrink-0">
                      <img src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`}
                        alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black
                        ${isOnline ? 'bg-green-400' : 'bg-gray-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-body font-medium text-white truncate">{m.name}</p>
                      {m._id?.toString() === myId && (
                        <span className="text-[9px] font-mono text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-full">you</span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono" style={{ color: isOnline ? '#4ade80' : '#6b7280' }}>
                      {isOnline ? (m._id?.toString() === myId ? 'active now' : 'online') : 'offline'}
                    </p>
                  </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'chat',  label: '💬 Chat'  },
  { key: 'code',  label: '💻 Code'  },
  { key: 'tasks', label: '📋 Tasks' },
  { key: 'notes', label: '📌 Notes' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('chat');
  const [messages, setMessages]       = useState([]);
  const [msgInput, setMsgInput]       = useState('');
  const [tasks, setTasks]             = useState([]);
  const [code, setCode]               = useState('// Start collaborating...\n');
  const [codeLang, setCodeLang]       = useState('javascript');
  const [notes, setNotes]             = useState('');
  const [links, setLinks]             = useState([]);
  const [connected, setConnected]     = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unread, setUnread]           = useState({ chat: 0, code: 0, tasks: 0, notes: 0 });

  const socketRef      = useRef(null);
  const messagesEndRef = useRef(null);
  const codeDebounce   = useRef(null);
  const notesDebounce  = useRef(null);
  const activeTabRef   = useRef('chat');
  // Track if we sent the last message — prevents double-render

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  const bumpUnread = (tab) => {
    if (activeTabRef.current !== tab)
      setUnread(prev => ({ ...prev, [tab]: prev[tab] + 1 }));
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setUnread(prev => ({ ...prev, [tab]: 0 }));
  };

  useEffect(() => {
    api.get(`/api/rooms/${id}`).then(res => {
      const r = res.data;
      setRoom(r);
      setTasks(r.tasks || []);
      setCode(r.codeContent || '// Start collaborating...\n');
      setCodeLang(r.codeLang || 'javascript');
      setNotes(r.notes || '');
      setLinks(r.pinnedLinks || []);
      setLoading(false);

      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        transports: ['websocket']
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        socket.emit('join_room', {
          roomId: id, userName: user?.name,
          userId: user?.id || user?._id, avatar: user?.avatar
        });
      });

      // Bug 3 fix: chat_history comes as array inside msgs object now
      socket.on('chat_history', msgs => {
        const list = Array.isArray(msgs) ? msgs : (msgs?.msgs || []);
        setMessages(list);
      });

      socket.on('presence_update', users => setOnlineUsers(users));

      socket.on('receive_message', msg => {
        setMessages(prev => [...prev, msg]);
        bumpUnread('chat');
      });

      socket.on('user_joined', ({ userName }) => {
        if (userName === user?.name) return; // don't show own join message
        setMessages(prev => [...prev, {
          system: true, message: `${userName} joined the room`, time: new Date().toISOString()
        }]);
      });

      socket.on('user_left', ({ userName }) => {
        if (userName) setMessages(prev => [...prev, {
          system: true, message: `${userName} left the room`, time: new Date().toISOString()
        }]);
      });

      socket.on('tasks_updated', updated => { setTasks(updated); bumpUnread('tasks'); });
      socket.on('code_update',   ({ content, lang }) => { setCode(content); if (lang) setCodeLang(lang); bumpUnread('code'); });
      socket.on('notes_update',  ({ notes: n })      => { setNotes(n); bumpUnread('notes'); });
      socket.on('links_update',  ({ links: l })      => setLinks(l));
      socket.on('disconnect',    ()                  => setConnected(false));

    }).catch(() => { toast.error('Room not found'); navigate('/rooms'); });

    return () => socketRef.current?.disconnect();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const sendMessage = () => {
    if (!msgInput.trim() || !socketRef.current || !connected) return;
    const text = msgInput.trim();
    // Add optimistically
    setMessages(prev => [...prev, {
      message: text, userName: user?.name, avatar: user?.avatar,
      time: new Date().toISOString()
    }]);
    socketRef.current.emit('send_message', {
      roomId: id, message: text, userName: user?.name, avatar: user?.avatar
    });
    setMsgInput('');
  };

  const updateTasks = (newTasks) => {
    setTasks(newTasks);
    socketRef.current?.emit('task_update', { roomId: id, tasks: newTasks });
    api.put(`/api/rooms/tasks/${id}`, { tasks: newTasks }).catch(() => {});
  };

  const handleCodeChange = (content) => {
    setCode(content);
    socketRef.current?.emit('code_change', { roomId: id, content, lang: codeLang });
    clearTimeout(codeDebounce.current);
    codeDebounce.current = setTimeout(() => {
      api.put(`/api/rooms/code/${id}`, { content, lang: codeLang }).catch(() => {});
    }, 1500);
  };

  const handleLangChange = (lang) => {
    setCodeLang(lang);
    socketRef.current?.emit('code_change', { roomId: id, content: code, lang });
    api.put(`/api/rooms/code/${id}`, { content: code, lang }).catch(() => {});
  };

  const handleNotesChange = (val) => {
    setNotes(val);
    socketRef.current?.emit('notes_change', { roomId: id, notes: val });
    clearTimeout(notesDebounce.current);
    notesDebounce.current = setTimeout(() => {
      api.put(`/api/rooms/notes/${id}`, { notes: val }).catch(() => {});
    }, 1500);
  };

  const handleAddLink = async ({ label, url }) => {
    try {
      const res = await api.post(`/api/rooms/link/${id}`, { label, url });
      setLinks(res.data);
      socketRef.current?.emit('links_change', { roomId: id, links: res.data });
    } catch { toast.error('Could not pin link'); }
  };

  // Leave room
  const handleLeave = async () => {
    if (!window.confirm('Leave this room?')) return;
    try {
      await api.put(`/api/rooms/leave/${id}`);
      toast.success('Left room');
      navigate('/rooms');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not leave room');
    }
  };

  const handleRemoveLink = async (linkId) => {
    try {
      const res = await api.delete(`/api/rooms/link/${id}/${linkId}`);
      setLinks(res.data);
      socketRef.current?.emit('links_change', { roomId: id, links: res.data });
    } catch { toast.error('Could not remove link'); }
  };

  if (loading) return (
    <div className="min-h-screen pt-28 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple rounded-full border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="fixed inset-0 pt-[72px] flex flex-col" style={{ background: '#050508' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/rooms')}
          className="p-2 rounded-xl hover:bg-white/5 transition-all text-gray-400 hover:text-white flex-shrink-0">
          <ArrowLeft size={17} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            <h1 className="font-display font-bold text-lg text-white truncate">{room?.title}</h1>
          </div>
          {room?.goal && <p className="text-[11px] font-mono text-purple-300 truncate">🎯 {room.goal}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <MembersDropdown members={room?.members || []} onlineUsers={onlineUsers}
              myId={(user?.id || user?._id)?.toString()} />
          {/* Only show Leave if not the creator */}
          {room?.creator?._id?.toString() !== (user?.id || user?._id)?.toString() && (
            <button onClick={handleLeave}
              className="text-xs font-mono px-3 py-1.5 rounded-xl transition-all text-red-400 hover:bg-red-400/10 border border-red-400/20 hover:border-red-400/40">
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => switchTab(key)}
            className={`relative px-4 py-2 rounded-xl text-sm font-body font-medium transition-all
              ${activeTab === key
                ? 'bg-purple/20 text-purple-light border border-purple/40'
                : 'text-gray-500 hover:text-gray-300 border border-transparent hover:border-white/10'}`}>
            {label}
            {unread[key] > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
                {unread[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-600 text-sm font-body py-12">No messages yet. Start the conversation!</div>
              )}
              {messages.map((msg, i) => {
                if (msg.system) return (
                  <div key={i} className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <span className="text-[10px] font-mono text-gray-600">{msg.message}</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                );
                const isMe = msg.userName === user?.name;
                return (
                  <div key={i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <img src={msg.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.userName}`}
                      alt="" className="w-7 h-7 rounded-full flex-shrink-0 object-cover mb-0.5" />
                    <div className={`flex flex-col gap-0.5 max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && <span className="text-[10px] font-mono text-gray-500 px-1">{msg.userName}</span>}
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm font-body leading-relaxed
                        ${isMe ? 'rounded-br-sm text-white' : 'rounded-bl-sm text-gray-200'}`}
                        style={isMe
                          ? { background: 'linear-gradient(135deg,#a855f7,#f472b6)' }
                          : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {msg.message}
                      </div>
                      <span className="text-[10px] font-mono text-gray-700 px-1">
                        {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex items-end gap-2 px-4 py-3 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex-1 flex items-end rounded-2xl px-4 py-2.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <textarea rows={1} value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type a message…"
                  className="flex-1 bg-transparent text-sm font-body text-white outline-none resize-none placeholder-gray-600 leading-relaxed w-full"
                  style={{ maxHeight: '100px' }} />
              </div>
              <button onClick={sendMessage} disabled={!msgInput.trim() || !connected}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-25"
                style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
                <Send size={15} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="h-full flex flex-col">
            <CodeEditor value={code} onChange={handleCodeChange}
              lang={codeLang} onLangChange={handleLangChange} />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="h-full p-4 overflow-hidden">
            <TaskBoard tasks={tasks} onUpdate={updateTasks} members={room?.members || []} />
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="h-full p-4 overflow-y-auto">
            <NotesLinks notes={notes} onNotesChange={handleNotesChange}
              links={links} onAddLink={handleAddLink} onRemoveLink={handleRemoveLink} />
          </div>
        )}
      </div>
    </div>
  );
}
