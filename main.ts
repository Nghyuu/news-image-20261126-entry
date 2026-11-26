// THE WORLD TODAY — a one-page newspaper summing up Thursday 26 November 2026.
// Drawn from scratch by a pure-TypeScript rasterizer + hand-written PNG encoder.
// Node stdlib only. Deterministic: no clock, no randomness, fixed output.
//
// STORIES (researched 26 Nov 2026, paraphrased in my own words; sources noted):
//  1. TRADE (lead) — Washington publishes a proposed tariff plan covering the EU,
//     China and other major partners, citing industrial subsidies; markets brace.
//     Sources: France 24 / Jagran Josh 26 Nov roundup.
//  2. SPACE — China's Shenzhou-24 lifts off and docks with Tiangong station carrying
//     Muhammad Zeeshan Ali, the first Pakistani and first foreign astronaut aboard
//     the station, for a short science stay. Sources: China Manned Space Agency
//     via CLB / Devdiscourse / 26 Nov assembly headlines.
//  3. COLOMBIA — Police storm a supermarket and free 20 people held hostage for
//     17 hours; all are rescued alive. Source: BBC via Jagran Josh 26 Nov roundup.
//  4. NORTH KOREA — Pyongyang orders Switzerland to close its diplomatic office in
//     a row over sanctions. Sources: 26 Nov assembly headlines / The True Story.
//  5. INDIA — Mumbai marks 18 years since the 26/11 attacks of 2008, on the same
//     day India celebrates Constitution Day. Sources: Reuters diary 26 Nov,
//     Observer Voice 26 Nov headlines.
//  6. FOOTBALL — Champions League night: Barcelona win 4-1, Liverpool 3-0, Lille
//     stun Bayern 2-1, Real Madrid hit five past PSV. Source: KSNews overnight
//     results, Thursday 26 November.
//  7. MARKETS — Brent crude jumps to $94.65 on Middle East supply fears while Asian
//     shares steady after the AI sell-off; gold holds near $3,570. Source: ASX
//     live coverage, Thursday 26 November (Market Index).
//  Footer ticker — Kenya discharges its last Ebola patient (C54, 26 Nov); Bangladesh
//  raises garment workers' pay 36% (Daily Jagran, 26 Nov); EU leaders meet in
//  Brussels for a Euro Summit and special European Council (Reuters diary, 26 Nov);
//  15-year-old Vaibhav Sooryavanshi hits a record 28-ball century (26 Nov headlines).

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;

// ---- palette ----
const PAPER: [number, number, number] = [247, 241, 222];
const INK: [number, number, number] = [20, 20, 20];
const RED: [number, number, number] = [176, 32, 32];
const CREAM: [number, number, number] = [247, 241, 222];
const BLUE: [number, number, number] = [29, 78, 137];
const SKY: [number, number, number] = [198, 222, 240];
const GOLD: [number, number, number] = [200, 149, 26];
const GREEN: [number, number, number] = [46, 107, 52];
const TEAL: [number, number, number] = [214, 235, 228];
const SAND: [number, number, number] = [232, 214, 170];
const GREY: [number, number, number] = [90, 90, 90];
const WHITE: [number, number, number] = [255, 255, 255];
const NAVY: [number, number, number] = [24, 40, 72];
const ORANGE: [number, number, number] = [214, 110, 30];

type RGB = [number, number, number];

// ---- 5x7 bitmap font (hand-written) ----
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "00000", "01100", "01000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "%": ["11001", "11010", "00100", "01000", "01011", "10011", "00000"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "01000", "00000"],
};

const BLANK = ["00000", "00000", "00000", "00000", "00000", "00000", "00000"];

function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function wrapText(s: string, maxChars: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur === "") cur = w;
    else if (cur.length + 1 + w.length <= maxChars) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// ---- raster ----
