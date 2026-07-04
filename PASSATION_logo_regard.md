# PASSATION — CONTINUUM · logo vivant (le nœud, le fil, le regard)

*Session « regard / œil / pupille ». Français partout. Fait suite aux sessions : résolution CO≡nœud, asymétrie, inversion typo, police-fil, fil à 10.*

---

## 0. Ce qu'il faut savoir en une phrase

Le point rouge du logo est devenu **un œil vivant** : un globe 3D qui tourne, une pupille projetée sur la sphère, un clignement par rétraction, un reflet à lumière propre. Et deux **mécaniques porteuses de sens** ont été posées : **l'épaisseur du fil = la quantité de données** (en vue patient), **la taille de l'œil = l'intensité de l'attention** (grossit quand on déploie une boucle).

Livrable unique et vivant : `continuum_mockup_v2.html` (≈ 54 ko, autonome, aucune dépendance).

---

## 1. Fichiers à committer

- **`continuum_mockup_v2.html`** — le mockup vivant (LE livrable, à jour). Contient tout : CORE géométrique entre `/*==CORE==*/ … /*==/CORE==*/`, script complet, atelier de réglage, export SVG.
- `police_fil_NTINUUM.svg` — preuve vectorielle de la police-fil (NTINUUM tracé au fil du nœud). *(session antérieure, toujours valide)*
- `revision_doctrine_typo.md` — patch doctrinal serif → linéale monolinéaire (§20). *(session antérieure)*
- `PASSATION_logo_regard.md` — ce document.

**Message de commit suggéré :**
`logo vivant : œil 3D (globe/pupille/clignement/reflet à lumière propre), épaisseur=données en vue patient, taille d'œil=attention, rotation continue, curseurs couleur contraints, regard+bec suivent la souris`

Vérifs passées avant commit : `node --check` (OK), suite `testvrille.js` (Tout vert), chargement headless en exerçant tous les curseurs + vues + déploiement + export (**0 erreur** console/page).

---

## 2. Le système du regard (cœur de la session)

Tout est dans la boucle `render()` du script (après le CORE).

### 2.1 Globe 3D
- Le point rouge (`#pt`) est le **globe oculaire** : ombré mat sphérique via le dégradé `#ptSphere` (dérivé de la couleur rouge courante, cf. §4). **Pas de spéculaire brillant** (piège du « nez de clown » écarté plusieurs fois).
- Un **halo papier** (`#ptHalo`, r = 1.10·rayon, couleur `#E9ECEF`) est posé **derrière** le globe : c'est le « filet » de séparation d'avec le fil. Choix clé : **couleur papier, pas blanc** — il est invisible sur le fond et n'apparaît que là où il faut, entre l'œil et le fil sombre. (Le blanc pur ferait un contour-autocollant, le plus clair de la marque.)

### 2.2 Pupille = marque SUR la sphère
- `#ptPup` est une **ellipse** : la pupille est une marque à la surface du globe. Direction de regard `(gx,gy)`, profondeur `gz = √(1−gx²−gy²)`.
- Elle se **déplace** (`cxp = P + gx·rayon`), se **comprime** en ellipse vers le bord (raccourci `rx = pupR·gz`), tourne (`atan2(gy,gx)`), et se fait **rogner par le limbe** (clip `#ptClip` = cercle du globe qui suit `P`).
- **Dilatation** exagérée pour être visible : `breath = 1 + 0.24·sin(T·0.7)`.
- **Arbitrage tranché** : ni (a) pupille qui glisse sur un disque plat (= œil *googly* 2D), ni (b) globe uni qui tourne (invisible car lisse) — mais **l'union** : la pupille EST la surface qui rend la rotation visible, via le raccourci.

### 2.3 Clignement par rétraction (pas de paupière)
- Facteur `bf` ∈ [0,1] multiplie `rx,ry` : la pupille se **ferme d'un coup jusqu'à disparaître** puis rouvre (fermeture ~0.34·durée, ouverture le reste ; `blinkDur = 0.3 s`).
- Autonome toutes les `2.2 + rand·3.6 s`, **et au clic** sur le regard (`blinkStart=T` dans le handler `knotSvg` click).

### 2.4 Reflet (catchlight) — état FINAL après plusieurs itérations
Historique des rejets (à ne pas refaire) : reflet **fixe** décollé (« bizarre »), reflet **collé** à la pupille (« mini-pupille blanche »), **halo flou dégradé** (« pas dans la DA »), **arc-trait** et **croissant** (essayés, nets, valides — code `crescD` encore présent mais inutilisé).

