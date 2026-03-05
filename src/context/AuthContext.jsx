import { createContext, useState } from 'react';
import { authAPI } from '../api/services';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.login({ emailId: email, password });
      // Response: { success, message, data: { accessToken, fullName, emailId, role, employeeId } }
      const { accessToken, fullName, emailId, role, employeeId } = res.data.data;
      const userData = { name: fullName, email: emailId, role, employeeId };
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(accessToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'MANAGER';
  const isEmployee = user?.role === 'EMPLOYEE';

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, isAdmin, isHR, isManager, isEmployee }}>
      {children}
    </AuthContext.Provider>
  );
}
