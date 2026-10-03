import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/tailwind.css';
import './styles/theme.css';
import './styles/index.css';
import { warmUpBackend } from './app/services/api';

warmUpBackend();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
