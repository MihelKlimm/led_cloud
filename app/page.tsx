"use client";
import React, { useState } from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';

export default function SportsPortal() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setDownloadUrl(null);

    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

      // 1. Upload to B2 via your existing API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", fileName);
      await fetch("/api/upload", { method: "POST", body: formData });

      // 2. Trigger Cloud Brain
      await fetch(process.env.NEXT_PUBLIC_MODAL_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: fileName }),
      });

      // 3. Polling for the 4K 60FPS file
      const checkInterval = setInterval(async () => {
        const finalUrl = `https://${process.env.NEXT_PUBLIC_B2_BUCKET_NAME}.${process.env.NEXT_PUBLIC_B2_ENDPOINT}/enhanced_${fileName}`;
        const check = await fetch(finalUrl, { method: 'HEAD' });
        
        if (check.ok) {
          clearInterval(checkInterval);
          setDownloadUrl(finalUrl);
          setIsProcessing(false);
        }
      }, 10000);

    } catch (err) {
      alert("Error starting process.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-4xl font-black tracking-tighter italic">PRO-SPORTS <span className="text-blue-500">AI</span></h1>
        <p className="text-slate-400 text-sm">Convert to 4K 60FPS Flamboyant HD</p>

        {!isProcessing && !downloadUrl && (
          <label className="border-2 border-dashed border-slate-800 rounded-3xl p-12 flex flex-col items-center cursor-pointer hover:border-blue-500 transition-all bg-slate-900/20">
            <input type="file" className="hidden" onChange={handleUpload} accept="video/*" />
            <Upload className="text-blue-500 mb-4" size={48} />
            <span className="font-bold uppercase tracking-widest text-xs">Drop Video (Max 60s)</span>
          </label>
        )}

        {isProcessing && (
          <div className="p-12 bg-slate-900/50 rounded-3xl space-y-4">
            <Loader2 className="animate-spin text-blue-500 mx-auto" size={48} />
            <p className="text-sm font-bold animate-pulse">NEURAL RENDERING IN CLOUD...</p>
            <p className="text-[10px] text-slate-500 uppercase">Estimated time: 2-4 minutes</p>
          </div>
        )}

        {downloadUrl && (
          <div className="space-y-4">
            <a href={downloadUrl} className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20">
              <Download size={24} /> DOWNLOAD 4K MASTERPIECE
            </a>
            <button onClick={() => setDownloadUrl(null)} className="text-slate-500 text-xs underline">Upload another</button>
          </div>
        )}

        <footer className="pt-12 text-[10px] text-slate-600 uppercase tracking-widest">
          Support: your-email@example.com | NVIDIA A10G Powered
        </footer>
      </div>
    </div>
  );
}