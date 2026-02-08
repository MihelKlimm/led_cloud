import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    // Clean the keys (remove spaces/newlines)
    const accessKeyId = process.env.B2_KEY_ID?.trim();
    const secretAccessKey = process.env.B2_APPLICATION_KEY?.trim();
    const endpoint = process.env.B2_ENDPOINT?.trim();

    const client = new S3Client({
      region: "eu-central-003", 
      endpoint: `https://${endpoint}`,
      forcePathStyle: true, 
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await client.send(command);
    
    console.log("✅ Cloud Upload Successful:", fileName);
    return NextResponse.json({ success: true, filename: fileName });

  } catch (error: any) {
    // This will print the specific error to your VS Code terminal
    console.error("❌ SERVER UPLOAD ERROR:", error.name, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}