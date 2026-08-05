import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { createRoot, type Root } from 'react-dom/client';

function findButton(text:string){
  return [...document.querySelectorAll<HTMLButtonElement>('button')]
    .find(button=>button.textContent?.replace(/\s+/g,' ').trim().toLowerCase()===text.toLowerCase());
}

function goBack(){
  const closeButton=document.querySelector<HTMLButtonElement>(
    '.smart-checkin-overlay button[aria-label="Close"], .repair-intake-overlay button[aria-label="Close"], .modal button[aria-label="Close"], .modal-close, .close-button'
  );
  if(closeButton){closeButton.click();return;}

  const repairs=findButton('Repairs');
  repairs?.click();

  const search=document.querySelector<HTMLInputElement>('.pos-scan input');
  if(search){
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    setter?.call(search,'');
    search.dispatchEvent(new Event('input',{bubbles:true}));
    search.dispatchEvent(new Event('change',{bubbles:true}));
  }
}

function BackButton(){
  return <button className="pos-back-button" type="button" onClick={goBack}>
    <ArrowLeft size={17}/><span>Back to Categories</span>
  </button>;
}

export default function PosBackButtonWidget(){
  useEffect(()=>{
    let root:Root|null=null;
    let host:HTMLDivElement|null=null;

    const sync=()=>{
      const breadcrumb=document.querySelector('.pos-breadcrumb');
      if(!breadcrumb){
        root?.unmount();root=null;
        host?.remove();host=null;
        return;
      }
      if(host&&document.body.contains(host))return;
      host=document.createElement('div');
      host.className='pos-back-host';
      breadcrumb.prepend(host);
      root=createRoot(host);
      root.render(<BackButton/>);
    };

    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true});
    return()=>{observer.disconnect();root?.unmount();host?.remove();};
  },[]);
  return null;
}
