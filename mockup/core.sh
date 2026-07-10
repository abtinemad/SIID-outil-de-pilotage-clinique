#!/usr/bin/env bash
# ══ Le CORE a un seul propriétaire ═══════════════════════════════════════════════
# Source de vérité : le CORE entre /*==CORE==*/ et /*==/CORE==*/ dans
# continuum_mockup.html — comme run_test.sh le déclare déjà. Rien d'autre ne le possède.
#
# Le CORE vit dans la portée de son hôte et n'appelle qu'UNE chose au-dehors :
# refreshStatics(). Le sortir en module ES exigerait d'exporter 34 fonctions et de les
# relier à la main chez chaque consommateur : refonte de portée d'un moteur qui tourne,
# pour zéro gain. Le danger n'est pas que le texte soit dupliqué — c'est que la
# duplication devienne SILENCIEUSE. Ce script la rend bruyante.
#
#   ./core.sh verifier   → 0 si tous les consommateurs portent le CORE canonique, 1 sinon
#   ./core.sh injecter   → propage le canonique vers les consommateurs (idempotent)
#
# Ancres uniques : deux /*==CORE==*/ dans un fichier et n'importe quel outil (awk compris)
# découpe au mauvais endroit sans le dire. Vérifié aussi.
set -euo pipefail
cd "$(dirname "$0")"

CANON=continuum_mockup.html
CONSOMMATEURS=(app_mockup.html)   # le canonique n'est pas son propre consommateur

case "${1:-verifier}" in
verifier)
  python3 - "$CANON" "${CONSOMMATEURS[@]}" <<'PY'
import sys, hashlib
O,C = '/*==CORE==*/','/*==/CORE==*/'
def core(f):
    s=open(f).read()
    if s.count(O)!=1 or s.count(C)!=1: raise SystemExit(f"{f} : ancre non unique — découpage indéfini")
    a=s.index(O); b=s.index(C)+len(C); return s[a:b]
h=lambda t: hashlib.sha256(t.encode()).hexdigest()
canon=core(sys.argv[1]); hc=h(canon)
print(f"{sys.argv[1]:<26}{len(canon.encode()):>6} o  {hc[:16]}  CANONIQUE")
bad=0
for f in sys.argv[2:]:
    try: c=core(f)
    except FileNotFoundError: print(f"{f:<26}{'':>6}    absent — ignoré"); continue
    ok = c==canon
    print(f"{f:<26}{len(c.encode()):>6} o  {h(c)[:16]}  {'TENU' if ok else '*** DÉRIVE ***'}")
    bad |= (not ok)
sys.exit(bad)
PY
  ;;
injecter)
  python3 - "$CANON" "${CONSOMMATEURS[@]}" <<'PY'
import sys
O,C = '/*==CORE==*/','/*==/CORE==*/'
s=open(sys.argv[1]).read(); canon=s[s.index(O):s.index(C)+len(C)]
for f in sys.argv[2:]:
    try: s=open(f).read()
    except FileNotFoundError: continue
    assert s.count(O)==1 and s.count(C)==1, f+" : ancre non unique"
    a=s.index(O); b=s.index(C)+len(C)
    if s[a:b]==canon: print(f"{f:<26}déjà à jour"); continue
    open(f,'w').write(s[:a]+canon+s[b:]); print(f"{f:<26}CORE réinjecté")
PY
  ;;
*) echo "usage: $0 {verifier|injecter}" >&2; exit 2;;
esac
