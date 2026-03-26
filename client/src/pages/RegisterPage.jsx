import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Code2, User, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be 6+ characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to DevForge 🚀');
      navigate('/edit-profile');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-dark w-full max-w-md p-8"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg,#2dd4bf,#a855f7)' }}>
            <Code2 size={24} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-1">Join DevForge</h1>
          <p className="text-gray-400 text-sm font-body">Start building with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-gray-400 mb-1.5 block">Full Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-glass pl-10" placeholder="Ada Lovelace" required />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-gray-400 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-glass pl-10" placeholder="you@example.com" required />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-gray-400 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-glass pl-10 pr-10" placeholder="Min. 6 characters" required />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><span>Create Account</span><ArrowRight size={14} /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6 font-body">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-light hover:text-white transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
