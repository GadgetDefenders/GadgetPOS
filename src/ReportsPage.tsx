import { useMemo, useState } from 'react';
import type { Customer, InventoryItem, Repair, Sale } from './types';

type RangeKey = 'week' | 'month' | 'year' | 'all' | 'custom';

type Props = {
  sales: Sale[];
  repairs: Repair[];
  customers: Customer[];
  inventory: InventoryItem[];
};

function startForRange(range: RangeKey, customStart: string): Date | null {
  if (range === 'all') return null;
  if (range === 'custom') return customStart ? new Date(`${customStart}T00:00:00`) : null;
  const now = new Date();
  const start = new Date(now);
  if (range === 'week') {
    const day = (now.getDay() + 6) % 7;
    start.setDate(now.getDate() - day);
  } else if (range === 'month') {
    start.setDate(1);
  } else {
    start.setMonth(0, 1);
  }
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function ReportsPage({ sales, repairs, customers, inventory }: Props) {
  const [range, setRange] = useState<RangeKey>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const start = startForRange(range, customStart);
  const end = range === 'custom' && customEnd ? new Date(`${customEnd}T23:59:59`) : new Date();
  const inRange = (date: string) => {
    const value = new Date(date);
    return (!start || value >= start) && value <= end;
  };

  const periodSales = useMemo(() => sales.filter(s => inRange(s.createdAt)), [sales, range, customStart, customEnd]);
  const periodRepairs = useMemo(() => repairs.filter(r => inRange(r.createdAt)), [repairs, range, customStart, customEnd]);
  const gross = periodSales.reduce((sum, sale) => sum + sale.total, 0);
  const tax = periodSales.reduce((sum, sale) => sum + sale.tax, 0);
  const subtotal = periodSales.reduce((sum, sale) => sum + sale.subtotal, 0);
  const average = periodSales.length ? gross / periodSales.length : 0;
  const repairRevenue = periodSales.flatMap(s => s.lines).filter(l => l.kind === 'Repair').reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const cardSales = periodSales.filter(s => s.paymentMethod === 'Card').reduce((sum, sale) => sum + sale.total, 0);
  const cashSales = periodSales.filter(s => s.paymentMethod === 'Cash').reduce((sum, sale) => sum + sale.total, 0);

  const customerRows = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    return customers.map(customer => {
      const customerSales = periodSales.filter(s => s.customerId === customer.id || s.customerName === customer.name);
      const customerRepairs = periodRepairs.filter(r => r.customerId === customer.id || r.customerName === customer.name);
      const spent = customerSales.reduce((sum, sale) => sum + sale.total, 0);
      const visits = customerSales.length;
      const dates = [...customerSales.map(s => s.createdAt), ...customerRepairs.map(r => r.createdAt)].sort().reverse();
      return { customer, spent, visits, repairs: customerRepairs.length, lastVisit: dates[0] };
    }).filter(row => !term || [row.customer.name, row.customer.phone, row.customer.email].join(' ').toLowerCase().includes(term))
      .sort((a, b) => b.spent - a.spent);
  }, [customers, periodSales, periodRepairs, customerSearch]);

  const inventoryCost = inventory.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  const inventoryRetail = inventory.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return <section className="reports-page content">
    <div className="reports-toolbar">
      <div>
        <h2>Store Reports</h2>
        <p>Sales, repairs, customers, payments, and inventory for the selected period.</p>
      </div>
      <div className="range-buttons">
        {(['week','month','year','all'] as RangeKey[]).map(key => <button key={key} className={range === key ? 'active' : ''} onClick={() => setRange(key)}>{key === 'all' ? 'All Time' : `This ${key[0].toUpperCase()}${key.slice(1)}`}</button>)}
        <button className={range === 'custom' ? 'active' : ''} onClick={() => setRange('custom')}>Custom</button>
      </div>
    </div>

    {range === 'custom' && <div className="custom-range panel"><label>Start<input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} /></label><label>End<input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} /></label></div>}

    <div className="report-metrics">
      <article><span>Gross Sales</span><strong>${gross.toFixed(2)}</strong><small>{periodSales.length} transactions</small></article>
      <article><span>Net Before Tax</span><strong>${subtotal.toFixed(2)}</strong><small>Sales before tax</small></article>
      <article><span>Tax Collected</span><strong>${tax.toFixed(2)}</strong><small>Sales tax liability</small></article>
      <article><span>Average Sale</span><strong>${average.toFixed(2)}</strong><small>Per transaction</small></article>
      <article><span>Repair Revenue</span><strong>${repairRevenue.toFixed(2)}</strong><small>{periodRepairs.length} repairs checked in</small></article>
      <article><span>Open Repairs</span><strong>{repairs.filter(r => r.status !== 'Completed').length}</strong><small>{repairs.filter(r => r.status === 'Waiting on Parts').length} waiting on parts</small></article>
    </div>

    <div className="reports-grid">
      <div className="panel report-panel">
        <div className="panel-title"><div><h3>Payment Summary</h3><p>How customers paid during this period.</p></div></div>
        <div className="summary-list"><div><span>Card</span><strong>${cardSales.toFixed(2)}</strong></div><div><span>Cash</span><strong>${cashSales.toFixed(2)}</strong></div><div><span>Split / Other</span><strong>${Math.max(0, gross-cardSales-cashSales).toFixed(2)}</strong></div></div>
      </div>
      <div className="panel report-panel">
        <div className="panel-title"><div><h3>Inventory Snapshot</h3><p>Current inventory value, independent of the date range.</p></div></div>
        <div className="summary-list"><div><span>Cost Value</span><strong>${inventoryCost.toFixed(2)}</strong></div><div><span>Retail Value</span><strong>${inventoryRetail.toFixed(2)}</strong></div><div><span>Low Stock Items</span><strong>{inventory.filter(i => i.quantity <= i.minimum).length}</strong></div></div>
      </div>
    </div>

    <div className="panel customer-report">
      <div className="panel-title customer-report-title"><div><h3>Customer Report</h3><p>Customer activity for this week, month, year, all time, or a custom period.</p></div><input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customer, phone, or email" /></div>
      <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Phone</th><th>Money Spent</th><th>Sales</th><th>Repairs</th><th>Last Visit</th></tr></thead><tbody>{customerRows.map(({customer,spent,visits,repairs:lastRepairs,lastVisit}) => <tr key={customer.id}><td><strong>{customer.name}</strong><small>{customer.email || ''}</small></td><td>{customer.phone}</td><td>${spent.toFixed(2)}</td><td>{visits}</td><td>{lastRepairs}</td><td>{lastVisit ? new Date(lastVisit).toLocaleDateString() : '—'}</td></tr>)}{!customerRows.length && <tr><td colSpan={6}>No customer activity found for this period.</td></tr>}</tbody></table></div>
    </div>
  </section>;
}