class Img {
  data = new Uint8Array(W * H * 3);
  constructor() {
    for (let i = 0; i < W * H; i++) {
      this.data[i * 3] = PAPER[0];
      this.data[i * 3 + 1] = PAPER[1];
      this.data[i * 3 + 2] = PAPER[2];
    }
  }
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
  }
  fill(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
  }
  hline(x: number, y: number, w: number, c: RGB, t = 1): void {
    this.fill(x, y, w, t, c);
  }
  vline(x: number, y: number, h: number, c: RGB, t = 1): void {
    this.fill(x, y, t, h, c);
  }
  frame(x: number, y: number, w: number, h: number, c: RGB, t = 2): void {
    this.fill(x, y, w, t, c);
    this.fill(x, y + h - t, w, t, c);
    this.fill(x, y, t, h, c);
    this.fill(x + w - t, y, t, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.set(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  disc(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x * x + y * y <= r * r) this.set(cx + x, cy + y, c);
  }
  ring(cx: number, cy: number, r: number, c: RGB, t = 2): void {
    for (let a = 0; a < 360; a += 1) {
      const rad = (a * Math.PI) / 180;
      for (let k = 0; k < t; k++)
        this.set(
          Math.round(cx + (r - k) * Math.cos(rad)),
          Math.round(cy + (r - k) * Math.sin(rad)),
          c,
        );
    }
  }
  // filled triangle (scanline)
  tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      const edges: Array<[number, number, number, number]> = [
        [x0, y0, x1, y1],
        [x1, y1, x2, y2],
        [x2, y2, x0, y0],
      ];
      for (const [ax, ay, bx, by] of edges) {
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
        }
      }
      if (xs.length >= 2) {
        const lo = Math.min(...xs);
        const hi = Math.max(...xs);
        for (let x = Math.ceil(lo); x <= Math.floor(hi); x++) this.set(x, y, c);
      }
    }
  }
  text(s: string, x: number, y: number, scale: number, c: RGB): void {
    let cx = x;
    for (const ch of s) {
      const g = FONT[ch] ?? BLANK;
      for (let r = 0; r < 7; r++)
        for (let col = 0; col < 5; col++)
          if (g[r][col] === "1") this.fill(cx + col * scale, y + r * scale, scale, scale, c);
      cx += 6 * scale;
    }
  }
  textCenter(s: string, y: number, scale: number, c: RGB, x0 = 0, x1 = W): void {
    const x = x0 + Math.floor((x1 - x0 - textWidth(s, scale)) / 2);
    this.text(s, x, y, scale, c);
  }
  para(s: string, x: number, y: number, maxChars: number, scale: number, c: RGB, lh: number): number {
    const lines = wrapText(s, maxChars);
    lines.forEach((ln, i) => this.text(ln, x, y + i * lh, scale, c));
    return lines.length;
  }
}

// ---- icons (each draws inside a panel at px,py with size s) ----
function iconShip(g: Img, px: number, py: number, s: number): void {
  // sea + cargo ship + tariff percent
  g.fill(px, py + Math.floor(s * 0.72), s, Math.floor(s * 0.28), BLUE);
  g.fill(px + Math.floor(s * 0.08), py + Math.floor(s * 0.42), Math.floor(s * 0.84), Math.floor(s * 0.3), INK);
  g.tri(px + Math.floor(s * 0.08), py + Math.floor(s * 0.42), px + Math.floor(s * 0.92), py + Math.floor(s * 0.42), px + Math.floor(s * 0.8), py + Math.floor(s * 0.72), INK);
  g.fill(px + Math.floor(s * 0.16), py + Math.floor(s * 0.2), Math.floor(s * 0.2), Math.floor(s * 0.22), RED);
  g.fill(px + Math.floor(s * 0.4), py + Math.floor(s * 0.2), Math.floor(s * 0.2), Math.floor(s * 0.22), GOLD);
  g.fill(px + Math.floor(s * 0.64), py + Math.floor(s * 0.2), Math.floor(s * 0.2), Math.floor(s * 0.22), GREEN);
  g.fill(px + Math.floor(s * 0.52), py + Math.floor(s * 0.06), Math.floor(s * 0.05), Math.floor(s * 0.16), INK);
  g.text("%", px + Math.floor(s * 0.68), py + Math.floor(s * 0.02), 3, RED);
}

function iconRocket(g: Img, px: number, py: number, s: number): void {
  g.disc(px + Math.floor(s * 0.2), py + Math.floor(s * 0.18), 3, GOLD);
  g.disc(px + Math.floor(s * 0.82), py + Math.floor(s * 0.3), 3, GOLD);
  g.disc(px + Math.floor(s * 0.12), py + Math.floor(s * 0.55), 2, GOLD);
  const cx = px + Math.floor(s * 0.5);
  g.fill(cx - Math.floor(s * 0.09), py + Math.floor(s * 0.16), Math.floor(s * 0.18), Math.floor(s * 0.5), WHITE);
  g.frame(cx - Math.floor(s * 0.09), py + Math.floor(s * 0.16), Math.floor(s * 0.18), Math.floor(s * 0.5), INK, 2);
  g.tri(cx, py + Math.floor(s * 0.02), cx - Math.floor(s * 0.09), py + Math.floor(s * 0.18), cx + Math.floor(s * 0.09), py + Math.floor(s * 0.18), RED);
  g.tri(cx - Math.floor(s * 0.09), py + Math.floor(s * 0.5), cx - Math.floor(s * 0.2), py + Math.floor(s * 0.68), cx - Math.floor(s * 0.09), py + Math.floor(s * 0.68), RED);
  g.tri(cx + Math.floor(s * 0.09), py + Math.floor(s * 0.5), cx + Math.floor(s * 0.2), py + Math.floor(s * 0.68), cx + Math.floor(s * 0.09), py + Math.floor(s * 0.68), RED);
  g.tri(cx, py + Math.floor(s * 0.92), cx - Math.floor(s * 0.08), py + Math.floor(s * 0.68), cx + Math.floor(s * 0.08), py + Math.floor(s * 0.68), ORANGE);
  g.disc(cx, py + Math.floor(s * 0.34), Math.floor(s * 0.05), BLUE);
}

