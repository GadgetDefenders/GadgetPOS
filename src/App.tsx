import { FormEvent, useMemo, useState } from 'react';
import { Boxes, LayoutDashboard, Plus, Search, Settings, ShoppingCart, Users, Wrench, X } from 'lucide-react';
import { storage } from './storage';
import type { Customer, InventoryItem, Repair, RepairStatus } from './types';

const statuses: RepairStatus[] = ['Checked In','Diagnosing','Waiting on Parts','Repairing','Quality Check','Ready for Pickup','Completed'];
const deviceTypes = ['Cell Phone','Tablet','Computer','Game Console'];
const brands: Record<string,string[]> = {
  'Cell Phone':['Apple','Samsung','Google','Motorola','Other'],
  Tablet:['Apple','Samsung','Other'],
  Computer:['Apple','Windows','Other'],
  'Game Console':['Sony','Microsoft','Nintendo','Other'],
};
const applePhones = ['iPhone 8','iPhone 8 Plus','iPhone X','iPhone XR','iPhone XS','iPhone XS Max','iPhone SE (2020)','iPhone 11','iPhone 11 Pro','iPhone 11 Pro Max','iPhone SE (2022)','iPhone 12 mini','iPhone 12','iPhone 12 Pro','iPhone 12 Pro Max','iPhone 13 mini','iPhone 13','iPhone 13 Pro','iPhone 13 Pro Max','iPhone 14','iPhone 14 Plus','iPhone 14 Pro','iPhone 14 Pro Max','iPhone 15','iPhone 15 Plus','iPhone 15 Pro','iPhone 15 Pro Max','iPhone 16','iPhone 16 Plus','iPhone 16 Pro','iPhone 16 Pro Max','iPhone 16e','iPhone 17','iPhone Air','iPhone 17 Pro','iPhone 17 Pro Max'];
const models: Record<string,string[]> = {
  Apple: applePhones,
  Samsung:['Galaxy S Series','Galaxy A Series','Galaxy Note','Galaxy Tab','Other Samsung'],
  Google:['Pixel Series'], Motorola:['Moto G','Edge','Razr'], Sony:['PlayStation 4','PS4 Slim','PS4 Pro','PlayStation 5','PS5 Slim'],
  Microsoft:['Xbox One','Xbox One S','Xbox One X','Xbox Series S','Xbox Series X'], Nintendo:['Nintendo Switch','Switch Lite','Switch OLED'],
  Windows:['Windows Laptop','Windows Desktop','Gaming PC'], Other:['Other Device'],
};
const issues = ['Screen','Battery','Charging Port','Back Glass','Camera','Speaker','Microphone','No Power','Water Damage','HDMI Port','Overheating','Diagnostic','Other'];

type Page = 'dashboard'|'repairs'|'customers'|'inventory'|'pos'|'settings';
type CustomerForm = Omit<Customer,'id'|'createdAt'|'updatedAt'>;
type RepairForm = {customerId:string;deviceType:string;brand:string;model:string;color:string;serial:string;passcode:string;issue:string;part:string;technician:string;priority:Repair['priority'];estimate:string;dueDate:string;notes:string};

const emptyCustomer: CustomerForm = {name:'',phone:'',email:'',notes:''};
const emptyRepair: RepairForm = {customerId:'',deviceType:'Cell Phone',brand:'Apple',model:'',color:'',serial:'',passcode:'',issue:'Screen',part:'',technician:'Rodney',priority:'Normal',estimate:'',dueDate:'',notes:''};

const navItems: Array<{page:Page;label:string;icon:typeof LayoutDashboard}> = [
  {page:'dashboard',label:'Dashboard',icon:LayoutDashboard},{page:'repairs',label:'Repairs',icon:Wrench},{page:'customers',label:'Customers',icon:Users},{page:'inventory',label:'Inventory',icon:Boxes},{page:'pos',label:'POS',icon:ShoppingCart},{page:'settings',label:'Settings',icon:Settings},
];

