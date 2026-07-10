#!/usr/bin/env sh
# Test de la géométrie du logo CONTINUUM.
#
# Source de vérité = le CORE dans continuum_mockup.html, entre les marqueurs
# /*==CORE==*/ et /*==/CORE==*/. testvrille.js attend ce code dans un fichier voisin
# core.js (il fait eval de ./core.js), puis vérifie la géométrie.
#
# core.js est DÉRIVÉ (extrait du mockup) — il est gitignoré, jamais commité.
# Le mockup et testvrille.js ne se séparent jamais.
#
# Usage :  cd logo && sh run_test.sh   →  doit afficher "Tout vert."
set -e
cd "$(dirname "$0")"
# Le CORE n'a qu'un propriétaire : si un consommateur a dérivé, on ne teste rien.
./core.sh verifier
awk '/\/\*==CORE==\*\//{f=1;next} /\/\*==\/CORE==\*\//{f=0} f' continuum_mockup.html > core.js
node testvrille.js
