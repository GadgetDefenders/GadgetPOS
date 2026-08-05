import { useEffect, useMemo, useState } from 'react';
import { Eye, Printer, Store, X } from 'lucide-react';
import { storage } from './storage';
import type { Repair } from './types';

type PrintMode='customer'|'store'|'claim'|'label';

function safe(value:unknown){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]||char));}
function money(value:number){return `$${Number(value||0).toFixed(2)}`;}
function warrantyFrom(repair:Repair){
  const line=(repair.notes||'').split('\n').find(x=>x.toLowerCase().startsWith('warranty:'));
  return line?.replace(/^warranty:\s*/i,'').trim()||'30 Day Store Warranty';
}
function publicNotes(repair:Repair){
  return (repair.notes||'').split('\n').filter(line=>!/^checked in by:|^checklist:|^supplier:|^part location:/i.test(line)).join('\n').trim();
}
function invoiceNumber(repair:Repair){return `INV-${repair.number.replace(/\D/g,'')||repair.number}`;}

function printHtml(html:string){
  const frame=document.createElement('iframe');
  frame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';
  document.body.appendChild(frame);
  const doc=frame.contentDocument;
  if(!doc){frame.remove();alert('Unable to open the print window.');return;}
  doc.open();doc.write(html);doc.close();
  const run=()=>{try{frame.contentWindow?.focus();frame.contentWindow?.print();}finally{setTimeout(()=>frame.remove(),1800)}};
  if(doc.readyState==='complete')setTimeout(run,150);else frame.onload=()=>setTimeout(run,150);
}

