import { useEffect } from 'react';
import { storage } from './storage';
import type { InventoryItem } from './types';

const norm=(value:unknown)=>String(value??'').trim().toLowerCase();
const list=(value?:string[])=>Array.isArray(value)?value.map(norm):[];
const iphoneModel=(value:unknown)=>norm(value).match(/iphone\s+(\d+)(?:\s+(pro max|pro|plus|mini))?/i)?.slice(1).filter(Boolean).join(' ')||'';

function matches(item:InventoryItem,deviceType:string,brand:string,model:string,repairType:string){
  const selectedIphone=iphoneModel(model);
  const itemIphone=iphoneModel([item.name,item.model,item.notes,item.sku,item.compatibleModels?.join(' ')].join(' '));
  if(selectedIphone&&itemIphone&&selectedIphone!==itemIphone)return false;

  const structured=Boolean(item.repairDeviceType||item.compatibleBrands?.length||item.compatibleModels?.length||item.compatibleRepairTypes?.length);
  if(structured){
    const deviceOk=!item.repairDeviceType||norm(item.repairDeviceType)===norm(deviceType);
    const brandOk=!item.compatibleBrands?.length||list(item.compatibleBrands).includes(norm(brand));
    const modelOk=!item.compatibleModels?.length||list(item.compatibleModels).includes(norm(model));
    const repairOk=!item.compatibleRepairTypes?.length||list(item.compatibleRepairTypes).includes(norm(repairType));
    return deviceOk&&brandOk&&modelOk&&repairOk;
  }

  const modelFields=[item.name,item.model,item.notes,item.sku].map(norm).join(' ');
  const brandFields=[item.name,item.brand,item.model,item.notes].map(norm).join(' ');
  const repairFields=[item.name,item.notes].map(norm).join(' ');
  const repairWord=norm(repairType).replace(/\s+replacement$/,'');
  return Boolean(model)&&modelFields.includes(norm(model))
    &&(!brand||brandFields.includes(norm(brand)))
    &&(!repairType||repairFields.includes(norm(repairType))||repairFields.includes(repairWord));
}

export default function StrictRepairPartFilter(){
  useEffect(()=>{
    const apply=()=>{
      document.querySelectorAll<HTMLElement>('.ri-modal').forEach(modal=>{
        const heading=modal.querySelector('.ri-part-head p')?.textContent?.trim();
        if(!heading)return;
        const [brand='',model='',repairType='']=heading.split('·').map(x=>x.trim());
        const breadcrumb=modal.querySelector('.ri-head p')?.textContent?.trim()||'';
        const deviceType=breadcrumb.split('›')[0]?.trim()||'';
        const inventory=storage.getInventory();
        modal.querySelectorAll<HTMLButtonElement>('.ri-part-list > button').forEach(button=>{
          const name=button.querySelector('strong')?.textContent?.trim()||'';
          const details=button.querySelector('small')?.textContent?.trim()||'';
          const shownSku=details.split('·')[0]?.trim()||'';
          let candidates=inventory.filter(i=>i.category==='Repair Part'&&i.name===name);
          if(shownSku)candidates=candidates.filter(i=>!i.sku||norm(i.sku)===norm(shownSku));
          const valid=candidates.some(item=>matches(item,deviceType,brand,model,repairType));
          if(!valid)button.remove();
        });
      });
    };
    const observer=new MutationObserver(apply);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    document.addEventListener('click',apply,true);
    const timer=window.setInterval(apply,250);
    apply();
    return()=>{observer.disconnect();document.removeEventListener('click',apply,true);window.clearInterval(timer)};
  },[]);
  return null;
}
