
import { spawn } from "node:child_process";
import ffprobe from "ffprobe-static";
import ffmpegPath from "ffmpeg-static";
import { tmpdir } from "node:os";
import { mkdtemp, rm, access } from "node:fs/promises";
import { join } from "node:path";

export async function getDurationSec(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = ["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1", filePath];
    const child = spawn(ffprobe.path, args);
    let out = ""; let err = "";
    child.stdout.on("data", d => out += d.toString());
    child.stderr.on("data", d => err += d.toString());
    child.on("close", (code) => {
      if (code === 0) resolve(parseFloat(out.trim()));
      else reject(new Error("ffprobe failed: " + err));
    });
  });
}

export type ChunkInfo = { path: string; start: number; end: number; index: number };

export async function makeFixedChunks(filePath: string, windowSec = 600, overlapSec = 2): Promise<ChunkInfo[]> {
  const dur = await getDurationSec(filePath);
  const tmp = await mkdtemp(join(tmpdir(), "chunks-"));
  const chunks: ChunkInfo[] = [];
  let start = 0; let idx = 0;
  while (start < dur) {
    const end = Math.min(start + windowSec, dur);
    const out = join(tmp, `chunk-${idx}.mp3`);
    await new Promise<void>((resolve, reject) => {
      const args = ["-hide_banner","-ss", String(start),"-t", String(end - start + overlapSec), "-i", filePath, "-c", "copy", out];
      const child = spawn(ffmpegPath!, args);
      child.on("error", reject);
      child.on("close", (code) => code === 0 ? resolve() : reject(new Error("ffmpeg failed")));
    });
    chunks.push({ path: out, start, end, index: idx });
    start = end - overlapSec;
    idx += 1;
  }
  return chunks;
}

export async function cleanupChunks(chunks: ChunkInfo[]) {
  // Remove temp dir that contains chunks
  if (chunks.length === 0) return;
  const dir = chunks[0].path.split("/").slice(0,-1).join("/");
  try { await rm(dir, { recursive: true, force: true }); } catch {}
}
