import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Code2, Menu, X, Zap, Users, HelpCircle, Layers, Compass } from 'lucide-react';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: Zap },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/projects', label: 'Projects', icon: Layers },
  { to: '/doubts', label: 'Doubts', icon: HelpCircle },
  { to: '/rooms', label: 'Rooms', icon: Users },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const logoTo = isAuthenticated ? '/dashboard' : '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-dark max-w-7xl mx-auto px-6 py-3 flex items-center justify-between"
        style={{ borderRadius: '16px' }}
      >
        {/* Logo */}
        <Link to={logoTo} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
            <Code2 size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg gradient-text">DevForge</span>
        </Link>

        {/* Desktop links */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200
                  ${location.pathname === to
                    ? 'bg-purple/20 text-purple-light border border-purple/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/profile/me" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-all">
                <img src={user?.avatar} alt={user?.name}
                  className="w-7 h-7 rounded-full border border-purple/40 object-cover" />
                <span className="text-sm font-body text-gray-300">{user?.name?.split(' ')[0]}</span>
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-sm py-2">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm py-2">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-2">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-all">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-dark mt-2 max-w-7xl mx-auto p-4 flex flex-col gap-2"
            style={{ borderRadius: '16px' }}
          >
            {isAuthenticated && navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-body hover:bg-white/5 transition-all text-gray-300 hover:text-white">
                <Icon size={16} />{label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="btn-ghost w-full mt-2">Logout</button>
            ) : (
              <div className="flex gap-2 mt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-ghost flex-1 text-center">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 text-center">Get Started</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
