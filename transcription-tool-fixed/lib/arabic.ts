
export const ARABIC_RANGES = [
  [0x0600, 0x06FF], // Arabic
  [0x0750, 0x077F], // Arabic Supplement
  [0x08A0, 0x08FF], // Arabic Extended-A
  [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
  [0xFE70, 0xFEFF], // Arabic Presentation Forms-B
];

export function isArabicChar(ch: string) {
  const code = ch.codePointAt(0) ?? 0;
  return ARABIC_RANGES.some(([a,b]) => code >= a && code <= b);
}

export function containsArabic(s: string) {
  for (const ch of s) if (isArabicChar(ch)) return true;
  return false;
}

// Simplified academic transliteration mapping
const MAP: Record<string, string> = {
  "ا":"ā","أ":"a","إ":"i","آ":"ā","ب":"b","ت":"t","ث":"th",
  "ج":"j","ح":"ḥ","خ":"kh","د":"d","ذ":"dh","ر":"r","ز":"z",
  "س":"s","ش":"sh","ص":"ṣ","ض":"ḍ","ط":"ṭ","ظ":"ẓ","ع":"ʿ",
  "غ":"gh","ف":"f","ق":"q","ك":"k","ل":"l","م":"m","ن":"n",
  "ه":"h","و":"w","ي":"y","ء":"ʾ","ؤ":"ʾ","ئ":"ʾ","ة":"h",
  "ى":"ā","َ":"a","ِ":"i","ُ":"u","ً":"an","ٍ":"in","ٌ":"un",
  "ْ":"", "ّ":""
};

export function transliterateArabic(input: string) {
  let out = "";
  for (const ch of input) {
    if (isArabicChar(ch) || MAP[ch]) out += (MAP[ch] ?? ch);
    else out += ch;
  }
  // Normalize gemination and whitespace
  return out.replace(/\s+/g, " ").trim();
}

export function splitArabicRuns(input: string) {
  const runs: { text: string; arabic: boolean }[] = [];
  let buf = "";
  let mode: boolean | null = null;
  for (const ch of input) {
    const ar = isArabicChar(ch);
    if (mode === null) { mode = ar; buf = ch; continue; }
    if (ar === mode) buf += ch;
    else { runs.push({ text: buf, arabic: !!mode }); buf = ch; mode = ar; }
  }
  if (buf) runs.push({ text: buf, arabic: !!mode });
  return runs;
}
