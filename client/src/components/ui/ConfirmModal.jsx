import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

export default function ConfirmModal({ isOpen, onConfirm, onCancel, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-dark p-8 max-w-sm w-full text-center"
        onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-xl bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-400" />
        </div>
        <h2 className="font-display font-bold text-xl text-white mb-2">{title}</h2>
        <p className="text-gray-400 text-sm font-body mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1 text-sm py-2.5">Cancel</button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-body font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}>
            Yes, Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}