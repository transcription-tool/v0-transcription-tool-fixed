"use client"

import { useState } from "react"
import { upload } from "@vercel/blob/client"

export default function AudioUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [glossary, setGlossary] = useState("Bukhari, Muslim, ihsan, iman, Islam, Jibril, sallallahu alayhi wa sallam")

  const handleUpload = async () => {
    if (!file) return
    setLoading(true); setError(null)
    try {
      // 1) Upload raw audio to Vercel Blob (handles large files, resumable)
      const { url } = await upload(file.name, file, { access: "private" })

      // 2) Tell our API to process the Blob URL
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, glossary }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const download = async (kind: "txt"|"summary"|"analysis"|"slides"|"mindmap") => {
    if (!result) return
    let body: any = {}
    if (kind === "txt") body = { transcript: result.transcript }
    if (kind === "summary") body = { transcript: result.transcript, summary: result.analysis?.summary || "" }
    if (kind === "analysis") body = { transcript: result.transcript, analysis: result.analysis || {} }
    if (kind === "slides") body = { transcript: result.transcript, analysis: result.analysis || {} }
    if (kind === "mindmap") body = { root: { label: "Lecture", children: (result.analysis?.bullets||[]).slice(0,6).map((b:string)=>({label:b})) } }

    const res = await fetch(`/api/export/${kind}`, { method:"POST", body: JSON.stringify(body)})
    if (!res.ok) { alert("Export failed"); return }
    const blob = await res.blob()
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = kind === "txt" ? "transcript.txt"
      : kind === "summary" ? "summary.docx"
      : kind === "analysis" ? "analysis.docx"
      : kind === "slides" ? "slides.pptx"
      : "mindmap.png"
    a.click()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <label className="block text-sm font-medium mb-2">Upload audio (MP3/WAV up to 2GB)</label>
        <input type="file" accept="audio/*" onChange={e=>setFile(e.target.files?.[0] || null)} />
        <label className="block text-sm font-medium mt-4">Glossary (Arabic/Islamic terms)</label>
        <textarea className="w-full p-2 mt-1 rounded border bg-transparent" rows={3} value={glossary} onChange={e=>setGlossary(e.target.value)} />
        <button disabled={!file || loading} onClick={handleUpload} className="mt-3 rounded-lg px-4 py-2 bg-black text-white disabled:opacity-50">
          {loading ? "Transcribing..." : "Transcribe"}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {result && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border p-4">
            <h3 className="font-semibold mb-2">Transcript</h3>
            <pre className="whitespace-pre-wrap text-sm leading-6">{result.transcript}</pre>
          </div>
          <div className="rounded-xl border p-4 space-y-2">
            <h3 className="font-semibold">Analysis</h3>
            <p className="text-sm opacity-80">{result.analysis?.summary}</p>
            <ul className="list-disc pl-5 text-sm">
              {(result.analysis?.bullets||[]).map((b:string,i:number)=>(<li key={i}>{b}</li>))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <button className="px-3 py-2 rounded-lg border" onClick={()=>download("txt")}>Download TXT</button>
              <button className="px-3 py-2 rounded-lg border" onClick={()=>download("summary")}>Summary DOCX</button>
              <button className="px-3 py-2 rounded-lg border" onClick={()=>download("analysis")}>Analysis DOCX</button>
              <button className="px-3 py-2 rounded-lg border" onClick={()=>download("slides")}>Slides PPTX</button>
              <button className="px-3 py-2 rounded-lg border" onClick={()=>download("mindmap")}>Mindmap PNG</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

