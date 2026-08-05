import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { storage } from './storage';
import type { InventoryCategory, InventoryItem } from './types';

const categories: InventoryCategory[]=['Phone','Accessory','Prepaid Service','Repair Part'];

export default function InventoryManagerWidget(){
  const [visible,setVisible]=useState(false);
  const [open,setOpen]=useState(false);
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

  useEffect(()=>{
    const sync=()=>setVisible(document.querySelector('.topbar h1')?.textContent?.trim()==='Inventory');
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    return()=>observer.disconnect();
  },[]);

  function reset(){setOpen(false);setCategory('Phone');setName('');setBrand('');setModel('');setSku('');setBarcode('');setImei('');setSerial('');setCarrier('');setStorageSize('');setColor('');setCondition('New');setBatteryHealth('');setQuantity('1');setMinimum('1');setCost('');setPrice('');setNotes('');}
  function save(){
    if(!name.trim()){alert('Enter an item name.');return;}
    if((Number(quantity)||0)<0||(Number(cost)||0)<0||(Number(price)||0)<0){alert('Quantity and prices cannot be negative.');return;}
    const item:InventoryItem={id:crypto.randomUUID(),category,name:name.trim(),brand:brand.trim()||undefined,model:model.trim()||undefined,sku:sku.trim()||undefined,barcode:barcode.trim()||undefined,imei:imei.trim()||undefined,serial:serial.trim()||undefined,carrier:carrier.trim()||undefined,storage:storageSize.trim()||undefined,color:color.trim()||undefined,condition:category==='Phone'?condition:undefined,batteryHealth:category==='Phone'&&batteryHealth?Number(batteryHealth):undefined,quantity:Number(quantity)||0,minimum:Number(minimum)||0,cost:Number(cost)||0,price:Number(price)||0,notes:notes.trim()||undefined,createdAt:new Date().toISOString()};
    storage.saveInventory([item,...storage.getInventory()]);
    alert(`${item.name} added to inventory.`);
    reset();
    window.location.reload();
  }

  return <>
    {visible&&<button className="inventory-add-button" onClick={()=>setOpen(true)}><Plus size={17}/>Add Inventory Item</button>}
    {open&&<div className="inventory-modal-backdrop"><div className="inventory-modal"><div className="inventory-modal-head"><div><h2>Add Inventory Item</h2><p>Add phones, accessories, prepaid items, or repair parts.</p></div><button onClick={reset} aria-label="Close"><X size={20}/></button></div>
      <div className="inventory-form-grid">
        <label>Category<select value={category} onChange={e=>setCategory(e.target.value as InventoryCategory)}>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Item Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Example: iPhone 15 Pro Max Screen"/></label>
        <label>Brand<input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Apple, Samsung, OtterBox..."/></label>
        <label>Model<input value={model} onChange={e=>setModel(e.target.value)} placeholder="iPhone 15 Pro Max"/></label>
        <label>SKU<input value={sku} onChange={e=>setSku(e.target.value)}/></label>
        <label>Barcode<input value={barcode} onChange={e=>setBarcode(e.target.value)}/></label>
        {category==='Phone'&&<><label>IMEI<input value={imei} onChange={e=>setImei(e.target.value)}/></label><label>Serial Number<input value={serial} onChange={e=>setSerial(e.target.value)}/></label><label>Carrier<input value={carrier} onChange={e=>setCarrier(e.target.value)} placeholder="Unlocked, Verizon..."/></label><label>Storage<input value={storageSize} onChange={e=>setStorageSize(e.target.value)} placeholder="128GB"/></label><label>Color<input value={color} onChange={e=>setColor(e.target.value)}/></label><label>Condition<select value={condition} onChange={e=>setCondition(e.target.value as InventoryItem['condition'])}><option>New</option><option>Like New</option><option>Good</option><option>Fair</option><option>For Parts</option></select></label><label>Battery Health %<input type="number" min="0" max="100" value={batteryHealth} onChange={e=>setBatteryHealth(e.target.value)}/></label></>}
        <label>Quantity<input type="number" min="0" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
        <label>Low-stock level<input type="number" min="0" value={minimum} onChange={e=>setMinimum(e.target.value)}/></label>
        <label>Cost<input type="number" min="0" step=".01" value={cost} onChange={e=>setCost(e.target.value)}/></label>
        <label>Selling / Repair Price<input type="number" min="0" step=".01" value={price} onChange={e=>setPrice(e.target.value)}/></label>
        <label className="inventory-notes">Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Supplier, part quality, warranty, activation details..."/></label>
      </div>
      <div className="inventory-modal-actions"><button onClick={reset}>Cancel</button><button className="primary" onClick={save}>Save Inventory Item</button></div>
    </div></div>}
  </>;
}
