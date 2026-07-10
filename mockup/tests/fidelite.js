// ═════════════════════════════════════════════════════════════════════════════════════
//  BANC DE FIDÉLITÉ — l'équivalent, pour l'interface, de db/tests/impossibilites.sql
//
//  Ce banc ne dit pas que la doctrine est tenue. Il ÉCHOUE quand elle ne l'est plus.
//
//  ┌ Deux règles d'écriture ────────────────────────────────────────────────────────┐
//  │                                                                                 │
//  │  1. CONTRÔLES POSITIFS OBLIGATOIRES. Une interface morte passe toutes les       │
//  │     impossibilités : quatre erreurs suffisent à simuler quatre vertus. Un banc  │
//  │     sans contrôle positif certifie une page blanche.                            │
//  │                                                                                 │
//  │  2. ON NE TESTE JAMAIS LE RANGEMENT SÉMANTIQUE. Vérifier que « sœur » tombe     │
//  │     dans la boucle familiale, c'est certifier `LEX`, le lexique-figurant. Le    │
//  │     jour où un modèle le remplace, le banc passerait au vert en mentant. On     │
//  │     teste que ce qui est affiché est VERBATIM — jamais que le rangement est     │
//  │     JUSTE. La justesse du rangement se lit à l'œil ; elle ne se certifie pas.   │
//  └─────────────────────────────────────────────────────────────────────────────────┘
//
//  `prefers-reduced-motion: reduce` met `pulse = 1` : la géométrie devient exacte, SANS
//  TOUCHER AU MOTEUR. L'accessibilité paie la testabilité — deux fois.
//
//  La désignation de l'angle mort ne se lit PAS dans les pixels de la pupille : l'œil cligne,
//  et sa pupille passe derrière le globe. On l'a cherchée là, on a mesuré une errance de 77
//  pour un mouvement de 8. On lit maintenant ce que l'œil DIT : `#pt[aria-label]`. Ce n'est pas
//  une sonde plantée pour le test — c'est la désignation rendue au lecteur d'écran, qui ne la
//  recevait pas. Le banc lit ce qu'un aveugle entend.
//
//  Usage :  node tests/fidelite.js        →  doit afficher « Tout tenu. »   (exit 0)
//  Requiert puppeteer.
// ═════════════════════════════════════════════════════════════════════════════════════
"use strict";
const path = require("path");
const puppeteer = require("puppeteer");

const CIBLE = "file://" + path.resolve(__dirname, "..", "app_mockup.html");
const T = [];
let echecs = 0;

function tenu(nom, ok, detail) {
  T.push({ nom, ok, detail });
  if (!ok) echecs++;
}

// ── observables, sans une seule sonde plantée dans l'app ────────────────────────────
const attendre = ms => new Promise(r => setTimeout(r, ms));

// longueurs d'arc des cinq chemins de label = signature de la forme des boucles
const boucles = pg => pg.$eval("#labels", e =>
  [...e.querySelectorAll("path")].map(p => +p.getTotalLength().toFixed(3)));

// ce que l'œil désigne — tel qu'un lecteur d'écran l'entend
const designe = pg => pg.$eval("#pt", e => e.getAttribute("aria-label") || "");

const depots = pg => pg.$$eval("ul.fil li:not(.creux)", ns => ns.map(li => ({
  texte: li.querySelector(".depot").textContent,
  attr:  (li.querySelector(".attr") || {}).textContent || ""
})));

const champ = pg => pg.$("#txt");
// l'épaisseur du fil, lue sur le contour du ruban (déterministe sous `reduce`).
// On attend que le morph d'ouverture ait fini de s'établir : `SET.w` s'interpole vers `wData`
// pendant que le nœud se déplie, et une lecture prise sur ce bord vaut un transitoire, pas un
// état. On ne dort pas un temps magique : on lit jusqu'à ce que deux lectures coïncident.
async function fil(pg) {
  let a = await pg.$eval("#filR", e => +e.getTotalLength().toFixed(1));
  for (let i = 0; i < 30; i++) {
    await attendre(120);
    const b = await pg.$eval("#filR", e => +e.getTotalLength().toFixed(1));
    if (b === a) return b;
    a = b;
  }
  throw new Error("le fil ne se stabilise pas");
}
// Un cran vaut +36 % de contour (8118 → 11033). Une dérive de rendu vaut moins de 1 %.
// `f1 > f0` — ce que ce banc exigeait — était satisfait par 8 unités de poussière : le contrôle
// certifiait « le fil répond » là où la doctrine dit « le fil monte D'UN CRAN, franchement ».
// Un contrôle positif plus mou que sa prose est un contrôle positif faux.
const CRAN = 1.10;
const strate = (pg, s) => pg.click(`#switch button[data-s="${s}"]`);

