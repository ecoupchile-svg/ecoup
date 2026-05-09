import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Recuperar sesion guardada
    const savedToken = localStorage.getItem('ecoup_token');
    const savedUser = localStorage.getItem('ecoup_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Verificar que el token siga siendo valido
      verifyToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (accessToken) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUser(response.data);
      localStorage.setItem('ecoup_user', JSON.stringify(response.data));
    } catch {
      // Token expirado, limpiar sesion
      localStorage.removeItem('ecoup_token');
      localStorage.removeItem('ecoup_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (nombre, email, password, role) => {
    try {
      await axios.post(`${API}/auth/signup`, { nombre, email, password, role });
      return await login(email, password);
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Error al registrarse' };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('ecoup_token', access_token);
      localStorage.setItem('ecoup_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Credenciales invalidas' };
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ecoup_token');
    localStorage.removeItem('ecoup_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
