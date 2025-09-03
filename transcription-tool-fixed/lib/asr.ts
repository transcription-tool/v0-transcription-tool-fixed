
import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";

export type ASRProvider = "groq" | "openai";
export type ASRConfig = { provider: ASRProvider; apiKey: string; model?: string; language?: string };

export async function transcribeFile(chunkPath: string, cfg: ASRConfig): Promise<string> {
  const fileStream = fs.createReadStream(chunkPath);
  if (cfg.provider === "groq") {
    const endpoint = "https://api.groq.com/openai/v1/audio/transcriptions";
    const form = new FormData();
    form.append("file", fileStream as any, path.basename(chunkPath));
    form.append("model", cfg.model ?? "whisper-large-v3");
    if (cfg.language) form.append("language", cfg.language);
    form.append("response_format", "text");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      body: form as any,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`GROQ ASR error: ${res.status} ${t}`);
    }
    return await res.text();
  } else {
    // OpenAI
    const endpoint = "https://api.openai.com/v1/audio/transcriptions";
    const form = new FormData();
    form.append("file", fileStream as any, path.basename(chunkPath));
    form.append("model", cfg.model ?? "whisper-1");
    if (cfg.language) form.append("language", cfg.language);
    form.append("response_format", "text");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      body: form as any,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`OpenAI ASR error: ${res.status} ${t}`);
    }
    return await res.text();
  }
}
