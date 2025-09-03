
import pptxgen from "pptxgenjs";
import { containsArabic, transliterateArabic } from "../arabic";

export async function makeSlides(transcript: string, outline: { title: string; bullets: string[]; qa: {q:string;a:string}[] }): Promise<Uint8Array> {
  const pres = new pptxgen();
  pres.layout = "16x9";

  // Title slide
  let slide = pres.addSlide();
  slide.addText(outline.title || "Lecture Deck", { x:0.5, y:1.5, w:9, fontSize:36, bold:true });

  // Bullet slides
  for (let i=0;i<outline.bullets.length;i+=5) {
    const chunk = outline.bullets.slice(i, i+5);
    slide = pres.addSlide();
    slide.addText("Key Points", { x:0.5, y:0.4, fontSize:24, bold:true });
    slide.addText(chunk.map(b => "• "+b).join("\n"), { x:0.7, y:1.1, w:9, fontSize:18 });
  }

  // Q&A
  slide = pres.addSlide();
  slide.addText("Q & A", { x:0.5, y:0.4, fontSize:24, bold:true });
  let y = 1.1;
  for (const qa of outline.qa) {
    const lines = [ "Q: " + qa.q, "A: " + qa.a ];
    slide.addText(lines.join("\n"), { x:0.7, y, w:9, fontSize:18 });
    y += 1.2;
    if (y > 6.5) { slide = pres.addSlide(); y = 1.1; }
  }

  // Export
  const arr = await pres.write("arraybuffer");
  return new Uint8Array(arr as ArrayBuffer);
}
