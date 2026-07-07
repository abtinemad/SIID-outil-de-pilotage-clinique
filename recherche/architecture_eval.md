# Architecture du système d'eval — proposition (2026-07-07)

> Réponse à : *« quelles seraient les meilleures ingénieries pour constituer le système d'eval ? »*
> Ceci est une **proposition de topologie**, indépendante des internes de l'eval (qui attendent tes
> fichiers Collègue). La topologie ne changera pas avec eux ; seuls les *prompts* des evals se
> rempliront. À réagir, pas à graver.
>
> **Compagnon de `recherche/extraction_leclg.md`** (le cerveau LeCLG — facilitateur + évaluateur
> silencieux, mesure auto-effaçante, *fragment brut ≠ étiquettes qui agrègent*) **et de
> `recherche/methode_reflexivite.md`** (les principes de réflexivité). Cette note ne double pas :
> elle pose la **topologie** qui fait tourner ces deux-là.

---

## Le principe directeur

**Projection sur la source, jamais cascade de résumés.**

Une cascade — chaque eval résume celle du dessous — est le mode de défaillance qui incarne ta peur :
un trou creusé en amont devient invisible en aval (on ne voit pas ce qui a été perdu deux couches
plus tôt). Donc :

1. **Aucune eval ne lit une autre eval pour du *contenu*.** Chaque eval de lecture lit la **source
   brute** (le pentalobe). L'Affectif et le Réflexif lisent le brut *en parallèle*, pas l'un l'autre.
2. **On présente par le résumé, on vérifie contre la source.** Deux chemins distincts, jamais
   croisés. Vérifier à travers un résumé = compounder l'erreur.
3. **L'omission est intrinsèque au résumé.** On ne la *prévient* pas (pas de prompt parfait), **on la
   rend détectable** par une couche déterministe non-LLM (voir « La couverture »).

*Note d'ingénierie : c'est l'expression exacte de ton schéma. Event sourcing + vues matérialisées
recalculables = domaine 0-2 (source append-only faisant foi) + domaine 3 (projections, lecture
seule, recalculables). Tes evals **sont** des projections domaine-3. L'architecture est déjà dans ta
doctrine.*

---

## Les invariants doctrinaux qui contraignent la topologie

