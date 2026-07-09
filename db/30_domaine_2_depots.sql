-- CONTINUUM — Phase 0 · 30 · domaine 2 — Le flux de dépôts
--
-- Une seule table. Le fil rendu littéral. Le typage **est** l'anti-fourre-tout.
-- Colonnes : du texte, des dates, des références. **Rien d'autre** (invariant 4 : les
-- colonnes numériques n'existent pas — elles ne sont pas interdites, elles sont absentes).
-- **Ni d'axe** (invariant 20) : le rangement est une projection, recalculable.
--
-- ┌ La structure de `depots` — §4, tranché et inscrit ───────────────────────────┐
-- │ (1) `ref_id` était **polymorphe** : « dépôt révisé / levé, **ou**            │
-- │     proposition validée ». Deux cibles, deux tables, deux domaines : une     │
-- │     seule colonne ne porte qu'une FK, et un uuid nu serait falsifiable —     │
-- │     ce que la loi 3 bannit. Scindé en `ref_depot_id` (domaine 2) et          │
-- │     `ref_proposition_id` (domaine 3).                                        │
-- │ (2) `ref_nature` : colonne dénormalisée, **non falsifiable** — une FK        │
-- │     composite (id, ipp, nature) la force à valoir la nature réelle de la     │
-- │     ligne visée. Elle achète en structure deux gardes qui seraient sinon     │
-- │     du code : « une levée ne lève qu'une hypothèse, une inquiétude ou une    │
-- │     gestation » et « une révision révise le même registre ».                 │
-- │ (3) `type_valide` : une colonne, jamais la prose. Rangé dans le `contenu`,   │
-- │     la projection `type_courant` devrait **lire la phrase** — du sens lu     │
-- │     sur la surface vive, ce que §4 (d) interdit. Ce n'est pas un nombre.     │
-- └──────────────────────────────────────────────────────────────────────────────┘

SET ROLE continuum_migration;

