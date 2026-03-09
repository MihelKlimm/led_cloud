"use client";

import React, { useState } from 'react';
import { Upload, Download, Loader2, Trophy } from 'lucide-react';

export default function SportsPortal() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'ready'>('idle');
  const [fileId, setFileId] = useState("");
  
  // NEW HIGH-FIDELITY LINK
  const MODAL_URL = "https://mihelklimm--led-cloud-v4-hq-web.modal.run"; 

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
        } catch (e) { console.log("Zamboni in progress..."); }
      }, 10000);
    } catch (err) {
      alert("Handshake failed. Ensure Modal is active.");
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      
      <div className="fixed inset-0 opacity-30 pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50 Q 150 100 250 50' stroke='%23cbd5e1' stroke-width='2' fill='none'/%3E%3Cpath d='M300 300 Q 200 350 100 300' stroke='%23cbd5e1' stroke-width='1' fill='none'/%3E%3Cpath d='M10 200 Q 100 150 380 220' stroke='%23cbd5e1' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")` }}>
      </div>

      <div className="max-w-md w-full space-y-8 text-center z-10">
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tighter italic text-slate-900 uppercase">
            LED<span className="text-blue-600">.CLOUD</span>
          </h1>
          <p className="text-[9px] text-sky-500 font-bold uppercase tracking-[0.4em]">High-Fidelity AI • 4K • 60FPS</p>
        </div>

        {status === 'idle' && (
          <label className="relative cursor-pointer w-full aspect-[1.6/1] bg-white rounded-[100px] border-4 border-slate-200 shadow-2xl flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-all group">
            <input type="file" className="hidden" onChange={handleUpload} accept="video/*" />
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-red-600 -translate-x-1/2"></div>
              <div className="absolute left-[30%] top-0 bottom-0 w-2 bg-blue-600 opacity-50"></div>
              <div className="absolute right-[30%] top-0 bottom-0 w-2 bg-blue-600 opacity-50"></div>
              <div className="absolute left-1/2 top-1/2 w-16 h-16 border-2 border-blue-600 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <Upload className="text-blue-600 mb-2 relative z-10 group-hover:animate-bounce" size={48} />
            <span className="text-sm font-black uppercase tracking-widest text-slate-800 relative z-10">Throw in your clip</span>
            <span className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-tighter relative z-10">Neural Rendering Active (Max 60s)</span>
          </label>
        )}

        {status === 'processing' && (
          <div className="bg-white p-12 rounded-[50px] shadow-xl border-b-8 border-blue-600 space-y-6">
            <Loader2 className="animate-spin text-blue-600 mx-auto" size={56} />
            <div className="space-y-2">
              <p className="text-sm font-black tracking-widest uppercase text-slate-900 animate-pulse">Summoning Masterpiece...</p>
              <p className="text-[10px] text-slate-400 italic italic">NVIDIA A10G Super-Resolution in Progress</p>
              <p className="text-[9px] text-blue-500 font-bold uppercase mt-2">Estimated wait: 5-8 minutes</p>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-6 animate-in zoom-in duration-500">
            <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-400/50">
                <Trophy className="text-white" size={36} />
            </div>
            <div className="space-y-3">
              <a 
                href={`${MODAL_URL}/download?id=${fileId}`} 
                className="w-full bg-slate-900 text-white px-10 py-5 rounded-full font-black tracking-widest hover:bg-blue-600 transition-all inline-block shadow-2xl uppercase text-sm"
              >
                Get the Game Tape
              </a>
              <button onClick={() => setStatus('idle')} className="block mx-auto text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-blue-600 transition-colors">
                Next Shift ➔
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="fixed bottom-8 text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em]">
        Production Grade • NVIDIA A10G • Encrypted Storage
      </footer>
    </div>
  );
}