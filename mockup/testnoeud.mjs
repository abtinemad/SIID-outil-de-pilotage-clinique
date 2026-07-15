// ═════════════════════════════════════════════════════════════════════════════════════
//  TÉMOIN DU RENDU DU NŒUD — le garde-fou exécutable qui manque.
//
//  testvrille.mjs teste la GÉOMÉTRIE du noyau (KF/KN/shapeAt) en node nu. Il ne touche
//  RIEN de ce que le nœud d'app_mockup FAIT à l'écran : render, œil, labels, oudjat,
//  scouter, morph. Ce banc-ci comble ce trou (le « Gap 3 » du cadrage d'extraction) :
//  il pilote le render RÉEL dans un Chrome headless (puppeteer + file://) et capture des
//  INVARIANTS reproductibles. `prefers-reduced-motion: reduce` fige la géométrie
//  (pulse=1) → les invariants sont stables run-à-run, SANS toucher le moteur.
//
//  On ne lit JAMAIS l'état interne de l'IIFE (non exportable) — seulement des sondes
//  observables sur le DOM : viewBox, enfants #labels + mots, nb de trous/overs, position
//  de l'œil #pt, et un marqueur de mode au clic (oudjat / dashboard / park).
//
//  AVANT extraction (maintenant) : établit la référence → tests/noeud.snapshot.json.
//  APRÈS extraction (chantier suivant) : rejoue et compare. Un écart = régression du rendu.
//
//  Usage :  node mockup/testnoeud.mjs
//    exit 0 = référence établie, ou rendu IDENTIQUE ; 1 = écart ; 2 = non exécuté (puppeteer).
//  Requiert puppeteer (déjà en devDependency, comme le banc de fidélité).
// ═════════════════════════════════════════════════════════════════════════════════════
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CIBLE = "file://" + path.resolve(__dirname, "app_mockup.html");
const SNAP  = path.resolve(__dirname, "tests", "noeud.snapshot.json");
const attendre = ms => new Promise(r => setTimeout(r, ms));

// ── sondes observables (jamais l'état interne de l'IIFE) ──────────────────────────────
const viewBox = pg => pg.$eval("#knot", e => e.getAttribute("viewBox"));
const labels  = pg => pg.$eval("#labels", e => {
  const tx = [...e.querySelectorAll("text")];
  return { n: tx.length, mots: tx.map(t => t.textContent) };
});
const compte  = (pg, sel) => pg.$eval(sel, e =>
  [...e.querySelectorAll("path")].filter(p => (p.getAttribute("d") || "").length > 0).length);
const oeil    = pg => pg.$eval("#pt", e =>
  [Math.round(+e.getAttribute("cx")), Math.round(+e.getAttribute("cy")), Math.round(+e.getAttribute("r"))]);
const opacite = (pg, sel) => pg.$eval(sel, e => +(+e.getAttribute("opacity")).toFixed(2));
const tagTxt  = pg => pg.$eval("#tag", e => e.textContent.replace(/\s+/g, " ").trim());

