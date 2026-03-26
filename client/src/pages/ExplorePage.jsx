import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { Search, Star, MapPin, Github } from 'lucide-react';

const SKILL_FILTERS = ['React','Node.js','Python','Java','TypeScript','MongoDB','Next.js','Docker','AWS','DSA','ML','C++'];

function DevCard({ profile }) {
  const { user, status, skills, location, githubusername, availability } = profile;
  const availColor = availability === 'available' ? '#4ade80' : availability === 'open_to_collaborate' ? '#facc15' : '#f87171';
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
      <Link to={`/profile/${user._id}`} className="glass-dark p-5 card-hover flex flex-col gap-4 block">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <img src={user.avatar} alt={user.name}
              className="w-12 h-12 rounded-full border border-purple/30 object-cover" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-black"
              style={{ background: availColor }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-white text-sm truncate">{user.name}</h3>
            <p className="text-xs text-gray-500 font-body truncate">{status}</p>
            {location && (
              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                <MapPin size={10} />{location}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {skills?.slice(0, 4).map(s => (
            <span key={s.name} className="tag text-[10px] flex items-center gap-1">
              {s.name}
              <span className="flex gap-px">
                {[1,2,3].map(i => <Star key={i} size={7} className={i <= Math.ceil((s.level||3)/2) ? 'fill-pink text-pink' : 'text-gray-700'} />)}
              </span>
            </span>
          ))}
          {skills?.length > 4 && <span className="text-[10px] text-gray-600 font-mono">+{skills.length - 4}</span>}
        </div>
        {githubusername && (
          <div className="flex items-center gap-1 text-xs text-gray-600 font-mono">
            <Github size={11} />{githubusername}
          </div>
        )}
      </Link>
    </motion.div>
  );
}

export default function ExplorePage() {
  const [profiles, setProfiles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/profile').then(res => {
      setProfiles(res.data);
      setFiltered(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = profiles;
    if (activeFilter) {
      result = result.filter(p => p.skills?.some(s => s.name.toLowerCase().includes(activeFilter.toLowerCase())));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.user.name.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q) ||
        p.skills?.some(s => s.name.toLowerCase().includes(q)) ||
        p.location?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, activeFilter, profiles]);

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display font-bold text-4xl text-white mb-1">
          Explore <span className="gradient-text">Developers</span>
        </h1>
        <p className="text-gray-400 font-body">Find your next collaborator</p>
      </motion.div>

      {/* Search + Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }} className="mb-8 space-y-4">
        <div className="relative max-w-xl">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-glass pl-11 py-3.5" placeholder="Search by name, skill, location..." />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveFilter('')}
            className={`tag cursor-pointer transition-all ${!activeFilter ? 'bg-purple/30 border-purple/60 text-white' : 'hover:bg-purple/20'}`}>
            All
          </button>
          {SKILL_FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(activeFilter === f ? '' : f)}
              className={`tag cursor-pointer transition-all ${activeFilter === f ? 'bg-purple/30 border-purple/60 text-white' : 'hover:bg-purple/20'}`}>
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple rounded-full border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500 font-body">
          No developers found matching your search.
        </div>
      ) : (
        <>
          <p className="text-xs font-mono text-gray-600 mb-4">{filtered.length} developer{filtered.length !== 1 ? 's' : ''} found</p>
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(p => <DevCard key={p._id} profile={p} />)}
          </motion.div>
        </>
      )}
    </div>
  );
}
