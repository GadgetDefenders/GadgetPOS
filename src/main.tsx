import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import RepairIntakeWidgetV2 from './RepairIntakeWidgetV2';
import ReportsNavWidget from './ReportsNavWidget';
import InventoryManagerWidget from './InventoryManagerWidget';
import RepairPrintWidget from './RepairPrintWidget';
import SalesReceiptWidget from './SalesReceiptWidget';
import RepairManagerWidget from './RepairManagerWidget';
import CustomerCenterWidget from './CustomerCenterWidget';
import InventoryCenterWidget from './InventoryCenterWidget';
import OpenInventoryFormBridge from './OpenInventoryFormBridge';
import PosCatalogManagerWidget from './PosCatalogManagerWidget';
import RepairCloseoutWidget from './RepairCloseoutWidget';
import SmartRepairCheckInWidget from './SmartRepairCheckInWidget';
import './styles.css';
import './pos.css';
import './posTabs.css';
import './repairIntake.css';
import './commercial.css';
import './inventoryManager.css';
import './repairPrint.css';
import './salesReceipt.css';
import './repairManager.css';
import './customerCenter.css';
import './inventoryCenter.css';
import './posCatalogManager.css';
import './repairCloseout.css';
import './smartRepairCheckIn.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <RepairIntakeWidgetV2 />
    <ReportsNavWidget />
    <InventoryManagerWidget />
    <RepairPrintWidget />
    <SalesReceiptWidget />
    <RepairManagerWidget />
    <CustomerCenterWidget />
    <InventoryCenterWidget />
    <OpenInventoryFormBridge />
    <PosCatalogManagerWidget />
    <RepairCloseoutWidget />
    <SmartRepairCheckInWidget />
  </React.StrictMode>,
);
