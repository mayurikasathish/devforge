import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, Star, Save, Github, Code2, Briefcase, GraduationCap, Globe, User, Camera, LogOut } from 'lucide-react';

const SKILL_SUGGESTIONS = ['React','Node.js','Python','Java','C++','MongoDB','PostgreSQL','TypeScript','Next.js','GraphQL','Docker','AWS','DSA','System Design','ML','TailwindCSS'];
const AVAILABILITY_OPTIONS = [
  { value: 'available', label: '🟢 Available' },
  { value: 'open_to_collaborate', label: '🟡 Open to Collaborate' },
  { value: 'busy', label: '🔴 Busy' }
];

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14}
          className={`cursor-pointer transition-all ${i <= (hover || value) ? 'fill-pink text-pink' : 'text-gray-600'}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)} />
      ))}
    </div>
  );
}

const emptyExp = { title: '', company: '', location: '', from: '', to: '', current: false, description: '' };
const emptyEdu = { school: '', degree: '', fieldofstudy: '', from: '', to: '', current: false };

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, logout, loadUser } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('basics');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [basics, setBasics] = useState({
    status: '', bio: '', location: '', website: '',
    githubusername: '', leetcodeusername: '', availability: 'available',
    twitter: '', linkedin: ''
  });
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);

  useEffect(() => {
    api.get('/api/profile/me').then(res => {
      const p = res.data;
      setBasics({
        status: p.status || '', bio: p.bio || '', location: p.location || '',
        website: p.website || '', githubusername: p.githubusername || '',
        leetcodeusername: p.leetcodeusername || '', availability: p.availability || 'available',
        twitter: p.social?.twitter || '', linkedin: p.social?.linkedin || ''
      });
      setSkills(p.skills || []);
      setExperience(p.experience?.map(e => ({
        ...e, from: e.from?.slice(0,10) || '', to: e.to?.slice(0,10) || ''
      })) || []);
      setEducation(p.education?.map(e => ({
        ...e, from: e.from?.slice(0,10) || '', to: e.to?.slice(0,10) || ''
      })) || []);
    }).catch(() => {}).finally(() => setFetching(false));
  }, []);

  const addSkill = (name) => {
    const n = name.trim();
    if (!n || skills.find(s => s.name.toLowerCase() === n.toLowerCase())) return;
    setSkills([...skills, { name: n, level: 3 }]);
    setSkillInput('');
  };

  const updateSkillLevel = (idx, level) => {
    setSkills(skills.map((s, i) => i === idx ? { ...s, level } : s));
  };

  const removeSkill = (idx) => setSkills(skills.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!basics.status) { toast.error('Status is required'); return; }
    if (skills.length === 0) { toast.error('Add at least one skill'); return; }
    setLoading(true);
    try {
      await api.post('/api/profile', {
        ...basics,
        twitter: basics.twitter,
        linkedin: basics.linkedin,
        skills
      });
      // Save experience entries
      for (const exp of experience) {
        if (exp.title && exp.company && exp.from && !exp._id) {
          await api.put('/api/profile/experience', exp);
        }
      }
      // Save education entries
      for (const edu of education) {
        if (edu.school && edu.degree && edu.fieldofstudy && edu.from && !edu._id) {
          await api.put('/api/profile/education', edu);
        }
      }
      toast.success('Profile saved!');
      navigate('/profile/me');
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        await api.put('/api/profile/avatar', { avatar: base64 });
        await loadUser();
        toast.success('Profile picture updated!');
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Failed to update picture');
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account permanently? This cannot be undone.')) return;
    if (!confirm('Are you absolutely sure? All your projects, rooms and doubts will be deleted.')) return;
    try {
      await api.delete('/api/profile');
      logout();
      navigate('/');
      toast.success('Account deleted');
    } catch {
      toast.error('Failed to delete account');
    }
  };

  const tabs = [
    { id: 'basics', label: 'Basics', icon: User },
    { id: 'skills', label: 'Skills', icon: Code2 },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
  ];

  if (fetching) return (
    <div className="min-h-screen pt-28 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple rounded-full border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 pt-28 pb-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl text-white mb-1">Edit Profile</h1>
            <p className="text-gray-400 text-sm font-body">Build your developer identity</p>
          </div>
          <button onClick={handleDeleteAccount}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all">
            <Trash2 size={14} /> Delete Account
          </button>
        </div>

        {/* Avatar Upload */}
        <div className="glass-dark p-5 mb-6 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <img src={user?.avatar} alt={user?.name}
              className="w-16 h-16 rounded-xl object-cover border border-purple/30" />
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-display font-semibold text-white mb-1">Profile Picture</p>
            <p className="text-xs text-gray-500 font-body mb-3">JPG or PNG, max 2MB</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
              className="btn-ghost text-xs py-2 px-4 flex items-center gap-2 disabled:opacity-50">
              <Camera size={13} /> {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-medium transition-all duration-200
                ${activeTab === id
                  ? 'bg-purple/20 text-purple-light border border-purple/40'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent hover:border-white/10'}`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        <div className="glass-dark p-6">
          {/* BASICS TAB */}
          {activeTab === 'basics' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-gray-400 mb-1.5 block">Developer Status *</label>
                <input value={basics.status} onChange={e => setBasics({ ...basics, status: e.target.value })}
                  className="input-glass" placeholder="e.g. Full Stack Developer, CS Student" />
              </div>
              <div>
                <label className="text-xs font-mono text-gray-400 mb-1.5 block">Bio</label>
                <textarea value={basics.bio} onChange={e => setBasics({ ...basics, bio: e.target.value.slice(0, 300) })}
  className="input-glass resize-none" rows={3} placeholder="Tell the community about yourself..." />
<p className={`text-right text-xs font-mono mt-1 ${basics.bio.length > 270 ? 'text-red-400' : 'text-gray-600'}`}>
  {basics.bio.length}/300
</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Location</label>
                  <input value={basics.location} onChange={e => setBasics({ ...basics, location: e.target.value })}
                    className="input-glass" placeholder="City, Country" />
                </div>
                <div>
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Website</label>
                  <input value={basics.website} onChange={e => setBasics({ ...basics, website: e.target.value })}
                    className="input-glass" placeholder="https://yoursite.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-gray-400 mb-1.5 flex items-center gap-1">
                    <Github size={11} /> GitHub Username
                  </label>
                  <input value={basics.githubusername} onChange={e => setBasics({ ...basics, githubusername: e.target.value })}
                    className="input-glass" placeholder="octocat" />
                </div>
                <div>
                  <label className="text-xs font-mono text-gray-400 mb-1.5 flex items-center gap-1">
                    <Code2 size={11} /> LeetCode Username
                  </label>
                  <input value={basics.leetcodeusername} onChange={e => setBasics({ ...basics, leetcodeusername: e.target.value })}
                    className="input-glass" placeholder="leetcoder" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">Twitter</label>
                  <input value={basics.twitter} onChange={e => setBasics({ ...basics, twitter: e.target.value })}
                    className="input-glass" placeholder="@handle" />
                </div>
                <div>
                  <label className="text-xs font-mono text-gray-400 mb-1.5 block">LinkedIn</label>
                  <input value={basics.linkedin} onChange={e => setBasics({ ...basics, linkedin: e.target.value })}
                    className="input-glass" placeholder="linkedin.com/in/you" />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-gray-400 mb-2 block">Availability</label>
                <div className="flex gap-2 flex-wrap">
                  {AVAILABILITY_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setBasics({ ...basics, availability: opt.value })}
                      className={`px-4 py-2 rounded-xl text-sm font-body transition-all border
                        ${basics.availability === opt.value
                          ? 'bg-purple/20 border-purple/50 text-white'
                          : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* SKILLS TAB */}
          {activeTab === 'skills' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex gap-2">
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill(skillInput)}
                  className="input-glass flex-1" placeholder="Type a skill and press Enter" />
                <button onClick={() => addSkill(skillInput)} className="btn-primary py-2 px-4">Add</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {SKILL_SUGGESTIONS.filter(s => !skills.find(sk => sk.name.toLowerCase() === s.toLowerCase())).map(s => (
                  <button key={s} onClick={() => addSkill(s)}
                    className="tag text-xs cursor-pointer hover:bg-purple/30 transition-all">{s}</button>
                ))}
              </div>
              {skills.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-mono text-gray-500 mb-2">Rate your proficiency</p>
                  {skills.map((sk, i) => (
                    <div key={i} className="glass p-3 rounded-xl flex items-center justify-between gap-4">
                      <span className="text-sm font-mono text-white flex-1">{sk.name}</span>
                      <StarPicker value={sk.level} onChange={v => updateSkillLevel(i, v)} />
                      <button onClick={() => removeSkill(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* EXPERIENCE TAB */}
          {activeTab === 'experience' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {experience.map((exp, i) => (
                <div key={i} className="glass p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-purple-light">Experience #{i + 1}</span>
                    <button onClick={() => setExperience(experience.filter((_, j) => j !== i))}
                      className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={exp.title} onChange={e => setExperience(experience.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                      className="input-glass text-sm" placeholder="Job Title" />
                    <input value={exp.company} onChange={e => setExperience(experience.map((x, j) => j === i ? { ...x, company: e.target.value } : x))}
                      className="input-glass text-sm" placeholder="Company" />
                    <input type="date" value={exp.from} onChange={e => setExperience(experience.map((x, j) => j === i ? { ...x, from: e.target.value } : x))}
                      className="input-glass text-sm" />
                    <input type="date" value={exp.to}
  onChange={e => updateExp(idx, 'to', e.target.value)}
  min={exp.from}
  className="input-glass" disabled={exp.current} />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={exp.current}
                      onChange={e => setExperience(experience.map((x, j) => j === i ? { ...x, current: e.target.checked } : x))}
                      className="accent-purple" />
                    Currently working here
                  </label>
                  <textarea value={exp.description}
  onChange={e => setExperience(experience.map((x, j) => j === i ? { ...x, description: e.target.value.slice(0, 500) } : x))}
  className="input-glass text-sm resize-none w-full" rows={2} placeholder="Description (optional)" />
<p className={`text-right text-xs font-mono mt-1 ${exp.description.length > 450 ? 'text-red-400' : 'text-gray-600'}`}>
  {exp.description.length}/500
</p>
                </div>
              ))}
              <button onClick={() => setExperience([...experience, { ...emptyExp }])}
                className="btn-ghost w-full flex items-center justify-center gap-2 py-3">
                <Plus size={14} /> Add Experience
              </button>
            </motion.div>
          )}

          {/* EDUCATION TAB */}
          {activeTab === 'education' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {education.map((edu, i) => (
                <div key={i} className="glass p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-aqua">Education #{i + 1}</span>
                    <button onClick={() => setEducation(education.filter((_, j) => j !== i))}
                      className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                  </div>
                  <input value={edu.school} onChange={e => setEducation(education.map((x, j) => j === i ? { ...x, school: e.target.value } : x))}
                    className="input-glass text-sm w-full" placeholder="School / University" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={edu.degree} onChange={e => setEducation(education.map((x, j) => j === i ? { ...x, degree: e.target.value } : x))}
                      className="input-glass text-sm" placeholder="Degree (e.g. B.Tech)" />
                    <input value={edu.fieldofstudy} onChange={e => setEducation(education.map((x, j) => j === i ? { ...x, fieldofstudy: e.target.value } : x))}
                      className="input-glass text-sm" placeholder="Field of Study" />
                    <input type="date" value={edu.from} onChange={e => setEducation(education.map((x, j) => j === i ? { ...x, from: e.target.value } : x))}
                      className="input-glass text-sm" />
                    <input type="date" value={edu.to}
  onChange={e => updateEdu(idx, 'to', e.target.value)}
  min={edu.from}
  className="input-glass" disabled={edu.current} />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={edu.current}
                      onChange={e => setEducation(education.map((x, j) => j === i ? { ...x, current: e.target.checked } : x))}
                      className="accent-purple" />
                    Currently studying here
                  </label>
                </div>
              ))}
              <button onClick={() => setEducation([...education, { ...emptyEdu }])}
                className="btn-ghost w-full flex items-center justify-center gap-2 py-3">
                <Plus size={14} /> Add Education
              </button>
            </motion.div>
          )}
        </div>

        <button onClick={handleSave} disabled={loading}
          className="btn-primary w-full mt-6 flex items-center justify-center gap-2 py-4 text-base">
          {loading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={16} /> Save Profile</>}
        </button>
      </motion.div>
    </div>
  );
}
