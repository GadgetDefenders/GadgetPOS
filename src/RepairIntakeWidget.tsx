import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Printer, Settings2, ShoppingCart, X } from 'lucide-react';
import { storage } from './storage';
import type { InventoryItem, Repair, RepairStatus } from './types';

const DEFAULT_CATEGORIES = ['Cellphone Repair','Tablet Repair','Computer Repair','Game Console Repair','Apple Watch Repair','Quick Check-in'];
const BRANDS: Record<string,string[]> = {
  'Cellphone Repair':['Apple','Samsung','Motorola','Google','Other'],
  'Tablet Repair':['Apple','Samsung','Amazon','Microsoft','Other'],
  'Computer Repair':['Apple','Windows PC','Chromebook','Other'],
  'Game Console Repair':['PlayStation','Xbox','Nintendo','Other'],
  'Apple Watch Repair':['Apple'],
  'Quick Check-in':['General Device'],
};
const MODELS: Record<string,string[]> = {
  Apple:['iPhone 16 Pro Max','iPhone 16 Pro','iPhone 16 Plus','iPhone 16','iPhone 15 Pro Max','iPhone 15 Pro','iPhone 15 Plus','iPhone 15','iPhone 14 Pro Max','iPhone 14 Pro','iPhone 14 Plus','iPhone 14','iPhone 13 Pro Max','iPhone 13 Pro','iPhone 13','iPhone 12 Pro Max','iPhone 12 Pro','iPhone 12','iPhone 11 Pro Max','iPhone 11 Pro','iPhone 11','iPhone XR','iPhone SE','iPad','MacBook','Apple Watch','Other Apple'],
  Samsung:['Galaxy S24 Ultra','Galaxy S24+','Galaxy S24','Galaxy S23 Ultra','Galaxy S23+','Galaxy S23','Galaxy S22 Ultra','Galaxy S22+','Galaxy S22','Galaxy A15','Galaxy A14','Galaxy A13','Galaxy Z Fold','Galaxy Z Flip','Galaxy Note','Galaxy Tab','Other Samsung'],
  Motorola:['Moto G Series','Moto Edge Series','Moto Razr','Other Motorola'],
  Google:['Pixel 9 Series','Pixel 8 Series','Pixel 7 Series','Pixel 6 Series','Pixel Fold','Other Google'],
  PlayStation:['PS5','PS5 Slim','PS4 Pro','PS4 Slim','PS4','Other PlayStation'],
  Xbox:['Xbox Series X','Xbox Series S','Xbox One X','Xbox One S','Xbox One','Other Xbox'],
  Nintendo:['Nintendo Switch OLED','Nintendo Switch','Switch Lite','Other Nintendo'],
  'Windows PC':['Windows Laptop','Windows Desktop','Gaming PC','Other Windows'],
  Chromebook:['Chromebook','Other Chromebook'],
  Amazon:['Fire Tablet','Other Amazon'],
  Microsoft:['Surface Pro','Surface Laptop','Other Microsoft'],
  'General Device':['Other Device'],
  Other:['Other Device'],
};
const SERVICE_CHOICES = ['Screen Replacement','Battery Replacement','Charging Port','Back Glass','Camera','Speaker / Microphone','Software / Data','Board Repair','Diagnostic','Water Damage','Other Repair'];
const STATUSES: RepairStatus[] = ['Checked In','Diagnosing','Waiting on Parts','Repairing','Ready for Pickup'];
const CHECKLIST = ['Powers on','Display works','Touch works','Cameras work','Speakers work','Microphone works','Charging works','Wi-Fi/Bluetooth works','Face ID / Touch ID works','No liquid damage visible'];
type Step='brand'|'model'|'service'|'part'|'final';

