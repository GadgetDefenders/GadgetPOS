import { useEffect, useState } from 'react';
import { BookmarkPlus, CalendarDays, FileDown, Trash2 } from 'lucide-react';

type SavedView={id:string;name:string;report:string;range:string;start:string;end:string};
const KEY='gadgetpos_report_views_v1';

function readViews():SavedView[]{
  try{return JSON.parse(localStorage.getItem(KEY)||'[]') as SavedView[];}catch{return[];}
}
function saveViews(rows:SavedView[]){localStorage.setItem(KEY,JSON.stringify(rows));}
function setNativeValue(el:HTMLSelectElement|HTMLInputElement,value:string){
  const proto=el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto,'value')?.set?.call(el,value);
  el.dispatchEvent(new Event('change',{bubbles:true}));
  el.dispatchEvent(new Event('input',{bubbles:true}));
}
function controls(){
  const panel=document.querySelector('.report-control-panel');
  if(!panel)return null;
  const selects=panel.querySelectorAll<HTMLSelectElement>('select');
  const dates=panel.querySelectorAll<HTMLInputElement>('input[type="date"]');
  return {report:selects[0],range:selects[1],start:dates[0],end:dates[1]};
}

export default function ReportsDataCenterWidget(){
  const [mounted,setMounted]=useState(false);
  const [views,setViews]=useState<SavedView[]>(readViews());

  useEffect(()=>{
    const sync=()=>setMounted(Boolean(document.querySelector('.reports-page')));
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true});
    return()=>observer.disconnect();
  },[]);

  function today(){
    const c=controls();if(!c)return;
    const value=new Date().toISOString().slice(0,10);
    setNativeValue(c.range,'custom');
    window.setTimeout(()=>{setNativeValue(c.start,value);setNativeValue(c.end,value);},30);
  }
  function addView(){
    const c=controls();if(!c)return;
    const name=window.prompt('Name this report view:');
    if(!name?.trim())return;
    const view:SavedView={id:crypto.randomUUID(),name:name.trim(),report:c.report.value,range:c.range.value,start:c.start.value,end:c.end.value};
    const next=[view,...views].slice(0,8);setViews(next);saveViews(next);
  }
  function apply(view:SavedView){
    const c=controls();if(!c)return;
    setNativeValue(c.report,view.report);setNativeValue(c.range,view.range);
    window.setTimeout(()=>{if(view.start)setNativeValue(c.start,view.start);if(view.end)setNativeValue(c.end,view.end);},30);
  }
  function remove(id:string){const next=views.filter(v=>v.id!==id);setViews(next);saveViews(next);}

  if(!mounted)return null;
  return <div className="reports-data-tools">
    <div className="reports-data-buttons">
      <button onClick={today}><CalendarDays size={16}/>Today</button>
      <button onClick={addView}><BookmarkPlus size={16}/>Save View</button>
      <button onClick={()=>window.print()}><FileDown size={16}/>Print / Save PDF</button>
    </div>
    {views.length>0&&<div className="reports-saved-views"><span>Saved Views</span>{views.map(view=><div key={view.id}><button onClick={()=>apply(view)}>{view.name}</button><button aria-label={`Delete ${view.name}`} onClick={()=>remove(view.id)}><Trash2 size={13}/></button></div>)}</div>}
  </div>;
}
