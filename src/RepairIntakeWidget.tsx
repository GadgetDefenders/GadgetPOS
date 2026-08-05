import { useEffect, useMemo, useState } from 'react';
import { Plus, Settings2, X } from 'lucide-react';
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
  Apple:['iPhone 16 Series','iPhone 15 Series','iPhone 14 Series','iPhone 13 Series','iPhone 12 Series','iPhone 11 Series','iPhone X / XS / XR','iPhone 8 / SE','iPad','MacBook','Apple Watch','Other Apple'],
  Samsung:['Galaxy S Series','Galaxy A Series','Galaxy Z Series','Galaxy Note Series','Galaxy Tab','Other Samsung'],
  Motorola:['Moto G Series','Moto Edge Series','Moto Razr','Other Motorola'],
  Google:['Pixel Series','Pixel Fold','Other Google'],
  PlayStation:['PS5','PS4','Other PlayStation'],
  Xbox:['Xbox Series X/S','Xbox One','Other Xbox'],
  Nintendo:['Nintendo Switch','Switch Lite','Other Nintendo'],
};
const SERVICE_CHOICES = ['Screen Replacement','Battery Replacement','Charging Port','Back Glass','Camera','Speaker / Microphone','Software / Data','Board Repair','Diagnostic','Other Repair'];
const STATUSES: RepairStatus[] = ['Checked In','Diagnosing','Waiting on Parts','Repairing','Quality Check','Ready for Pickup','Completed'];
const CHECKLIST = ['Powers on','Display works','Touch works','Cameras work','Speakers work','Microphone works','Charging works','Wi-Fi/Bluetooth works','Face ID / Touch ID works','No liquid damage visible'];

