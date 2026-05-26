import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { useAuthStore } from './stores/authStore';

// Hydrate auth store synchronously from localStorage so protected routes don't redirect on first render
try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
        const token = JSON.parse(raw).state?.token;
        if (token) {
            // set token directly on the store (no hooks) before rendering
            useAuthStore.getState().setToken(token);
        }
    }
} catch (e) {
    // ignore
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
