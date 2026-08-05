import { useEffect, useMemo, useState } from 'react';
import { Boxes, History, PackagePlus, Search, SlidersHorizontal, X } from 'lucide-react';
import { storage } from './storage';
import type { InventoryItem } from './types';

type ActivityType='Received'|'Adjustment'|'Returned';
type Activity={id:string;itemId:string;itemName:string;type:ActivityType;quantity:number;before:number;after:number;unitCost:number;note?:string;createdAt:string};
const ACTIVITY_KEY='gadgetpos_inventory_activity_v1';
const readActivity=():Activity[]=>{try{return JSON.parse(localStorage.getItem(ACTIVITY_KEY)||'[]')}catch{return[]}};
const saveActivity=(rows:Activity[])=>localStorage.setItem(ACTIVITY_KEY,JSON.stringify(rows));

export default function InventoryReceivingWidget(){
  const [open,setOpen]=useState(false);
  const [mode,setMode]=useState<'receive'|'activity'>('receive');
  const [query,setQuery]=useState('');
  const [items,setItems]=useState<InventoryItem[]>(storage.getInventory());
  const [selectedId,setSelectedId]=useState('');
  const [quantity,setQuantity]=useState('');
  const [cost,setCost]=useState('');
  const [note,setNote]=useState('');
  const [adjustment,setAdjustment]=useState('');
  const [adjustmentType,setAdjustmentType]=useState<ActivityType>('Adjustment');
  const [activity,setActivity]=useState<Activity[]>(readActivity());

  useEffect(()=>{
    const nav=document.querySelector('.sidebar nav');
    if(!nav||document.getElementById('gadgetpos-receive-nav'))return;
    const button=document.createElement('button');
    button.id='gadgetpos-receive-nav';
    button.innerHTML='<span>📥</span><span>Receive Inventory</span>';
    button.onclick=()=>{setItems(storage.getInventory());setActivity(readActivity());setOpen(true)};
    nav.appendChild(button);
    return()=>button.remove();
  },[]);

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(!q)return items.slice(0,30);
    return items.filter(i=>[i.name,i.brand,i.model,i.sku,i.barcode,i.imei,i.serial,i.location].join(' ').toLowerCase().includes(q)).slice(0,40);
  },[items,query]);
  const selected=items.find(i=>i.id===selectedId);
  const history=activity.filter(a=>!selectedId||a.itemId===selectedId).slice(0,50);

  function choose(item:InventoryItem){setSelectedId(item.id);setCost(String(item.cost||''));setQuantity('');setNote('');setAdjustment('');}
  function record(entry:Activity,nextItems:InventoryItem[]){
    const nextActivity=[entry,...activity];
    storage.saveInventory(nextItems);saveActivity(nextActivity);setItems(nextItems);setActivity(nextActivity);
    window.dispatchEvent(new Event('gadgetpos-data-changed'));
  }
  function receive(){
    if(!selected)return;
    const qty=Number(quantity);
    if(!Number.isFinite(qty)||qty<=0){alert('Enter a quantity greater than zero.');return;}
    const newCost=cost.trim()===''?Number(selected.cost||0):Number(cost);
    if(!Number.isFinite(newCost)||newCost<0){alert('Enter a valid unit cost.');return;}
    const before=Number(selected.quantity||0),after=before+qty;
    const next=items.map(i=>i.id===selected.id?{...i,quantity:after,cost:newCost}:i);
    record({id:crypto.randomUUID(),itemId:selected.id,itemName:selected.name,type:'Received',quantity:qty,before,after,unitCost:newCost,note:note.trim()||undefined,createdAt:new Date().toISOString()},next);
    setQuantity('');setNote('');
  }
  function adjustStock(){
    if(!selected)return;
    const amount=Number(adjustment);
    if(!Number.isFinite(amount)||amount===0){alert('Enter a positive or negative stock adjustment.');return;}
    const before=Number(selected.quantity||0),after=before+amount;
    if(after<0){alert('This adjustment would make inventory negative.');return;}
    if(!note.trim()){alert('Add a short reason for the adjustment.');return;}
    const next=items.map(i=>i.id===selected.id?{...i,quantity:after}:i);
    record({id:crypto.randomUUID(),itemId:selected.id,itemName:selected.name,type:adjustmentType,quantity:amount,before,after,unitCost:Number(selected.cost||0),note:note.trim(),createdAt:new Date().toISOString()},next);
    setAdjustment('');setNote('');
  }

  const typeLabel=(entry:Activity)=>entry.type==='Received'?`Received +${entry.quantity}`:entry.type==='Returned'?`Returned ${entry.quantity>0?'+':''}${entry.quantity}`:`Adjusted ${entry.quantity>0?'+':''}${entry.quantity}`;

  return <>{open&&<div className="receive-overlay"><div className="receive-shell">
    <header><div><h1>Inventory Center</h1><p>Receive stock and see every inventory change in one place.</p></div><button onClick={()=>setOpen(false)}><X/></button></header>
    <div className="receive-mode-tabs"><button className={mode==='receive'?'active':''} onClick={()=>setMode('receive')}><PackagePlus size={17}/>Receive</button><button className={mode==='activity'?'active':''} onClick={()=>setMode('activity')}><History size={17}/>Activity</button></div>
    <div className="receive-layout">
      <section className="receive-list"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search item, SKU, barcode, model..."/></label><div>{filtered.map(item=><button key={item.id} className={selectedId===item.id?'active':''} onClick={()=>choose(item)}><span><strong>{item.name}</strong><small>{[item.brand,item.model,item.sku,item.location].filter(Boolean).join(' · ')}</small></span><b>{item.quantity}</b></button>)}{!filtered.length&&<p>No inventory item found.</p>}</div></section>
      <section className="receive-detail">{selected?<><div className="receive-item-head"><Boxes/><div><h2>{selected.name}</h2><p>{[selected.brand,selected.model,selected.sku].filter(Boolean).join(' · ')}</p></div><strong>{selected.quantity} on hand</strong></div>
        {mode==='receive'?<><div className="receive-fields"><label>Quantity Received<input type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)} autoFocus/></label><label>Unit Cost<input type="number" min="0" step="0.01" value={cost} onChange={e=>setCost(e.target.value)}/></label><label className="full">Optional Note<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Supplier, shipment, or box note"/></label></div><button className="receive-primary" onClick={receive}><PackagePlus size={18}/>Receive Inventory</button></>:<><div className="stock-adjust-card"><h3><SlidersHorizontal size={17}/>Stock Adjustment</h3><div className="receive-fields"><label>Action<select value={adjustmentType} onChange={e=>setAdjustmentType(e.target.value as ActivityType)}><option value="Adjustment">Manual Adjustment</option><option value="Returned">Returned to Stock</option></select></label><label>Quantity Change<input type="number" value={adjustment} onChange={e=>setAdjustment(e.target.value)} placeholder="Example: -1 or 2"/></label><label className="full">Reason<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Damaged, count correction, customer return..."/></label></div><button className="receive-primary" onClick={adjustStock}>Save Adjustment</button></div></>}
        <div className="receive-history"><h3><History size={17}/>{mode==='activity'?'Activity Timeline':'Recent Activity'}</h3>{history.map(a=><article key={a.id} className={`activity-${a.type.toLowerCase()}`}><div><strong>{typeLabel(a)}</strong><small>{new Date(a.createdAt).toLocaleString()} · {a.before} → {a.after}</small>{a.note&&<small>{a.note}</small>}</div><b>{a.type==='Received'?`$${a.unitCost.toFixed(2)}`:a.type}</b></article>)}{!history.length&&<p>No inventory activity for this item yet.</p>}</div></>:<div className="receive-empty"><PackagePlus size={42}/><strong>Select an inventory item</strong><span>Choose a part or product to receive or review.</span></div>}</section>
    </div>
  </div></div>}</>;
}
