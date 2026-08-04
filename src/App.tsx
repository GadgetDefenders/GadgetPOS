import { useMemo, useState } from 'react';
import { Boxes, LayoutDashboard, Search, Settings, ShoppingCart, Users, Wrench } from 'lucide-react';
import { storage } from './storage';
import type { Customer, InventoryItem, Repair, RepairStatus } from './types';

const statuses: RepairStatus[] = [
  'Checked In',
  'Diagnosing',
  'Waiting on Parts',
  'Repairing',
  'Quality Check',
  'Ready for Pickup',
  'Completed',
];

type Page = 'dashboard' | 'repairs' | 'customers' | 'inventory' | 'pos' | 'settings';

const navItems: Array<{ page: Page; label: string; icon: typeof LayoutDashboard }> = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'repairs', label: 'Repairs', icon: Wrench },
  { page: 'customers', label: 'Customers', icon: Users },
  { page: 'inventory', label: 'Inventory', icon: Boxes },
  { page: 'pos', label: 'POS', icon: ShoppingCart },
  { page: 'settings', label: 'Settings', icon: Settings },
];

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>(storage.getCustomers());
  const [repairs, setRepairs] = useState<Repair[]>(storage.getRepairs());
  const [inventory, setInventory] = useState<InventoryItem[]>(storage.getInventory());

  const filteredRepairs = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return repairs;
    return repairs.filter((repair) =>
      [repair.number, repair.customerName, repair.customerPhone, repair.brand, repair.model, repair.issue]
        .join(' ')
        .toLowerCase()
        .includes(text),
    );
  }, [query, repairs]);

  const lowInventory = inventory.filter((item) => item.quantity <= item.minimum).length;
  const ready = repairs.filter((repair) => repair.status === 'Ready for Pickup').length;
  const waitingParts = repairs.filter((repair) => repair.status === 'Waiting on Parts').length;

  function addDemoRepair() {
    const id = crypto.randomUUID();
    const customer: Customer = {
      id: crypto.randomUUID(),
      name: 'Test Customer',
      phone: '270-000-0000',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    };
    const repair: Repair = {
      id,
      number: `GD-${1001 + repairs.length}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      deviceType: 'Cell Phone',
      brand: 'Apple',
      model: 'iPhone 17 Pro Max',
      issue: 'Screen Repair',
      status: 'Checked In',
      technician: 'Rodney',
      priority: 'Normal',
      estimate: 199,
      createdAt: new Date().toISOString(),
    };
    const nextCustomers = [customer, ...customers];
    const nextRepairs = [repair, ...repairs];
    setCustomers(nextCustomers);
    setRepairs(nextRepairs);
    storage.saveCustomers(nextCustomers);
    storage.saveRepairs(nextRepairs);
  }

  function moveRepair(id: string, status: RepairStatus) {
    const next = repairs.map((repair) => (repair.id === id ? { ...repair, status } : repair));
    setRepairs(next);
    storage.saveRepairs(next);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span>GP</span><div><strong>GadgetPOS</strong><small>Developer Preview 0.1</small></div></div>
        <nav>
          {navItems.map(({ page: target, label, icon: Icon }) => (
            <button className={page === target ? 'active' : ''} key={target} onClick={() => setPage(target)}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
      </aside>

      <main>
        <header className="topbar">
          <div><h1>{navItems.find((item) => item.page === page)?.label}</h1><p>Gadget Defenders repair shop management</p></div>
          <label className="search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, phone, repair, device..." /></label>
        </header>

        {page === 'dashboard' && (
          <section className="content">
            <div className="stats">
              <article><span>Open Repairs</span><strong>{repairs.filter((r) => r.status !== 'Completed').length}</strong></article>
              <article><span>Ready for Pickup</span><strong>{ready}</strong></article>
              <article><span>Waiting on Parts</span><strong>{waitingParts}</strong></article>
              <article><span>Low Inventory</span><strong>{lowInventory}</strong></article>
            </div>
            <div className="panel">
              <div className="panel-heading"><div><h2>Getting started</h2><p>This is the first real GadgetPOS project foundation.</p></div><button className="primary" onClick={addDemoRepair}>Add test repair</button></div>
              <p>The next build will add customer creation, searchable check-in, repair editing, and persistent repair timelines.</p>
            </div>
          </section>
        )}

        {page === 'repairs' && (
          <section className="content board-wrap">
            <div className="repair-board">
              {statuses.map((status) => (
                <div className="board-column" key={status}>
                  <div className="column-heading"><h3>{status}</h3><span>{filteredRepairs.filter((repair) => repair.status === status).length}</span></div>
                  {filteredRepairs.filter((repair) => repair.status === status).map((repair) => (
                    <article className="repair-card" key={repair.id}>
                      <strong>{repair.number}</strong><h4>{repair.brand} {repair.model}</h4><p>{repair.customerName}</p><small>{repair.issue}</small>
                      <select value={repair.status} onChange={(event) => moveRepair(repair.id, event.target.value as RepairStatus)}>
                        {statuses.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {page === 'customers' && <Placeholder title="Customers" detail={`${customers.length} saved customer record(s). Customer search and profiles are next.`} />}
        {page === 'inventory' && <Placeholder title="Inventory" detail={`${inventory.length} inventory item(s). Parts, vendors, and reorder tracking will connect here.`} />}
        {page === 'pos' && <Placeholder title="POS Checkout" detail="Repair checkout, sales tax, payments, barcode lookup, and receipts will connect here." />}
        {page === 'settings' && <Placeholder title="Settings" detail="Store setup, employees, permissions, printers, devices, and repair catalogs will connect here." />}
      </main>
    </div>
  );
}

function Placeholder({ title, detail }: { title: string; detail: string }) {
  return <section className="content"><div className="panel"><h2>{title}</h2><p>{detail}</p></div></section>;
}

export default App;
