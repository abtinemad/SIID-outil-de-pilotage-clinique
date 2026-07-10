# Cahier de dessin — 01. La file active

> Ici on dessine, on ne juge pas.
> Ce cahier ne cite pas la doctrine. On l'ouvre en début de session — **pas `CONTINUUM.md`**.
> L'accord avec la doctrine vient après, ailleurs, avec l'instrument fait pour ça.
> Ce qui te lie est exécutable (la DDL, les gestes verts). Le reste est délibération.
> Fichier de dessin : `dessin/01_file_active.html` (le CORE y est embarqué byte-identique).

---

## L'écran, en un paragraphe

La file active ambulatoire. ~60 personnes, extensible. Ordre **alphabétique** (fond immobile : la
main mémorise la place, l'œil lit ce qui a changé). Trois terrains en onglets — **ambulatoire ·
hospitalisés · demandes** — exclusifs. Un filtre **sans-suite** (le cercle pointillé), qui n'est pas
un onglet : il meurt à la fermeture. La recherche (nom, IPP) **traverse** les trois terrains. Le
nœud vit en bas, à 100 px, vivant ; c'est le seul organe de navigation. On lit par axe, on écrit au
nœud.

## La chaîne — sous le nom, pleine largeur

Le cœur de l'écran. Un axe de temps ; **le présent tombe à la même abscisse sur toutes les lignes**
(fenêtre 96 j, commune). On ne calcule aucune statistique : on **pose les dépôts sur le temps**. Rien
n'est divisé, aucun seuil, aucune médiane, aucune couleur. (Tout le vocabulaire « écart / régime /
médiane / seuil de 4 dépôts » des versions antérieures est **mort** : ne pas le ressortir.)

Cinq marques, natures de temps distinctes :

| marque | sens | qui la pose |
|---|---|---|
| **●** plein | rendez-vous prévu **et** advenu | trace d'un acte |
| **○** creux, trait continu | rendez-vous prévu, à venir (plus **gros** que le passé) | trace d'un acte |
| **∨** chevron, **au-dessus** de la ligne | dépôt que personne n'avait prévu (appel, passage) | trace d'un acte |
| **‖** barre pleine, **sur** le fil à sa date | suspendu — quelqu'un a écrit la pause | trace d'un acte |
| **⚬** cercle **pointillé**, **après** le présent | aucune date posée. Un fait, rien d'autre | **la machine, seule** |
| **→** trait **plein** sortant du cadre | relais — quelqu'un a repris, il est nommé | trace d'un acte |

Le fil lui-même est plus clair que ses points : il porte, il ne parle pas.

### Ce que chaque figure enseigne
- **⚬ est le seul glyphe que la machine dessine seule.** Les autres sont des traces d'actes humains ;
  lui n'est écrit nulle part — il constate qu'aucune date n'existe. Il ne juge pas *pourquoi*.
- **La machine ne trie pas l'oubli et la décision.** Une pause écrite (Alice : ‖ + ⚬) et un oubli pur
  (Perrin : ⚬ seul) portent **le même cercle**. Ce qui les distingue, c'est la **barre en amont** —
  l'œil voit lequel porte une main. Le filtre sans-suite prend **les deux** (*rappeler en septembre*
  est aussi à reprendre).
