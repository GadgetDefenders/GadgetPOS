import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { storage } from './storage';
import type { InventoryCategory, InventoryItem } from './types';

const categories: InventoryCategory[]=['Phone','Accessory','Prepaid Service','Repair Part'];

export default function InventoryManagerWidget(){
  const [visible,setVisible]=useState(false);
  const [open,setOpen]=useState(false);
  const [editingId,setEditingId]=useState('');
  const [category,setCategory]=useState<InventoryCategory>('Phone');
  const [name,setName]=useState('');
  const [brand,setBrand]=useState('');
  const [model,setModel]=useState('');
  const [sku,setSku]=useState('');
  const [barcode,setBarcode]=useState('');
  const [imei,setImei]=useState('');
  const [serial,setSerial]=useState('');
  const [carrier,setCarrier]=useState('');
  const [storageSize,setStorageSize]=useState('');
  const [color,setColor]=useState('');
  const [condition,setCondition]=useState<InventoryItem['condition']>('New');
  const [batteryHealth,setBatteryHealth]=useState('');
  const [quantity,setQuantity]=useState('1');
  const [minimum,setMinimum]=useState('1');
  const [cost,setCost]=useState('');
  const [price,setPrice]=useState('');
  const [notes,setNotes]=useState('');

  function clearForm(){setEditingId('');setCategory('Phone');setName('');setBrand('');setModel('');setSku('');setBarcode('');setImei('');setSerial('');setCarrier('');setStorageSize('');setColor('');setCondition('New');setBatteryHealth('');setQuantity('1');setMinimum('1');setCost('');setPrice('');setNotes('');}
  function close(){setOpen(false);clearForm();}
  function startEdit(item:InventoryItem){setEditingId(item.id);setCategory(item.category);setName(item.name||'');setBrand(item.brand||'');setModel(item.model||'');setSku(item.sku||'');setBarcode(item.barcode||'');setImei(item.imei||'');setSerial(item.serial||'');setCarrier(item.carrier||'');setStorageSize(item.storage||'');setColor(item.color||'');setCondition(item.condition||'New');setBatteryHealth(item.batteryHealth==null?'':String(item.batteryHealth));setQuantity(String(item.quantity||0));setMinimum(String(item.minimum||0));setCost(String(item.cost||0));setPrice(String(item.price||0));setNotes(item.notes||'');setOpen(true);}

  useEffect(()=>{
    const sync=()=>{
      const isInventory=document.querySelector('.topbar h1')?.textContent?.trim()==='Inventory';
      setVisible(isInventory);
      document.querySelectorAll('.board-column').forEach(column=>{
        const title=column.querySelector('h3')?.textContent?.trim();
        if(title==='Quality Check'||title==='Completed')(column as HTMLElement).style.display='none';
      });
      document.querySelectorAll('.repair-card select').forEach(select=>{
        Array.from(select.querySelectorAll('option')).forEach(option=>{if(option.textContent==='Quality Check'||option.textContent==='Completed')option.remove();});
      });
      if(!isInventory)return;
      const items=storage.getInventory();
      document.querySelectorAll('.inventory-card').forEach(card=>{
        if(card.querySelector('.inventory-edit-actions'))return;
        const title=card.querySelector('h3')?.textContent?.trim();
        const item=items.find(i=>i.name===title);
        if(!item)return;
        const actions=document.createElement('div');
        actions.className='inventory-edit-actions';
        const edit=document.createElement('button');edit.type='button';edit.innerHTML='✎ Edit';edit.onclick=()=>startEdit(item);
        const remove=document.createElement('button');remove.type='button';remove.className='danger';remove.innerHTML='🗑 Delete';remove.onclick=()=>{if(!confirm(`Delete ${item.name} from inventory?`))return;storage.saveInventory(storage.getInventory().filter(i=>i.id!==item.id));window.dispatchEvent(new Event('gadgetpos-data-changed'));};
        actions.append(edit,remove);card.append(actions);
      });
    };
    sync();
    const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    window.addEventListener('gadgetpos-data-changed',sync);
    return()=>{observer.disconnect();window.removeEventListener('gadgetpos-data-changed',sync)};
  },[]);

  function save(){
    if(!name.trim()){alert('Enter an item name.');return;}
    if((Number(quantity)||0)<0||(Number(cost)||0)<0||(Number(price)||0)<0){alert('Quantity and prices cannot be negative.');return;}
    const existing=storage.getInventory();
    const old=existing.find(i=>i.id===editingId);
    const item:InventoryItem={id:editingId||crypto.randomUUID(),category,name:name.trim(),brand:brand.trim()||undefined,model:model.trim()||undefined,sku:sku.trim()||undefined,barcode:barcode.trim()||undefined,imei:imei.trim()||undefined,serial:serial.trim()||undefined,carrier:carrier.trim()||undefined,storage:storageSize.trim()||undefined,color:color.trim()||undefined,condition:category==='Phone'?condition:undefined,batteryHealth:category==='Phone'&&batteryHealth?Number(batteryHealth):undefined,quantity:Number(quantity)||0,minimum:Number(minimum)||0,cost:Number(cost)||0,price:Number(price)||0,notes:notes.trim()||undefined,createdAt:old?.createdAt||new Date().toISOString()};
    storage.saveInventory(editingId?existing.map(i=>i.id===editingId?item:i):[item,...existing]);
    window.dispatchEvent(new Event('gadgetpos-data-changed'));
    alert(`${item.name} ${editingId?'updated':'added'} successfully.`);close();
  }

  return <>
    {visible&&<button className="inventory-add-button" onClick={()=>{clearForm();setOpen(true)}}><Plus size={17}/>Add Inventory Item</button>}
    {open&&<div className="inventory-modal-backdrop"><div className="inventory-modal"><div className="inventory-modal-head"><div><h2>{editingId?'Edit Inventory Item':'Add Inventory Item'}</h2><p>Update phones, accessories, prepaid items, or repair parts.</p></div><button onClick={close} aria-label="Close"><X size={20}/></button></div>
      <div className="inventory-form-grid">
        <label>Category<select value={category} onChange={e=>setCategory(e.target.value as InventoryCategory)}>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Item Name<input value={name} onChange={e=>setName(e.target.value)}/></label>
        <label>Brand<input value={brand} onChange={e=>setBrand(e.target.value)}/></label><label>Model<input value={model} onChange={e=>setModel(e.target.value)}/></label>
        <label>SKU<input value={sku} onChange={e=>setSku(e.target.value)}/></label><label>Barcode<input value={barcode} onChange={e=>setBarcode(e.target.value)}/></label>
        {category==='Phone'&&<><label>IMEI<input value={imei} onChange={e=>setImei(e.target.value)}/></label><label>Serial Number<input value={serial} onChange={e=>setSerial(e.target.value)}/></label><label>Carrier<input value={carrier} onChange={e=>setCarrier(e.target.value)}/></label><label>Storage<input value={storageSize} onChange={e=>setStorageSize(e.target.value)}/></label><label>Color<input value={color} onChange={e=>setColor(e.target.value)}/></label><label>Condition<select value={condition} onChange={e=>setCondition(e.target.value as InventoryItem['condition'])}><option>New</option><option>Like New</option><option>Good</option><option>Fair</option><option>For Parts</option></select></label><label>Battery Health %<input type="number" min="0" max="100" value={batteryHealth} onChange={e=>setBatteryHealth(e.target.value)}/></label></>}
        <label>Quantity<input type="number" min="0" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><label>Low-stock level<input type="number" min="0" value={minimum} onChange={e=>setMinimum(e.target.value)}/></label>
        <label>Cost<input type="number" min="0" step=".01" value={cost} onChange={e=>setCost(e.target.value)}/></label><label>Selling / Repair Price<input type="number" min="0" step=".01" value={price} onChange={e=>setPrice(e.target.value)}/></label>
        <label className="inventory-notes">Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)}/></label>
      </div><div className="inventory-modal-actions"><button onClick={close}>Cancel</button><button className="primary" onClick={save}>{editingId?<><Pencil size={16}/>Save Changes</>:<><Plus size={16}/>Save Inventory Item</>}</button></div>
    </div></div>}
  </>;
}
