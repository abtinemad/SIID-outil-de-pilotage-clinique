-- ═══════════════════════════════════════════════════════════════════════════════
-- db/35 — Domaine 2 (suite) : les AVIS. La signature à plusieurs du collège.
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- « Le collège noue et signe, pas un seul » cesse ici d'être une règle d'honnêteté
-- pour devenir une impossibilité : un dépôt décidé-en-collège n'est VALIDÉ (projection
-- domaine 3) que si ≥ 2 agents distincts l'ont signé. Le proposant signe EN déposant
-- (`auteur_id` = 1ʳᵉ signature) ; les suivants signent ici. Rien ne mute : chaque avis
-- est une ligne ajoutée, la validité se recalcule et ne se stocke jamais.
--
-- Deux positions : SIGNATURE (ratifier, muet) ou REFUS (diverger, argumenté — même loi
-- que la temporalité). Le refus COEXISTE : il ne bloque pas, ne compte pas dans la
-- validité, reste visible comme divergence attribuée et datée (§4, l'écart est matière).
--
-- L'avis ne porte QUE sur le signable. Jamais sur la récolte : on ne signe pas une
-- perception, on la recueille. Gardé par absence de chemin (FK composite + CHECK).
-- ═══════════════════════════════════════════════════════════════════════════════

SET ROLE continuum_migration;

CREATE TABLE depot.avis (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  depot_id      uuid        NOT NULL,
  ipp           text        NOT NULL,
  depot_nature  text        NOT NULL,
  agent_id      uuid        NOT NULL REFERENCES recolte.agents (id),
  type          text        NOT NULL,
  contenu       text,
  depose_le     timestamptz NOT NULL DEFAULT now(),

  -- FK composite : un avis ne peut pas mentir sur la nature qu'il vise (il ne peut
  -- prétendre viser une hypothèse clinique en visant une observation).
  CONSTRAINT avis_depot_reel
    FOREIGN KEY (depot_id, ipp, depot_nature)
    REFERENCES depot.depots (id, ipp, nature),

  -- Le garde de la récolte naïve : l'avis ne porte que sur le décidé-en-collège et ses
  -- levées. Un avis sur une observation n'a AUCUN chemin — refusé à la racine.
  CONSTRAINT avis_natures_signables
    CHECK (depot_nature IN ('situation','ressenti','demande','diffraction',
                            'hypothese_clinique','temporalite','levee')),

  CONSTRAINT avis_type_connu
    CHECK (type IN ('signature','refus')),
  -- Ratifier est muet, diverger s'argumente.
  CONSTRAINT avis_refus_argumente
    CHECK (type <> 'refus' OR contenu ~ '\S'),
  CONSTRAINT avis_signature_nue
    CHECK (type <> 'signature' OR contenu IS NULL),

  -- Un agent, une position par proposition, finale : on ne signe pas deux fois (pas de
  -- bourrage du compte), on ne signe pas ET refuse. Changer d'avis = une NOUVELLE
  -- proposition, jamais une réécriture.
  CONSTRAINT avis_un_par_agent
    UNIQUE (depot_id, agent_id)
);

COMMENT ON TABLE depot.avis IS
  'Domaine 2. La signature à plusieurs : chaque ligne est la réponse d''un agent à une proposition collège — signature (muette) ou refus (argumenté). Append-only. La validité (≥ 2 signataires) est une projection domaine 3, jamais stockée ici.';

ALTER TABLE depot.avis ENABLE ROW LEVEL SECURITY;
-- pas de FORCE : la migration seule passe outre.

-- Tout le monde lit tout : le refus est une divergence visible de tous (§4).
CREATE POLICY avis_lecture_ouverte ON depot.avis
  FOR SELECT TO continuum_soignant USING (true);

-- On signe (ou refuse) en son nom : agent_id est l'agent connecté, jamais un autre.
CREATE POLICY avis_signe_en_son_nom ON depot.avis
  FOR INSERT TO continuum_soignant
  WITH CHECK (agent_id = depot.agent_connecte());

RESET ROLE;
