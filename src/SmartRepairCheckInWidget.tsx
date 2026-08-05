import { useEffect, useMemo, useState } from 'react';
import { Search, Smartphone, UserRound, X } from 'lucide-react';
import { storage } from './storage';
import type { Customer, CustomerDevice, Repair } from './types';

const SELECTED_KEY='gadgetpos_smart_checkin_selection';

type Selection={customerId:string;deviceId:string;selectedAt:string};

const categoryFor=(type:CustomerDevice['deviceType'])=>({
  Phone:'Cellphone Repair',
  Tablet:'Tablet Repair',
  Computer:'Computer Repair',
  'Apple Watch':'Apple Watch Repair',
  'Game Console':'Game Console Repair',
  Other:'Quick Check-in',
}[type]);

function setReactInput(input:HTMLInputElement|HTMLTextAreaElement,value:string){
  const proto=input instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
  setter?.call(input,value);
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
}

function fieldByLabel(modal:Element,labelText:string){
  return [...modal.querySelectorAll('label')].find(label=>label.textContent?.trim().toLowerCase().startsWith(labelText.toLowerCase()))?.querySelector('input,textarea') as HTMLInputElement|HTMLTextAreaElement|null;
}

function clickChoice(modal:Element,name:string){
  const exact=[...modal.querySelectorAll<HTMLButtonElement>('.ri-choice-grid button')].find(button=>button.querySelector('strong')?.textContent?.trim().toLowerCase()===name.trim().toLowerCase());
  exact?.click();
  return Boolean(exact);
}

