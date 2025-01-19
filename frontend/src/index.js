// src/index.js

import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot from React 18

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

import App from './App';
import './i18n'; // Import i18n configuration

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

const container = document.getElementById('root');
const root = createRoot(container); // Create root using the container (root div)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
