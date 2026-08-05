import { useEffect, useMemo, useState } from 'react';
import { Printer, Search, Tag, X } from 'lucide-react';
import { storage } from './storage';
import type { InventoryItem, Repair } from './types';

type Mode='repairs'|'inventory';
type Size='62x40'|'50x25';
const safe=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]||c));

function printLabels(html:string){
 const frame=document.createElement('iframe');frame.style.cssText='position:fixed;width:1px;height:1px;opacity:0;border:0';document.body.appendChild(frame);
 const d=frame.contentDocument;if(!d){frame.remove();return}d.open();d.write(html);d.close();setTimeout(()=>{frame.contentWindow?.focus();frame.contentWindow?.print();setTimeout(()=>frame.remove(),1200)},180);
}

function repairLabel(r:Repair,size:Size){
 const compact=size==='50x25';
 return `<div class="label"><div class="top"><b>${safe(r.number)}</b><span>${safe(r.status)}</span></div><h1>${safe(r.customerName)}</h1><div>${safe(r.brand)} ${safe(r.model)}</div><strong>${safe(r.issue)}</strong>${compact?'':`<small>${safe(r.customerPhone)}${r.technician?` · Tech: ${safe(r.technician)}`:''}</small>`}<div class="code">||| ${safe(r.number)} |||</div></div>`;
}
function inventoryLabel(i:InventoryItem,size:Size,showPrice:boolean){
 const code=i.barcode||i.sku||i.imei||i.serial||i.id.slice(0,8).toUpperCase();
 const compact=size==='50x25';
 return `<div class="label"><div class="top"><b>${safe(i.category)}</b>${showPrice?`<span>$${Number(i.price||0).toFixed(2)}</span>`:''}</div><h1>${safe(i.name)}</h1><div>${safe([i.brand,i.model,i.storage,i.color].filter(Boolean).join(' · '))}</div>${compact?'':`<strong>${safe(i.location||i.sku||'')}</strong>`}<div class="code">||| ${safe(code)} |||</div></div>`;
}
function documentHtml(body:string,size:Size){
 const [w,h]=size.split('x');return `<!doctype html><html><head><title>Gadget Defenders Labels</title><style>@page{size:${w}mm ${h}mm;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#111}.label{width:${w}mm;height:${h}mm;padding:${size==='62x40'?'3mm':'2mm'};page-break-after:always;overflow:hidden;border:1px solid #bbb}.top{display:flex;justify-content:space-between;align-items:center;font-size:${size==='62x40'?'10px':'8px'};text-transform:uppercase}.top b{font-size:${size==='62x40'?'18px':'13px'}}h1{font-size:${size==='62x40'?'15px':'11px'};margin:${size==='62x40'?'3px 0':'2px 0'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.label>div:not(.top):not(.code){font-size:${size==='62x40'?'11px':'8px'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.label>strong{display:block;font-size:${size==='62x40'?'11px':'9px'};margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.label>small{display:block;font-size:8px;margin-top:2px}.code{font-family:monospace;font-size:${size==='62x40'?'11px':'8px'};font-weight:700;letter-spacing:1px;margin-top:${size==='62x40'?'4px':'2px'};white-space:nowrap;overflow:hidden}@media print{.label{border:0}}</style></head><body>${body}</body></html>`}

export default function LabelCenterWidget(){
 const [open,setOpen]=useState(false),[mode,setMode]=useState<Mode>('repairs'),[query,setQuery]=useState(''),[size,setSize]=useState<Size>('62x40'),[copies,setCopies]=useState(1),[showPrice,setShowPrice]=useState(true),[selected,setSelected]=useState<string[]>([]),[version,setVersion]=useState(0);
 useEffect(()=>{const nav=document.querySelector('.sidebar nav');if(!nav||document.getElementById('gadgetpos-labels-nav'))return;const b=document.createElement('button');b.id='gadgetpos-labels-nav';b.innerHTML='<span style="font-size:17px">▰</span><span>Labels</span>';b.onclick=()=>setOpen(true);nav.appendChild(b);return()=>b.remove()},[]);
 useEffect(()=>{const refresh=()=>setVersion(v=>v+1);window.addEventListener('gadgetpos-data-changed',refresh);return()=>window.removeEventListener('gadgetpos-data-changed',refresh)},[]);
 const repairs=useMemo(()=>storage.getRepairs(),[version,open]);const inventory=useMemo(()=>storage.getInventory(),[version,open]);
 const rows=useMemo(()=>{const q=query.toLowerCase();return mode==='repairs'?repairs.filter(r=>[r.number,r.customerName,r.customerPhone,r.brand,r.model,r.issue].join(' ').toLowerCase().includes(q)):inventory.filter(i=>[i.name,i.brand,i.model,i.sku,i.barcode,i.imei,i.location].join(' ').toLowerCase().includes(q))},[mode,query,repairs,inventory]);
 function toggle(id:string){setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])}
 function print(){if(!selected.length){alert('Select at least one label.');return}let body='';for(const id of selected){const html=mode==='repairs'?repairLabel(repairs.find(r=>r.id===id)!,size):inventoryLabel(inventory.find(i=>i.id===id)!,size,showPrice);for(let n=0;n<copies;n++)body+=html}printLabels(documentHtml(body,size))}
 if(!open)return null;
 return <div className="lc-backdrop"><section className="lc-modal"><header><div><h2><Tag size={22}/>Label Center</h2><p>Print repair tags and inventory labels for your thermal printer.</p></div><button onClick={()=>setOpen(false)}><X/></button></header><div className="lc-toolbar"><div className="lc-tabs"><button className={mode==='repairs'?'active':''} onClick={()=>{setMode('repairs');setSelected([])}}>Repair Labels</button><button className={mode==='inventory'?'active':''} onClick={()=>{setMode('inventory');setSelected([])}}>Inventory Labels</button></div><label className="lc-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ticket, customer, SKU, model..."/></label></div><div className="lc-options"><label>Label Size<select value={size} onChange={e=>setSize(e.target.value as Size)}><option value="62x40">62 × 40 mm</option><option value="50x25">50 × 25 mm</option></select></label><label>Copies<input type="number" min="1" max="25" value={copies} onChange={e=>setCopies(Math.max(1,Math.min(25,Number(e.target.value)||1)))}/></label>{mode==='inventory'&&<label className="lc-check"><input type="checkbox" checked={showPrice} onChange={e=>setShowPrice(e.target.checked)}/>Show retail price</label>}<button onClick={()=>setSelected(rows.map(r=>r.id))}>Select All Results</button><button onClick={()=>setSelected([])}>Clear</button></div><div className="lc-list">{rows.map(item=><label key={item.id} className={selected.includes(item.id)?'selected':''}><input type="checkbox" checked={selected.includes(item.id)} onChange={()=>toggle(item.id)}/><div><strong>{mode==='repairs'?(item as Repair).number:(item as InventoryItem).name}</strong><span>{mode==='repairs'?`${(item as Repair).customerName} · ${(item as Repair).brand} ${(item as Repair).model} · ${(item as Repair).issue}`:[(item as InventoryItem).brand,(item as InventoryItem).model,(item as InventoryItem).sku,(item as InventoryItem).location].filter(Boolean).join(' · ')}</span></div><b>{mode==='repairs'?(item as Repair).status:`Qty ${(item as InventoryItem).quantity}`}</b></label>)}{!rows.length&&<div className="lc-empty">No matching records.</div>}</div><footer><span>{selected.length} selected · {selected.length*copies} label{selected.length*copies===1?'':'s'}</span><button className="primary" onClick={print}><Printer size={17}/>Print Labels</button></footer></section></div>;
}
