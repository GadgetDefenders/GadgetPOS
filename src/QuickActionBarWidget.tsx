import { useEffect, useMemo, useRef, useState } from 'react';
import { Boxes, Clock3, Printer, Search, ShoppingCart, Smartphone, UserRound, Wrench, X } from 'lucide-react';
import { storage } from './storage';

type Result={
  id:string;
  type:'Customer'|'Repair'|'Device'|'Inventory'|'Sale';
  title:string;
  detail:string;
  searchText:string;
};

const RECENT_KEY='gadgetpos_recent_items_v1';

function readRecent():Result[]{
  try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]') as Result[];}catch{return[];}
}

function saveRecent(item:Result){
  const next=[item,...readRecent().filter(row=>!(row.id===item.id&&row.type===item.type))].slice(0,10);
  localStorage.setItem(RECENT_KEY,JSON.stringify(next));
  return next;
}

function clickSidebar(label:string){
  const button=[...document.querySelectorAll<HTMLButtonElement>('.sidebar nav button')]
    .find(item=>item.textContent?.trim().toLowerCase()===label.toLowerCase());
  button?.click();
  return Boolean(button);
}

function setReactInput(input:HTMLInputElement,value:string){
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
  setter?.call(input,value);
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
}

function openPageWithSearch(page:string,value:string){
  clickSidebar(page);
  window.setTimeout(()=>{
    const input=document.querySelector<HTMLInputElement>('.topbar .search input');
    if(input){setReactInput(input,value);input.focus();}
  },120);
}

