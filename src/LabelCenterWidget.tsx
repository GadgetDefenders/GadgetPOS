import { useEffect, useMemo, useState } from 'react';
import { Printer, Search, Tag, X } from 'lucide-react';
import { storage } from './storage';
import type { InventoryItem, Repair } from './types';

type Mode='repairs'|'inventory';
const safe=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]||c));

const CODE39:Record<string,string>={
 '0':'nnnwwnwnn','1':'wnnwnnnnw','2':'nnwwnnnnw','3':'wnwwnnnnn','4':'nnnwwnnnw','5':'wnnwwnnnn','6':'nnwwwnnnn','7':'nnnwnnwnw','8':'wnnwnnwnn','9':'nnwwnnwnn',
 A:'wnnnnwnnw',B:'nnwnnwnnw',C:'wnwnnwnnn',D:'nnnnwwnnw',E:'wnnnwwnnn',F:'nnwnwwnnn',G:'nnnnnwwnw',H:'wnnnnwwnn',I:'nnwnnwwnn',J:'nnnnwwwnn',
 K:'wnnnnnnww',L:'nnwnnnnww',M:'wnwnnnnwn',N:'nnnnwnnww',O:'wnnnwnnwn',P:'nnwnwnnwn',Q:'nnnnnnwww',R:'wnnnnnwwn',S:'nnwnnnwwn',T:'nnnnwnwwn',
 U:'wwnnnnnnw',V:'nwwnnnnnw',W:'wwwnnnnnn',X:'nwnnwnnnw',Y:'wwnnwnnnn',Z:'nwwnwnnnn','-':'nwnnnnwnw','.':'wwnnnnwnn',' ':'nwwnnnwnn','$':'nwnwnwnnn','/':'nwnwnnnwn','+':'nwnnnwnwn','%':'nnnwnwnwn','*':'nwnnwnwnn'
};

function barcodeSvg(value:string,height=48){
 const normalized=value.toUpperCase().replace(/[^0-9A-Z. $/+%-]/g,'-');
 const chars=`*${normalized}*`;const narrow=2,wide=5,gap=2;
 let x=0;const bars:string[]=[];
 for(const char of chars){const pattern=CODE39[char]||CODE39['-'];[...pattern].forEach((kind,index)=>{const width=kind==='w'?wide:narrow;if(index%2===0)bars.push(`<rect x="${x}" y="0" width="${width}" height="${height}"/>`);x+=width});x+=gap}
 return `<svg class="barcode" viewBox="0 0 ${x} ${height}" preserveAspectRatio="none" aria-label="Barcode ${safe(normalized)}"><g fill="#000">${bars.join('')}</g></svg>`;
}

function printLabels(html:string){
 const frame=document.createElement('iframe');frame.style.cssText='position:fixed;width:1px;height:1px;opacity:0;border:0';document.body.appendChild(frame);
 const d=frame.contentDocument;if(!d){frame.remove();return}d.open();d.write(html);d.close();setTimeout(()=>{frame.contentWindow?.focus();frame.contentWindow?.print();setTimeout(()=>frame.remove(),1200)},300);
}

function repairLabel(r:Repair){
 const device=[r.brand,r.model].filter(Boolean).join(' ');
 const date=new Date(r.createdAt).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'});
 return `<section class="label repair-label">
  <div class="ticket-top">
   <div class="logo-block"><div class="shield">GD</div><div><div class="logo-name"><b>GADGET</b><strong>DEFENDERS</strong></div><small>CELL PHONE REPAIR</small></div></div>
   <div class="ticket-box">TICKET ${safe(r.number)}</div>
  </div>
  <div class="ticket-info">
   <div class="customer-info"><strong>${safe(r.customerName)}</strong><span>${safe(r.customerPhone)}</span></div>
   <div class="repair-info"><div><b>Device:</b><span>${safe(device)}</span></div><div><b>Repair:</b><span>${safe(r.issue)}</span></div></div>
  </div>
  <div class="ticket-barcode">${barcodeSvg(r.number,52)}<strong>${safe(r.number)}</strong></div>
  <div class="ticket-footer"><span><b>IMEI / SN:</b> ${safe(r.serial||'')}</span><span><b>CODE:</b> ${safe(r.passcode||'')}</span><span><b>DATE:</b> ${safe(date)}</span></div>
 </section>`;
}

