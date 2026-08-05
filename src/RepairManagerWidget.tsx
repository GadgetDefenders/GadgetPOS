import { useEffect, useState } from 'react';
import { CalendarDays, CreditCard, Printer, Save, Trash2, X } from 'lucide-react';
import { storage } from './storage';
import type { Repair, RepairStatus } from './types';

const ACTIVE_STATUSES: RepairStatus[]=['Checked In','Diagnosing','Waiting on Parts','Repairing','Ready for Pickup'];

function printHtml(html:string){
  const frame=document.createElement('iframe');
  frame.style.position='fixed';frame.style.right='0';frame.style.bottom='0';frame.style.width='0';frame.style.height='0';frame.style.border='0';
  document.body.appendChild(frame);
  const doc=frame.contentDocument;
  if(!doc){frame.remove();return;}
  doc.open();doc.write(html);doc.close();
  window.setTimeout(()=>{frame.contentWindow?.focus();frame.contentWindow?.print();window.setTimeout(()=>frame.remove(),1200);},250);
}

const safe=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]||c));

export default function RepairManagerWidget(){
  const [repair,setRepair]=useState<Repair|null>(null);
  const [draft,setDraft]=useState<Repair|null>(null);

  useEffect(()=>{
    const click=(event:MouseEvent)=>{
      const target=event.target as HTMLElement;
      if(target.closest('button,select,input,textarea,label'))return;
      const card=target.closest('.repair-card');
      if(!card)return;
      const number=card.querySelector('strong')?.textContent?.trim();
      if(!number)return;
      const found=storage.getRepairs().find(r=>r.number===number);
      if(found){setRepair(found);setDraft({...found});}
    };
    document.addEventListener('click',click);
    return()=>document.removeEventListener('click',click);
  },[]);

  if(!repair||!draft)return null;

  const update=<K extends keyof Repair>(key:K,value:Repair[K])=>setDraft(current=>current?{...current,[key]:value}:current);
  const close=()=>{setRepair(null);setDraft(null)};
  const save=()=>{
    if(!draft.customerName.trim()||!draft.customerPhone.trim()||!draft.brand.trim()||!draft.model.trim()){alert('Customer, phone, brand, and model are required.');return;}
    const updated={...draft,estimate:Number(draft.estimate)||0,updatedAt:new Date().toISOString()};
    storage.saveRepairs(storage.getRepairs().map(r=>r.id===updated.id?updated:r));
    window.dispatchEvent(new Event('gadgetpos-data-changed'));
    setRepair(updated);setDraft({...updated});
    alert(`${updated.number} updated.`);
  };
  const remove=()=>{
    if(!confirm(`Delete ${draft.number}? This cannot be undone.`))return;
    storage.saveRepairs(storage.getRepairs().filter(r=>r.id!==draft.id));
    window.dispatchEvent(new Event('gadgetpos-data-changed'));
    close();
  };
  const checkout=()=>{
    save();
    window.dispatchEvent(new CustomEvent('gadgetpos-add-repair',{detail:{repairId:draft.id}}));
    close();
  };
  const print=(kind:'ticket'|'claim'|'label')=>{
    const title=kind==='ticket'?'Repair Check-In Ticket':kind==='claim'?'Customer Claim Ticket':'Device Label';
    const compact=kind!=='ticket';
    const body=kind==='ticket'?`<div class="grid"><div><b>Customer</b><span>${safe(draft.customerName)}</span></div><div><b>Phone</b><span>${safe(draft.customerPhone)}</span></div><div><b>Device</b><span>${safe(draft.brand)} ${safe(draft.model)}</span></div><div><b>IMEI / Serial</b><span>${safe(draft.serial||'—')}</span></div><div class="full"><b>Repair / Issue</b><span>${safe(draft.issue)}</span></div><div><b>Estimate</b><span>$${Number(draft.estimate||0).toFixed(2)}</span></div><div><b>Status</b><span>${safe(draft.status)}</span></div><div><b>Technician</b><span>${safe(draft.technician||'Unassigned')}</span></div><div><b>Due Date</b><span>${safe(draft.dueDate||'Not set')}</span></div><div class="full"><b>Notes</b><span>${safe(draft.notes||'—')}</span></div></div><div class="sign"><span>Customer Signature</span><span>Employee Signature</span></div>`:kind==='claim'?`<h2>${safe(draft.number)}</h2><p><b>${safe(draft.customerName)}</b></p><p>${safe(draft.brand)} ${safe(draft.model)}</p><p>${safe(draft.issue)}</p><p>Status: ${safe(draft.status)}</p><hr><p>Gadget Defenders · 270-380-1505</p>`:`<h1>${safe(draft.number)}</h1><h2>${safe(draft.customerName)}</h2><p>${safe(draft.brand)} ${safe(draft.model)}</p><p>${safe(draft.issue)}</p><strong>${safe(draft.status)}</strong>`;
    printHtml(`<!doctype html><html><head><title>${safe(draft.number)} ${title}</title><style>@page{margin:${compact?'8mm':'12mm'}}body{font-family:Arial,sans-serif;color:#17283a;margin:0;${compact?'max-width:320px':''}}header{border-bottom:3px solid #2678c9;margin-bottom:18px;padding-bottom:12px}header h1{margin:0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.grid div{border:1px solid #ccd8e2;border-radius:8px;padding:10px}.grid .full{grid-column:1/-1}.grid b{display:block;font-size:10px;text-transform:uppercase;color:#687b8d}.grid span{display:block;margin-top:5px;font-weight:700;white-space:pre-wrap}.sign{display:grid;grid-template-columns:1fr 1fr;gap:35px;margin-top:50px}.sign span{border-top:1px solid #17283a;padding-top:5px;font-size:12px}h1,h2,p{margin:7px 0}</style></head><body><header><h1>Gadget Defenders</h1><p>${title}</p></header>${body}</body></html>`);
  };

  return <div className="rm-backdrop"><div className="rm-modal"><div className="rm-head"><div><span className="rm-ticket">{draft.number}</span><h2>{draft.brand} {draft.model}</h2><p>Created {new Date(draft.createdAt).toLocaleString()}</p></div><button onClick={close}><X/></button></div>
    <div className="rm-actions-top"><button onClick={()=>print('ticket')}><Printer size={16}/>Full Ticket</button><button onClick={()=>print('claim')}><Printer size={16}/>Claim Ticket</button><button onClick={()=>print('label')}><Printer size={16}/>Device Label</button><button className="primary" onClick={checkout}><CreditCard size={16}/>Send to Checkout</button></div>
    <div className="rm-grid">
      <label>Customer Name<input value={draft.customerName} onChange={e=>update('customerName',e.target.value)}/></label>
      <label>Customer Phone<input value={draft.customerPhone} onChange={e=>update('customerPhone',e.target.value)}/></label>
      <label>Device Type<input value={draft.deviceType} onChange={e=>update('deviceType',e.target.value)}/></label>
      <label>Brand<input value={draft.brand} onChange={e=>update('brand',e.target.value)}/></label>
      <label>Model<input value={draft.model} onChange={e=>update('model',e.target.value)}/></label>
      <label>Color<input value={draft.color||''} onChange={e=>update('color',e.target.value)}/></label>
      <label>IMEI / Serial<input value={draft.serial||''} onChange={e=>update('serial',e.target.value)}/></label>
      <label>Passcode<input value={draft.passcode||''} onChange={e=>update('passcode',e.target.value)}/></label>
      <label className="rm-wide">Repair / Issue<input value={draft.issue} onChange={e=>update('issue',e.target.value)}/></label>
      <label>Part<input value={draft.part||''} onChange={e=>update('part',e.target.value)}/></label>
      <label>Estimate<input type="number" min="0" step=".01" value={draft.estimate} onChange={e=>update('estimate',Number(e.target.value))}/></label>
      <label>Status<select value={draft.status} onChange={e=>update('status',e.target.value as RepairStatus)}>{ACTIVE_STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Technician<input value={draft.technician||''} onChange={e=>update('technician',e.target.value)}/></label>
      <label>Priority<select value={draft.priority} onChange={e=>update('priority',e.target.value as Repair['priority'])}><option>Normal</option><option>High</option><option>Urgent</option></select></label>
      <label>Due Date<div className="rm-date"><CalendarDays size={16}/><input type="date" value={draft.dueDate||''} onChange={e=>update('dueDate',e.target.value)}/></div></label>
      <label className="rm-wide">Notes<textarea value={draft.notes||''} onChange={e=>update('notes',e.target.value)} rows={6}/></label>
    </div>
    <div className="rm-footer"><button className="danger" onClick={remove}><Trash2 size={16}/>Delete Ticket</button><div><button onClick={close}>Cancel</button><button className="primary" onClick={save}><Save size={16}/>Save Changes</button></div></div>
  </div></div>;
}
