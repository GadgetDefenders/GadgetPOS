import { useEffect, useMemo, useState } from 'react';
import { Clock3, Search, ShieldCheck, Smartphone, X } from 'lucide-react';
import { storage } from './storage';
import type { Customer, CustomerDevice, Repair, Sale } from './types';

type WarrantyRecord={id:string;repairId:string;type:string;startsAt:string;endsAt?:string;status:'Active'|'Expired'|'Claim Open'|'Closed';notes?:string;claims:{id:string;date:string;issue:string;resolution?:string;status:'Open'|'Closed'}[]};
const WARRANTY_KEY='gadgetpos_warranties_v1';
const readWarranties=():WarrantyRecord[]=>{try{return JSON.parse(localStorage.getItem(WARRANTY_KEY)||'[]')}catch{return[]}};

function normalize(value?:string){return (value||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'')}
function money(value:number){return `$${Number(value||0).toFixed(2)}`}

export default function DeviceHistoryCenterWidget(){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [selectedId,setSelectedId]=useState('');
  const [version,setVersion]=useState(0);

  useEffect(()=>{
    const nav=document.querySelector('.sidebar nav');
    if(!nav||document.getElementById('gadgetpos-device-history-nav'))return;
    const button=document.createElement('button');
    button.id='gadgetpos-device-history-nav';
    button.innerHTML='<span>📱</span><span>Device History</span>';
    button.onclick=()=>setOpen(true);
    nav.appendChild(button);

    const wireCards=()=>document.querySelectorAll<HTMLElement>('.repair-card').forEach(card=>{
      if(card.dataset.deviceHistoryReady)return;
      const ticket=card.querySelector('strong')?.textContent?.trim();
      if(!ticket)return;
      const action=document.createElement('button');
      action.className='device-history-card-button';
      action.textContent='Device History';
      action.onclick=e=>{
        e.stopPropagation();
        const repair=storage.getRepairs().find(r=>r.number===ticket);
        if(!repair)return;
        setSelectedId(repair.deviceId||`repair:${repair.id}`);
        setOpen(true);
      };
      card.appendChild(action);
      card.dataset.deviceHistoryReady='1';
    });
    wireCards();
    const observer=new MutationObserver(wireCards);
    observer.observe(document.body,{subtree:true,childList:true});
    const refresh=()=>setVersion(v=>v+1);
    window.addEventListener('gadgetpos-data-changed',refresh);
    window.addEventListener('storage',refresh);
    return()=>{button.remove();observer.disconnect();window.removeEventListener('gadgetpos-data-changed',refresh);window.removeEventListener('storage',refresh)};
  },[]);

  const customers=useMemo(()=>storage.getCustomers(),[version,open]);
  const devices=useMemo(()=>storage.getDevices(),[version,open]);
  const repairs=useMemo(()=>storage.getRepairs(),[version,open]);
  const sales=useMemo(()=>storage.getSales(),[version,open]);
  const warranties=useMemo(()=>readWarranties(),[version,open]);

  const deviceRows=useMemo(()=>{
    const saved=devices.map(device=>({id:device.id,device,customer:customers.find(c=>c.id===device.customerId)}));
    const orphanRepairs=repairs.filter(r=>!r.deviceId||!devices.some(d=>d.id===r.deviceId)).map(repair=>({
      id:`repair:${repair.id}`,
      device:{id:`repair:${repair.id}`,customerId:repair.customerId,deviceType:(repair.deviceType||'Other') as CustomerDevice['deviceType'],brand:repair.brand,model:repair.model,imeiSerial:repair.serial,color:repair.color,createdAt:repair.createdAt} as CustomerDevice,
      customer:customers.find(c=>c.id===repair.customerId)||({id:repair.customerId,name:repair.customerName,phone:repair.customerPhone,createdAt:repair.createdAt} as Customer)
    }));
    const all=[...saved,...orphanRepairs];
    const term=query.trim().toLowerCase();
    return all.filter(row=>!term||[
      row.customer?.name,row.customer?.phone,row.customer?.email,row.device.brand,row.device.model,row.device.imeiSerial,row.device.carrier,row.device.color,row.device.storage,
      ...repairs.filter(r=>r.deviceId===row.device.id||(!r.deviceId&&row.id===`repair:${r.id}`)).map(r=>r.number)
    ].join(' ').toLowerCase().includes(term));
  },[devices,customers,repairs,query]);

  const selected=deviceRows.find(row=>row.id===selectedId)||deviceRows[0];
  const deviceRepairs=selected?repairs.filter(r=>r.deviceId===selected.device.id||(!r.deviceId&&selected.id===`repair:${r.id}`)||(
    r.customerId===selected.device.customerId&&normalize(r.serial)&&normalize(r.serial)===normalize(selected.device.imeiSerial)
  )).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()):[];
  const repairIds=new Set(deviceRepairs.map(r=>r.id));
  const deviceSales=selected?sales.filter(s=>s.customerId===selected.device.customerId&&s.lines.some(l=>l.kind==='Repair'&&repairIds.has(l.referenceId))):[];
  const revenue=deviceSales.reduce((sum,s)=>sum+s.lines.filter(l=>l.kind==='Repair'&&repairIds.has(l.referenceId)).reduce((n,l)=>n+l.unitPrice*l.quantity,0),0)||deviceRepairs.reduce((sum,r)=>sum+Number(r.status==='Completed'?r.estimate:0),0);
  const deviceWarranties=warranties.filter(w=>repairIds.has(w.repairId));
  const activeWarranty=deviceWarranties.find(w=>w.status==='Active'||w.status==='Claim Open');
  const claimCount=deviceWarranties.reduce((sum,w)=>sum+w.claims.length,0);
  const lastVisit=deviceRepairs[0]?.createdAt;

  function openRepair(repair:Repair){
    window.dispatchEvent(new CustomEvent('gadgetpos-open-repair',{detail:{repairId:repair.id}}));
    setOpen(false);
  }

  return <>{open&&<div className="device-history-overlay">
    <header><div><h1>Device History Center</h1><p>Every repair, warranty, and visit attached to the device</p></div><button onClick={()=>setOpen(false)} aria-label="Close"><X/></button></header>
    <div className="device-history-toolbar"><label><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search customer, phone, IMEI, serial, model, or ticket"/></label></div>
    <div className="device-history-layout">
      <aside className="device-history-list">{deviceRows.map(row=>{
        const count=repairs.filter(r=>r.deviceId===row.device.id||(!r.deviceId&&row.id===`repair:${r.id}`)).length;
        return <button key={row.id} className={selected?.id===row.id?'active':''} onClick={()=>setSelectedId(row.id)}><span className="device-history-icon"><Smartphone size={19}/></span><span><strong>{row.device.brand} {row.device.model}</strong><small>{row.customer?.name||'Unknown customer'} · {row.device.imeiSerial||'No IMEI/serial'}</small></span><b>{count}</b></button>
      })}{!deviceRows.length&&<div className="device-history-empty">No devices match your search.</div>}</aside>
      <main className="device-history-detail">{selected?<>
        <section className="device-history-hero"><div className="device-history-avatar"><Smartphone size={30}/></div><div><span className="returning-device-badge">Returning Device</span><h2>{selected.device.brand} {selected.device.model}</h2><p>{selected.customer?.name||'Unknown customer'} · {selected.customer?.phone||'No phone'}</p></div>{activeWarranty&&<div className="device-history-warranty"><ShieldCheck size={20}/><span><small>Warranty</small><strong>{activeWarranty.type}</strong></span></div>}</section>
        <section className="device-history-stats"><article><span>Lifetime Repair Revenue</span><strong>{money(revenue)}</strong></article><article><span>Repairs Performed</span><strong>{deviceRepairs.length}</strong></article><article><span>Warranty Claims</span><strong>{claimCount}</strong></article><article><span>Last Visit</span><strong>{lastVisit?new Date(lastVisit).toLocaleDateString():'—'}</strong></article></section>
        <section className="device-history-info"><div><span>IMEI / Serial</span><strong>{selected.device.imeiSerial||'—'}</strong></div><div><span>Carrier</span><strong>{selected.device.carrier||'—'}</strong></div><div><span>Storage</span><strong>{selected.device.storage||'—'}</strong></div><div><span>Color</span><strong>{selected.device.color||'—'}</strong></div></section>
        {selected.device.notes&&<section className="device-history-note"><strong>Device Notes</strong><p>{selected.device.notes}</p></section>}
        <section className="device-history-events"><div className="device-history-section-title"><div><h3>Complete Device Timeline</h3><p>Newest activity first</p></div></div>
          {deviceRepairs.map(repair=>{const warranty=warranties.find(w=>w.repairId===repair.id);return <article key={repair.id}><div className="device-history-dot"><Clock3 size={15}/></div><div className="device-history-event-body"><div className="device-history-event-head"><div><strong>{repair.issue}</strong><span>{repair.number} · {new Date(repair.createdAt).toLocaleString()}</span></div><b>{money(repair.estimate)}</b></div><p>{repair.part||'No part recorded'} · {repair.technician||'Unassigned'} · {repair.status}</p>{repair.notes&&<small>{repair.notes}</small>}{warranty&&<div className="device-history-event-tags"><span>{warranty.type}</span><span>{warranty.status}</span></div>}<button onClick={()=>openRepair(repair)}>Open Repair</button></div></article>})}
          {!deviceRepairs.length&&<div className="device-history-empty">No repair history has been linked to this device yet.</div>}
        </section>
      </>:<div className="device-history-empty">Select a device to view its history.</div>}</main>
    </div>
  </div>}</>;
}
