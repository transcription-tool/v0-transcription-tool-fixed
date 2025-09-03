
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { transcript } = await request.json();
  if (!transcript) return NextResponse.json({ error: "No transcript" }, { status: 400 });
  return new NextResponse(transcript, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="transcript.txt"`
    }
  });
}
