import { useEffect, useMemo, useState } from 'react';
import { Printer, Search, Tag, X } from 'lucide-react';
import { storage } from './storage';
import type { InventoryItem, Repair } from './types';

type Mode='repairs'|'inventory';
type Size='62x40'|'50x25';
const safe=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]||c));

const CODE39:Record<string,string>={
 '0':'nnnwwnwnn','1':'wnnwnnnnw','2':'nnwwnnnnw','3':'wnwwnnnnn','4':'nnnwwnnnw','5':'wnnwwnnnn','6':'nnwwwnnnn','7':'nnnwnnwnw','8':'wnnwnnwnn','9':'nnwwnnwnn',
 A:'wnnnnwnnw',B:'nnwnnwnnw',C:'wnwnnwnnn',D:'nnnnwwnnw',E:'wnnnwwnnn',F:'nnwnwwnnn',G:'nnnnnwwnw',H:'wnnnnwwnn',I:'nnwnnwwnn',J:'nnnnwwwnn',
 K:'wnnnnnnww',L:'nnwnnnnww',M:'wnwnnnnwn',N:'nnnnwnnww',O:'wnnnwnnwn',P:'nnwnwnnwn',Q:'nnnnnnwww',R:'wnnnnnwwn',S:'nnwnnnwwn',T:'nnnnwnwwn',
 U:'wwnnnnnnw',V:'nwwnnnnnw',W:'wwwnnnnnn',X:'nwnnwnnnw',Y:'wwnnwnnnn',Z:'nwwnwnnnn','-':'nwnnnnwnw','.':'wwnnnnwnn',' ':'nwwnnnwnn','$':'nwnwnwnnn','/':'nwnwnnnwn','+':'nwnnnwnwn','%':'nnnwnwnwn','*':'nwnnwnwnn'
};

function barcodeSvg(value:string,height=42){
 const normalized=value.toUpperCase().replace(/[^0-9A-Z. $/+%-]/g,'-');
 const chars=`*${normalized}*`;
 const narrow=2,wide=5,gap=2;
 let x=0;const rects:string[]=[];
 for(const char of chars){
  const pattern=CODE39[char]||CODE39['-'];
  [...pattern].forEach((kind,index)=>{const width=kind==='w'?wide:narrow;if(index%2===0)rects.push(`<rect x="${x}" y="0" width="${width}" height="${height}"/>`);x+=width});
  x+=gap;
 }
 return `<svg class="barcode" viewBox="0 0 ${x} ${height}" preserveAspectRatio="none" role="img" aria-label="Barcode ${safe(normalized)}"><g fill="#000">${rects.join('')}</g></svg>`;
}

function printLabels(html:string){
 const frame=document.createElement('iframe');frame.style.cssText='position:fixed;width:1px;height:1px;opacity:0;border:0';document.body.appendChild(frame);
 const d=frame.contentDocument;if(!d){frame.remove();return}d.open();d.write(html);d.close();setTimeout(()=>{frame.contentWindow?.focus();frame.contentWindow?.print();setTimeout(()=>frame.remove(),1200)},250);
}