export default function SmartRepairCheckInWidget(){
  const [onPos,setOnPos]=useState(false);
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [customerId,setCustomerId]=useState('');
  const [customers,setCustomers]=useState<Customer[]>(storage.getCustomers());
  const [devices,setDevices]=useState<CustomerDevice[]>(storage.getDevices());

  useEffect(()=>{
    const sync=()=>{
      setOnPos(document.querySelector('.topbar h1')?.textContent?.trim()==='Point of Sale');
      setCustomers(storage.getCustomers());
      setDevices(storage.getDevices());
    };
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    window.addEventListener('gadgetpos-data-changed',sync);
    return()=>{observer.disconnect();window.removeEventListener('gadgetpos-data-changed',sync)};
  },[]);

  useEffect(()=>{
    const applySelection=()=>{
      const raw=sessionStorage.getItem(SELECTED_KEY);
      if(!raw)return;
      let selection:Selection;
      try{selection=JSON.parse(raw)}catch{return}
      const customer=storage.getCustomers().find(c=>c.id===selection.customerId);
      const device=storage.getDevices().find(d=>d.id===selection.deviceId);
      const modal=document.querySelector('.ri-modal');
      if(!customer||!device||!modal)return;

      const breadcrumb=modal.querySelector('.ri-head p')?.textContent||'';
      const category=categoryFor(device.deviceType);
      if(!breadcrumb.includes(category))return;

      const hasBrand=breadcrumb.includes('›');
      const hasModel=breadcrumb.toLowerCase().includes(device.model.toLowerCase());
      const final=modal.querySelector('.ri-final');

      if(final){
        const name=fieldByLabel(modal,'Customer name');
        const phone=fieldByLabel(modal,'Phone');
        const serial=fieldByLabel(modal,'IMEI / Serial');
        const passcode=fieldByLabel(modal,'Passcode');
        if(name)setReactInput(name,customer.name);
        if(phone)setReactInput(phone,customer.phone);
        if(serial)setReactInput(serial,device.imeiSerial||'');
        if(passcode)setReactInput(passcode,device.passcode||'');
        return;
      }
      if(!hasBrand){clickChoice(modal,device.brand);return}
      if(!hasModel){clickChoice(modal,device.model);return}
    };
    const observer=new MutationObserver(()=>setTimeout(applySelection,25));
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    document.addEventListener('click',applySelection,true);
    return()=>{observer.disconnect();document.removeEventListener('click',applySelection,true)};
  },[]);

  useEffect(()=>{
    const linkTicket=()=>{
      const raw=sessionStorage.getItem(SELECTED_KEY);
      if(!raw)return;
      let selection:Selection;
      try{selection=JSON.parse(raw)}catch{return}
      const customer=storage.getCustomers().find(c=>c.id===selection.customerId);
      const device=storage.getDevices().find(d=>d.id===selection.deviceId);
      if(!customer||!device)return;
      const repairs=storage.getRepairs();
      const index=repairs.findIndex(r=>r.customerName===customer.name&&r.customerPhone===customer.phone&&r.brand===device.brand&&r.model===device.model&&r.customerId==='walk-in');
      if(index<0)return;
      const current=repairs[index];
      const deviceDetails=[device.storage&&`Storage: ${device.storage}`,device.carrier&&`Carrier: ${device.carrier}`,device.color&&`Color: ${device.color}`,device.notes&&`Device notes: ${device.notes}`].filter(Boolean).join('\n');
      const linked:Repair={...current,customerId:customer.id,deviceId:device.id,color:device.color||current.color,serial:device.imeiSerial||current.serial,passcode:device.passcode||current.passcode,notes:[current.notes,deviceDetails].filter(Boolean).join('\n'),updatedAt:new Date().toISOString()};
      const next=[...repairs];next[index]=linked;storage.saveRepairs(next);sessionStorage.removeItem(SELECTED_KEY);
    };
    window.addEventListener('gadgetpos-data-changed',linkTicket);
    return()=>window.removeEventListener('gadgetpos-data-changed',linkTicket);
  },[]);

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(!q)return customers.slice(0,12);
    return customers.filter(c=>[c.name,c.phone,c.email].some(v=>v?.toLowerCase().includes(q))).slice(0,20);
  },[customers,query]);
  const selectedCustomer=customers.find(c=>c.id===customerId);
  const customerDevices=devices.filter(d=>d.customerId===customerId);

  function start(customer:Customer,device:CustomerDevice){
    sessionStorage.setItem(SELECTED_KEY,JSON.stringify({customerId:customer.id,deviceId:device.id,selectedAt:new Date().toISOString()} satisfies Selection));
    setOpen(false);setCustomerId('');setQuery('');
    const category=categoryFor(device.deviceType);
    const button=[...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.includes(category));
    if(!button){alert(`Open Repairs in the POS and choose ${category}. Your customer and device selection has been saved.`);return}
    button.click();
  }

  return <>
    {onPos&&<button className="smart-checkin-launch" onClick={()=>setOpen(true)}><UserRound size={18}/>Smart Check-In</button>}
    {open&&<div className="smart-checkin-backdrop"><div className="smart-checkin-modal"><div className="smart-checkin-head"><div><h2>Smart Repair Check-In</h2><p>Find a customer, then select one of their registered devices.</p></div><button onClick={()=>setOpen(false)}><X/></button></div>
      <div className="smart-checkin-search"><Search size={18}/><input autoFocus value={query} onChange={e=>{setQuery(e.target.value);setCustomerId('')}} placeholder="Search name, phone, or email..."/></div>
      {!selectedCustomer?<div className="smart-customer-list">{filtered.map(c=><button key={c.id} onClick={()=>setCustomerId(c.id)}><div><strong>{c.name}</strong><span>{c.phone}{c.email?` · ${c.email}`:''}</span></div><b>{devices.filter(d=>d.customerId===c.id).length} device(s)</b></button>)}{!filtered.length&&<p>No matching customer found. Add the customer and device in the Customers tab first.</p>}</div>:<div><button className="smart-back" onClick={()=>setCustomerId('')}>← Back to customers</button><div className="smart-selected-customer"><UserRound/><div><strong>{selectedCustomer.name}</strong><span>{selectedCustomer.phone}</span></div></div><div className="smart-device-list">{customerDevices.map(d=><button key={d.id} onClick={()=>start(selectedCustomer,d)}><Smartphone/><div><strong>{d.brand} {d.model}</strong><span>{[d.deviceType,d.storage,d.color,d.carrier,d.imeiSerial].filter(Boolean).join(' · ')}</span></div></button>)}{!customerDevices.length&&<p>This customer has no registered devices yet. Add one from their Customer Profile.</p>}</div></div>}
    </div></div>}
  </>;
}
