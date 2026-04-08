import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1B2130',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: '13px',
          },
        }}
      />
    </>
  );
}