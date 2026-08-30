import { mkdir, readFile, writeFile } from "node:fs/promises";

const SOURCES = [
  "https://www.letrot.com/hippodromes/vincennes/7500",
  "https://f.dlt.letrot.com/f/lp/nocturnes-kermesse-festival/p02qtztn"
];
const OUTPUT = new URL("../data/events.json", import.meta.url);
const MONTHS = { janvier:0, fevrier:1, février:1, mars:2, avril:3, mai:4, juin:5, juillet:6, aout:7, août:7, septembre:8, octobre:9, novembre:10, decembre:11, décembre:11 };

const clean = value => String(value ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, " ").trim();
const absolute = (href, base) => { try { return new URL(href, base).href; } catch { return href; } };

async function getPage(url) {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; Paris-Vincennes-Screen/1.0; +https://github.com/plero75/mobili)", accept: "text/html,application/xhtml+xml" }, redirect: "follow" });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

function dateFromFrench(text, base = new Date()) {
  const match = clean(text).toLowerCase().match(/\b(\d{1,2}|1er)\s+(janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)(?:\s+(20\d{2}))?/i);
  if (!match) return null;
  const day = match[1] === "1er" ? 1 : Number(match[1]);
  const month = MONTHS[match[2].normalize("NFC")];
  let year = Number(match[3] || base.getFullYear());
  let date = new Date(year, month, day, 12, 0, 0, 0);
  if (!match[3] && date.getTime() < base.getTime() - 45 * 86400000) date = new Date(year + 1, month, day, 12, 0, 0, 0);
  return date;
}

function collectJsonLd(html, source) {
  const events = [];
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const visit = value => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    const type = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
    if (type.some(item => /Event/i.test(String(item)))) {
      const start = new Date(value.startDate || value.doorTime || value.datePublished);
      const end = new Date(value.endDate || value.startDate || value.doorTime || value.datePublished);
      if (!Number.isNaN(start.getTime()) && /vincennes/i.test(clean(value.location?.name || value.location?.address || value.description || source))) {
        events.push({ title: clean(value.name), start: start.toISOString(), end: Number.isNaN(end.getTime()) ? start.toISOString() : end.toISOString(), summary: clean(value.description).slice(0, 180), url: absolute(value.url || source, source), image: Array.isArray(value.image) ? value.image[0] : (value.image?.url || value.image || "") });
      }
    }
    Object.values(value).forEach(visit);
  };
  for (const block of blocks) { try { visit(JSON.parse(block[1])); } catch {} }
  return events;
}

function collectCards(html, source) {
  const events = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,5000}?)<\/a>/gi)) {
    const href = match[1], text = clean(match[2]);
    if (!/(evenement|event|\/f\/lp\/|dlt\.letrot)/i.test(href)) continue;
    const start = dateFromFrench(text);
    if (!start) continue;
    const title = clean(text).replace(/\b(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)?\s*(?:\d{1,2}|1er)\s+(?:janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre).*$/i, "").slice(0, 100);
    if (title.length < 4) continue;
    events.push({ title, start: start.toISOString(), end: start.toISOString(), summary: text.slice(0, 180), url: absolute(href, source), image: "" });
  }
  return events;
}

async function main() {
  let collected = [];
  const errors = [];
  for (const source of SOURCES) {
    try {
      const html = await getPage(source);
      collected.push(...collectJsonLd(html, source), ...collectCards(html, source));
    } catch (error) { errors.push(String(error)); }
  }
  const now = Date.now() - 86400000;
  const unique = new Map();
  collected.filter(item => item.title && new Date(item.end).getTime() >= now).sort((a,b) => new Date(a.start) - new Date(b.start)).forEach(item => { const key = `${item.title.toLowerCase()}|${item.start.slice(0,10)}`; if (!unique.has(key)) unique.set(key, item); });
  const events = [...unique.values()].slice(0, 12);
  let previous = { events: [] };
  try { previous = JSON.parse(await readFile(OUTPUT, "utf8")); } catch {}
  if (!events.length) {
    console.warn(previous.events?.length ? "Aucun nouvel événement collecté ; conservation du dernier cache valide." : "Aucun événement collecté ; cache inchangé.", errors);
    if (!previous.events?.length) process.exitCode = 1;
    return;
  }
  await mkdir(new URL("../data/", import.meta.url), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify({ updatedAt: new Date().toISOString(), source: SOURCES[0], events, errors }, null, 2) + "\n");
  console.log(`${events.length} événement(s) enregistré(s).`);
}

await main();
