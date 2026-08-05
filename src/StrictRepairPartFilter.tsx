import { useEffect } from 'react';
import { storage } from './storage';
import type { InventoryItem } from './types';

const norm=(value:unknown)=>String(value??'').trim().toLowerCase();
const list=(value?:string[])=>Array.isArray(value)?value.map(norm):[];

function matches(item:InventoryItem,deviceType:string,brand:string,model:string,repairType:string){
  const structured=Boolean(item.repairDeviceType||item.compatibleBrands?.length||item.compatibleModels?.length||item.compatibleRepairTypes?.length);
  if(structured){
    const deviceOk=!item.repairDeviceType||norm(item.repairDeviceType)===norm(deviceType);
    const brandOk=!item.compatibleBrands?.length||list(item.compatibleBrands).includes(norm(brand));
    const modelOk=!item.compatibleModels?.length||list(item.compatibleModels).includes(norm(model));
    const repairOk=!item.compatibleRepairTypes?.length||list(item.compatibleRepairTypes).includes(norm(repairType));
    return deviceOk&&brandOk&&modelOk&&repairOk;
  }

  // Legacy inventory is allowed only when the full selected model is present.
  // This prevents an iPhone 12 part from appearing for iPhone 14 just because
  // both records contain words such as Apple, iPhone, or Screen Replacement.
  const modelFields=[item.name,item.model,item.notes,item.sku].map(norm).join(' ');
  const brandFields=[item.name,item.brand,item.model,item.notes].map(norm).join(' ');
  const repairFields=[item.name,item.notes].map(norm).join(' ');
  return Boolean(model)&&modelFields.includes(norm(model))
    &&(!brand||brandFields.includes(norm(brand)))
    &&(!repairType||repairFields.includes(norm(repairType).replace(' replacement',''))||repairFields.includes(norm(repairType)));
}

export default function StrictRepairPartFilter(){
  useEffect(()=>{
    const apply=()=>{
      const modal=document.querySelector('.ri-modal');
      const heading=modal?.querySelector('.ri-part-head p')?.textContent?.trim();
      if(!modal||!heading)return;
      const [brand='',model='',repairType='']=heading.split('·').map(x=>x.trim());
      const breadcrumb=modal.querySelector('.ri-head p')?.textContent?.trim()||'';
      const deviceType=breadcrumb.split('›')[0]?.trim()||'';
      const inventory=storage.getInventory();
      modal.querySelectorAll<HTMLButtonElement>('.ri-part-list > button').forEach(button=>{
        const name=button.querySelector('strong')?.textContent?.trim()||'';
        const item=inventory.find(i=>i.category==='Repair Part'&&i.name===name);
        button.style.display=item&&matches(item,deviceType,brand,model,repairType)?'':'none';
      });
    };
    const observer=new MutationObserver(apply);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    document.addEventListener('click',apply,true);
    apply();
    return()=>{observer.disconnect();document.removeEventListener('click',apply,true)};
  },[]);
  return null;
}
