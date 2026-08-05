import { useEffect, useMemo, useState } from 'react';
import { Boxes, History, PackagePlus, Search, X } from 'lucide-react';
import { storage } from './storage';
import type { InventoryItem } from './types';

type Activity={id:string;itemId:string;itemName:string;type:'Received';quantity:number;before:number;after:number;unitCost:number;note?:string;createdAt:string};
const ACTIVITY_KEY='gadgetpos_inventory_activity_v1';
const readActivity=():Activity[]=>{try{return JSON.parse(localStorage.getItem(ACTIVITY_KEY)||'[]')}catch{return[]}};
const saveActivity=(rows:Activity[])=>localStorage.setItem(ACTIVITY_KEY,JSON.stringify(rows));

export default function InventoryReceivingWidget(){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [items,setItems]=useState<InventoryItem[]>(storage.getInventory());
  const [selectedId,setSelectedId]=useState('');
  const [quantity,setQuantity]=useState('');
  const [cost,setCost]=useState('');
  const [note,setNote]=useState('');
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
    if(!q)return items.slice(0,20);
    return items.filter(i=>[i.name,i.brand,i.model,i.sku,i.barcode,i.imei,i.serial,i.location].join(' ').toLowerCase().includes(q)).slice(0,30);
  },[items,query]);
  const selected=items.find(i=>i.id===selectedId);
  const history=activity.filter(a=>!selectedId||a.itemId===selectedId).slice(0,20);

  function choose(item:InventoryItem){setSelectedId(item.id);setCost(String(item.cost||''));setQuantity('');setNote('');}
  function receive(){
    if(!selected)return;
    const qty=Number(quantity);
    if(!Number.isFinite(qty)||qty<=0){alert('Enter a quantity greater than zero.');return;}
    const newCost=cost.trim()===''?Number(selected.cost||0):Number(cost);
    if(!Number.isFinite(newCost)||newCost<0){alert('Enter a valid unit cost.');return;}
    const before=Number(selected.quantity||0),after=before+qty;
    const next=items.map(i=>i.id===selected.id?{...i,quantity:after,cost:newCost}:i);
    const entry:Activity={id:crypto.randomUUID(),itemId:selected.id,itemName:selected.name,type:'Received',quantity:qty,before,after,unitCost:newCost,note:note.trim()||undefined,createdAt:new Date().toISOString()};
    const nextActivity=[entry,...activity];
    storage.saveInventory(next);saveActivity(nextActivity);setItems(next);setActivity(nextActivity);setQuantity('');setNote('');
    window.dispatchEvent(new Event('gadgetpos-data-changed'));
  }

  return <>{open&&<div className="receive-overlay"><div className="receive-shell">
    <header><div><h1>Receive Inventory</h1><p>Find an item, enter what arrived, and update stock.</p></div><button onClick={()=>setOpen(false)}><X/></button></header>
    <div className="receive-layout">
      <section className="receive-list"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search item, SKU, barcode, model..."/></label><div>{filtered.map(item=><button key={item.id} className={selectedId===item.id?'active':''} onClick={()=>choose(item)}><span><strong>{item.name}</strong><small>{[item.brand,item.model,item.sku,item.location].filter(Boolean).join(' · ')}</small></span><b>{item.quantity}</b></button>)}{!filtered.length&&<p>No inventory item found.</p>}</div></section>
      <section className="receive-detail">{selected?<><div className="receive-item-head"><Boxes/><div><h2>{selected.name}</h2><p>{[selected.brand,selected.model,selected.sku].filter(Boolean).join(' · ')}</p></div><strong>{selected.quantity} on hand</strong></div><div className="receive-fields"><label>Quantity Received<input type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)} autoFocus/></label><label>Unit Cost<input type="number" min="0" step="0.01" value={cost} onChange={e=>setCost(e.target.value)}/></label><label className="full">Optional Note<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Supplier, shipment, or box note"/></label></div><button className="receive-primary" onClick={receive}><PackagePlus size={18}/>Receive Inventory</button><div className="receive-history"><h3><History size={17}/>Recent Activity</h3>{history.map(a=><article key={a.id}><div><strong>Received +{a.quantity}</strong><small>{new Date(a.createdAt).toLocaleString()} · {a.before} → {a.after}</small>{a.note&&<small>{a.note}</small>}</div><b>${a.unitCost.toFixed(2)}</b></article>)}{!history.length&&<p>No receiving history for this item yet.</p>}</div></>:<div className="receive-empty"><PackagePlus size={42}/><strong>Select an inventory item</strong><span>Choose the part or product that arrived.</span></div>}</section>
    </div>
  </div></div>}</>;
}
