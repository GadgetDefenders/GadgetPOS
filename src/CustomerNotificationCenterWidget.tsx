import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Mail, MessageSquare, Phone, Search, Send, X } from 'lucide-react';
import { storage } from './storage';
import type { Repair, RepairStatus } from './types';

type Channel='Text'|'Email';
type NotificationLog={id:string;repairId:string;channel:Channel;message:string;createdAt:string};
const LOG_KEY='gadgetpos_customer_notifications_v1';
const readLogs=():NotificationLog[]=>{try{return JSON.parse(localStorage.getItem(LOG_KEY)||'[]')}catch{return[]}};
const cleanPhone=(value:string)=>value.replace(/\D/g,'');

function template(repair:Repair){
 const first=(repair.customerName||'there').trim().split(/\s+/)[0];
 const device=`${repair.brand} ${repair.model}`.trim();
 const total=Number(repair.estimate||0).toFixed(2);
 const messages:Record<RepairStatus,string>={
  'Checked In':`Hi ${first}, your ${device} has been checked in at Gadget Defenders. Your repair ticket is ${repair.number}. We will contact you with updates.`,
  'Diagnosing':`Hi ${first}, we are currently diagnosing your ${device} at Gadget Defenders. We will update you as soon as we know more. Ticket ${repair.number}.`,
  'Waiting on Parts':`Hi ${first}, your ${device} repair is waiting on a part. We will contact you as soon as the part arrives. Ticket ${repair.number}.`,
  'Repairing':`Hi ${first}, good news—your ${device} is currently being repaired at Gadget Defenders. Ticket ${repair.number}.`,
  'Quality Check':`Hi ${first}, your ${device} repair is complete and is going through final testing at Gadget Defenders. Ticket ${repair.number}.`,
  'Ready for Pickup':`Hi ${first}, your ${device} repair is complete and ready for pickup at Gadget Defenders. Current total: $${total}. Ticket ${repair.number}. Call 270-380-1505 with any questions.`,
  'Completed':`Hi ${first}, thank you for choosing Gadget Defenders for your ${device}. Your repair ${repair.number} has been completed. We appreciate your business!`
 };
 return messages[repair.status];
}

