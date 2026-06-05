import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Users, Clock } from 'lucide-react';

export default function ApplyModal({ project, onConfirm, onCancel }) {
  if (!project) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative w-full max-w-md glass-dark p-6 z-10"
          style={{ borderRadius: '20px' }}>

          {/* Close */}
          <button onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-all">
            <X size={16} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#a855f7,#f472b6)' }}>
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg leading-tight">Apply to project</h2>
              <p className="text-xs text-gray-500 font-mono">Your profile will be shared with the owner</p>
            </div>
          </div>

          {/* Project card preview */}
          <div className="rounded-xl p-4 mb-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="font-display font-semibold text-white mb-1 truncate">{project.title}</h3>
            <p className="text-xs text-gray-500 font-body line-clamp-2 mb-3">{project.description}</p>

            <div className="flex flex-wrap gap-2">
              {project.user?.name && (
                <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-body">
                  <img src={project.user.avatar} alt="" className="w-4 h-4 rounded-full" />
                  {project.user.name}
                </span>
              )}
              {project.duration && (
                <span className="flex items-center gap-1 text-[11px] text-gray-500 font-mono">
                  <Clock size={10} /> {project.duration}
                </span>
              )}
              {project.rolesNeeded?.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-mono"
                  style={{ color: '#f9a8d4' }}>
                  <Users size={10} /> {project.rolesNeeded.join(', ')}
                </span>
              )}
            </div>

            {project.techStack?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {project.techStack.slice(0, 5).map(t => (
                  <span key={t} className="tag text-[10px]">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Info note */}
          <p className="text-xs text-gray-600 font-body mb-5 leading-relaxed">
            The project owner will see your profile and can reach out via <span className="text-purple-300">Messages</span>. You can only apply once.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="btn-ghost flex-1 py-2.5 text-sm">
              Cancel
            </button>
            <button onClick={onConfirm}
              className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
              <Zap size={13} /> Confirm Apply
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