export default function QuickActionBarWidget(){
  const [visible,setVisible]=useState(false);
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [recent,setRecent]=useState<Result[]>(readRecent());
  const inputRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    const sync=()=>setVisible(Boolean(document.querySelector('.app-shell main')));
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true});
    return()=>observer.disconnect();
  },[]);

  useEffect(()=>{
    if(searchOpen){setRecent(readRecent());window.setTimeout(()=>inputRef.current?.focus(),30);}
  },[searchOpen]);

  function newRepair(){
    clickSidebar('POS');
    window.setTimeout(()=>{
      const smart=[...document.querySelectorAll<HTMLButtonElement>('button')]
        .find(button=>button.textContent?.trim()==='Smart Check-In');
      if(smart)smart.click();
      else [...document.querySelectorAll<HTMLButtonElement>('button')]
        .find(button=>button.textContent?.includes('Cellphone Repair'))?.click();
    },120);
  }

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement|null;
      const typing=target?.tagName==='INPUT'||target?.tagName==='TEXTAREA'||target?.tagName==='SELECT'||target?.isContentEditable;

      if(event.key==='Escape'){
        if(searchOpen){setSearchOpen(false);setQuery('');}
        else document.querySelector<HTMLButtonElement>('.modal button[aria-label="Close"], .universal-search-close')?.click();
        return;
      }

      if(typing)return;

      if(event.key==='F2'){
        event.preventDefault();
        newRepair();
      }else if(event.key==='F3'){
        event.preventDefault();
        clickSidebar('POS');
      }else if(event.key==='F4'){
        event.preventDefault();
        setSearchOpen(true);
      }else if(event.key==='F5'){
        event.preventDefault();
        clickSidebar('Inventory');
      }
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[searchOpen]);

  const results=useMemo<Result[]>(()=>{
    const customers=storage.getCustomers();
    const devices=storage.getDevices();
    const repairs=storage.getRepairs();
    const inventory=storage.getInventory();
    const sales=storage.getSales();
    const all:Result[]=[
      ...customers.map(c=>({id:c.id,type:'Customer' as const,title:c.name,detail:[c.phone,c.email].filter(Boolean).join(' · '),searchText:[c.name,c.phone,c.email].join(' ')})),
      ...repairs.map(r=>({id:r.id,type:'Repair' as const,title:`${r.number} · ${r.customerName}`,detail:`${r.brand} ${r.model} · ${r.issue} · ${r.status}`,searchText:[r.number,r.customerName,r.customerPhone,r.brand,r.model,r.issue,r.serial,r.status].join(' ')})),
      ...devices.map(d=>{const owner=customers.find(c=>c.id===d.customerId);return{id:d.id,type:'Device' as const,title:`${d.brand} ${d.model}`,detail:[owner?.name,d.imeiSerial,d.storage,d.color,d.carrier].filter(Boolean).join(' · '),searchText:[d.brand,d.model,d.imeiSerial,d.storage,d.color,d.carrier,owner?.name,owner?.phone].join(' ')}}),
      ...inventory.map(i=>({id:i.id,type:'Inventory' as const,title:i.name,detail:[i.brand,i.model,i.sku,i.barcode,`Qty ${i.quantity}`].filter(Boolean).join(' · '),searchText:[i.name,i.brand,i.model,i.sku,i.barcode,i.imei,i.serial,i.location,i.category].join(' ')})),
      ...sales.map(s=>({id:s.id,type:'Sale' as const,title:s.number,detail:[s.customerName,`$${Number(s.total||0).toFixed(2)}`,new Date(s.createdAt).toLocaleDateString()].filter(Boolean).join(' · '),searchText:[s.number,s.customerName,s.paymentMethod,s.notes,...s.lines.map(l=>l.description)].join(' ')})),
    ];
    const term=query.trim().toLowerCase();
    if(!term)return [];
    return all.filter(item=>item.searchText.toLowerCase().includes(term)).slice(0,24);
  },[query,searchOpen]);

  function choose(result:Result){
    setRecent(saveRecent(result));
    setSearchOpen(false);setQuery('');
    if(result.type==='Customer'){openPageWithSearch('Customers',result.title);return;}
    if(result.type==='Repair'){openPageWithSearch('Repairs',result.title.split(' · ')[0]);return;}
    if(result.type==='Inventory'){openPageWithSearch('Inventory',result.title);return;}
    if(result.type==='Device'){
      if(!clickSidebar('Device History'))openPageWithSearch('Customers',result.title);
      return;
    }
    clickSidebar('POS');
  }

  function clearRecent(){localStorage.removeItem(RECENT_KEY);setRecent([]);}

  const renderResult=(result:Result)=><button key={`${result.type}-${result.id}`} onClick={()=>choose(result)}>
    <span className={`universal-result-icon ${result.type.toLowerCase()}`}>{result.type==='Customer'?<UserRound size={18}/>:result.type==='Repair'?<Wrench size={18}/>:result.type==='Device'?<Smartphone size={18}/>:result.type==='Inventory'?<Boxes size={18}/>:<ShoppingCart size={18}/>}</span>
    <span className="universal-result-copy"><strong>{result.title}</strong><small>{result.detail||'No additional details'}</small></span>
    <b>{result.type}</b>
  </button>;

  if(!visible)return null;

  return <>
    <div className="quick-action-bar" aria-label="Quick actions">
      <button className="quick-primary" title="New Repair (F2)" onClick={newRepair}><Wrench size={17}/>New Repair</button>
      <button title="Checkout (F3)" onClick={()=>clickSidebar('POS')}><ShoppingCart size={17}/>Checkout</button>
      <button onClick={()=>clickSidebar('Customers')}><UserRound size={17}/>Customers</button>
      <button title="Inventory (F5)" onClick={()=>clickSidebar('Inventory')}><Boxes size={17}/>Inventory</button>
      <button title="Search (F4)" onClick={()=>setSearchOpen(true)}><Search size={17}/>Search</button>
      <button title="Print (Ctrl/Cmd + P)" onClick={()=>window.print()}><Printer size={17}/>Print</button>
    </div>
    {searchOpen&&<div className="universal-search-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){setSearchOpen(false);setQuery('')}}}>
      <div className="universal-search-modal" role="dialog" aria-modal="true" aria-label="Universal search">
        <div className="universal-search-head">
          <div className="universal-search-input"><Search size={20}/><input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search customer, ticket, phone, IMEI, SKU or item..."/></div>
          <button className="universal-search-close" onClick={()=>{setSearchOpen(false);setQuery('')}} aria-label="Close search"><X size={20}/></button>
        </div>
        <div className="universal-search-results">
          {!query.trim()&&recent.length>0&&<>
            <div className="universal-recent-head"><span><Clock3 size={16}/>Recent Items</span><button onClick={clearRecent}>Clear</button></div>
            {recent.map(renderResult)}
          </>}
          {!query.trim()&&!recent.length&&<div className="universal-search-empty"><Clock3 size={30}/><strong>No recent items yet</strong><span>Items you open from search will appear here.</span></div>}
          {query.trim()&&!results.length&&<div className="universal-search-empty"><strong>No results found</strong><span>Try a name, phone number, ticket, model, IMEI, SKU or barcode.</span></div>}
          {results.map(renderResult)}
        </div>
      </div>
    </div>}
  </>;
}