function iconStore(g: Img, px: number, py: number, s: number): void {
  g.fill(px + Math.floor(s * 0.1), py + Math.floor(s * 0.3), Math.floor(s * 0.8), Math.floor(s * 0.55), SAND);
  g.frame(px + Math.floor(s * 0.1), py + Math.floor(s * 0.3), Math.floor(s * 0.8), Math.floor(s * 0.55), INK, 2);
  for (let i = 0; i < 5; i++)
    g.fill(px + Math.floor(s * (0.1 + i * 0.16)), py + Math.floor(s * 0.22), Math.floor(s * 0.08), Math.floor(s * 0.1), i % 2 ? RED : WHITE);
  g.fill(px + Math.floor(s * 0.1), py + Math.floor(s * 0.32), Math.floor(s * 0.8), 3, INK);
  g.fill(px + Math.floor(s * 0.42), py + Math.floor(s * 0.52), Math.floor(s * 0.16), Math.floor(s * 0.33), INK);
  g.fill(px + Math.floor(s * 0.16), py + Math.floor(s * 0.42), Math.floor(s * 0.14), Math.floor(s * 0.14), SKY);
  g.fill(px + Math.floor(s * 0.7), py + Math.floor(s * 0.42), Math.floor(s * 0.14), Math.floor(s * 0.14), SKY);
  g.text("20", px + Math.floor(s * 0.3), py + Math.floor(s * 0.02), 3, RED);
}

function iconFlag(g: Img, px: number, py: number, s: number): void {
  g.fill(px + Math.floor(s * 0.14), py + Math.floor(s * 0.1), 4, Math.floor(s * 0.8), INK);
  g.fill(px + Math.floor(s * 0.18), py + Math.floor(s * 0.12), Math.floor(s * 0.5), Math.floor(s * 0.3), RED);
  g.disc(px + Math.floor(s * 0.43), py + Math.floor(s * 0.27), 5, WHITE);
  g.fill(px + Math.floor(s * 0.1), py + Math.floor(s * 0.62), Math.floor(s * 0.8), 4, INK);
  for (let i = 0; i < 6; i++)
    g.fill(px + Math.floor(s * (0.12 + i * 0.13)), py + Math.floor(s * 0.66), 3, Math.floor(s * 0.24), GREY);
}

function iconCandle(g: Img, px: number, py: number, s: number): void {
  const bx = px + Math.floor(s * 0.12);
  const bw = Math.floor(s * 0.2);
  g.fill(bx, py + Math.floor(s * 0.62), bw, Math.floor(s * 0.2), NAVY);
  g.fill(bx + Math.floor(s * 0.28), py + Math.floor(s * 0.5), bw, Math.floor(s * 0.32), NAVY);
  g.fill(bx + Math.floor(s * 0.56), py + Math.floor(s * 0.68), bw, Math.floor(s * 0.14), NAVY);
  g.tri(px + Math.floor(s * 0.22), py + Math.floor(s * 0.3), px + Math.floor(s * 0.16), py + Math.floor(s * 0.48), px + Math.floor(s * 0.28), py + Math.floor(s * 0.48), GOLD);
  g.tri(px + Math.floor(s * 0.5), py + Math.floor(s * 0.18), px + Math.floor(s * 0.44), py + Math.floor(s * 0.36), px + Math.floor(s * 0.56), py + Math.floor(s * 0.36), GOLD);
  g.fill(px + Math.floor(s * 0.2), py + Math.floor(s * 0.48), 3, Math.floor(s * 0.14), WHITE);
  g.fill(px + Math.floor(s * 0.48), py + Math.floor(s * 0.36), 3, Math.floor(s * 0.14), WHITE);
  g.text("18", px + Math.floor(s * 0.62), py + Math.floor(s * 0.05), 3, RED);
}

