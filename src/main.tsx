import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import RepairIntakeWidget from './RepairIntakeWidget';
import ReportsNavWidget from './ReportsNavWidget';
import InventoryManagerWidget from './InventoryManagerWidget';
import RepairPrintWidget from './RepairPrintWidget';
import SalesReceiptWidget from './SalesReceiptWidget';
import RepairManagerWidget from './RepairManagerWidget';
import './styles.css';
import './pos.css';
import './posTabs.css';
import './repairIntake.css';
import './commercial.css';
import './inventoryManager.css';
import './repairPrint.css';
import './salesReceipt.css';
import './repairManager.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <RepairIntakeWidget />
    <ReportsNavWidget />
    <InventoryManagerWidget />
    <RepairPrintWidget />
    <SalesReceiptWidget />
    <RepairManagerWidget />
  </React.StrictMode>,
);
