import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        loadUserProfile(session.access_token);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setToken(session.access_token);
        loadUserProfile(session.access_token);
      } else {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (accessToken) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (nombre, email, password, role) => {
    try {
      const response = await axios.post(`${API}/auth/signup`, {
        nombre,
        email,
        password,
        role
      });

      // Iniciar sesión automáticamente después del registro
      await login(email, password);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al registrarse' 
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });

      setToken(response.data.access_token);
      setUser(response.data.user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Credenciales inválidas' 
      };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    loading,
    signup,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