export default function CustomerNotificationCenterWidget(){
 const [open,setOpen]=useState(false),[repairId,setRepairId]=useState(''),[query,setQuery]=useState(''),[channel,setChannel]=useState<Channel>('Text'),[message,setMessage]=useState(''),[copied,setCopied]=useState(false),[logs,setLogs]=useState<NotificationLog[]>(readLogs());
 const [repairs,setRepairs]=useState<Repair[]>(storage.getRepairs());
 const repair=repairs.find(r=>r.id===repairId);

 useEffect(()=>{
  const nav=document.querySelector('.sidebar nav');
  if(!nav||document.getElementById('gadgetpos-notifications-nav'))return;
  const button=document.createElement('button');button.id='gadgetpos-notifications-nav';button.type='button';button.innerHTML='<span style="font-size:17px">✉</span><span>Notifications</span>';button.onclick=()=>setOpen(true);nav.appendChild(button);
  return()=>button.remove();
 },[]);

 useEffect(()=>{
  const refresh=()=>setRepairs(storage.getRepairs());
  window.addEventListener('gadgetpos-data-changed',refresh);window.addEventListener('storage',refresh);
  return()=>{window.removeEventListener('gadgetpos-data-changed',refresh);window.removeEventListener('storage',refresh)};
 },[]);

 useEffect(()=>{
  const wire=()=>document.querySelectorAll<HTMLElement>('.repair-card').forEach(card=>{
   if(card.dataset.notifyReady==='1')return;
   const ticket=card.querySelector('strong')?.textContent?.trim();if(!ticket)return;
   const button=document.createElement('button');button.type='button';button.className='cnc-card-button';button.textContent='Notify Customer';
   button.onclick=e=>{e.stopPropagation();const found=storage.getRepairs().find(r=>r.number===ticket);if(found){setRepairId(found.id);setMessage(template(found));setOpen(true)}};
   card.appendChild(button);card.dataset.notifyReady='1';
  });
  wire();const observer=new MutationObserver(wire);observer.observe(document.body,{subtree:true,childList:true});return()=>observer.disconnect();
 },[]);

 const filtered=useMemo(()=>{const term=query.toLowerCase();return repairs.filter(r=>[r.number,r.customerName,r.customerPhone,r.brand,r.model,r.status].join(' ').toLowerCase().includes(term)).sort((a,b)=>new Date(b.updatedAt||b.createdAt).getTime()-new Date(a.updatedAt||a.createdAt).getTime())},[repairs,query]);
 function selectRepair(next:Repair){setRepairId(next.id);setMessage(template(next));setCopied(false)}
 function record(){if(!repair||!message.trim())return;const next=[{id:crypto.randomUUID(),repairId:repair.id,channel,message:message.trim(),createdAt:new Date().toISOString()},...logs];setLogs(next);localStorage.setItem(LOG_KEY,JSON.stringify(next))}
 async function copy(){await navigator.clipboard.writeText(message);setCopied(true);record();setTimeout(()=>setCopied(false),1500)}
 function sendText(){if(!repair)return;record();window.location.href=`sms:${cleanPhone(repair.customerPhone)}?&body=${encodeURIComponent(message)}`}
 function sendEmail(){if(!repair)return;const customer=storage.getCustomers().find(c=>c.id===repair.customerId);if(!customer?.email){alert('This customer does not have an email address saved.');return}record();window.location.href=`mailto:${customer.email}?subject=${encodeURIComponent(`Gadget Defenders update - ${repair.number}`)}&body=${encodeURIComponent(message)}`}
 function close(){setOpen(false);setRepairId('');setQuery('');setMessage('')}

 if(!open)return null;
 const customer=repair?storage.getCustomers().find(c=>c.id===repair.customerId):undefined;
 const repairLogs=repair?logs.filter(l=>l.repairId===repair.id):[];
 return <div className="cnc-backdrop"><section className="cnc-shell"><header><div><h2>Customer Notification Center</h2><p>Create repair updates without retyping the same message.</p></div><button onClick={close}><X/></button></header><div className="cnc-layout"><aside><label className="cnc-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ticket, customer, phone or device"/></label><div className="cnc-repair-list">{filtered.map(r=><button key={r.id} className={repairId===r.id?'active':''} onClick={()=>selectRepair(r)}><strong>{r.number} · {r.customerName}</strong><span>{r.brand} {r.model}</span><small>{r.status}</small></button>)}{!filtered.length&&<p>No repairs found.</p>}</div></aside><main>{repair?<><div className="cnc-customer"><div><span>Customer</span><strong>{repair.customerName}</strong><small>{repair.customerPhone}{customer?.email?` · ${customer.email}`:''}</small></div><div><span>Device</span><strong>{repair.brand} {repair.model}</strong><small>{repair.issue} · {repair.status}</small></div></div><div className="cnc-channel"><button className={channel==='Text'?'active':''} onClick={()=>setChannel('Text')}><MessageSquare size={16}/>Text</button><button className={channel==='Email'?'active':''} onClick={()=>setChannel('Email')}><Mail size={16}/>Email</button></div><label className="cnc-message">Message<textarea rows={8} value={message} onChange={e=>setMessage(e.target.value)}/><small>{message.length} characters</small></label><div className="cnc-actions"><button onClick={()=>setMessage(template(repair))}>Reset Template</button><button onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Copied':'Copy Message'}</button>{channel==='Text'?<button className="primary" onClick={sendText}><Phone size={16}/>Open Text Message</button>:<button className="primary" onClick={sendEmail}><Send size={16}/>Open Email</button>}</div><div className="cnc-history"><h3>Notification History</h3>{repairLogs.slice(0,6).map(log=><div key={log.id}><strong>{log.channel}</strong><span>{new Date(log.createdAt).toLocaleString()}</span><p>{log.message}</p></div>)}{!repairLogs.length&&<p>No notifications recorded for this repair yet.</p>}</div></>:<div className="cnc-empty"><MessageSquare size={42}/><h3>Select a repair</h3><p>Choose a customer on the left to create their repair update.</p></div>}</main></div></section></div>;
}
