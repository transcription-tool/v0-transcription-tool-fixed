
import { type NextRequest, NextResponse } from "next/server";
import { makeAnalysisDocx } from "@/lib/exporters/docx";

export async function POST(request: NextRequest) {
  const { transcript, analysis } = await request.json();
  if (!analysis) return NextResponse.json({ error: "No analysis" }, { status: 400 });
  const buf = await makeAnalysisDocx(transcript || "", { bullets: analysis.bullets || [], quotes: analysis.quotes || [] });
  return new NextResponse(Buffer.from(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="analysis.docx"`
    }
  });
}