function App(){
  const [page,setPage]=useState<Page>('dashboard');
  const [query,setQuery]=useState('');
  const [customers,setCustomers]=useState<Customer[]>(storage.getCustomers());
  const [repairs,setRepairs]=useState<Repair[]>(storage.getRepairs());
  const [inventory]=useState<InventoryItem[]>(storage.getInventory());
  const [customerModal,setCustomerModal]=useState(false);
  const [repairModal,setRepairModal]=useState(false);
  const [editingCustomerId,setEditingCustomerId]=useState<string|null>(null);
  const [customerForm,setCustomerForm]=useState<CustomerForm>(emptyCustomer);
  const [repairForm,setRepairForm]=useState<RepairForm>(emptyRepair);
  const [customerSearch,setCustomerSearch]=useState('');
  const [modelSearch,setModelSearch]=useState('');

  const filteredRepairs=useMemo(()=>{const t=query.trim().toLowerCase();if(!t)return repairs;return repairs.filter(r=>[r.number,r.customerName,r.customerPhone,r.brand,r.model,r.issue,r.serial].join(' ').toLowerCase().includes(t));},[query,repairs]);
  const filteredCustomers=useMemo(()=>{const t=(customerSearch||query).trim().toLowerCase();if(!t)return customers;return customers.filter(c=>[c.name,c.phone,c.email,c.notes].join(' ').toLowerCase().includes(t));},[customers,customerSearch,query]);
  const selectedCustomer=customers.find(c=>c.id===repairForm.customerId);
  const modelOptions=(models[repairForm.brand]||['Other Device']).filter(m=>m.toLowerCase().includes(modelSearch.toLowerCase()));
  const lowInventory=inventory.filter(i=>i.quantity<=i.minimum).length;

  function persistCustomers(next:Customer[]){setCustomers(next);storage.saveCustomers(next)}
  function persistRepairs(next:Repair[]){setRepairs(next);storage.saveRepairs(next)}
  function openNewCustomer(){setEditingCustomerId(null);setCustomerForm(emptyCustomer);setCustomerModal(true)}
  function openEditCustomer(customer:Customer){setEditingCustomerId(customer.id);setCustomerForm({name:customer.name,phone:customer.phone,email:customer.email||'',notes:customer.notes||''});setCustomerModal(true)}
  function saveCustomer(event:FormEvent){event.preventDefault();if(!customerForm.name.trim()||!customerForm.phone.trim())return;
    if(editingCustomerId){persistCustomers(customers.map(c=>c.id===editingCustomerId?{...c,...customerForm,updatedAt:new Date().toISOString()}:c));}
    else{persistCustomers([{id:crypto.randomUUID(),...customerForm,createdAt:new Date().toISOString()},...customers]);}
    setCustomerModal(false);
  }
  function openCheckIn(customerId=''){setRepairForm({...emptyRepair,customerId});setModelSearch('');setRepairModal(true)}
  function saveRepair(event:FormEvent){event.preventDefault();const customer=customers.find(c=>c.id===repairForm.customerId);if(!customer||!repairForm.model.trim())return;
    const repair:Repair={id:crypto.randomUUID(),number:`GD-${1001+repairs.length}`,customerId:customer.id,customerName:customer.name,customerPhone:customer.phone,deviceType:repairForm.deviceType,brand:repairForm.brand,model:repairForm.model,color:repairForm.color,serial:repairForm.serial,passcode:repairForm.passcode,issue:repairForm.issue,part:repairForm.part,status:'Checked In',technician:repairForm.technician,priority:repairForm.priority,estimate:Number(repairForm.estimate)||0,createdAt:new Date().toISOString(),dueDate:repairForm.dueDate,notes:repairForm.notes};
    persistRepairs([repair,...repairs]);setRepairModal(false);setPage('repairs');
  }
  function moveRepair(id:string,status:RepairStatus){persistRepairs(repairs.map(r=>r.id===id?{...r,status}:r))}
  function deleteCustomer(id:string){if(!confirm('Delete this customer? Their repair tickets will remain.'))return;persistCustomers(customers.filter(c=>c.id!==id))}
  const ready=repairs.filter(r=>r.status==='Ready for Pickup').length;
  const waitingParts=repairs.filter(r=>r.status==='Waiting on Parts').length;

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span>GP</span><div><strong>GadgetPOS</strong><small>Developer Preview 0.2</small></div></div><nav>{navItems.map(({page:target,label,icon:Icon})=><button className={page===target?'active':''} key={target} onClick={()=>setPage(target)}><Icon size={18}/>{label}</button>)}</nav></aside>
    <main><header className="topbar"><div><h1>{navItems.find(i=>i.page===page)?.label}</h1><p>Gadget Defenders repair shop management</p></div><label className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search customer, phone, repair, IMEI..."/></label></header>

    {page==='dashboard'&&<section className="content"><div className="stats"><article><span>Open Repairs</span><strong>{repairs.filter(r=>r.status!=='Completed').length}</strong></article><article><span>Ready for Pickup</span><strong>{ready}</strong></article><article><span>Waiting on Parts</span><strong>{waitingParts}</strong></article><article><span>Customers</span><strong>{customers.length}</strong></article><article><span>Low Inventory</span><strong>{lowInventory}</strong></article></div><div className="panel"><div className="panel-heading"><div><h2>Front Counter</h2><p>Search a saved customer or begin a new check-in.</p></div><div className="actions"><button onClick={openNewCustomer}>New Customer</button><button className="primary" onClick={()=>openCheckIn()}><Plus size={17}/>Check In Device</button></div></div></div></section>}

    {page==='repairs'&&<section className="content board-wrap"><div className="panel-heading board-title"><div><h2>Repair Board</h2><p>Move tickets through the shop workflow.</p></div><button className="primary" onClick={()=>openCheckIn()}><Plus size={17}/>New Repair</button></div><div className="repair-board">{statuses.map(status=><div className="board-column" key={status}><div className="column-heading"><h3>{status}</h3><span>{filteredRepairs.filter(r=>r.status===status).length}</span></div>{filteredRepairs.filter(r=>r.status===status).map(r=><article className="repair-card" key={r.id}><strong>{r.number}</strong><h4>{r.brand} {r.model}</h4><p>{r.customerName}</p><small>{r.issue}{r.part?` — ${r.part}`:''}</small><select value={r.status} onChange={e=>moveRepair(r.id,e.target.value as RepairStatus)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></article>)}</div>)}</div></section>}

    {page==='customers'&&<section className="content"><div className="panel"><div className="panel-heading"><div><h2>Customers</h2><p>Every repair stays connected to the customer profile.</p></div><button className="primary" onClick={openNewCustomer}><Plus size={17}/>Add Customer</button></div><label className="inline-search"><Search size={17}/><input value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} placeholder="Search name, phone, or email"/></label><div className="table-wrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Repairs</th><th>Last Visit</th><th>Actions</th></tr></thead><tbody>{filteredCustomers.map(c=>{const history=repairs.filter(r=>r.customerId===c.id);return <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.phone}</td><td>{c.email||'—'}</td><td>{history.length}</td><td>{history[0]?new Date(history[0].createdAt).toLocaleDateString():'—'}</td><td className="row-actions"><button onClick={()=>openCheckIn(c.id)}>Check In</button><button onClick={()=>openEditCustomer(c)}>Edit</button><button className="danger" onClick={()=>deleteCustomer(c.id)}>Delete</button></td></tr>})}</tbody></table></div></div></section>}

    {page==='inventory'&&<Placeholder title="Inventory" detail={`${inventory.length} inventory item(s). Parts and automatic deduction are next.`}/>} {page==='pos'&&<Placeholder title="POS Checkout" detail="Repair lookup, payments, tax, and receipt printing will connect here."/>} {page==='settings'&&<Placeholder title="Settings" detail="Store details, catalogs, employees, and printer profiles will connect here."/>}
    </main>

    {customerModal&&<Modal title={editingCustomerId?'Edit Customer':'New Customer'} onClose={()=>setCustomerModal(false)}><form className="form-grid" onSubmit={saveCustomer}><label>Name<input required value={customerForm.name} onChange={e=>setCustomerForm({...customerForm,name:e.target.value})}/></label><label>Phone<input required value={customerForm.phone} onChange={e=>setCustomerForm({...customerForm,phone:e.target.value})}/></label><label>Email<input type="email" value={customerForm.email} onChange={e=>setCustomerForm({...customerForm,email:e.target.value})}/></label><label className="full">Customer Notes<textarea value={customerForm.notes} onChange={e=>setCustomerForm({...customerForm,notes:e.target.value})}/></label><div className="modal-actions full"><button type="button" onClick={()=>setCustomerModal(false)}>Cancel</button><button className="primary" type="submit">Save Customer</button></div></form></Modal>}

    {repairModal&&<Modal title="Check In Device" onClose={()=>setRepairModal(false)}><form className="form-grid" onSubmit={saveRepair}><label className="full">Saved Customer<select required value={repairForm.customerId} onChange={e=>setRepairForm({...repairForm,customerId:e.target.value})}><option value="">Choose customer...</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}</select></label>{selectedCustomer&&<div className="customer-preview full"><strong>{selectedCustomer.name}</strong><span>{selectedCustomer.phone}</span><small>{selectedCustomer.email}</small></div>}<label>Device Type<select value={repairForm.deviceType} onChange={e=>{const type=e.target.value;const brand=brands[type]?.[0]||'Other';setRepairForm({...repairForm,deviceType:type,brand,model:''})}}>{deviceTypes.map(v=><option key={v}>{v}</option>)}</select></label><label>Brand<select value={repairForm.brand} onChange={e=>setRepairForm({...repairForm,brand:e.target.value,model:''})}>{(brands[repairForm.deviceType]||['Other']).map(v=><option key={v}>{v}</option>)}</select></label><label className="full">Search Model<input value={modelSearch} onChange={e=>setModelSearch(e.target.value)} placeholder="Type 16 Pro Max, PS5, iPad..."/></label><label className="full">Model<select required size={Math.min(7,Math.max(2,modelOptions.length))} value={repairForm.model} onChange={e=>setRepairForm({...repairForm,model:e.target.value})}>{modelOptions.map(v=><option key={v}>{v}</option>)}</select></label><label>Color<input value={repairForm.color} onChange={e=>setRepairForm({...repairForm,color:e.target.value})}/></label><label>IMEI / Serial<input value={repairForm.serial} onChange={e=>setRepairForm({...repairForm,serial:e.target.value})}/></label><label>Passcode<input value={repairForm.passcode} onChange={e=>setRepairForm({...repairForm,passcode:e.target.value})}/></label><label>Problem<select value={repairForm.issue} onChange={e=>setRepairForm({...repairForm,issue:e.target.value})}>{issues.map(v=><option key={v}>{v}</option>)}</select></label><label>Part / Service<input value={repairForm.part} onChange={e=>setRepairForm({...repairForm,part:e.target.value})}/></label><label>Technician<input value={repairForm.technician} onChange={e=>setRepairForm({...repairForm,technician:e.target.value})}/></label><label>Priority<select value={repairForm.priority} onChange={e=>setRepairForm({...repairForm,priority:e.target.value as Repair['priority']})}><option>Normal</option><option>High</option><option>Urgent</option></select></label><label>Estimate<input type="number" step="0.01" value={repairForm.estimate} onChange={e=>setRepairForm({...repairForm,estimate:e.target.value})}/></label><label>Due Date<input type="date" value={repairForm.dueDate} onChange={e=>setRepairForm({...repairForm,dueDate:e.target.value})}/></label><label className="full">Repair Notes<textarea value={repairForm.notes} onChange={e=>setRepairForm({...repairForm,notes:e.target.value})}/></label><div className="modal-actions full"><button type="button" onClick={()=>setRepairModal(false)}>Cancel</button><button className="primary" type="submit">Save Repair Ticket</button></div></form></Modal>}
  </div>;
}

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <div className="modal-backdrop"><div className="modal"><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose}><X size={20}/></button></div>{children}</div></div>}
function Placeholder({title,detail}:{title:string;detail:string}){return <section className="content"><div className="panel"><h2>{title}</h2><p>{detail}</p></div></section>}
export default App;