**État actuel = rond, petit, à lumière PROPRE et fixe :**
- Le reflet a son **éclairage propre** : `reflBase = 3.93 rad` (haut-gauche) + dérive douce `0.14·sin(T·0.09)`. **Indépendant de la souris et du bec.**
- Il est **fixe à l'écran même quand l'œil tourne** : angle local `la2 = reflLight − spinRad` (comme un point spéculaire sur une bille qui tourne : il reste immobile).
- Il ne suit la pupille qu'à **15 %** (`gx·rayon·0.15`) : couplage minime — c'est la **pupille qui glisse dessous**, pas la lumière qui court après le curseur. (Optique juste : source extérieure fixe.)
- Rayon `pupR·0.34`, s'éteint au clignement (`opacity = 0.95·bf`).

> **Leçon retenue** (l'utilisateur l'a formulée) : *le regard suit la souris, mais la lumière du reflet n'a aucune raison physique de la suivre.* Ne jamais re-lier le reflet au curseur/bec.

### 2.5 Taille de l'œil = intensité de l'attention (MÉCANIQUE SÉMANTIQUE)
- Neutre `EYE = 2.1` (curseur « point », 0.8–2.8).
- Facteur dynamique `eyeK` (lissé) : `1 + survol(0.05) + boucle_déployée(0.20) + clickPulse(0.15 décroissant)`.
- **Grossit quand on déploie une boucle en vue patient** (`ptParked !== null`) → *on concentre le regard sur la boucle ouverte*. C'est l'usage principal ; le survol/clic donnent le vivant partout.
- `ptRad = 8.5·EYE·eyeK` recalculé **chaque frame** (le point/halo/clip/pupille/reflet en dépendent).

---