export default function RepairIntakeWidget(){
  const [categories,setCategories]=useState<string[]>(()=>JSON.parse(localStorage.getItem('gadgetpos_repair_categories')||'null')||DEFAULT_CATEGORIES);
  const [open,setOpen]=useState(false);
  const [manage,setManage]=useState(false);
  const [createdRepair,setCreatedRepair]=useState<Repair|null>(null);
  const [step,setStep]=useState<Step>('brand');
  const [category,setCategory]=useState('');
  const [brand,setBrand]=useState('');
  const [model,setModel]=useState('');
  const [service,setService]=useState('');
  const [partId,setPartId]=useState('');
  const [customerName,setCustomerName]=useState('');
  const [customerPhone,setCustomerPhone]=useState('');
  const [imei,setImei]=useState('');
  const [passcode,setPasscode]=useState('');
  const [warranty,setWarranty]=useState('30 Day Store Warranty');
  const [checkedInBy,setCheckedInBy]=useState('Rodney');
  const [technician,setTechnician]=useState('Rodney');
  const [status,setStatus]=useState<RepairStatus>('Checked In');
  const [notes,setNotes]=useState('');
  const [checked,setChecked]=useState<string[]>([]);
  const [newCategory,setNewCategory]=useState('');
  const inventory=storage.getInventory();
  const parts=useMemo(()=>inventory.filter(i=>i.category==='Repair Part'&&i.quantity>0),[open]);
  const matchingParts=useMemo(()=>{
    const modelWords=model.toLowerCase().split(/\s+/).filter(x=>x.length>2);
    const serviceWords=service.toLowerCase().split(/\s+/).filter(x=>x.length>3);
    const ranked=parts.map(p=>{
      const hay=[p.name,p.brand,p.model,p.notes,p.sku].join(' ').toLowerCase();
      const score=modelWords.filter(w=>hay.includes(w)).length*3+serviceWords.filter(w=>hay.includes(w)).length*2;
      return {p,score};
    }).sort((a,b)=>b.score-a.score||a.p.name.localeCompare(b.p.name));
    return ranked.map(x=>x.p);
  },[parts,model,service]);
  const selectedPart=parts.find(p=>p.id===partId);

  useEffect(()=>{
    const click=(e:MouseEvent)=>{
      const target=(e.target as HTMLElement).closest('button');
      const text=target?.textContent?.trim()||'';
      const match=categories.find(c=>text.includes(c));
      if(match){setCategory(match);setBrand('');setModel('');setService('');setPartId('');setStep('brand');setOpen(true);}
    };
    document.addEventListener('click',click);
    return()=>document.removeEventListener('click',click);
  },[categories]);

  function saveCategories(next:string[]){setCategories(next);localStorage.setItem('gadgetpos_repair_categories',JSON.stringify(next));}
  function clearForm(){setStep('brand');setCategory('');setBrand('');setModel('');setService('');setPartId('');setCustomerName('');setCustomerPhone('');setImei('');setPasscode('');setNotes('');setChecked([]);}
  function reset(){setOpen(false);clearForm();}
  function back(){setStep(step==='final'?'part':step==='part'?'service':step==='service'?'model':'brand');}
  function printTicket(repair:Repair){
    const safe=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]||char));
    const frame=document.createElement('iframe');
    frame.setAttribute('title',`${repair.number} print ticket`);
    frame.style.position='fixed';
    frame.style.right='0';
    frame.style.bottom='0';
    frame.style.width='1px';
    frame.style.height='1px';
    frame.style.border='0';
    frame.style.opacity='0';
    document.body.appendChild(frame);
    const printWindow=frame.contentWindow;
    const printDocument=printWindow?.document;
    if(!printWindow||!printDocument){frame.remove();alert('The print window could not be created.');return;}
    const created=new Date(repair.createdAt).toLocaleString();
    printDocument.open();
    printDocument.write(`<!doctype html><html><head><title>${safe(repair.number)} Repair Ticket</title><style>@page{size:letter;margin:.45in}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:#17283a;margin:0;font-size:13px}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #2678c9;padding-bottom:14px;margin-bottom:16px}.header h1{font-size:28px;margin:0 0 3px}.header p{margin:2px 0;color:#51677b}.ticket-number{text-align:right}.ticket-number strong{display:block;font-size:24px;color:#176bb5}.ticket{display:grid;grid-template-columns:1fr 1fr;gap:10px}.box{border:1px solid #cbd7e1;border-radius:7px;padding:10px;min-height:57px}.box.full{grid-column:1/-1}.label{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#687b8d;font-weight:700}.value{font-size:14px;font-weight:650;margin-top:4px;white-space:pre-wrap}.policy{margin-top:14px;border:1px solid #cbd7e1;border-radius:7px;padding:11px;font-size:11px;line-height:1.45}.policy strong{display:block;margin-bottom:4px}.signature{margin-top:38px;display:grid;grid-template-columns:1fr 1fr;gap:38px}.line{border-top:1px solid #17283a;padding-top:5px;font-size:11px}.footer{text-align:center;margin-top:20px;color:#687b8d;font-size:11px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="header"><div><h1>Gadget Defenders</h1><p>203 Burkesville St, Suite 121 · Columbia, KY 42728</p><p>270-380-1505</p><p>Repair Check-In Ticket</p></div><div class="ticket-number"><strong>${safe(repair.number)}</strong><span>${safe(created)}</span></div></div><div class="ticket"><div class="box"><div class="label">Customer</div><div class="value">${safe(repair.customerName)}</div></div><div class="box"><div class="label">Phone</div><div class="value">${safe(repair.customerPhone)}</div></div><div class="box"><div class="label">Device</div><div class="value">${safe(repair.brand)} ${safe(repair.model)}</div></div><div class="box"><div class="label">IMEI / Serial</div><div class="value">${safe(repair.serial||'—')}</div></div><div class="box"><div class="label">Device Passcode</div><div class="value">${safe(repair.passcode||'Not provided')}</div></div><div class="box"><div class="label">Current Status</div><div class="value">${safe(repair.status)}</div></div><div class="box full"><div class="label">Repair / Customer Concern</div><div class="value">${safe(repair.issue)}</div></div><div class="box"><div class="label">Selected Part</div><div class="value">${safe(repair.part||'No part selected')}</div></div><div class="box"><div class="label">Estimated Total</div><div class="value">$${Number(repair.estimate||0).toFixed(2)}</div></div><div class="box"><div class="label">Technician</div><div class="value">${safe(repair.technician||'Unassigned')}</div></div><div class="box"><div class="label">Priority</div><div class="value">${safe(repair.priority||'Normal')}</div></div><div class="box full"><div class="label">Warranty / Check-In Checklist / Notes</div><div class="value">${safe(repair.notes||'—')}</div></div></div><div class="policy"><strong>Repair Authorization</strong>I authorize Gadget Defenders to inspect and repair the device described above. Estimates may change if additional damage or required parts are discovered. Gadget Defenders is not responsible for pre-existing damage, data loss, manufacturer warranty eligibility, or devices left more than 30 days after completion. Customer is responsible for backing up important data before service.</div><div class="signature"><div class="line">Customer Signature / Date</div><div class="line">Employee Signature / Date</div></div><div class="footer">Keep this ticket for pickup. Call 270-380-1505 with questions.</div></body></html>`);
    printDocument.close();
    const cleanup=()=>setTimeout(()=>frame.remove(),500);
    printWindow.addEventListener('afterprint',cleanup,{once:true});
    setTimeout(()=>{
      try{printWindow.focus();printWindow.print();setTimeout(cleanup,1500);}catch{frame.remove();alert('Safari could not open the print dialog. Please try again.');}
    },250);
  }
  function createTicket(){
    if(!customerName.trim()||!customerPhone.trim()||!brand||!model||!service){alert('Please complete the customer, brand, model, and repair fields.');return;}
    const repairs=storage.getRepairs();
    const now=new Date().toISOString();
    const nextNumber=Math.max(0,...repairs.map(r=>Number(String(r.number).replace(/\D/g,''))||0))+1;
    const number=`R-${String(nextNumber).padStart(5,'0')}`;
    const estimate=selectedPart?.price||0;
    const repair:Repair={id:crypto.randomUUID(),number,customerId:'walk-in',customerName:customerName.trim(),customerPhone:customerPhone.trim(),deviceType:category,brand,model,serial:imei,passcode,issue:service,part:selectedPart?.name,status,technician,priority:'Normal',estimate,createdAt:now,notes:[`Warranty: ${warranty}`,`Checked in by: ${checkedInBy}`,`Checklist: ${checked.join(', ')||'Not completed'}`,notes].filter(Boolean).join('\n')};
    storage.saveRepairs([repair,...repairs]);
    window.dispatchEvent(new Event('gadgetpos-data-changed'));
    setOpen(false);
    setCreatedRepair(repair);
    clearForm();
  }

  const crumb=[category,brand,model,service].filter(Boolean).join(' › ');
  return <>
    <button className="repair-admin-button" onClick={()=>setManage(true)}><Settings2 size={16}/> Repair Categories</button>
    {manage&&<div className="ri-backdrop"><div className="ri-modal small"><div className="ri-head"><h2>Repair Categories</h2><button onClick={()=>setManage(false)}><X/></button></div><div className="ri-category-list">{categories.map(c=><div key={c}><span>{c}</span><button onClick={()=>saveCategories(categories.filter(x=>x!==c))}>Remove</button></div>)}</div><div className="ri-add"><input value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="New repair category"/><button className="primary" onClick={()=>{if(newCategory.trim()&&!categories.includes(newCategory.trim())){saveCategories([...categories,newCategory.trim()]);setNewCategory('')}}}><Plus size={16}/>Add</button></div></div></div>}
    {open&&<div className="ri-backdrop"><div className="ri-modal"><div className="ri-head"><div><h2>{category}</h2><p>{crumb||'Choose a manufacturer to begin.'}</p></div><button onClick={reset}><X/></button></div>
      {step!=='brand'&&<button className="ri-back" onClick={back}><ArrowLeft size={16}/>Back</button>}
      {step==='brand'&&<div className="ri-choice-grid">{(BRANDS[category]||['Other']).map(x=><button key={x} onClick={()=>{setBrand(x);setStep('model')}}><strong>{x}</strong><small>Choose manufacturer</small></button>)}</div>}
      {step==='model'&&<div className="ri-choice-grid">{(MODELS[brand]||['Current Model','Older Model','Other']).map(x=><button key={x} onClick={()=>{setModel(x);setStep('service')}}><strong>{x}</strong><small>Select model</small></button>)}</div>}
      {step==='service'&&<div className="ri-choice-grid">{SERVICE_CHOICES.map(x=><button key={x} onClick={()=>{setService(x);setPartId('');setStep('part')}}><strong>{x}</strong><small>Select repair</small></button>)}</div>}
      {step==='part'&&<div><div className="ri-part-head"><h3>Choose Inventory Part</h3><button onClick={()=>setStep('final')}>Continue Without Part</button></div><div className="ri-part-list">{matchingParts.map((p:InventoryItem)=><button className={partId===p.id?'selected':''} key={p.id} onClick={()=>{setPartId(p.id);setStep('final')}}><div><strong>{p.name}</strong><small>{[p.brand,p.model,p.sku].filter(Boolean).join(' · ')||'Repair part'}</small></div><div><span>{p.quantity} in stock</span><b>${p.price.toFixed(2)}</b></div></button>)}{!matchingParts.length&&<p>No repair parts are currently in inventory.</p>}</div></div>}
      {step==='final'&&<div className="ri-final"><h3>Final Check-In</h3><div className="ri-selected"><strong>{brand} {model}</strong><span>{service}</span>{selectedPart&&<span>{selectedPart.name} · ${selectedPart.price.toFixed(2)} · {selectedPart.quantity} available</span>}</div><div className="ri-grid">
        <label>Customer Name<input value={customerName} onChange={e=>setCustomerName(e.target.value)}/></label>
        <label>Customer Phone<input value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)}/></label>
        <label>IMEI / Serial<input value={imei} onChange={e=>setImei(e.target.value)}/></label>
        <label>Passcode<input value={passcode} onChange={e=>setPasscode(e.target.value)}/></label>
        <label>Warranty<select value={warranty} onChange={e=>setWarranty(e.target.value)}><option>30 Day Store Warranty</option><option>90 Day Store Warranty</option><option>Lifetime Part Warranty</option><option>No Warranty</option><option>Manufacturer Warranty</option></select></label>
        <label>Checked In By<input value={checkedInBy} onChange={e=>setCheckedInBy(e.target.value)}/></label>
        <label>Repair Technician<input value={technician} onChange={e=>setTechnician(e.target.value)}/></label>
        <label>Starting Status<select value={status} onChange={e=>setStatus(e.target.value as RepairStatus)}>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></label>
      </div><div className="ri-checklist"><strong>Device Checklist</strong>{CHECKLIST.map(item=><label key={item}><input type="checkbox" checked={checked.includes(item)} onChange={e=>setChecked(e.target.checked?[...checked,item]:checked.filter(x=>x!==item))}/>{item}</label>)}</div><label>Condition / Customer Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Cracks, dents, liquid indicators, accessories left, customer concerns..."/></label><div className="ri-actions"><button onClick={reset}>Cancel</button><button className="primary" onClick={createTicket}>Create Repair Ticket</button></div></div>}
    </div></div>}
    {createdRepair&&<div className="ri-backdrop"><div className="ri-modal small ticket-created"><div className="ri-head"><div><h2>Ticket Created</h2><p>{createdRepair.number} · {createdRepair.customerName}</p></div><button onClick={()=>setCreatedRepair(null)}><X/></button></div><div className="ri-selected"><strong>{createdRepair.brand} {createdRepair.model}</strong><span>{createdRepair.issue}</span><span>Estimate: ${Number(createdRepair.estimate||0).toFixed(2)}</span></div><div className="ri-actions ticket-created-actions"><button onClick={()=>printTicket(createdRepair)}><Printer size={17}/>Print Ticket</button><button className="primary" onClick={()=>{window.dispatchEvent(new CustomEvent('gadgetpos-add-repair',{detail:{repairId:createdRepair.id}}));setCreatedRepair(null)}}><ShoppingCart size={17}/>Add to Checkout</button></div></div></div>}
  </>;
}
