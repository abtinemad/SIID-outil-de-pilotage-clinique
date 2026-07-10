# 2026-07-09 — Le guichet de récolte, et la lecture de LeCLG

> Chantier ouvert après la Phase 0 (`ac29edf`). Rien n'est commité de cette session : le
> mockup d'app existe hors dépôt, les arbitrages ci-dessous ne sont **pas** inscrits dans
> `CONTINUUM.md`. Ce fichier est la seule trace. **Le prochain geste est l'extraction du
> CORE**, avant toute amélioration.

---

## Ce qui a été établi (et vérifié)

**Le mockup n'est pas un logo. C'est le shell de l'app.** `mockup/continuum_mockup.html`
contient déjà la navigation entière : `select(s)` + `shapeAt(s)` morphe 2/3/5 boucles —
la strate **est** la forme, il n'y a pas de routeur à écrire ; `ptParked` (5 lobes) est le
geste « l'œil se pose sur le nœud » ; `dashLobe` + `DASH_MODE` (3 lobes) l'entrée dans le
lobe, la corde sautée, la lentille chaussée dans la Vigilante seule ; l'oudjat (2 lobes) la
sentinelle ; `detacher()`/`rappeler()` le point d'entrée depuis la marque. Le `hint` du §19
était au conditionnel — *« le point rouge s'y pose et **ouvrirait** ses données »* : c'était
l'appel, il n'a pas été entendu pendant deux jours parce qu'on lisait la prose du fichier et
pas son code.

**La loi de l'écran de récolte.** *On lit par axe. On écrit au nœud.* Si le champ de saisie
vivait **dans** un lobe, choisir la boucle serait choisir l'axe : l'axe serait déposé, et
l'invariant 20 mourrait avec lui. Le lobe tenu **déroule** ; il ne reçoit pas. Il n'y a pas de
sélecteur d'axe parce qu'il n'existe **aucun endroit géométrique** où en mettre un — absence de
chemin, pas règle. Repos du pentalobe (`ptParked === null`) : l'œil circule, on écrit. Boucle
tenue : on lit.

**Au dépôt, le fil épaissit et aucune boucle ne bouge.** *On sait davantage, on ne l'a pas
encore rangé.* Le Goodhart meurt là : on ne peut pas engraisser une boucle en écrivant.

**`angleMort()` lisait une constante.** Il lit `ASYM[5].s` — le facteur d'asymétrie de la
marque — donc il désigne **le lobe 3, pour tous les patients**. Le gardien de l'angle mort est
aujourd'hui un décor. Il doit lire les densités, et **renvoyer −1 quand les cinq axes sont à
zéro** : il n'y a pas d'angle mort quand tout l'est. Le silence est une position (§15).

---

## Arbitrages d'Abtine (cette session)

1. **Les boucles bougent, dans une bande étroite.** Le grain (`ASYM[5].s`) reste la forme du
   nœud latent — sans lui, le patient nu s'affiche en fleur symétrique, la symétrie normative
   que §19 bannit. La densité **module** : `s_i = grain_i · (1 + 0.30 · (1 − e^(−d_i/τ)))`.
   Amplitude calée sur l'étalement du grain (0.87→1.13, soit 30 %). Critère : *l'amplitude est
   bien réglée quand la densité peut changer quelle boucle est la plus petite, rien de plus.*
   `u_i` ne dépend que de `d_i` — aucune normalisation par le max, sinon déposer sur le travail
   rétrécirait la boucle familiale.
