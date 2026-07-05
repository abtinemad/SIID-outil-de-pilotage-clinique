# CONTINUUM — Schéma de données

> **Servir la continuité du parcours, contre la fragmentation de l'esprit.**

> Statut : v1, dérivé de `presentation.md` (§2, §3, §6, §10, §13, §15) et des arbitrages
> de session (07/2026 : append-only + soupape de correction projetée ; acteur mutualisé
> sans vue inversée ; flux typé unique). En cas de conflit, `presentation.md` a raison —
> et ce document doit alors être corrigé, pas contourné.

---

## 0. La loi du schéma

> **Tout s'écrit en append. L'état courant n'est jamais stocké : c'est une projection
> du flux. Les projections diffèrent par domaine : la récolte projette corrigé, les
> dépôts projettent tout.**

Trois lois dérivées :

1. **Rien ne s'écrase, rien ne s'efface.** Aucune table du système n'accorde `UPDATE`
   ni `DELETE` au runtime. Réviser = écrire un acte daté qui référence l'acte
   antérieur. UPDATE coupe le fil ; l'append le plie. (« Révisable *visiblement* —
   jamais d'écrasement silencieux », §2.)
2. **La projection est la lecture, pas la vérité.** L'écran montre une projection du
   flux ; le flux entier reste sous la main. En **récolte** (domaine 1), la projection
   applique les corrections : le bruit de saisie se masque, reste auditable. En
   **dépôts** (domaine 2), la projection ne masque rien : chaque pli s'affiche — la
   coquille clinique n'existe pas, il n'y a que des états datés du regard.
