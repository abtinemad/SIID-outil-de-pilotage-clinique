#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch_soin_rouge.py — mockup/continuum_mockup.html — le « n » de Soin suit l'œil.

Le problème (constaté, pas supposé) :
  le globe de l'œil est un dégradé #ptSphere dont le stop médian vaut RED, et
  setRed() met à jour --red ET les trois stops. Le « n » de Soin, lui, recevait
  fill=RED en dur au moment de sa création. Bouger le curseur de rouge changeait
  donc l'œil sans changer le « n » : deux rouges à l'écran, ce que la loi 04
  (« un seul rouge, mobile ») interdit. Mesuré : œil #781a28 / « n » #ad333f.

La correction, en deux éditions, toutes deux hors du CORE :
  S1  CSS : #soinN{fill:var(--red)} — le « n » boit à la même source que #pt.
  S2  JS  : suppression de l'attribut fill figé au build.

Doctrine du patch : CORE jamais touché (vérifié avant ET après) ; ancres uniques ;
anti-double-application ; DRY-RUN PAR DÉFAUT ; ne commit pas, ne push pas.

Usage :
    python3 mockup/patch_soin_rouge.py            # dry-run
    python3 mockup/patch_soin_rouge.py --write
"""
import json, sys, os, difflib

F = os.path.join("mockup", "continuum_mockup.html")
if not os.path.exists(F):
    F = "continuum_mockup.html"
if not os.path.exists(F):
    sys.exit("continuum_mockup.html introuvable — lance depuis la racine du repo.")

WRITE = "--write" in sys.argv

EDITS = json.loads(r'''{"S1 CSS — #soinN boit à var(--red)": ["  #pt{fill:var(--red)}", "  #pt{fill:var(--red)}\n  #soinN{fill:var(--red)}   /* le « n » de Soin : même source que l'œil (loi 04 — un seul rouge) */"], "S2 JS — plus de fill figé au build": ["_nn.setAttribute(\"id\",\"soinN\"); _nn.setAttribute(\"fill\",RED); tp.appendChild(_nn);", "_nn.setAttribute(\"id\",\"soinN\"); tp.appendChild(_nn);"]}''')

c = open(F, encoding="utf-8").read()
orig = c

# ---- bornes du CORE -------------------------------------------------------
CB, CE = "/*==CORE==*/", "/*==/CORE==*/"
if CB not in c or CE not in c:
    sys.exit("ARRÊT — marqueurs de CORE introuvables. Aucune écriture.")
ci = c.index(CB)
cj = c.index(CE) + len(CE)
core_before = c[ci:cj]

# ---- anti-double-application ---------------------------------------------
for marker in ["#soinN{fill:var(--red)}"]:
    if marker in c:
        sys.exit("ARRÊT — semble déjà appliqué (« %s » présent). Aucune écriture." % marker)

# ---- vérifs dures : unicité + hors-CORE, AVANT toute écriture -------------
errs = []
for label, (old, new) in EDITS.items():
    n = c.count(old)
    if n != 1:
        errs.append("  ✗ [%s] ancre trouvée %d fois (attendu 1)" % (label, n))
        continue
    p = c.find(old)
    if not (p + len(old) <= ci or p >= cj):
        errs.append("  ✗ [%s] l'ancre tombe DANS le CORE — interdit" % label)
if errs:
    print("ARRÊT — aucune écriture :")
    print("\n".join(errs))
    sys.exit(1)

# ---- application ----------------------------------------------------------
for label, (old, new) in EDITS.items():
    assert c.count(old) == 1, "régression d'unicité sur [%s]" % label
    c = c.replace(old, new, 1)

# ---- garde-CORE a posteriori ---------------------------------------------
if CB not in c or CE not in c:
    sys.exit("ARRÊT — CORE perdu après application. Aucune écriture.")
if c[c.index(CB):c.index(CE) + len(CE)] != core_before:
    sys.exit("ARRÊT — le CORE a été modifié. Aucune écriture.")

# ---- rapport --------------------------------------------------------------
print("Fichier      : %s" % F)
print("Éditions     : %d (toutes hors-CORE, ancres uniques)" % len(EDITS))
for label in EDITS:
    print("  · %s" % label)
print("CORE         : intact (%d octets)" % len(core_before))
print("Δ caractères : %+d" % (len(c) - len(orig)))
print()

if not WRITE:
    print("=" * 72)
    print("DRY-RUN — rien n'a été écrit. Diff proposé :")
    print("=" * 72)
    d = difflib.unified_diff(orig.splitlines(keepends=True),
                             c.splitlines(keepends=True),
                             fromfile=F + " (actuel)", tofile=F + " (après patch)")
    try:                                    # tolère `| head` sans cracher de traceback
        sys.stdout.writelines(d)
        print()
        print("→ relis à froid. Si ça te va :  python3 %s --write" % os.path.basename(__file__))
        sys.stdout.flush()
    except BrokenPipeError:
        os.dup2(os.open(os.devnull, os.O_WRONLY), sys.stdout.fileno())
    sys.exit(0)

open(F, "w", encoding="utf-8").write(c)
print("✓ le « n » de Soin suit l'œil. %s réécrit." % F)
print("  → lance mockup/run_test.sh (doit rester vert), relis le `git diff` à froid,")
print("    puis commite toi-même. NE PAS pousser sans relecture.")
