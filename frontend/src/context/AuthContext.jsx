import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hcm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hcm_token'));
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forceChangePasswordOpen, setForceChangePasswordOpen] = useState(false);

  // Check system status (first run vs initialized)
  const checkSystemStatus = async () => {
    try {
      const res = await api.get('/auth/status');
      setSystemStatus(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch system status:', err);
      return null;
    }
  };

  // Fetch current user details
  const fetchMe = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      localStorage.setItem('hcm_user', JSON.stringify(res.data.user));
      if (res.data.user.mustChangePassword) {
        setForceChangePasswordOpen(true);
      }
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkSystemStatus();
      await fetchMe();
    };
    init();

    const handleForcePassword = () => setForceChangePasswordOpen(true);
    window.addEventListener('hcm_must_change_password', handleForcePassword);
    return () => window.removeEventListener('hcm_must_change_password', handleForcePassword);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: jwtToken, user: userData } = res.data;

    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('hcm_token', jwtToken);
    localStorage.setItem('hcm_user', JSON.stringify(userData));

    if (userData.mustChangePassword) {
      setForceChangePasswordOpen(true);
    }

    return userData;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hcm_token');
    localStorage.removeItem('hcm_user');
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    if (res.data.token) {
      setToken(res.data.token);
      localStorage.setItem('hcm_token', res.data.token);
    }
    setUser(prev => ({ ...prev, mustChangePassword: false }));
    setForceChangePasswordOpen(false);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      systemStatus,
      loading,
      forceChangePasswordOpen,
      setForceChangePasswordOpen,
      login,
      logout,
      changePassword,
      checkSystemStatus,
      fetchMe
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
