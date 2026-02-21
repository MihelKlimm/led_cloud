import boto3

# Connect directly to your Backblaze S3 API
s3 = boto3.client(
    's3',
    endpoint_url='https://s3.eu-central-003.backblazeb2.com',
    aws_access_key_id='003b198628f83040000000001',
    aws_secret_access_key='K003KyHRdCXHXJpa2mAceqyQ4krDdlk'
)

# The ultimate "Allow All" rule for browsers
cors_configuration = {
    'CORSRules': [{
        'AllowedHeaders': ['*'],
        'AllowedMethods': ['PUT', 'POST', 'GET', 'HEAD'],
        'AllowedOrigins': ['*'],
        'ExposeHeaders': ['ETag']
    }]
}

print("Unlocking Backblaze S3 CORS...")
s3.put_bucket_cors(Bucket='pro-sports-ai-storage', CORSConfiguration=cors_configuration)
print("✅ SUCCESS: Backblaze S3 CORS is now permanently unlocked for Vercel!")