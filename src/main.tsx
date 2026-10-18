import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Defensive ensure window.fetch is writable and has setter for extension compatibility
if (typeof window !== 'undefined') {
  try {
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!desc || !desc.set || !desc.writable) {
      let currentFetch = window.fetch ? window.fetch.bind(window) : undefined;
      Object.defineProperty(window, 'fetch', {
        configurable: true,
        enumerable: true,
        get() {
          return currentFetch;
        },
        set(fn) {
          currentFetch = fn;
        },
      });
    }
  } catch {
    // Ignore if not configurable
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {
          // Ignore registration errors in restricted contexts
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