function invoiceHtml(repair:Repair,storeCopy=false){
  const customer=storage.getCustomers().find(c=>c.id===repair.customerId||c.phone===repair.customerPhone);
  const sale=storage.getSales().find(s=>s.lines.some(l=>l.kind==='Repair'&&l.referenceId===repair.id));
  const line=sale?.lines.find(l=>l.kind==='Repair'&&l.referenceId===repair.id);
  const subtotal=Number(line?line.unitPrice*line.quantity:repair.estimate||0);
  const tax=sale&&line?.taxable?subtotal*.06:0;
  const total=subtotal+tax;
  const created=new Date(repair.createdAt).toLocaleString();
  const completed=repair.status==='Completed'?new Date(repair.updatedAt||sale?.createdAt||Date.now()).toLocaleString():'—';
  const warranty=warrantyFrom(repair);
  const notes=storeCopy?repair.notes||'—':publicNotes(repair)||'—';
  const copyLabel=storeCopy?'GADGET DEFENDERS COPY':'CUSTOMER COPY';
  return `<!doctype html><html><head><title>${safe(invoiceNumber(repair))}</title><style>
  @page{size:letter;margin:.4in}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#14283b;margin:0;font-size:11px}.top{display:flex;justify-content:space-between;gap:30px;border-bottom:5px solid #2678c9;padding-bottom:14px}.brand h1{margin:0;font-size:29px;letter-spacing:-1px}.brand .tag{color:#1a9d72;font-weight:800;margin:3px 0 8px}.brand p{margin:2px 0;color:#52687b}.invoice{text-align:right}.invoice .copy{display:inline-block;background:#e9f3fc;color:#1c659f;border-radius:20px;padding:5px 10px;font-size:9px;font-weight:900;letter-spacing:.08em}.invoice h2{font-size:23px;margin:10px 0 2px}.invoice p{margin:3px 0}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.card{border:1px solid #ccd9e4;border-radius:10px;padding:12px}.card h3{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#647b8f;margin:0 0 9px}.card p{margin:4px 0}.card strong{font-size:13px}.device{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid #ccd9e4;border-radius:10px;overflow:hidden;margin-bottom:15px}.device div{padding:11px;border-right:1px solid #e1e8ee}.device div:last-child{border:0}.device span{display:block;color:#6b8092;font-size:9px;text-transform:uppercase;margin-bottom:4px}.device b{font-size:12px}.items{width:100%;border-collapse:collapse;margin-top:10px}.items th{background:#173f65;color:#fff;padding:9px;text-align:left;font-size:10px}.items th:nth-child(n+2),.items td:nth-child(n+2){text-align:right}.items td{padding:11px 9px;border-bottom:1px solid #dce5ec}.items small{display:block;color:#718597;margin-top:3px}.totals{width:310px;margin:12px 0 16px auto;border-collapse:collapse}.totals td{padding:6px 4px}.totals td:last-child{text-align:right;font-weight:800}.totals .grand td{font-size:16px;border-top:2px solid #173f65;padding-top:9px}.warranty{border:2px solid #20a879;background:#effaf6;border-radius:11px;padding:13px;margin:15px 0}.warranty h3{color:#147657;margin:0 0 6px;font-size:13px}.warranty p{margin:4px 0;line-height:1.45}.notes{border:1px solid #ccd9e4;border-radius:10px;padding:11px;white-space:pre-wrap;line-height:1.45}.notes h3{margin:0 0 6px;font-size:11px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:45px;margin-top:38px}.line{border-top:1px solid #263d50;padding-top:5px;color:#687d8e;font-size:9px}.footer{text-align:center;border-top:1px solid #dae3ea;margin-top:20px;padding-top:11px;color:#657a8c}.code{font-family:monospace;font-size:14px;letter-spacing:3px;font-weight:800;margin-top:9px}@media print{body{margin:0}}
  </style></head><body><div class="top"><div class="brand"><h1>Gadget Defenders</h1><div class="tag">Repair • Devices • Accessories • Prepaid Service</div><p>203 Burkesville St, Suite 121 · Columbia, KY 42728</p><p>270-380-1505 · GadgetDefenders.com</p></div><div class="invoice"><span class="copy">${copyLabel}</span><h2>${safe(invoiceNumber(repair))}</h2><p><b>Repair:</b> ${safe(repair.number)}</p><p><b>Check-in:</b> ${safe(created)}</p><p><b>Completed:</b> ${safe(completed)}</p><div class="code">||| ${safe(repair.number)} |||</div></div></div><div class="meta"><div class="card"><h3>Customer</h3><strong>${safe(repair.customerName)}</strong><p>${safe(repair.customerPhone||'No phone')}</p><p>${safe(customer?.email||'')}</p></div><div class="card"><h3>Repair Information</h3><p><b>Status:</b> ${safe(repair.status)}</p><p><b>Technician:</b> ${safe(repair.technician||'Unassigned')}</p><p><b>Payment:</b> ${safe(sale?.paymentMethod||'Not recorded')}</p></div></div><div class="device"><div><span>Device</span><b>${safe(repair.brand)} ${safe(repair.model)}</b></div><div><span>Color</span><b>${safe(repair.color||'—')}</b></div><div><span>IMEI / Serial</span><b>${safe(repair.serial||'—')}</b></div><div><span>Repair Status</span><b>${safe(repair.status)}</b></div></div><table class="items"><thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody><tr><td><b>${safe(repair.issue)}</b><small>${safe(repair.part||'Repair service')}</small></td><td>1</td><td>${money(subtotal)}</td><td>${money(subtotal)}</td></tr></tbody></table><table class="totals"><tr><td>Subtotal</td><td>${money(subtotal)}</td></tr><tr><td>Tax</td><td>${money(tax)}</td></tr><tr class="grand"><td>Total</td><td>${money(total)}</td></tr></table><div class="warranty"><h3>${safe(warranty)}</h3><p>Covers defects in the replacement part installed by Gadget Defenders during the stated warranty period.</p><p><b>Not covered:</b> cracked glass, liquid damage, physical damage, misuse, tampering, or damage occurring after pickup.</p></div><div class="notes"><h3>${storeCopy?'Internal Repair Notes':'Repair Notes'}</h3>${safe(notes)}</div>${storeCopy&&repair.passcode?`<div class="notes" style="margin-top:10px"><h3>Store Use Only — Device Passcode</h3>${safe(repair.passcode)}</div>`:''}<div class="signatures"><div class="line">Customer Signature / Pickup Date</div><div class="line">Employee Signature / Date</div></div><div class="footer">Thank you for choosing Gadget Defenders. Please retain this invoice for warranty service.</div></body></html>`;
}

