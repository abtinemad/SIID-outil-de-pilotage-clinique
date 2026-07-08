#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
corriger_bloc_B.py — CONTINUUM.md — deux corrections sur le §19 (bloc B déjà inscrit).

(1) `compose · compose · read`  ->  « deux lobes composent, un seul lit ».
    Le token résolvait vers une constante JavaScript (DASH_MODE). La doctrine
    fonde le code ; elle ne dépend pas d'un identifiant d'implémentation, qui peut
    être renommé. La phrase française dit de plus ce que le triplet encodait sans
    le dire : la dissymétrie 2/1 — c'est Q2, la lentille est l'organe d'une seule
    boucle, non un mode disponible partout.

(2) Reflow du paragraphe. L'inscription du bloc B commençait et finissait en
    milieu de ligne : impossible de wrapper sans laisser une ligne courte au
    milieu du paragraphe (ligne « au centre et **veille** — sentinelle, », 39 col).
    Une ligne orpheline est une cicatrice de patch — elle signale l'insertion.
    On re-wrappe donc le paragraphe entier, laisse 93 col (son propre gabarit).
    Résultat : 15 lignes -> 14, toutes entre 84 et 93, aucune orpheline.

Une seule ancre : le paragraphe complet (unique dans le fichier).
Auto-vérifiant. Anti-double-application. DRY-RUN PAR DÉFAUT. Ne commit pas, ne push pas.

    python3 corriger_bloc_B.py            # dry-run : affiche le diff, n'écrit rien
    python3 corriger_bloc_B.py --write
"""
import json, sys, os, difflib

F = "CONTINUUM.md"
if not os.path.exists(F):
    sys.exit("CONTINUUM.md introuvable — lance depuis la racine du repo.")

WRITE = "--write" in sys.argv
D = json.loads(r'''{"old": "**Le point de nouage rouge = l'œil, le regard qui se pose.** Un œil, **unique et mobile**. Il\nne se multiplie pas avec les boucles : il y en a **un seul**, qui **circule** sur les nouages\npar défaut (le point de vie qui anime la forme) et se **pose** sur celui d'une boucle qu'on\ntient — puis repart circuler quand on la relâche. Sa grammaire se décline **par strate**.\nSur la **récolte** (5 lobes), se poser sur un nouage déroule les données recueillies qui\ndensifient cette boucle. Sur la **métabolisation** (3 lobes), l'œil **entre dans le lobe**\n(à son barycentre, non au seuil) et prend son mode : il **compose** en silence dans\nl'Affectif et le Réflexif — le regard accompagne le nouage — et il **scrute** dans la\nVigilante. **Le mode n'est pas une humeur de l'œil mais la nature du lobe** : composer et\nscruter sont deux organes, non deux réglages — `compose · compose · read`. Les lobes de\ncomposition **n'ont pas de lentille** ; scruter est **une boucle qui lit les deux autres**,\njamais un mode qu'on activerait partout. Sur l'**institutionnel** (2 lobes), l'œil se tient\nau centre et **veille** — sentinelle,\nnon lecteur. Rouge = sanctuaire (§3/§20). Déplacement doux, jamais de\ntéléportation. Il porte désormais **deux fonctions de sens :**", "new": "**Le point de nouage rouge = l'œil, le regard qui se pose.** Un œil, **unique et mobile**. Il\nne se multiplie pas avec les boucles : il y en a **un seul**, qui **circule** sur les nouages\npar défaut (le point de vie qui anime la forme) et se **pose** sur celui d'une boucle qu'on\ntient — puis repart circuler quand on la relâche. Sa grammaire se décline **par strate**. Sur\nla **récolte** (5 lobes), se poser sur un nouage déroule les données recueillies qui\ndensifient cette boucle. Sur la **métabolisation** (3 lobes), l'œil **entre dans le lobe** (à\nson barycentre, non au seuil) et prend son mode : il **compose** en silence dans l'Affectif\net le Réflexif — le regard accompagne le nouage — et il **scrute** dans la Vigilante. **Le\nmode n'est pas une humeur de l'œil mais la nature du lobe** : composer et scruter sont deux\norganes, non deux réglages — deux lobes composent, un seul lit. Les lobes de composition\n**n'ont pas de lentille** ; scruter est **une boucle qui lit les deux autres**, jamais un\nmode qu'on activerait partout. Sur l'**institutionnel** (2 lobes), l'œil se tient au centre\net **veille** — sentinelle, non lecteur. Rouge = sanctuaire (§3/§20). Déplacement doux,\njamais de téléportation. Il porte désormais **deux fonctions de sens :**"}''')
old, new = D["old"], D["new"]

c = open(F, encoding="utf-8").read()
orig = c

# anti-double-application
if "deux lobes composent, un seul lit" in c:
    sys.exit("ARRÊT — semble déjà appliqué. Aucune écriture.")
if "compose · compose · read" not in c:
    sys.exit("ARRÊT — le token attendu est absent : le fichier n'est pas dans l'état prévu. Aucune écriture.")

# ancre unique
n = c.count(old)
if n != 1:
    sys.exit("ARRÊT — le paragraphe-ancre apparaît %d fois (attendu 1). Aucune écriture." % n)

c = c.replace(old, new, 1)

# garde : rien d'autre n'a bougé
if len(orig) - len(old) != len(c) - len(new):
    sys.exit("ARRÊT — substitution non locale. Aucune écriture.")
for probe in ["Sa grammaire se décline", "La lentille de scrutin", "n'ont pas de lentille",
              "une boucle qui lit les deux autres", "Rouge = sanctuaire"]:
    if c.count(probe) != orig.count(probe):
        sys.exit("ARRÊT — « %s » perdu ou dupliqué. Aucune écriture." % probe)

mx = max(len(l) for l in new.split("\n"))
print("Fichier      : %s" % F)
print("Ancre        : le paragraphe §19 complet (unique)")
print("Lignes       : %d -> %d   (laisse max %d col, aucune orpheline)"
      % (old.count("\n") + 1, new.count("\n") + 1, mx))
print("Δ caractères : %+d" % (len(c) - len(orig)))
print()

if not WRITE:
    print("=" * 72)
    print("DRY-RUN — rien n'a été écrit. Diff proposé :")
    print("=" * 72)
    d = difflib.unified_diff(orig.splitlines(keepends=True), c.splitlines(keepends=True),
                             fromfile=F + " (actuel)", tofile=F + " (après)")
    try:
        sys.stdout.writelines(d); print()
        print("→ relis à froid. Si ça te va :  python3 corriger_bloc_B.py --write")
        sys.stdout.flush()
    except BrokenPipeError:
        os.dup2(os.open(os.devnull, os.O_WRONLY), sys.stdout.fileno())
    sys.exit(0)

open(F, "w", encoding="utf-8").write(c)
print("✓ §19 corrigé. CONTINUUM.md réécrit.")
print("  → relis le `git diff` à froid, puis commite toi-même. NE PAS pousser sans relecture.")
