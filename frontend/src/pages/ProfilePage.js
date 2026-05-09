import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { User as UserIcon, Mail, LogOut, Leaf } from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada');
      navigate('/');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  if (!user) {
    return null;
  }

  const getRoleText = (role) => {
    return role === 'RECYCLER' ? 'Reciclador' : 'Usuario Hogar';
  };

  const getRoleColor = (role) => {
    return role === 'RECYCLER' ? 'bg-[#2BBFB3] text-white' : 'bg-[#C8F135] text-gray-900';
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">
          Perfil
        </h1>
        <p className="text-sm font-medium text-gray-500">
          Tu información personal
        </p>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6">
        {/* Avatar y nombre */}
        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#C8F135] to-[#2BBFB3] rounded-full mb-4 mx-auto">
            <UserIcon size={40} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {user.nombre}
          </h2>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${getRoleColor(user.role)}`}>
            <Leaf size={16} />
            {getRoleText(user.role)}
          </div>
        </div>

        {/* Información */}
        <div className="card space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mail size={20} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-500">Correo electrónico</span>
            </div>
            <p className="text-base font-semibold text-gray-900">
              {user.email}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserIcon size={20} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-500">Tipo de cuenta</span>
            </div>
            <p className="text-base font-semibold text-gray-900">
              {getRoleText(user.role)}
            </p>
          </div>
        </div>

        {/* Información de la app */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#C8F135] rounded-xl flex items-center justify-center">
              <Leaf size={24} className="text-gray-900" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">ECOUP</h3>
              <p className="text-sm text-gray-500">Reciclaje colaborativo</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Juntos construimos un mundo más sostenible. Cada acción cuenta para cuidar nuestro planeta.
          </p>
        </div>

        {/* Botón de cerrar sesión */}
        <button
          data-testid="logout-button"
          onClick={handleLogout}
          className="w-full h-14 rounded-2xl bg-white border-2 border-red-200 text-red-600 font-bold text-lg flex items-center justify-center gap-2 active:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </div>

      <BottomNav />
    </div>
  );
};