function ticketHtml(repair:Repair,mode:PrintMode){
  const date=new Date(repair.createdAt).toLocaleString();
  if(mode==='claim')return `<!doctype html><html><head><title>${safe(repair.number)} Claim Ticket</title><style>@page{size:80mm auto;margin:5mm}body{font-family:Arial;color:#111;text-align:center;font-size:13px;margin:0}h1{font-size:20px;margin:0}.ticket{border-top:2px dashed #111;border-bottom:2px dashed #111;margin:12px 0;padding:12px 0}.number{font-size:24px;font-weight:800}.row{margin:7px 0}.small{font-size:11px}.code{font-family:monospace;font-size:20px;letter-spacing:3px;border:1px solid #111;padding:8px;margin:10px 0}</style></head><body><h1>Gadget Defenders</h1><div>203 Burkesville St, Suite 121</div><div>Columbia, KY 42728 · 270-380-1505</div><div class="ticket"><div class="small">CUSTOMER CLAIM TICKET</div><div class="number">${safe(repair.number)}</div><div class="row"><strong>${safe(repair.customerName)}</strong></div><div class="row">${safe(repair.brand)} ${safe(repair.model)}</div><div class="row">${safe(repair.issue)}</div><div class="code">${safe(repair.number)}</div><div class="small">Please bring this ticket when picking up your device.</div></div><div class="small">Checked in ${safe(date)}</div></body></html>`;
  if(mode==='label')return `<!doctype html><html><head><title>${safe(repair.number)} Device Label</title><style>@page{size:62mm 40mm;margin:2mm}body{font-family:Arial;color:#111;margin:0;font-size:11px}.label{border:2px solid #111;padding:6px;height:32mm}.number{font-size:22px;font-weight:900}.name{font-size:14px;font-weight:700;margin:3px 0}.device{font-size:12px}.issue{margin-top:4px;font-weight:700}.code{font-family:monospace;letter-spacing:2px;margin-top:5px}</style></head><body><div class="label"><div class="number">${safe(repair.number)}</div><div class="name">${safe(repair.customerName)}</div><div class="device">${safe(repair.brand)} ${safe(repair.model)}</div><div class="issue">${safe(repair.issue)}</div><div class="code">|||| ${safe(repair.number)} ||||</div></div></body></html>`;
  return invoiceHtml(repair,mode==='store');
}

export default function RepairPrintWidget(){
  const [preview,setPreview]=useState<Repair|null>(null);
  const previewHtml=useMemo(()=>preview?invoiceHtml(preview,false):'',[preview]);
  useEffect(()=>{
    const wire=()=>{
      document.querySelectorAll<HTMLElement>('.repair-card').forEach(card=>{
        if(card.dataset.printReady==='2')return;
        card.querySelector('.repair-print-actions')?.remove();
        const ticket=card.querySelector('strong')?.textContent?.trim();
        if(!ticket)return;
        const actions=document.createElement('div');actions.className='repair-print-actions';
        const options:[string,PrintMode|'preview'][]=[['Invoice','preview'],['Claim','claim'],['Label','label']];
        options.forEach(([label,mode])=>{
          const button=document.createElement('button');button.type='button';button.textContent=label;
          button.addEventListener('click',e=>{e.stopPropagation();const repair=storage.getRepairs().find(r=>r.number===ticket);if(!repair){alert('Repair ticket not found.');return;}if(mode==='preview')setPreview(repair);else printHtml(ticketHtml(repair,mode));});
          actions.appendChild(button);
        });
        card.appendChild(actions);card.dataset.printReady='2';
      });
    };
    wire();const observer=new MutationObserver(wire);observer.observe(document.body,{subtree:true,childList:true});return()=>observer.disconnect();
  },[]);
  return <>{preview&&<div className="invoice-preview-backdrop"><section className="invoice-preview-modal"><header><div><h2>Professional Repair Invoice</h2><p>{preview.number} · {preview.customerName} · {preview.brand} {preview.model}</p></div><button onClick={()=>setPreview(null)} aria-label="Close"><X/></button></header><div className="invoice-preview-actions"><button onClick={()=>printHtml(invoiceHtml(preview,false))}><Printer size={17}/>Print Customer Copy</button><button onClick={()=>printHtml(invoiceHtml(preview,true))}><Store size={17}/>Print Store Copy</button><button onClick={()=>printHtml(ticketHtml(preview,'claim'))}><Eye size={17}/>Print Claim Ticket</button></div><iframe title="Invoice preview" srcDoc={previewHtml}/></section></div>}</>;
}
