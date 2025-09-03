
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { containsArabic, transliterateArabic } from "../arabic";

export async function makeSummaryDocx(transcript: string, summary: string): Promise<Uint8Array> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Lecture Summary", heading: HeadingLevel.TITLE }),
        new Paragraph({ text: "" }),
        ...summary.split("\n").map(line => new Paragraph({ text: line }))
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}

export async function makeAnalysisDocx(transcript: string, analysis: { bullets: string[]; quotes: string[] }): Promise<Uint8Array> {
  const children: Paragraph[] = [
    new Paragraph({ text: "Detailed Analysis", heading: HeadingLevel.TITLE }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "Key Points", heading: HeadingLevel.HEADING_2 }),
  ];
  for (const b of analysis.bullets) children.push(new Paragraph({ text: "• " + b }));
  children.push(new Paragraph({ text: "" }));
  children.push(new Paragraph({ text: "Selected Quotes", heading: HeadingLevel.HEADING_2 }));
  for (const q of analysis.quotes) {
    const translit = containsArabic(q) ? transliterateArabic(q) : "";
    children.push(new Paragraph({ text: q }));
    if (translit) children.push(new Paragraph({ text: translit, italics: true }));
    children.push(new Paragraph({ text: "" }));
  }
  const doc = new Document({ sections: [{ properties: {}, children }] });
  return await Packer.toBuffer(doc);
}
