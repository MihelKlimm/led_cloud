import modal
import os, shutil, subprocess, time

# 1. SETUP CLOUD ENVIRONMENT
app = modal.App("led-cloud-v3")
volume = modal.Volume.from_name("led-cloud-storage")

image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg")
    .pip_install("fastapi[standard]", "python-multipart")
)

# 2. THE GPU ENGINE (NVIDIA A10G)
@app.function(image=image, gpu="A10G", timeout=600, volumes={"/data": volume})
def process_video_on_gpu(filename: str):
    input_path = f"/data/raw_{filename}"
    output_path = f"/data/final_{filename}"

    # Lumuos Enhanced Dynamics Filter (60FPS + 4K Scale + Pop)
    # Using NVENC for high-speed hardware acceleration
    filter_chain = (
        "bwdif=0:-1:1,"
        "scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,"
        "eq=brightness=0.06:contrast=1.6:saturation=1.7,"
        "unsharp=5:5:1.5,"
        "minterpolate=fps=60:mi_mode=blend"
    )

    print(f"🤖 Processing {filename}...")
    subprocess.run([
        "ffmpeg", "-y", "-i", input_path,
        "-vf", filter_chain,
        "-c:v", "h264_nvenc", "-preset", "p4", "-crf", "18", "-b:v", "20M",
        output_path
    ], check=True)
    
    volume.commit() # Save to persistent drive
    print(f"✅ Masterpiece Complete: {output_path}")

# 3. THE WEB INTERFACE (The Single Gateway)
@app.function(image=image, volumes={"/data": volume})
@modal.asgi_app()
def web():
    from fastapi import FastAPI, UploadFile, File
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse

    web_app = FastAPI()

    # Allow your Vercel site to talk to this cloud brain
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @web_app.post("/upload")
    async def upload(file: UploadFile = File(...)):
        file_id = f"{int(time.time())}"
        filename = f"{file_id}.mp4"
        file_path = f"/data/raw_{filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        volume.commit()

        process_video_on_gpu.spawn(filename)
        return {"id": filename}

    @web_app.get("/status")
    async def status(id: str):
        volume.reload() # Refresh drive to see new files
        if os.path.exists(f"/data/final_{id}"):
            return {"status": "complete"}
        return {"status": "processing"}

    @web_app.get("/download")
    async def download(id: str):
        volume.reload()
        return FileResponse(path=f"/data/final_{id}", filename="masterpiece.mp4")

    return web_app