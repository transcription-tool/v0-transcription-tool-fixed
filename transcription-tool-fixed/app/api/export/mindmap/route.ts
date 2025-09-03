
import { type NextRequest, NextResponse } from "next/server";
import { makeMindmapPng, type MindNode } from "@/lib/mindmap";

export async function POST(request: NextRequest) {
  const { root } = await request.json();
  if (!root) return NextResponse.json({ error: "No mind map root" }, { status: 400 });
  const png = await makeMindmapPng(root as MindNode);
  return new NextResponse(Buffer.from(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="mindmap.png"`
    }
  });
}
