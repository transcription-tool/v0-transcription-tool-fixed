
import sharp from "sharp";

export type MindNode = { label: string; children?: MindNode[] };

function renderNodeSVG(node: MindNode, x: number, y: number, level=0): {svg:string; width:number; height:number} {
  const padX = 26, padY = 14, boxW = 260, boxH = 46, vGap = 26;
  let svg = `<rect x="${x}" y="${y}" rx="8" ry="8" width="${boxW}" height="${boxH}" fill="#0b5" opacity="0.12" stroke="#0b5"/>` +
            `<text x="${x+12}" y="${y+28}" font-family="Inter,Arial" font-size="16" fill="#123">${node.label}</text>`;
  let curY = y + boxH + vGap;
  let width = boxW; let height = boxH;
  if (node.children && node.children.length) {
    for (const child of node.children) {
      const childRender = renderNodeSVG(child, x+ (level===0? (boxW+40): 0), curY, level+1);
      svg += `<line x1="${x+boxW}" y1="${y+boxH/2}" x2="${x+boxW+40}" y2="${curY+23}" stroke="#0b5"/>`;
      svg += childRender.svg;
      curY += childRender.height + vGap;
      width = Math.max(width, boxW + 40 + childRender.width);
      height = Math.max(height, (curY - y));
    }
  }
  return { svg, width, height };
}

export async function makeMindmapPng(root: MindNode): Promise<Uint8Array> {
  const r = renderNodeSVG(root, 20, 20, 0);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${r.width + 40}" height="${r.height + 40}">` + r.svg + `</svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Uint8Array(png);
}
