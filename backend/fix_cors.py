import boto3

# We use your verified keys to talk directly to Backblaze
s3 = boto3.client(
    's3',
    endpoint_url='https://s3.eu-central-003.backblazeb2.com',
    aws_access_key_id='003b198628f83040000000001',
    aws_secret_access_key='K003KyHRdCXHXJpa2mAceqyQ4krDdlk'
)

# This rule tells Backblaze: "Trust the Vercel website and my local computer"
cors_configuration = {
    'CORSRules': [{
        'AllowedHeaders': ['*'],
        'AllowedMethods': ['PUT', 'POST', 'GET', 'HEAD'],
        'AllowedOrigins': ['*'], # Unlocks for everyone
        'ExposeHeaders': ['ETag'],
        'MaxAgeSeconds': 3600
    }]
}

try:
    print("🔓 Unlocking Backblaze B2 Vault...")
    s3.put_bucket_cors(Bucket='pro-sports-ai-storage', CORSConfiguration=cors_configuration)
    print("✅ SUCCESS: Cloud Vault is now open for your website!")
except Exception as e:
    print(f"❌ ERROR: {e}")