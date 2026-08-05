import { useEffect, useRef, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { storage } from './storage';
import type { Sale } from './types';

function esc(value: unknown){
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char] || char));
}

export default function SalesReceiptWidget(){
  const [sale,setSale]=useState<Sale|null>(null);
  const initialLatestId=useRef(storage.getSales()[0]?.id || '');
  const lastSeenId=useRef(initialLatestId.current);

  useEffect(()=>{
    const timer=window.setInterval(()=>{
      const latest=storage.getSales()[0];
      if(!latest || latest.id===lastSeenId.current)return;
      lastSeenId.current=latest.id;
      setSale(latest);
    },400);
    return()=>window.clearInterval(timer);
  },[]);

  function printReceipt(current:Sale){
    const frame=document.createElement('iframe');
    frame.style.position='fixed';
    frame.style.width='1px';
    frame.style.height='1px';
    frame.style.opacity='0';
    frame.style.pointerEvents='none';
    frame.setAttribute('aria-hidden','true');
    document.body.appendChild(frame);
    const doc=frame.contentDocument;
    if(!doc){frame.remove();alert('Unable to prepare the receipt.');return;}
    const lines=current.lines.map(line=>`<tr><td><strong>${esc(line.description)}</strong><small>${line.quantity} × $${Number(line.unitPrice||0).toFixed(2)}</small></td><td>$${(Number(line.unitPrice||0)*Number(line.quantity||0)).toFixed(2)}</td></tr>`).join('');
    doc.open();
    doc.write(`<!doctype html><html><head><title>${esc(current.number)} Receipt</title><style>@page{size:auto;margin:8mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0 auto;max-width:340px;font-size:13px}.center{text-align:center}.store h1{font-size:22px;margin:0 0 4px}.store p{margin:2px 0}.rule{border-top:1px dashed #555;margin:13px 0}.meta{display:grid;grid-template-columns:1fr 1fr;gap:5px}.meta div:nth-child(even){text-align:right}table{width:100%;border-collapse:collapse}td{padding:7px 0;border-bottom:1px solid #ddd;vertical-align:top}td:last-child{text-align:right;font-weight:700}small{display:block;color:#555;margin-top:3px}.totals{margin-top:10px}.totals div{display:flex;justify-content:space-between;padding:3px 0}.totals .grand{font-size:18px;font-weight:800;border-top:2px solid #111;margin-top:5px;padding-top:8px}.thanks{margin-top:18px;text-align:center;font-size:12px}.notes{white-space:pre-wrap;margin-top:10px;font-size:12px}@media print{body{max-width:none}}</style></head><body><div class="store center"><h1>Gadget Defenders</h1><p>203 Burkesville St, Suite 121</p><p>Columbia, KY 42728 · 270-380-1505</p></div><div class="rule"></div><div class="meta"><div><strong>${esc(current.number)}</strong></div><div>${esc(new Date(current.createdAt).toLocaleString())}</div><div>${esc(current.customerName||'Walk-in Customer')}</div><div>${esc(current.paymentMethod)}</div></div><div class="rule"></div><table>${lines}</table><div class="totals"><div><span>Subtotal</span><strong>$${Number(current.subtotal||0).toFixed(2)}</strong></div><div><span>Tax</span><strong>$${Number(current.tax||0).toFixed(2)}</strong></div><div class="grand"><span>Total</span><strong>$${Number(current.total||0).toFixed(2)}</strong></div>${current.paymentMethod==='Cash'?`<div><span>Cash Tendered</span><strong>$${Number(current.amountTendered||0).toFixed(2)}</strong></div><div><span>Change</span><strong>$${Number(current.changeDue||0).toFixed(2)}</strong></div>`:''}</div>${current.notes?`<div class="notes"><strong>Notes:</strong><br>${esc(current.notes)}</div>`:''}<div class="thanks"><strong>Thank you for choosing Gadget Defenders!</strong><p>Please keep this receipt for warranty or return service.</p></div></body></html>`);
    doc.close();
    window.setTimeout(()=>{
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      window.setTimeout(()=>frame.remove(),1200);
    },250);
  }

  if(!sale)return null;
  return <div className="sale-receipt-backdrop"><div className="sale-receipt-modal"><div className="sale-receipt-head"><div><h2>Sale Completed</h2><p>{sale.number} · {sale.customerName||'Walk-in Customer'}</p></div><button onClick={()=>setSale(null)} aria-label="Close"><X size={20}/></button></div><div className="sale-receipt-total"><span>Total Paid</span><strong>${Number(sale.total||0).toFixed(2)}</strong><small>{sale.paymentMethod}</small></div><div className="sale-receipt-lines">{sale.lines.map(line=><div key={line.id}><span>{line.quantity} × {line.description}</span><strong>${(Number(line.unitPrice||0)*Number(line.quantity||0)).toFixed(2)}</strong></div>)}</div><div className="sale-receipt-actions"><button onClick={()=>printReceipt(sale)}><Printer size={17}/>Print Receipt</button><button className="primary" onClick={()=>setSale(null)}>Start New Sale</button></div></div></div>;
}
