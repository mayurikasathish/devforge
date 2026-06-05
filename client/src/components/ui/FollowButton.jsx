import { useState } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Props:
//   targetUserId — the user to follow
//   initialFollowing — bool, whether current user already follows them
//   size — 'sm' | 'md' (default 'md')
//   onToggle(isFollowing) — optional callback
export default function FollowButton({ targetUserId, initialFollowing = false, size = 'md', onToggle }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading,   setLoading]   = useState(false);

  const toggle = async (e) => {
    e.preventDefault(); // don't trigger parent Link navigation
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await api.put(`/api/profile/follow/${targetUserId}`);
      setFollowing(res.data.following);
      toast.success(res.data.following ? 'Following!' : 'Unfollowed');
      onToggle?.(res.data.following);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not update follow');
    } finally {
      setLoading(false);
    }
  };

  const isSmall = size === 'sm';

  if (following) {
    return (
      <button onClick={toggle} disabled={loading}
        className={`flex items-center gap-1.5 font-body font-medium transition-all duration-200 rounded-xl
          ${isSmall ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'}
          text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-400/30 hover:bg-red-400/5`}>
        {loading
          ? <div className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} border border-current border-t-transparent rounded-full animate-spin`} />
          : <UserCheck size={isSmall ? 12 : 14} />
        }
        Following
      </button>
    );
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`flex items-center gap-1.5 font-body font-medium transition-all duration-200 rounded-xl
        ${isSmall ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'}
        text-white border`}
      style={{
        background: 'rgba(168,85,247,0.12)',
        borderColor: 'rgba(168,85,247,0.3)',
      }}>
      {loading
        ? <div className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} border border-purple-400 border-t-transparent rounded-full animate-spin`} />
        : <UserPlus size={isSmall ? 12 : 14} className="text-purple-400" />
      }
      <span className="text-purple-300">Follow</span>
    </button>
  );
}
