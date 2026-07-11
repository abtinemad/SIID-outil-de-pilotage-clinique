# CONTINUUM — Schéma de données

> **Servir la continuité du parcours, contre la fragmentation de l'esprit.**

> Statut : v1, dérivé de `CONTINUUM.md` (§2, §3, §6, §10, §13, §15) et des arbitrages
> de session (07/2026 : append-only + soupape de correction projetée ; acteur mutualisé
> sans vue inversée ; flux typé unique — puis 09/07 : la récolte, les guichets, le
> condensé). En cas de conflit, `CONTINUUM.md` a raison — et ce document doit alors être
> corrigé, pas contourné.

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
3. **Le sanctuaire est une absence de chemin, pas une permission.** Le rôle machine
   n'a pas `USAGE` sur le **schéma** des dépôts : il ne peut pas résoudre le nom de la
   table. Ce n'est pas un `INSERT` refusé — c'est un guichet introuvable. Un droit
   retiré se re-donne ; un chemin absent, non. La provenance est structurelle (le
   domaine d'écriture), jamais un attribut de ligne — un champ `source` serait
   falsifiable.
   *Conséquence tenue en Phase 0 : les quatre domaines sont **quatre schémas**, et la
   machine lit 0-1-2 par des vues (schéma `lecture`) non inscriptibles par construction.*
4. **La clé se pose ; l'attribut se corrige.** Corriger, c'est insérer une ligne qui
   référence la précédente : un attribut corrigible ne peut donc **pas** être une clé
   primaire (deux lignes, un IPP). Toute entité mouvante se coupe en deux — la **clé
   nue**, posée une fois, et la **fiche chaînée**, corrigible. Ce n'est pas une
   commodité d'implémentation : c'est la loi §0 qui l'exige. Une chaîne, jamais un
   arbre : on corrige la queue, jamais une version périmée — sans quoi « suivre la
   queue » n'a plus de sens.

---

## 1. Les quatre domaines

Calqués sur les trois couches du §3, plus l'identité mise aux extrémités (§15, §18) :

| Domaine | Contenu | Qui écrit | Correction | Couleur (§3) |
|---|---|---|---|---|
| **0 — Identité** | nom, prénom, naissance | secrétariat / coordinateur | append + corrigé projeté | — (extrémités seulement) |
| **1 — Récolte** | journal d'actes, paramètres, consentements, fiche — **les faits durs seulement** | équipe (régime directif §10) | append + **corrigé projeté** | encre (fait saisi) |
| **2 — Dépôts** | la traversée, le sanctuaire, **les observations**, inquiétudes, liens | humains seulement | append, **rien ne se masque** | encre / **rouge** (sanctuaire) |
| **3 — Machine** | projections, propositions, synthèses | machine seulement | recalculable ou immuable daté | ardoise / mono |

Le domaine 3 **lit** 0, 1 et 2 ; il n'écrit **que chez lui**. Les domaines 0–2 ne
lisent jamais le domaine 3 comme source de vérité (une proposition n'est qu'une
proposition tant qu'un dépôt ne l'a pas validée).

**Domaine ≠ strate ≠ guichet.** Trois questions distinctes posées à la même donnée. Le
**domaine** dit l'encre (qui écrit, ce qui s'efface). La **strate** dit le degré de
métabolisation (brut → métabolisé → méta, §18 bis). Le **guichet** dit la main : le
**soignant** (récolte) ou le **collège** (métabolisation) — tous deux écrivent dans le
**même** flux de dépôts, d'où « canal unique, deux guichets ». Une strate traverse les
domaines ; un guichet n'est pas une encre.