3. **Le sanctuaire est une absence de chemin, pas une permission.** Le rôle machine ne
   possède pas `INSERT` sur le domaine des dépôts. La provenance est structurelle
   (le domaine d'écriture), jamais un attribut de ligne — un champ `source` serait
   falsifiable ; une absence de chemin ne l'est pas.

---

## 1. Les quatre domaines

Calqués sur les trois couches du §3, plus l'identité mise aux extrémités (§15, §18) :

| Domaine | Contenu | Qui écrit | Correction | Couleur (§3) |
|---|---|---|---|---|
| **0 — Identité** | nom, prénom, naissance | secrétariat / coordinateur | append + corrigé projeté | — (extrémités seulement) |
| **1 — Récolte** | journal d'actes, paramètres, consentements, fiche | équipe (régime directif §10) | append + **corrigé projeté** | encre (fait saisi) |
| **2 — Dépôts** | la traversée, le sanctuaire, hypothèses, inquiétudes, liens | humains seulement | append, **rien ne se masque** | encre / **rouge** (sanctuaire) |
| **3 — Machine** | projections, propositions, synthèses | machine seulement | recalculable ou immuable daté | ardoise / mono |

Le domaine 3 **lit** 0, 1 et 2 ; il n'écrit **que chez lui**. Les domaines 0–2 ne
lisent jamais le domaine 3 comme source de vérité (une proposition n'est qu'une
proposition tant qu'un dépôt ne l'a pas validée).

---

## 2. Domaine 0 — Identité (les extrémités)

```
patients_identite (
  ipp             text PRIMARY KEY,      -- la clé unique, non négociable (§15)
  nom, prenom     text,
  date_naissance  date,
  secteur         text,
  corrige_id      uuid NULL              -- mécanique de correction du domaine 1
)
```

- Tout le reste du système ne connaît **que l'IPP**. L'identité nominative se résout
  à l'affichage (saisie, sortie), jamais dans le moteur. Pseudonymisation par
  structure, pas par option (§18).
- **Marqué pour le repo** : la v1 hébergée met cette table sous accès restreint
  (RLS stricte) ; l'idéal « l'identité ne quitte pas le poste » est une décision de
  déploiement (chiffrement applicatif de cette seule table, ou résolution locale) —
  à trancher au montage, pas silencieusement.

---

## 3. Domaine 1 — Récolte

**Loi du domaine** : du factuel, régime directif (§10 — la contrainte filtre à la
source), append-only avec **correction projetée**.

**Mécanique de correction** (arbitrage de session) : corriger = insérer une ligne qui
porte `corrige_id → ligne corrigée`. La projection courante suit la queue de chaque
chaîne de correction. La coquille survit dans le flux (auditable), disparaît de
l'écran (propre). Ce n'est **pas** une exception à l'append-only : c'est un acte typé
de plus. La différence avec le domaine 2 est une règle de **projection**, pas de
stockage.

```
journal_actes (
  id                 uuid PRIMARY KEY,
  ipp                text NOT NULL,          -- rendu obligatoire (259/280 déjà remplis)
  date_acte          date NOT NULL,
  modalite           text,                   -- type d'intervention (domicile, téléphone, CMP…)
  acte_principal     text,
  agents             text[],
  commentaire        text,
  evenement_couture  text NULL,              -- vocabulaire contrôlé, voir ci-dessous
  corrige_id         uuid NULL,
  saisi_par          uuid, saisi_le timestamptz
)
```

**Événements de couture** — règlement de la question ouverte n°2 (§22). Ce qui était
noyé dans `Commentaire` (« RELAI CMP », « SYNTHESE »…) devient un champ typé sur la
ligne d'acte, amorcé par la feuille `Choix multiple` :
`relai_engage · relai_effectif · synthese · renouvellement_ordo · hospitalisation ·
fin_pec · …` (liste ouverte, corrigeable en récolte). Ce sont des **faits d'actes** →
régime directif, jamais des dépôts. Le fil de continuité se lit ensuite **en
projection**, comme le reste.

```
parametres_patient (ipp, date_entree date, rythme_attendu_jours int, corrige_id, …)
consentements      (ipp, partage_infos bool, visites bool, date, corrige_id)
diagnostic_leger   (ipp, code text, libelle text, corrige_id)
agents             (id, nom, fonction, medecin_coordinateur bool)   -- référentiel opérationnel
```

- `rythme_attendu_jours` paramètre le capteur (borne b, §15 : relatif au rythme, jamais
  absolu). Alimenté par `PATIENTS SEQUENTIELS` pour les NAP. Les nombres sont permis
  ici : c'est le domaine du fait, pas du dépôt.
- `diagnostic_leger` : le diagnostic descend au rang de **fait tenu léger** (§2). Il
  existe (c'est un fait), il ne structure **jamais** : aucun tri, aucun filtre, aucun
  affichage en tête de carte. Tenu par **absence d'interface**.
- Le **type SIID n'est pas ici** : il n'est pas un champ qu'on coche (§15). Il se
  dérive du mouvement (domaine 3) et se valide par dépôt (domaine 2).
- Le **statut n'est pas ici non plus** : c'est une projection des événements de
  couture. Vocabulaire projeté : `actif · relai_en_cours · renoué (→ où) ·
  interrompu (rupture subie)`. **Aucun état « clôturé »** — clôturer n'est jamais une
  coupe (§2) : on renoue ailleurs, ou l'on nomme la rupture subie comme le fait
  qu'elle est. Le vocabulaire lui-même porte la doctrine.

---

## 4. Domaine 2 — Le flux de dépôts

Une seule table. Le fil rendu littéral : **une ligne-patient = un flux chronologique
d'actes de dépôt**, chacun daté, attribué, typé. Le typage qui force chaque dépôt à
déclarer sa nature **est** l'anti-fourre-tout (arbitrage 3, contre l'ancienne
formulation de la passation).

```
depots (
  id           uuid PRIMARY KEY,
  ipp          text NOT NULL,
  depose_le    timestamptz NOT NULL,
  auteur_id    uuid NOT NULL,                 -- « datée ET attribuée » (§2)
  cadre        text CHECK (cadre IN ('seul','synthese_collective')),   -- §10
  nature       text NOT NULL,                 -- catalogue ci-dessous
  champ_cible  text NULL,                     -- pour vide_info / gestation
  position     text NULL,                     -- source du regard (voir catalogue)
  facette      text NULL,                     -- demande : surface / reelle
  acteur_id    uuid NULL,
  ref_id       uuid NULL,                     -- dépôt révisé / levé, ou proposition validée
  contenu      text                           -- prose ; NULL permis pour gestation seule
)
```

**Colonnes : du texte, des dates, des références. Rien d'autre.** Aucune colonne
numérique n'existe sur un dépôt (invariant contresigné) : pas de score, pas de poids,
pas de criticité, pas d'échéance — non pas interdits, **inexistants**.

### Catalogue des natures

| nature | registre | position / facette | contenu | mécanique |
|---|---|---|---|---|
| `situation` | traversée | — | prose : le réel brut, cité, non lissé | |
| `lecture_clinique` | **SANCTUAIRE** | position **obligatoire** ∈ `medecin · equipe · entourage · structure` (source-agnostique, §4) | prose : **le mécanisme qui traverse, jamais l'étiquette** ; registre hypothétique, tenu, daté | `ref_id` = lecture révisée (chaîne visible) |
| `hypothese` | **SANCTUAIRE** | — | prose | `ref_id` = hypothèse révisée ; se lève par `levee` |
| `ressenti` | traversée | position **obligatoire** ∈ `patient · equipe · entourage` (trois positions, jamais fusionnées) | prose | |
| `demande` | traversée | facette ∈ `surface · reelle` | prose : la demande dégagée sous l'enveloppe | |
| `indication` | traversée | — | prose : le « pourquoi SIID » — premier dépôt du fil ; les six portes en latence **côté machine** (§11) | la ligne existante *est* la décision d'indication matérialisée ; la digestion (sanctuaire) se dépose, si argumentable, en `lecture_clinique` |
| `diffraction` | traversée | attribution **jamais anonyme** : `acteur_id` si la source est un acteur, sinon nommée dans la prose | prose : le regard depuis une autre position, gardé contrasté | |
| `equilibre` | traversée — **vigilance plume maximale** (§5) | — | prose : **le nouage** — toutes les couches nouées, l'état interne dans les mots du clinicien, **et le projet rédigé vers l'avant dans le même texte** (jamais un 7ᵉ terme, jamais trois cases temporelles) | la **spirale** = la suite chronologique des dépôts `equilibre` ; le projet reste hypothèse de travail, jamais contrat opposable |
| `vide_info` | suit le champ | `champ_cible` (+ position pour ressenti/diffraction) | prose nommant le vide (« aucun tiers — isolé ») | événement typographié, pas un blanc (§6) |
| `gestation` | **SANCTUAIRE** | `champ_cible` (+ position éventuelle) | **NULL permis** (« rester nu », §6) | ouvre l'état « hypothèses en cours » ; se lève par `levee`. **Seul dépôt à effet machine** : suspend la relance sur ce champ (§11). La machine voit *qu'il* existe, jamais ce qui gestationne |
| `inquietude` | **SANCTUAIRE** | — (portée patient) | prose datée (« le 3 mars, ça m'inquiète ») | se lève par `levee` — sinon étiquette qui condamne (§15). **La couleur déposée = il existe une inquiétude ouverte** |
| `lien_travail` | **SANCTUAIRE** (la lecture de tension est clinique, §13) | `acteur_id` **obligatoire** | **prose libre** : la tension et la direction (coudre, tenir, desserrer, recoudre ailleurs) vivent **dans les mots, jamais en enum** — un enum de directions serait le signe fixe que §13 bannit. Les directions servent d'amorces grises à l'écran, jamais de valeurs stockées | `ref_id` = lecture de lien révisée |
| `validation_typage` | traversée | — | `type ∈ aigu · nap · chronique` **+ prose du sens lu** (stabilisation *ou* décrochage — la valeur seule ne dit rien, §15a/c) | `ref_id → proposition machine` **obligatoire**, sauf premier typage à l'indication. Contrainte structurelle : on ne retype pas d'un clic — il faut que le mouvement l'ait proposé (tue le Goodhart par le typage) |
| `levee` | suit le registre du dépôt levé | — | prose du motif (le fait qui a résisté ; l'inquiétude dissipée) | `ref_id` **obligatoire** → `hypothese · inquietude · gestation`. Lever n'est pas effacer : deux actes datés, tous deux visibles |
| `compte_rendu` | traversée | — | prose : la synthèse de prise en charge, **reformulée** puis **validée énoncé par énoncé** et signée | pas de `ref_id` machine (le brouillon est éphémère, §6.3) ; la **signature EST l'acte de dépôt** (`auteur_id` = signataire, `depose_le` = signature) — immuable comme tout dépôt ; la machine ne l'insère jamais (invariant 2) |

Contraintes d'exemple (le repo fera le DDL complet) :

```sql
CHECK (nature <> 'ressenti'          OR position IN ('patient','equipe','entourage'))
CHECK (nature <> 'lecture_clinique'  OR position IS NOT NULL)
CHECK (nature <> 'lien_travail'      OR acteur_id IS NOT NULL)
CHECK (nature <> 'levee'             OR ref_id IS NOT NULL)
CHECK (nature = 'gestation'          OR contenu IS NOT NULL)
```

**Le registre (sanctuaire / traversée) est une propriété du *type*, codée en dur dans
la doctrine — jamais une colonne par ligne.** Un flag par ligne serait falsifiable ;
une propriété de type ne l'est pas. Conséquence machine : sur la traversée, la plume
met en forme sans conclure ; sur le sanctuaire, elle **cite verbatim ou se tait** (§5).

**Le pluriel des hypothèses** : pas de contrainte de comptage sur l'humain (« l'unique
est le cas particulier », pas l'interdit — §2). La protection est **par la forme** :
l'UI présente toujours *le faisceau*, jamais « l'hypothèse » ; et côté machine la
règle est dure (voir `pistes`, domaine 3 : plusieurs ou le silence).

---

## 5. L'acteur — commodité de saisie, jamais entité vivante

L'IDEL est un lien (§13), un angle (§4), une position du Ressenti — « trois facettes
du même acteur ». Une entité, référencée depuis les trois régimes : passer d'une
facette à l'autre est une navigation, jamais une re-saisie.

```
acteurs (
  id          uuid PRIMARY KEY,
  libelle     text NOT NULL,                 -- « SAMSAH Les Mureaux », « Mme D., sœur »
  categorie   text,                          -- amorce : idel · samsah · cmp · famille · psy_liberal · travail · structure · autre
  coordonnees text NULL
)
```

Arbitré en session : **l'identité se réutilise en saisie** (auto-complétion sur
l'existant — la re-saisie ne protège rien). Ce qui fait le CRM n'est pas le partage de
l'identifiant, c'est la vue inversée et l'attribut porté. Donc **trois interdits
structurels** :

1. **Aucune vue inversée** acteur → patients. Aucune API, aucun écran « tous les
   patients de ce SAMSAH ». (Les FK restent joignables en SQL brut — assumé : c'est le
   geste contre le grain, pas un clic.)
2. **Aucun attribut porté** au-delà de l'identité de contact. Pas de note, pas d'état,
   pas de « qualité de partenaire ». Noter la structure = le début du CRM.
3. **Aucune maintenance hors saisie patient.** L'acteur naît et se corrige à
   l'occasion d'un dépôt ou d'une récolte — jamais dans un écran « gestion des
   partenaires ». L'acteur ne vit pas pour lui-même.

**Point interprété, soumis à ton veto** : j'ai rangé `coordonnees` dans l'identité
(*joindre* n'est pas *noter*) — ton « aucun champ porté par l'acteur » lu comme
« aucun attribut descriptif ou évaluatif ». Si tu tiens le strict, les coordonnées
redescendent en récolte par patient, et la commodité de saisie se paie à chaque fois.

---

## 6. Domaine 3 — Machine

**Loi** : lit 0–1–2, n'écrit que chez elle. Tout y est soit **recalculable** (les
projections — jetables à volonté, donc jamais propriétaires d'un état), soit
**immuable et daté** (propositions, synthèses — gardées pour la trace).

### 6.1 Projections (recalculées, jamais autoritaires)

Le capteur de fragmentation (§15) — tous les signaux mesurent **un seul phénomène** :

| Projection | Source | Note |
|---|---|---|
| `silence_jours` | max(date_acte) par IPP | le fil qui se détend |
| `glissement_modalite` | suite des modalités | domicile → téléphone |
| `actes_non_aboutis` | commentaire (« ABSENT », « REFUS ») | le fil qui échappe |
| `rythme` / `nap_retard` | écarts de dates × `rythme_attendu_jours` | borne b : relatif |
| `recours_intensite` | fréquence de contacts par fenêtre glissante | **fait, jamais « stable »** (borne a) |
| `differentiel_recours` | recours entre fenêtres | expose valeur, **sens**, durée dans l'état (borne c) — jamais bien/mal |
| `couleur_factuelle` | recours relatif au rythme du type + sens | registre Encre, états du fil — jamais feu tricolore |
| `type_courant` | dernier dépôt `validation_typage` | |
| `statut_parcours` | chaîne des événements de couture | vocabulaire du §3 ci-dessus |
| `etat_champs` | flux de dépôts | les quatre états du §6 — voir §7 |
| `densites` | COUNT(dépôts) par axe | descriptif, permis — déjà prêt pour le nœud v2, rien à construire |
| `angles_multiples` | COUNT(DISTINCT position) > 1 sur `lecture_clinique` | le marqueur §4b : binaire, zéro sémantique |
| `portes_couverture` | prose d'`indication` × six portes (§12) | **la seule opération sémantique machine du système** : classer la *couverture* (quels sujets la prose a touchés), **jamais en lire le sens**. Borne explicite, à tester comme telle |

**Aucune projection n'agrège entre patients.** Le recours est un thermomètre patient
par patient (borne e) ; le modèle n'offre ni vue ni fonction d'agrégat.

### 6.2 Propositions (immuables, datées)

```
propositions_retypage (id, ipp, emise_le, type_propose, base_factuelle text)
relances              (id, ipp, porte, question, emise_le, UNIQUE (ipp, porte))
pistes                (id, ipp, emise_le, contenu text[] CHECK (cardinality(contenu) >= 2))
```

- **Retypage** : le différentiel propose, le regard valide (dépôt `validation_typage`
  qui la référence). La proposition porte sa base factuelle — jamais une lecture.
- **Relances** (§11) : une fois par porte (`UNIQUE`), **jamais émise si une gestation
  est ouverte** sur la demande (relancer une gestation = forcer la maturité = fabriquer
  le verdict prématuré), **affichée dans la vue, jamais notifiée**. Question qui ouvre,
  jamais champ qui ordonne.
- **Pistes** (§4c, §8) : cardinalité ≥ 2 par contrainte — **plusieurs ou le silence**.
  Une piste seule est une interprétation déguisée. Jamais sur la lecture clinique.

### 6.3 La plume — brouillons éphémères, comptes rendus signés

**Le brouillon n'est pas une table.** La plume rédige un compte rendu de prise en charge
comme une **projection** (§6.1) : calculé à la volée depuis 0-1-2, affiché, édité,
**jamais persisté**. Cohérent avec la loi §0 (« l'état courant n'est jamais stocké »).
Rien de la machine n'entre en base tant que l'humain n'a pas signé — donc aucune table
`syntheses`, aucune colonne de provenance stockée (rien qui ressemble à l'attribut
`source` que la loi 3 bannit).

La plume **reformule le déposé, elle ne fabrique pas** : synthétiser, organiser,
reformuler ce qui est en 0-1-2 — mais **chaque énoncé dérive d'au moins un dépôt**, et un
énoncé qui ne pointe vers aucune source **n'est pas généré** (« dérivé traçable ; sans
source = refusé »). C'est une **garde de génération** (locus code + test, comme
l'invariant 3), pas une donnée conservée. Sur le **sanctuaire**, elle ne reformule
jamais : elle **cite verbatim ou se tait** (§5). Elle **refuse sous seuil de matière**
(« pas assez déposé pour restituer un fil »). Discipline §5 (montre sans expliquer,
**reformule le déposé sans fabriquer**, garde l'écart, le vide reste vide, **ne noue
jamais la Clinique**) tenue par prompt + tests — locus « code », assumé et nommé.

**La signature est la frontière — le seul moment où quelque chose se grave.** Le soignant
valide le brouillon **énoncé par énoncé** (*reconnaissance + surprise* : une surprise non
reconnue se coupe) ; puis il **signe**, et le texte validé devient un dépôt de nature
`compte_rendu` (§4, domaine 2) — immuable, daté, attribué au signataire. **La machine
n'insère jamais** (invariant 2) : la signature *est* l'acte de dépôt humain ; la machine
n'a fait qu'afficher un brouillon éphémère — même logique que le retypage (elle propose,
l'humain dépose). Avant signature : rien en base. Après : le record.

### 6.4 Le miroir de l'agent (Vigie ③ — privé, jamais agrégé)

La trace de la rédaction — ce que la plume a proposé, ce que le soignant a **gardé, coupé
ou reformulé** — est conservée pour **le soignant seul**, comme matière de réflexivité
(§18 bis, échelle ③). C'est le seul résidu persistant du brouillon, et il n'appartient
qu'à son auteur.

```
miroir_agent (
  id             uuid PRIMARY KEY,
  utilisateur_id uuid NOT NULL,
  note_le        timestamptz NOT NULL,
  evenement      text CHECK (evenement IN ('propose_garde','propose_coupe','propose_reformule')),
  extrait        text                    -- l'énoncé concerné, pour se relire ; nullable
)
```

Append-only comme le reste. **Portée strictement privée** : lisible par le seul
`utilisateur_id` connecté — non par discrétion mais par **absence de chemin** (RLS
stricte, aucune vue croisée, aucune fonction d'agrégat), comme le sanctuaire et le climat
(§18 bis ①). Le **miroir institutionnel** est un **autre objet**, bâti sur les données
cliniques du **dashboard** (§6.1), **jamais** sur l'aspiration des miroirs privés : les
deux ne partagent aucune source.

Deux gardes non négociables :
- **Réflexion, pas score.** Le miroir montre ce que tu as traversé ; il ne te note jamais
  (« 8 coupes sur 10 » n'est pas une performance). Chiffrement phénoménologique entier.
- **Mesure auto-effaçante.** Il crédite ce que *tu* fais, jamais ce que la machine a
  suggéré — il ne compte pas sa propre influence.

### 6.5 Ce qui n'existe pas côté machine

**Pas de table de notifications. Pas de job d'alerte. Pas de file de priorité.**
« Tiré, jamais poussé » (§15d) n'est pas un réglage : c'est une **absence
d'infrastructure**. Le capteur s'affiche quand on le regarde (le trimestriel, la vue
patient) ; il ne vient jamais te chercher.

---

## 7. Les quatre états du §6 — projection, jamais colonne

Par (champ, position éventuelle), dérivé du flux :

1. **gestation ouverte** → *hypothèses en cours* (relance suspendue) ;
2. sinon, **dernier dépôt pertinent = `vide_info`** → *vide-info* (événement
   typographié) ;
3. sinon, **des dépôts existent** → *rempli* ;
4. sinon → *non-renseigné* (absence de lignes : ne coûte rien, ne réclame rien).

Composable : un contenu ancien + une gestation ouverte s'affichent **ensemble**
(le travail en cours n'efface pas ce qui a été argué).

**Les deux couleurs** (§15) : `couleur_factuelle` = projection du recours ;
`couleur_deposee` = il existe une `inquietude` ouverte. Affichées **côte à côte,
jamais combinées** — l'écart entre les deux est le signal le plus précieux (la
perception qui court devant le fait).

---

## 8. Invariants de schéma — et où chacun est tenu

C'est **l'instrument anti-dérive** (doléance a de la passation) : toute évolution
future du schéma doit dire dans quelle ligne elle tombe, et si elle en casse une.
Le test reste : *est-ce que ceci CLASSE, CHIFFRE ou CONCLUT à la place de l'humain ?*

| # | Invariant | Tenu par |
|---|---|---|
| 1 | Rien ne s'écrase, rien ne s'efface | **structure** — `REVOKE UPDATE, DELETE` sur toutes les tables au runtime |
| 2 | La machine n'écrit jamais un dépôt | **structure** — rôle machine sans `INSERT` sur `depots` |
| 3 | La machine ne suggère jamais de lecture clinique, même « évidente » | **structure + code** — aucun chemin ; `pistes` bornées hors sanctuaire, testées |
| 4 | Aucun nombre sur un dépôt (seuls nombres = des dates) | **structure** — les colonnes n'existent pas |
| 5 | Aucune échéance nulle part | **structure** — aucune colonne « pour quand » ; les dates disent quand une chose *a eu lieu* |
| 6 | Jamais d'agrégat de recours (Goodhart) | **absence** — aucune vue/fonction agrégée ; le `AVG` = geste contre le grain, jamais un clic |
| 7 | Pistes machine plurielles ou silence | **structure** — `CHECK cardinality ≥ 2` |
| 8 | Relance : une fois, jamais sur gestation, jamais poussée | **structure + code** — `UNIQUE (ipp, porte)` + garde gestation + absence d'infra de notification |
| 9 | Retypage exige une proposition (le mouvement propose, le regard valide) | **structure** — `ref_id` obligatoire sauf premier typage |
| 10 | Correction masquée en récolte, jamais en dépôts | **code testé** — deux fonctions de projection distinctes |
| 11 | Acteur : ni vue inversée, ni attribut porté, ni maintenance propre | **structure + absence** — schéma nu + aucune API inverse (SQL brut joignable : assumé) |
| 12 | Plume : **cite** le sanctuaire (jamais reformulé), **reformule** le déposé hors sanctuaire, refuse sous seuil, ne noue jamais la Clinique | **code + pratique** — prompt discipliné, tests de refus |
| 13 | Contenu libre déposé en synthèse collective, sauf médecin coordinateur (droit de fonction, pas hiérarchie de lecture) | **code** — permission applicative sur `cadre` |
| 14 | Le vert ne dispense jamais de regarder (revue exhaustive au trimestriel) | **pratique** — hors schéma, nommé pour ne pas être oublié |
| 15 | Brouillon = dérivé **éphémère**, jamais stocké (loi §0) ; garde de génération « sans source = non généré » | **code + test** — pas de table, garde à la génération |
| 16 | Compte rendu → acte tracé par **signature humaine** seulement ; la machine ne l'insère jamais | **structure** — rôle machine sans `INSERT` sur `depots` (invariant 2) ; signature = dépôt `compte_rendu` |
| 17 | Miroir agent : **privé par absence de chemin** (RLS, aucune vue croisée, aucun agrégat) ; réflexion, jamais score | **structure + code** — RLS sur `utilisateur_id` + aucune fonction d'agrégat |

---

## 9. Absences délibérées

Ce que le schéma **refuse de contenir**, pour que personne ne l'y « ajoute » par
commodité :

- champ score / poids / criticité / priorité / gravité — sur quoi que ce soit ;
- colonne d'échéance, de deadline, de « à faire pour le » ;
- vue ou endpoint d'agrégation inter-patients ;
- table de notifications, file d'alertes, tri par urgence ;
- statut « clôturé » / « terminé » (on renoue, ou l'on nomme la rupture) ;
- échelle comparant des angles (le tient/fragile/décroche supprimé ne revient pas) ;
- enum de direction de lien (la direction vit dans la prose) ;
- champ diagnostic structurant (il existe en fait léger, il n'organise rien) ;
- hiérarchie entre positions de lecture (médecin / équipe / entourage / structure :
  quatre valeurs d'un même champ, aucun ordre).

---

## 10. Correspondance avec l'esquisse du §15

| Esquisse | Devenu |
|---|---|
| IPP non négociable, identité aux extrémités | domaine 0 ; tout le moteur sur IPP |
| Statiques : type SIID, date d'entrée, statut | `date_entree` en récolte ; **type = dérivé + validé** (proposition → dépôt) ; **statut = projection** des événements de couture |
| Clinique = sanctuaire, dédoublée médecin/équipe | `lecture_clinique` avec position obligatoire — élargie source-agnostique (§4 : entourage et structure déposent aussi leur lecture, transcrite attribuée) |
| Ressenti = trois sous-champs, vide-info distinct | position obligatoire + `vide_info` de plein droit |
| Diffraction = regards attribués + booléen `sans_partage` | attribution obligatoire ; **`sans_partage` dissous** en `vide_info(diffraction)` — le vide comme événement, pas comme flag |
| Ressources = zones libres, dynamiques, sans signe | `lien_travail` en prose + entité `acteur` (§5 ci-dessus) |

---

## 11. Marqué pour le repo (implémentation, pas doctrine)

1. **Hébergement de l'identité** (§18) — RLS stricte vs chiffrement applicatif vs
   résolution locale : à trancher explicitement au montage.
2. **Calibration du recours** — taille des fenêtres glissantes et seuils de sens :
   sur les données réelles du journal, en itération avec le regard, jamais en chambre.
3. **Moteur de couverture des portes** — l'unique opération sémantique : à
   implémenter borné (couverture, pas lecture) et à tester comme frontière.
4. **Permissions** — `cadre`, droit du médecin coordinateur, rôles `soignant` /
   `machine` / migration.
5. **Pipeline de rédaction** — brouillon éphémère (garde « sans source = non généré »),
   validation énoncé par énoncé (reconnaissance + surprise, coupe = masque), signature =
   dépôt `compte_rendu`. Le brouillon ne se stocke pas ; seule la trace du **miroir agent**
   (privée, §6.4) persiste.
6. **Miroir institutionnel** — objet distinct, bâti sur les données cliniques du dashboard
   (§6.1), jamais sur les miroirs privés. À concevoir à part, sous les gardes de la Vigie
   (abstention d'issue, pas de surveillance des soignants).
