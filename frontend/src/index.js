// src/index.js

import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot from React 18

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

import App from './App';
import './i18n'; // Import i18n configuration

const container = document.getElementById('root');
const root = createRoot(container); // Create root using the container (root div)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
