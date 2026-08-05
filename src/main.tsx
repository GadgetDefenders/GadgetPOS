import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import RepairIntakeWidget from './RepairIntakeWidget';
import ReportsNavWidget from './ReportsNavWidget';
import './styles.css';
import './pos.css';
import './posTabs.css';
import './repairIntake.css';
import './commercial.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <RepairIntakeWidget />
    <ReportsNavWidget />
  </React.StrictMode>,
);
