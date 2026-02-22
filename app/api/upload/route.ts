"use client";

import React, { useState } from 'react';
import { Upload, Zap, Loader2, Download, Sparkles, AlertCircle } from 'lucide-react';

export default function SportsPortal() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElement.src);
      if (videoElement.duration > 62) {
        setError("Ritual restricted to 60 seconds.");
        return;
      }
      executeRitual(file);
    };
    videoElement.src = URL.createObjectURL(file);
  };

  const executeRitual = async (file: File) => {
    setIsProcessing(true);
    setDownloadUrl(null);
    setError(null);
    setProgress(5);

    try {
      // --- 1. GENERATE FILENAME FIRST (Fixes the Vercel Error) ---
      const cleanName = file.name.replace(/\s+/g, '-').toLowerCase();
      const fileName = `${Date.now()}-${cleanName}`; 

      // 2. Get the "Permission Ticket"
      const ticketResponse = await fetch("/api/upload", {
        method: "POST",
        body: JSON.stringify({ fileName, contentType: file.type }),
      });
      
      if (!ticketResponse.ok) throw new Error("Ticket refused.");
      const { url } = await ticketResponse.json();

      // 3. Direct Upload to Backblaze (No extra headers to avoid CORS block)
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Vault refused the offering.");
      console.log("✅ Uploaded to B2:", fileName);
      setProgress(20);

      // 4. Trigger Modal GPU
      const modalRes = await fetch(process.env.NEXT_PUBLIC_MODAL_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: fileName }),
      });
      
      if (!modalRes.ok) throw new Error("GPU server busy.");
      const modalData = await modalRes.json();
      const targetFile = modalData.filename; 

      // 5. Polling for the Masterpiece
      const checkInterval = setInterval(async () => {
        try {
          const finalUrl = `https://${process.env.NEXT_PUBLIC_B2_BUCKET_NAME}.${process.env.NEXT_PUBLIC_B2_ENDPOINT}/${targetFile}`;
          const check = await fetch(finalUrl, { method: 'HEAD' });
          
          if (check.ok) {
            clearInterval(checkInterval);
            setProgress(100);
            setDownloadUrl(finalUrl);
            setIsProcessing(false);
          } else {
            setProgress((prev) => (prev < 99 ? prev + 0.2 : prev));
          }
        } catch (e) { /* polling */ }
      }, 10000);

    } catch (err: any) {
      console.error(err);
      setError("The cloud ritual was interrupted.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full space-y-12 text-center">
        
        <div className="space-y-2 group">
          <h1 className="text-6xl font-black tracking-tighter italic text-white transition-all group-hover:drop-shadow-[0_0_20px_rgba(56,189,248,0.4)]">
            LED<span className="text-sky-500">.CLOUD</span>
          </h1>
          <p className="text-[9px] text-sky-400 font-bold uppercase tracking-[0.5em] opacity-70">
            Lumuos • Enhanced • Dynamics
          </p>
        </div>

        {!isProcessing && !downloadUrl && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-700">
            <label className="border-[1px] border-slate-800 rounded-full p-16 flex flex-col items-center cursor-pointer hover:border-sky-500/50 hover:bg-sky-500/5 transition-all duration-500 bg-slate-900/10 shadow-2xl">
              <input type="file" className="hidden" onChange={handleUpload} accept="video/*" />
              <Zap className="text-sky-500 mb-4 animate-pulse" size={32} />
              <span className="font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400">Capture the Light</span>
            </label>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">{error || "Max 60 Seconds • 4K 60FPS Output"}</p>
          </div>
        )}

        {isProcessing && (
          <div className="p-12 space-y-8">
            <div className="relative flex items-center justify-center">
              <Loader2 className="animate-spin text-sky-500 absolute" size={64} />
              <div className="w-16 h-16 rounded-full border-t-2 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.4)]"></div>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-black tracking-[0.3em] uppercase text-sky-300">Manifesting Dynamics...</p>
              <p className="text-[24px] font-black italic text-white">{Math.round(progress)}%</p>
            </div>
          </div>
        )}

        {downloadUrl && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center">
               <div className="bg-sky-500/10 p-4 rounded-full border border-sky-500/20 shadow-lg">
                  <Sparkles className="text-sky-400" size={32} />
               </div>
            </div>
            <a href={downloadUrl} target="_blank" className="flex items-center justify-center gap-3 bg-white text-black py-5 px-8 rounded-full font-black text-sm tracking-widest hover:bg-sky-400 hover:text-white transition-all shadow-xl active:scale-95">
              SUMMON MASTERPIECE
            </a>
            <button onClick={() => setDownloadUrl(null)} className="text-slate-500 text-[10px] uppercase tracking-widest hover:text-white transition-colors block mx-auto underline">New Ritual</button>
          </div>
        )}
      </div>
    </div>
  );
}