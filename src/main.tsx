import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ReportsWidget from './ReportsWidget';
import './styles.css';
import './pos.css';
import './posTabs.css';
import './posTabs';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <ReportsWidget />
  </React.StrictMode>,
);
