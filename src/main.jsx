import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App.jsx';
import * as authSession from './services/auth/auth-session.js';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Root element not found');
}

function exposeAuthSessionForDebugging() {
  if (import.meta.env.DEV) {
    window.__CODE_RAY_AUTH__ = authSession;
  }
}

exposeAuthSessionForDebugging();

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
