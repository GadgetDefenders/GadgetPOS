import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Boxes, CheckCircle2, Clock3, DollarSign, PackageOpen, ShoppingCart, Smartphone, Sparkles, Wrench } from 'lucide-react';
import { storage } from './storage';
import type { InventoryItem, Repair, Sale } from './types';

const sameDay=(value:string)=>new Date(value).toDateString()===new Date().toDateString();
const money=(value:number)=>`$${Number(value||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;

export default function DashboardCommandCenterWidget(){
 const [visible,setVisible]=useState(false);
 const [repairs,setRepairs]=useState<Repair[]>(storage.getRepairs());
 const [inventory,setInventory]=useState<InventoryItem[]>(storage.getInventory());
 const [sales,setSales]=useState<Sale[]>(storage.getSales());

 useEffect(()=>{
  const sync=()=>{
   setVisible(document.querySelector('.topbar h1')?.textContent?.trim()==='Dashboard');
   setRepairs(storage.getRepairs());setInventory(storage.getInventory());setSales(storage.getSales());
  };
  sync();
  const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  window.addEventListener('gadgetpos-data-changed',sync);window.addEventListener('storage',sync);
  return()=>{observer.disconnect();window.removeEventListener('gadgetpos-data-changed',sync);window.removeEventListener('storage',sync)};
 },[]);

 const data=useMemo(()=>{
  const today=sales.filter(s=>sameDay(s.createdAt));
  const open=repairs.filter(r=>r.status!=='Completed');
  const ready=open.filter(r=>r.status==='Ready for Pickup');
  const waiting=open.filter(r=>r.status==='Waiting on Parts');
  const working=open.filter(r=>['Diagnosing','Repairing','Quality Check'].includes(r.status));
  const low=inventory.filter(i=>i.quantity<=i.minimum);
  const phones=inventory.filter(i=>i.category==='Phone'&&i.quantity>0);
  const invCost=inventory.reduce((sum,i)=>sum+(Number(i.cost)||0)*i.quantity,0);
  const retail=inventory.reduce((sum,i)=>sum+(Number(i.price)||0)*i.quantity,0);
  const recent=[
   ...repairs.map(r=>({id:r.id,date:r.updatedAt||r.createdAt,title:`${r.number} · ${r.customerName}`,detail:`${r.brand} ${r.model} · ${r.status}`,kind:'repair'})),
   ...sales.map(s=>({id:s.id,date:s.createdAt,title:`${s.number} · ${money(s.total)}`,detail:s.customerName||'Walk-in customer',kind:'sale'}))
  ].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);
  return{today,open,ready,waiting,working,low,phones,invCost,retail,recent};
 },[repairs,inventory,sales]);

 function go(label:string){document.querySelectorAll('.sidebar nav button').forEach(b=>{if(b.textContent?.trim()===label)(b as HTMLButtonElement).click()})}
 if(!visible)return null;
 return <section className="dcc-shell">
  <div className="dcc-hero"><div><span className="dcc-eyebrow"><Sparkles size={15}/>GADGET DEFENDERS COMMAND CENTER</span><h2>Good evening, Rodney.</h2><p>Here’s what needs your attention at the store right now.</p></div><div className="dcc-hero-actions"><button onClick={()=>go('Repairs')}><Wrench size={17}/>New Repair</button><button className="primary" onClick={()=>go('POS')}><ShoppingCart size={17}/>Open Checkout</button></div></div>
  <div className="dcc-kpis">
   <article className="sales"><span><DollarSign/></span><div><small>Today’s Sales</small><strong>{money(data.today.reduce((s,x)=>s+x.total,0))}</strong><em>{data.today.length} transaction{data.today.length===1?'':'s'}</em></div></article>
   <article><span><Wrench/></span><div><small>Open Repairs</small><strong>{data.open.length}</strong><em>{data.working.length} being worked</em></div></article>
   <article className="ready"><span><CheckCircle2/></span><div><small>Ready for Pickup</small><strong>{data.ready.length}</strong><em>{money(data.ready.reduce((s,r)=>s+(Number(r.estimate)||0),0))} waiting</em></div></article>
   <article className="warning"><span><AlertTriangle/></span><div><small>Low Stock</small><strong>{data.low.length}</strong><em>items need attention</em></div></article>
   <article><span><Smartphone/></span><div><small>Phones in Stock</small><strong>{data.phones.reduce((s,i)=>s+i.quantity,0)}</strong><em>{money(data.phones.reduce((s,i)=>s+i.quantity*(Number(i.price)||0),0))} retail</em></div></article>
  </div>
  <div className="dcc-main-grid">
   <section className="dcc-panel repair-pulse"><header><div><h3>Repair Pulse</h3><p>Live workload across the shop</p></div><button onClick={()=>go('Repairs')}>View Repairs <ArrowRight size={15}/></button></header>
    <div className="dcc-lanes">
     <article><span className="dot checked"></span><div><strong>{data.open.filter(r=>r.status==='Checked In').length}</strong><small>Checked In</small></div></article>
     <article><span className="dot active"></span><div><strong>{data.working.length}</strong><small>In Progress</small></div></article>
     <article><span className="dot waiting"></span><div><strong>{data.waiting.length}</strong><small>Waiting on Parts</small></div></article>
     <article><span className="dot ready"></span><div><strong>{data.ready.length}</strong><small>Ready for Pickup</small></div></article>
    </div>
    <div className="dcc-ready-list"><h4>Ready for Pickup</h4>{data.ready.slice(0,4).map(r=><button key={r.id} onClick={()=>go('Repairs')}><div><strong>{r.number} · {r.customerName}</strong><span>{r.brand} {r.model} · {r.issue}</span></div><b>{money(r.estimate)}</b></button>)}{!data.ready.length&&<div className="dcc-empty"><CheckCircle2/>Nothing waiting for pickup.</div>}</div>
   </section>
   <section className="dcc-panel activity"><header><div><h3>Recent Activity</h3><p>Latest repairs and sales</p></div></header><div className="dcc-feed">{data.recent.map(x=><div key={`${x.kind}-${x.id}`}><span className={x.kind}>{x.kind==='sale'?<DollarSign/>:<Wrench/>}</span><div><strong>{x.title}</strong><small>{x.detail}</small></div><time>{new Date(x.date).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</time></div>)}{!data.recent.length&&<div className="dcc-empty">No activity yet.</div>}</div></section>
  </div>
  <div className="dcc-bottom-grid">
   <section className="dcc-panel inventory-health"><header><div><h3>Inventory Health</h3><p>Cash tied up in stock</p></div><button onClick={()=>go('Inventory')}>Open Inventory <ArrowRight size={15}/></button></header><div className="dcc-inventory-numbers"><div><span><Boxes/></span><small>Inventory Cost</small><strong>{money(data.invCost)}</strong></div><div><span><PackageOpen/></span><small>Potential Retail</small><strong>{money(data.retail)}</strong></div><div><span><DollarSign/></span><small>Potential Margin</small><strong>{money(data.retail-data.invCost)}</strong></div></div></section>
   <section className="dcc-panel attention"><header><div><h3>Needs Attention</h3><p>Your fastest next actions</p></div></header><button onClick={()=>go('Repairs')}><span className="warn"><Clock3/></span><div><strong>{data.waiting.length} repair{data.waiting.length===1?'':'s'} waiting on parts</strong><small>Review jobs that cannot move forward</small></div><ArrowRight/></button><button onClick={()=>go('Inventory')}><span className="danger"><AlertTriangle/></span><div><strong>{data.low.length} low-stock item{data.low.length===1?'':'s'}</strong><small>Restock before you run out</small></div><ArrowRight/></button></section>
  </div>
 </section>;
}
