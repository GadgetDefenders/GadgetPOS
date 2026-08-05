import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Printer, Search, X } from 'lucide-react';
import { storage } from './storage';
import type { PaymentMethod, Repair, Sale } from './types';

const money=(n:number)=>`$${Number(n||0).toFixed(2)}`;
const uid=()=>crypto.randomUUID();

export default function RepairCloseoutWidget(){
  const [visible,setVisible]=useState(false);
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [repair,setRepair]=useState<Repair|null>(null);
  const [payment,setPayment]=useState<PaymentMethod>('Card');
  const [tendered,setTendered]=useState('');
  const [closedSale,setClosedSale]=useState<Sale|null>(null);
  const [repairs,setRepairs]=useState<Repair[]>(storage.getRepairs());

  useEffect(()=>{
    const sync=()=>{setVisible(document.querySelector('.topbar h1')?.textContent?.trim()==='Repairs');setRepairs(storage.getRepairs())};
    sync();
    const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    window.addEventListener('gadgetpos-data-changed',sync);
    return()=>{observer.disconnect();window.removeEventListener('gadgetpos-data-changed',sync)};
  },[]);

  const ready=useMemo(()=>repairs.filter(r=>r.status==='Ready for Pickup'&&[r.number,r.customerName,r.customerPhone,r.brand,r.model].join(' ').toLowerCase().includes(query.toLowerCase())),[repairs,query]);

  function closeTicket(){
    if(!repair)return;
    const total=Number(repair.estimate||0);
    const amount=payment==='Cash'?Number(tendered||0):total;
    if(payment==='Cash'&&amount<total){alert('Cash tendered cannot be less than the balance due.');return}
    const sales=storage.getSales();
    const next=Math.max(0,...sales.map(s=>Number(s.number.replace(/\D/g,''))||0))+1;
    const sale:Sale={id:uid(),number:`S-${String(next).padStart(5,'0')}`,customerId:repair.customerId,customerName:repair.customerName,lines:[{id:uid(),kind:'Repair',referenceId:repair.id,description:`${repair.brand} ${repair.model} — ${repair.issue}`,quantity:1,unitPrice:total,taxable:false}],subtotal:total,tax:0,total,paymentMethod:payment,amountTendered:payment==='Cash'?amount:undefined,changeDue:payment==='Cash'?Math.max(0,amount-total):undefined,notes:`Closed repair ${repair.number}`,createdAt:new Date().toISOString()};
    storage.saveSales([sale,...sales]);
    storage.saveRepairs(storage.getRepairs().map(r=>r.id===repair.id?{...r,status:'Completed',updatedAt:new Date().toISOString(),notes:[r.notes,`Closed with ${sale.number} via ${payment}`].filter(Boolean).join('\n')}:r));
    storage.saveTimeline([{id:uid(),repairId:repair.id,action:'Completed and closed',notes:`Payment ${payment} · ${sale.number}`,employee:'Rodney',createdAt:new Date().toISOString()},...storage.getTimeline()]);
    setClosedSale(sale);setRepair(null);setTendered('');setRepairs(storage.getRepairs());window.dispatchEvent(new Event('gadgetpos-data-changed'));
  }

  function printReceipt(sale:Sale){
    const frame=document.createElement('iframe');frame.style.cssText='position:fixed;width:1px;height:1px;opacity:0;border:0';document.body.appendChild(frame);const d=frame.contentWindow?.document;if(!d)return;
    d.open();d.write(`<html><head><style>body{font-family:Arial;padding:28px;color:#17283a}h1{margin:0}.line{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:10px 0}.total{font-size:22px;font-weight:800;margin-top:14px}</style></head><body><h1>Gadget Defenders</h1><p>203 Burkesville St, Suite 121 · Columbia, KY 42728<br>270-380-1505</p><h2>${sale.number}</h2><p>${sale.customerName||'Customer'} · ${new Date(sale.createdAt).toLocaleString()}</p>${sale.lines.map(l=>`<div class="line"><span>${l.description}</span><b>${money(l.unitPrice*l.quantity)}</b></div>`).join('')}<div class="total">Total: ${money(sale.total)}</div><p>Payment: ${sale.paymentMethod}</p>${sale.changeDue?`<p>Change: ${money(sale.changeDue)}</p>`:''}<p>Thank you for choosing Gadget Defenders.</p></body></html>`);d.close();setTimeout(()=>{frame.contentWindow?.print();setTimeout(()=>frame.remove(),1200)},250)
  }

  if(!visible)return null;
  return <>
    <button className="rc-open" onClick={()=>setOpen(true)}><CheckCircle2 size={17}/>Close Out Repair <span>{ready.length}</span></button>
    {open&&<div className="rc-backdrop"><div className="rc-modal"><div className="rc-head"><div><h2>Repair Checkout</h2><p>Only repairs marked Ready for Pickup appear here.</p></div><button onClick={()=>{setOpen(false);setRepair(null)}}><X/></button></div>
      {!repair&&<><label className="rc-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ticket, customer, phone, or device..."/></label><div className="rc-list">{ready.map(r=><button key={r.id} onClick={()=>setRepair(r)}><div><strong>{r.number} · {r.customerName}</strong><span>{r.brand} {r.model} · {r.issue}</span></div><b>{money(r.estimate)}</b></button>)}{!ready.length&&<div className="rc-empty">No Ready for Pickup repairs match your search.</div>}</div></>}
      {repair&&<div className="rc-checkout"><button className="rc-back" onClick={()=>setRepair(null)}>← Back to ready repairs</button><div className="rc-summary"><h3>{repair.number}</h3><strong>{repair.customerName}</strong><span>{repair.customerPhone}</span><span>{repair.brand} {repair.model}</span><span>{repair.issue}</span><b>Balance Due {money(repair.estimate)}</b></div><label>Payment Method<select value={payment} onChange={e=>setPayment(e.target.value as PaymentMethod)}><option>Card</option><option>Cash</option><option>Split</option><option>Other</option></select></label>{payment==='Cash'&&<label>Cash Tendered<input type="number" min="0" step=".01" value={tendered} onChange={e=>setTendered(e.target.value)}/><small>Change due: {money(Math.max(0,Number(tendered||0)-repair.estimate))}</small></label>}<button className="rc-complete" onClick={closeTicket}><CheckCircle2 size={18}/>Complete & Close Ticket</button></div>}
    </div></div>}
    {closedSale&&<div className="rc-backdrop"><div className="rc-modal small"><div className="rc-head"><div><h2>Ticket Closed</h2><p>{closedSale.number} was recorded successfully.</p></div><button onClick={()=>setClosedSale(null)}><X/></button></div><div className="rc-success"><CheckCircle2 size={42}/><strong>{money(closedSale.total)} paid</strong><span>{closedSale.paymentMethod}</span><button onClick={()=>printReceipt(closedSale)}><Printer size={17}/>Print Final Receipt</button><button className="rc-complete" onClick={()=>setClosedSale(null)}>Done</button></div></div></div>}
  </>;
}
