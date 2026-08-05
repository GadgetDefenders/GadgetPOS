import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Save, Trash2, X } from 'lucide-react';

export type PosCatalogTab='Repairs'|'Products'|'Cell Phones'|'Accessories'|'Prepaid Service'|'Miscellaneous'|'Bill Payments';
export type PosCatalogItem={id:string;tab:PosCatalogTab;name:string;price:number;taxable:boolean;color:string;icon:string;hidden:boolean;order:number};

export const POS_CATALOG_KEY='gadgetpos_pos_catalog_v1';
const tabs:PosCatalogTab[]=['Repairs','Products','Cell Phones','Accessories','Prepaid Service','Miscellaneous','Bill Payments'];
const starter:PosCatalogItem[]=[
 {id:'repair-diagnostic',tab:'Repairs',name:'Diagnostic / Quick Check',price:49.99,taxable:true,color:'blue',icon:'🔍',hidden:false,order:10},
 {id:'product-data',tab:'Products',name:'Data Transfer',price:49.99,taxable:true,color:'purple',icon:'💾',hidden:false,order:10},
 {id:'accessory-glass',tab:'Accessories',name:'Tempered Glass Install',price:29.99,taxable:true,color:'green',icon:'🛡️',hidden:false,order:10},
 {id:'prepaid-activation',tab:'Prepaid Service',name:'Activation Fee',price:25,taxable:false,color:'teal',icon:'📶',hidden:false,order:10},
 {id:'misc-labor',tab:'Miscellaneous',name:'Custom Labor',price:0,taxable:true,color:'orange',icon:'🧰',hidden:false,order:10},
 {id:'bill-payment',tab:'Bill Payments',name:'Bill Payment',price:0,taxable:false,color:'navy',icon:'🧾',hidden:false,order:10},
];
export function readPosCatalog():PosCatalogItem[]{try{const raw=localStorage.getItem(POS_CATALOG_KEY);if(!raw){localStorage.setItem(POS_CATALOG_KEY,JSON.stringify(starter));return starter}return JSON.parse(raw) as PosCatalogItem[]}catch{return starter}}

