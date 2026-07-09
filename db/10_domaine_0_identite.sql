-- CONTINUUM — Phase 0 · 10 · domaine 0 — Identité (les extrémités)
--
-- ┌ La coupe clé / attribut — loi §0 n°4, tranchée et inscrite ───────────────────┐
-- │ Sous append-only, `ipp text PRIMARY KEY` + `corrige_id uuid` sur une même     │
-- │ table est impossible : corriger, c'est INSÉRER une ligne qui porte            │
-- │ `corrige_id` — donc **deux lignes pour un IPP** —, ce que `ipp PRIMARY KEY`   │
-- │ interdit. La loi §0 rend l'attribut mouvant incompatible avec le rôle de clé, │
-- │ et **force** la coupe :                                                       │
-- │   · `patients`          — la clé nue, non négociable (§15), posée une fois ;  │
-- │   · `patients_identite` — l'attribut corrigible, chaîné, append-only.         │
-- │ Le même geste est répété sur `agents` (fichier 20). Inscrit dans `schema.md`, │
-- │ loi §0 n°4 : « la clé se pose, l'attribut se corrige ».                       │
-- └───────────────────────────────────────────────────────────────────────────────┘

SET ROLE continuum_migration;

CREATE TABLE identite.patients (
  ipp        text        PRIMARY KEY CHECK (btrim(ipp) <> ''),
  ouvert_le  timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE identite.patients IS
  'La clé. Tout le reste du système ne connaît que ceci. Pas de nom, pas de date, pas de secteur.';

CREATE TABLE identite.patients_identite (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ipp             text        NOT NULL REFERENCES identite.patients (ipp),
  nom             text        NOT NULL,
  prenom          text        NOT NULL,
  date_naissance  date,
  secteur         text,
  corrige_id      uuid,                       -- → la ligne que celle-ci corrige
  saisi_par       uuid        NOT NULL,       -- FK vers recolte.agents, posée en 20
  saisi_le        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT identite_pas_d_auto_correction CHECK (corrige_id IS DISTINCT FROM id),
  CONSTRAINT identite_cle_composite         UNIQUE (id, ipp),
  -- une correction ne peut pas faire migrer une identité d'un IPP vers un autre :
  CONSTRAINT identite_corrige_meme_ipp
    FOREIGN KEY (corrige_id, ipp) REFERENCES identite.patients_identite (id, ipp)
);

-- Une seule tête de chaîne par IPP : la saisie initiale.
CREATE UNIQUE INDEX identite_une_tete_par_ipp
  ON identite.patients_identite (ipp) WHERE corrige_id IS NULL;

-- Une chaîne, jamais un arbre : « la projection suit la queue » présuppose une queue unique.
CREATE UNIQUE INDEX identite_chaine_sans_fourche
  ON identite.patients_identite (corrige_id) WHERE corrige_id IS NOT NULL;

COMMENT ON COLUMN identite.patients_identite.corrige_id IS
  'Corriger = un acte typé de plus. La coquille survit dans le flux, disparaît de la projection (loi 2).';

RESET ROLE;
