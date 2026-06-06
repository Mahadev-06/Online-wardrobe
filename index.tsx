import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Tailwind base + design system styles

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to. Check that index.html has <div id="root">.');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