**Mouvante n'est pas corrigible.** Un numéro de téléphone change parce qu'on a déménagé :
la coquille se masque, personne ne veut la voir (domaine 1). Une observation clinique
change parce que le patient a bougé **ou parce que celui qui l'a écrite s'est trompé** :
elle ne s'efface pas. Deux raisons indépendantes tombent sur la même contrainte — c'est
un **acte tracé** (§3, jamais altéré) *et* sa fausseté est du **signal** (le mot projectif
parle de qui regarde autant que de qui est regardé ; l'effacer efface la matière de la
lecture). Le mot cru vit donc au **domaine 2**.

---

## 2. Domaine 0 — Identité (les extrémités)

```
patients (
  ipp        text PRIMARY KEY,           -- la clé unique, non négociable (§15).
  ouvert_le  timestamptz                 -- Donnée BRUTE : posée par le SIH, saisie ou
)                                        -- importée. Jamais engendrée par l'outil.

patients_identite (                      -- la fiche : mouvante, donc chaînée (loi 4)
  id              uuid PRIMARY KEY,
  ipp             text NOT NULL → patients,
  nom, prenom     text,
  date_naissance  date,
  secteur         text,
  corrige_id      uuid NULL,             -- → la ligne corrigée, même IPP (FK composite)
  saisi_par       uuid → agents, saisi_le timestamptz
)
```

- Le nom se corrige ; **l'IPP, non** — tout le dossier y est accroché. Un IPP faux est un
  dossier faux : cela se répare hors ligne, comme migration, jamais par un clic.
- Deux index partiels tiennent la chaîne : une seule tête par IPP, et **une seule
  correction par ligne corrigée** (chaîne, jamais fourche).

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

agents       (id uuid PRIMARY KEY, cree_le)                    -- la clé nue, stable à jamais
agents_fiche (id, agent_id → agents, nom, fonction,
              medecin_coordinateur bool, corrige_id, saisi_le)  -- la fiche, chaînée
```

- Même coupe qu'au domaine 0, et pour la même raison : `depots.auteur_id` doit pointer
  vers un identifiant **qui ne bouge jamais**, alors que la fonction d'un agent change.
  Un dépôt immuable ne peut pas référencer une ligne corrigible.
- `medecin_coordinateur` est donc un **fait corrigible**. Le droit de fonction se lit à
  la **queue** de la chaîne : le jour où quelqu'un d'autre coordonne, il coordonne — et le
  précédent ne coordonne plus. Aucune ligne de code ne change.

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
  id                  uuid PRIMARY KEY,
  ipp                 text NOT NULL,
  depose_le           timestamptz NOT NULL,
  auteur_id           uuid NOT NULL,          -- « datée ET attribuée » (§2)
  cadre               text NOT NULL,          -- seul · synthese_collective ·
                                              -- responsabilite_medicale (§10)
  nature              text NOT NULL,          -- catalogue ci-dessous
  champ_cible         text NULL,              -- pour vide_info / gestation
  position            text NULL,              -- source du regard (voir catalogue)
  facette             text NULL,              -- demande : surface / reelle
  acteur_id           uuid NULL,
  ref_depot_id        uuid NULL,              -- dépôt révisé ou levé   (domaine 2)
  ref_nature          text NULL,              -- sa nature, forcée par FK composite
  ref_proposition_id  uuid NULL,              -- proposition validée    (domaine 3)
  type_valide         text NULL,              -- aigu · nap · chronique — jamais deviné
  contenu             text                    -- prose ; NULL permis pour gestation seule
)
```

**Trois cadres, jamais trois grades.** Le cadre nomme **le moment**, pas la personne :
`seul` (la voiture, le domicile) · `synthese_collective` (la salle, plusieurs regards en
tension) · `responsabilite_medicale` (le coordinateur, seul, qui *répond*). L'exception du
§10 cesse d'être une permission applicative — qui ne peut que restreindre, jamais accorder
au-delà d'un `CHECK` — et s'inscrit **dans le record**, datée et visible : dans un an on
saura d'un coup d'œil quelles lectures sont sorties d'une salle et lesquelles d'une seule
tête. Le nouage reste reconnaissable.

