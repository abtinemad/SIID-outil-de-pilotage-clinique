# L'hypothèse de travail — le moteur des strates

Note-cadrage. Compagnon de `internes_eval.md`, `registre_garde.md`,
`architecture_eval.md`. **Ne grave pas la doctrine.** Elle pose une ontologie
neuve — issue d'un arbitrage d'Abtine (session logo, 08/07) — la prépare pour un
patch §18 bis (+ `schema.md`) à inscrire **sous son œil**, et **liste les
questions de schéma qu'elle ouvre sans les trancher**. Elle est destinée à
devenir un patch §18 bis distinct ; elle **ne se glisse pas** dans le patch
§19 en cours (forme visuelle), qui reste indépendant (voir § final).

---

## Le verbe qui manquait aux strates

L'ontologie des strates (§18 bis / §19) décrit chaque cran par sa
**matière** — brut → métabolisé → méta — et par sa mécanique (guichets,
signatures, eval). Elle ne nommait pas ce que chaque strate **fabrique**, ni **ce
qui fait passer** d'un cran au suivant. Ce chaînon manquant est l'**hypothèse de
travail** : le *produit* de chaque strate, et l'*opérateur* qui digère vers la
strate supérieure. La doctrine avait la matière des strates ; elle a maintenant
leur **moteur**.

Statut de l'objet : l'hypothèse de travail n'est **ni une donnée** (elle ne se
dépose pas brute, elle se raisonne) **ni un verdict** (une hypothèse est révisable
par nature). Elle *oriente sans conclure* — elle se loge précisément dans la zone
que la doctrine protège. Saine par construction.

---

## Le mécanisme unique — trois propriétés constantes, deux paramètres variables

Un seul mécanisme, deux instanciations (patient, unité). C'est la forme de
l'infini : un fil, deux boucles, le même geste vu à deux échelles.

**Constant — le cycle en trois temps :**
1. **Elle émerge.** La machine lit la matière de la strate et *esquisse* une
   hypothèse pour guider la réflexion avec cohérence. Proposition, **brouillon de
   la plume (§6.3)** — jamais un verdict. La machine propose, ne noue pas
   (invariant 12).
2. **Elle est annotable.** Un humain la reprend pour la faire évoluer : cette
   annotation **est un dépôt signé** (append-only, le fil auditable). C'est là que
   l'hypothèse cesse d'être une esquisse-machine et devient un acte humain.
3. **Elle alimente la strate supérieure.** Son agrégat est la *matière* que le
   cran d'au-dessus métabolise à son tour. C'est ce qui **fait accéder au méta**.

**Variable — deux paramètres qui changent par strate :**
- l'**échelle** : patient → unité ;
- le **signataire** : le **collège** (`synthese_collective`, §12 bis — le lieu
  commun qui assume) au niveau clinique ; la **chef de pôle** au niveau
  institutionnel.

---

## Le cycle, strate par strate

