# mockup — prototype visuel CONTINUUM (nœud · œil · scouter)

Prototype du fil vrillé (le **nœud**), de l'**œil** (le point rouge qui veille) et du **scouter**
(visière de scrutin qui se déploie sur le lobe Vigilante). Un seul mockup, tout intégré ; ce README
dit **où sont les molettes** pour régler plus tard.

Ce mockup est aussi la **source testée du CORE géométrique** : sa géométrie (entre les marqueurs
`/*==CORE==*/` … `/*==/CORE==*/`) est la vérité de la marque, validée à chaque run (voir **Tests**).

## Fichiers

- `continuum_mockup.html` — **le mockup** : géométrie du nœud (2/3/5 lobes vrillés), l'œil et sa
  signalétique Vigie, le dashboard, le scouter intégré, + un **atelier tracé/œil** (panneau de
  curseurs). Le CORE géométrique vit entre `/*==CORE==*/` et `/*==/CORE==*/`.
- `run_test.sh` — extrait le CORE du mockup et le passe à `testvrille.js`. Le mockup et son test **ne
  se séparent jamais** (le script lit `continuum_mockup.html` dans son propre dossier).
- `testvrille.js` — valide la géométrie : croisements 1/3/5, premier nœud au sommet, lobes
  d'étendues inégales (asymétrie), douceur de la vrille (pas de pincement au nœud), morphose sans NaN.
- `scouter/atelier_scouter.html` — atelier de réglage de la **forme** du scouter (curseurs + bouton
  « copier les réglages »). Outil de calage : les valeurs se reportent à la main dans le mockup.
- `scouter/scouter_clean.svg` — l'asset visière source (original éditable). L'art est déjà intégré
  au mockup.

## Tests

```
cd mockup && sh run_test.sh        →  doit afficher « Tout vert. »
```

`core.js` (extrait du mockup) et `xv_*.svg` (rendus de contrôle) sont **dérivés** — gitignorés,
jamais commités.

## Où régler — carte des molettes

### Tracé / œil — panneau atelier dans `continuum_mockup.html`
`rW` épaisseur · `rG` réserve · `rD` données (patient) · `rP` point · `rIris` iris · `rR` rouge ·
`rI` encre · `rB` bec · `rC` contraste.

### Animations de l'œil — constantes dans le render de `continuum_mockup.html`
- spin : 6°/s (`spinAcc += 0.096`), **gelé** pendant l'interro et le scrutin
- retournement au clic : `flipDur = 1.7` (2 tours)
- corde à sauter (entrée/sortie de boucle) : `moveDur = 0.62`
- navette du scrutin : période `2.2` s
- gestes ponctuels : `bounceDur` (1.3 interro « appel » · 0.7 notif « ping »)
- coup d'œil angle-mort : ~13 s (`sin(T*0.5)`)
- inactivité : `IDLE_IN = 14`

### Scouter — forme : atelier `scouter/atelier_scouter.html`
Curseurs : `size` · `posX` · `posY` · `orient` · `depth` (écrasement H ensemble) ·
`montS`/`montT` (dimension/charnière monture) · `ancS`/`ancT`/`ancDep` (dimension/charnière/écrasement
boîtier) · `tintO` (teinte lentille). Le bouton « copier les réglages » donne les valeurs à reporter
dans le mockup.

### Scouter — animations : `SCOUT{}` dans le render de `continuum_mockup.html`
`size` · `posX` · `posY` · `dur` (durée du rabat) · `oriMin`/`oriMax` (bornes du sway
d'orientation) · `montRest` (angle monture posée) · `flipFrom` (angle monture relevée au départ).
Sway continu de l'ensemble : `sin(T*0.45)`.

## Réglages figés actuels

- Dashboard : boucle **Vigilante = la plus grande, à droite** (`ASYM[3].s = [0.97, 1.12, 0.90]`,
  dans le CORE — testé vert), `DASH_MODE = ['compose','read','compose']` (read = Vigilante = boucle
  de droite, index de tri 1 ; le tri des nœuds top→droite→gauche interdit droite ET index 2).
- Œil dans le dashboard : se pose **dans le corps de la boucle** (`dashBary`, facteur 2.25), et passe
  **sous le fil** au retour au centre (calque `#eyeG` réordonné pendant l'animation `under`).
- Scouter : `size 0.66`, lentille `fill-opacity 0.70`, rabat `flipFrom 50 → montRest −2` en `dur 0.7`,
  sway d'orientation `[−1, +12]`. N'apparaît que sur la boucle Vigilante, une fois le tournoiement du
  clic terminé (~1.7 s).

## Montages historiques (scrutin, puis scouter)

Le **scrutin** (navette du regard entre les deux lobes de composition, gel du spin, `DASH_MODE` read)
et le **scouter** (visière) sont **intégrés** au mockup — plus aucun patch à exécuter. Ils avaient été
greffés chirurgicalement, chacun par un script auto-vérifiant qui **ne touchait jamais le CORE** :
`patch_trilobe_scrutin.py` (scrutin, version d'origine à `read` index 2) puis `patch_scouter.py`
(visière). Ces scripts restent dans l'historique git si un jour il faut re-greffer sur une nouvelle
base. Points d'ancrage du scouter : **(0)** `<defs>` — masque `#scLensHole` + clips + art `#scoutArt` ;
**(1)** markup `#scouter` (ancrage statique + `#scMonture`) ; **(2)** refs `scouterG` + `montureG` ;
**(3)** `SCOUT{}` ; **(4)** render — rabat d'entrée + sway, sous condition `scouting`.

## Note technique

`ptIris` (l'iris) est déclaré explicitement dans le bloc de refs — **ne pas le retirer** : sans lui,
le render lève un `ReferenceError` avant le bloc scouter dans les environnements sans accès nommé
(`window.ptIris`), et le scouter cesse d'apparaître.
