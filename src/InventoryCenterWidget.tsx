import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, ClipboardList, PackageCheck, Plus, Search, Truck, X } from 'lucide-react';
import { storage } from './storage';
import type { InventoryItem } from './types';

type ItemMeta={supplier?:string;location?:string;reorderQty?:number;taxable?:boolean;repairPrice?:number};
type StockEntry={id:string;itemId:string;itemName:string;type:'Received'|'Adjustment'|'Sold'|'Returned'|'Damaged';quantity:number;note:string;createdAt:string};
type POLine={itemId:string;quantity:number;cost:number};
type PurchaseOrder={id:string;number:string;supplier:string;expectedDate:string;status:'Draft'|'Ordered'|'Received';lines:POLine[];createdAt:string};
const META_KEY='gadgetpos_inventory_meta_v1';
const HISTORY_KEY='gadgetpos_inventory_history_v1';
const PO_KEY='gadgetpos_purchase_orders_v1';
const read=<T,>(key:string,fallback:T):T=>{try{return JSON.parse(localStorage.getItem(key)||'') as T}catch{return fallback}};
const money=(n:number)=>`$${Number(n||0).toFixed(2)}`;

export default function InventoryCenterWidget(){
 const [visible,setVisible]=useState(false);
 const [inventory,setInventory]=useState<InventoryItem[]>(storage.getInventory());
 const [meta,setMeta]=useState<Record<string,ItemMeta>>(()=>read(META_KEY,{}));
 const [history,setHistory]=useState<StockEntry[]>(()=>read(HISTORY_KEY,[]));
 const [orders,setOrders]=useState<PurchaseOrder[]>(()=>read(PO_KEY,[]));
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('All');
 const [stock,setStock]=useState('All');
 const [tab,setTab]=useState<'inventory'|'orders'|'history'>('inventory');
 const [adjustItem,setAdjustItem]=useState<InventoryItem|null>(null);
 const [adjustQty,setAdjustQty]=useState('');
 const [adjustType,setAdjustType]=useState<StockEntry['type']>('Adjustment');
 const [adjustNote,setAdjustNote]=useState('');
 const [poOpen,setPoOpen]=useState(false);
 const [poSupplier,setPoSupplier]=useState('');
 const [poExpected,setPoExpected]=useState('');
 const [poLines,setPoLines]=useState<POLine[]>([]);

 useEffect(()=>{
  const sync=()=>setVisible(document.querySelector('.topbar h1')?.textContent?.trim()==='Inventory');
  sync(); const observer=new MutationObserver(sync); observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  const refresh=()=>setInventory(storage.getInventory()); window.addEventListener('gadgetpos-data-changed',refresh);
  return()=>{observer.disconnect();window.removeEventListener('gadgetpos-data-changed',refresh)};
 },[]);
 useEffect(()=>{if(!visible)return;const panel=document.querySelector('main > .content') as HTMLElement|null;if(panel)panel.style.visibility='hidden';return()=>{if(panel)panel.style.visibility=''}},[visible]);
 const saveMeta=(next:Record<string,ItemMeta>)=>{setMeta(next);localStorage.setItem(META_KEY,JSON.stringify(next))};
 const saveHistory=(next:StockEntry[])=>{setHistory(next);localStorage.setItem(HISTORY_KEY,JSON.stringify(next))};
 const saveOrders=(next:PurchaseOrder[])=>{setOrders(next);localStorage.setItem(PO_KEY,JSON.stringify(next))};
 const categories=['All',...Array.from(new Set(inventory.map(i=>i.category)))];
 const filtered=useMemo(()=>inventory.filter(i=>{
  const hay=[i.name,i.brand,i.model,i.sku,i.barcode,i.imei,i.serial,meta[i.id]?.supplier,meta[i.id]?.location].join(' ').toLowerCase();
  const categoryOk=category==='All'||i.category===category;
  const stockOk=stock==='All'||(stock==='Low'?i.quantity>0&&i.quantity<=i.minimum:stock==='Out'?i.quantity<=0:i.quantity>i.minimum);
  return categoryOk&&stockOk&&hay.includes(query.toLowerCase());
 }),[inventory,meta,query,category,stock]);
 const costValue=inventory.reduce((s,i)=>s+i.quantity*Number(i.cost||0),0);
 const retailValue=inventory.reduce((s,i)=>s+i.quantity*Number(i.price||0),0);
 const low=inventory.filter(i=>i.quantity>0&&i.quantity<=i.minimum).length;
 const out=inventory.filter(i=>i.quantity<=0).length;
 const ordered=orders.filter(o=>o.status==='Ordered').reduce((s,o)=>s+o.lines.reduce((a,l)=>a+l.quantity,0),0);

 function updateMeta(id:string,patch:ItemMeta){saveMeta({...meta,[id]:{...meta[id],...patch}})}
 function applyAdjustment(){if(!adjustItem)return;const amount=Number(adjustQty);if(!Number.isFinite(amount)||amount===0){alert('Enter a quantity change, such as 5 or -2.');return}const next=inventory.map(i=>i.id===adjustItem.id?{...i,quantity:Math.max(0,i.quantity+amount),updatedAt:new Date().toISOString()}:i);storage.saveInventory(next);setInventory(next);saveHistory([{id:crypto.randomUUID(),itemId:adjustItem.id,itemName:adjustItem.name,type:adjustType,quantity:amount,note:adjustNote||'Manual stock change',createdAt:new Date().toISOString()},...history]);setAdjustItem(null);setAdjustQty('');setAdjustNote('');window.dispatchEvent(new Event('gadgetpos-data-changed'))}
 function addPOLine(){const first=inventory[0];if(!first)return;setPoLines([...poLines,{itemId:first.id,quantity:1,cost:Number(first.cost)||0}])}
 function savePO(){if(!poSupplier.trim()||!poLines.length){alert('Enter a supplier and add at least one item.');return}const po:PurchaseOrder={id:crypto.randomUUID(),number:`PO-${String(orders.length+1).padStart(4,'0')}`,supplier:poSupplier.trim(),expectedDate:poExpected,status:'Ordered',lines:poLines,createdAt:new Date().toISOString()};saveOrders([po,...orders]);setPoOpen(false);setPoSupplier('');setPoExpected('');setPoLines([])}
 function receivePO(po:PurchaseOrder){if(po.status==='Received')return;const qty=new Map(po.lines.map(l=>[l.itemId,l.quantity]));const next=inventory.map(i=>qty.has(i.id)?{...i,quantity:i.quantity+(qty.get(i.id)||0),cost:po.lines.find(l=>l.itemId===i.id)?.cost??i.cost,updatedAt:new Date().toISOString()}:i);storage.saveInventory(next);setInventory(next);const entries=po.lines.map(l=>{const item=inventory.find(i=>i.id===l.itemId);return{id:crypto.randomUUID(),itemId:l.itemId,itemName:item?.name||'Inventory Item',type:'Received' as const,quantity:l.quantity,note:`Received ${po.number} from ${po.supplier}`,createdAt:new Date().toISOString()}});saveHistory([...entries,...history]);saveOrders(orders.map(o=>o.id===po.id?{...o,status:'Received'}:o));window.dispatchEvent(new Event('gadgetpos-data-changed'))}
 if(!visible)return null;
 return <section className="ic-shell">
  <div className="ic-head"><div><h2>Inventory Management Center</h2><p>Stock, purchasing, suppliers, locations, and inventory movement.</p></div><div className="ic-head-actions"><button onClick={()=>window.dispatchEvent(new CustomEvent('gadgetpos-open-inventory-form'))}><Plus size={17}/>Add Item</button><button className="primary" onClick={()=>setPoOpen(true)}><Truck size={17}/>New Purchase Order</button></div></div>
  <div className="ic-metrics"><article><Boxes/><span>Inventory Cost</span><strong>{money(costValue)}</strong></article><article><PackageCheck/><span>Retail Value</span><strong>{money(retailValue)}</strong></article><article><AlertTriangle/><span>Low Stock</span><strong>{low}</strong></article><article><AlertTriangle/><span>Out of Stock</span><strong>{out}</strong></article><article><ClipboardList/><span>Units Ordered</span><strong>{ordered}</strong></article></div>
  <div className="ic-tabs"><button className={tab==='inventory'?'active':''} onClick={()=>setTab('inventory')}>Inventory</button><button className={tab==='orders'?'active':''} onClick={()=>setTab('orders')}>Purchase Orders</button><button className={tab==='history'?'active':''} onClick={()=>setTab('history')}>Stock History</button></div>
  {tab==='inventory'&&<><div className="ic-toolbar"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search item, SKU, barcode, IMEI, supplier or shelf..."/></label><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select><select value={stock} onChange={e=>setStock(e.target.value)}><option>All</option><option>In Stock</option><option>Low</option><option>Out</option></select></div><div className="ic-table-wrap"><table><thead><tr><th>Item</th><th>SKU / IMEI</th><th>Supplier</th><th>Location</th><th>Stock</th><th>Cost</th><th>Price</th><th>Potential Profit</th><th></th></tr></thead><tbody>{filtered.map(i=><tr key={i.id} className={i.quantity<=0?'out':i.quantity<=i.minimum?'low':''}><td><strong>{i.name}</strong><small>{[i.category,i.brand,i.model].filter(Boolean).join(' · ')}</small></td><td>{i.sku||i.imei||i.barcode||'—'}</td><td><input value={meta[i.id]?.supplier||''} onChange={e=>updateMeta(i.id,{supplier:e.target.value})} placeholder="Supplier"/></td><td><input value={meta[i.id]?.location||''} onChange={e=>updateMeta(i.id,{location:e.target.value})} placeholder="Shelf / bin"/></td><td><strong>{i.quantity}</strong><small>Reorder at {i.minimum}</small></td><td>{money(i.cost)}</td><td>{money(i.price)}</td><td>{money((i.price-i.cost)*i.quantity)}</td><td><button onClick={()=>setAdjustItem(i)}>Adjust</button></td></tr>)}</tbody></table>{!filtered.length&&<div className="ic-empty">No inventory matches these filters.</div>}</div></>}
  {tab==='orders'&&<div className="ic-orders">{orders.map(o=><article key={o.id}><div><strong>{o.number}</strong><span>{o.supplier}</span><small>{o.lines.reduce((s,l)=>s+l.quantity,0)} units · Expected {o.expectedDate||'not set'}</small></div><b className={o.status.toLowerCase()}>{o.status}</b><strong>{money(o.lines.reduce((s,l)=>s+l.quantity*l.cost,0))}</strong>{o.status!=='Received'&&<button className="primary" onClick={()=>receivePO(o)}>Receive Order</button>}</article>)}{!orders.length&&<div className="ic-empty">No purchase orders yet.</div>}</div>}
  {tab==='history'&&<div className="ic-table-wrap"><table><thead><tr><th>Date</th><th>Item</th><th>Movement</th><th>Quantity</th><th>Note</th></tr></thead><tbody>{history.map(h=><tr key={h.id}><td>{new Date(h.createdAt).toLocaleString()}</td><td>{h.itemName}</td><td>{h.type}</td><td className={h.quantity<0?'negative':'positive'}>{h.quantity>0?'+':''}{h.quantity}</td><td>{h.note}</td></tr>)}</tbody></table>{!history.length&&<div className="ic-empty">Inventory changes will appear here.</div>}</div>}
  {adjustItem&&<div className="ic-backdrop"><div className="ic-modal"><div className="ic-modal-head"><div><h3>Adjust Stock</h3><p>{adjustItem.name} · Current quantity {adjustItem.quantity}</p></div><button onClick={()=>setAdjustItem(null)}><X/></button></div><label>Movement Type<select value={adjustType} onChange={e=>setAdjustType(e.target.value as StockEntry['type'])}><option>Adjustment</option><option>Received</option><option>Returned</option><option>Damaged</option></select></label><label>Quantity Change<input type="number" value={adjustQty} onChange={e=>setAdjustQty(e.target.value)} placeholder="5 to add or -2 to remove"/></label><label>Reason / Note<textarea value={adjustNote} onChange={e=>setAdjustNote(e.target.value)}/></label><div className="ic-modal-actions"><button onClick={()=>setAdjustItem(null)}>Cancel</button><button className="primary" onClick={applyAdjustment}>Save Adjustment</button></div></div></div>}
  {poOpen&&<div className="ic-backdrop"><div className="ic-modal wide"><div className="ic-modal-head"><div><h3>New Purchase Order</h3><p>Create an order and receive it into inventory later.</p></div><button onClick={()=>setPoOpen(false)}><X/></button></div><div className="ic-po-info"><label>Supplier<input value={poSupplier} onChange={e=>setPoSupplier(e.target.value)}/></label><label>Expected Delivery<input type="date" value={poExpected} onChange={e=>setPoExpected(e.target.value)}/></label></div><div className="ic-po-lines">{poLines.map((l,index)=><div key={index}><select value={l.itemId} onChange={e=>{const item=inventory.find(i=>i.id===e.target.value);setPoLines(poLines.map((x,n)=>n===index?{...x,itemId:e.target.value,cost:Number(item?.cost)||0}:x))}}>{inventory.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select><input type="number" min="1" value={l.quantity} onChange={e=>setPoLines(poLines.map((x,n)=>n===index?{...x,quantity:Number(e.target.value)||1}:x))}/><input type="number" min="0" step=".01" value={l.cost} onChange={e=>setPoLines(poLines.map((x,n)=>n===index?{...x,cost:Number(e.target.value)||0}:x))}/><button onClick={()=>setPoLines(poLines.filter((_,n)=>n!==index))}>Remove</button></div>)}</div><button onClick={addPOLine}><Plus size={16}/>Add Item</button><div className="ic-po-total">Order Total <strong>{money(poLines.reduce((s,l)=>s+l.quantity*l.cost,0))}</strong></div><div className="ic-modal-actions"><button onClick={()=>setPoOpen(false)}>Cancel</button><button className="primary" onClick={savePO}>Save Purchase Order</button></div></div></div>}
 </section>;
}
