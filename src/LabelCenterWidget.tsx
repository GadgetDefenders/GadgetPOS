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

function barcodeSvg(value:string,height=40){
 const normalized=value.toUpperCase().replace(/[^0-9A-Z. $/+%-]/g,'-');
 const chars=`*${normalized}*`;const narrow=2,wide=5,gap=2;
 let x=0;const bars:string[]=[];
 for(const char of chars){const pattern=CODE39[char]||CODE39['-'];[...pattern].forEach((kind,index)=>{const width=kind==='w'?wide:narrow;if(index%2===0)bars.push(`<rect x="${x}" y="0" width="${width}" height="${height}"/>`);x+=width});x+=gap}
 return `<svg class="barcode" viewBox="0 0 ${x} ${height}" preserveAspectRatio="none"><g fill="#000">${bars.join('')}</g></svg>`;
}

function printLabels(html:string){
 const frame=document.createElement('iframe');frame.style.cssText='position:fixed;width:1px;height:1px;opacity:0;border:0';document.body.appendChild(frame);
 const d=frame.contentDocument;if(!d){frame.remove();return}d.open();d.write(html);d.close();setTimeout(()=>{frame.contentWindow?.focus();frame.contentWindow?.print();setTimeout(()=>frame.remove(),1200)},300);
}

function repairLabel(r:Repair){
 const device=[r.brand,r.model].filter(Boolean).join(' ');
 const date=new Date(r.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'});
 return `<section class="label repair-label">
  <div class="left">
   <div class="brand"><b>GADGET</b><span>DEFENDERS</span></div>
   <div class="customer"><strong>${safe(r.customerName)}</strong><span>${safe(r.customerPhone)}</span></div>
   <div class="device"><b>${safe(device)}</b><span>${safe(r.issue)}</span></div>
   <div class="meta"><span><b>IMEI / SN:</b> ${safe(r.serial||'')}</span><span><b>CODE:</b> ${safe(r.passcode||'')}</span></div>
  </div>
  <div class="right">
   <div class="ticket"><span>Ticket</span><strong>${safe(r.number)}</strong><small>${safe(date)}</small></div>
   <div class="barcode-wrap">${barcodeSvg(r.number,42)}<b>${safe(r.number)}</b></div>
  </div>
 </section>`;
}

function inventoryLabel(i:InventoryItem,showPrice:boolean){
 const code=i.barcode||i.sku||i.imei||i.serial||i.id.slice(0,8).toUpperCase();
 return `<section class="label inventory-label">
  <div class="inventory-copy"><div class="brand"><b>GADGET</b><span>DEFENDERS</span></div><h1>${safe(i.name)}</h1><p>${safe([i.brand,i.model,i.storage,i.color].filter(Boolean).join(' · '))}</p><small>${safe(i.sku||i.location||'')}</small></div>
  <div class="inventory-code">${showPrice?`<strong>$${Number(i.price||0).toFixed(2)}</strong>`:''}${barcodeSvg(code,42)}<b>${safe(code)}</b></div>
 </section>`;
}

function documentHtml(body:string){return `<!doctype html><html><head><meta charset="utf-8"><title></title><style>
 @page{size:88.9mm 28.6mm;margin:0}
 *{box-sizing:border-box}html,body{width:88.9mm;margin:0!important;padding:0!important;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif}
 .label{width:88.9mm;height:28.6mm;overflow:hidden;page-break-after:always;break-after:page;background:#fff}
 .repair-label{display:grid;grid-template-columns:56mm 32.9mm;border:0;padding:1.5mm 1.8mm}
 .left{min-width:0;padding-right:1.6mm;border-right:1px solid #000;display:grid;grid-template-rows:4.4mm 8.8mm 8.3mm 4.1mm}
 .brand{display:flex;align-items:baseline;gap:1mm;border-bottom:1px solid #000;white-space:nowrap}.brand b{font-size:11px;letter-spacing:.4px}.brand span{font-size:8px;font-weight:800}
 .customer{display:flex;justify-content:space-between;align-items:center;gap:2mm;min-width:0}.customer strong{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.customer span{font-size:8px;white-space:nowrap}
 .device{border-top:1px solid #000;border-bottom:1px solid #000;display:flex;flex-direction:column;justify-content:center;min-width:0}.device b{font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.device span{font-size:8px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:.5mm}
 .meta{display:grid;grid-template-columns:1fr 17mm;gap:1.5mm;align-items:end;font-size:6.6px;white-space:nowrap}.meta span{overflow:hidden;text-overflow:ellipsis}
 .right{padding-left:1.6mm;display:grid;grid-template-rows:10.8mm 14.8mm;min-width:0}
 .ticket{text-align:right;border-bottom:1px solid #000;line-height:1}.ticket span{font-size:7px;font-weight:800;text-transform:uppercase}.ticket strong{display:block;font-size:21px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ticket small{display:block;font-size:6.5px;margin-top:.5mm}
 .barcode-wrap,.inventory-code{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;min-width:0}.barcode{display:block;width:100%;height:10mm}.barcode-wrap b,.inventory-code>b{font-size:7px;letter-spacing:.6px;margin-top:.5mm;white-space:nowrap}
 .inventory-label{display:grid;grid-template-columns:55mm 33.9mm;padding:1.7mm 2mm}.inventory-copy{padding-right:2mm;border-right:1px solid #000;min-width:0}.inventory-copy h1{font-size:14px;margin:2mm 0 1mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.inventory-copy p{font-size:8px;font-weight:700;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.inventory-copy small{display:block;font-size:7px;margin-top:1.5mm}.inventory-code{padding-left:2mm}.inventory-code>strong{align-self:flex-end;font-size:15px;margin-bottom:1.5mm}
 @media print{html,body{width:88.9mm;height:auto}.label{border:0}}
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
