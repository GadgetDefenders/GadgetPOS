import { useEffect, useState } from 'react';
import { Boxes, Printer, Search, ShoppingCart, UserRound, Wrench } from 'lucide-react';

function clickSidebar(label:string){
  const button=[...document.querySelectorAll<HTMLButtonElement>('.sidebar nav button')]
    .find(item=>item.textContent?.trim().toLowerCase()===label.toLowerCase());
  button?.click();
  return Boolean(button);
}

export default function QuickActionBarWidget(){
  const [visible,setVisible]=useState(false);

  useEffect(()=>{
    const sync=()=>setVisible(Boolean(document.querySelector('.app-shell main')));
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true});
    return()=>observer.disconnect();
  },[]);

  function newRepair(){
    clickSidebar('POS');
    window.setTimeout(()=>{
      const smart=[...document.querySelectorAll<HTMLButtonElement>('button')]
        .find(button=>button.textContent?.trim()==='Smart Check-In');
      if(smart)smart.click();
      else {
        const repair=[...document.querySelectorAll<HTMLButtonElement>('button')]
          .find(button=>button.textContent?.includes('Cellphone Repair'));
        repair?.click();
      }
    },120);
  }

  function openSearch(){
    const input=document.querySelector<HTMLInputElement>('.topbar .search input, .pos-scan input');
    if(input){input.focus();input.select();return;}
    clickSidebar('Repairs');
    window.setTimeout(()=>document.querySelector<HTMLInputElement>('.topbar .search input')?.focus(),100);
  }

  if(!visible)return null;

  return <div className="quick-action-bar" aria-label="Quick actions">
    <button className="quick-primary" onClick={newRepair}><Wrench size={17}/>New Repair</button>
    <button onClick={()=>clickSidebar('POS')}><ShoppingCart size={17}/>Checkout</button>
    <button onClick={()=>clickSidebar('Customers')}><UserRound size={17}/>Customers</button>
    <button onClick={()=>clickSidebar('Inventory')}><Boxes size={17}/>Inventory</button>
    <button onClick={openSearch}><Search size={17}/>Search</button>
    <button onClick={()=>window.print()}><Printer size={17}/>Print</button>
  </div>;
}
