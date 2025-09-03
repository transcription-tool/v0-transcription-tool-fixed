
import { type NextRequest, NextResponse } from "next/server";
import { makeSlides } from "@/lib/exporters/pptx";

export async function POST(request: NextRequest) {
  const { transcript, analysis } = await request.json();
  if (!analysis) return NextResponse.json({ error: "No analysis" }, { status: 400 });
  const buf = await makeSlides(transcript || "", { title: "Lecture Deck", bullets: analysis.bullets || [], qa: analysis.qa || [] });
  return new NextResponse(Buffer.from(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="slides.pptx"`
    }
  });
}
