import { useEffect, useMemo, useState } from 'react';
import { Clock3, Search, Wrench, X } from 'lucide-react';
import { storage } from './storage';
import type { Repair, RepairStatus, RepairTimelineEntry } from './types';

const stages:RepairStatus[]=['Checked In','Diagnosing','Waiting on Parts','Repairing','Quality Check','Ready for Pickup','Completed'];

function ensureHistory(repair:Repair,entries:RepairTimelineEntry[]){
  if(entries.some(e=>e.repairId===repair.id))return entries;
  return [...entries,{id:crypto.randomUUID(),repairId:repair.id,action:'Repair checked in',notes:`${repair.brand} ${repair.model} · ${repair.issue}`,employee:repair.technician||'Front Counter',createdAt:repair.createdAt}];
}

export default function RepairTimelineCenterWidget(){
  const [open,setOpen]=useState(false);
  const [repairs,setRepairs]=useState<Repair[]>(storage.getRepairs());
  const [entries,setEntries]=useState<RepairTimelineEntry[]>(storage.getTimeline());
  const [selectedId,setSelectedId]=useState('');
  const [search,setSearch]=useState('');
  const [note,setNote]=useState('');
  const [employee,setEmployee]=useState('Rodney');

  const selected=repairs.find(r=>r.id===selectedId)||null;
  const selectedEntries=useMemo(()=>entries.filter(e=>e.repairId===selectedId).sort((a,b)=>+new Date(b.createdAt)-+new Date(a.createdAt)),[entries,selectedId]);
  const filtered=useMemo(()=>{const q=search.toLowerCase();return repairs.filter(r=>[r.number,r.customerName,r.customerPhone,r.brand,r.model,r.issue,r.status].join(' ').toLowerCase().includes(q)).sort((a,b)=>+new Date(b.updatedAt||b.createdAt)-+new Date(a.updatedAt||a.createdAt));},[repairs,search]);

  useEffect(()=>{
    const refresh=()=>{setRepairs(storage.getRepairs());setEntries(storage.getTimeline())};
    window.addEventListener('gadgetpos-data-changed',refresh);
    window.addEventListener('storage',refresh);
    return()=>{window.removeEventListener('gadgetpos-data-changed',refresh);window.removeEventListener('storage',refresh)};
  },[]);

  useEffect(()=>{
    const nav=document.querySelector('.sidebar nav');
    if(!nav||document.getElementById('gadgetpos-timeline-nav'))return;
    const button=document.createElement('button');button.id='gadgetpos-timeline-nav';button.type='button';button.innerHTML='<span>◷</span><span>Timelines</span>';button.onclick=()=>setOpen(true);nav.appendChild(button);
    return()=>button.remove();
  },[]);

  useEffect(()=>{
    const wire=()=>document.querySelectorAll<HTMLElement>('.repair-card').forEach(card=>{
      if(card.querySelector('.repair-timeline-button'))return;
      const ticket=card.querySelector('strong')?.textContent?.trim();if(!ticket)return;
      const button=document.createElement('button');button.type='button';button.className='repair-timeline-button';button.textContent='View Timeline';
      button.onclick=e=>{e.stopPropagation();const repair=storage.getRepairs().find(r=>r.number===ticket);if(!repair)return;setSelectedId(repair.id);setOpen(true)};
      card.appendChild(button);
    });
    wire();const observer=new MutationObserver(wire);observer.observe(document.body,{subtree:true,childList:true});return()=>observer.disconnect();
  },[]);

  function choose(repair:Repair){const next=ensureHistory(repair,entries);if(next!==entries){setEntries(next);storage.saveTimeline(next)}setSelectedId(repair.id)}
  function addEntry(action:string,notes?:string){if(!selected)return;const item:RepairTimelineEntry={id:crypto.randomUUID(),repairId:selected.id,action,notes,employee:employee.trim()||'Staff',createdAt:new Date().toISOString()};const next=[item,...entries];setEntries(next);storage.saveTimeline(next);setNote('');window.dispatchEvent(new Event('gadgetpos-data-changed'))}
  function changeStatus(status:RepairStatus){if(!selected||selected.status===status)return;const next=repairs.map(r=>r.id===selected.id?{...r,status,updatedAt:new Date().toISOString()}:r);setRepairs(next);storage.saveRepairs(next);addEntry(`Status changed to ${status}`)}

  if(!open)return null;
  return <div className="rtc-overlay"><header><div><h1>Repair Timeline Center</h1><p>Every status change, note, part, and customer update in one place.</p></div><button onClick={()=>setOpen(false)}><X/></button></header><div className="rtc-layout">
    <aside><label><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ticket, customer, phone or device"/></label><div className="rtc-ticket-list">{filtered.map(r=><button key={r.id} className={selectedId===r.id?'active':''} onClick={()=>choose(r)}><strong>{r.number} · {r.customerName}</strong><span>{r.brand} {r.model}</span><small>{r.status} · ${Number(r.estimate||0).toFixed(2)}</small></button>)}</div></aside>
    <main>{!selected?<div className="rtc-empty"><Clock3 size={42}/><h2>Select a repair</h2><p>Choose a ticket to view its complete history.</p></div>:<>
      <section className="rtc-hero"><div><span>{selected.number}</span><h2>{selected.brand} {selected.model}</h2><p>{selected.customerName} · {selected.customerPhone}</p></div><div><strong>{selected.status}</strong><small>{selected.technician||'Unassigned technician'}</small></div></section>
      <section className="rtc-progress">{stages.map((stage,index)=>{const current=stages.indexOf(selected.status);return <button key={stage} className={index<current?'done':index===current?'current':''} onClick={()=>changeStatus(stage)}><i>{index<current?'✓':index+1}</i><span>{stage}</span></button>})}</section>
      <section className="rtc-details"><article><span>Repair</span><strong>{selected.issue}</strong></article><article><span>Part Used</span><strong>{selected.part||'No part selected'}</strong></article><article><span>Estimate</span><strong>${Number(selected.estimate||0).toFixed(2)}</strong></article><article><span>Due Date</span><strong>{selected.dueDate?new Date(selected.dueDate).toLocaleDateString():'Not set'}</strong></article></section>
      <section className="rtc-add"><div><input value={employee} onChange={e=>setEmployee(e.target.value)} placeholder="Employee"/><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add diagnostic notes, customer approval, part update, or other activity..."/></div><div><button onClick={()=>addEntry('Technician note added',note)} disabled={!note.trim()}>Add Note</button><button onClick={()=>addEntry('Customer contacted',note||'Customer was contacted about this repair.')}>Customer Contacted</button><button onClick={()=>addEntry('Part ordered',note||selected.part||'Replacement part ordered.')}>Part Ordered</button></div></section>
      <section className="rtc-history"><h3>Activity History</h3>{selectedEntries.map(e=><article key={e.id}><div className="rtc-dot"><Wrench size={14}/></div><div><strong>{e.action}</strong>{e.notes&&<p>{e.notes}</p>}<small>{e.employee} · {new Date(e.createdAt).toLocaleString()}</small></div></article>)}{!selectedEntries.length&&<p>No timeline activity recorded yet.</p>}</section>
    </>}</main>
  </div></div>;
}