export default function PosCatalogManagerWidget(){
 const [visible,setVisible]=useState(false);
 const [activeTab,setActiveTab]=useState<PosCatalogTab>('Repairs');
 const [open,setOpen]=useState(false);
 const [items,setItems]=useState<PosCatalogItem[]>(readPosCatalog());
 const [editing,setEditing]=useState<PosCatalogItem|null>(null);
 const [name,setName]=useState('');
 const [price,setPrice]=useState('');
 const [taxable,setTaxable]=useState(true);
 const [color,setColor]=useState('blue');
 const [icon,setIcon]=useState('＋');

 useEffect(()=>{
  const sync=()=>{
   const isPos=document.querySelector('.topbar h1')?.textContent?.trim()==='POS';
   setVisible(isPos);
   const active=document.querySelector('.pos-tabs button.active')?.textContent?.trim() as PosCatalogTab|undefined;
   if(active&&tabs.includes(active))setActiveTab(active);
  };
  sync();const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  return()=>observer.disconnect();
 },[]);

 const current=useMemo(()=>items.filter(i=>i.tab===activeTab).sort((a,b)=>a.order-b.order),[items,activeTab]);
 function persist(next:PosCatalogItem[]){setItems(next);localStorage.setItem(POS_CATALOG_KEY,JSON.stringify(next));window.dispatchEvent(new Event('gadgetpos-pos-catalog-changed'))}
 function resetForm(){setEditing(null);setName('');setPrice('');setTaxable(activeTab!=='Prepaid Service'&&activeTab!=='Bill Payments');setColor('blue');setIcon('＋')}
 function startEdit(item:PosCatalogItem){setEditing(item);setName(item.name);setPrice(String(item.price));setTaxable(item.taxable);setColor(item.color);setIcon(item.icon)}
 function save(){if(!name.trim()){alert('Enter a button name.');return}const priceValue=Math.max(0,Number(price)||0);if(editing){persist(items.map(i=>i.id===editing.id?{...i,name:name.trim(),price:priceValue,taxable,color,icon}:i))}else{const max=Math.max(0,...current.map(i=>i.order));persist([...items,{id:crypto.randomUUID(),tab:activeTab,name:name.trim(),price:priceValue,taxable,color,icon:hiddenIcon(icon),hidden:false,order:max+10}])}resetForm()}
 function hiddenIcon(value:string){return value.trim()||'＋'}
 function move(item:PosCatalogItem,direction:-1|1){const ordered=[...current];const index=ordered.findIndex(i=>i.id===item.id);const target=index+direction;if(target<0||target>=ordered.length)return;const a=ordered[index],b=ordered[target];persist(items.map(i=>i.id===a.id?{...i,order:b.order}:i.id===b.id?{...i,order:a.order}:i))}

 if(!visible)return null;
 return <>
  <button className="pcm-manage-button" onClick={()=>{resetForm();setOpen(true)}}><Pencil size={16}/>Manage This Tab</button>
  {open&&<div className="pcm-backdrop"><section className="pcm-modal"><header><div><h2>POS Catalog Manager</h2><p>Add and organize the buttons shown inside <strong>{activeTab}</strong>.</p></div><button onClick={()=>setOpen(false)}><X/></button></header>
   <nav className="pcm-tab-strip">{tabs.map(tab=><button className={activeTab===tab?'active':''} onClick={()=>{setActiveTab(tab);resetForm()}} key={tab}>{tab}</button>)}</nav>
   <div className="pcm-body"><div className="pcm-list"><div className="pcm-list-head"><strong>{activeTab} Buttons</strong><span>{current.filter(i=>!i.hidden).length} visible</span></div>{current.map((item,index)=><article key={item.id} className={item.hidden?'hidden':''}><span className={`pcm-swatch ${item.color}`}>{item.icon}</span><div><strong>{item.name}</strong><small>{item.price?`$${item.price.toFixed(2)}`:'Price entered at sale'} · {item.taxable?'Taxable':'Non-taxable'}</small></div><div className="pcm-row-actions"><button disabled={index===0} onClick={()=>move(item,-1)} title="Move up"><ArrowUp/></button><button disabled={index===current.length-1} onClick={()=>move(item,1)} title="Move down"><ArrowDown/></button><button onClick={()=>persist(items.map(i=>i.id===item.id?{...i,hidden:!i.hidden}:i))} title={item.hidden?'Show':'Hide'}>{item.hidden?<Eye/>:<EyeOff/>}</button><button onClick={()=>startEdit(item)} title="Edit"><Pencil/></button><button className="danger" onClick={()=>{if(confirm(`Delete ${item.name}?`))persist(items.filter(i=>i.id!==item.id))}} title="Delete"><Trash2/></button></div></article>)}{!current.length&&<div className="pcm-empty">No custom buttons in this tab yet.</div>}</div>
    <aside className="pcm-editor"><h3>{editing?'Edit Button':'Add New Button'}</h3><label>Button Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Example: Screen Protector Install"/></label><div className="pcm-two"><label>Price<input type="number" min="0" step=".01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00"/></label><label>Icon<input value={icon} maxLength={4} onChange={e=>setIcon(e.target.value)} placeholder="＋"/></label></div><label>Button Color<select value={color} onChange={e=>setColor(e.target.value)}><option value="blue">Blue</option><option value="green">Green</option><option value="teal">Teal</option><option value="purple">Purple</option><option value="orange">Orange</option><option value="navy">Navy</option></select></label><label className="pcm-check"><input type="checkbox" checked={taxable} onChange={e=>setTaxable(e.target.checked)}/>Taxable item</label><div className="pcm-editor-actions"><button onClick={resetForm}>Clear</button><button className="primary" onClick={save}>{editing?<Save size={16}/>:<Plus size={16}/>} {editing?'Save Changes':'Add Button'}</button></div></aside>
   </div>
  </section></div>}
 </>;
}
