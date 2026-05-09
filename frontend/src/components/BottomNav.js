import React from 'react';
import { Home, History, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Inicio', path: '/home', testId: 'nav-home' },
    { icon: History, label: 'Historial', path: '/history', testId: 'nav-history' },
    { icon: User, label: 'Perfil', path: '/profile', testId: 'nav-profile' }
  ];

  return (
    <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 px-6 flex justify-around items-center h-16 sm:h-20 z-[9999]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)' }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <button
            key={item.path}
            data-testid={item.testId}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-[#2BBFB3]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
