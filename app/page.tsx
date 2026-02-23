"use client";

import React, { useState } from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';

export default function SportsPortal() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'ready'>('idle');
  const [fileId, setFileId] = useState("");
  
  // REPLACE THIS with your Modal URL
  const MODAL_URL = "https://mihelklimm--led-cloud-engine-web.modal.run";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('processing');

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${MODAL_URL}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      setFileId(data.id);

      const interval = setInterval(async () => {
        try {
          const checkRes = await fetch(`${MODAL_URL}/status?id=${data.id}`);
          const state = await checkRes.json();
          if (state.status === 'complete') {
            clearInterval(interval);
            setStatus('ready');
          }
        } catch (e) { console.log("Waiting..."); }
      }, 10000);
    } catch (err) {
      alert("Cloud connection failed.");
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full space-y-12 text-center">
        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tighter italic text-white">LED<span className="text-sky-500">.CLOUD</span></h1>
          <p className="text-[9px] text-sky-400 font-bold uppercase tracking-[0.5em] opacity-70">Lumuos • Enhanced • Dynamics</p>
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
            <p className="text-xs font-black tracking-[0.3em] uppercase text-sky-300 animate-pulse">Manifesting Dynamics...</p>
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <a href={`${MODAL_URL}/download?id=${fileId}`} className="bg-white text-black px-12 py-5 rounded-full font-black tracking-widest hover:bg-sky-400 hover:text-white transition-all inline-block shadow-2xl">DOWNLOAD MASTERPIECE</a>
            <button onClick={() => setStatus('idle')} className="block mx-auto text-[10px] text-slate-600 underline uppercase tracking-widest">New Ritual</button>
          </div>
        )}
      </div>
      <footer className="fixed bottom-8 text-[9px] text-slate-800 uppercase tracking-[0.3em]">NVIDIA A10G • Encrypted Storage</footer>
    </div>
  );
}