function inventoryLabel(i:InventoryItem,showPrice:boolean){
 const code=i.barcode||i.sku||i.imei||i.serial||i.id.slice(0,8).toUpperCase();
 return `<section class="label inventory-label"><div class="inventory-copy"><div class="simple-brand"><b>GADGET</b><span>DEFENDERS</span></div><h1>${safe(i.name)}</h1><p>${safe([i.brand,i.model,i.storage,i.color].filter(Boolean).join(' · '))}</p><small>${safe(i.sku||i.location||'')}</small></div><div class="inventory-code">${showPrice?`<strong>$${Number(i.price||0).toFixed(2)}</strong>`:''}${barcodeSvg(code,42)}<b>${safe(code)}</b></div></section>`;
}

function documentHtml(body:string){return `<!doctype html><html><head><meta charset="utf-8"><title></title><style>
 @page{size:88.9mm 28.6mm;margin:0}
 *{box-sizing:border-box}html,body{width:88.9mm;margin:0!important;padding:0!important;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif}
 .label{width:88.9mm;height:28.6mm;overflow:hidden;page-break-after:always;break-after:page;background:#fff}
 .repair-label{border:1px solid #000;border-radius:2mm;padding:1.2mm 1.5mm;display:grid;grid-template-rows:6.5mm 7.6mm 9.1mm 3mm}
 .ticket-top{display:grid;grid-template-columns:38mm 1fr;gap:2mm;align-items:center;border-bottom:1px solid #000;padding-bottom:.8mm;min-width:0}
 .logo-block{display:flex;align-items:center;gap:1.2mm;min-width:0}.shield{width:7mm;height:7mm;border:1.3px solid #000;border-radius:1.5mm;display:grid;place-items:center;font-size:6px;font-weight:900}.logo-name{display:flex;align-items:baseline;gap:.8mm;line-height:.9;white-space:nowrap}.logo-name b{font-size:10px}.logo-name strong{font-size:8.5px}.logo-block small{display:block;font-size:4.8px;font-weight:800;letter-spacing:1.2px;margin-top:.5mm}
 .ticket-box{height:5.5mm;border:1.2px solid #000;border-radius:1.3mm;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;white-space:nowrap;overflow:hidden;padding:0 1mm}
 .ticket-info{display:grid;grid-template-columns:31mm 1fr;border-bottom:1px solid #000;min-width:0}.customer-info{display:flex;flex-direction:column;justify-content:center;border-right:1px solid #000;padding-right:2mm;min-width:0}.customer-info strong{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.customer-info span{font-size:8px;margin-top:.6mm;white-space:nowrap}
 .repair-info{display:flex;flex-direction:column;justify-content:center;padding-left:2mm;gap:1mm;min-width:0}.repair-info div{display:grid;grid-template-columns:13mm 1fr;gap:1mm;align-items:baseline;min-width:0}.repair-info b{font-size:9px}.repair-info span{font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .ticket-barcode{display:flex;flex-direction:column;align-items:center;justify-content:center;border-bottom:1px solid #000;padding:.7mm 7mm .5mm}.barcode{display:block;width:100%;height:6.2mm}.ticket-barcode strong{font-family:monospace;font-size:8px;letter-spacing:1.8px;line-height:1;margin-top:.4mm}
 .ticket-footer{display:grid;grid-template-columns:1.15fr 1fr .8fr;align-items:center;font-size:6.4px}.ticket-footer span{height:100%;display:flex;align-items:center;padding:0 2mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ticket-footer span+span{border-left:1px solid #000}.ticket-footer b{font-size:6.8px;margin-right:.7mm}
 .inventory-label{display:grid;grid-template-columns:55mm 33.9mm;padding:1.7mm 2mm}.inventory-copy{padding-right:2mm;border-right:1px solid #000;min-width:0}.simple-brand{display:flex;align-items:baseline;gap:1mm;border-bottom:1px solid #000}.simple-brand b{font-size:11px}.simple-brand span{font-size:8px;font-weight:800}.inventory-copy h1{font-size:14px;margin:2mm 0 1mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.inventory-copy p{font-size:8px;font-weight:700;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.inventory-copy small{display:block;font-size:7px;margin-top:1.5mm}.inventory-code{padding-left:2mm;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}.inventory-code>strong{align-self:flex-end;font-size:15px;margin-bottom:1.5mm}.inventory-code>b{font-size:7px;letter-spacing:.6px;margin-top:.5mm}
 @media print{html,body{width:88.9mm;height:auto}.label{border-color:#000}}
 </style></head><body>${body}</body></html>`}

