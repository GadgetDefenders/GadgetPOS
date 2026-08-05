import { useEffect } from 'react';

export default function OpenInventoryFormBridge(){
  useEffect(()=>{
    const open=()=>{
      const button=document.querySelector('.inventory-add-button') as HTMLButtonElement|null;
      if(button)button.click();
      else alert('Open Inventory and try Add Item again.');
    };
    window.addEventListener('gadgetpos-open-inventory-form',open);
    return()=>window.removeEventListener('gadgetpos-open-inventory-form',open);
  },[]);
  return null;
}
