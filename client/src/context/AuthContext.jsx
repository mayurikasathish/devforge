import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

const initialState = {
  token: localStorage.getItem('devforge_token'),
  isAuthenticated: false,
  loading: true,
  user: null,
  error: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'USER_LOADED':
      return { ...state, isAuthenticated: true, loading: false, user: action.payload };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('devforge_token', action.payload.token);
      return { ...state, ...action.payload, isAuthenticated: false, loading: true };
    case 'AUTH_ERROR':
    case 'LOGOUT':
      localStorage.removeItem('devforge_token');
      return { ...state, token: null, isAuthenticated: false, loading: false, user: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const loadUser = async () => {
    const token = localStorage.getItem('devforge_token');
    if (!token) { dispatch({ type: 'AUTH_ERROR' }); return; }
    try {
      const res = await api.get('/api/auth');
      dispatch({ type: 'USER_LOADED', payload: res.data });
    } catch {
      dispatch({ type: 'AUTH_ERROR' });
    }
  };

  useEffect(() => { loadUser(); }, [state.token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth', { email, password });
      dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw new Error(msg);
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/api/users', { name, email, password });
      dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw new Error(msg);
    }
  };

  const logout = () => dispatch({ type: 'LOGOUT' });

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
