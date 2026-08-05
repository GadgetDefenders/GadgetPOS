import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ReportsWidget from './ReportsWidget';
import RepairIntakeWidget from './RepairIntakeWidget';
import './styles.css';
import './pos.css';
import './posTabs.css';
import './repairIntake.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <ReportsWidget />
    <RepairIntakeWidget />
  </React.StrictMode>,
);