function repairLabel(r:Repair,size:Size){
 const compact=size==='50x25';
 const device=[r.brand,r.model].filter(Boolean).join(' ');
 const serial=r.serial||'—';
 const code=r.passcode||'';
 const date=new Date(r.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
 if(compact)return `<div class="label repair-label compact"><div class="brand-line"><b>GADGET DEFENDERS</b><strong>${safe(r.number)}</strong></div><div class="compact-main"><b>${safe(r.customerName)}</b><span>${safe(device)}</span><span>${safe(r.issue)}</span></div>${barcodeSvg(r.number,30)}<div class="barcode-text">${safe(r.number)}</div></div>`;
 return `<div class="label repair-label"><div class="brand-line"><div class="brand-name"><b>GADGET</b><span>DEFENDERS</span></div><div class="ticket"><small>Ticket</small><strong>${safe(r.number)}</strong><em>${safe(date)}</em></div></div><div class="device-line"><strong>${safe(device)}</strong><span>${safe(r.issue)}</span></div><div class="label-body"><div class="customer-box"><b>${safe(r.customerName)}</b><span>${safe(r.customerPhone)}</span></div><div class="barcode-box">${barcodeSvg(r.number,44)}<small>${safe(r.number)}</small></div></div><div class="label-footer"><span><b>IMEI / SN:</b> ${safe(serial)}</span><span><b>CODE:</b> ${safe(code)}</span></div></div>`;
}
function inventoryLabel(i:InventoryItem,size:Size,showPrice:boolean){
 const code=i.barcode||i.sku||i.imei||i.serial||i.id.slice(0,8).toUpperCase();
 const compact=size==='50x25';
 return `<div class="label inventory-label"><div class="top"><b>${safe(i.category)}</b>${showPrice?`<span>$${Number(i.price||0).toFixed(2)}</span>`:''}</div><h1>${safe(i.name)}</h1><div>${safe([i.brand,i.model,i.storage,i.color].filter(Boolean).join(' · '))}</div>${compact?'':`<strong>${safe(i.location||i.sku||'')}</strong>`}${barcodeSvg(code,compact?28:38)}<div class="barcode-text">${safe(code)}</div></div>`;
}
function documentHtml(body:string,size:Size){
 const [w,h]=size.split('x');return `<!doctype html><html><head><title>Gadget Defenders Labels</title><style>@page{size:${w}mm ${h}mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff}.label{width:${w}mm;height:${h}mm;page-break-after:always;overflow:hidden;background:#fff}.repair-label{padding:2.2mm 2.5mm;display:flex;flex-direction:column;border:1px solid #bbb}.brand-line{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1.2px solid #000;padding-bottom:1mm}.brand-name{display:flex;align-items:baseline;gap:1mm}.brand-name b{font-size:12px;letter-spacing:.5px}.brand-name span{font-size:9px;font-weight:800}.ticket{text-align:right;line-height:1}.ticket small{font-size:7px;text-transform:uppercase;font-weight:800}.ticket strong{display:block;font-size:19px;letter-spacing:.4px}.ticket em{display:block;font-size:6.5px;font-style:normal;margin-top:.6mm}.device-line{padding:1mm 0 .8mm;border-bottom:1px solid #000;display:flex;justify-content:space-between;gap:2mm;align-items:baseline;white-space:nowrap}.device-line strong{font-size:10.5px;overflow:hidden;text-overflow:ellipsis}.device-line span{font-size:8px;font-weight:700;overflow:hidden;text-overflow:ellipsis}.label-body{display:grid;grid-template-columns:36% 1fr;gap:2mm;align-items:center;flex:1;min-height:0}.customer-box{border:1px solid #000;border-radius:1.5mm;padding:1.3mm;min-width:0}.customer-box b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.customer-box span{display:block;font-size:8px;margin-top:.8mm}.barcode-box{min-width:0;text-align:center}.barcode{display:block;width:100%;height:11mm}.barcode-box small,.barcode-text{display:block;text-align:center;font-size:6.5px;font-weight:800;letter-spacing:.6px;margin-top:.3mm}.label-footer{display:grid;grid-template-columns:1fr 1fr;gap:2mm;border-top:1px solid #000;padding-top:.9mm;font-size:7.2px;white-space:nowrap}.label-footer span{overflow:hidden;text-overflow:ellipsis}.compact{padding:1.5mm 2mm}.compact .brand-line{align-items:center}.compact .brand-line>b{font-size:8px}.compact .brand-line>strong{font-size:13px}.compact-main{display:grid;grid-template-columns:1fr 1fr;gap:.5mm 2mm;margin:.8mm 0}.compact-main b{font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.compact-main span{font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.compact .barcode{height:7mm}.inventory-label{padding:${size==='62x40'?'3mm':'2mm'};border:1px solid #bbb}.inventory-label .top{display:flex;justify-content:space-between;font-size:${size==='62x40'?'10px':'8px'};text-transform:uppercase}.inventory-label h1{font-size:${size==='62x40'?'15px':'11px'};margin:2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.inventory-label>div:not(.top):not(.barcode-text){font-size:${size==='62x40'?'11px':'8px'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.inventory-label>strong{display:block;font-size:9px;margin:2px 0}.inventory-label .barcode{height:${size==='62x40'?'10mm':'7mm'};margin-top:1mm}@media print{.label{border:0}}</style></head><body>${body}</body></html>`}

export default function LabelCenterWidget(){
 const [open,setOpen]=useState(false),[mode,setMode]=useState<Mode>('repairs'),[query,setQuery]=useState(''),[size,setSize]=useState<Size>('62x40'),[copies,setCopies]=useState(1),[showPrice,setShowPrice]=useState(true),[selected,setSelected]=useState<string[]>([]),[version,setVersion]=useState(0);
 useEffect(()=>{const nav=document.querySelector('.sidebar nav');if(!nav||document.getElementById('gadgetpos-labels-nav'))return;const b=document.createElement('button');b.id='gadgetpos-labels-nav';b.innerHTML='<span style="font-size:17px">▰</span><span>Labels</span>';b.onclick=()=>setOpen(true);nav.appendChild(b);return()=>b.remove()},[]);
 useEffect(()=>{const refresh=()=>setVersion(v=>v+1);window.addEventListener('gadgetpos-data-changed',refresh);return()=>window.removeEventListener('gadgetpos-data-changed',refresh)},[]);
 const repairs=useMemo(()=>storage.getRepairs(),[version,open]);const inventory=useMemo(()=>storage.getInventory(),[version,open]);
 const rows=useMemo(()=>{const q=query.toLowerCase();return mode==='repairs'?repairs.filter(r=>[r.number,r.customerName,r.customerPhone,r.brand,r.model,r.issue,r.serial].join(' ').toLowerCase().includes(q)):inventory.filter(i=>[i.name,i.brand,i.model,i.sku,i.barcode,i.imei,i.location].join(' ').toLowerCase().includes(q))},[mode,query,repairs,inventory]);
 function toggle(id:string){setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])}
 function print(){if(!selected.length){alert('Select at least one label.');return}let body='';for(const id of selected){const item=mode==='repairs'?repairs.find(r=>r.id===id):inventory.find(i=>i.id===id);if(!item)continue;const html=mode==='repairs'?repairLabel(item as Repair,size):inventoryLabel(item as InventoryItem,size,showPrice);for(let n=0;n<copies;n++)body+=html}printLabels(documentHtml(body,size))}
 if(!open)return null;
 return <div className="lc-backdrop"><section className="lc-modal"><header><div><h2><Tag size={22}/>Label Center</h2><p>Print scannable repair and inventory labels for your thermal printer.</p></div><button onClick={()=>setOpen(false)}><X/></button></header><div className="lc-toolbar"><div className="lc-tabs"><button className={mode==='repairs'?'active':''} onClick={()=>{setMode('repairs');setSelected([])}}>Repair Labels</button><button className={mode==='inventory'?'active':''} onClick={()=>{setMode('inventory');setSelected([])}}>Inventory Labels</button></div><label className="lc-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ticket, customer, serial, SKU or model..."/></label></div><div className="lc-options"><label>Label Size<select value={size} onChange={e=>setSize(e.target.value as Size)}><option value="62x40">62 × 40 mm</option><option value="50x25">50 × 25 mm</option></select></label><label>Copies<input type="number" min="1" max="25" value={copies} onChange={e=>setCopies(Math.max(1,Math.min(25,Number(e.target.value)||1)))}/></label>{mode==='inventory'&&<label className="lc-check"><input type="checkbox" checked={showPrice} onChange={e=>setShowPrice(e.target.checked)}/>Show retail price</label>}<button onClick={()=>setCopies(1)}>Print 1</button><button onClick={()=>setCopies(2)}>Print 2</button><button onClick={()=>setSelected(rows.map(r=>r.id))}>Select All Results</button><button onClick={()=>setSelected([])}>Clear</button></div><div className="lc-list">{rows.map(item=><label key={item.id} className={selected.includes(item.id)?'selected':''}><input type="checkbox" checked={selected.includes(item.id)} onChange={()=>toggle(item.id)}/><div><strong>{mode==='repairs'?(item as Repair).number:(item as InventoryItem).name}</strong><span>{mode==='repairs'?`${(item as Repair).customerName} · ${(item as Repair).brand} ${(item as Repair).model} · ${(item as Repair).issue}`:[(item as InventoryItem).brand,(item as InventoryItem).model,(item as InventoryItem).sku,(item as InventoryItem).location].filter(Boolean).join(' · ')}</span></div><b>{mode==='repairs'?(item as Repair).status:`Qty ${(item as InventoryItem).quantity}`}</b></label>)}{!rows.length&&<div className="lc-empty">No matching records.</div>}</div><footer><span>{selected.length} selected · {selected.length*copies} label{selected.length*copies===1?'':'s'}</span><button className="primary" onClick={print}><Printer size={17}/>Print Labels</button></footer></section></div>;
}
