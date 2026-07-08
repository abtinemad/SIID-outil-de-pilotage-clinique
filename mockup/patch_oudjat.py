#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch_oudjat.py — intègre l'œil oudjat dans le MODE BILOBÉ du mockup CONTINUUM.
Patron : patch_scouter.py. Chirurgical, auto-vérifiant.

Comportement câblé (2-lobes seulement) :
  · clic sur un LOBE → l'œil quitte le nœud central et parcourt le fil (un tour du ∞,
    les deux boucles traversées) ; le SENS s'inverse selon lobe gauche (C) / droit (O).
  · au retour, la MONTURE oudjat (contour seul) se pose par-dessus l'œil, enregistrée
    par sa pupille sur le globe ; le globe rouge reste la pupille vivante (visible dans
    l'amande évidée). Re-clic → la monture se lève. Changer de mode réinitialise.

Garanties :
  · dry-run par DÉFAUT ; --write pour appliquer.
  · chaque ancre doit être UNIQUE, sinon arrêt sans écrire.
  · anti-double-application : arrêt si l'oudjat semble déjà inscrit.
  · NE TOUCHE JAMAIS le CORE : refus si un offset d'édition tombe entre
    /*==CORE==*/ et /*==/CORE==*/ (imprime la plage + chaque offset).
  · la source du path = oudjat_clean.svg (asset nettoyé, source unique).

Usage :
  python3 patch_oudjat.py                 # dry-run : diff + offsets
  python3 patch_oudjat.py --write         # applique
  python3 patch_oudjat.py --file chemin/continuum_mockup.html [--svg chemin/oudjat_clean.svg]
"""
import sys, os, re, argparse, difflib

ap = argparse.ArgumentParser()
ap.add_argument("--write", action="store_true", help="applique (défaut : dry-run)")
ap.add_argument("--file", default=None, help="chemin du mockup (défaut : auto)")
ap.add_argument("--svg",  default=None, help="chemin de oudjat_clean.svg (défaut : auto)")
ap.add_argument("--repos", action="store_true",
                help="variante : quand l'oudjat est posé, le spin revient à 0 (la marque se redresse, se pose). Défaut : elle flotte/tourne.")
args = ap.parse_args()

# --- localiser les fichiers ---
def find(name, override, cands):
    if override:
        if not os.path.exists(override): sys.exit(f"introuvable : {override}")
        return override
    for c in cands:
        if os.path.exists(c): return c
    sys.exit(f"{name} introuvable — précise-le (--file/--svg). Cherché : {cands}")

F   = find("mockup", args.file, ["mockup/continuum_mockup.html", "continuum_mockup.html"])
SVG = find("oudjat_clean.svg", args.svg,
           [os.path.join(os.path.dirname(F) or ".", "oudjat_clean.svg"),
            "mockup/oudjat_clean.svg", "oudjat_clean.svg"])

svg = open(SVG, encoding="utf-8").read()
D = re.search(r'<path[^>]*\bd="([^"]+)"', svg).group(1).strip()
m = re.search(r'pupille[^:]*:\s*([\d.]+)\s+([\d.]+)', svg)
PUPX, PUPY = (m.group(1), m.group(2)) if m else ("737.5049", "693.7131")

c = open(F, encoding="utf-8").read()
orig = c

# --- garde CORE ---
CS = c.find("/*==CORE==*/"); CE = c.find("/*==/CORE==*/")
if CS < 0 or CE < 0: sys.exit("ARRÊT — marqueurs CORE absents. Aucune écriture.")
CE_end = CE + len("/*==/CORE==*/")

# --- anti-double-application ---
for marker in ['id="oudjat"', "oudjatPhase", "OUDJAT="]:
    if marker in c:
        sys.exit(f"ARRÊT — oudjat déjà inscrit (« {marker} » présent). Aucune écriture.")

# ---------------------------------------------------------------------------
# fragments injectés (tous HORS-CORE)
# ---------------------------------------------------------------------------

# A) le groupe SVG (dans le HTML, AVANT le CORE) — frère de #scouter, hors #grp
A_anchor = '<g id="labels" font-size="10"'
A_frag = (
    '<g id="oudjat" opacity="0" pointer-events="none" aria-hidden="true">'
    f'<path fill="#1F222A" fill-rule="evenodd" d="{D}"/></g>\n        '
)

# B) référence DOM
B_anchor = ('scouterG=document.getElementById("scouter"), '
            'montureG=document.getElementById("scMonture"),')
B_frag = '\n      oudjatG=document.getElementById("oudjat"),'

# C) variables d'état (inséré AVANT la ligne FRQ, pour laisser scoutT + son commentaire intacts)
C_anchor = "var FRQ=Math.round(0.2*N/TAU);"
C_frag = (
    "// ---- OUDJAT (2-lobes) : clic sur un lobe -> l'oeil parcourt le fil (sens selon le cote) -> la monture se pose ----\n"
    "  var OUDJAT={size:1.0, ori:0, orbitDur:1.6};   // se regle a l'oeil : size = echelle relative au globe ; ori = inclinaison ; orbitDur = duree du tour\n"
    f"  var oudjatPhase='off', oudjatT=-9, oudjatDir=1, oudjatStartIdx=0, oudjatOp=0, OUD_PUPX={PUPX}, OUD_PUPY={PUPY};\n  "
)

# D) machine d'état (haut du render)
D_anchor = "if(Math.abs(targetS-currentS)<0.001) currentS=targetS;"
D_frag = (
    "\n"
    "    // OUDJAT - machine d'etat (2-lobes) : off -> orbit -> on ; quitter le 2-lobes reinitialise\n"
    "    if(Math.round(currentS)!==0 && oudjatPhase!=='off') oudjatPhase='off';\n"
    "    if(oudjatPhase==='orbit' && (T-oudjatT)>=OUDJAT.orbitDur){ oudjatPhase='on'; oudjatT=T; }\n"
    "    oudjatOp += (((oudjatPhase==='on')?1:0)-oudjatOp)*(reduce?1:0.14);"
)

# E) orbite : l'oeil chevauche le fil (override direct de eyeX/eyeY, avant P)
E_anchor = "var _underNow=(_rmP>=0 && _rmP<moveDur && moveKind==='under');"
E_frag = (
    "// ORBITE OUDJAT : l'oeil chevauche le fil, un tour complet du ∞ ; sens selon le lobe clique (derive de la tangente)\n"
    "    if(oudjatPhase==='orbit'){\n"
    "      var _ou=Math.min(1,(T-oudjatT)/OUDJAT.orbitDur), _oe=smooth(_ou), _olp=livePts(), _oN=_olp.length;\n"
    "      var _oi=(((oudjatStartIdx+oudjatDir*Math.round(_oe*_oN))%_oN)+_oN)%_oN;\n"
    "      eyeX=_olp[_oi][0]; eyeY=_olp[_oi][1];\n"
    "    }\n    "
)

# F) pose de la monture (hors #grp) — enregistree par sa pupille, epinglee a l'orientation du fil
F_anchor = ('} else if(scouterG.getAttribute("opacity")!=="0"){ '
            'scouterG.setAttribute("opacity","0"); }')
F_frag = (
    "\n"
    "    // OUDJAT - la monture se pose sur l'oeil (hors #grp) : enregistree par sa pupille sur P, epinglee a l'orientation du fil\n"
    "    if(oudjatOp>0.001){\n"
    "      oudjatG.firstChild.setAttribute('fill', INK);                       // suit l'encre du fil (slider)\n"
    "      var _osr=spinDeg*Math.PI/180, _odx=P[0]-CX, _ody=P[1]-CY;\n"
    "      var _oX=CX+_odx*Math.cos(_osr)-_ody*Math.sin(_osr);                 // P (repere local) -> ecran, comme le scouter\n"
    "      var _oY=CY+_odx*Math.sin(_osr)+_ody*Math.cos(_osr);\n"
    "      var _ok=OUDJAT.size*ptRad/173.79;                                   // echelle : pupille oudjat (rx≈173.79) calee sur le globe\n"
    "      oudjatG.setAttribute('transform','translate('+_oX.toFixed(1)+' '+_oY.toFixed(1)+') rotate('+(spinDeg+OUDJAT.ori).toFixed(2)+') scale('+_ok.toFixed(4)+') translate('+(-OUD_PUPX)+' '+(-OUD_PUPY)+')');\n"
    "      oudjatG.setAttribute('opacity', oudjatOp.toFixed(3));\n"
    "    } else if(oudjatG.getAttribute('opacity')!=='0'){ oudjatG.setAttribute('opacity','0'); }"
)

# G) branche 2-lobes dans le click handler (AVANT le flip) : clic lobe -> orbite/toggle, pas de flip
G_anchor = "if(!reduce){ flipping=true; flipStart=T; flipAxis=Math.random()*2*Math.PI; }"
G_frag = (
    "// 2-LOBES : clic sur un lobe -> orbite (sens selon le cote) puis pose de l'oudjat ; re-clic -> la monture se leve. (Pas de flip ici.)\n"
    "    if(Math.round(currentS)===0){\n"
    "      var _r=knotSvg.getBoundingClientRect();\n"
    "      var _mx=(e.clientX-_r.left)/_r.width*420, _my=(e.clientY-_r.top)/_r.height*420;\n"
    "      var _sr=spinDeg*Math.PI/180, _cc=Math.cos(-_sr), _ss=Math.sin(-_sr), _dx=_mx-CX, _dy=_my-CY;\n"
    "      _mx=CX+_dx*_cc-_dy*_ss; _my=CY+_dx*_ss+_dy*_cc;                     // de-rotation du spin\n"
    "      var _side=(_mx < (CX-10))?-1:1;                                     // < croisement (CX-10) = lobe gauche (C) ; sinon lobe droit (O)\n"
    "      if(oudjatPhase==='off'){\n"
    "        if(reduce){ oudjatPhase='on'; oudjatT=T; return; }\n"
    "        var _lp=livePts(), _nd=(nodesic()[0]||[CX,CY]), _bi=0, _bd=1e9;\n"
    "        for(var _i=0;_i<_lp.length;_i++){ var _ex=_lp[_i][0]-_nd[0], _ey=_lp[_i][1]-_nd[1], _d2=_ex*_ex+_ey*_ey; if(_d2<_bd){_bd=_d2;_bi=_i;} }\n"
    "        var _tx=_lp[(_bi+1)%_lp.length][0]-_lp[_bi][0];                   // tangente.x au point de depart\n"
    "        oudjatDir=(_side>0)?(_tx>=0?1:-1):(_tx>=0?-1:1);                  // partir VERS le lobe clique -> droite/gauche = sens opposes\n"
    "        oudjatStartIdx=_bi; oudjatPhase='orbit'; oudjatT=T;\n"
    "      } else { oudjatPhase='off'; oudjatT=T; }\n"
    "      return;\n"
    "    }\n    "
)

# (label, ancre, texte_de_remplacement) — insertion = ancre incluse dans le remplacement
OPS = [
    ("A · groupe SVG #oudjat",        A_anchor, A_frag + A_anchor),
    ("B · ref DOM oudjatG",           B_anchor, B_anchor + B_frag),
    ("C · variables d'état OUDJAT",   C_anchor, C_frag + C_anchor),
    ("D · machine d'état (render)",   D_anchor, D_anchor + D_frag),
    ("E · orbite (chevauche le fil)", E_anchor, E_frag + E_anchor),
    ("F · pose de la monture",        F_anchor, F_anchor + F_frag),
    ("G · clic lobe (handler)",       G_anchor, G_frag + G_anchor),
]

# R) variante --repos : quand l'oudjat est posé, le spin revient à 0 (la marque se redresse)
if args.repos:
    R_anchor = "if(!reduce && !interroLock && !scouting) spinAcc += 0.096;"
    R_frag = ("if(oudjatPhase==='on'){ var _uT=Math.round(spinAcc/360)*360; spinAcc += (_uT-spinAcc)*0.06; }   "
              "// OUDJAT pose : la marque se redresse et se pose (repos)\n    else ")
    if "Math.round(spinAcc/360)" in c:
        sys.exit("ARRÊT — variante --repos déjà inscrite. Aucune écriture.")
    OPS.append(("R · repos (redresse le spin)", R_anchor, R_frag + R_anchor))

# --- vérifs dures : unicité + hors-CORE, AVANT toute écriture ---
errs = []
print(f"CORE (octets protégés) : [{CS}, {CE_end}]")
for label, anc, _ in OPS:
    n = c.count(anc); off = c.find(anc)
    inside = (CS < off < CE_end) if off >= 0 else True
    tag = "UNIQUE" if n == 1 else f"{n}×"
    loc = "hors-CORE" if not inside else "✗ DANS CORE"
    print(f"  {label:34} {tag:8} off={off:<7} {loc}")
    if n != 1:  errs.append(f"  ✗ [{label}] ancre trouvée {n}× (attendu 1)")
    if inside:  errs.append(f"  ✗ [{label}] tombe DANS le CORE — interdit")
if errs:
    print("ARRÊT — aucune écriture :"); print("\n".join(errs)); sys.exit(1)

# --- application (en mémoire) ---
for label, anc, rep in OPS:
    assert c.count(anc) == 1, f"régression d'unicité sur [{label}]"
    c = c.replace(anc, rep, 1)

# --- garde CORE post-application : le bloc CORE doit être byte-identique ---
core_before = orig[CS:CE_end]
cs2 = c.find("/*==CORE==*/"); ce2 = c.find("/*==/CORE==*/") + len("/*==/CORE==*/")
core_after = c[cs2:ce2]
if core_before != core_after:
    sys.exit("ARRÊT — le CORE a changé (ne devrait jamais arriver). Aucune écriture.")
print("✓ CORE byte-identique après application.")
print(f"Δ caractères = {len(c)-len(orig):+d}")

if not args.write:
    print("\n=== DRY-RUN — diff unifié (rien écrit) ===")
    diff = difflib.unified_diff(orig.splitlines(keepends=True),
                                c.splitlines(keepends=True),
                                fromfile=F, tofile=F+" (patché)", n=2)
    sys.stdout.writelines(diff)
    print("\n→ relis à froid, puis relance avec --write pour appliquer.")
    sys.exit(0)

open(F, "w", encoding="utf-8").write(c)
print(f"\n✓ oudjat inscrit dans {F}. Relis le git diff à froid, lance run_test.sh, commite toi-même. NE PAS pousser sans relecture.")