## 3. Rotation continue (flottement)
- Le nœud (`#grp`) tourne **360° en boucle continue**, lent : `spinDeg = (T·6) % 360` → ~60 s/tour. Remplace l'ancien balancement sinusoïdal.
- **Labels contre-rotés** (`rotate(−spinDeg, x, y)`) : ils orbitent mais restent **droits et lisibles**.
- Sens du geste (validé par l'utilisateur) : *le sens n'importe pas tant que c'est cohérent* → renforce le flottement.
- Le reflet et la nervure du bec restent **fixes à l'écran** malgré la rotation (compensation `− spinRad`), métaphore « plume fixe, papier qui tourne ; lumière extérieure fixe ».

---

## 4. Couleurs — curseurs CONTRAINTS (la cohérence est tenue par le code)
- **Rouge** (`RED_STOPS`, curseur « rouge ») : rampe du **sanctuaire** uniquement — `#781A28` (grave) → `#8E1C2B` (bordeaux) → `#A62A38` (carmin) → `#B23A44` (carmin chaud). Jamais corail, jamais alarme, jamais délavé. Le dégradé du globe `#ptSphere` se recalcule depuis la couleur choisie (`applyRedGrad`). **Préférence utilisateur : curseur au max (carmin chaud).**
- **Encre** (`INK_STOPS`, curseur « encre ») : rampe élargie **du quasi-noir au gris graphite** — `#0E1014 → #15191E → #2A2F38 → #474D57 → #6A6F79`. *Une seule encre* : pousser le curseur éclaircit fil **+** wordmark **+** texte (c'est le même noir doctrinal ; aux valeurs claires tout blanchit, y compris l'atelier — c'est voulu/assumé).
- Précision doctrinale posée : **le rouge n'est pas « la couleur du soin » mais celle de l'intouchable/sanctuaire** (le nouage). La question « bordeaux dramatique ? » se reformule en « le sanctuaire porte-t-il la gravité ou la vie ? » → le carmin gagne le vivant sans tomber dans l'alarme (un rouge trop clair fait *œil injecté de sang*).
- CSS `--red` définie (elle était utilisée mais absente — bug latent corrigé).

---

## 5. Épaisseur du fil = quantité de données (MÉCANIQUE SÉMANTIQUE)
- **Interface & Dashboard** : épaisseur **fixe = 12** (`wFixed`, curseur « épaisseur fixe », 6–16).
- **Vue patient** : épaisseur **pilotée par les données** — fin quand peu de données, épais (**14 max**) quand beaucoup. Curseur « données (patient) » (`wData`, mappe 0–100 → 6–14). Dans le vrai produit, ce serait la **densité réelle du dossier**.
- Transition fluide dashboard→patient : `SET.w = wFixed + (wData − wFixed)·smooth(currentS − 1)`.
- **Découplage propre** : les marques figées (wordmark/lockup/favicon) utilisent **`wFixed`** (via `refreshStatics` qui force `SET.w = wFixed`), jamais la dynamique du live. L'export « figer l'état » reprend l'épaisseur du moment.

---

## 6. Souris — le regard et le bec suivent le curseur
- `pointerActive` + `cursorAngle` mis à jour au `mousemove` sur `#knot` (retour au repos au `mouseleave`).
- **Regard** : la pupille se tourne vers le curseur (cible `(cos,sin)(cursorAngle − spinRad)·0.62`, lissée), sinon dérive autonome.
- **Bec** (nervure calligraphique) : `aimScreen` suit le curseur, `SET.nib = aimScreen − spinRad` (repère local, compense la rotation). Au repos, revient au `nibBase` (curseur « bec », 0–360°, défaut 225°) + dérive douce.
- **Le reflet, lui, NE suit PAS** (cf. §2.4).

---

## 7. Atelier de réglage (« se règle à l'œil »)
Curseurs/switchs présents : plume (constante/vivante) · **épaisseur fixe** (12) · réserve (1.8) · **données patient** (→14) · **point** (2.1, = taille d'œil neutre) · regard (plat/pupille) · **rouge** (pastille) · **encre** (pastille) · **bec** (225°) · contraste (2.00, plume-only) · **Figer l'état → SVG** (export).
- **Valeurs par défaut retenues cette session** : contraste **2.00**, point/œil **2.1**, bec **225°**, rouge au max souhaité, épaisseur fixe **12**.
- ⚠️ **À GRAVER quand l'utilisateur aura arrêté ses valeurs** : il a dit vouloir le rouge au max, l'encre à définir, contraste 2.00. Lui redemander les valeurs exactes de `rouge`/`encre`/`bec` au repos puis fixer les défauts dans `SET`/`RED_STOPS default`/`nibBase`.

---

## 8. Invariants doctrinaux tenus
- Fil unique fermé, jamais coupé. Un seul point rouge (fonctionnel : se pose sur un nœud en vue patient).
- Soin/sanctuaire distingué **mécaniquement**, jamais seulement chromatiquement.
- Rouge = intouchable/sanctuaire (le nouage). Encre = la ligne de continuité (colonne vertébrale).
- **Décision tenue sur le fil** : garder l'encre **plate** ; la texture a échoué partout (elle doit *signifier*, jamais décorer) ; ne pas la re-tenter.
- DA plate/linéaire : tout est trait monoline (bouts ronds) ou aplat net. **Aucun flou** (rejeté explicitement).
- `refreshStatics` rebranche wordmark (lettres-fil) + lockup + favicons + `refreshPoint`. Repli NT. intact. Lockup `∞NT · CONT`.

---

## 9. À inscrire dans la doctrine (presentation.md / CONTINUUM.md) — NON ENCORE FAIT
L'utilisateur a signalé que ces mécaniques sont désormais **porteuses de sens**, pas décoratives. À formaliser :
1. **Le regard / la pupille** comme objet doctrinal, au même titre que le nouage : *le point rouge est un regard qui se pose sur le nouage* ; le rouge = iris = sanctuaire.
2. **Épaisseur du fil = combien on sait du patient** (données du dossier). Fine = peu ; épaisse (14) = beaucoup.
3. **Taille de l'œil = où se pose le soin / l'attention** ; grossit sur la boucle qu'on déploie (concentration).
4. **Reflet = lumière extérieure fixe** : l'œil regarde (suit), mais la lumière ne se déplace pas — le soin est éclairé du dehors, pas par ce qu'il fixe.
5. Rappel : patch typo serif→linéale déjà livré (`revision_doctrine_typo.md`) ; exergue reste le seul serif (voix éditoriale) — à trancher un jour.

---

## 10. Horizon (chantiers confirmés, non codés)
- **Asymétrie calculée / sémantique** : la taille de chaque **lobe** encode l'intensité du recours par axe (familial/amoureux/ami/travail/soin) → le logo devient la vue patient miniature. *La logique data→géométrie est déjà en place (cf. §5) — à réutiliser.*
- **Fibres de l'iris** révélées à la dilatation franche (clic pour déployer les données/ressources externes d'une boucle).
- **Expressions de pupille** pilotées par l'état clinique de l'axe (table `EXPRESSIONS` du fichier `LogoEmber.tsx` : focus/ouverture/gravité…).
- **Police-fil complète** (C, O, alphabet) pour « CONTINUUM » en toutes lettres / « Le Collègue ».

---

## 11. Protocole & garde-fous pour la prochaine instance
- **Attention à la limite d'images** : cette session a été fermée parce qu'on approchait la limite de génération d'images de l'instance. Pour vérifier sans consommer d'images : `node --check`, `testvrille.js`, et **chargement headless Puppeteer en capturant seulement `pageerror`/`console.error`** (pas de screenshot). Ne rendre/afficher une image que quand c'est indispensable à un arbitrage visuel.
- Repartir du CORE : extraire via `re.search(r'/\*==CORE==\*/(.*?)/\*==/CORE==\*/', html, re.S)`.
- Mode de travail attendu : partenaire de pensée, tenir la position, lire les sources en entier, livrer des fichiers propres, français partout. L'utilisateur tranche les arbitrages identitaires (couleur, doctrine) ; proposer, montrer, ne pas imposer.