- **Le fantôme** (pointillé fin entre la dernière marque et le présent) dit *depuis quand plus rien*.
  Chez ⚬-brisé il part du dernier rendez-vous (un oubli) ; chez ‖ il part de la **date de la pause**
  (l'âge de la décision). Le glyphe est le fait ; **le pointillé est ce qui compte.**
- **Deux façons de fermer un fil, deux seulement : donner une date, ou donner un nom** (une personne
  ou une structure — **jamais un lieu** : « domicile » n'est pas quelqu'un qui prend la suite ; un
  lieu qui ferme, c'est la sortie dans le vide déguisée). Le relais est la seule terminaison qui
  *dispense* d'une date.
- Chaque glyphe se **touche** → ouvre le(s) dépôt(s) correspondant(s). Sauf **⚬**, qui n'ouvre aucun
  dépôt (il n'y en a pas) : il ouvre **le guichet**. Le seul glyphe qui, touché, demande à écrire.

## Le nœud

Les **boucles sont les strates, l'œil est la poignée.**
- toucher une **boucle** → la strate morphe (5 récolte · 3 métabolisation · 2 institutionnel)
- toucher **l'œil** → le fil se dénoue en champ (recherche ; ou **guichet** si un patient est tenu)
- **maintenir** l'œil → la voix (TTS/dictée). Écrire et dire = même geste, à la durée près
- **double-toucher** l'œil → la **clarté** : labels des boucles + légende de la ligne

Le nœud **ne parle jamais le premier**. On le convoque. (Clippy a échoué non parce qu'il était un
personnage, mais parce qu'il *commençait*.)

Clavier ouvert : la barre se colle au-dessus, le nœud rétrécit d'un cran mais reste visible — on voit
dans quelle strate on grave pendant qu'on tape. Le rouge reste **dans l'œil, seul** : jamais sur la
ligne, jamais une pastille. Cinq cents points rouges et le rouge ne signifie plus rien.

## Le guichet

Zone de texte + **prochaine fois** (une date) + échappatoire **pas de date**, qui ouvre
`qui prend la suite ?` (le mot « justification » est banni : il appelle une défense, et on se défend
devant une autorité). Sous ce champ, **les trois dernières sorties écrites par le service** — pas un
tutoriel : ce que les collègues ont écrit quand ils faisaient bien. La liste des relais s'apprend
(SAMSAH, SAVS, CMP, HDJ, domicile…) mais **jamais triée par fréquence** (une liste qui remonte le
fréquent produit la réponse qu'elle mesure).

Ce qui rend le dépôt irrévocable n'est pas un avertissement affiché (personne ne le lit deux fois),
**c'est l'absence de bouton pour l'effacer.**

## Le geste porte plusieurs dépôts — l'agrafe

**La traçabilité dit *à qui*. L'agrafe dit *avec quoi*.** Chaque dépôt est déjà attaché à un patient
(`ipp`), un auteur, un instant — ça, c'est tracé, ça a toujours été là. L'agrafe est autre chose, et
plus petit : une étiquette qui regroupe les dépôts d'**une même visite**. Une visite produit souvent
deux dépôts (l'observation *et* la date qu'elle fixe) ; l'agrafe dit qu'ils vont ensemble, pour les
montrer comme un seul événement. « Même patient, même jour » ne suffit pas à le deviner : deux
soignants peuvent voir le patient le même jour (deux visites, pas une). D'où une étiquette explicite.
Ce n'est pas de la traçabilité, c'est du **regroupement**.

Un **dépôt** ne change jamais : texte, auteur, instant, signature. C'est le point dur.
Tout le reste tourne dans les **pointeurs** : un dépôt peut viser l'avant (une date), viser un nom
(un relais), viser un fil. `date-du-suivant`, `relais`, `pause`, `injection` **ne sont pas des
natures nouvelles** — ce sont des dépôts qui pointent. La forme ne bouge jamais ; ce qu'elle porte
s'enrichit sans migration.

Un geste (une observation **et** la date qu'il fixe) crée **deux dépôts**. Ils doivent savoir qu'ils
sont le même geste → **`geste_id` explicite**, jamais déduit de « même auteur, même seconde »
(le réseau hoquette ; deux soignants déposent au même instant sur deux patients). L'agrafe est un
identifiant, pas une coïncidence.

## Les deux fils

**Rencontre** et **soin** ne se croisent pas. La **NAP** (injectable 1×/mois à domicile, souvent
pour anosognosiques — une négociation qui évite la décompensation et l'hôpital) est le fil *soin* :
**une seconde chaîne sous la première**, avec ses ● mensuels. Chez un anosognosique stabilisé, la
chaîne rencontre est presque vide et la chaîne soin tient depuis 4 ans : **c'est la réussite**, et
tout score l'aurait lue comme un abandon. Un patient tient par un fil sans l'autre.

## La fenêtre

**96 j, commune à toutes les lignes** dans la file : on ne balaye que des lignes comparables. Le
réglage **1 mois · 3 mois · 6 mois · 1 an** appartient à la **vue patient déployée** (écran 02), là
où il n'y a plus rien à comparer.

---

## Écran 02 — vue intra-patient (à dessiner)

Ce que tu as posé, et les trois corrections qui tiennent :

- **En-tête** : IPP, naissance, sexe (fait administratif), **adresse, contacts** (un proche, un
  soignant/structure). Correction : ce dont un soignant a besoin en entrant, c'est **le prénom par
  lequel on appelle la personne** — pas la même donnée que le sexe administratif.
- **Accès traitements** en fenêtre superposée, par un logo. **NAP = logo seringue** (le fil soin).
- **La ligne de prise en charge, détaillée**, glyphes **cliquables** → ouvrent les dépôts.
- **Clic sur rien** : tous les fragments, du plus récent au plus ancien (cartes/boîtes, comme
  LeCLG). **Clic sur une boucle** : les fragments hors axe **pâlissent** (ils ne partent pas, ne se
  réordonnent pas — rien n'est rangé ; le rangement est une projection). On tient le lobe, on lit à
  travers.
- **La boîte de récit** ne s'ouvre pas seule — on la convoque. À côté, **le résidu** (fragments
  qu'aucune phrase n'a pris) **à force égale**, pas en petit en bas.

### Le récit — un seul, jamais cinq
Un récit unique écrit **sur tous les fragments** ; les boucles l'**éclairent** (on tient *Familiale*,
les phrases nées de la famille se détachent, les autres pâlissent). L'axe est une lumière qu'on
promène, jamais un ciseau. Cinq récits parallèles découperaient une vie en tranches qui ne se
parlent pas.

### Deux objets distincts — ne jamais confondre
- **La proposition** : recalculée **à froid, sur tout le terrain brut (domaine 2)**, à chaque
  synthèse. Sans auteur, sans autorité, **jamais stockée**, domaine 3. Elle a le droit de changer
  d'avis — une machine qui ne change jamais d'avis a une *position*. **Aucun bouton *reprendre*,
  aucune édition** : l'effort de réécrire est le seul garde-fou qui ne se contourne pas.
- **Le récit signé** : ce que l'équipe écrit en synthèse, ~1×/semaine, **pour les patients à qui ça
  sert**. Daté, signé, append-only, **empilé** → on relit la trajectoire de la pensée un an après.

**Recalcul toujours total, jamais incrémental.** Repartir du récit précédent = distillation en
cascade = LeCLG (source détruite, omission inauditable, erreur immortelle). Recalculer 60 dépôts ne
coûte rien.

**Aucun eval ne lit un autre eval *pour en tirer du contenu*.** La vraie raison n'est pas
l'entropie : c'est la **complaisance**. Un modèle qui lit votre conclusion la *retrouve* (le texte le
plus probable après votre conclusion, c'est votre conclusion). L'aveuglement au récit signé est la
seule chose qui rende la **contradiction** possible. Prix à connaître : la machine ne peut pas
apprendre de ses omissions → seule défense, le **résidu affiché**, lu par des humains. *Comparer*
(regarder de côté, aucune assertion sur le patient) est permis ; *distiller* (descendre d'un cran,
perdre) ne l'est pas.

**La divergence** — la proposition de ce lundi ne dit plus ce qu'on avait signé — n'est **ni
calculée, ni affichée, ni nommée**. La synthèse s'ouvre sur le **dernier récit signé** ; on convoque
la proposition ; **deux textes côte à côte**. Ce qui a disparu, on le voit — parce qu'on l'avait
écrit. Aucun eval n'a lu un autre eval. La divergence est vue, jamais dite.

---

## Le domaine 5 — les cristallisations (nouveau)

Les comptes rendus **générés, relus, augmentés, validés** par l'équipe à un instant, pour tracer de
l'administratif et verser au dossier. Un document **par strate** : pentalobe (clinique), trilobe
(prise en charge globale), bilobe (institutionnel). **Append-only, signé, opposable.**

Il ne rentre dans **aucun** des quatre domaines : ni le 2 (né d'une proposition, pas du terrain brut)
ni le 3 (recalculable et jouable ; ceci est gelé). **Cinquième domaine.**

**Ligne de non-collision avec les evals :** les evals lisent **2, jamais 5**. La proposition se
recalcule toujours sur le terrain brut. Le 5 est un **cul-de-sac** : on y écrit, on en sort des PDF,
**rien ne le relit pour produire du contenu.** Un domaine dont personne ne se nourrit — c'est ce qui
le rend sûr. Le PDF est un *exemplaire* qui sort, pas la mémoire ; il ne contient **que le récit
signé**, jamais la proposition (sans auteur → rien à verser dans un dossier médical).

---

## Chantier DDL — a une échéance, tout le reste attend

`db/30_domaine_2_depots.sql` est élégant et **presque** prêt : ref polymorphe (`ref_depot_id`,
`ref_nature`, `ref_proposition_id`) présente, append-only structurel, clé composite non falsifiable.
Manquent **trois** choses, à poser **avant le premier dépôt réel** (append-only ne se rattrape pas —
« une colonne existe avant le premier dépôt, ou jamais ») :

1. **`geste_id`** — l'agrafe. Explicite, immuable, partagé par les dépôts d'un même geste.
2. **La ref tournée vers l'avant** — étendre `ref_nature` à un **moment** (date-du-suivant) et un
   **nom/structure** (relais). Nouvelle valeur, **pas** nouvelle colonne.
3. **Le fil** rencontre / soin — une valeur portée par le dépôt (la NAP = fil soin).

> L'append-only **ne s'assouplit pas.** Ce qui bouge (déménagement, référent, sortie) est **déjà**
> porté par l'append (un fait nouveau périme l'ancien, visiblement). Assouplir = rendre le passé
> réécrivable = perdre le résidu et l'audit de l'omission = redevenir LeCLG. La souplesse est dans la
> **projection**, jamais dans la forme.

## Reste ouvert
- Le sexe administratif ≠ le prénom d'usage (deux données).
- Le domaine 5 : DDL à écrire (5 schémas, plus 4).
- Sept écrans non dessinés : trilobe, bilobe, synthèse, signature, tablette (= téléphone déplié).
- Le filtre-qui-meurt et la divergence-vue reposent sur des **pratiques** — une pratique se perd en
  18 mois. Rien ne les tient structurellement.
- `core.sh` : `dessin/01_file_active.html` est un nouveau consommateur du CORE, absent de
  `CONSOMMATEURS=(app_mockup.html)`. Sans l'y ajouter, la copie peut dériver en silence.
- `lobeCount()` compte les **nœuds**, pas les lobes (bilobe → 1). Elle ment sur ce qu'elle mesure.
