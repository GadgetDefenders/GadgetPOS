import { useEffect, useMemo, useState } from 'react';
import { Plus, Printer, ShoppingCart, X } from 'lucide-react';
import { storage } from './storage';
import type { Customer } from './types';

export default function CustomerCenterWidget(){
  const [visible,setVisible]=useState(false);
  const [customers,setCustomers]=useState(storage.getCustomers());
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [adding,setAdding]=useState(false);
  const [name,setName]=useState('');
  const [phone,setPhone]=useState('');
  const [email,setEmail]=useState('');
  const [notes,setNotes]=useState('');

  useEffect(()=>{
    const sync=()=>{setVisible(document.querySelector('.topbar h1')?.textContent?.trim()==='Customers');setCustomers(storage.getCustomers())};
    sync();
    const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    const click=(e:MouseEvent)=>{
      if(document.querySelector('.topbar h1')?.textContent?.trim()!=='Customers')return;
      const row=(e.target as HTMLElement).closest('tbody tr');
      if(!row)return;
      const cells=row.querySelectorAll('td');
      const rowName=cells[0]?.textContent?.trim()||'';
      const rowPhone=cells[1]?.textContent?.trim()||'';
      const customer=storage.getCustomers().find(c=>c.name===rowName&&c.phone===rowPhone);
      if(customer)openCustomer(customer);
    };
    document.addEventListener('click',click);
    window.addEventListener('gadgetpos-data-changed',sync);
    return()=>{observer.disconnect();document.removeEventListener('click',click);window.removeEventListener('gadgetpos-data-changed',sync)};
  },[]);

  const selected=customers.find(c=>c.id===selectedId)||null;
  const repairs=useMemo(()=>selected?storage.getRepairs().filter(r=>r.customerId===selected.id||r.customerPhone===selected.phone||r.customerName.toLowerCase()===selected.name.toLowerCase()):[],[selectedId,customers]);
  const sales=useMemo(()=>selected?storage.getSales().filter(s=>s.customerId===selected.id||s.customerName?.toLowerCase()===selected.name.toLowerCase()):[],[selectedId,customers]);
  const totalSpent=sales.reduce((sum,s)=>sum+s.total,0);
  const openRepairs=repairs.filter(r=>r.status!=='Completed');
  const lastVisit=[...sales.map(s=>s.createdAt),...repairs.map(r=>r.createdAt)].sort().reverse()[0];

  function openCustomer(c:Customer){setSelectedId(c.id);setAdding(false);setName(c.name);setPhone(c.phone);setEmail(c.email||'');setNotes(c.notes||'')}
  function openAdd(){setSelectedId(null);setAdding(true);setName('');setPhone('');setEmail('');setNotes('')}
  function close(){setSelectedId(null);setAdding(false)}
  function save(){
    if(!name.trim()||!phone.trim()){alert('Customer name and phone are required.');return;}
    const now=new Date().toISOString();
    const all=storage.getCustomers();
    if(selected){
      const next=all.map(c=>c.id===selected.id?{...c,name:name.trim(),phone:phone.trim(),email:email.trim()||undefined,notes:notes.trim()||undefined,updatedAt:now}:c);
      storage.saveCustomers(next);setCustomers(next);setSelectedId(selected.id);
    }else{
      const c:Customer={id:crypto.randomUUID(),name:name.trim(),phone:phone.trim(),email:email.trim()||undefined,notes:notes.trim()||undefined,createdAt:now};
      const next=[c,...all];storage.saveCustomers(next);setCustomers(next);setSelectedId(c.id);setAdding(false);
    }
    window.dispatchEvent(new Event('gadgetpos-data-changed'));
  }
  function remove(){if(!selected||!confirm(`Delete ${selected.name}? Their repairs and sales will remain in history.`))return;const next=storage.getCustomers().filter(c=>c.id!==selected.id);storage.saveCustomers(next);setCustomers(next);close();window.dispatchEvent(new Event('gadgetpos-data-changed'))}
  function printHistory(){
    if(!selected)return;
    const frame=document.createElement('iframe');frame.style.position='fixed';frame.style.width='0';frame.style.height='0';frame.style.border='0';document.body.appendChild(frame);
    const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]||c));
    const rows=[...repairs.map(r=>({date:r.createdAt,type:'Repair',detail:`${r.number} · ${r.brand} ${r.model} · ${r.issue}`,amount:r.estimate})),...sales.map(s=>({date:s.createdAt,type:'Sale',detail:s.number,amount:s.total}))].sort((a,b)=>b.date.localeCompare(a.date));
    frame.contentDocument?.write(`<!doctype html><html><head><style>body{font-family:Arial;margin:28px;color:#17283a}h1{margin-bottom:3px}.muted{color:#687b8d}.stats{display:flex;gap:14px;margin:20px 0}.stats div{border:1px solid #ccd8e2;padding:12px;flex:1}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ddd;padding:9px;text-align:left}th{background:#f3f6f9}</style></head><body><h1>Gadget Defenders</h1><div class="muted">Customer History Report</div><h2>${esc(selected.name)}</h2><div>${esc(selected.phone)} · ${esc(selected.email||'No email')}</div><div class="stats"><div>Total Spent<br><b>$${totalSpent.toFixed(2)}</b></div><div>Repairs<br><b>${repairs.length}</b></div><div>Open Repairs<br><b>${openRepairs.length}</b></div></div><table><thead><tr><th>Date</th><th>Type</th><th>Details</th><th>Amount</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${new Date(x.date).toLocaleDateString()}</td><td>${x.type}</td><td>${esc(x.detail)}</td><td>$${Number(x.amount||0).toFixed(2)}</td></tr>`).join('')}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);frame.contentDocument?.close();setTimeout(()=>frame.remove(),30000)
  }
  function openCheckout(){document.querySelectorAll('.sidebar nav button').forEach(b=>{if(b.textContent?.trim()==='POS')(b as HTMLButtonElement).click()});close()}

  return <>
    {visible&&<button className="customer-add-button" onClick={openAdd}><Plus size={17}/>Add Customer</button>}
    {(selected||adding)&&<div className="customer-center-backdrop"><div className="customer-center"><div className="customer-center-head"><div><h2>{selected?'Customer Profile':'Add Customer'}</h2><p>{selected?`${selected.name} · ${selected.phone}`:'Create a new customer record'}</p></div><button onClick={close}><X/></button></div>
      <div className="customer-profile-grid"><label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Phone<input value={phone} onChange={e=>setPhone(e.target.value)}/></label><label>Email<input value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="full">Customer Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)}/></label></div>
      {selected&&<><div className="customer-stats"><article><span>Total Spent</span><strong>${totalSpent.toFixed(2)}</strong></article><article><span>Repairs</span><strong>{repairs.length}</strong></article><article><span>Open Tickets</span><strong>{openRepairs.length}</strong></article><article><span>Last Visit</span><strong>{lastVisit?new Date(lastVisit).toLocaleDateString():'—'}</strong></article></div><div className="customer-history"><h3>Customer History</h3>{[...repairs.map(r=>({id:r.id,date:r.createdAt,title:`${r.number} · ${r.brand} ${r.model}`,detail:r.issue,amount:r.estimate,status:r.status})),...sales.map(s=>({id:s.id,date:s.createdAt,title:s.number,detail:`${s.lines.length} item${s.lines.length===1?'':'s'} · ${s.paymentMethod}`,amount:s.total,status:'Paid'}))].sort((a,b)=>b.date.localeCompare(a.date)).map(x=><div key={x.id}><div><strong>{x.title}</strong><span>{new Date(x.date).toLocaleDateString()} · {x.detail}</span></div><div><b>${Number(x.amount||0).toFixed(2)}</b><small>{x.status}</small></div></div>)}{!repairs.length&&!sales.length&&<p>No repair or purchase history yet.</p>}</div></>}
      <div className="customer-center-actions">{selected&&<button className="danger" onClick={remove}>Delete</button>}<button onClick={close}>Cancel</button>{selected&&<button onClick={printHistory}><Printer size={16}/>Print History</button>}{selected&&<button onClick={openCheckout}><ShoppingCart size={16}/>Open Checkout</button>}<button className="primary" onClick={save}>Save Customer</button></div>
    </div></div>}
  </>;
}
