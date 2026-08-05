import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import RepairIntakeWidgetV2 from './RepairIntakeWidgetV2';
import ReportsNavWidget from './ReportsNavWidget';
import InventoryManagerWidget from './InventoryManagerWidget';
import RepairPrintWidget from './RepairPrintWidget';
import SalesReceiptWidget from './SalesReceiptWidget';
import RepairManagerWidget from './RepairManagerWidget';
import RepairPartsManagerWidget from './RepairPartsManagerWidget';
import CustomerCenterWidget from './CustomerCenterWidget';
import InventoryCenterWidget from './InventoryCenterWidget';
import OpenInventoryFormBridge from './OpenInventoryFormBridge';
import PosCatalogManagerWidget from './PosCatalogManagerWidget';
import PosBackButtonWidget from './PosBackButtonWidget';
import RepairCloseoutWidget from './RepairCloseoutWidget';
import SmartRepairCheckInWidget from './SmartRepairCheckInWidget';
import DashboardCommandCenterWidget from './DashboardCommandCenterWidget';
import LabelCenterWidget from './LabelCenterWidget';
import CustomerNotificationCenterWidget from './CustomerNotificationCenterWidget';
import RepairTimelineCenterWidget from './RepairTimelineCenterWidget';
import WarrantyCenterWidget from './WarrantyCenterWidget';
import DeviceHistoryCenterWidget from './DeviceHistoryCenterWidget';
import ReportsDataCenterWidget from './ReportsDataCenterWidget';
import BackupRestoreWidget from './BackupRestoreWidget';
import InventoryReceivingWidget from './InventoryReceivingWidget';
import './styles.css';
import './pos.css';
import './posTabs.css';
import './posBackButton.css';
import './repairIntake.css';
import './commercial.css';
import './inventoryManager.css';
import './repairPrint.css';
import './salesReceipt.css';
import './repairManager.css';
import './repairPartsManager.css';
import './customerCenter.css';
import './inventoryCenter.css';
import './posCatalogManager.css';
import './repairCloseout.css';
import './smartRepairCheckIn.css';
import './dashboardCommandCenter.css';
import './reportsCenter.css';
import './labelCenter.css';
import './customerNotificationCenter.css';
import './repairTimelineCenter.css';
import './warrantyCenter.css';
import './deviceHistoryCenter.css';
import './reportsDataCenter.css';
import './backupRestore.css';
import './inventoryReceiving.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <PosBackButtonWidget />
    <RepairIntakeWidgetV2 />
    <ReportsNavWidget />
    <ReportsDataCenterWidget />
    <BackupRestoreWidget />
    <InventoryReceivingWidget />
    <InventoryManagerWidget />
    <RepairPrintWidget />
    <SalesReceiptWidget />
    <RepairManagerWidget />
    <RepairPartsManagerWidget />
    <CustomerCenterWidget />
    <InventoryCenterWidget />
    <OpenInventoryFormBridge />
    <PosCatalogManagerWidget />
    <RepairCloseoutWidget />
    <SmartRepairCheckInWidget />
    <DashboardCommandCenterWidget />
    <LabelCenterWidget />
    <CustomerNotificationCenterWidget />
    <RepairTimelineCenterWidget />
    <WarrantyCenterWidget />
    <DeviceHistoryCenterWidget />
  </React.StrictMode>,
);
