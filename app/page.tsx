"use client";

import React, { useState } from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';

export default function SportsPortal() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'ready'>('idle');
  const [fileId, setFileId] = useState("");
  
  // Update this to match the link you saw in your terminal!
  const MODAL_BASE = "https://mihelklimm--led-cloud-engine"; 

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('processing');

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload directly to Modal
      const res = await fetch(`${MODAL_BASE}-upload.modal.run`, { 
        method: "POST", 
        body: formData 
      });
      const data = await res.json();
      setFileId(data.id);

      // 2. Poll Modal for result every 10 seconds
      const interval = setInterval(async () => {
        try {
          const checkRes = await fetch(`${MODAL_BASE}-check-status.modal.run?id=${data.id}`);
          const state = await checkRes.json();
          
          if (state.status === 'complete') {
            clearInterval(interval);
            setStatus('ready');
          }
        } catch (e) {
          console.log("Waiting for GPU...");
        }
      }, 10000);

    } catch (err) {
      alert("Handshake failed. Check your Modal dashboard.");
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full space-y-12 text-center">
        <div className="space-y-2 group">
          <h1 className="text-6xl font-black tracking-tighter italic text-white">
            LED<span className="text-sky-500">.CLOUD</span>
          </h1>
          <p className="text-[9px] text-sky-400 font-bold uppercase tracking-[0.5em] opacity-70">
            Lumuos • Enhanced • Dynamics
          </p>
        </div>

        {status === 'idle' && (
          <label className="cursor-pointer border border-slate-800 p-20 rounded-full hover:border-sky-500 transition-all bg-slate-900/10 flex flex-col items-center">
            <input type="file" className="hidden" onChange={handleUpload} accept="video/*" />
            <Upload className="text-sky-500 mb-4" size={40} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Summon the Light</span>
          </label>
        )}

        {status === 'processing' && (
          <div className="space-y-6">
            <Loader2 className="animate-spin text-sky-500 mx-auto" size={48} />
            <div className="space-y-2">
              <p className="text-xs font-black tracking-[0.3em] uppercase text-sky-300 animate-pulse">Manifesting Dynamics...</p>
              <p className="text-[9px] text-slate-500 italic italic">NVIDIA A10G Rendering Active</p>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-6">
            <a 
              href={`${MODAL_BASE}-download.modal.run?id=${fileId}`} 
              className="bg-white text-black px-12 py-5 rounded-full font-black tracking-widest hover:bg-sky-400 hover:text-white transition-all inline-block shadow-2xl"
            >
              DOWNLOAD MASTERPIECE
            </a>
            <button onClick={() => setStatus('idle')} className="block mx-auto text-[10px] text-slate-600 underline uppercase tracking-widest">New Ritual</button>
          </div>
        )}
      </div>
    </div>
  );
}