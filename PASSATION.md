# PASSATION — fil roulant

> Handoff continu. Entrée la plus récente en tête. Le détail vit dans `passations/`.
> **Socles permanents** (à lire avant de rouvrir un sujet) : mécanique du logo →
> `passations/logo_mecanique.md`.

## 2026-07-09 — clôture du chantier (B) : bloc B inscrit, mockup gravé, six rectifications
Chantier (B) **clos**. Six commits poussés sur `origin/main` :
- `caa72dd` — **œil oudjat** en bilobé : clic sur un lobe → l'œil chevauche le fil un tour du ∞,
  la monture héraldique se pose, le globe rouge reste la pupille vivante dans l'amande évidée ;
  variante *repos* (le spin revient à 0, la marque se redresse). Asset : `mockup/oudjat_clean.svg`.
- `91dc069` — **labels par strate** : `petals()` 5-lobes → `petalsFor(Q)` généralisé. Bilobé
  **Continuité / Fragmentation** · trilobé **Affective · Vigilante · Réflexive**, mappé **par indice
  de build** (Vigilante = `idx1`, aligné sur `ASYM[3]`/`DASH_MODE`/scouter — *jamais* par ordre de
  pétale) · pentalobe inchangé. Rebuild du jeu de labels dans le creux du morph (`lo≈0`) : aucun
  pop. Police **Spectral**, tailles par strate `{2:20, 3:16, 5:12}`.
- `4dfb7b9` — **le « n » de Soin suit l'œil**. Il recevait `fill=RED` figé à la création ; l'œil lit
  `var(--red)`, que `setRed()` met à jour avec les stops de `#ptSphere`. Bouger le curseur de rouge
  donnait **deux rouges à l'écran** (mesuré : œil `#781a28` / « n » `#ad333f`), contre la loi 04.
  Corrigé non en recopiant la valeur mais en **supprimant la seconde source** :
  `#soinN{fill:var(--red)}`, et retrait de l'attribut figé.
- `cb2f6ad` — **§19 · grammaire de l'œil par strate + lentille de scrutin**,
  Q1 et Q2 verrouillées dedans (via `inscrire_bloc_B.py`).
