"use client";

import React, { useState } from 'react';
import { Upload, Zap, Loader2, Download, Sparkles } from 'lucide-react';

export default function SportsPortal() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: 1 minute limit
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
      // 1. Get the ticket
      const ticketResponse = await fetch("/api/upload", {
        method: "POST",
        body: JSON.stringify({ fileName, contentType: file.type }),
      });
      const { url } = await ticketResponse.json();

      // 2. The Simple Upload (This bypasses the Checksum/CORS block)
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file, // Send the raw file
        // IMPORTANT: We do NOT set any headers here. 
        // The signed URL already knows the content-type.
      });

      if (!uploadRes.ok) throw new Error("Vault refused the offering.");
      setProgress(20);

      // 3. Trigger the Modal GPU
      const modalRes = await fetch(process.env.NEXT_PUBLIC_MODAL_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: fileName }),
      });
      const modalData = await modalRes.json();
      const targetFile = modalData.filename;

      // 4. Polling (Remains the same)
      const checkInterval = setInterval(async () => {
        const finalUrl = `https://${process.env.NEXT_PUBLIC_B2_BUCKET_NAME}.${process.env.NEXT_PUBLIC_B2_ENDPOINT}/${targetFile}`;
        const check = await fetch(finalUrl, { method: 'HEAD' });
        if (check.ok) {
          clearInterval(checkInterval);
          setProgress(100);
          setDownloadUrl(finalUrl);
          setIsProcessing(false);
        } else {
          setProgress((prev) => (prev < 99 ? prev + 0.3 : prev));
        }
      }, 10000);

    } catch (err) {
      setError("The cloud offering was too large or refused.");
      setIsProcessing(false);
    }
  };
      
  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col items-center justify-center p-6 font-sans selection:bg-sky-500/30">
      <div className="max-w-md w-full space-y-12 text-center">
        
        {/* THE BRANDING */}
        <div className="space-y-2 group">
          <h1 className="text-6xl font-black tracking-tighter italic text-white transition-all group-hover:drop-shadow-[0_0_20px_rgba(56,189,248,0.4)]">
            LED<span className="text-sky-500">.CLOUD</span>
          </h1>
          <p className="text-[9px] text-sky-400 font-bold uppercase tracking-[0.5em] opacity-70">
            Lumuos • Enhanced • Dynamics
          </p>
        </div>

        {/* UPLOAD STATE */}
        {!isProcessing && !downloadUrl && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-700">
            <label className="border-[1px] border-slate-800 rounded-full p-16 flex flex-col items-center cursor-pointer hover:border-sky-500/50 hover:bg-sky-500/5 transition-all duration-500 bg-slate-900/10 shadow-2xl">
              <input type="file" className="hidden" onChange={handleUpload} accept="video/*" />
              <Zap className="text-sky-500 mb-4 animate-pulse" size={32} />
              <span className="font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400">Capture the Light</span>
            </label>
            {error ? (
               <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest animate-shake">{error}</p>
            ) : (
               <p className="text-[10px] text-slate-600 uppercase tracking-widest">Max 60 Seconds • 4K 60FPS Output</p>
            )}
          </div>
        )}

        {/* PROCESSING STATE */}
        {isProcessing && (
          <div className="p-12 space-y-8">
            <div className="relative flex items-center justify-center">
              <Loader2 className="animate-spin text-sky-500 absolute" size={64} />
              <div className="w-16 h-16 rounded-full border-t-2 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.4)]"></div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                 <p className="text-xs font-black tracking-[0.3em] uppercase text-sky-300">Manifesting Dynamics...</p>
                 <p className="text-[24px] font-black italic text-white">{Math.round(progress)}%</p>
              </div>
              <p className="text-[9px] text-slate-500 italic max-w-[200px] mx-auto">
                "The puck glides where the light commands."
              </p>
            </div>
          </div>
        )}

        {/* COMPLETE STATE */}
        {downloadUrl && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center">
               <div className="bg-sky-500/10 p-4 rounded-full border border-sky-500/20">
                  <Sparkles className="text-sky-400" size={32} />
               </div>
            </div>
            <div className="space-y-4">
              <a 
                href={downloadUrl} 
                target="_blank"
                className="flex items-center justify-center gap-3 bg-white text-black py-5 px-8 rounded-full font-black text-sm tracking-widest hover:bg-sky-400 hover:text-white transition-all shadow-xl shadow-sky-500/20 active:scale-95"
              >
                SUMMON THE MASTERPIECE
              </a>
              <button 
                onClick={() => { setDownloadUrl(null); setProgress(0); }} 
                className="text-slate-500 text-[10px] uppercase tracking-widest hover:text-white transition-colors block mx-auto underline underline-offset-4"
              >
                Begin New Ritual
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="fixed bottom-8 text-[9px] text-slate-700 uppercase tracking-[0.3em] font-medium">
        Powered by NVIDIA A10G • B2 Private Vault
      </footer>
    </div>
  );
}