const strate = (pg, s) => pg.click(`#switch button[data-s="${s}"]`);
async function clicBoucle(pg, fx, fy) {
  const b = await pg.$eval("#knot", el => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
  await pg.mouse.click(b[0] + b[2] * fx, b[1] + b[3] * fy);
}

// invariants d'une strate, au repos (aucun clic → état propre, œil épinglé par reduce)
async function capturer(pg, s) {
  await strate(pg, s);
  await attendre(2600);                        // le morph s'installe (easing → snap currentS=targetS)
  const lab = await labels(pg);
  return {
    tag:     await tagTxt(pg),
    viewBox: await viewBox(pg),
    nLabels: lab.n,
    mots:    lab.mots,
    nTrous:  await compte(pg, "#holes"),
    nOvers:  await compte(pg, "#overs"),
    oeil:    await oeil(pg)
  };
}

(async () => {
  const nav = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"]
  });
  const capt = { strates: {}, modes: {} };
  try {
    const pg = await nav.newPage();
    await pg.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await pg.setViewport({ width: 1180, height: 920 });
    await pg.goto(CIBLE, { waitUntil: "networkidle0" });

    // ── invariants par strate (5 → 3 → 2 boucles) ──
    for (const [nom, s] of [["b5", 2], ["b3", 1], ["b2", 0]]) {
      capt.strates[nom] = await capturer(pg, s);
    }

    // ── modes au clic (page rechargée = état neuf avant chaque sonde) ──
    // 2 boucles → OUDJAT : la monture se pose (opacité > 0)
    await pg.goto(CIBLE, { waitUntil: "networkidle0" });
    await strate(pg, 0); await attendre(2600);
    await clicBoucle(pg, 0.30, 0.5); await attendre(1300);
    capt.modes.oudjat_b2_opacite = await opacite(pg, "#oudjat");

    // 3 boucles → DASHBOARD : l'œil ENTRE dans une boucle (quitte le centre)
    await pg.goto(CIBLE, { waitUntil: "networkidle0" });
    await strate(pg, 1); await attendre(2600);
    const av3 = await oeil(pg);
    await clicBoucle(pg, 0.5, 0.22); await attendre(1600);
    const ap3 = await oeil(pg);
    capt.modes.dashboard_b3 = { avant: av3, apres: ap3, deplacement: Math.round(Math.hypot(ap3[0] - av3[0], ap3[1] - av3[1])) };

    // 5 boucles → PARK : l'œil se pose sur un nœud (bas, pour ne pas retomber sur nœud 0)
    await pg.goto(CIBLE, { waitUntil: "networkidle0" });
    await strate(pg, 2); await attendre(2600);
    const av5 = await oeil(pg);
    await clicBoucle(pg, 0.32, 0.70); await attendre(1300);
    const ap5 = await oeil(pg);
    capt.modes.park_b5 = { avant: av5, apres: ap5, deplacement: Math.round(Math.hypot(ap5[0] - av5[0], ap5[1] - av5[1])) };

    // ── GARDE GÉNÉRIQUE (pas un snapshot) : après rendu, aucun attribut numérique du SVG ne doit valoir NaN.
    //    Le témoin ne capture que strates/modes ; ce trou-là est ce qui a laissé passer le NaN de l'iris en reduced-motion. ──
    const nans = await pg.evaluate(() => {
      const out = [];
      document.querySelectorAll('#knot *').forEach(el => {
        for (const a of el.attributes) if (/NaN/i.test(a.value)) out.push(el.id || el.tagName + ':' + a.name);
      });
      return out;
    });
    if (nans.length) { console.error('ROUGE — attributs NaN :', nans.join(', ')); process.exit(1); }
    else console.log('  aucun attribut NaN ✓');
  } finally {
    await nav.close();
  }

  console.log("── INVARIANTS CAPTURÉS (app_mockup ACTUEL, avant extraction) ─────────");
  console.log(JSON.stringify(capt, null, 2));

  const rendu = JSON.stringify(capt, null, 2);
  if (!fs.existsSync(SNAP)) {
    fs.writeFileSync(SNAP, rendu + "\n");
    console.log("\nRÉFÉRENCE ÉTABLIE → " + path.relative(path.resolve(__dirname, ".."), SNAP));
    console.log("Le témoin est posé. Après extraction, ce banc devra rejouer IDENTIQUE.");
    process.exit(0);
  }
  if (rendu === fs.readFileSync(SNAP, "utf8").trim()) {
    console.log("\nTÉMOIN VERT — rendu IDENTIQUE à la référence.");
    process.exit(0);
  }
  console.error("\nÉCART — le rendu a DÉVIÉ de la référence (tests/noeud.snapshot.json). À inspecter.");
  process.exit(1);
})().catch(e => { console.error("NON EXÉCUTÉ —", e.message); process.exit(2); });
