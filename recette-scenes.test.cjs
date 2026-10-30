const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const root = (file) => readFileSync(join(__dirname, file), "utf8");
const html = root("recette.html");
const js = root("recette.js");
const live = root("recette-live.js");
const polish = root("recette-modes-polish.css");
const index = root("index.html");
const tv = root("mobili-display.css");

test("les neuf scènes événementielles et l’auto sont sélectionnables", () => {
  const modes = [
    "arrivee", "reunion", "transition", "sortie",
    "incident_rer_a", "incident_bus", "no_race_event",
    "no_race_idle", "mobilite"
  ];
  for (const mode of modes) {
    assert.match(js, new RegExp("\\b" + mode + "\\b"), "Mode absent: " + mode);
  }
  assert.match(js, /const renderers\s*=/);
  assert.match(js, /query\.get\('review'\) === '1'/);
  assert.match(js, /aria-current="page"/);
  assert.match(js, /\['auto', 'Auto'\]/);
});

test("la finition des modes 19:9 est bien chargée en dernier", () => {
  const links = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(match => match[1].split("?")[0]);
  assert.deepEqual(links, ["mobili-tokens.css", "recette.css", "recette-ratp.css", "recette-display-fix.css", "recette-modes-polish.css"]);
});

test("les deux scènes sans courses s’adaptent à la hauteur utile du 19:9", () => {
  for (const selector of [".no-race-event-layout", ".no-race-idle-layout"]) {
    const escaped = selector.replace(".", "\\.");
    const block = polish.match(new RegExp(escaped + "\\s*\\{([^}]+)\\}"))?.[1] || "";
    assert.match(block, /height:\s*100%/);
    assert.match(block, /grid-template-rows:\s*minmax\(0,/);
  }
  assert.match(polish, /\.no-race-side/);
  assert.match(polish, /\.horoscope-item/);
});

test("le RER des modes de sortie ne recommande pas un train impossible à atteindre", () => {
  assert.match(live, /rerParisAtteignable\s*=\s*\(\)\s*=>\s*IV\.reachable\(liveRows\("rer"\)\.filter\(IV\.west\),\s*14\)/);
  assert.match(live, /const passage = rerParisAtteignable\(\)\[index\]/);
  assert.match(live, /incident-banner h1/);
});

test("les horaires 101 de Joinville ne sont pas attribués au Breuil", () => {
  assert.match(live, /bus101JoinvilleAtteignable/);
  assert.doesNotMatch(live, /<strong>École du Breuil<\/strong><small>Direction/);
  assert.match(js, /Bus 101 · desserte au pôle RER/);
});

test("l’afficheur principal contient la hiérarchie révisée et ses versions", () => {
  assert.match(index, /mobili-display\.css\?v=/);
  assert.match(tv, /grid-template-rows:1fr 1\.36fr/);
  assert.match(root("vhpratp-bus.js"), /1ER DÉPART/);
});