**`ref_id` était polymorphe** (« dépôt révisé / levé, **ou** proposition validée ») : deux
tables, deux domaines, une colonne — donc aucune FK, donc un uuid nu, donc un champ
falsifiable, ce que la loi 3 bannit. Scindé. `ref_nature` est **dénormalisée mais non
falsifiable** (FK composite `(ref_depot_id, ipp, ref_nature) → (id, ipp, nature)`) : elle
achète en structure trois gardes qui seraient sinon du code — *une levée ne lève qu'une
hypothèse clinique, une inquiétude ou une gestation* ; *une révision révise le même registre* ; et
*« `ref_id` obligatoire sauf premier typage »* devient un index unique partiel, au lieu
d'un « premier » que nul ne sait définir en SQL.

**`type_valide` sort de la prose.** Rangé dans le `contenu`, la projection `type_courant`
obligerait la machine à **lire la phrase** — la comparaison sémantique sur la surface vive
que §4 (d) rejette. Ce n'est pas un nombre : c'est une valeur qu'un humain a déposée.

**Colonnes : du texte, des dates, des références. Rien d'autre.** Aucune colonne
numérique n'existe sur un dépôt (invariant contresigné) : pas de score, pas de poids,
pas de criticité, pas d'échéance — non pas interdits, **inexistants**.

**Ni d'axe.** Le rangement d'un dépôt sur les cinq axes n'est **pas stocké** : il se
recalcule (§6.1, `fragments`). En domaine 2 rien ne s'efface — un axe gravé faux le
resterait, et la densité mentirait pour toujours. Le rangement se refait à l'identique
depuis le texte : *la machine ne porte que ce qu'elle peut recalculer.* Une erreur de
rangement ne coûte donc rien : on relance, elle change. C'est ce qui permet de ne
demander **aucune validation** au soignant.

### Catalogue des natures

