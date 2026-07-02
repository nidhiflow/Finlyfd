import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { router } from './routes';
import { useEffect } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("finly-theme");
    const isDark = savedTheme !== "light"; // default to dark
    
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    
    if (isDark) {
      document.documentElement.classList.remove("light-mode");
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.documentElement.classList.add("light-mode");
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1B2130',
            border: '1px solid var(--divider)',
            color: "var(--ink)",
            fontSize: '13px',
          },
        }}
      />
    </GoogleOAuthProvider>
  );
}