import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Send, Plus, Trash2, CheckSquare, Circle, Clock, ArrowLeft } from 'lucide-react';

const SOCKET_URL = 'http://localhost:5000';

function TaskBoard({ tasks, onUpdate, isConnected }) {
  const cols = ['todo', 'in_progress', 'done'];
  const colConfig = {
    todo: { label: 'To Do', color: '#6b7280', icon: Circle },
    in_progress: { label: 'In Progress', color: '#f472b6', icon: Clock },
    done: { label: 'Done', color: '#4ade80', icon: CheckSquare }
  };
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      description: '',
      status: 'todo',
      assignee: '',
      createdAt: new Date().toISOString()
    };
    onUpdate([...tasks, newTask]);
    setNewTaskTitle('');
  };

  const moveTask = (taskId, newStatus) => {
    onUpdate(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const deleteTask = (taskId) => {
    onUpdate(tasks.filter(t => t.id !== taskId));
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Add task */}
      <div className="flex gap-2">
        <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          className="input-glass flex-1 text-sm py-2" placeholder="Add a task..." />
        <button onClick={addTask} className="btn-primary py-2 px-3 text-sm flex items-center gap-1">
          <Plus size={13} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
        {cols.map(col => {
          const { label, color, icon: Icon } = colConfig[col];
          const colTasks = tasks.filter(t => t.status === col);
          return (
            <div key={col} className="glass rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={12} style={{ color }} />
                <span className="text-xs font-mono font-semibold" style={{ color }}>{label}</span>
                <span className="ml-auto text-[10px] font-mono text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                {colTasks.map(task => (
                  <div key={task.id}
                    className="glass p-2.5 rounded-lg group relative"
                    style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-xs text-gray-200 font-body pr-4">{task.title}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {cols.filter(c => c !== col).map(c => (
                        <button key={c} onClick={() => moveTask(task.id, c)}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-md transition-all hover:bg-white/10 text-gray-500 hover:text-gray-300">
                          → {colConfig[c].label}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => deleteTask(task.id)}
                      className="absolute top-2 right-2 text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [tasks, setTasks] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.get(`/api/rooms/${id}`).then(res => {
      setRoom(res.data);
      setTasks(res.data.tasks || []);
      setLoading(false);

      // Socket.IO
      const socket = io(SOCKET_URL);
      socketRef.current = socket;
      socket.on('connect', () => {
        setConnected(true);
        socket.emit('join_room', { roomId: id, userName: user?.name });
      });
      socket.on('chat_history', msgs => setMessages(msgs));
      socket.on('receive_message', msg => setMessages(prev => [...prev, msg]));
      socket.on('tasks_updated', updatedTasks => setTasks(updatedTasks));
      socket.on('user_joined', ({ userName }) => {
        setMessages(prev => [...prev, { system: true, message: `${userName} joined the room`, time: new Date().toISOString() }]);
      });
      socket.on('disconnect', () => setConnected(false));
    }).catch(() => { toast.error('Room not found'); navigate('/rooms'); });

    return () => { socketRef.current?.disconnect(); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!msgInput.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', {
      roomId: id, message: msgInput.trim(),
      userName: user?.name, avatar: user?.avatar
    });
    setMsgInput('');
  };

  const updateTasks = (newTasks) => {
    setTasks(newTasks);
    socketRef.current?.emit('task_update', { roomId: id, tasks: newTasks });
    api.put(`/api/rooms/tasks/${id}`, { tasks: newTasks }).catch(() => {});
  };

  if (loading) return (
    <div className="min-h-screen pt-28 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple rounded-full border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 pt-24 pb-6 h-screen flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-4 flex-wrap">
        <button onClick={() => navigate('/rooms')}
          className="p-2 rounded-xl hover:bg-white/5 transition-all text-gray-400 hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            <h1 className="font-display font-bold text-xl text-white truncate">{room?.title}</h1>
          </div>
          {room?.goal && <p className="text-xs font-mono text-purple-light">🎯 {room.goal}</p>}
        </div>
        {/* Member avatars */}
        <div className="flex items-center gap-1">
          {room?.members?.slice(0, 5).map((m, i) => (
            <img key={i} src={m.avatar} alt={m.name}
              className="w-7 h-7 rounded-full border border-black object-cover"
              style={{ marginLeft: i > 0 ? '-6px' : 0 }} />
          ))}
          <span className="text-xs font-mono text-gray-500 ml-2">{room?.members?.length} online</span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['chat', 'tasks'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-body font-medium capitalize transition-all
              ${activeTab === tab ? 'bg-purple/20 text-purple-light border border-purple/40' : 'text-gray-500 hover:text-gray-300 border border-transparent hover:border-white/10'}`}>
            {tab === 'chat' ? '💬 Chat' : '📋 Tasks'}
          </button>
        ))}
      </div>

      {/* Chat */}
      {activeTab === 'chat' && (
        <div className="flex flex-col flex-1 glass-dark overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-600 text-sm font-body py-8">
                No messages yet. Say hello! 
              </div>
            )}
            {messages.map((msg, i) => {
              if (msg.system) return (
                <div key={i} className="text-center text-xs font-mono text-gray-600 py-1">
                  {msg.message}
                </div>
              );
              const isMe = msg.userName === user?.name;
              return (
                <div key={i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <img src={msg.avatar || `https://www.gravatar.com/avatar/${i}?d=mm`} alt=""
                    className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
                  <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {!isMe && <span className="text-[10px] font-mono text-gray-500 px-2">{msg.userName}</span>}
                    <div className={`px-3 py-2 rounded-2xl text-sm font-body ${isMe
                      ? 'text-white rounded-br-sm'
                      : 'text-gray-200 glass rounded-bl-sm'}`}
                      style={isMe ? { background: 'linear-gradient(135deg,#a855f7,#f472b6)' } : {}}>
                      {msg.message}
                    </div>
                    <span className="text-[9px] font-mono text-gray-700 px-2">
                      {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-white/5 flex gap-2">
            <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="input-glass flex-1 text-sm py-2.5" placeholder="Type a message..." />
            <button onClick={sendMessage} disabled={!msgInput.trim() || !connected}
              className="btn-primary p-2.5 flex items-center justify-center disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Tasks */}
      {activeTab === 'tasks' && (
        <div className="flex-1 glass-dark p-4 overflow-hidden min-h-0">
          <TaskBoard tasks={tasks} onUpdate={updateTasks} isConnected={connected} />
        </div>
      )}
    </div>
  );
}