CREATE TABLE depot.depots (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ipp                 text        NOT NULL REFERENCES identite.patients (ipp),
  depose_le           timestamptz NOT NULL DEFAULT now(),
  auteur_id           uuid        NOT NULL REFERENCES recolte.agents (id),
  cadre               text        NOT NULL,
  nature              text        NOT NULL,
  champ_cible         text,
  "position"          text,
  facette             text,
  acteur_id           uuid        REFERENCES recolte.acteurs (id),
  ref_depot_id        uuid,
  ref_nature          text,
  ref_proposition_id  uuid,       -- FK vers machine.propositions_retypage, posée en 40
  type_valide         text,
  contenu             text,

  -- la clé composite qui rend les deux FK internes non falsifiables
  CONSTRAINT depots_cle_composite UNIQUE (id, ipp, nature),

  -- ══ Le cadre, jamais l'étiquette ═════════════════════════════════════════════
  -- Trois cadres, jamais trois grades. Le cadre nomme LE MOMENT :
  --   seul                    — la voiture, le domicile, le geste du matin
  --   synthese_collective     — la salle, plusieurs regards en tension
  --   responsabilite_medicale — le médecin coordinateur, seul, qui répond (§10)
  -- L'exception s'inscrit DANS LE RECORD, datée et visible : dans un an on saura d'un
  -- coup d'œil quelles lectures sont sorties d'une salle et lesquelles d'une seule tête.
  CONSTRAINT depots_cadre_connu
    CHECK (cadre IN ('seul','synthese_collective','responsabilite_medicale')),

  CONSTRAINT depots_nature_connue
    CHECK (nature IN (
      -- famille observation (déposée seul comme en synthèse) :
      'observation','hypothese','inquietude','vide_info','gestation','levee',
      'lien_travail','indication',
      -- le nouage (jamais seul) :
      'situation','ressenti','demande','diffraction','lecture_clinique',
      'equilibre','compte_rendu','validation_typage'
    )),

  -- ┌ La coupe n'est pas entre le médecin et les autres. Elle est entre ce qui se ────┐
  -- │ SIGNE et ce qui se FORMULE.                                                      │
  -- │                                                                                  │
  -- │ Ce qui se **signe** engage une responsabilité, donc une personne : la signature  │
  -- │ EST l'acte de dépôt (§5). Un compte rendu à quatre mains n'est pas un compte     │
  -- │ rendu. Ouvert au cadre `responsabilite_medicale`.                                │
  -- │                                                                                  │
  -- │ Ce qui se **formule** — la grille — n'existe QUE parce que plusieurs regards     │
  -- │ l'ont faite. `diffraction` déposée seul est un homme qui se relit ; `equilibre`  │
  -- │ déposé seul est le nouage rendu à un regard unique. Fermé À TOUT LE MONDE, le    │
  -- │ coordinateur compris. Si l'on peut formuler seul, le trilobe cesse d'être un     │
  -- │ collège : c'est un bureau.                                                       │
  -- │                                                                                  │
  -- │ Les deux contraintes sont **d'un seul côté** : la famille observation reste      │
  -- │ libre de son cadre (on cite un mot cru dans la salle). Un CHECK qui n'interdit   │
  -- │ rien serait décoratif — pire que rien.                                           │
  -- └──────────────────────────────────────────────────────────────────────────────────┘

  -- La grille est FORMULÉE, pas récoltée. La récolte EST la diffraction (chaque angle
  -- déposé seul, sans voir les autres) ; le champ Diffraction est le moment où le collège
  -- les pose côte à côte (§12 bis). Aucune main seule, jamais, pas même celle qui répond.
  CONSTRAINT depots_grille_formulee_en_college
    CHECK (nature NOT IN ('situation','ressenti','demande','diffraction','equilibre')
           OR cadre = 'synthese_collective'),

  -- Ce qui se signe : le collège, ou la responsabilité médicale. Jamais `seul`.
  CONSTRAINT depots_signe_jamais_seul
    CHECK (nature NOT IN ('lecture_clinique','compte_rendu','validation_typage')
           OR cadre IN ('synthese_collective','responsabilite_medicale')),

  -- Et rien d'autre n'emprunte ce cadre : il n'est pas une porte de service.
  CONSTRAINT depots_responsabilite_medicale_reservee
    CHECK (cadre <> 'responsabilite_medicale'
           OR nature IN ('lecture_clinique','compte_rendu','validation_typage')),

  -- ══ La prose ════════════════════════════════════════════════════════════════
  -- « Rester nu » : seule la gestation peut n'avoir aucun contenu (§6).
  CONSTRAINT depots_contenu_sauf_gestation
    CHECK (nature = 'gestation' OR contenu IS NOT NULL),

  -- ══ La position — source du regard, jamais fusionnée ════════════════════════
  CONSTRAINT depots_position_ressenti
    CHECK (nature <> 'ressenti' OR "position" IN ('patient','equipe','entourage')),
  CONSTRAINT depots_position_lecture_clinique
    CHECK (nature <> 'lecture_clinique' OR "position" IN ('medecin','equipe','entourage','structure')),
  CONSTRAINT depots_position_nulle_ailleurs
    CHECK ("position" IS NULL
           OR nature IN ('ressenti','lecture_clinique','vide_info','gestation')),

  -- ══ La facette — la demande seule ═══════════════════════════════════════════
  CONSTRAINT depots_facette_demande
    CHECK ((nature = 'demande') = (facette IS NOT NULL)),
  CONSTRAINT depots_facette_connue
    CHECK (facette IS NULL OR facette IN ('surface','reelle')),

  -- ══ Le champ cible — le vide et la gestation visent un champ ════════════════
  CONSTRAINT depots_champ_cible_requis
    CHECK ((nature IN ('vide_info','gestation')) = (champ_cible IS NOT NULL)),
  CONSTRAINT depots_champ_cible_connu
    CHECK (champ_cible IS NULL
           OR champ_cible IN ('situation','clinique','ressenti','demande','diffraction','equilibre')),

  -- ══ Le lien de travail — jamais anonyme ═════════════════════════════════════
  CONSTRAINT depots_lien_travail_acteur
    CHECK (nature <> 'lien_travail' OR acteur_id IS NOT NULL),

  -- ══ Les références internes ═════════════════════════════════════════════════
  CONSTRAINT depots_ref_paire
    CHECK ((ref_depot_id IS NULL) = (ref_nature IS NULL)),
  CONSTRAINT depots_ref_reservee
    CHECK (ref_depot_id IS NULL
           OR nature IN ('levee','lecture_clinique','hypothese','lien_travail')),
  -- Lever n'est pas effacer : deux actes datés, tous deux visibles.
  CONSTRAINT depots_levee_reference
    CHECK (nature <> 'levee'
           OR (ref_depot_id IS NOT NULL
               AND ref_nature IN ('hypothese','inquietude','gestation'))),
  -- Une révision révise le même registre : une lecture clinique ne révise pas un lien.
  CONSTRAINT depots_revision_homogene
    CHECK (nature NOT IN ('lecture_clinique','hypothese','lien_travail')
           OR ref_depot_id IS NULL
           OR ref_nature = nature),
  CONSTRAINT depots_pas_d_auto_reference CHECK (ref_depot_id IS DISTINCT FROM id),
  -- le référencé est du même patient, et sa nature déclarée est sa nature réelle :
  CONSTRAINT depots_ref_verifiee
    FOREIGN KEY (ref_depot_id, ipp, ref_nature)
    REFERENCES depot.depots (id, ipp, nature),

  -- ══ Le typage — le mouvement propose, le regard valide ══════════════════════
  CONSTRAINT depots_type_valide_reserve
    CHECK ((nature = 'validation_typage') = (type_valide IS NOT NULL)),
  CONSTRAINT depots_type_connu
    CHECK (type_valide IS NULL OR type_valide IN ('aigu','nap','chronique')),
  CONSTRAINT depots_proposition_reservee
    CHECK (ref_proposition_id IS NULL OR nature = 'validation_typage')
);