function iconBall(g: Img, px: number, py: number, s: number): void {
  const cx = px + Math.floor(s * 0.5);
  const cy = py + Math.floor(s * 0.48);
  const r = Math.floor(s * 0.32);
  g.disc(cx, cy, r, WHITE);
  g.ring(cx, cy, r, INK, 3);
  g.disc(cx, cy, Math.floor(r * 0.35), INK);
  g.line(cx, cy - Math.floor(r * 0.35), cx, cy - r, INK);
  g.line(cx, cy - Math.floor(r * 0.35), cx - Math.floor(r * 0.8), cy - Math.floor(r * 0.4), INK);
  g.line(cx, cy - Math.floor(r * 0.35), cx + Math.floor(r * 0.8), cy - Math.floor(r * 0.4), INK);
  g.line(cx, cy - Math.floor(r * 0.35), cx - Math.floor(r * 0.5), cy + Math.floor(r * 0.8), INK);
  g.line(cx, cy - Math.floor(r * 0.35), cx + Math.floor(r * 0.5), cy + Math.floor(r * 0.8), INK);
  g.fill(px + Math.floor(s * 0.08), py + Math.floor(s * 0.82), Math.floor(s * 0.84), 4, GREEN);
}

function iconChart(g: Img, px: number, py: number, s: number): void {
  const ox = px + Math.floor(s * 0.12);
  const oy = py + Math.floor(s * 0.82);
  g.line(ox, py + Math.floor(s * 0.1), ox, oy, INK);
  g.line(ox, oy, px + Math.floor(s * 0.9), oy, INK);
  const pts: Array<[number, number]> = [
    [0.14, 0.68], [0.3, 0.6], [0.44, 0.66], [0.58, 0.44], [0.72, 0.5], [0.86, 0.2],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = px + Math.floor(s * pts[i][0]);
    const ay = py + Math.floor(s * pts[i][1]);
    const bx = px + Math.floor(s * pts[i + 1][0]);
    const by = py + Math.floor(s * pts[i + 1][1]);
    g.line(ax, ay, bx, by, RED);
    g.line(ax, ay + 1, bx, by + 1, RED);
    g.disc(ax, ay, 3, RED);
  }
  g.disc(px + Math.floor(s * 0.86), py + Math.floor(s * 0.2), 3, RED);
  g.tri(px + Math.floor(s * 0.86), py + Math.floor(s * 0.08), px + Math.floor(s * 0.78), py + Math.floor(s * 0.2), px + Math.floor(s * 0.86), py + Math.floor(s * 0.2), RED);
  g.fill(px + Math.floor(s * 0.68), py + Math.floor(s * 0.55), Math.floor(s * 0.16), Math.floor(s * 0.27), INK);
  g.fill(px + Math.floor(s * 0.68), py + Math.floor(s * 0.6), Math.floor(s * 0.16), 3, GOLD);
  g.fill(px + Math.floor(s * 0.68), py + Math.floor(s * 0.72), Math.floor(s * 0.16), 3, GOLD);
}

// ---- page ----
interface Story {
  kicker: string;
  head: string;
  cap: string;
  bg: RGB;
  icon: (g: Img, x: number, y: number, s: number) => void;
}

const STORIES: Story[] = [
  {
    kicker: "SPACE - CHINA",
    head: "PAKISTAN'S FIRST ASTRONAUT REACHES SPACE",
    cap: "SHENZHOU-24 DOCKS WITH THE TIANGONG STATION. MUHAMMAD ZEESHAN ALI JOINS A SHORT STAY IN ORBIT.",
    bg: NAVY,
    icon: iconRocket,
  },
  {
    kicker: "COLOMBIA",
    head: "20 HOSTAGES FREED IN COLOMBIA",
    cap: "POLICE STORM A SUPERMARKET AFTER A 17-HOUR STANDOFF. ALL HELD INSIDE ARE RESCUED ALIVE.",
    bg: TEAL,
    icon: iconStore,
  },
  {
    kicker: "NORTH KOREA",
    head: "NORTH KOREA ORDERS SWISS OFFICE SHUT",
    cap: "PYONGYANG MOVES AGAINST SWITZERLAND'S DIPLOMATIC POST IN A ROW OVER SANCTIONS.",
    bg: SAND,
    icon: iconFlag,
  },
  {
    kicker: "INDIA - MUMBAI",
    head: "MUMBAI MARKS 18 YEARS SINCE 26/11",
    cap: "INDIA REMEMBERS THE 2008 ATTACKS AND MARKS CONSTITUTION DAY ON THE SAME DATE.",
    bg: SKY,
    icon: iconCandle,
  },
  {
    kicker: "FOOTBALL",
    head: "CHAMPIONS LEAGUE NIGHT OF GOALS",
    cap: "BARCELONA WIN 4-1, LIVERPOOL 3-0, LILLE STUN BAYERN 2-1, REAL MADRID HIT FIVE.",
    bg: TEAL,
    icon: iconBall,
  },
  {
    kicker: "MARKETS",
    head: "OIL JUMPS AS ASIAN MARKETS STEADY",
    cap: "BRENT CLIMBS TO $94.65 ON MIDDLE EAST SUPPLY FEARS. GOLD HOLDS NEAR $3,570 AN OUNCE.",
    bg: SAND,
    icon: iconChart,
  },
];

