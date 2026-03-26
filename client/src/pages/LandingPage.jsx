import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Zap, Users, Shield, Star, ArrowRight, Github, Brain, MessageSquare } from 'lucide-react';

const features = [
  { icon: Users, title: 'Project Matchmaking', desc: 'Find the perfect collaborators based on skills and availability. Get matched automatically.', color: '#a855f7' },
  { icon: Brain, title: 'Skill Dashboard', desc: 'Visualize your growth with beautiful charts, star ratings, and weekly progress tracking.', color: '#f472b6' },
  { icon: Github, title: 'GitHub + LeetCode', desc: 'Showcase your repositories and coding stats beautifully on your developer profile.', color: '#2dd4bf' },
  { icon: MessageSquare, title: 'Anonymous Doubts', desc: 'Post questions anonymously tagged by topic. Get answers from the community.', color: '#f472b6' },
  { icon: Zap, title: 'Build Together Rooms', desc: 'Real-time rooms with chat, task boards, and collaborative project timelines.', color: '#a855f7' },
  { icon: Shield, title: 'JWT Auth', desc: 'Secure, production-grade authentication. Your data stays yours.', color: '#2dd4bf' },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen pt-24">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-mono"
            style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' }}>
            <Star size={12} className="fill-current" />
            The developer network, reimagined
          </div>

          <h1 className="font-display font-bold text-6xl md:text-8xl leading-none mb-6">
            <span className="gradient-text">Build</span>
            <br />
            <span className="text-white">Together.</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 font-body leading-relaxed">
            DevForge connects developers through skill-based matchmaking, real-time collaboration rooms, and a community built for building.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-8 py-4">
              Start Building <ArrowRight size={16} />
            </Link>
            <Link to="/explore" className="btn-ghost flex items-center gap-2 text-base px-8 py-4">
              Explore Devs
            </Link>
          </div>
        </motion.div>

        {/* Floating cards preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 relative"
        >
          <div className="glass-dark p-6 max-w-4xl mx-auto"
            style={{ boxShadow: '0 40px 120px rgba(168,85,247,0.15)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-4 text-xs font-mono text-gray-500">devforge://dashboard</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Matched Devs', value: '12', color: '#a855f7' },
                { label: 'Open Projects', value: '48', color: '#f472b6' },
                { label: 'Active Rooms', value: '7', color: '#2dd4bf' },
              ].map(stat => (
                <div key={stat.label} className="glass p-4 text-left rounded-xl">
                  <div className="text-2xl font-display font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs text-gray-500 font-body mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="glass p-4 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple/20 flex items-center justify-center">
                  <Code2 size={16} style={{ color: '#a855f7' }} />
                </div>
                <div>
                  <div className="text-sm font-display font-semibold text-white">React</div>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={10} className={i<=4 ? 'fill-pink text-pink' : 'text-gray-600'} />)}
                  </div>
                </div>
              </div>
              <div className="glass p-4 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-aqua/20 flex items-center justify-center">
                  <Zap size={16} style={{ color: '#2dd4bf' }} />
                </div>
                <div>
                  <div className="text-sm font-display font-semibold text-white">Node.js</div>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={10} className={i<=3 ? 'fill-aqua text-aqua' : 'text-gray-600'} />)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">
            Everything you need to <span className="gradient-text">ship together</span>
          </h2>
          <p className="text-gray-400 text-lg font-body max-w-xl mx-auto">
            From finding co-founders to debugging together — DevForge has the tools.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map(({ icon: Icon, title, desc, color }) => (
            <motion.div key={title} variants={fadeUp}
              className="glass p-6 card-hover cursor-default group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm font-body leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-dark p-16 text-center relative overflow-hidden"
          style={{ boxShadow: '0 0 80px rgba(168,85,247,0.1)' }}
        >
          <div className="absolute inset-0 opacity-30"
            style={{ background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.2) 0%, transparent 70%)' }} />
          <div className="relative z-10">
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
              Ready to forge something <span className="gradient-text">great?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 font-body">Join developers who are already building together.</p>
            <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base px-10 py-4">
              Create your profile <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-10 py-8 text-center text-gray-600 text-sm font-body">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Code2 size={14} style={{ color: '#a855f7' }} />
          <span className="gradient-text font-display font-semibold">DevForge</span>
        </div>
        Built for developers, by developers.
      </footer>
    </div>
  );
}
