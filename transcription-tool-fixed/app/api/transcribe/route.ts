import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { makeFixedChunks, cleanupChunks } from "@/lib/chunking"
import { transcribeFile, type ASRConfig } from "@/lib/asr"
import { containsArabic, transliterateArabic } from "@/lib/arabic"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export const maxDuration = 60

function env<T = string>(key: string, fallback?: T): T {
  const v = process.env[key]
  return (v as any) ?? (fallback as any)
}

export async function POST(request: NextRequest) {
  try {
    let url = ""
    let glossary = ""

    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json()
      url = body.url || ""
      glossary = body.glossary || ""
    }

    if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 })

    // Download the blob (private access)
    const token = env("BLOB_READ_WRITE_TOKEN", "")
    const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : {})
    if (!res.ok) return NextResponse.json({ error: `Failed to download blob: ${res.status}` }, { status: 400 })
    const arrayBuf = await res.arrayBuffer()

    // Save to tmp
    const dir = await mkdtemp(join(tmpdir(), "upload-"))
    const filePath = join(dir, (new URL(url)).pathname.split("/").pop() || "audio.mp3")
    await writeFile(filePath, Buffer.from(arrayBuf))

    // Chunk long audio
    const chunks = await makeFixedChunks(filePath, 600, 2)

    // Transcribe each chunk with ASR
    const provider = (env("ASR_PROVIDER","groq") as "groq"|"openai")
    const cfg: ASRConfig = {
      provider,
      apiKey: provider === "groq" ? env("GROQ_API_KEY","") : env("OPENAI_API_KEY",""),
      model: provider === "groq" ? env("GROQ_ASR_MODEL","whisper-large-v3") : env("OPENAI_ASR_MODEL","whisper-1"),
      language: "en",
    }
    if (!cfg.apiKey) {
      await cleanupChunks(chunks)
      await rm(dir, { recursive:true, force:true })
      return NextResponse.json({ error: `${provider.toUpperCase()} API key missing`}, { status: 400 })
    }

    const parts: { text: string; start: number; end: number }[] = []
    for (const c of chunks) {
      const text = await transcribeFile(c.path, cfg)
      parts.push({ text, start: c.start, end: c.end })
    }

    // Stitch + add transliteration under Arabic lines
    let transcript = parts.map(p => p.text.trim()).join("\n").replace(/\n{2,}/g, "\n")
    const finalLines: string[] = []
    for (const line of transcript.split(/\r?\n/)) {
      finalLines.push(line)
      if (containsArabic(line)) finalLines.push("(" + transliterateArabic(line) + ")")
    }
    transcript = finalLines.join("\n")

    // Brief analysis JSON for summary/bullets/QA/quotes
    const system = `You analyze a lecture transcript (mostly English with some Arabic). Return JSON:
{ summary: string, bullets: string[], qa: {q:string,a:string}[], quotes: string[] }.
Do not invent content; rely only on the transcript.`

    const { text: modelJson } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system,
      prompt: `GLOSSARY:\n${glossary}\n\nTRANSCRIPT:\n${transcript}\n\nReturn only JSON.`,
    })

    let analysis: any = { summary:"", bullets:[], qa:[], quotes:[] }
    try { analysis = JSON.parse(modelJson) } catch {}

    await cleanupChunks(chunks)
    await rm(dir, { recursive: true, force: true })

    return NextResponse.json({ success: true, transcript, analysis })
  } catch (err: any) {
    console.error("Transcribe error", err)
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 })
  }
}