| Invariant | Contrainte d'archi |
|---|---|
| Projection = lecture seule, recalculable, non-faisant-foi | toute sortie d'eval est estampillée de la version-source dont elle est issue ; jamais stockée comme vérité ; toujours reconstructible |
| Sanctuaire (Clinique citée verbatim, jamais reformulée, jamais nouée, inv. 12) | la `lecture_clinique` est un champ **pass-through** en I/O d'eval : transporté verbatim, jamais donné à la partie résumante du prompt |
| Anti-fusion (côte à côte, jamais un ratio, §4) | le différentiel Vigilante est un **écart montré**, jamais un nombre unique fondant deux registres |
| Mesure auto-effaçante / anonymat (l'affect ne fait jamais face au soignant) | l'institutionnel lit des **agrégats anonymisés par construction** (chemin de données distinct), pas du brut filtré |
| Montrer sans conclure (§19 boucle latente) | les « guides » sont des **relances** (questions/ouvertures), jamais des prescriptions |

---

## Le modèle en couches

**Couche 0 — La source.** Le registre append-only (récolte brute), par patient, domaines 0-2.
Immuable, fait foi. Tout le reste en dérive.

**Couche 1 — La couverture.** Carte **déterministe, non-LLM** : pour chaque item déposé — son axe,
lu/non-lu par quelle projection ; et pour chaque axe — présent-et-lu / présent-mais-non-lu / absent.
Les deux derniers cas = les **trous**. Opérations d'ensemble : *ne peut pas oublier*, parce qu'elle
ne résume pas. C'est le détecteur de trous, et c'est « la relance par l'absence » (§11)
opérationnalisée. Tourne à chaque dépôt.

**Couche 2 — Les lectures (le trilobe, versant contenu).** Trois projections sur la Couche 0 :
- **Affectif** : brut → lecture condensée du vécu. Sanctuaire cité verbatim.
- **Réflexif** : brut → lecture condensée du raisonnement / de la posture.
- **Le condensé ergonomique du pentalobe** : brut → digest lisible de *tout* le brut, **pour
  l'humain** (ton « rendre le pentalobe accessible depuis le trilobe »). Il nourrit le lecteur, **pas
  les autres evals** — celles-ci vont à la source.

Aucune de ces trois ne lit les autres. Chacune estampillée de sa version-source.

**Couche 3 — La Vigilante (relationnelle, on la lit, on n'y dépose pas).** **Deux** sorties, jamais
fondues :
- **Le différentiel** : lit les sorties Affectif ⊕ Réflexif → montre l'écart / l'angle mort entre le
  vécu et le raisonné. Écart tenu, jamais résolu (§4). *« Conserver la vision de tout le monde. »*
- **La couverture vigilante** : lit la Couche 1 + le brut → **remonte les trous** que *les deux*
  lobes ont ratés. Critique **adversarial** : conçu pour trouver l'omission, pas pour approuver.

**Couche 4 — L'institutionnel (le bilobe, anonyme).** Lit des **signaux de métabolisation
anonymisés** + les **cartes de couverture agrégées** à travers les patients → Continuité /
Fragmentation. Jamais de contenu brut inter-patients (anonymat par construction, pas par filtrage).
Le contenu reste per-patient ; seuls les *trous* montent en statistique anonyme.

**Transverse — Le temps.** Chaque sortie est versionnée (append-only). Les **guides pendant le
parcours** = **diffs** contre les versions antérieures : axe nouvellement mince, écart qui se creuse.
Formulés en relances, jamais en directives.

---

## Le traitement des trous — le cœur

**Décision (2026-07-07) : la couverture sémantique est primordiale, partout.** C'est elle qui
extrait le plus de **données phénoménologiques** — non « tel sujet est présent » mais « telle
*texture* du vécu traverse trois dépôts sans qu'aucun lobe ne la nomme ». Un trou, ici, est un
**mode d'expérience présent dans le brut mais non remonté**. Deux couches complémentaires, aucune ne
suffisant seule :

- **Le plancher — couverture structurelle** (Couche 1, déterministe, non-LLM) : tout item déposé
  est-il l'entrée d'au moins une eval ? Set-membership : *incapable d'oublier*. Le garde-fou dur —
  nécessaire *parce que* la sémantique, elle, est LLM et donc faillible.
- **Le moteur — couverture sémantique** (primaire) : l'item est-il *vraiment* reflété — sa texture,
  pas sa mention ? Elle rattrape les trous **phénoménologiques** que le structurel ne voit pas. C'est
  le cœur de l'extraction, et c'est la Couche 3 (critique adversarial : « quelle texture du brut
  n'est dans aucun lobe ? »).
- **Détection d'absence** (§11) : axe sans dépôt = trou par absence.

**Le critère d'acceptation de la couverture sémantique** est déjà posé dans
`methode_reflexivite.md` (Principe 2, test de Sibeoni) : **reconnaissance + surprise** — « c'est
exactement ça, mais je ne l'avais jamais formulé comme ça ». Reconnaissance sans surprise =
trivial ; surprise sans reconnaissance = projection. Les deux = un implicite qui était sien, rendu
visible. C'est *ça*, un trou phénoménologique bien remonté — pas une couverture de thèmes. **Sujet
du test = le soignant, jamais le patient.** Et le sanctuaire est protégé par le mécanisme de
`extraction_leclg.md` : *le fragment garde ses mots, la machine lit autour, ne récite ni ne réécrit
jamais* — c'est le pass-through verbatim de la Clinique, déjà éprouvé.

**Le déplacement clé :** ta complétude ne repose pas sur le prompt parfait (fragile), mais sur le
couple **plancher structurel** (incorruptible) + **moteur sémantique** (riche). Le structurel
garantit que rien n'est *formellement* lâché ; le sémantique cherche ce qui est
*phénoménologiquement* tu.

**Garde doctrinal — la profondeur relève les enjeux, elle ne les relâche pas.** Plus l'extraction est
fine, plus le miroir est riche — et plus un verdict serait séduisant, donc dangereux. Un jugement
grossier, on s'en méfie ; un jugement texturé, on le croit. La couverture sémantique reste une
**projection** (recalculable, ne fait pas foi) : elle *fait apparaître* des angles phénoménologiques
pour l'humain, elle ne les classe pas, ne les score pas, ne conclut pas. *Montrer plus, sans
conclure davantage.* La réflexion reste l'acte de l'humain ; l'outil enrichit sa matière, il ne la
performe pas.

**Anonymat — la sémantique partout, mais pas le contenu partout.** Niveau patient : sémantique sur le
brut (riche). Niveau institutionnel : sémantique sur les **cartes de couverture anonymisées** (tel
mode phénoménologique est-il systématiquement tu dans l'unité ?), jamais sur le contenu
inter-patients — sinon la finesse même dé-anonymise.

---

## Ce qui attend tes fichiers Collègue

La **topologie** ci-dessus est source-agnostique. Ce que les fichiers Collègue rempliront :
- les *internes* de chaque eval de lecture (comment le cerveau lit, extrait, cite le sanctuaire) ;
- le **calibrage de la couverture sémantique sur *ta* phénoménologie** (via l'article + la thèse) —
  pour qu'elle cherche les trous que *tu* appelles trous, pas une notion NLP générique ;
- le calcul exact du différentiel Affectif↔Réflexif (comment montrer l'écart sans le résoudre).

Aucun de ces points ne déplace les couches. On peut donc figer la topologie maintenant et remplir
les evals à réception.
