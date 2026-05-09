import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Leaf, Mail, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          toast.success('¡Bienvenido!');
          navigate('/home');
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await signup(nombre, email, password, role);
        if (result.success) {
          toast.success('¡Cuenta creada exitosamente!');
          navigate('/home');
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      toast.error('Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#C8F135] rounded-2xl mb-4">
            <Leaf size={32} className="text-gray-900" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">ECOUP</h1>
          <p className="text-base text-gray-500">
            Reciclaje colaborativo para un mundo mejor
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo
              </label>
              <div className="relative">
                <UserIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  data-testid="input-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full h-14 rounded-xl bg-gray-100 border-transparent pl-12 pr-4 text-base font-medium text-gray-900 placeholder-gray-500 focus:bg-white focus:border-[#2BBFB3] focus:ring-2 focus:ring-[#2BBFB3]/20 transition-all"
                  placeholder="Tu nombre"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                data-testid="input-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-14 rounded-xl bg-gray-100 border-transparent pl-12 pr-4 text-base font-medium text-gray-900 placeholder-gray-500 focus:bg-white focus:border-[#2BBFB3] focus:ring-2 focus:ring-[#2BBFB3]/20 transition-all"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                data-testid="input-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-14 rounded-xl bg-gray-100 border-transparent pl-12 pr-4 text-base font-medium text-gray-900 placeholder-gray-500 focus:bg-white focus:border-[#2BBFB3] focus:ring-2 focus:ring-[#2BBFB3]/20 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de cuenta
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  data-testid="role-user"
                  onClick={() => setRole('USER')}
                  className={`h-14 rounded-xl font-bold text-base transition-all ${
                    role === 'USER'
                      ? 'bg-[#C8F135] text-gray-900 border-2 border-[#C8F135]'
                      : 'bg-white text-gray-600 border-2 border-gray-200'
                  }`}
                >
                  Usuario Hogar
                </button>
                <button
                  type="button"
                  data-testid="role-recycler"
                  onClick={() => setRole('RECYCLER')}
                  className={`h-14 rounded-xl font-bold text-base transition-all ${
                    role === 'RECYCLER'
                      ? 'bg-[#2BBFB3] text-white border-2 border-[#2BBFB3]'
                      : 'bg-white text-gray-600 border-2 border-gray-200'
                  }`}
                >
                  Reciclador
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            data-testid="submit-button"
            disabled={loading}
            className="btn-primary mt-6"
          >
            {loading ? 'Cargando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        {/* Toggle entre login y registro */}
        <div className="mt-6 text-center">
          <button
            type="button"
            data-testid="toggle-auth-mode"
            onClick={() => {
              setIsLogin(!isLogin);
              setNombre('');
              setEmail('');
              setPassword('');
            }}
            className="text-sm font-medium text-[#2BBFB3] hover:underline"
          >
            {isLogin
              ? '¿No tienes cuenta? Regístrate'
              : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};
