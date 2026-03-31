import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Star, Users, Layers, Zap, ArrowRight, TrendingUp } from 'lucide-react';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

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

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [suggested, setSuggested] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, projectsRes] = await Promise.all([
          api.get('/api/profile/me').catch(() => ({ data: null })),
          api.get('/api/projects').catch(() => ({ data: [] }))
        ]);
        setProfile(profileRes.data);
        setProjects(projectsRes.data.slice(0, 3));
        if (profileRes.data?.skills?.length) {
          const skills = profileRes.data.skills.map(s => s.name).join(',');
          const sugRes = await api.get(`/api/profile/match/${skills}`).catch(() => ({ data: [] }));
          setSuggested(sugRes.data.slice(0, 4));
        } else {
          const allRes = await api.get('/api/profile').catch(() => ({ data: [] }));
          setSuggested(allRes.data.filter(p => p.user._id !== user?._id).slice(0, 4));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const radarData = profile?.skills?.slice(0, 6).map(s => ({
    skill: s.name?.length > 8 ? s.name.slice(0, 8) : s.name,
    value: (s.level || 3) * 20
  })) || [];

  if (loading) return (
    <div className="min-h-screen pt-28 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple rounded-full border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="font-display font-bold text-4xl text-white">
          Hey, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 
        </h1>
        <p className="text-gray-400 font-body mt-2">Here's what's happening in your forge.</p>
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

        {/* Skill Radar */}
        <motion.div variants={fadeUp} className="glass-dark p-6 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: '#a855f7' }} />
            <h2 className="font-display font-semibold text-white">Skill Radar</h2>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'DM Sans' }} />
                <Radar dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,12,30,0.95)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, fontSize: 12 }}
                  formatter={v => [`${v / 20}/5`, 'Level']}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-gray-600 text-sm">
              <Zap size={32} className="mb-2 opacity-30" />
              <span>Add skills to see your radar</span>
            </div>
          )}

          {/* Skills list */}
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

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
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
            {suggested.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggested.map(p => (
                  <Link key={p._id} to={`/profile/${p.user._id}`}
                    className="glass p-4 rounded-xl card-hover flex items-center gap-3 group">
                    <img src={p.user.avatar} alt={p.user.name}
                      className="w-10 h-10 rounded-full border border-purple/30 object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-display font-semibold text-white truncate">{p.user.name}</div>
                      <div className="text-xs text-gray-500 font-body truncate">{p.status}</div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {p.skills?.slice(0, 2).map(s => (
                          <span key={s.name} className="tag text-[10px] px-2 py-0.5">{s.name}</span>
                        ))}
                      </div>
                    </div>
                    <div className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${p.availability === 'available' ? 'bg-green-400' : p.availability === 'open_to_collaborate' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                  </Link>
                ))}
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
                {projects.map(proj => (
                  <div key={proj._id} className="glass p-4 rounded-xl card-hover">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-display font-semibold text-white">{proj.title}</h3>
                        <p className="text-xs text-gray-500 font-body mt-0.5 line-clamp-1">{proj.description}</p>
                      </div>
                      <span className="tag-aqua text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-mono"
                        style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)', color: '#5eead4' }}>
                        {proj.status}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {proj.techStack?.slice(0, 4).map(t => <span key={t} className="tag text-[10px]">{t}</span>)}
                    </div>
                  </div>
                ))}
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
