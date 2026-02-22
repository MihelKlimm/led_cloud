import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { fileName, contentType } = await request.json();

    const client = new S3Client({
      region: "eu-central-003",
      endpoint: `https://${process.env.B2_ENDPOINT}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID!.trim(),
        secretAccessKey: process.env.B2_APPLICATION_KEY!.trim(),
      },
    });

    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: fileName,
      ContentType: contentType,
    });

    // Clean version: Just the basic options that TypeScript definitely knows
    const url = await getSignedUrl(client, command, { 
      expiresIn: 3600 
    });
    
    return NextResponse.json({ url, fileName });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to generate ticket" }, { status: 500 });
  }
}