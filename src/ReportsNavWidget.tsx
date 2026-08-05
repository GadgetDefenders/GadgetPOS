import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ReportsPage from './ReportsPage';
import { storage } from './storage';

export default function ReportsNavWidget(){
  const [open,setOpen]=useState(false);

  useEffect(()=>{
    const nav=document.querySelector('.sidebar nav');
    if(!nav||document.getElementById('gadgetpos-reports-nav')) return;
    const button=document.createElement('button');
    button.id='gadgetpos-reports-nav';
    button.type='button';
    button.innerHTML='<span class="reports-nav-icon">▥</span><span>Reports</span>';
    button.addEventListener('click',()=>setOpen(true));
    nav.appendChild(button);
    return()=>button.remove();
  },[]);

  useEffect(()=>{
    document.getElementById('gadgetpos-reports-nav')?.classList.toggle('active',open);
  },[open]);

  return <>{open&&<div className="reports-section-overlay">
    <div className="reports-overlay-header"><div><h1>Reports</h1><p>Gadget Defenders store performance</p></div><button onClick={()=>setOpen(false)} aria-label="Close reports"><X size={20}/></button></div>
    <ReportsPage sales={storage.getSales()} repairs={storage.getRepairs()} customers={storage.getCustomers()} inventory={storage.getInventory()}/>
  </div>}</>;
}
