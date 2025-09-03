// app/api/upload/route.ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            "audio/mpeg",
            "audio/mp3",
            "audio/wav",
            "audio/mp4",
            "audio/x-m4a",
            "audio/aac",
            "audio/webm",
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Blob upload completed:", blob.url);
      },
    });

    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
