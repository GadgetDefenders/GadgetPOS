import { useEffect } from 'react';
import { storage } from './storage';
import type { Repair } from './types';

const safe=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[char]||char));
const CODE39:Record<string,string>={
 '0':'nnnwwnwnn','1':'wnnwnnnnw','2':'nnwwnnnnw','3':'wnwwnnnnn','4':'nnnwwnnnw','5':'wnnwwnnnn','6':'nnwwwnnnn','7':'nnnwnnwnw','8':'wnnwnnwnn','9':'nnwwnnwnn',
 A:'wnnnnwnnw',B:'nnwnnwnnw',C:'wnwnnwnnn',D:'nnnnwwnnw',E:'wnnnwwnnn',F:'nnwnwwnnn',G:'nnnnnwwnw',H:'wnnnnwwnn',I:'nnwnnwwnn',J:'nnnnwwwnn',
 K:'wnnnnnnww',L:'nnwnnnnww',M:'wnwnnnnwn',N:'nnnnwnnww',O:'wnnnwnnwn',P:'nnwnwnnwn',Q:'nnnnnnwww',R:'wnnnnnwwn',S:'nnwnnnwwn',T:'nnnnwnwwn',
 U:'wwnnnnnnw',V:'nwwnnnnnw',W:'wwwnnnnnn',X:'nwnnwnnnw',Y:'wwnnwnnnn',Z:'nwwnwnnnn','-':'nwnnnnwnw','.':'wwnnnnwnn',' ':'nwwnnnwnn','$':'nwnwnwnnn','/':'nwnwnnnwn','+':'nwnnnwnwn','%':'nnnwnwnwn','*':'nwnnwnwnn'
};

function barcodeSvg(value:string){
 const normalized=value.toUpperCase().replace(/[^0-9A-Z. $/+%-]/g,'-');
 const chars=`*${normalized}*`;let x=0;const bars:string[]=[];
 for(const char of chars){const pattern=CODE39[char]||CODE39['-'];[...pattern].forEach((kind,index)=>{const width=kind==='w'?5:2;if(index%2===0)bars.push(`<rect x="${x}" y="0" width="${width}" height="44"/>`);x+=width});x+=2}
 return `<svg class="barcode" viewBox="0 0 ${x} 44" preserveAspectRatio="none"><g fill="#000">${bars.join('')}</g></svg>`;
}

function labelHtml(repair:Repair){
 const device=[repair.brand,repair.model].filter(Boolean).join(' ');
 const date=new Date(repair.createdAt).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'});
 return `<!doctype html><html><head><meta charset="utf-8"><title>${safe(repair.number)} Label</title><style>
 @page{size:88.9mm 28.6mm;margin:0}
 *{box-sizing:border-box}
 html,body{width:88.9mm;height:28.6mm;margin:0!important;padding:0!important;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;overflow:hidden}
 body{display:flex;align-items:center;justify-content:center}
 .ticket-label{width:85.5mm;height:26.4mm;padding:.9mm 1.2mm;overflow:hidden;border:1px solid #000;border-radius:1.7mm;display:grid;grid-template-rows:5.4mm 6.5mm 8.4mm 3.1mm}
 .top{display:grid;grid-template-columns:31mm 1fr;gap:1.6mm;border-bottom:.8px solid #000;padding-bottom:.45mm}
 .brand{display:flex;flex-direction:column;justify-content:center;line-height:.84;overflow:hidden}
 .brand b{font-size:9px;letter-spacing:.2px}.brand span{font-size:7.5px;font-weight:900;color:#4f9f21}.brand small{font-size:4.4px;letter-spacing:.9px;margin-top:.45mm}
 .ticket{border:.9px solid #000;border-radius:1.1mm;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;white-space:nowrap;overflow:hidden}
 .details{display:grid;grid-template-columns:29mm 1fr;border-bottom:.8px solid #000;min-height:0}
 .customer{padding:.7mm 1.1mm 0 .7mm;border-right:.8px solid #000;min-width:0;overflow:hidden}
 .customer b{display:block;font-size:9.5px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.customer span{display:block;font-size:6px;margin-top:.45mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .device{padding:.7mm 0 0 1.5mm;display:grid;grid-template-columns:9mm 1fr;grid-auto-rows:2.65mm;align-items:center;font-size:6.4px;min-width:0;overflow:hidden}.device b{font-size:6.8px}.device span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .barcode-area{padding:.55mm 6mm .05mm;display:flex;flex-direction:column;align-items:center;justify-content:center;border-bottom:.8px solid #000;min-height:0}
 .barcode{width:100%;height:5mm;display:block}.barcode-number{font-size:6.3px;letter-spacing:1.1px;margin-top:.15mm;line-height:1}
 .footer{display:grid;grid-template-columns:1fr 1fr 1fr;font-size:5.4px;font-weight:700;min-height:0}.footer div{padding:.58mm .8mm 0;border-right:.8px solid #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.footer div:last-child{border-right:0;text-align:right}
 @media print{.ticket-label{border:1px solid #000}}
 </style></head><body><section class="ticket-label"><div class="top"><div class="brand"><b>GADGET</b><span>DEFENDERS</span><small>CELL PHONE REPAIR</small></div><div class="ticket">TICKET ${safe(repair.number)}</div></div><div class="details"><div class="customer"><b>${safe(repair.customerName)}</b><span>${safe(repair.customerPhone)}</span></div><div class="device"><b>Device:</b><span>${safe(device)}</span><b>Repair:</b><span>${safe(repair.issue)}</span></div></div><div class="barcode-area">${barcodeSvg(repair.number)}<div class="barcode-number">${safe(repair.number)}</div></div><div class="footer"><div>IMEI / SN: ${safe(repair.serial||'')}</div><div>CODE: ${safe(repair.passcode||'')}</div><div>DATE: ${safe(date)}</div></div></section></body></html>`;
}

function printLabel(repair:Repair){
 const frame=document.createElement('iframe');frame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';document.body.appendChild(frame);
 const doc=frame.contentDocument;if(!doc){frame.remove();return}doc.open();doc.write(labelHtml(repair));doc.close();
 const run=()=>{frame.contentWindow?.focus();frame.contentWindow?.print();setTimeout(()=>frame.remove(),1800)};
 if(doc.readyState==='complete')setTimeout(run,250);else frame.onload=()=>setTimeout(run,250);
}

export default function CardLabelOverrideWidget(){
 useEffect(()=>{
  const handler=(event:MouseEvent)=>{
   const button=(event.target as HTMLElement).closest<HTMLButtonElement>('.repair-print-actions button');
   if(!button||button.textContent?.trim()!=='Label')return;
   const card=button.closest('.repair-card');const ticket=card?.querySelector('strong')?.textContent?.trim();if(!ticket)return;
   const repair=storage.getRepairs().find(r=>r.number===ticket);if(!repair)return;
   event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();printLabel(repair);
  };
  document.addEventListener('click',handler,true);return()=>document.removeEventListener('click',handler,true);
 },[]);
 return null;
}
