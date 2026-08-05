import { useEffect } from 'react';
import { storage } from './storage';
import type { Repair } from './types';

type PrintMode='full'|'claim'|'label';

function safe(value:unknown){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]||char));}

function printHtml(html:string){
  const frame=document.createElement('iframe');
  frame.style.position='fixed';frame.style.right='0';frame.style.bottom='0';frame.style.width='1px';frame.style.height='1px';frame.style.border='0';frame.style.opacity='0';
  document.body.appendChild(frame);
  const doc=frame.contentDocument;
  if(!doc){frame.remove();alert('Unable to open the print window.');return;}
  doc.open();doc.write(html);doc.close();
  const run=()=>{try{frame.contentWindow?.focus();frame.contentWindow?.print();}finally{setTimeout(()=>frame.remove(),1500)}};
  if(doc.readyState==='complete')setTimeout(run,100);else frame.onload=()=>setTimeout(run,100);
}

function ticketHtml(repair:Repair,mode:PrintMode){
  const date=new Date(repair.createdAt).toLocaleString();
  if(mode==='claim')return `<!doctype html><html><head><title>${safe(repair.number)} Claim Ticket</title><style>@page{size:80mm auto;margin:5mm}body{font-family:Arial,sans-serif;color:#111;margin:0;text-align:center;font-size:13px}h1{font-size:20px;margin:0}.ticket{border-top:2px dashed #111;border-bottom:2px dashed #111;margin:12px 0;padding:12px 0}.number{font-size:24px;font-weight:800}.row{margin:7px 0}.small{font-size:11px}.code{font-family:monospace;font-size:20px;letter-spacing:3px;border:1px solid #111;padding:8px;margin:10px 0}@media print{body{margin:0}}</style></head><body><h1>Gadget Defenders</h1><div>203 Burkesville St, Suite 121</div><div>Columbia, KY 42728 · 270-380-1505</div><div class="ticket"><div class="small">CUSTOMER CLAIM TICKET</div><div class="number">${safe(repair.number)}</div><div class="row"><strong>${safe(repair.customerName)}</strong></div><div class="row">${safe(repair.brand)} ${safe(repair.model)}</div><div class="row">${safe(repair.issue)}</div><div class="code">${safe(repair.number)}</div><div class="small">Please bring this ticket when picking up your device.</div></div><div class="small">Checked in ${safe(date)}</div></body></html>`;
  if(mode==='label')return `<!doctype html><html><head><title>${safe(repair.number)} Device Label</title><style>@page{size:62mm 40mm;margin:2mm}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:11px}.label{border:2px solid #111;padding:6px;height:32mm;box-sizing:border-box}.number{font-size:22px;font-weight:900}.name{font-size:14px;font-weight:700;margin:3px 0}.device{font-size:12px}.issue{margin-top:4px;font-weight:700}.code{font-family:monospace;letter-spacing:2px;margin-top:5px}@media print{body{margin:0}}</style></head><body><div class="label"><div class="number">${safe(repair.number)}</div><div class="name">${safe(repair.customerName)}</div><div class="device">${safe(repair.brand)} ${safe(repair.model)}</div><div class="issue">${safe(repair.issue)}</div><div class="code">|||| ${safe(repair.number)} ||||</div></div></body></html>`;
  return `<!doctype html><html><head><title>${safe(repair.number)} Repair Ticket</title><style>@page{size:letter;margin:.45in}body{font-family:Arial,sans-serif;color:#17283a;margin:0;font-size:12px}.header{display:flex;justify-content:space-between;border-bottom:3px solid #2678c9;padding-bottom:12px;margin-bottom:16px}.header h1{margin:0;font-size:26px}.header p{margin:4px 0}.ticket-no{text-align:right;font-size:22px;font-weight:800}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.box{border:1px solid #ccd8e2;border-radius:7px;padding:10px}.full{grid-column:1/-1}.label{font-size:10px;text-transform:uppercase;color:#687b8d}.value{font-size:14px;font-weight:700;margin-top:4px;white-space:pre-wrap}.terms{margin-top:14px;padding:10px;border:1px solid #ccd8e2;font-size:10px;line-height:1.4}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:35px;margin-top:42px}.line{border-top:1px solid #17283a;padding-top:5px;font-size:10px}.footer{text-align:center;margin-top:22px;font-size:10px;color:#687b8d}@media print{body{margin:0}}</style></head><body><div class="header"><div><h1>Gadget Defenders</h1><p>203 Burkesville St, Suite 121 · Columbia, KY 42728</p><p>270-380-1505</p></div><div class="ticket-no">${safe(repair.number)}<div style="font-size:11px;font-weight:400">${safe(date)}</div></div></div><div class="grid"><div class="box"><div class="label">Customer</div><div class="value">${safe(repair.customerName)}</div></div><div class="box"><div class="label">Phone</div><div class="value">${safe(repair.customerPhone||'—')}</div></div><div class="box"><div class="label">Device</div><div class="value">${safe(repair.brand)} ${safe(repair.model)}</div></div><div class="box"><div class="label">IMEI / Serial</div><div class="value">${safe(repair.serial||'—')}</div></div><div class="box full"><div class="label">Repair / Issue</div><div class="value">${safe(repair.issue)}</div></div><div class="box"><div class="label">Selected Part</div><div class="value">${safe(repair.part||'No part selected')}</div></div><div class="box"><div class="label">Estimate</div><div class="value">$${Number(repair.estimate||0).toFixed(2)}</div></div><div class="box"><div class="label">Status</div><div class="value">${safe(repair.status)}</div></div><div class="box"><div class="label">Technician</div><div class="value">${safe(repair.technician||'Unassigned')}</div></div><div class="box full"><div class="label">Notes / Warranty / Checklist</div><div class="value">${safe(repair.notes||'—')}</div></div></div><div class="terms">I authorize Gadget Defenders to inspect and repair the listed device. I understand that estimates may change if additional damage is found and that data loss can occur during diagnosis or repair. I confirm the device condition and information shown above.</div><div class="signatures"><div class="line">Customer Signature / Date</div><div class="line">Employee Signature / Date</div></div><div class="footer">Thank you for choosing Gadget Defenders.</div></body></html>`;
}

function printRepair(repair:Repair,mode:PrintMode){printHtml(ticketHtml(repair,mode));}

export default function RepairPrintWidget(){
  useEffect(()=>{
    const wire=()=>{
      document.querySelectorAll<HTMLElement>('.repair-card').forEach(card=>{
        if(card.dataset.printReady==='1')return;
        const ticket=card.querySelector('strong')?.textContent?.trim();
        if(!ticket)return;
        const actions=document.createElement('div');actions.className='repair-print-actions';
        [['Ticket','full'],['Claim','claim'],['Label','label']].forEach(([label,mode])=>{
          const button=document.createElement('button');button.type='button';button.textContent=label;
          button.addEventListener('click',e=>{e.stopPropagation();const repair=storage.getRepairs().find(r=>r.number===ticket);if(!repair){alert('Repair ticket not found.');return;}printRepair(repair,mode as PrintMode);});
          actions.appendChild(button);
        });
        card.appendChild(actions);card.dataset.printReady='1';
      });
    };
    wire();
    const observer=new MutationObserver(wire);observer.observe(document.body,{subtree:true,childList:true});
    return()=>observer.disconnect();
  },[]);
  return null;
}