**Métabolisation (patient).** La machine lit la récolte brute (5-lobes) et
esquisse une **hypothèse clinique** — les axes de prise en charge qui orientent le
soin (émergence, brouillon de la plume). Le **collège** l'annote (dépôt signé,
`synthese_collective`) pour la faire évoluer. La triade **Affectif · Réflexif ·
Vigilante n'est pas le produit fini** : c'est le **matériau** de l'hypothèse.
L'Affectif (ce qu'on éprouve) et le Réflexif (ce qu'on raisonne) la nourrissent ;
la **Vigilante scrute l'écart entre eux avant que l'hypothèse se fige**. La
lentille (Q2) prend ici son sens plein : elle **garde l'hypothèse ouverte** — elle
empêche Affectif et Réflexif de se moyenner en un faux-consensus. L'anti-fusion
structurelle (Q1) protège **la formation de l'hypothèse elle-même**.

**Institutionnel (unité).** L'agrégat anonyme des hypothèses cliniques esquisse
une **hypothèse institutionnelle** — même principe, même cycle. L'esquisse-machine
reste du **même bois que Continuité / Fragmentation** : montrée, anonyme, **sans
nombre, sans conclure**. La **chef de pôle** l'annote et la signe ; c'est cette
signature qui **arrête** l'hypothèse — l'agrégat ne formule jamais seul. Les
hypothèses institutionnelles **alimentent le bilobe Continuité / Fragmentation**.

---

## Les gardes tenues — pourquoi c'est sain

- **L'émergence n'écrit jamais le sanctuaire.** La machine propose une hypothèse
  en lisant la récolte ; elle ne dépose aucune réalité patient. Invariant intact.
- **L'émergence ne noue jamais (invariant 12).** Elle esquisse, l'humain arrête.
  **Rien n'existe comme hypothèse tant qu'un humain d'échelle ne l'a pas signée.**
- **Le verrou-signature EST ce qui empêche l'agrégat de conclure.** À
  l'institutionnel, la chef de pôle arrête ; l'agrégat n'arrête pas de lui-même —
  ce qui ferme l'angle mort de la magnitude institutionnelle (un chiffre/verdict
  qui reviendrait par la porte de l'agrégat).
- **L'hypothèse émergée n'a pas de statut de vérité.** Brouillon : on l'annote ou
  on la jette. Le patron est celui, déjà éprouvé, du condensé Affectif/Réflexif
  (§6.3) — aucun mécanisme neuf, une réutilisation.

---

## Questions ouvertes **[à trancher — arbitrage Abtine, session dédiée]**

Ces questions touchent le schéma et ne se referment pas ce soir. Elles sont le
prérequis du patch §18 bis / `schema.md`.

1. **Nature au catalogue (domaine 2).** L'hypothèse de travail est-elle une
   **nature** du flux de dépôts (`hypothese` ?), ou un objet à part ? Et
   l'**annotation** : nature de dépôt propre, ou dépôt référençant l'hypothèse ?
2. **Émergence : matérialisée ou recalculée ?** L'esquisse-machine est-elle
   *stockée* quelque part pour être annotée, ou *recalculée* à la lecture et
   seule l'annotation persiste ? (Détermine si l'hypothèse émergée a une ligne au
   schéma, ou seulement ses annotations.)
3. **L'acteur chef-de-pôle.** Nouvelle valeur d'`acteur` en §5 ? Cadre de
   signature `signature_chef_pole` distinct de `synthese_collective` ? C'est le
   §12 bis monté d'un cran : le lieu commun qui assume l'échelle institutionnelle.
4. **Invariant 12 à l'institutionnel.** Formaliser que l'agrégat-esquisse **ne
   noue jamais** l'hypothèse institutionnelle sans signature — la garde qui
   distingue « la machine montre une orientation » de « la machine conclut ».
5. **Rapport au récit qui s'écrit (§18 bis, « Les trois strates — récolte, métabolisation, institutionnel »).** L'hypothèse de travail est-elle la
   **trame** du récit du patient, ou distincte ? (Le récit = continuité du
   parcours ; l'hypothèse = orientation du soin. Se touchent-ils, ou sont-ce deux
   produits distincts de la métabolisation ?)

---

## Rapport au chantier en cours — §19

**N'interfère pas.** §19 grave la *forme visuelle* de la strate ; l'hypothèse de
travail est de l'*ontologie* (§18 bis). Ce que la note ajoute
**renforce** le patch §19 en cours sans le changer : la lentille Vigilante « garde
l'hypothèse ouverte » explique *pourquoi* le différentiel Affectif↔Réflexif se
tient jamais résolu — mais son texte, déjà rédigé, reste correct tel
quel. Au plus un **renvoi** à ajouter plus tard (§19 → cette ontologie), une fois
celle-ci gravée. **Le patch §19 peut graver sous ton œil sans attendre cette
note.**

---

## Prochain geste

Note posée (capture immédiate) → tu arbitres les cinq questions de schéma en
session dédiée → patch §18 bis (+ `schema.md`) **sous ton œil**, patron
`inscrire_strates.py` (ancres uniques, anti-double-application), **diff montré
avant écriture**, tu relis à froid, tu commites toi-même. La doctrine grave
**après** que le schéma est tranché — jamais l'inverse.