| nature | registre | position / facette | contenu | mécanique |
|---|---|---|---|---|
| `observation` | **le mot cru** — registre propre, ni sanctuaire ni traversée | — (le rangement est une projection, §6.1) | prose libre : ce qui a été vu, entendu, rapporté. **Entière, jamais découpée** — le découpage se recalcule à côté d'elle. Souvent projective, souvent fausse — et c'est du **signal** : le mot cru parle de qui regarde autant que de qui est regardé (§1). **Jamais promue en lecture** | déposée **seul** (`cadre = 'seul'`) ; le terme est celui de l'hôpital : *les observations permettent de formuler une situation*. **Reformulable avec sa source, jamais fondue** (invariant 18) |
| `situation` | traversée | — | prose : le réel brut, cité, non lissé — **formulée**, non récoltée | |
| `lecture_clinique` | **SANCTUAIRE** | position **obligatoire** ∈ `medecin · equipe · entourage · structure` (source-agnostique, §4) | prose : **le mécanisme qui traverse, jamais l'étiquette** ; registre hypothétique, tenu, daté | `ref_depot_id` = lecture révisée (chaîne visible) ; se dépose en `synthese_collective`, ou en `responsabilite_medicale` par le seul coordinateur |
| `ressenti` | traversée | position **obligatoire** ∈ `patient · equipe · entourage` (trois positions, jamais fusionnées) | prose | |
| `demande` | traversée | facette ∈ `surface · reelle` | prose : la demande dégagée sous l'enveloppe | |
| `indication` | traversée | — | prose : le « pourquoi SIID » — premier dépôt du fil ; les six portes en latence **côté machine** (§11) | la ligne existante *est* la décision d'indication matérialisée ; la digestion (sanctuaire) se dépose, si argumentable, en `lecture_clinique` |
| `diffraction` | traversée | attribution **jamais anonyme** : `acteur_id` si la source est un acteur, sinon nommée dans la prose | prose : le regard depuis une autre position, gardé contrasté | |
| `hypothese_clinique` | traversée — **vigilance plume maximale** (§5) | — | prose : **le nouage** — toutes les couches nouées en une hypothèse de travail : où on en est *et* où on va, dans le même texte (jamais un 7ᵉ terme, jamais trois cases temporelles). Jamais un état d'équilibre atteint — une lecture en mouvement | la **spirale** = la chaîne de révisions (`ref_id` = hypothèse révisée) ; se lève par `levee` en collège ; jamais contrat opposable |
| `vide_info` | suit le champ | `champ_cible` (+ position pour ressenti/diffraction) | prose nommant le vide (« aucun tiers — isolé ») | événement typographié, pas un blanc (§6) |
| `gestation` | **SANCTUAIRE** | `champ_cible` (+ position éventuelle) | **NULL permis** (« rester nu », §6) | ouvre l'état « hypothèses en cours » ; se lève par `levee`. **Seul dépôt à effet machine** : suspend la relance sur ce champ (§11). La machine voit *qu'il* existe, jamais ce qui gestationne |
| `inquietude` | **SANCTUAIRE** | — (portée patient) | prose datée (« le 3 mars, ça m'inquiète ») | se lève par `levee` — sinon étiquette qui condamne (§15). **La couleur déposée = il existe une inquiétude ouverte** |
| `lien_travail` | **SANCTUAIRE** (la lecture de tension est clinique, §13) | `acteur_id` **obligatoire** | **prose libre** : la tension et la direction (coudre, tenir, desserrer, recoudre ailleurs) vivent **dans les mots, jamais en enum** — un enum de directions serait le signe fixe que §13 bannit. Les directions servent d'amorces grises à l'écran, jamais de valeurs stockées | `ref_id` = lecture de lien révisée |
| `validation_typage` | traversée | — | `type_valide ∈ aigu · nap · chronique` (colonne, jamais deviné de la prose) **+ prose du sens lu** (stabilisation *ou* décrochage — la valeur seule ne dit rien, §15a/c) | `ref_proposition_id → proposition machine` **obligatoire**, sauf premier typage à l'indication — tenu par **index unique partiel** (au plus un typage sans proposition par patient). On ne retype pas d'un clic : il faut que le mouvement l'ait proposé (tue le Goodhart par le typage) |
| `levee` | suit le registre du dépôt levé | — | prose du motif (le fait qui a résisté ; l'inquiétude dissipée) | `ref_depot_id` **obligatoire** → `hypothese_clinique · inquietude · gestation`, **vérifié par la structure** (`ref_nature` sous FK composite) ; une seule levée par dépôt levé. Lever n'est pas effacer : deux actes datés, tous deux visibles |
| `compte_rendu` | traversée | — | prose : la synthèse de prise en charge, **reformulée** puis **validée énoncé par énoncé** et signée | pas de `ref_id` machine (le brouillon est éphémère, §6.3) ; la **signature EST l'acte de dépôt** (`auteur_id` = signataire, `depose_le` = signature) — immuable comme tout dépôt ; la machine ne l'insère jamais (invariant 2) |

Contraintes d'exemple (le repo fera le DDL complet) :

```sql
CHECK (nature <> 'ressenti'          OR position IN ('patient','equipe','entourage'))
CHECK (nature <> 'lecture_clinique'  OR position IS NOT NULL)
CHECK (nature <> 'lien_travail'      OR acteur_id IS NOT NULL)
CHECK (nature <> 'levee'             OR (ref_depot_id IS NOT NULL
                                         AND ref_nature IN ('hypothese_clinique','inquietude','gestation')))
CHECK (nature = 'gestation'          OR contenu IS NOT NULL)

-- le régime tient au CADRE, jamais à l'étiquette (§10 : indexé sur le moment, pas le grade)
--
-- La coupe n'est pas entre le médecin et les autres : elle est entre ce qui se SIGNE et ce
-- qui se FORMULE.
--
-- Ce qui se FORMULE — la grille — n'existe QUE parce que plusieurs regards l'ont faite.
-- `diffraction` déposée seul est un homme qui se relit ; `hypothese_clinique` déposé seul est le
-- nouage rendu à un regard unique. Fermé à TOUT LE MONDE, le coordinateur compris : si
-- l'on peut formuler seul, le trilobe cesse d'être un collège, c'est un bureau.
CHECK (nature NOT IN ('situation','ressenti','demande','diffraction','hypothese_clinique')
       OR cadre = 'synthese_collective')

-- Ce qui se SIGNE engage une responsabilité, donc une personne : la signature EST l'acte
-- de dépôt (§5) — un compte rendu à quatre mains n'est pas un compte rendu.
CHECK (nature NOT IN ('lecture_clinique','compte_rendu','validation_typage')
       OR cadre IN ('synthese_collective','responsabilite_medicale'))

-- Et le cadre du coordinateur n'est pas une porte de service :
CHECK (cadre <> 'responsabilite_medicale'
       OR nature IN ('lecture_clinique','compte_rendu','validation_typage'))

-- Pas de CHECK symétrique sur la famille observation : elle se dépose seul (le geste du
-- matin) comme en synthèse (on cite un mot cru dans la salle). La contrainte est d'un
-- seul côté. Un CHECK qui n'interdit rien serait une garde décorative — pire que rien.
```

**Un `CHECK` dit *ce qui* passe ; il ne peut pas dire *qui*** — il ne regarde qu'une ligne.
Le droit de fonction est donc une **politique de ligne** (RLS), à deux conditions
indissociables :

```sql
POLICY depots_depot_attribue ON depots FOR INSERT
  WITH CHECK (auteur_id = agent_connecte()                       -- 1. nul ne dépose sous le nom d'un autre
              AND (cadre <> 'responsabilite_medicale'            -- 2. et ce cadre exige la fonction,
                   OR est_coordinateur(auteur_id)))              --    lue à la QUEUE de la chaîne de fiches
```

La première condition n'est pas un ornement : sans elle, écrire l'uuid du coordinateur dans
`auteur_id` suffirait à emprunter son droit, et la seconde serait décorative. C'est
**l'invariant 18 tenu à la racine** plutôt qu'à l'écran : l'attribution *est* la garde.
Conséquence pour l'app : `SET LOCAL continuum.agent_id = '…'` à l'ouverture de chaque
transaction. **La base refuse un écrit anonyme.**

**Le même soignant, deux gestes.** Mardi 8 h, seul, au domicile : il **récolte** — mot
cru, `observation` (ou `inquietude` : même famille, même régime). Mardi
14 h, en synthèse : il **métabolise** — sa `lecture_clinique` vaut alors pleinement, sans
primer sur celle du médecin (§2, la clinique dédoublée). Ce n'est pas le grade qui change,
c'est le **moment**. Sans la nature `observation`, le geste du matin s'écrivait en
`lecture_clinique` — ce que l'**interdit dur** du §10 refuse : *jamais une lecture clinique
en régime directif à un exécutant*.

**Les axes portent ce qu'un humain a validé.** La machine **propose** le rangement (elle
est meilleure que nous à ce jeu, si elle a une doctrine) ; l'humain le **valide avant que
rien ne soit écrit** — parce qu'en domaine 2 rien ne se masque, et qu'un mauvais rangement
resterait affiché à côté de sa correction, pour toujours. Même motif que le retypage (le
mouvement propose, le regard valide) et que la signature (§5). Le **recouvrement** de deux
axes n'est pas une bavure : c'est une donnée (le travail qui déborde sur la famille, le
soin qui colonise le soi) — **montré, jamais conclu**.

**Le registre (sanctuaire / traversée) est une propriété du *type*, codée en dur dans
la doctrine — jamais une colonne par ligne.** Un flag par ligne serait falsifiable ;
une propriété de type ne l'est pas. Conséquence machine : sur la traversée, la plume
met en forme sans conclure ; sur le sanctuaire, elle **cite verbatim ou se tait** (§5).

**Le pluriel des observations** : pas de contrainte de comptage sur l'humain (« l'unique
est le cas particulier », pas l'interdit — §2). La protection est **par la forme** :
l'UI présente toujours *le faisceau* des angles de terrain, jamais un regard unique ;
ces observations plurielles sont la matière que le collège noue en `hypothese_clinique`.
Côté machine la
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
| `fragments` | chaque `observation` découpée en **portions verbatim**, chacune rangée sur un ou plusieurs axes | **projection, jamais un dépôt.** Une observation longue parle de la sœur, du chômage et du refus : elle n'a pas trois axes, elle a **trois fragments**. Le dépôt reste **entier** ; le fragment le référence, et la note complète est **à un clic**. Une **portion**, jamais une réécriture (invariant 12). Les fragments **se chevauchent** : la plus petite unité qui *garde le sens*, jamais la plus petite possible |
| `densites` | COUNT(`fragments`) sur `unnest(axes)` | descriptif, permis — la boucle grossit **parce qu'il y a de la matière rangée**, jamais d'après une constante. Compter les *dépôts* rendrait les cinq boucles grosses dès qu'un soignant écrit long : du bruit |
| `recouvrements` | axes co-présents **sur un même fragment** | le point de couture (§13) : *« sa sœur, depuis qu'il ne travaille plus »* est **un** croisement, non deux cases cochées. Deux boucles qui partagent de la matière **se croisent** (§19). **Montré, jamais conclu** |
| `portions_non_couvertes` | texte d'un dépôt qu'aucun fragment ne recouvre | ce qui a été écrit et que personne n'a su ranger. **Montré à la Vigilante, jamais commenté** |
| `vigilante_recolte` | les `observation` du patient, **mises en mots en clair**, à côté de la grille en cours de formulation | **projection, jamais un dépôt** — aucun guichet n'existe (§4, second barrage) : c'est pourquoi elle a le droit de parler. Elle **écrit ce qui est là**, attribué et daté ; elle ne signale rien, ne compare rien, ne conclut rien. **Elle n'évalue jamais la cohérence** — le récit le plus cohérent est parfois le délire (§2) ; un eval de cohérence récompenserait la clôture prématurée. Bien écrit, le creux se voit tout seul (§1, l'opération est soustractive). **Tirée, jamais poussée.** Registre-garde suffixé : le nom reste chiffré (ce que les mots *font*, jamais « somatisation ») |
| `condense` | dépôts d'un patient, rangés par axe | **éphémère, jamais persisté** (loi §0). **Un dossier de citations, pas un texte** : chaque énoncé cité verbatim, **attribué et daté**. La machine range, juxtapose, cite — elle n'écrit **aucune prose sur le patient** (invariant 12 : sur le sanctuaire, elle cite ou se tait). Le rangement est une **projection** ; la juxtaposition chronologique attribuée reste **à un clic**, et c'est elle la vérité |
| `angles_multiples` | COUNT(DISTINCT position) > 1 sur `lecture_clinique` | le marqueur §4b : binaire, zéro sémantique |
| `portes_couverture` | prose d'`indication` × six portes (§12) | **la seule opération sémantique machine du système** : classer la *couverture* (quels sujets la prose a touchés), **jamais en lire le sens**. Borne explicite, à tester comme telle |