-- On ne retype pas d'un clic : il faut que le mouvement l'ait proposé. L'exception
-- (« sauf premier typage à l'indication ») est **structurelle**, non applicative :
-- au plus un typage sans proposition par patient — le premier.
CREATE UNIQUE INDEX depots_un_seul_typage_sans_proposition
  ON depot.depots (ipp)
  WHERE nature = 'validation_typage' AND ref_proposition_id IS NULL;

-- Une seule relance par porte, un seul lever par dépôt levé : lever deux fois la même
-- hypothèse n'est pas une révision, c'est un doublon.
CREATE UNIQUE INDEX depots_une_levee_par_depot
  ON depot.depots (ref_depot_id) WHERE nature = 'levee';

COMMENT ON TABLE depot.depots IS
  'Domaine 2. Append, rien ne se masque. Le sanctuaire (lecture_clinique) est une propriété du TYPE, codée en dur dans la doctrine — jamais une colonne par ligne : un flag serait falsifiable.';
COMMENT ON COLUMN depot.depots.auteur_id IS
  'Invariant 18 : auteur_id et depose_le voyagent avec l''énoncé, du dépôt à l''écran. Jamais « l''équipe ».';
COMMENT ON COLUMN depot.depots.nature IS
  'Le registre (sanctuaire / traversée / mot cru) se lit de la nature. Aucune colonne ne le déclare.';

-- ══ Qui peut écrire `responsabilite_medicale` ═══════════════════════════════════
--
-- Le CHECK dit CE QUI passe par ce cadre. Il ne peut pas dire QUI : un CHECK ne regarde
-- qu'une ligne. La garde est donc une politique (RLS), et elle tient à deux conditions,
-- indissociables :
--
--   1. `auteur_id` doit être l'agent connecté. Sans cela, écrire l'uuid du coordinateur
--      dans la colonne suffirait à emprunter son droit — la garde serait décorative.
--      C'est aussi l'invariant 18 tenu à la racine : l'attribution EST la garde.
--   2. et si le cadre est `responsabilite_medicale`, cet agent doit être coordinateur.
--
-- La fonction lit la QUEUE de la chaîne de fiches : le droit suit la fonction, qui change.
-- L'app pose `SET LOCAL continuum.agent_id = '…'` à l'ouverture de la transaction.

CREATE FUNCTION depot.est_coordinateur(agent uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT coalesce(bool_or(f.medecin_coordinateur), false)
  FROM recolte.agents_fiche f
  WHERE f.agent_id = agent
    AND NOT EXISTS (SELECT 1 FROM recolte.agents_fiche c WHERE c.corrige_id = f.id)
$$;

CREATE FUNCTION depot.agent_connecte() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('continuum.agent_id', true), '')::uuid
$$;

ALTER TABLE depot.depots ENABLE ROW LEVEL SECURITY;
-- pas de FORCE : la migration seule passe outre, hors ligne, devant témoin.

-- Tout le monde lit tout : la divergence est le matériau (§4). Rien ne se cache d'un
-- soignant à l'autre — la seule chose privée du système est le miroir de l'agent (§6.4).
CREATE POLICY depots_lecture_ouverte ON depot.depots
  FOR SELECT TO continuum_soignant USING (true);

CREATE POLICY depots_depot_attribue ON depot.depots
  FOR INSERT TO continuum_soignant
  WITH CHECK (
    auteur_id = depot.agent_connecte()
    AND (cadre <> 'responsabilite_medicale' OR depot.est_coordinateur(auteur_id))
  );

RESET ROLE;
