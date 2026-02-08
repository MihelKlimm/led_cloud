import os
import subprocess
import time
import shutil
import asyncio
from pathlib import Path
from static_ffmpeg import add_paths

add_paths()

# --- 1. PATH SETUP ---
BASE_DIR = Path(r"C:\Users\mihel\sports-ai-editor\backend")
UPLOAD_DIR = BASE_DIR / "temp_uploads"

# Clean start: Wipe old temp files
if UPLOAD_DIR.exists():
    try: shutil.rmtree(UPLOAD_DIR)
    except: pass
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

try:
    from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.staticfiles import StaticFiles
except ImportError:
    print("❌ Run: pip install fastapi uvicorn python-multipart static-ffmpeg")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dictionary to track if the AI is done
active_tasks = {}

# --- 2. THE AI PIPELINE (FFMPEG HYBRID) ---
def run_ai_pipeline(task_id, input_p, final_p):
    # Atomic Write: Process to a hidden file first
    processing_p = str(final_p).replace(".mp4", "_processing.mp4")
    active_tasks[task_id] = "processing"
    
    try:
        print(f"\n🚀 [ID:{task_id}] STARTING NEURAL RENDER...")
        
        # This chain hits all 3 goals:
        # 1. bwdif: De-interlaces sports footage
        # 2. scale/crop: Forces 1080x1920 (Vertical HD)
        # 3. eq/unsharp: Flamboyant colors and puck sharpness
        # 4. minterpolate: High-quality 60fps Motion Synthesis
        filter_chain = (
            "bwdif=0:-1:1,"
            "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
            "eq=brightness=0.06:contrast=1.5:saturation=1.7,"
            "unsharp=5:5:1.5,"
            "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir"
        )

        process_cmd = [
            'ffmpeg', '-y', '-i', str(input_p), 
            '-vf', filter_chain,
            '-c:v', 'libx264', '-preset', 'veryfast', 
            '-crf', '18', '-b:v', '18M', '-pix_fmt', 'yuv420p',
            processing_p
        ]

        # Execute and wait for completion
        subprocess.run(process_cmd, check=True)
        
        # ATOMIC SWAP: Rename only when 100% finished
        if os.path.exists(processing_p):
            os.rename(processing_p, final_p)
            active_tasks[task_id] = "complete"
            print(f"✅ MASTERPIECE COMPLETE: {final_p}")

    except Exception as e:
        print(f"❌ CRITICAL ERROR: {e}")
        active_tasks[task_id] = "failed"
        if os.path.exists(processing_p): os.remove(processing_p)

# --- 3. API ENDPOINTS ---

@app.post("/upload-video")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    task_id = int(time.time())
    input_p = UPLOAD_DIR / f"raw_{task_id}.mp4"
    final_filename = f"pro_clip_{task_id}.mp4"
    final_p = UPLOAD_DIR / final_filename

    with open(input_p, "wb") as f:
        f.write(await file.read())

    # IMPORTANT: Return task_id so the frontend knows what to track
    background_tasks.add_task(run_ai_pipeline, task_id, input_p, final_p)
    return {
        "status": "started", 
        "filename": final_filename, 
        "task_id": task_id
    }

@app.get("/check-status/{task_id}/{filename}")
async def check_status(task_id: int, filename: str):
    status = active_tasks.get(task_id, "processing")
    return {"status": status}

app.mount("/outputs", StaticFiles(directory=str(UPLOAD_DIR)), name="outputs")

if __name__ == "__main__":
    import uvicorn
    # Using 127.0.0.1 for maximum Windows stability
    uvicorn.run(app, host="127.0.0.1", port=8001)