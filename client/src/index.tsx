import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Force correct API URL (overriding any cached environment variables)
window.localStorage.setItem('apiBaseUrl', 'http://localhost:5001/api');

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
