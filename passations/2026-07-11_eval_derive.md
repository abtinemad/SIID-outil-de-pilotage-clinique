# 2026-07-11 — Dérive du chapitre eval, et ce qu'il faut lire avant d'y revenir

> Chapitre entier bâti de travers. Rien n'entre en doctrine — le dépôt contenait
> déjà, en mieux, tout ce qui a été « dérivé ». Cette passation ne grave aucun
> acquis : elle grave un résultat négatif et un pointeur, pour que la prochaine
> instance ne recreuse pas le vide.

---

## Ce qui a été fait, et jeté

Une « eval » inventée comme **garde d'une reformulation** : un `assembler()` qui
juxtapose des fragments, plus quatre axes de trahison (ajout dur, connecteur
orphelin, substitution, omission) et un banc de tripwires. Dix fichiers sous
`eval/`, jamais commités, `rm -rf` en fin de fil. Working tree propre, historique
intact.

## Pourquoi c'était faux — vérifié fichier en main

Le vrai système d'eval est **déjà** dans `recherche/` : `architecture_eval.md`
(topologie en cinq couches, figée), `internes_eval.md` (les internes remplis
depuis le moteur LeCLG réel), `registre_garde.md` (le bloc-garde de sortie,
rédigé). Et la distinction que le chapitre a fondue est déjà au dépôt :
`schema.md`, ligne `condense` — « la machine range, juxtapose, cite — elle
n'écrit aucune prose sur le patient (invariant 12) », « rassemble, ne noue pas ».

`assembler()` était donc un **condense malformé** (juxtaposition sans axe, sans
attribution, sans date), pas une eval. La mise en lien — Affectif · Réflexif ·
Vigilante — est l'eval, et c'est le **matériau** de l'hypothèse ; c'est l'humain
(collège) qui noue. Le condense a interdiction de nouer (inv. 12) ; on lui a
demandé de lier, puis on a bâti un objet encore en-deçà.

## La cristallisation — résidu retiré

Le raisonnement « objet-PDF-unique, verbatim corps + condensé subordonné,
signature sur tout l'octet » ne survit pas au cahier. `cahier/01_file_active.md`
§ domaine 5 spécifie déjà : cul-de-sac, append-only, signé, opposable, un
document par strate, et « il ne contient que le récit signé, jamais la
proposition ». La coupe réelle est l'**auteur** (proposition exclue / récit signé
inclus), pas une mise en page source/condensé. Le résidu résolvait un problème
que la doctrine n'a pas. Non gardé.

## La leçon

Même mode de défaillance que `PASSATION.md` nomme déjà — dépôt récité de mémoire
au lieu d'être lu. Plusieurs énoncés « trouvés » ce chapitre étaient dans le
cahier verbatim (recalcul total jamais incrémental ; « aucun eval ne lit un autre
eval, la vraie raison c'est la complaisance »). Cette fois à l'échelle d'un
chapitre entier. La passation cadre l'intention ; seul le dépôt certifie l'état.

## Pour la prochaine instance — avant de toucher à l'eval

1. Lire, zip en main (`git archive -o eval.zip HEAD recherche/ schema.md cahier/`) :
   les six fichiers de `recherche/`, `schema.md` (ligne `condense`), et
   `cahier/01_file_active.md` § domaine 5. Pas la passation seule.
2. Le vrai cran ouvert n'est **pas** du code : ce sont les cinq questions de
   schéma de `recherche/hypothese_de_travail.md`, marquées « à trancher —
   arbitrage Abtine ». Elles sont le prérequis de toute DDL/prompt d'eval. La Q2
   (émergence matérialisée ou recalculée) décide si l'eval touche le schéma.
3. Le code de la métabolisation vient après cet arbitrage, jamais avant.
