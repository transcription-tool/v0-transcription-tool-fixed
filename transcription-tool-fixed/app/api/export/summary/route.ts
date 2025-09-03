
import { type NextRequest, NextResponse } from "next/server";
import { makeSummaryDocx } from "@/lib/exporters/docx";

export async function POST(request: NextRequest) {
  const { transcript, summary } = await request.json();
  if (!summary) return NextResponse.json({ error: "No summary" }, { status: 400 });
  const buf = await makeSummaryDocx(transcript || "", summary);
  return new NextResponse(Buffer.from(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="summary.docx"`
    }
  });
}