**Aucune projection n'agrège entre patients.** Le recours est un thermomètre patient
par patient (borne e) ; le modèle n'offre ni vue ni fonction d'agrégat.

**Boucle soin — deux registres (§19).** La boucle soin porte le soin *et* le soi : c'est
le rapport du soi à lui-même, pas un axe posé à côté de la personne. L'ouvrir donne accès
aux ressources du soin et du soi — les deux ensemble. Le soi n'est **pas** un axe séparé :
pas de sixième boucle, pas de centre, mais une lecture DE la boucle soin. La géométrie ne
matérialise qu'un axe soin ; le soi y vit en projection, comme sa doublure. L'empiètement du
soin sur le soi est montré, jamais conclu (§19).

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

### 6.4 Le miroir de l'agent (Vigie — réflexif individuel privé, jamais agrégé)

La trace de la rédaction — ce que la plume a proposé, ce que le soignant a **gardé, coupé
ou reformulé** — est conservée pour **le soignant seul**, comme matière de réflexivité
(§18 bis — le miroir de l'agent). C'est le seul résidu persistant du brouillon, et il n'appartient
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
stricte, aucune vue croisée, aucune fonction d'agrégat), comme le sanctuaire et le **Lien**
(§18 bis). Le **Lien** (§11) est un **autre objet**, agrégé anonyme, nourri par une lecture
muette des écrits — **jamais** par l'aspiration des miroirs privés : le collectif et le privé
ne partagent aucune source.

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
| 2 | La machine n'écrit jamais un dépôt | **absence** — rôle machine sans `USAGE` sur le schéma `depot` : le nom ne se résout pas. *Un `REVOKE INSERT` laisse la table nommable, donc un `GRANT` la rouvre : ce serait une permission, non une absence.* La machine lit 0-1-2 par les vues du schéma `lecture`, non inscriptibles par construction (CTE de tête) |
| 3 | La machine ne suggère jamais de lecture clinique, même « évidente » | **structure + code** — aucun chemin ; `pistes` bornées hors sanctuaire, testées |
| 4 | Aucun nombre sur un dépôt (seuls nombres = des dates) | **structure** — les colonnes n'existent pas |
| 5 | Aucune échéance nulle part | **structure** — aucune colonne « pour quand » ; les dates disent quand une chose *a eu lieu* |
| 6 | Jamais d'agrégat de recours (Goodhart) | **absence** — aucune vue/fonction agrégée ; le `AVG` = geste contre le grain, jamais un clic |
| 7 | Pistes machine plurielles ou silence | **structure** — `CHECK cardinality ≥ 2` |
| 8 | Relance : une fois, jamais sur gestation, jamais poussée | **structure + code** — `UNIQUE (ipp, porte)` + garde gestation + absence d'infra de notification |
| 9 | Retypage exige une proposition (le mouvement propose, le regard valide) | **structure** — `ref_id` obligatoire sauf premier typage |
| 10 | Correction masquée en récolte, jamais en dépôts | **code testé** — deux fonctions de projection distinctes |
| 11 | Acteur : ni vue inversée, ni attribut porté, ni maintenance propre | **structure + absence** — schéma nu + aucune API inverse (SQL brut joignable : assumé) |
| 12 | Plume : **cite** le sanctuaire — la `lecture_clinique` — verbatim ou se tait ; **reformule** le déposé hors sanctuaire (dont l'`observation`, **sans jamais fondre les auteurs**) ; refuse sous seuil ; **ne noue jamais la Clinique** — elle n'est *jamais générée*, même assistée (§3) | **code + pratique** — prompt discipliné (registre-garde suffixé), tests de refus |
| 13 | Ce qui se **formule** (la grille) se dépose en synthèse collective — **fermé au coordinateur aussi**. Ce qui se **signe** (`lecture_clinique`, `compte_rendu`, `validation_typage`) lui est ouvert seul, sous le cadre `responsabilite_medicale` qui l'**inscrit dans le record** | **structure** — deux `CHECK` (signé / formulé) + RLS sur la fonction, lue à la queue de la chaîne de fiches. *Une permission applicative ne peut que restreindre : elle n'accorde jamais au-delà d'un `CHECK`. L'exception devait donc s'écrire, pas se contourner.* |
| 14 | Le vert ne dispense jamais de regarder (revue exhaustive au trimestriel) | **pratique** — hors schéma, nommé pour ne pas être oublié |
| 15 | Brouillon = dérivé **éphémère**, jamais stocké (loi §0) ; garde de génération « sans source = non généré » | **code + test** — pas de table, garde à la génération |
| 16 | Compte rendu → acte tracé par **signature humaine** seulement ; la machine ne l'insère jamais | **structure** — rôle machine sans `INSERT` sur `depots` (invariant 2) ; signature = dépôt `compte_rendu` |
| 17 | Miroir agent : **privé par absence de chemin** (RLS, aucune vue croisée, aucun agrégat) ; réflexion, jamais score | **structure + code** — RLS sur `utilisateur_id` + aucune fonction d'agrégat |
| 18 | **La machine ne fond jamais les auteurs.** Elle peut reformuler une `observation` ; elle ne peut pas la détacher de qui l'a écrite ni de quand. Jamais « l'équipe » | **structure + code** — `auteur_id = agent_connecte()` par RLS : **nul ne dépose sous le nom d'un autre**, la garde est à la racine et non à l'écran. `auteur_id` et `depose_le` voyagent ensuite avec l'énoncé, du dépôt à l'écran ; aucun chemin de fusion. *L'attribution est la garde, pas le verbatim : « l'équipe décrit une intolérance à la frustration » est un cliché bien écrit (§5) ; « Karima, le 3 mars : … ; Céline, le 5 : … » est vivant.* La Vigilante ne peut pas garder ce point : elle lit ce qui sort des lobes, pas ce qui y entre |
| 19 | **Aucun état courant sur le perceptif.** Pas de « dernière valeur » : la **série est l'objet** | **absence** — la correction par projection n'existe qu'aux domaines 0 et 1. Vouloir mourir le matin et rire le soir : deux dépôts, deux dates, tous deux vrais, jamais réconciliés |
| 20 | **Aucun axe n'est stocké sur un dépôt.** Le rangement est une projection, recalculable | **absence** — la colonne n'existe pas. En domaine 2 rien ne s'efface : un axe faux le resterait. La machine ne porte que ce qu'elle peut recalculer |

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
4. ~~**Permissions**~~ — **tranché en Phase 0** : trois rôles (`continuum_soignant` /
   `continuum_machine` / `continuum_migration`), trois cadres, droit du coordinateur en
   RLS. Reste **une** garde de code, nommée pour ne pas s'y dissoudre : *l'application se
   connecte comme `soignant` ou `machine`, jamais comme propriétaire ni superutilisateur.*
   Le propriétaire garde tous ses droits, le superutilisateur passe partout : les
   invariants 1 et 2 valent exactement aussi longtemps que cette discipline. Aucune DDL
   ne peut la tenir.
5. **Pipeline de rédaction** — brouillon éphémère (garde « sans source = non généré »),
   validation énoncé par énoncé (reconnaissance + surprise, coupe = masque), signature =
   dépôt `compte_rendu`. Le brouillon ne se stocke pas ; seule la trace du **miroir agent**
   (privée, §6.4) persiste.
6. **Le Lien** (Vigie collective, §18 bis) — le nœud vu côté soignant : objet **agrégé
   anonyme**, **deux lectures** (**affective** = climat / **réflexive**), lu à la maille de
   l'**unité** (en v1). Appartenance **scellée** (non exposée au chemin de lecture générique) :
   sans en être, impossible de lire. Nourri par une **lecture muette** des écrits (projections
   §6.1 : affect + posture réflexive), **jamais** par les miroirs privés (§6.4). Les
   **référents** (qui connaît un patient) sont un simple **repère dérivé** — lu de « qui a
   déposé sur ce patient », jamais un champ assigné. Sans score, abstention d'issue ; les deux
   lectures côte à côte, jamais un ratio.
