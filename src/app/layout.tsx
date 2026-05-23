import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'ReciclaMarket — Marketplace de Reciclaje',
  description: 'Conectamos usuarios con recicladores para un mundo más limpio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: '12px', fontFamily: 'var(--font-body)', fontSize: '14px' },
            success: { iconTheme: { primary: '#28a428', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