- `79485c8` — **§19, deux scories du bloc B**. (1) `` `compose · compose · read` `` résolvait vers
  une constante JS : la doctrine fonde le code, elle n'en dépend pas — remplacé par **« deux lobes
  composent, un seul lit »**, qui *dit* la dissymétrie 2/1 que le triplet se contentait d'encoder
  (c'est Q2). (2) Reflow du paragraphe : l'insertion laissait une ligne de 39 col en son milieu —
  une cicatrice de patch. 15 lignes → 14, laisse 93 col.
- `5ab74ff` — **DASH_MODE cite §19**. Depuis (79485c8), §19 ne nomme plus l'identifiant ; le renvoi
  existe désormais dans le bon sens — le code cite la phrase **« deux lobes composent, un seul lit »**,
  non la seule section. CORE byte-identique.

**Conséquence tenue.** §19 ne cite plus l'identifiant `DASH_MODE`. Le renvoi existe dans l'autre
sens — *le code cite la doctrine*, en nommant la phrase et non la seule section :
`patch_dashmode_renvoi.py` est **passé et poussé** (`5ab74ff`, ci-dessus).

**Six entrées de passation étaient fausses** (rectifiées ici, non effacées — un fil se corrige par
un acte daté qui référence, jamais par réécriture) :
1. La *corde à sauter* n'était pas à implémenter : déjà checkpointée à `dashBary`, l. 747-770.
2. « §19 visuel stale » : §19 n'était pas périmé — **le bloc B n'avait jamais été gravé**. Il l'est.
3. `DASH_MODE` n'était pas un placeholder `['compose','compose','compose']` : il valait déjà
   `['compose','read','compose']`.
4. Le *ciblage du scrutin* n'était pas à coder : il l'est (l. 937-946), navette entre les deux lobes
   de composition, `jamais de repos au milieu` — **Q1 est déjà dans le code**.
5. Le mockup vit dans `mockup/`, non `logo/` (l'entrée du 07-07 au soir dit `logo/`).

**Discipline confirmée sur les six commits.** CORE géométrique (`/*==CORE==*/`…`/*==/CORE==*/`,
19 807 octets) **byte-identique**, prouvé par SHA-256 depuis `git`, hors du patch — et non par le
`grep '==CORE=='` que j'avais d'abord prescrit, qui ne détecte que le déplacement des marqueurs
eux-mêmes et renvoie `0` sur un diff vide : **deux faux négatifs**. `run_test.sh` vert (18/18) avant
et après chaque écriture. Tous les patchs sont **dry-run par défaut**, ancres uniques vérifiées
hors-CORE avant toute écriture, garde-CORE a posteriori, anti-double-application ; et vérifiés par
la propriété forte `patch(base) == mockup validé`, octet pour octet.

**Reste au mockup** (aucune urgence, aucune dette bloquante) :
- **Double source de police** : `--labelface` est posé dans le CSS *et* par `selected` dans le
  `<select>`. Rien ne les lie — même maladie que les deux rouges, forme bénigne. Une seule source :
  que le `<select>` lise `getComputedStyle(…).getPropertyValue('--labelface')` au chargement.
- Le « n » de Soin reste discret en Spectral 12 (la serif l'affine). Choix ouvert, non un bug.

**Le « §19 visuel à réécrire » n'existe pas** — sixième rectification, la plus grosse. Les trois
points annoncés comme *à inscrire* le sont déjà, depuis `56f88bd` :
- *taille = volume de récolte, jamais valeur de la personne* → §19, « L'asymétrie est montrée,
  jamais conclue » (**gros ≠ fort, mince ≠ faible**), et « Chaque boucle porte une seule dimension » ;
- *l'alerte anti-surpsychiatrisation quitte la géométrie* → §19, boucle soin unifiée : « cette
  vigilance quitte la géométrie et redevient une lecture clinique humaine » ; rappel en §21 ;
- *alliance = chaleur/saturation de l'encre, jamais le rouge (sanctuaire) ni l'ardoise (machine)*
  → §18 bis, mais **comme question ouverte explicitement non tranchée** : « Réflexion, pas loi. »
  **Ne pas la promouvoir en doctrine** : un point laissé en réflexion le reste jusqu'à arbitrage.

**Leçon de méthode.** Six entrées de ce fil étaient fausses, toutes dans le même sens : elles
annonçaient comme *à faire* du travail déjà fait. Une passation rédigée de mémoire dérive ; une
passation se vérifie **contre le dépôt**, fichier en main, avant d'être écrite. Le prochain qui
rouvre un sujet lit d'abord `git log` et le §, jamais la seule ligne du fil.

**Prochain chantier : rien d'ouvert au mockup ni en doctrine.** Restent les deux fils déjà nommés
ailleurs — la **DDL du Lien** (attend le montage Vigie collective v1) et la **calibration du
registre-garde** (attend les sorties réelles des prompts d'eval) —, plus le **REGISTRE_LAÏQUE** que
CONTINUUM doit produire pour ses propres evals (modèle : `REGISTRE_LAIQUE` du Collègue).

## 2026-07-07 (soir) — inscription doctrinale des strates + scission en deux chantiers
Blocs A/C/D/E inscrits dans CONTINUUM.md (**commit 56f88bd**, poussé) : la doctrine dit désormais
les **trois strates** (degré de métabolisation, non zoom), la **triade Affectif·Réflexif·Vigilante**,
le clair-obscur **Continuité/Fragmentation**, le **Lien ré-attaché** aux strates. L'architecture
d'eval est scellée dans `recherche/architecture_eval.md` (projection sur la source ; couverture
sémantique = moteur, critère Sibeoni ; structurel = plancher).

**Deux chantiers restants, désormais suivis en deux conversations séparées :**
- **(B) grammaire de l'œil + lentille de scrutin** — inscrire le BLOC B (texte prêt dans
  `passations/2026-07-07_inscription_strates.md`) dans §19, puis coder la lentille au mockup
  (`logo/continuum_mockup.html`, Vigilante en mode `read`). CORE géométrique intouchable.
- **(eval) spécifier les internes des evals** sur `recherche/architecture_eval.md`, à partir du zip
  Collègue (LeCLG) + un article de phénoméno + la thèse. Compagnons déjà au repo :
  `recherche/extraction_leclg.md`, `recherche/methode_reflexivite.md`.

**Rider** (à faire dans l'un ou l'autre, penche eval/schéma) : vérif du modèle d'accès à **deux
crans** — participation-gating (patient) vs anonymat (institutionnel), chacun par absence de chemin
(§6.4/§11).

## 2026-07-07 (ap-m) — métabolisation : trilobe, eval, ré-attachement du Lien
Suite du matin (strates). **Tranché et rédigé** (dans le guide — *pas encore inscrit* dans
CONTINUUM.md) : **les trois strates** = degrés de métabolisation (5 récolte brute/soignants · 3
métabolisation/coordinateurs · 2 institutionnel méta/anonyme) ; **canal unique / deux guichets** ;
triade **Affectif · Réflexif · Vigilante** (lobes — les deux premiers composés, la Vigilante
scrutée) ; **Continuité/Fragmentation en lumière-ombre** (refonte §18 bis, Jung ; rigidification +
dissolution subsumées comme les deux visages de la Fragmentation) ; **grammaire de l'œil par strate
+ lentille de scrutin** (scouter). **Ré-attachement du Lien** aux strates : miroir de l'agent
(§6.4) ↔ lobe **Réflexif** (l'individu a deux traces à deux destinations — affect → climat anonyme,
réflexivité → miroir privé) ; l'**intrication** (§4) = racine du **différentiel Vigilante** ;
anonymat → institutionnel, participation-gating → patient. Reste : vérif schéma du **modèle d'accès
à deux crans**. Guide complet A–E : `passations/2026-07-07_inscription_strates.md`.

**Architecture d'eval** (`recherche/architecture_eval.md`, compagnon de `extraction_leclg.md` +
`methode_reflexivite.md`) : **projection sur la source, jamais cascade de résumés** (= event
sourcing = ton domaine 0-2 source / domaine 3 projections recalculables). Couverture **sémantique =
moteur primaire** (extraction phénoméno ; un trou = *mode d'expérience présent dans le brut mais non
remonté* ; critère de Sibeoni **reconnaissance + surprise**, sujet = le soignant), **structurel =
plancher incorruptible** (non-LLM, ne peut pas oublier). Trilobe nourri par eval(pentalobe) + les
synthèses d'équipe ; **Vigilante** = différentiel Affectif↔Réflexif (écart tenu, jamais un ratio) +
couverture des trous (critique adversarial). Institutionnel = agrégat **anonymisé** (sémantique sur
les cartes de couverture, jamais le contenu inter-patients). Garde : *la profondeur relève les
enjeux du montrer-sans-conclure, elle ne les relâche pas*. Internes des evals = **attendent le zip
Collègue + l'article phénoméno + la thèse**.

Prochaines : (1) lire Collègue/phénoméno/thèse → spécifier les evals ; (2) inscrire A–E dans
CONTINUUM.md (**feu vert requis**) ; (3) coder la lentille de scrutin (mode `read` de la Vigilante)
au mockup.

## 2026-07-07 — les strates de métabolisation + refonte lumière/ombre
Tournant architectural (rattrape aussi le 06, jamais journalisé). (1) **Trois strates de
métabolisation** : le nombre de lobes indexe le *degré de digestion* de la donnée, non le zoom —
5 lobes = récolte brute (soignants) · 3 lobes = métabolisation par patient (coordinateurs, en
synthèse collective signée, avec relai) · 2 lobes/∞ = institutionnel (agrégat lavé). (2) **Canal
unique, deux guichets** : un seul store de dépôts, écrit depuis le 5-lobes ET le 3-lobes. (3) Le
3-lobes = **salle de lecture (brouillon de la plume) + table de nouage** (equilibre / compte
rendu), **sans store neuf** — composer = redéposer dans le canal. (4) L'infini institutionnel =
**Continuité / Fragmentation**, en **lumière/ombre** (Jung, union des contraires), montré jamais
chiffré — **refonte** des deux dérives du §18 bis. **Rien inscrit dans la doctrine** : plusieurs
points OUVERTS (la triade du 3-lobes en tête) attendent l'arbitrage. Mockup : signalétique Vigie
+ corde à sauter gravées en checkpoint (cf. commit logo).
Détail : passations/2026-07-07_strates_metabolisation.md

## 2026-07-05 — la Vigie + inscription doctrinale
Deux temps. (1) Conception de **la Vigie** — réflexivité institutionnelle contre la
surpsychiatrisation (surveille le soin/soignant, jamais le sujet ; nom scellé, *vigilance ≠
surveillance*) : trois échelles (climat / patient / agent), deux mécanismes (séparation des
rôles, chiffrement phénoménologique), branche compte rendu à frontière-signature. (2)
**Inscription** dans CONTINUUM.md : §19 refondu (nœud-patient v2 — fil = notre récolte,
boucles = volume par axe, tension purgée, boucle soin unifiée, œil promu) ; refonte §3/§4/§5
(acte tracé immuable dé-couplé de la cécité au sens ; reformuler le déposé sous signature) ;
principe **soustractif** en §1 ; nouvelle **§18 bis (Vigie)** ; §21/§22/§23 actualisés.
Détail : passations/2026-07-05_vigie_inscription.md

## 2026-07-04 — logo vivant
Œil 3D (globe/pupille/clignement/reflet à lumière propre), épaisseur=données en vue
patient, taille d'œil=attention, rotation continue, curseurs couleur contraints,
regard+bec suivent la souris. Détail : passations/2026-07-04_logo_regard.md
