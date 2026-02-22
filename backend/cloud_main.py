import modal
import os, shutil, subprocess, time
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

# 1. Initialize the Cloud App and Storage
app = modal.App("led-cloud-engine")
volume = modal.Volume.from_name("led-cloud-storage")

# Define the environment (Linux + FFmpeg + FastAPI)
image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg")
    .pip_install("fastapi[standard]", "python-multipart")
)

# 2. THE GPU PROCESSING FUNCTION
@app.function(image=image, gpu="A10G", timeout=600, volumes={"/data": volume})
def process_video_on_gpu(filename: str):
    input_path = f"/data/raw_{filename}"
    output_path = f"/data/final_{filename}"

    # Lumuos Enhanced Dynamics Filter Chain
    filter_chain = (
        "bwdif=0:-1:1,"
        "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
        "eq=brightness=0.06:contrast=1.6:saturation=1.7,"
        "unsharp=5:5:1.5,"
        "minterpolate=fps=60:mi_mode=blend"
    )

    print(f"🤖 Starting Neural Render for {filename}...")
    subprocess.run([
        "ffmpeg", "-y", "-i", input_path,
        "-vf", filter_chain,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-b:v", "15M", "-pix_fmt", "yuv420p",
        output_path
    ], check=True)
    
    volume.commit() # Save result to persistent storage
    print(f"✅ Masterpiece created: {output_path}")

# 3. THE WEB ENDPOINTS (The Bridge)
@app.function(image=image, volumes={"/data": volume})
@modal.fastapi_endpoint(method="POST")
async def upload(file: UploadFile = File(...)):
    # Generate unique ID for this session
    file_id = f"{int(time.time())}"
    filename = f"{file_id}.mp4"
    file_path = f"/data/raw_{filename}"
    
    # Save the file directly to Modal Volume
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    volume.commit()

    # Trigger the GPU function in the background
    process_video_on_gpu.spawn(filename)
    
    return {"status": "started", "id": filename}

@app.function(image=image, volumes={"/data": volume})
@modal.fastapi_endpoint(method="GET")
async def check_status(id: str):
    # Check if the 'final_' version exists on the volume
    final_path = f"/data/final_{id}"
    if os.path.exists(final_path):
        return {"status": "complete"}
    return {"status": "processing"}

@app.function(image=image, volumes={"/data": volume})
@modal.fastapi_endpoint(method="GET")
async def download(id: str):
    # Serve the finished file
    return FileResponse(path=f"/data/final_{id}", filename="masterpiece.mp4")