2. **Le fil : quatre crans francs**, pas une courbe — *rien · pas assez · il y en a · fourni*.
   Le cran « fourni » migre vers la **métabolisation** (la réflexion n'y réside plus à la récolte).
3. **« Une quatrième couleur apparaît » n'est pas un invariant d'exécution** — c'est une relecture
   de dessin. Retiré des tests.
4. **La glose ≠ l'amorce.** §8 interdit le texte qui *explique le champ* ; il autorise ce qui
   *ouvre un geste*. Confirmé par le code de LeCLG : `DAY_STATES` porte onze amorces, aucune
   n'explique un champ. Le test doit interdire « un champ qui se présente », pas l'aide.
5. **Le brouillon n'existe pas.** La dictée produit un transcrit à l'écran ; l'infirmier valide ou
   corrige **au clavier**, puis signe (mot de passe). Rien n'est déposé avant la signature. Donc
   jamais deux observations pour un geste, et `depots_ref_reservee` n'a pas de trou.
6. **Le rangement en boucles est postérieur au dépôt.** L'observation se dépose entière ; la
   machine la répartit ensuite. « Voir les observations agrégées par domaine de vie » = tenir une
   boucle.
7. **Le ressenti du soignant : eval silencieuse**, domaine 3, sur les observations. Pas de nature
   nouvelle, pas de guichet.
8. **L'alliance se déclare par l'humain**, jamais par la machine. Quatre états — *pas d'alliance ·
   en cours · satisfaisante · rupture*. **Ce n'est pas une échelle** : on ne rompt pas ce qui n'a
   jamais existé. C'est une **histoire de transitions** ; ce qui appelle la vigilance est le
   passage, pas l'état. Propriété de la **paire** soignant-patient, jamais attribut du patient
   (sinon : *patient difficile*). Une eval **lue** de l'alliance existe en parallèle.

---

## Ce que le code dit, et qu'aucun document ne disait

**Les natures de récolte existent déjà** (`db/30`, l. 57) : `observation`, `hypothese`,
`inquietude`, `vide_info`, `gestation`, `levee`, `lien_travail`, `indication`. Le nouage (jamais
seul) : `situation`, `ressenti`, `demande`, `diffraction`, `lecture_clinique`, `equilibre`,
`compte_rendu`, `validation_typage`.

**L'infirmier ne peut pas déposer une `situation` ni une `demande`** :
`depots_grille_formulee_en_college` les verrouille sur `cadre = 'synthese_collective'`. Donc le
schéma en trois temps (Situation/intervention · Clinique · Demande) **ne peut pas être trois
champs**. C'est **un dépôt, trois couvertures** — calculées en direct, domaine 3, qui s'allument
sans rien remplir. La machine n'écrit pas dans le domaine 2.

**`champ_cible` contient `clinique`.** Ce n'est une nature nulle part. L'emplacement de la clinique
perçue était écrit avant le schéma qui la demande.

**`vide_info` + `champ_cible='clinique'`** = *« j'ai regardé, il n'y avait rien »* : un fait déposé,
radicalement distinct d'un trou remarqué par la machine.
**`gestation`**, seule nature autorisée à rester nue (`depots_contenu_sauf_gestation`) =
*« quelque chose travaille, je ne sais pas encore le dire ».* C'est l'anti-stress de l'infirmier,
et il est déjà en base : *personne n'a jamais mal rempli un champ qu'il avait le droit de laisser
en gestation.*

**`ressenti` exige `synthese_collective`** — donc l'affect d'un soignant ne peut être formulé que
dans une salle où il se trouve. Personne ne peut écrire *« Céline est débordée par ce patient »*
dans le dos de Céline. Ce n'est pas de la bienséance, c'est un `CHECK`.

---

## LeCLG — ce qui transfère, ce qui ne transfère pas

**L'axe qui décide : où va la source.** LeCLG **détruit la source et garde la distillation**
(`sessions.messages CHECK (messages = '[]')`). CONTINUUM **garde la source et jette la
distillation** (append-only, domaine 3 recalculable). Architectures inverses, pour la bonne raison :
*l'effacement protège de la fuite, l'append-only protège de la réécriture.* Conséquence : **LeCLG ne
peut pas auditer sa propre omission** — la conversation est morte. Toute l'architecture d'évaluation
(projection sur source, couverture structurelle comme plancher) n'a de sens que parce que la source
survit. Cette partie-là ne se copie pas : elle se construit.

**La continuité n'est pas mémorisée, elle est re-dérivée à chaque tour.** `useStreamChat` fabrique
trois tissages longitudinaux, injectés en `[INSN: …]` **en append au dernier message de la personne**,
**un seul par tour** (motif > blocage > absence) :
- *le motif qui revient* — gaté sur `patternRecognized` (**qui doit venir d'elle**) et `alliance >= 1` ;
- *l'endroit où ça s'arrête souvent* — mode du premier trou dans `validated_steps` ; le modèle **ne
  reçoit jamais l'indice ni le nom de l'étape**, seulement `STALL_HINT` en langue commune. **La machine
  dégrade sa propre précision avant de parler** : « montré jamais chiffré » appliqué au prompt ;
- *la lecture par l'absence* — le `deplacement_type` jamais tenté, une fois **à vie**, jamais nommée
  comme un manque. **Le gardien de l'angle mort existe déjà, en production, avec ses trois verrous.**

**L'évaluateur silencieux renvoie `situation, ressenti, demande, diffraction, equilibre`** — la grille
du trilobe, mot pour mot, déjà murée (elle ne gouverne que l'escalade de l'interface). Le champ
`raisonnement` est **généré avant les booléens** : juger après avoir regardé, la réflexivité dans la
forme de sortie. Et `eval` ne reçoit **aucun** rappel du passé — sinon `reconnaissance_pattern` serait
amorcé au lieu d'être constaté. → **la Vigilante ne doit jamais recevoir ses propres lectures
antérieures.**

**Le tampon `_n`.** La projection porte le nombre de cartes dont elle est issue ; un dépôt de plus,
elle est périmée **par construction**. Personne ne relance. Et l'append-only rend le compte
**monotone** : chez CONTINUUM le compte est une clé de péremption *parfaite*, pas une heuristique —
l'invariant 1 paie à un endroit qu'il ne visait pas.

**Ce qui ne transfère pas.** La moitié « registre » de `REGISTRE_LAIQUE` (bannir le mot médical n'a de
sens que là où le lecteur *est* le sujet ; le lecteur de CONTINUUM est psychiatre) — seule la moitié
**posture** transfère au pentalobe, la moitié registre redevient nécessaire au trilobe où le sujet
redevient le soignant. Les catalogues d'intériorité (16 émotions, prismes, la Lueur qui *nomme*) :
invariant 12, mort à l'arrivée au niveau patient. `localStorage` comme registre (le « une fois à vie »
est en fait « une fois par navigateur »). Le climat anonyme entre pairs symétriques : le bilobe a une
hiérarchie.

**Deux défauts de LeCLG, trouvés dans le code :**
1. `absenceSurfaced` vit dans `localStorage.collegue_absence_invited` → **per-device**, pas par personne.
2. **La Matrice peut se calculer sur un Élan périmé** : `lien`/`affect` sont invalidés **par compte**
   (`_n === n`), `elan` **par âge** (7 j), `matrice` (21 j). La porte est `elanFresh` — l'âge. Dix cartes
   déposées cette semaine, l'Élan reste « frais », la Matrice ignore les dix. Deux régimes d'invalidation
   dans une chaîne, le plus lent gouverne. C'est la cascade que `recherche/architecture_eval.md` interdit.

**Et la pièce qui donne raison à l'invariant 20 contre LeCLG :** `cartes.sphere` — **l'axe est stocké
sur le dépôt**, et `eval_lien` re-range en recevant des cartes qui portent déjà leur sphère. Le
rangement se confirme lui-même à chaque tour ; le second ne peut plus jamais dire *non*.

**Les snapshots (`eclats.matrice_snapshot`, …) : la machine s'archive elle-même.** C'est une faute, pas
un prix à payer. Chez CONTINUUM : la machine ne stocke rien, **l'humain cite** — la projection entre en
domaine 2 uniquement recopiée dans un dépôt signé, sous la responsabilité de qui la cite. Même règle
d'attribution. L'acte reste intelligible, le condensé reste recalculable.

---

## Fils ouverts — arbitrage requis

- **§19, trois phrases à réviser** : « la taille = le volume de récolte sur cet axe » et « mince = angle
  mort à explorer » sont incompatibles avec la modulation étroite arbitrée. La formulation doit dire :
  *le grain préexiste, la densité module, l'asymétrie se lit à l'œil et ne se conclut jamais.*
- **La nature de `alliance`.** Elle n'est ni dans la famille observation ni dans le nouage. Déclarée par
  le collège → `synthese_collective` ; par le médecin → `responsabilite_medicale`. Le `CHECK` force à
  choisir. (Position tenue par Claude : le collège.)
- **La signature.** `SET LOCAL continuum.agent_id` + RLS garantissent **qui** est l'auteur ; elles ne
  garantissent **pas qu'un acte a été signé**. Le mot de passe à chaque dépôt est aujourd'hui un rituel
  d'interface sans contrepartie en base.
- **La jointure interdite du bilobe.** L'alliance porte le soignant dans son corps même. Le bilobe ne
  peut recevoir que la **distribution** des états, jamais les paires — sinon l'hypothèse institutionnelle
  s'écrit toute seule : *le pôle a un problème d'alliance, et il s'appelle Céline.* Et « anonyme » ne
  suffit pas : dans un pôle de neuf, une distribution par patient dénonce. À tenir par **absence de
  jointure**, comme le sanctuaire est tenu par absence de guichet.
- **L'écart déclaré ↔ lu.** Troisième moment de la Vigilante, de la même famille que brut↔formulé et
  Affectif↔Réflexif. À inscrire ou à refuser.
- **Le verbatim doit être rendu moche.** Si le moteur de dictée paraphrase, ce que l'infirmier signe est
  de la prose de machine, et *l'attribution est la garde* devient une signature au bas d'un texte que
  personne n'a écrit.

---

## Défaut introduit, à défaire en premier

Le **CORE existe en deux exemplaires** — `mockup/continuum_mockup.html` et le mockup d'app (20 030
octets, SHA `3e4413197fb32255`, identiques aujourd'hui). Byte-identiques **maintenant**, condamnés à
diverger au premier geste. La discipline « CORE prouvé par SHA-256 depuis git » ne peut plus rien
prouver dès qu'il y a deux copies.

**Premier commit : extraire `mockup/noeud.js`** — un fichier, un SHA, deux consommateurs
(`continuum_mockup.html` : l'atelier, la marque, les épreuves ; `app_mockup.html` : l'app). Rien
d'autre avant.

Puis, dans l'ordre : le guichet à un champ avec les trois couvertures vivantes · `gestation` et
`vide_info` à portée de doigt · le compte de péremption affiché sur les boucles (*calculé sur 41
dépôts, il y en a 47*) · le banc `mockup/tests/fidelite.js`. La dictée après — elle n'ajoute rien tant
que le dépôt n'est pas juste.

**Le banc de fidélité.** Doivent être **impossibles** : un champ de saisie dans un lobe tenu · une
boucle qui bouge sans passe · un dépôt affiché sans auteur ni heure · l'œil qui désigne un angle mort
sur patient nu · un champ qui se présente. Doivent **réussir**, sans quoi les précédents ne prouvent
rien : le dépôt épaissit le fil · la passe déplie les boucles · une boucle tenue rend des portions
verbatim · un fragment à deux axes s'affiche comme **un** croisement. (Contrôles positifs obligatoires :
quatre erreurs suffisent à simuler quatre vertus — cf. `db/tests/impossibilites.sql`.)
