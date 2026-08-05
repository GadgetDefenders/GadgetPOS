import { useEffect, useMemo, useState } from 'react';
import { Boxes, LayoutDashboard, Minus, Plus, Search, Settings, ShoppingCart, Trash2, Users, Wrench } from 'lucide-react';
import { storage } from './storage';
import type { CartLine, Customer, InventoryItem, PaymentMethod, Repair, RepairStatus, Sale } from './types';

type Page='dashboard'|'repairs'|'customers'|'inventory'|'pos'|'settings';
type PosTab='Repairs'|'Products'|'Cell Phones'|'Accessories'|'Prepaid Service'|'Miscellaneous'|'Bill Payments';
const statuses:RepairStatus[]=['Checked In','Diagnosing','Waiting on Parts','Repairing','Quality Check','Ready for Pickup','Completed'];
const tabs:PosTab[]=['Repairs','Products','Cell Phones','Accessories','Prepaid Service','Miscellaneous','Bill Payments'];
const taxRate=.06;
const nav=[{p:'dashboard' as Page,l:'Dashboard',i:LayoutDashboard},{p:'repairs' as Page,l:'Repairs',i:Wrench},{p:'customers' as Page,l:'Customers',i:Users},{p:'inventory' as Page,l:'Inventory',i:Boxes},{p:'pos' as Page,l:'POS',i:ShoppingCart},{p:'settings' as Page,l:'Settings',i:Settings}];