function drawPage(g: Img): void {
  g.frame(0, 0, W, H, INK, 5);
  // masthead
  g.textCenter("THE WORLD TODAY", 22, 6, INK);
  g.hline(24, 78, W - 48, RED, 3);
  g.textCenter("THE WORLD'S NEWS IN ONE PAGE", 88, 2, GREY);
  // date band
  g.fill(16, 118, W - 32, 40, INK);
  g.textCenter("THURSDAY 26 NOVEMBER 2026", 128, 3, CREAM);
  // lead story
  const lx = 16;
  const ly = 170;
  const lw = W - 32;
  const lh = 178;
  g.frame(lx, ly, lw, lh, INK, 2);
  g.fill(lx + 2, ly + 2, lw - 4, lh - 4, WHITE);
  g.text("TRADE - LEAD STORY", lx + 16, ly + 12, 2, RED);
  g.text("US UNVEILS NEW TARIFF", lx + 16, ly + 40, 3, INK);
  g.text("PLAN FOR EU AND CHINA", lx + 16, ly + 68, 3, INK);
  g.para(
    "WASHINGTON PUBLISHES PROPOSALS FOR HIGHER DUTIES ON MAJOR TRADING PARTNERS, CITING INDUSTRIAL SUBSIDIES. MARKETS BRACE FOR A FRESH ROUND OF PRICE RISES.",
    lx + 16,
    ly + 108,
    58,
    2,
    INK,
    18,
  );
  // lead icon panel
  const ix = lx + lw - 196;
  g.fill(ix, ly + 10, 186, lh - 20, SKY);
  g.frame(ix, ly + 10, 186, lh - 20, INK, 2);
  iconShip(g, ix + 18, ly + 22, 150);
  // grid of 6 stories, 2 columns x 3 rows
  const cols = [16, 520];
  const rows = [360, 544, 728];
  const bw = 488;
  const bh = 176;
  STORIES.forEach((st, i) => {
    const x = cols[i % 2];
    const y = rows[Math.floor(i / 2)];
    g.frame(x, y, bw, bh, INK, 2);
    g.fill(x + 2, y + 2, bw - 4, bh - 4, WHITE);
    // icon panel
    g.fill(x + 10, y + 10, 128, bh - 20, st.bg);
    g.frame(x + 10, y + 10, 128, bh - 20, INK, 2);
    if (st.bg === NAVY) {
      // rocket panel is dark: draw icon on white inset
      g.fill(x + 14, y + 14, 120, bh - 28, WHITE);
    }
    st.icon(g, x + 14, y + 14, 120);
    const tx = x + 152;
    g.text(st.kicker, tx, y + 12, 2, RED);
    const headLines = wrapText(st.head, 26);
    headLines.forEach((ln, j) => g.text(ln, tx, y + 38 + j * 18, 2, INK));
    const capY = y + 38 + headLines.length * 18 + 6;
    g.para(st.cap, tx, capY, 26, 2, INK, 18);
  });
  // footer ticker
  g.fill(16, 916, W - 32, 92, INK);
  g.text("ALSO TODAY:", 32, 928, 2, GOLD);
  g.text("KENYA DISCHARGES ITS LAST EBOLA PATIENT", 32, 952, 2, CREAM);
  g.text("BANGLADESH RAISES GARMENT PAY 36% - EU LEADERS MEET IN BRUSSELS", 32, 974, 2, CREAM);
}

// ---- PNG encoder (hand-written, zlib via node:zlib) ----
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG(g: Img): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(g.data.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR;
  if (!outDir) throw new Error("MAKEFUN_OUTPUT_DIR is not set");
  const g = new Img();
  drawPage(g);
  const png = encodePNG(g);
  const out = path.join(outDir, "entry.png");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(out, png);
  fs.chmodSync(out, 0o644);
}

main();
