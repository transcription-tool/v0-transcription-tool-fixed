
import { type NextRequest, NextResponse } from "next/server";
import { writeFile, mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeFixedChunks, cleanupChunks } from "@/lib/chunking";
import { transcribeFile, type ASRConfig } from "@/lib/asr";
import { containsArabic, transliterateArabic } from "@/lib/arabic";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

export const maxDuration = 60; // allow longer time on vercel background func if used

function env<T = string>(key: string, fallback?: T): T {
  const v = process.env[key];
  return (v as any) ?? (fallback as any);
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const audio = form.get("audio") as File | null;
    const glossary = (form.get("glossary") as string) || "";

    if (!audio) return NextResponse.json({ error: "No audio file" }, { status: 400 });

    // Save upload to tmp
    const dir = await mkdtemp(join(tmpdir(), "upload-"));
    const filePath = join(dir, audio.name.replaceAll(/[^a-zA-Z0-9._-]/g, "_"));
    const buf = Buffer.from(await audio.arrayBuffer());
    await writeFile(filePath, buf);

    // Chunk
    const chunks = await makeFixedChunks(filePath, 600, 2);

    // Transcribe each chunk
    const provider = (env("ASR_PROVIDER","groq") as "groq"|"openai");
    const cfg: ASRConfig = {
      provider,
      apiKey: provider === "groq" ? env("GROQ_API_KEY","") : env("OPENAI_API_KEY",""),
      model: provider === "groq" ? env("GROQ_ASR_MODEL","whisper-large-v3") : env("OPENAI_ASR_MODEL","whisper-1"),
      language: "en"
    };

    if (!cfg.apiKey) {
      await cleanupChunks(chunks);
      await rm(dir, { recursive:true, force:true });
      return NextResponse.json({ error: `${provider.toUpperCase()} API key missing`}, { status: 400 });
    }

    const parts: { text: string; start: number; end: number }[] = [];
    for (const c of chunks) {
      const text = await transcribeFile(c.path, cfg);
      parts.push({ text, start: c.start, end: c.end });
    }

    // Stitch with basic overlap handling
    let transcript = parts.map(p => p.text.trim()).join("\n").replace(/\n{2,}/g, "\n");

    // Inject transliteration lines directly under Arabic lines
    const lines = transcript.split(/\r?\n/);
    const withTranslit: string[] = [];
    for (const line of lines) {
      withTranslit.push(line);
      if (containsArabic(line)) {
        withTranslit.push("(" + transliterateArabic(line) + ")");
      }
    }
    transcript = withTranslit.join("\n");

    // Run analysis & outline with LLM (Groq llama 3.3 70B by default)
    const system = `You analyze a lecture transcript (mostly English with some Arabic phrases, Qur'anic verses, and hadith). 
Return a compact JSON with fields: summary (string, <= 200 words), bullets (string[]), qa ({q:string,a:string}[]), quotes (string[] Arabic quotes only, as-is). 
Do not invent content; rely only on the transcript.`;

    const { text: modelJson } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system,
      prompt: `GLOSSARY (domain terms to keep stable):\n${glossary}\n\nTRANSCRIPT:\n${transcript}\n\nReturn only JSON.`
    });

    let analysis: any = { summary:"", bullets:[], qa:[], quotes:[] };
    try { analysis = JSON.parse(modelJson); } catch {}

    // Cleanup temp
    await cleanupChunks(chunks);
    await rm(dir, { recursive: true, force: true });

    return NextResponse.json({
      success: true,
      transcript,
      analysis
    });
  } catch (err: any) {
    console.error("Transcribe error", err);
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}
