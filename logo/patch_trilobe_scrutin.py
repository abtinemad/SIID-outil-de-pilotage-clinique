#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Patch mockup — continuum_mockup.html — trilobe (métabolisation) : signalétique du scrutin.
  (1) DASH_MODE : ['compose','compose','compose'] -> ['compose','compose','read']  (Q2)
  (2) gel du spin quand l'œil entre dans la boucle Vigilante (read)               (scouter)
  (3) navette du regard entre les DEUX lobes de composition, tenus à l'écart,      (Q1)
      jamais un milieu — remplace la lecture-page par la lecture de l'écart.

Sur le patron d'inscrire_bloc_B.py. Auto-vérifiant : chaque ancre EXACTEMENT une fois.
Anti-double-application. Le CORE (marqueurs /*==CORE==*/ .. /*==/CORE==*/) n'est PAS touché
(toutes les éditions sont après, dans render()). Ne commit pas, ne push pas.

DRY-RUN PAR DÉFAUT : imprime ancres + diff unifié, N'ÉCRIT RIEN.
Pour graver :  python3 patch_trilobe_scrutin.py --write
Lance-le depuis logo/ (là où est continuum_mockup.html).
"""
import sys, os, difflib

WRITE = "--write" in sys.argv
F = "continuum_mockup.html"
if not os.path.exists(F):
    sys.exit("continuum_mockup.html introuvable — lance depuis le dossier logo/.")

# ---- (1) DASH_MODE ----
O1 = ("  var DASH_MODE=['compose','compose','compose'];   // mode une fois DANS le lobe : "
      "composer (Affectif/Réflexif) vs lire (Vigilante) — assignation loop→nœud à figer avec "
      "la doctrine")
N1 = ("  var DASH_MODE=['compose','compose','read'];   // mode une fois DANS le lobe (§19, bloc B) : "
      "composer (Affectif, Réflexif) / lire (Vigilante). Vigilante = index 2 (ordre doctrinal, "
      "pas de surplomb). Entrer dans le lobe read → scrutin (scouter).")

# ---- (2) gel du spin (les deux lignes ensemble) ----
O2 = (
    "    var interroLock = (Math.round(currentS)===1 && eyeState==='interro' && !flipping);"
    "   // INTERRO : on fige le nœud et on accroche l'œil dessus\n"
    "    if(!reduce && !interroLock) spinAcc += 0.096;                                        "
    "// 6°/s — gelé pendant l'interro (il s'arrête, il ne tourne plus)"
)
N2 = (
    "    var scouting = (Math.round(currentS)===1 && dashLobe>=0 && DASH_MODE[dashLobe]==='read'"
    " && !flipping);   // SCOUTER : entré dans la boucle Vigilante (read) → l'œil scrute, spin gelé (il se gare)\n"
    "    var interroLock = (Math.round(currentS)===1 && eyeState==='interro' && !flipping);"
    "   // INTERRO (démo atelier) : on fige le nœud et on accroche l'œil dessus\n"
    "    if(!reduce && !interroLock && !scouting) spinAcc += 0.096;                            "
    "// 6°/s — gelé pendant l'interro OU le scrutin (l'œil s'arrête pour scruter)"
)

# ---- (3) branche de regard : navette du scouter (insérée avant _interroPose) ----
O3 = ("      } else if(_interroPose){                               // POSTURE INTERROGATIVE : "
      "APPEL (3 sauts + darts assertifs) puis SCRUTIN (lecture saccadée de l'utilisateur)")
BRANCH = (
    "      } else if(scouting){                                   // SCOUTER (lobe Vigilante) : navette entre les deux nœuds de composition — l'écart montré, tenus à l'écart, JAMAIS un milieu (Q1)\n"
    "        var _vnd=nodesic(), _vc0=-1, _vc1=-1;\n"
    "        for(var _vq=0;_vq<DASH_MODE.length && _vq<_vnd.length;_vq++){ if(DASH_MODE[_vq]==='compose'){ if(_vc0<0)_vc0=_vq; else _vc1=_vq; } }\n"
    "        if(_vc0>=0 && _vc1>=0){\n"
    "          var _va0=Math.atan2(_vnd[_vc0][1]-P[1], _vnd[_vc0][0]-P[0]);   // direction (repère local) vers un lobe de composition\n"
    "          var _va1=Math.atan2(_vnd[_vc1][1]-P[1], _vnd[_vc1][0]-P[0]);   // vers l'autre\n"
    "          var _vT=Math.max(0,(T-moveT)-moveDur);                        // temps depuis que l'œil est assis (après la corde à sauter)\n"
    "          var _vU=(_vT%2.2)/2.2, _vP0=_vU<0.5;                          // aller-retour, période 2.2 s ; un demi-cycle par pôle\n"
    "          var _vSub=(_vU%0.5)/0.5, _vSeg=_vSub<0.78?0:(_vSub-0.78)/0.22; // fixation (78 %) puis saccade rapide — jamais de repos au milieu\n"
    "          var _vFrom=_vP0?_va0:_va1, _vTo=_vP0?_va1:_va0;\n"
    "          var _vD=Math.atan2(Math.sin(_vTo-_vFrom),Math.cos(_vTo-_vFrom)); // écart signé le plus court\n"
    "          var _vAng=_vFrom+_vD*smooth(_vSeg);\n"
    "          var _vJit=0.014*Math.sin(_vT*44)*(1-_vSeg);                   // micro-nystagmus pendant la fixation seulement\n"
    "          rgx=Math.cos(_vAng)*0.34+_vJit; rgy=Math.sin(_vAng)*0.34+_vJit*0.6;\n"
    "          var _vR2=Math.min(0.5,rgx*rgx+rgy*rgy); gzv=Math.sqrt(1-_vR2);\n"
    "        }\n"
)
N3 = BRANCH + O3

ops = [
    ("(1) DASH_MODE → read (Q2)", O1, N1),
    ("(2) gel du spin en scrutin (scouter)", O2, N2),
    ("(3) navette du regard entre les deux lobes compose (Q1)", O3, N3),
]

c = open(F, encoding="utf-8").read()
orig = c

# 1) vérifs dures — ancres uniques AVANT toute écriture
errs = [f"  ✗ [{l}] ancre trouvée {c.count(o)} fois (attendu 1)" for l, o, _ in ops if c.count(o) != 1]
if errs:
    print("ARRÊT — ancres non uniques, aucune écriture :"); print("\n".join(errs)); sys.exit(1)

# 2) anti-double-application
for marker in ["var DASH_MODE=['compose','compose','read']",
               "var scouting = (Math.round(currentS)===1",
               "} else if(scouting){"]:
    if marker in c:
        sys.exit(f"ARRÊT — semble déjà appliqué (« {marker[:44]}… » présent). Aucune écriture.")

# 3) garde CORE : les ancres ne doivent PAS tomber dans le CORE
core_a, core_b = c.index("/*==CORE==*/"), c.index("/*==/CORE==*/")
for l, o, _ in ops:
    pos = c.index(o)
    if core_a <= pos <= core_b:
        sys.exit(f"ARRÊT — l'ancre [{l}] tombe DANS le CORE (pos {pos} ∈ [{core_a},{core_b}]). Aucune écriture.")

# 4) application (mémoire)
for label, old, new in ops:
    assert c.count(old) == 1, f"régression d'unicité sur [{label}]"
    c = c.replace(old, new, 1)

# CORE identique octet pour octet ?
def core(s):
    a = s.index("/*==CORE==*/"); b = s.index("/*==/CORE==*/")
    return s[a:b]
core_intact = core(orig) == core(c)

print("Ancres (uniques, hors CORE) :")
for l, _, _ in ops:
    print(f"  ✓ [{l}]")
print(f"\nCORE intouché : {'OUI' if core_intact else 'NON — ANOMALIE'}")
print(f"Δ caractères = {len(c)-len(orig):+d}\n")

diff = difflib.unified_diff(
    orig.splitlines(keepends=True), c.splitlines(keepends=True),
    fromfile="continuum_mockup.html (avant)", tofile="continuum_mockup.html (après)", n=3,
)
sys.stdout.writelines(diff)

if not core_intact:
    sys.exit("\n\nARRÊT — le CORE a changé, ce ne doit pas arriver. Aucune écriture.")

if not WRITE:
    print("\n\n[DRY-RUN] Rien écrit. Pour graver : python3 patch_trilobe_scrutin.py --write")
    sys.exit(0)

open(F, "w", encoding="utf-8").write(c)
print("\n\n✓ Patch trilobe appliqué. continuum_mockup.html réécrit.")
print("  → lance `sh run_test.sh` (doit rester vert), relis le git diff à froid, commite toi-même.")