export default function LabelCenterWidget(){
 const [open,setOpen]=useState(false),[mode,setMode]=useState<Mode>('repairs'),[query,setQuery]=useState(''),[copies,setCopies]=useState(1),[showPrice,setShowPrice]=useState(true),[selected,setSelected]=useState<string[]>([]),[version,setVersion]=useState(0);
 useEffect(()=>{const nav=document.querySelector('.sidebar nav');if(!nav||document.getElementById('gadgetpos-labels-nav'))return;const b=document.createElement('button');b.id='gadgetpos-labels-nav';b.innerHTML='<span style="font-size:17px">▰</span><span>Labels</span>';b.onclick=()=>setOpen(true);nav.appendChild(b);return()=>b.remove()},[]);
 useEffect(()=>{const refresh=()=>setVersion(v=>v+1);window.addEventListener('gadgetpos-data-changed',refresh);return()=>window.removeEventListener('gadgetpos-data-changed',refresh)},[]);
 const repairs=useMemo(()=>storage.getRepairs(),[version,open]),inventory=useMemo(()=>storage.getInventory(),[version,open]);
 const rows=useMemo(()=>{const q=query.toLowerCase();return mode==='repairs'?repairs.filter(r=>[r.number,r.customerName,r.customerPhone,r.brand,r.model,r.issue,r.serial].join(' ').toLowerCase().includes(q)):inventory.filter(i=>[i.name,i.brand,i.model,i.sku,i.barcode,i.imei,i.location].join(' ').toLowerCase().includes(q))},[mode,query,repairs,inventory]);
 function toggle(id:string){setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])}
 function print(){if(!selected.length){alert('Select at least one label.');return}let body='';for(const id of selected){const item=mode==='repairs'?repairs.find(r=>r.id===id):inventory.find(i=>i.id===id);if(!item)continue;const html=mode==='repairs'?repairLabel(item as Repair):inventoryLabel(item as InventoryItem,showPrice);for(let n=0;n<copies;n++)body+=html}printLabels(documentHtml(body))}
 if(!open)return null;
 return <div className="lc-backdrop"><section className="lc-modal"><header><div><h2><Tag size={22}/>Label Center</h2><p>DYMO 30252 · 3.5 × 1.125 inch labels</p></div><button onClick={()=>setOpen(false)}><X/></button></header><div className="lc-toolbar"><div className="lc-tabs"><button className={mode==='repairs'?'active':''} onClick={()=>{setMode('repairs');setSelected([])}}>Repair Labels</button><button className={mode==='inventory'?'active':''} onClick={()=>{setMode('inventory');setSelected([])}}>Inventory Labels</button></div><label className="lc-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ticket, customer, serial, SKU or model..."/></label></div><div className="lc-options"><label>Label Stock<select value="30252" disabled><option>DYMO 30252 · 3.5 × 1.125 in</option></select></label><label>Copies<input type="number" min="1" max="25" value={copies} onChange={e=>setCopies(Math.max(1,Math.min(25,Number(e.target.value)||1)))}/></label>{mode==='inventory'&&<label className="lc-check"><input type="checkbox" checked={showPrice} onChange={e=>setShowPrice(e.target.checked)}/>Show retail price</label>}<button onClick={()=>setCopies(1)}>Print 1</button><button onClick={()=>setCopies(2)}>Print 2</button><button onClick={()=>setSelected(rows.map(r=>r.id))}>Select All Results</button><button onClick={()=>setSelected([])}>Clear</button></div><div className="lc-list">{rows.map(item=><label key={item.id} className={selected.includes(item.id)?'selected':''}><input type="checkbox" checked={selected.includes(item.id)} onChange={()=>toggle(item.id)}/><div><strong>{mode==='repairs'?(item as Repair).number:(item as InventoryItem).name}</strong><span>{mode==='repairs'?`${(item as Repair).customerName} · ${(item as Repair).brand} ${(item as Repair).model} · ${(item as Repair).issue}`:[(item as InventoryItem).brand,(item as InventoryItem).model,(item as InventoryItem).sku,(item as InventoryItem).location].filter(Boolean).join(' · ')}</span></div><b>{mode==='repairs'?(item as Repair).status:`Qty ${(item as InventoryItem).quantity}`}</b></label>)}{!rows.length&&<div className="lc-empty">No matching records.</div>}</div><footer><span>{selected.length} selected · {selected.length*copies} label{selected.length*copies===1?'':'s'}</span><button className="primary" onClick={print}><Printer size={17}/>Print Labels</button></footer></section></div>;
}
