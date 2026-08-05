import { useMemo, useState } from 'react';
import { BarChart3, Printer, X } from 'lucide-react';
import { storage } from './storage';
import type { InventoryCategory, Sale } from './types';
import './reports.css';

const categories: InventoryCategory[] = ['Phone', 'Accessory', 'Prepaid Service', 'Repair Part'];

type Range = 'Today' | 'This Month' | 'All Time';

function inRange(dateValue: string, range: Range) {
  const date = new Date(dateValue);
  const now = new Date();
  if (range === 'All Time') return true;
  if (range === 'Today') return date.toDateString() === now.toDateString();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function ReportsWidget() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<Range>('This Month');

  const reports = useMemo(() => {
    const sales = storage.getSales().filter((sale: Sale) => inRange(sale.createdAt, range));
    const inventory = storage.getInventory();
    const repairs = storage.getRepairs();

    const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const tax = sales.reduce((sum, sale) => sum + sale.tax, 0);
    const subtotal = sales.reduce((sum, sale) => sum + sale.subtotal, 0);
    const transactions = sales.length;
    const averageSale = transactions ? revenue / transactions : 0;

    const categoryTotals = Object.fromEntries(categories.map((category) => [category, 0])) as Record<InventoryCategory, number>;
    let repairRevenue = 0;
    let estimatedCost = 0;

    for (const sale of sales) {
      for (const line of sale.lines) {
        const lineTotal = line.unitPrice * line.quantity;
        if (line.kind === 'Repair') {
          repairRevenue += lineTotal;
          continue;
        }
        const item = inventory.find((entry) => entry.id === line.referenceId);
        if (item) {
          categoryTotals[item.category] += lineTotal;
          estimatedCost += item.cost * line.quantity;
        }
      }
    }

    const estimatedProfit = subtotal - estimatedCost;
    const inventoryRetailValue = inventory.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const inventoryCostValue = inventory.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    const lowStock = inventory.filter((item) => item.quantity <= item.minimum).length;
    const openRepairs = repairs.filter((repair) => repair.status !== 'Completed').length;
    const completedRepairs = repairs.filter((repair) => repair.status === 'Completed').length;

    return { sales, revenue, tax, transactions, averageSale, categoryTotals, repairRevenue, estimatedProfit, inventoryRetailValue, inventoryCostValue, lowStock, openRepairs, completedRepairs };
  }, [range, open]);

  return <>
    <button className="reports-launcher" onClick={() => setOpen(true)}><BarChart3 size={18}/>Reports</button>
    {open && <div className="reports-backdrop">
      <section className="reports-window">
        <header className="reports-header">
          <div><h2>GadgetPOS Reports</h2><p>Sales, profit, repairs, and inventory performance.</p></div>
          <div className="reports-header-actions"><button onClick={() => window.print()}><Printer size={16}/>Print</button><button className="reports-close" onClick={() => setOpen(false)}><X size={19}/></button></div>
        </header>

        <div className="reports-range">
          {(['Today','This Month','All Time'] as Range[]).map(option => <button key={option} className={range === option ? 'active' : ''} onClick={() => setRange(option)}>{option}</button>)}
        </div>

        <div className="reports-kpis">
          <article><span>Total Sales</span><strong>${reports.revenue.toFixed(2)}</strong></article>
          <article><span>Estimated Profit</span><strong>${reports.estimatedProfit.toFixed(2)}</strong></article>
          <article><span>Transactions</span><strong>{reports.transactions}</strong></article>
          <article><span>Average Sale</span><strong>${reports.averageSale.toFixed(2)}</strong></article>
          <article><span>Sales Tax</span><strong>${reports.tax.toFixed(2)}</strong></article>
          <article><span>Open Repairs</span><strong>{reports.openRepairs}</strong></article>
        </div>

        <div className="reports-grid">
          <article className="reports-panel"><h3>Revenue by Department</h3>
            <div className="report-row"><span>Repair Revenue</span><strong>${reports.repairRevenue.toFixed(2)}</strong></div>
            {categories.map(category => <div className="report-row" key={category}><span>{category}</span><strong>${reports.categoryTotals[category].toFixed(2)}</strong></div>)}
          </article>
          <article className="reports-panel"><h3>Inventory Summary</h3>
            <div className="report-row"><span>Retail Value</span><strong>${reports.inventoryRetailValue.toFixed(2)}</strong></div>
            <div className="report-row"><span>Cost Value</span><strong>${reports.inventoryCostValue.toFixed(2)}</strong></div>
            <div className="report-row"><span>Estimated Margin</span><strong>${(reports.inventoryRetailValue - reports.inventoryCostValue).toFixed(2)}</strong></div>
            <div className="report-row"><span>Low-Stock Items</span><strong>{reports.lowStock}</strong></div>
            <div className="report-row"><span>Completed Repairs</span><strong>{reports.completedRepairs}</strong></div>
          </article>
        </div>

        <article className="reports-panel reports-sales"><h3>Recent Sales</h3>
          <div className="reports-table-wrap"><table><thead><tr><th>Sale</th><th>Date</th><th>Customer</th><th>Payment</th><th>Total</th></tr></thead><tbody>
            {reports.sales.slice(0, 50).map(sale => <tr key={sale.id}><td>{sale.number}</td><td>{new Date(sale.createdAt).toLocaleString()}</td><td>{sale.customerName || 'Walk-in'}</td><td>{sale.paymentMethod}</td><td>${sale.total.toFixed(2)}</td></tr>)}
            {!reports.sales.length && <tr><td colSpan={5}>No sales recorded for this period.</td></tr>}
          </tbody></table></div>
        </article>
      </section>
    </div>}
  </>;
}
