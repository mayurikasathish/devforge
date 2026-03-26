import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Star, Github, ExternalLink, Twitter, Linkedin, MapPin, Globe, Edit2, Briefcase, GraduationCap, Code2, Zap } from 'lucide-react';

function SkillStars({ level }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11}
          className={i <= level ? 'fill-pink text-pink' : 'text-gray-700'}
          style={i <= level ? { filter: 'drop-shadow(0 0 3px rgba(244,114,182,0.7))' } : {}} />
      ))}
    </div>
  );
}

const MOCK_LEETCODE = { solved: 214, easy: 98, medium: 87, hard: 29, streak: 12 };

export default function ProfilePage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMe = !id || id === 'me';

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = isMe
          ? await api.get('/api/profile/me')
          : await api.get(`/api/profile/user/${id}`);
        setProfile(profileRes.data);
        const ghUser = profileRes.data.githubusername;
        if (ghUser) {
          api.get(`/api/github/${ghUser}`).then(r => setRepos(r.data || [])).catch(() => {});
        }
      } catch {
        if (isMe) navigate('/edit-profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen pt-28 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple rounded-full border-t-transparent animate-spin" />
    </div>
  );
  if (!profile) return (
    <div className="min-h-screen pt-28 flex items-center justify-center text-gray-400">Profile not found.</div>
  );

  const { user: profileUser, skills, experience, education, bio, status, location, website,
    githubusername, leetcodeusername, availability, social } = profile;

  const radarData = skills?.slice(0, 6).map(s => ({
    skill: s.name?.length > 8 ? s.name.slice(0, 8) : s.name,
    value: (s.level || 3) * 20
  })) || [];

  const availColor = availability === 'available' ? '#4ade80' : availability === 'open_to_collaborate' ? '#facc15' : '#f87171';
  const availLabel = availability === 'available' ? 'Available' : availability === 'open_to_collaborate' ? 'Open to Collaborate' : 'Busy';

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN - Bio Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-dark p-6 text-center">
            <div className="relative inline-block mb-4">
              <img src={profileUser?.avatar} alt={profileUser?.name}
                className="w-24 h-24 rounded-full border-2 object-cover mx-auto"
                style={{ borderColor: 'rgba(168,85,247,0.5)', boxShadow: '0 0 30px rgba(168,85,247,0.2)' }} />
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-black"
                style={{ background: availColor }} />
            </div>
            <h1 className="font-display font-bold text-2xl text-white mb-1">{profileUser?.name}</h1>
            <p className="text-sm font-mono text-purple-light mb-2">{status}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono mb-4"
              style={{ background: `${availColor}15`, border: `1px solid ${availColor}30`, color: availColor }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: availColor }} />
              {availLabel}
            </div>
            {bio && <p className="text-gray-400 text-sm font-body leading-relaxed mb-4">{bio}</p>}
            <div className="space-y-2 text-left">
              {location && (
                <div className="flex items-center gap-2 text-sm text-gray-400 font-body">
                  <MapPin size={13} className="text-gray-500 flex-shrink-0" />{location}
                </div>
              )}
              {website && (
                <a href={website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-aqua hover:text-white transition-colors font-body">
                  <Globe size={13} className="flex-shrink-0" />{website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {githubusername && (
                <a href={`https://github.com/${githubusername}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors font-body">
                  <Github size={13} className="flex-shrink-0" />github.com/{githubusername}
                </a>
              )}
              {social?.twitter && (
                <a href={`https://twitter.com/${social.twitter}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors font-body">
                  <Twitter size={13} />@{social.twitter.replace('@', '')}
                </a>
              )}
              {social?.linkedin && (
                <a href={social.linkedin} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors font-body">
                  <Linkedin size={13} />LinkedIn
                </a>
              )}
            </div>
            {isMe && isAuthenticated && (
              <Link to="/edit-profile"
                className="btn-ghost w-full flex items-center justify-center gap-2 mt-5 text-sm py-2">
                <Edit2 size={13} /> Edit Profile
              </Link>
            )}
          </motion.div>

          {/* LeetCode Stats */}
          {leetcodeusername && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              className="glass-dark p-5">
              <div className="flex items-center gap-2 mb-4">
                <Code2 size={15} style={{ color: '#f472b6' }} />
                <h2 className="font-display font-semibold text-white text-sm">LeetCode</h2>
                <span className="font-mono text-xs text-gray-500">@{leetcodeusername}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="glass p-2 rounded-xl text-center">
                  <div className="text-lg font-display font-bold text-green-400">{MOCK_LEETCODE.easy}</div>
                  <div className="text-[10px] text-gray-500 font-mono">Easy</div>
                </div>
                <div className="glass p-2 rounded-xl text-center">
                  <div className="text-lg font-display font-bold text-yellow-400">{MOCK_LEETCODE.medium}</div>
                  <div className="text-[10px] text-gray-500 font-mono">Medium</div>
                </div>
                <div className="glass p-2 rounded-xl text-center">
                  <div className="text-lg font-display font-bold text-red-400">{MOCK_LEETCODE.hard}</div>
                  <div className="text-[10px] text-gray-500 font-mono">Hard</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-body text-gray-300">
                  <span className="gradient-text font-bold text-lg">{MOCK_LEETCODE.solved}</span> solved
                </div>
                <div className="flex items-center gap-1 text-xs font-mono text-orange-400">
                  <Zap size={11} className="fill-orange-400" />
                  {MOCK_LEETCODE.streak} day streak
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMNS */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Skills + Radar */}
          {skills?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              className="glass-dark p-6">
              <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <Star size={15} style={{ color: '#a855f7' }} /> Skills
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {skills.map(s => (
                    <div key={s.name} className="flex items-center justify-between">
                      <span className="text-sm font-mono text-gray-300">{s.name}</span>
                      <SkillStars level={s.level || 3} />
                    </div>
                  ))}
                </div>
                {radarData.length >= 3 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.07)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                      <Radar dataKey="value" stroke="#f472b6" fill="#f472b6" fillOpacity={0.15} strokeWidth={1.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>
          )}

          {/* GitHub Repos */}
          {repos.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
              className="glass-dark p-6">
              <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <Github size={15} style={{ color: '#2dd4bf' }} /> GitHub Repositories
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {repos.slice(0, 6).map(repo => (
                  <a key={repo.id} href={repo.html_url} target="_blank" rel="noopener noreferrer"
                    className="glass p-4 rounded-xl card-hover group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-display font-semibold text-white group-hover:text-purple-light transition-colors truncate">
                        {repo.name}
                      </span>
                      <ExternalLink size={12} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 mt-0.5" />
                    </div>
                    {repo.description && (
                      <p className="text-xs text-gray-500 font-body line-clamp-2 mb-3">{repo.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs font-mono text-gray-600">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-purple/70" />{repo.language}
                        </span>
                      )}
                      <span>⭐ {repo.stargazers_count}</span>
                      <span>🍴 {repo.forks_count}</span>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Experience */}
          {experience?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
              className="glass-dark p-6">
              <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <Briefcase size={15} style={{ color: '#f472b6' }} /> Experience
              </h2>
              <div className="space-y-4">
                {experience.map((exp, i) => (
                  <div key={i} className="glass p-4 rounded-xl">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display font-semibold text-white text-sm">{exp.title}</h3>
                        <p className="text-xs text-purple-light font-mono mt-0.5">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                      </div>
                      <span className="text-xs font-mono text-gray-500 whitespace-nowrap">
                        {new Date(exp.from).getFullYear()} — {exp.current ? 'Present' : exp.to ? new Date(exp.to).getFullYear() : ''}
                      </span>
                    </div>
                    {exp.description && <p className="text-xs text-gray-400 font-body mt-2 leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Education */}
          {education?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}
              className="glass-dark p-6">
              <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <GraduationCap size={15} style={{ color: '#2dd4bf' }} /> Education
              </h2>
              <div className="space-y-3">
                {education.map((edu, i) => (
                  <div key={i} className="glass p-4 rounded-xl">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display font-semibold text-white text-sm">{edu.school}</h3>
                        <p className="text-xs text-aqua font-mono mt-0.5">{edu.degree} in {edu.fieldofstudy}</p>
                      </div>
                      <span className="text-xs font-mono text-gray-500 whitespace-nowrap">
                        {new Date(edu.from).getFullYear()} — {edu.current ? 'Present' : edu.to ? new Date(edu.to).getFullYear() : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