export default function App(){
 const [page,setPage]=useState<Page>('dashboard');
 const [query,setQuery]=useState('');
 const [posTab,setPosTab]=useState<PosTab>('Repairs');
 const [posSearch,setPosSearch]=useState('');
 const [customers,setCustomers]=useState<Customer[]>(storage.getCustomers());
 const [repairs,setRepairs]=useState<Repair[]>(storage.getRepairs());
 const [inventory,setInventory]=useState<InventoryItem[]>(storage.getInventory());
 const [sales,setSales]=useState<Sale[]>(storage.getSales());
 const [cart,setCart]=useState<CartLine[]>([]);
 const [customerId,setCustomerId]=useState('');
 const [payment,setPayment]=useState<PaymentMethod>('Card');
 const [tendered,setTendered]=useState('');
 const [notes,setNotes]=useState('');

 useEffect(()=>{
   const refresh=()=>{
     setCustomers(storage.getCustomers());
     setRepairs(storage.getRepairs());
     setInventory(storage.getInventory());
     setSales(storage.getSales());
   };
   const addCreatedRepair=(event:Event)=>{
     const repairId=(event as CustomEvent<{repairId?:string}>).detail?.repairId;
     const fresh=storage.getRepairs();
     setRepairs(fresh);
     if(!repairId)return;
     const repair=fresh.find(r=>r.id===repairId);
     if(!repair)return;
     setPage('pos');
     setPosTab('Repairs');
     setPosSearch('');
     setCustomerId(customers.some(c=>c.id===repair.customerId)?repair.customerId:'');
     setCart(current=>current.some(l=>l.kind==='Repair'&&l.referenceId===repair.id)?current:[...current,{id:crypto.randomUUID(),kind:'Repair',referenceId:repair.id,description:`${repair.number} · ${repair.brand} ${repair.model} · ${repair.issue}`,quantity:1,unitPrice:Number(repair.estimate)||0,taxable:true}]);
   };
   window.addEventListener('gadgetpos-data-changed',refresh);
   window.addEventListener('storage',refresh);
   window.addEventListener('gadgetpos-add-repair',addCreatedRepair as EventListener);
   return()=>{
     window.removeEventListener('gadgetpos-data-changed',refresh);
     window.removeEventListener('storage',refresh);
     window.removeEventListener('gadgetpos-add-repair',addCreatedRepair as EventListener);
   };
 },[customers]);

 const subtotal=cart.reduce((s,l)=>s+l.unitPrice*l.quantity,0);
 const tax=cart.filter(l=>l.taxable).reduce((s,l)=>s+l.unitPrice*l.quantity,0)*taxRate;
 const total=subtotal+tax;
 const change=payment==='Cash'?Math.max(0,(Number(tendered)||0)-total):0;
 const todaySales=sales.filter(s=>new Date(s.createdAt).toDateString()===new Date().toDateString()).reduce((a,s)=>a+s.total,0);
 const filteredRepairs=useMemo(()=>{const t=query.toLowerCase();return repairs.filter(r=>[r.number,r.customerName,r.customerPhone,r.brand,r.model,r.issue,r.serial].join(' ').toLowerCase().includes(t));},[repairs,query]);
 const filteredInventory=useMemo(()=>{const t=query.toLowerCase();return inventory.filter(i=>[i.name,i.brand,i.model,i.category,i.imei,i.barcode,i.sku].join(' ').toLowerCase().includes(t));},[inventory,query]);
 const catalog=useMemo(()=>{const t=posSearch.trim().toLowerCase();if(posTab==='Repairs')return repairs.filter(r=>r.status!=='Completed'&&[r.number,r.customerName,r.customerPhone,r.brand,r.model,r.issue,r.serial].join(' ').toLowerCase().includes(t));const category=posTab==='Cell Phones'?'Phone':posTab==='Accessories'?'Accessory':posTab==='Prepaid Service'?'Prepaid Service':posTab==='Products'?null:posTab==='Miscellaneous'?'Repair Part':null;return inventory.filter(i=>i.quantity>0&&(!category||i.category===category)&&[i.name,i.brand,i.model,i.sku,i.barcode,i.imei,i.carrier].join(' ').toLowerCase().includes(t));},[posTab,posSearch,repairs,inventory]);

 function addInventory(i:InventoryItem){const old=cart.find(l=>l.kind==='Inventory'&&l.referenceId===i.id);if(old){if(old.quantity>=i.quantity)return;setCart(cart.map(l=>l.id===old.id?{...l,quantity:l.quantity+1}:l));}else setCart([...cart,{id:crypto.randomUUID(),kind:'Inventory',referenceId:i.id,description:`${i.name}${i.model?` · ${i.model}`:''}`,quantity:1,unitPrice:Number(i.price)||0,taxable:i.category!=='Prepaid Service'}]);setPosSearch('');}
 function addRepair(r:Repair){if(cart.some(l=>l.kind==='Repair'&&l.referenceId===r.id))return;setCustomerId(customers.some(c=>c.id===r.customerId)?r.customerId:'');setCart([...cart,{id:crypto.randomUUID(),kind:'Repair',referenceId:r.id,description:`${r.number} · ${r.brand} ${r.model} · ${r.issue}`,quantity:1,unitPrice:Number(r.estimate)||0,taxable:true}]);setPosSearch('');}
 function addCatalogItem(item:Repair|InventoryItem){if('number' in item)addRepair(item);else addInventory(item);}
 function handlePosSearchKeyDown(e:React.KeyboardEvent<HTMLInputElement>){if(e.key!=='Enter')return;e.preventDefault();const first=catalog[0];if(first)addCatalogItem(first as Repair|InventoryItem);else alert('No matching ticket or inventory item was found.');}
 function qty(l:CartLine,n:number){if(l.kind==='Repair')return;const stock=inventory.find(i=>i.id===l.referenceId)?.quantity||0;const next=l.quantity+n;if(next<=0)setCart(cart.filter(x=>x.id!==l.id));else if(next<=stock)setCart(cart.map(x=>x.id===l.id?{...x,quantity:next}:x));}
 function quickItem(name:string,price:number,taxable=true){setCart([...cart,{id:crypto.randomUUID(),kind:'Inventory',referenceId:`quick-${crypto.randomUUID()}`,description:name,quantity:1,unitPrice:price,taxable}]);}
 function completeSale(){if(!cart.length)return;if(payment==='Cash'&&(Number(tendered)||0)<total){alert('Cash tendered is less than total.');return;}const c=customers.find(x=>x.id===customerId);const sale:Sale={id:crypto.randomUUID(),number:`SALE-${String(sales.length+1).padStart(5,'0')}`,customerId:c?.id,customerName:c?.name,lines:cart,subtotal,tax,total,paymentMethod:payment,amountTendered:payment==='Cash'?Number(tendered):total,changeDue:change,notes,createdAt:new Date().toISOString()};const sold=new Map<string,number>();cart.filter(l=>l.kind==='Inventory'&&!l.referenceId.startsWith('quick-')).forEach(l=>sold.set(l.referenceId,l.quantity));const inv=inventory.map(i=>({...i,quantity:Math.max(0,i.quantity-(sold.get(i.id)||0))}));const done=new Set(cart.filter(l=>l.kind==='Repair').map(l=>l.referenceId));const reps=repairs.map(r=>done.has(r.id)?{...r,status:'Completed' as RepairStatus}:r);setInventory(inv);storage.saveInventory(inv);setRepairs(reps);storage.saveRepairs(reps);const ss=[sale,...sales];setSales(ss);storage.saveSales(ss);setCart([]);setCustomerId('');setTendered('');setNotes('');alert(`${sale.number} completed.`);}
 const tiles=posTab==='Repairs'?[['Cellphone Repair',0],['Tablet Repair',0],['Computer Repair',0],['Game Console Repair',0],['Apple Watch Repair',0],['Quick Check-in',0]]:posTab==='Prepaid Service'?[['New Activation',0],['Port-In',0],['SIM Card',0],['Airtime Refill',0],['Bill Payment',0]]:posTab==='Miscellaneous'?[['Diagnostic Fee',49.99],['Labor',0],['Data Transfer',49.99],['Shipping',0],['Custom Item',0],['Discount / Credit',0]]:[];
 return <div className="app-shell"><aside className="sidebar"><div className="brand"><span>GP</span><div><strong>GadgetPOS</strong><small>Developer Preview 0.9</small></div></div><nav>{nav.map(({p,l,i:Icon})=><button key={p} className={page===p?'active':''} onClick={()=>setPage(p)}><Icon size={18}/>{l}</button>)}</nav><div className="sync-chip">● Local ready · Cloud connection next</div></aside><main><header className="topbar"><div><h1>{nav.find(n=>n.p===page)?.l}</h1><p>Gadget Defenders repair shop management</p></div>{page!=='pos'&&<label className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search customer, ticket, IMEI, inventory..."/></label>}</header>
 {page==='dashboard'&&<section className="content"><div className="stats"><article><span>Open Repairs</span><strong>{repairs.filter(r=>r.status!=='Completed').length}</strong></article><article><span>Ready for Pickup</span><strong>{repairs.filter(r=>r.status==='Ready for Pickup').length}</strong></article><article><span>Today's Sales</span><strong>${todaySales.toFixed(2)}</strong></article><article><span>Phones in Stock</span><strong>{inventory.filter(i=>i.category==='Phone').reduce((s,i)=>s+i.quantity,0)}</strong></article><article><span>Low Inventory</span><strong>{inventory.filter(i=>i.quantity<=i.minimum).length}</strong></article></div><div className="panel quick-actions"><div><h2>Front Counter</h2><p>Check repairs out together with phones, accessories, and prepaid service.</p></div><button className="primary" onClick={()=>setPage('pos')}><ShoppingCart size={17}/>Open Checkout</button></div></section>}
 {page==='repairs'&&<section className="content board-wrap"><div className="repair-board">{statuses.map(s=><div className="board-column" key={s}><div className="column-heading"><h3>{s}</h3><span>{filteredRepairs.filter(r=>r.status===s).length}</span></div>{filteredRepairs.filter(r=>r.status===s).map(r=><article className="repair-card" key={r.id}><strong>{r.number}</strong><h4>{r.brand} {r.model}</h4><p>{r.customerName}</p><small>{r.issue} · ${Number(r.estimate||0).toFixed(2)}</small><select value={r.status} onChange={e=>{const next=repairs.map(x=>x.id===r.id?{...x,status:e.target.value as RepairStatus}:x);setRepairs(next);storage.saveRepairs(next)}}>{statuses.map(x=><option key={x}>{x}</option>)}</select></article>)}</div>)}</div></section>}
 {page==='customers'&&<section className="content"><div className="panel"><h2>Customers</h2><div className="table-wrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Repairs</th></tr></thead><tbody>{customers.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.phone}</td><td>{c.email||'—'}</td><td>{repairs.filter(r=>r.customerId===c.id).length}</td></tr>)}</tbody></table></div></div></section>}
 {page==='inventory'&&<section className="content"><div className="panel"><h2>Inventory</h2><div className="inventory-grid">{filteredInventory.map(i=><article className="inventory-card" key={i.id}><div className="category-chip">{i.category}</div><h3>{i.name}</h3><p>{[i.brand,i.model,i.storage,i.color].filter(Boolean).join(' · ')}</p><div className="inventory-numbers"><span>Stock <strong>{i.quantity}</strong></span><span>Cost <strong>${Number(i.cost||0).toFixed(2)}</strong></span><span>Price <strong>${Number(i.price||0).toFixed(2)}</strong></span></div><button onClick={()=>{addInventory(i);setPage('pos')}}>Sell</button></article>)}</div></div></section>}
 {page==='pos'&&<section className="pos-counter"><div className="pos-cart-side"><div className="pos-customer"><strong>{customers.find(c=>c.id===customerId)?.name||'Walk-in Customer'}</strong><select value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Walk-in Customer</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}</select></div><div className="pos-search-wrap"><label className="pos-scan"><Search size={17}/><input value={posSearch} onChange={e=>setPosSearch(e.target.value)} onKeyDown={handlePosSearchKeyDown} placeholder="Enter ticket, customer, model, SKU, IMEI or barcode"/></label>{posSearch.trim()&&<div className="pos-search-results">{catalog.slice(0,6).map(item=>'number' in item?<button key={item.id} onClick={()=>addRepair(item as Repair)}><strong>{(item as Repair).number} · {(item as Repair).customerName}</strong><span>{(item as Repair).brand} {(item as Repair).model} · {(item as Repair).issue}</span><b>${Number((item as Repair).estimate||0).toFixed(2)}</b></button>:<button key={item.id} onClick={()=>addInventory(item as InventoryItem)}><strong>{(item as InventoryItem).name}</strong><span>{[(item as InventoryItem).brand,(item as InventoryItem).model,(item as InventoryItem).sku].filter(Boolean).join(' · ')}</span><b>${Number((item as InventoryItem).price||0).toFixed(2)}</b></button>)}{!catalog.length&&<p>No matching ticket or inventory item found.</p>}</div>}</div><div className="pos-cart-table"><div className="pos-cart-head"><span>QTY</span><span>ITEM NAME</span><span>PRICE</span><span>TOTAL</span></div>{cart.map(l=><div className="pos-cart-line" key={l.id}><div className="qty-buttons">{l.kind==='Inventory'&&<button onClick={()=>qty(l,-1)}><Minus size={12}/></button>}<b>{l.quantity}</b>{l.kind==='Inventory'&&<button onClick={()=>qty(l,1)}><Plus size={12}/></button>}</div><div><strong>{l.description}</strong><small>{l.taxable?'Taxable':'Non-taxable'}</small></div><span>${l.unitPrice.toFixed(2)}</span><span>${(l.unitPrice*l.quantity).toFixed(2)}</span><button className="icon-button danger" onClick={()=>setCart(cart.filter(x=>x.id!==l.id))}><Trash2 size={14}/></button></div>)}{!cart.length&&<div className="pos-empty">No items in the current sale.</div>}</div><div className="pos-bottom"><div className="totals"><div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div><div><span>Tax</span><strong>${tax.toFixed(2)}</strong></div><div className="grand-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div></div><div className="payment-grid"><select value={payment} onChange={e=>setPayment(e.target.value as PaymentMethod)}><option>Card</option><option>Cash</option><option>Split</option><option>Other</option></select>{payment==='Cash'&&<input type="number" step=".01" value={tendered} onChange={e=>setTendered(e.target.value)} placeholder="Cash tendered"/>}<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Sale notes"/><button className="primary complete-sale" disabled={!cart.length} onClick={completeSale}>Complete Sale · ${total.toFixed(2)}</button></div></div></div><div className="pos-catalog-side"><div className="pos-tabs">{tabs.map(t=><button className={posTab===t?'active':''} key={t} onClick={()=>setPosTab(t)}>{t}</button>)}</div><div className="pos-breadcrumb">{posTab} <span>›</span> Select an item or service</div><div className="pos-tile-grid">{tiles.map(([name,price])=><button className="service-tile" key={name} onClick={()=>quickItem(String(name),Number(price))}><span className="tile-icon">+</span><strong>{name}</strong>{Number(price)>0&&<small>${Number(price).toFixed(2)}</small>}</button>)}{catalog.map(item=>'number' in item?<button className="service-tile" key={item.id} onClick={()=>addRepair(item as Repair)}><span className="tile-icon">+</span><strong>{(item as Repair).number}</strong><small>{(item as Repair).customerName} · ${Number((item as Repair).estimate||0).toFixed(2)}</small></button>:<button className="service-tile" key={item.id} onClick={()=>addInventory(item as InventoryItem)}><span className="tile-icon">+</span><strong>{(item as InventoryItem).name}</strong><small>{(item as InventoryItem).category} · ${Number((item as InventoryItem).price||0).toFixed(2)}</small></button>)}</div></div></section>}
 {page==='settings'&&<section className="content"><div className="panel"><h2>Settings</h2><p>Cloud login, employees, printers, taxes, and store settings will be connected here.</p></div></section>}</main></div>
}
