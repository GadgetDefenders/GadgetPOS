import { useEffect, useMemo, useState } from 'react';
import { Download, HardDriveDownload, Upload, X } from 'lucide-react';

type BackupFile={
  app:'GadgetPOS';
  version:1;
  createdAt:string;
  data:Record<string,string>;
};

const PREFIX='gadgetpos_';

function collectData(){
  const data:Record<string,string>={};
  for(let index=0;index<localStorage.length;index++){
    const key=localStorage.key(index);
    if(key?.startsWith(PREFIX))data[key]=localStorage.getItem(key)??'';
  }
  return data;
}

function downloadBackup(){
  const backup:BackupFile={app:'GadgetPOS',version:1,createdAt:new Date().toISOString(),data:collectData()};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download=`gadgetpos-backup-${new Date().toISOString().slice(0,10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function BackupRestoreWidget(){
  const [open,setOpen]=useState(false);
  const [pending,setPending]=useState<BackupFile|null>(null);
  const [fileName,setFileName]=useState('');

  useEffect(()=>{
    const nav=document.querySelector('.sidebar nav');
    if(!nav||document.getElementById('gadgetpos-backup-nav'))return;
    const button=document.createElement('button');
    button.id='gadgetpos-backup-nav';
    button.type='button';
    button.innerHTML='<span>💾</span><span>Backup</span>';
    button.onclick=()=>setOpen(true);
    nav.appendChild(button);
    return()=>button.remove();
  },[]);

  const counts=useMemo(()=>{
    if(!pending)return{groups:0,records:0};
    let records=0;
    Object.values(pending.data).forEach(value=>{
      try{const parsed=JSON.parse(value);if(Array.isArray(parsed))records+=parsed.length;}catch{/* settings value */}
    });
    return{groups:Object.keys(pending.data).length,records};
  },[pending]);

  function chooseFile(file?:File){
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const parsed=JSON.parse(String(reader.result)) as BackupFile;
        if(parsed.app!=='GadgetPOS'||parsed.version!==1||!parsed.data||typeof parsed.data!=='object')throw new Error('Invalid file');
        setPending(parsed);setFileName(file.name);
      }catch{
        alert('That is not a valid GadgetPOS backup file.');
      }
    };
    reader.readAsText(file);
  }

  function restore(){
    if(!pending)return;
    Object.entries(pending.data).forEach(([key,value])=>{if(key.startsWith(PREFIX))localStorage.setItem(key,value)});
    localStorage.setItem('gadgetpos_last_restore_v1',new Date().toISOString());
    window.dispatchEvent(new Event('gadgetpos-data-changed'));
    setPending(null);setFileName('');setOpen(false);
    alert('GadgetPOS backup restored. The app will reload now.');
    window.location.reload();
  }

  return <>{open&&<div className="backup-overlay"><div className="backup-modal"><header><div><h2>Backup & Restore</h2><p>Keep one downloadable copy of your GadgetPOS data.</p></div><button onClick={()=>{setOpen(false);setPending(null);setFileName('')}}><X/></button></header><div className="backup-cards"><section><HardDriveDownload/><div><h3>Download Backup</h3><p>Saves customers, devices, repairs, inventory, sales, warranties, timelines, settings, and saved views.</p><button className="primary" onClick={downloadBackup}><Download size={17}/>Download Backup File</button></div></section><section><Upload/><div><h3>Restore Backup</h3><p>Select a GadgetPOS backup. Nothing changes until you confirm the restore.</p><label className="backup-file-button"><Upload size={17}/>Choose Backup File<input type="file" accept="application/json,.json" onChange={event=>chooseFile(event.target.files?.[0])}/></label></div></section></div>{pending&&<div className="backup-preview"><strong>{fileName}</strong><span>Created {new Date(pending.createdAt).toLocaleString()}</span><span>{counts.groups} data groups · about {counts.records} records</span><div><button onClick={()=>{setPending(null);setFileName('')}}>Cancel</button><button className="danger" onClick={restore}>Replace Current Data & Restore</button></div></div>}<p className="backup-note">Restoring replaces matching GadgetPOS data on this device. Download a fresh backup first when you want to preserve the current version.</p></div></div>}</>;
}
