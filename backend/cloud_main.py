import modal
import os

# --- 1. CLOUD ENVIRONMENT SETUP ---
image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg")
    .pip_install("boto3", "fastapi[standard]") 
)

app = modal.App("sports-ai-engine")

# --- 2. THE HIGH-SPEED GPU PIPELINE ---
@app.function(
    image=image,
    gpu="A10G",        # High-end NVIDIA GPU
    timeout=1200,      # Increased to 20 mins just in case, but target is < 5 mins
    secrets=[modal.Secret.from_name("backblaze-keys")]
)
def process_video_cloud(filename: str):
    import boto3
    import subprocess
    
    print(f"🚀 [TURBO MODE] GPU STARTING: {filename}")
    
    try:
        s3 = boto3.client('s3',
            endpoint_url=f"https://{os.environ['B2_ENDPOINT']}",
            aws_access_key_id=os.environ['B2_KEY_ID'],
            aws_secret_access_key=os.environ['B2_APPLICATION_KEY']
        )
        bucket = os.environ['B2_BUCKET_NAME']

        input_path = f"/tmp/{filename}"
        output_filename = f"enhanced_{filename}"
        output_path = f"/tmp/{output_filename}"

        # Download
        s3.download_file(bucket, filename, input_path)
        print("✅ Downloaded. Starting GPU Encode...")

        # --- THE TURBO FILTER ---
        # 1. We use 'scale_npp' or 'scale' (1080p to 4K)
        # 2. 'minterpolate' with 'mi_mode=blend' is 10x faster than 'mci' 
        #    and looks great at 60fps.
        filter_chain = (
            "bwdif=0:-1:1,"
            "scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,"
            "eq=brightness=0.06:contrast=1.6:saturation=1.7,"
            "unsharp=5:5:1.5,"
            "minterpolate=fps=60:mi_mode=blend"
        )

        # We use 'h264_nvenc' which is the NVIDIA hardware encoder.
        # This moves the work from the CPU to the GPU.
        subprocess.run([
            "ffmpeg", "-y", "-i", input_path,
            "-vf", filter_chain,
            "-c:v", "h264_nvenc", # <--- THE TURBO SWITCH
            "-preset", "p4",      # High quality hardware preset
            "-b:v", "25M",        # High bitrate for flamboyant detail
            "-pix_fmt", "yuv420p",
            output_path
        ], check=True)

        print("✅ Render complete. Uploading...")
        s3.upload_file(output_path, bucket, output_filename)
        print("✅ MASTERPIECE UPLOADED.")
        
        return output_filename

    except Exception as e:
        print(f"❌ GPU ERROR: {str(e)}")
        raise e

@app.function(image=image, secrets=[modal.Secret.from_name("backblaze-keys")])
@modal.fastapi_endpoint(method="POST")
async def start_job(item: dict):
    filename = item.get("filename")
    print(f"🔔 WEB TRIGGER: {filename}")
    process_video_cloud.spawn(filename)
    return {"status": "started", "filename": f"enhanced_{filename}"}