export default function RepairIntakeWidget(){
  const [categories,setCategories]=useState<string[]>(()=>JSON.parse(localStorage.getItem('gadgetpos_repair_categories')||'null')||DEFAULT_CATEGORIES);
  const [open,setOpen]=useState(false);
  const [manage,setManage]=useState(false);
  const [category,setCategory]=useState('');
  const [brand,setBrand]=useState('');
  const [model,setModel]=useState('');
  const [service,setService]=useState('');
  const [partId,setPartId]=useState('');
  const [customerName,setCustomerName]=useState('');
  const [customerPhone,setCustomerPhone]=useState('');
  const [warranty,setWarranty]=useState('30 Day Store Warranty');
  const [checkedInBy,setCheckedInBy]=useState('Rodney');
  const [technician,setTechnician]=useState('Rodney');
  const [status,setStatus]=useState<RepairStatus>('Checked In');
  const [notes,setNotes]=useState('');
  const [checked,setChecked]=useState<string[]>([]);
  const [newCategory,setNewCategory]=useState('');
  const inventory=storage.getInventory();
  const parts=useMemo(()=>inventory.filter(i=>i.category==='Repair Part' && i.quantity>0),[open]);
  const selectedPart=parts.find(p=>p.id===partId);

  useEffect(()=>{
    const click=(e:MouseEvent)=>{
      const target=(e.target as HTMLElement).closest('button');
      const text=target?.textContent?.trim()||'';
      const match=categories.find(c=>text.includes(c));
      if(match){ setCategory(match); setBrand(''); setModel(''); setService(''); setPartId(''); setOpen(true); }
    };
    document.addEventListener('click',click);
    return()=>document.removeEventListener('click',click);
  },[categories]);

  function saveCategories(next:string[]){setCategories(next);localStorage.setItem('gadgetpos_repair_categories',JSON.stringify(next));}
  function reset(){setOpen(false);setCategory('');setBrand('');setModel('');setService('');setPartId('');setCustomerName('');setCustomerPhone('');setNotes('');setChecked([]);}
  function createTicket(){
    if(!customerName.trim()||!customerPhone.trim()||!brand||!model||!service){alert('Please complete the customer, brand, model, and repair fields.');return;}
    const repairs=storage.getRepairs();
    const now=new Date().toISOString();
    const number=`R-${String(repairs.length+1).padStart(5,'0')}`;
    const estimate=selectedPart?.price||0;
    const repair:Repair={id:crypto.randomUUID(),number,customerId:'walk-in',customerName,customerPhone,deviceType:category,brand,model,issue:service,part:selectedPart?.name,status,technician,priority:'Normal',estimate,createdAt:now,notes:[`Warranty: ${warranty}`,`Checked in by: ${checkedInBy}`,`Checklist: ${checked.join(', ')||'Not completed'}`,notes].filter(Boolean).join('\n')};
    storage.saveRepairs([repair,...repairs]);
    alert(`${number} created successfully.`);
    reset();
  }

  return <>
    <button className="repair-admin-button" onClick={()=>setManage(true)}><Settings2 size={16}/> Repair Categories</button>
    {manage&&<div className="ri-backdrop"><div className="ri-modal small"><div className="ri-head"><h2>Repair Categories</h2><button onClick={()=>setManage(false)}><X/></button></div><div className="ri-category-list">{categories.map(c=><div key={c}><span>{c}</span><button onClick={()=>saveCategories(categories.filter(x=>x!==c))}>Remove</button></div>)}</div><div className="ri-add"><input value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="New repair category"/><button className="primary" onClick={()=>{if(newCategory.trim()&&!categories.includes(newCategory.trim())){saveCategories([...categories,newCategory.trim()]);setNewCategory('')}}}><Plus size={16}/>Add</button></div></div></div>}
    {open&&<div className="ri-backdrop"><div className="ri-modal"><div className="ri-head"><div><h2>{category}</h2><p>Build the repair, then create the ticket.</p></div><button onClick={reset}><X/></button></div>
      <div className="ri-steps">
        <label>Manufacturer<select value={brand} onChange={e=>{setBrand(e.target.value);setModel('')}}><option value="">Choose manufacturer</option>{(BRANDS[category]||['Other']).map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Device / Model<select value={model} onChange={e=>setModel(e.target.value)} disabled={!brand}><option value="">Choose model</option>{(MODELS[brand]||['Current Model','Older Model','Other']).map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Repair / Service<select value={service} onChange={e=>setService(e.target.value)}><option value="">Choose repair</option>{SERVICE_CHOICES.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Inventory Part<select value={partId} onChange={e=>setPartId(e.target.value)}><option value="">No part selected yet</option>{parts.map(p=><option key={p.id} value={p.id}>{p.name} · {p.quantity} in stock · ${p.price.toFixed(2)}</option>)}</select></label>
      </div>
      <div className="ri-final"><h3>Final Check-In</h3><div className="ri-grid">
        <label>Customer Name<input value={customerName} onChange={e=>setCustomerName(e.target.value)}/></label>
        <label>Customer Phone<input value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)}/></label>
        <label>Warranty<select value={warranty} onChange={e=>setWarranty(e.target.value)}><option>30 Day Store Warranty</option><option>90 Day Store Warranty</option><option>Lifetime Part Warranty</option><option>No Warranty</option><option>Manufacturer Warranty</option></select></label>
        <label>Checked In By<input value={checkedInBy} onChange={e=>setCheckedInBy(e.target.value)}/></label>
        <label>Repair Technician<input value={technician} onChange={e=>setTechnician(e.target.value)}/></label>
        <label>Starting Status<select value={status} onChange={e=>setStatus(e.target.value as RepairStatus)}>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></label>
      </div>
      <div className="ri-checklist"><strong>Device Checklist</strong>{CHECKLIST.map(item=><label key={item}><input type="checkbox" checked={checked.includes(item)} onChange={e=>setChecked(e.target.checked?[...checked,item]:checked.filter(x=>x!==item))}/>{item}</label>)}</div>
      <label>Condition / Customer Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Cracked back glass, dents, liquid indicator, passcode notes, accessories left with device..."/></label>
      {selectedPart&&<div className="ri-summary"><span>Selected part: <strong>{selectedPart.name}</strong></span><span>Repair price: <strong>${selectedPart.price.toFixed(2)}</strong></span><span>Available: <strong>{selectedPart.quantity}</strong></span></div>}
      <div className="ri-actions"><button onClick={reset}>Cancel</button><button className="primary" onClick={createTicket}>Create Repair Ticket</button></div></div>
    </div></div>}
  </>;
}
