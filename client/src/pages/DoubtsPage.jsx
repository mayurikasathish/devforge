import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, X, HelpCircle, ChevronUp, Eye, MessageSquare, Send, UserX } from 'lucide-react';

const ALL_TAGS = ['DSA','OS','DBMS','Networks','React','System Design','Python','Java','Web Dev','ML','DevOps','General'];

function DoubtCard({ doubt, onUpvote, onAnswerSubmit, userId }) {
  const [expanded, setExpanded] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [answerAnon, setAnswerAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hasUpvoted = doubt.upvotes?.includes(userId);

  const submitAnswer = async () => {
    if (!answerText.trim()) return;
    setSubmitting(true);
    try {
      await onAnswerSubmit(doubt._id, answerText, answerAnon);
      setAnswerText('');
      toast.success('Answer posted!');
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass-dark overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Upvote */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button onClick={() => onUpvote(doubt._id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${hasUpvoted ? 'text-purple bg-purple/15' : 'text-gray-600 hover:text-purple hover:bg-purple/10'}`}>
              <ChevronUp size={16} />
              <span className="text-xs font-mono">{doubt.upvotes?.length || 0}</span>
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {doubt.tags?.map(t => (
                <span key={t} className="tag text-[10px] px-2 py-0.5">{t}</span>
              ))}
              {doubt.anonymous && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-gray-600">
                  <UserX size={10} /> Anonymous
                </span>
              )}
            </div>
            <h3 className="font-display font-semibold text-white text-base leading-snug cursor-pointer hover:text-purple-light transition-colors"
              onClick={() => setExpanded(!expanded)}>
              {doubt.title}
            </h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 font-mono">
              <span className="flex items-center gap-1"><Eye size={11} /> {doubt.views}</span>
              <span className="flex items-center gap-1"><MessageSquare size={11} /> {doubt.answers?.length || 0} answers</span>
              <span>{new Date(doubt.date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-sm text-gray-300 font-body leading-relaxed whitespace-pre-wrap">{doubt.body}</p>

                {/* Answers */}
                {doubt.answers?.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-mono text-gray-500">{doubt.answers.length} answer{doubt.answers.length !== 1 ? 's' : ''}</p>
                    {doubt.answers.map((ans, i) => (
                      <div key={i} className="glass p-3 rounded-xl">
                        <div className="flex items-center gap-2 mb-1.5">
                          {ans.anonymous
                            ? <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center"><UserX size={12} className="text-gray-500" /></div>
                            : <img src={ans.user?.avatar} alt="" className="w-6 h-6 rounded-full" />}
                          <span className="text-xs font-mono text-gray-400">{ans.anonymous ? 'Anonymous' : ans.user?.name}</span>
                          <span className="text-xs text-gray-700">{new Date(ans.date).toLocaleDateString()}</span>
                          <span className="ml-auto text-xs font-mono text-purple-light">▲ {ans.upvotes?.length || 0}</span>
                        </div>
                        <p className="text-sm text-gray-300 font-body leading-relaxed">{ans.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer input */}
                <div className="mt-4 space-y-2">
                  <textarea value={answerText} onChange={e => setAnswerText(e.target.value)}
                    className="input-glass w-full resize-none text-sm" rows={2} placeholder="Write your answer..." />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer font-body">
                      <input type="checkbox" checked={answerAnon} onChange={e => setAnswerAnon(e.target.checked)} className="accent-purple" />
                      Answer anonymously
                    </label>
                    <button onClick={submitAnswer} disabled={submitting || !answerText.trim()}
                      className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 disabled:opacity-50">
                      <Send size={12} /> Post Answer
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function DoubtsPage() {
  const { user } = useAuth();
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTag, setActiveTag] = useState('');
  const [form, setForm] = useState({ title: '', body: '', tags: [], anonymous: true });
  const [submitting, setSubmitting] = useState(false);

  const load = async (tag = '') => {
    setLoading(true);
    try {
      const url = tag ? `/api/doubts?tag=${tag}` : '/api/doubts';
      const res = await api.get(url);
      setDoubts(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleTagFilter = t => {
    const next = activeTag === t ? '' : t;
    setActiveTag(next);
    load(next);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/api/doubts', form);
      setDoubts([{ ...res.data, user: { name: 'You', avatar: user?.avatar } }, ...doubts]);
      setShowForm(false);
      setForm({ title: '', body: '', tags: [], anonymous: true });
      toast.success('Doubt posted!');
    } catch { toast.error('Failed to post'); }
    finally { setSubmitting(false); }
  };

  const handleUpvote = async (id) => {
    try {
      await api.put(`/api/doubts/upvote/${id}`);
      setDoubts(doubts.map(d => {
        if (d._id !== id) return d;
        const has = d.upvotes?.includes(user?.id);
        return { ...d, upvotes: has ? d.upvotes.filter(u => u !== user?.id) : [...(d.upvotes || []), user?.id] };
      }));
    } catch {}
  };

  const handleAnswerSubmit = async (doubtId, text, anonymous) => {
    const res = await api.post(`/api/doubts/answer/${doubtId}`, { text, anonymous });
    setDoubts(doubts.map(d => d._id === doubtId ? { ...d, answers: res.data } : d));
  };

  const toggleFormTag = t => {
    setForm(f => ({
      ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-4xl text-white mb-1">
            Doubt <span className="gradient-text">Board</span>
          </h1>
          <p className="text-gray-400 font-body">Ask anonymously. Answer openly.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Post Doubt'}
        </button>
      </motion.div>

      {/* Post Doubt Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <form onSubmit={handleSubmit} className="glass-dark p-6 space-y-4">
              <h2 className="font-display font-semibold text-white">Ask a Question</h2>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="input-glass w-full" placeholder="Your question in one line..." required />
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
                className="input-glass w-full resize-none" rows={4} placeholder="Explain the problem in detail..." required />
              <div>
                <p className="text-xs font-mono text-gray-400 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TAGS.map(t => (
                    <button type="button" key={t} onClick={() => toggleFormTag(t)}
                      className={`tag text-xs cursor-pointer transition-all ${form.tags.includes(t) ? 'bg-purple/30 border-purple/60 text-white' : ''}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer font-body">
                  <input type="checkbox" checked={form.anonymous} onChange={e => setForm({ ...form, anonymous: e.target.checked })} className="accent-purple" />
                  Post anonymously
                </label>
                <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 py-2.5">
                  {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HelpCircle size={14} />}
                  Post Doubt
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tag Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => handleTagFilter('')}
          className={`tag cursor-pointer transition-all ${!activeTag ? 'bg-purple/30 border-purple/60 text-white' : ''}`}>All</button>
        {ALL_TAGS.map(t => (
          <button key={t} onClick={() => handleTagFilter(t)}
            className={`tag cursor-pointer transition-all ${activeTag === t ? 'bg-purple/30 border-purple/60 text-white' : ''}`}>{t}</button>
        ))}
      </div>

      {/* Doubts List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-purple rounded-full border-t-transparent animate-spin" />
        </div>
      ) : doubts.length === 0 ? (
        <div className="text-center py-16 text-gray-500 font-body">No doubts yet. Be the first to ask!</div>
      ) : (
        <motion.div layout className="space-y-4">
          {doubts.map(d => (
            <DoubtCard key={d._id} doubt={d} onUpvote={handleUpvote}
              onAnswerSubmit={handleAnswerSubmit} userId={user?.id} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