// clic sur une boucle : coordonnées relatives au SVG du nœud
async function tenirBoucle(pg, fx, fy) {
  const b = await pg.$eval("#knot", el => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
  await pg.mouse.click(b[0] + b[2] * fx, b[1] + b[3] * fy);
  await attendre(700);
}
const relacher = pg => tenirBoucle(pg, 0.5, 0.5);   // le centre : l'œil se délie

(async () => {
  const nav = await puppeteer.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const pg = await nav.newPage();
  const erreurs = [];
  pg.on("pageerror", e => erreurs.push(e.message));
  await pg.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await pg.setViewport({ width: 1180, height: 920 });
  await pg.goto(CIBLE, { waitUntil: "networkidle0" });
  await attendre(1200);

  // ══ CONTRÔLES POSITIFS — sans eux, les impossibilités ne prouvent rien ═════════════

  const avant = await depots(pg);
  tenu("§ le fil des dépôts est rendu", avant.length > 0, `${avant.length} dépôts`);

  // C1 — un dépôt rejoint le fil, et il porte son auteur et son heure (§5 : la signature EST l'acte)
  const MOT = "Il a reparlé de l’atelier, au présent.";
  await pg.type("#txt", MOT);
  await pg.click("#btDep");
  await attendre(500);
  const apres = await depots(pg);
  const mien = apres.find(d => d.texte === MOT);
  tenu("C1 · le dépôt rejoint le fil", apres.length === avant.length + 1);
  tenu("C1 · il porte auteur et heure",
       !!mien && /\S/.test(mien.attr) && /\d/.test(mien.attr), mien && mien.attr);

  // C2 — le champ vide est refusé, et RIEN ne l'explique (§8 : pas de glose)
  await pg.type("#txt", "   \n  ");
  await pg.click("#btDep");
  await attendre(300);
  tenu("C2 · le champ blanc est refusé", (await depots(pg)).length === apres.length);
  await pg.$eval("#txt", e => (e.value = ""));

  // C-FIL — le dépôt épaissit le fil, par crans francs. SANS CE CONTRÔLE, I1 se dirait d'une
  //      interface où RIEN ne se passe au dépôt : « aucune boucle ne bouge » serait vrai d'une
  //      page morte. On l'a vérifié en mutant `majFil()` — le banc passait au vert. Le voici.
  //      On mesure sur `?nu`, le patient nu : le seul écran où l'outil n'a rien à dire.
  const pgN = await nav.newPage();
  await pgN.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await pgN.setViewport({ width: 1180, height: 920 });
  await pgN.goto(CIBLE + "?nu", { waitUntil: "networkidle0" });
  await attendre(1200);

  tenu("I2 bis · sur patient nu, l'œil ne désigne rien avant même qu'on tienne une boucle",
       (await pgN.$eval("#pt", e => e.getAttribute("aria-label"))) === null);

  const f0 = await fil(pgN);
  const deposer = async t => { await pgN.type("#txt", t); await pgN.click("#btDep"); await attendre(320); };
  await deposer("Première note.");
  const f1 = await fil(pgN);
  tenu("C-FIL · le premier dépôt fait monter le fil d'un cran", f1 > f0 * CRAN,
       `${f0} → ${f1}  (×${(f1 / f0).toFixed(3)}, seuil ×${CRAN})`);

  await deposer("Deux."); await deposer("Trois."); await deposer("Quatre.");
  const f2 = await fil(pgN);
  tenu("C-FIL · le quatrième le fait monter du second", f2 > f1 * CRAN,
       `${f1} → ${f2}  (×${(f2 / f1).toFixed(3)}, seuil ×${CRAN})`);

  for (let i = 0; i < 10; i++) await deposer("note " + i);
  const f3 = await fil(pgN);
  // I6 — le quatrième cran n'appartient pas à la récolte. Un dossier « fourni » n'est pas un
  //      dossier gros : c'est un dossier métabolisé. La quantité ne peut pas se faire passer
  //      pour du travail.
  tenu("I6 · le fil sature à la récolte : pas de quatrième cran", f3 === f2, `14 dépôts, contour ${f3}`);
  await pgN.close();

  // I7 — le champ ne se PRÉSENTE pas. §8 : « le jour où un champ a besoin d'un texte d'aide
  //      pour être compris, c'est le champ qui est mal fait. » Cela vise la GLOSE, jamais
  //      l'AMORCE : « l'indice ouvre un geste, il ne livre jamais une conclusion. »
  //      « Ce qui a été vu, entendu, rapporté » ouvre un geste. « Saisissez ici votre
  //      observation dans ce champ » explique le widget, et prouve qu'il est raté.
  //      On interdit donc le vocabulaire qui parle de l'interface, pas le vocabulaire qui parle
  //      du soin. Et aucun <label> : le champ n'a personne pour le présenter.
  const GLOSE = /\b(champ|saisi|saisiss|entrez|tapez|ici|cliquez|remplis)/i;
  const amorce = await pg.$eval("#txt", e => e.placeholder || "");
  tenu("I7 · le champ ne se présente pas", amorce.length > 0 && !GLOSE.test(amorce), amorce);
  tenu("I7 · personne ne présente le champ", (await pg.$$("label")).length === 0);

  // ══ IMPOSSIBILITÉS ════════════════════════════════════════════════════════════════

  // I1 — aucune boucle ne bouge sans qu'une passe ait tourné.
  //      « On sait davantage, on ne l'a pas encore rangé. » Le Goodhart meurt là :
  //      on ne peut pas engraisser une boucle en écrivant.
  const g0 = await boucles(pg);
  await pg.type("#txt", "Sa sœur a rappelé ce matin.");
  await pg.click("#btDep");
  await attendre(600);
  const g1 = await boucles(pg);
  tenu("I1 · aucune boucle ne bouge au dépôt", JSON.stringify(g0) === JSON.stringify(g1));

  // I2 — l'œil se tait sur un patient nu. Aucune passe → aucune densité → `angleMort()` renvoie
  //      −1 : il n'y a pas d'angle mort quand tout l'est. Tenir une boucle ne lui fait rien
  //      désigner. Le silence de l'outil est une position (§15).
  await tenirBoucle(pg, 0.5, 0.20);            // boucle du haut
  tenu("I2 · l'œil ne désigne rien sur patient nu", (await designe(pg)) === "");

  // I3 — le champ n'existe pas dans un lobe tenu.
  //      ON LIT PAR AXE, ON ÉCRIT AU NŒUD. Si le champ vivait dans un lobe, choisir la
  //      boucle serait choisir l'axe : l'axe serait déposé, l'invariant 20 mourrait.
  //      Garde tenue par ABSENCE DE CHEMIN, pas par une règle.
  tenu("I3 · aucun champ dans un lobe tenu", (await champ(pg)) === null);

  // I4 — une boucle tenue ne rend que du VERBATIM.
  //      On n'affirme RIEN sur l'axe où la portion est rangée : ce serait certifier `LEX`.
  //      On exige seulement que chaque portion soit une sous-chaîne exacte d'un dépôt réel.
  await relacher(pg);
  await strate(pg, 1);                          // ouvrir la métabolisation PAIE la passe
  await attendre(1400);
  await strate(pg, 2);
  await attendre(1400);
  const source = (await depots(pg)).map(d => d.texte);
  await tenirBoucle(pg, 0.5, 0.20);
  const portions = await pg.$$eval("ul.fil li:not(.creux) .depot", n => n.map(e => e.textContent));
  const verbatim = portions.length > 0 && portions.every(p => source.some(s => s.includes(p)));
  tenu("I4 · la boucle tenue ne rend que du verbatim", verbatim,
       `${portions.length} portions, toutes sous-chaînes exactes`);

  // I5 — un fragment à deux axes est UN croisement, pas deux cases cochées.
  const croises = await pg.$$eval("ul.fil li .croise", n => n.length);
  const doublons = portions.length !== new Set(portions).size;
  tenu("I5 · un fragment à deux axes est un seul croisement", !doublons,
       `${croises} croisement(s) annoncé(s), aucune portion dupliquée`);

  // ══ CONTRÔLE POSITIF FINAL — la passe existe, sinon I1 est vide ═══════════════════

  // C3 — ouvrir le trilobe déplie les boucles. Sans lui, « rien ne bouge » se dit d'une
  //      interface morte.
  tenu("C3 · la passe déplie les boucles", JSON.stringify(g1) !== JSON.stringify(await boucles(pg)));

  // C4 — et une fois la matière rangée, il désigne. Sans ce contrôle, I2 se dirait d'un œil mort,
  //      d'un `aria-label` jamais écrit, ou d'un sélecteur qui ne trouve rien.
  const dit = await designe(pg);
  tenu("C4 · l'œil désigne une fois qu'il y a de quoi", /^l’œil se tourne vers \S+/.test(dit), dit);

  // C5 — et il ne désigne jamais la boucle qu'on tient : on ne cherche pas où l'on regarde.
  tenu("C5 · il ne désigne pas la boucle tenue", !dit.includes(await pg.$eval(".rtag b", e => e.textContent)), dit);

  tenu("§ aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
  await nav.close();

  // ── verdict ──────────────────────────────────────────────────────────────────────
  for (const t of T) console.log(`${t.ok ? "  tenu " : "  ROMPU"} — ${t.nom}${t.detail ? "   (" + t.detail + ")" : ""}`);
  if (echecs) { console.error(`\n${echecs} rompu(s).`); process.exit(1); }
  // Le verdict ne dit QUE ce qu'il a vu. « Tout tenu » se lirait de l'app entière, alors que le
  // banc ne touche que la récolte : le trilobe et le bilobe sont des cartons, et un banc qui
  // certifie un carton est pire qu'un banc absent.
  console.log("\nRécolte tenue.");
  console.log("Non couverts : métabolisation (trilobe), institutionnel (bilobe), dictée.");
})().catch(e => { console.error("banc en erreur :", e.message); process.exit(1); });
