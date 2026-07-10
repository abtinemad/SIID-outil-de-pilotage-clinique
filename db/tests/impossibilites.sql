-- CONTINUUM — Phase 0 · tests d'impossibilité
--
-- Quatre gestes doivent être **impossibles**. Un test qui échoue à échouer est une doctrine
-- qui a cessé d'exister.
--
--   1. la machine insère un dépôt              → invariant 2  (absence de chemin)
--   2. UPDATE sur un dépôt                     → invariant 1  (rien ne s'écrase)
--   3. `lecture_clinique` en `cadre='seul'`    → §10, interdit dur
--   4. `situation` en `cadre='seul'`           → la grille est formulée, pas récoltée
--
-- Trois de plus, nées de l'arbitrage du cadre `responsabilite_medicale` : ce qui se
-- FORMULE reste fermé au coordinateur ; ce qui se SIGNE lui est ouvert, et à lui seul ;
-- et nul ne dépose sous le nom d'un autre.
--
-- Et **quatre gestes doivent réussir**. Sans eux, une base vide, un rôle sans droit, une
-- coquille dans un nom de table feraient passer la suite entière : quatre erreurs suffisent
-- à simuler quatre vertus. `schema.md` le dit du CHECK, cela vaut du test : *une garde qui
-- n'interdit rien est pire que rien.* Les contrôles positifs sont la preuve que les
-- impossibilités ci-dessus sont **les bonnes**, et non l'ombre d'une panne.
--
-- Tout tourne dans une transaction, et se défait. La base sort du test telle qu'elle y est
-- entrée : un test ne dépose pas.

\set ON_ERROR_STOP on
SET client_min_messages TO warning;

BEGIN;

-- ── Le banc ───────────────────────────────────────────────────────────────────

CREATE SCHEMA test;

CREATE TABLE test.resultats (
  ordre    serial,
  attendu  text NOT NULL,     -- 'echec' | 'succes'
  nom      text NOT NULL,
  verdict  text NOT NULL,     -- 'TENU' | 'ROMPU'
  detail   text
);

-- Exécute `sql` sous le rôle `role_`, et **exige l'échec**, avec le bon SQLSTATE.
-- Le SQLSTATE compte : « refusé parce que le CHECK a mordu » et « refusé parce que la
-- table n'existe pas » sont deux mondes. Un test d'impossibilité qui ne nomme pas la
-- cause de l'impossibilité ne teste rien.
CREATE FUNCTION test.doit_echouer(nom text, role_ text, sql text, sqlstate_attendu text,
                                  agent uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE etat text; msg text;
BEGIN
  PERFORM set_config('continuum.agent_id', coalesce(agent::text, ''), true);
  EXECUTE format('SET LOCAL ROLE %I', role_);
  BEGIN
    EXECUTE sql;
    RESET ROLE;
    INSERT INTO test.resultats (attendu, nom, verdict, detail)
      VALUES ('echec', nom, 'ROMPU', 'le geste a RÉUSSI — l''invariant n''existe plus');
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS etat = RETURNED_SQLSTATE, msg = MESSAGE_TEXT;
  END;
  RESET ROLE;
  IF etat = sqlstate_attendu THEN
    INSERT INTO test.resultats (attendu, nom, verdict, detail)
      VALUES ('echec', nom, 'TENU', format('%s — %s', etat, msg));
  ELSE
    INSERT INTO test.resultats (attendu, nom, verdict, detail)
      VALUES ('echec', nom, 'ROMPU',
              format('a échoué, mais pour la mauvaise raison : %s attendu, %s obtenu — %s',
                     sqlstate_attendu, etat, msg));
  END IF;
END $$;

CREATE FUNCTION test.doit_reussir(nom text, role_ text, sql text, agent uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE etat text; msg text;
BEGIN
  PERFORM set_config('continuum.agent_id', coalesce(agent::text, ''), true);
  EXECUTE format('SET LOCAL ROLE %I', role_);
  BEGIN
    EXECUTE sql;
    RESET ROLE;
    INSERT INTO test.resultats (attendu, nom, verdict, detail) VALUES ('succes', nom, 'TENU', NULL);
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS etat = RETURNED_SQLSTATE, msg = MESSAGE_TEXT;
  END;
  RESET ROLE;
  INSERT INTO test.resultats (attendu, nom, verdict, detail)
    VALUES ('succes', nom, 'ROMPU', format('%s — %s', etat, msg));
END $$;

-- ── La matière ────────────────────────────────────────────────────────────────
-- Semée par la migration : le banc n'est pas un guichet.

SET ROLE continuum_migration;

-- Karima, IDE : elle récolte le matin, elle noue l'après-midi avec les autres.
INSERT INTO recolte.agents (id) VALUES ('11111111-1111-1111-1111-111111111111');
INSERT INTO recolte.agents_fiche (agent_id, nom, fonction, medecin_coordinateur)
  VALUES ('11111111-1111-1111-1111-111111111111', 'Karima', 'IDE', false);

-- Le médecin coordinateur : il répond. Droit de fonction, pas hiérarchie de lecture.
INSERT INTO recolte.agents (id) VALUES ('33333333-3333-3333-3333-333333333333');
INSERT INTO recolte.agents_fiche (agent_id, nom, fonction, medecin_coordinateur)
  VALUES ('33333333-3333-3333-3333-333333333333', 'A.', 'psychiatre coordinateur', true);

INSERT INTO identite.patients (ipp) VALUES ('IPP-TEST-001');
INSERT INTO identite.patients_identite (ipp, nom, prenom, saisi_par)
  VALUES ('IPP-TEST-001', 'D.', 'Un', '11111111-1111-1111-1111-111111111111');

-- un dépôt licite, cible du test 2
INSERT INTO depot.depots (id, ipp, auteur_id, cadre, nature, contenu) VALUES
  ('22222222-2222-2222-2222-222222222222', 'IPP-TEST-001',
   '11111111-1111-1111-1111-111111111111', 'seul', 'observation',
   'Le 3 mars : « toute-puissance ». Il a refusé de s''asseoir.');

RESET ROLE;

-- ══════════════════════════════════════════════════════════════════════════════
--  LES QUATRE IMPOSSIBILITÉS
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. La machine insère un dépôt.
--    42501 = insufficient_privilege, et le message dit **schéma**, non table : la machine
--    ne se voit pas refuser l'écriture, elle ne trouve pas le guichet. « Le sanctuaire est
--    une absence de chemin, pas une permission. »
SELECT test.doit_echouer(
  'la machine insère un dépôt',
  'continuum_machine',
  $$INSERT INTO depot.depots (ipp, auteur_id, cadre, nature, contenu)
    VALUES ('IPP-TEST-001','11111111-1111-1111-1111-111111111111','seul','observation','écrit par la machine')$$,
  '42501');

-- 1 bis. Et pas davantage par la fenêtre : la vue porte un `WITH` de tête, elle n'est pas
--    auto-inscriptible. 55000 = object_not_in_prerequisite_state. Aucun GRANT ne la rouvre.
SELECT test.doit_echouer(
  'la machine insère un dépôt PAR LA VUE DE LECTURE',
  'continuum_machine',
  $$INSERT INTO lecture.depots (ipp, auteur_id, cadre, nature, contenu)
    VALUES ('IPP-TEST-001','11111111-1111-1111-1111-111111111111','seul','observation','par la fenêtre')$$,
  '55000');

-- 2. UPDATE sur un dépôt — par le rôle qui, lui, a le droit d'y écrire.
--    Le soignant peut déposer ; il ne peut pas revenir en arrière. Réviser = un acte daté
--    de plus. « UPDATE coupe le fil ; l'append le plie. »
SELECT test.doit_echouer(
  'un UPDATE sur un dépôt',
  'continuum_soignant',
  $$UPDATE depot.depots SET contenu = 'nettoyé' WHERE id = '22222222-2222-2222-2222-222222222222'$$,
  '42501');

-- 3. Une `lecture_clinique` déposée seul.
--    23514 = check_violation. Interdit dur du §10 : jamais une lecture clinique en régime
--    directif à un exécutant. Sans cette contrainte, l'app violait l'interdit tous les matins.
SELECT test.doit_echouer(
  'une lecture_clinique en cadre=seul',
  'continuum_soignant',
  $$INSERT INTO depot.depots (ipp, auteur_id, cadre, nature, "position", contenu)
    VALUES ('IPP-TEST-001','11111111-1111-1111-1111-111111111111','seul','lecture_clinique','equipe',
            'Le mécanisme : il tient tant qu''on ne le regarde pas.')$$,
  '23514', '11111111-1111-1111-1111-111111111111');

-- 4. Une `situation` déposée seul.
--    Même contrainte, autre bord : la grille est **formulée** en collège à partir des
--    observations, jamais récoltée. La récolte EST la diffraction ; le champ Diffraction
--    est le moment où le collège pose les angles côte à côte.
SELECT test.doit_echouer(
  'une situation en cadre=seul',
  'continuum_soignant',
  $$INSERT INTO depot.depots (ipp, auteur_id, cadre, nature, contenu)
    VALUES ('IPP-TEST-001','11111111-1111-1111-1111-111111111111','seul','situation',
            'Il vit seul depuis six mois.')$$,
  '23514', '11111111-1111-1111-1111-111111111111');

-- 4 bis. Un dépôt vide.
--    Le domaine 2 est append-only et rien ne s'y masque : un dépôt vide n'est pas un accident
--    qu'on efface, c'est une cicatrice datée et signée sur le fil d'un patient. Le vide qui est
--    un FAIT a déjà sa nature — `vide_info`, §6, « j'ai regardé, il n'y avait rien ». Le blanc
--    du doigt qui glisse n'en est pas un. Sans ce CHECK, le refus du champ blanc est une règle
--    d'application : contournable, donc rien.
SELECT test.doit_echouer(
  'un dépôt au contenu vide',
  'continuum_soignant',
  $$INSERT INTO depot.depots (ipp, auteur_id, cadre, nature, contenu)
    VALUES ('IPP-TEST-001','11111111-1111-1111-1111-111111111111','seul','observation','')$$,
  '23514', '11111111-1111-1111-1111-111111111111');

-- 4 ter. Et pas davantage rempli de blanc. `btrim()` ne rogne que l'ESPACE : `btrim(E'\n') <> ''`
--    vaut vrai. Un dépôt fait d'un seul retour ligne passait. La garde est `~ '\S'` — au moins
--    un caractère qui ne soit pas du blanc.
SELECT test.doit_echouer(
  'un dépôt fait d''espaces et de retours ligne',
  'continuum_soignant',
  $$INSERT INTO depot.depots (ipp, auteur_id, cadre, nature, contenu)
    VALUES ('IPP-TEST-001','11111111-1111-1111-1111-111111111111','seul','observation', E'   \n\t  ')$$,
  '23514', '11111111-1111-1111-1111-111111111111');

-- 4 quater. Même faiblesse au domaine 0 : un IPP fait d'un seul retour ligne passait
--    `btrim(ipp) <> ''`. La clé se pose, elle ne se corrige pas (§0 n°4) — un IPP blanc est
--    une clé qu'on ne pourra jamais reprendre.
SELECT test.doit_echouer(
  'un IPP fait d''un seul retour ligne',
  'continuum_migration',
  $$INSERT INTO identite.patients (ipp) VALUES (E'\n')$$,
  '23514');

-- 5. Le coordinateur formule une `situation` seul.
--    Le droit de fonction ouvre ce qui se SIGNE, jamais ce qui se FORMULE. La grille
--    n'existe que parce que plusieurs regards l'ont faite : un homme qui diffracte seul
--    est un homme qui se relit. Fermé à lui comme aux autres.
SELECT test.doit_echouer(
  'le coordinateur formule une situation seul',
  'continuum_soignant',
  $$INSERT INTO depot.depots (ipp, auteur_id, cadre, nature, contenu)
    VALUES ('IPP-TEST-001','33333333-3333-3333-3333-333333333333','responsabilite_medicale','situation',
            'Il vit seul depuis six mois.')$$,
  '23514', '33333333-3333-3333-3333-333333333333');

-- 6. Une IDE emprunte le cadre du coordinateur.
--    42501 = la politique de ligne mord. Le CHECK dit CE QUI passe par ce cadre ;
--    il ne peut pas dire QUI. La RLS le dit, et lit la queue de la chaîne de fiches :
--    le droit suit la fonction, jamais la personne.
SELECT test.doit_echouer(
  'une IDE dépose en responsabilite_medicale',
  'continuum_soignant',
  $$INSERT INTO depot.depots (ipp, auteur_id, cadre, nature, "position", contenu)
    VALUES ('IPP-TEST-001','11111111-1111-1111-1111-111111111111','responsabilite_medicale','lecture_clinique','equipe',
            'Je décide.')$$,
  '42501', '11111111-1111-1111-1111-111111111111');

-- 7. Karima dépose sous le nom du coordinateur.
--    Sans cette garde, la précédente serait décorative : il suffirait d'écrire l'uuid du
--    médecin dans `auteur_id`. L'attribution EST la garde (invariant 18), tenue à la racine.
SELECT test.doit_echouer(
  'un dépôt attribué à un autre que soi',
  'continuum_soignant',
  $$INSERT INTO depot.depots (ipp, auteur_id, cadre, nature, contenu)
    VALUES ('IPP-TEST-001','33333333-3333-3333-3333-333333333333','seul','observation','Signé par un autre.')$$,
  '42501', '11111111-1111-1111-1111-111111111111');

-- ══════════════════════════════════════════════════════════════════════════════
--  LES CONTRÔLES POSITIFS — sans eux, les quatre ci-dessus ne prouvent rien
-- ══════════════════════════════════════════════════════════════════════════════

-- La `gestation` reste NUE. `NULL ~ '\S'` vaut NULL, et un CHECK NULL est tenu : la seule
-- nature autorisée à n'avoir aucun contenu le reste. Sans ce contrôle, un `contenu NOT NULL`
-- posé par mégarde passerait les deux impossibilités ci-dessus — et fermerait à l'infirmier
-- le seul guichet où il a le droit de dire qu'il ne sait pas encore.
SELECT test.doit_reussir(
  'une gestation reste nue',
  'continuum_soignant',
  $$INSERT INTO depot.depots (ipp, auteur_id, cadre, nature, champ_cible, contenu)
    VALUES ('IPP-TEST-001','11111111-1111-1111-1111-111111111111','seul','gestation','demande', NULL)$$,
  '11111111-1111-1111-1111-111111111111');

-- Le mot cru se dépose seul : c'est le geste du matin, dans la voiture.
SELECT test.doit_reussir(
  'une observation en cadre=seul',
  'continuum_soignant',
  $$INSERT INTO depot.depots (ipp, auteur_id, cadre, nature, contenu)
    VALUES ('IPP-TEST-001','11111111-1111-1111-1111-111111111111','seul','observation','Il a crié dans le couloir.')$$,
  '11111111-1111-1111-1111-111111111111');

-- La même main, six heures plus tard, en synthèse : la lecture clinique passe.
-- Ce n'est pas le grade qui a changé, c'est le moment.
SELECT test.doit_reussir(
  'une lecture_clinique en synthèse collective',
  'continuum_soignant',
  $$INSERT INTO depot.depots (ipp, auteur_id, cadre, nature, "position", contenu)
    VALUES ('IPP-TEST-001','11111111-1111-1111-1111-111111111111','synthese_collective','lecture_clinique','equipe',
            'Le cri arrive quand le rendez-vous se rapproche.')$$,
  '11111111-1111-1111-1111-111111111111');

-- Le coordinateur dépose seul sa lecture clinique — et le dossier le dit.
SELECT test.doit_reussir(
  'le coordinateur dépose sa lecture_clinique seul',
  'continuum_soignant',
  $$INSERT INTO depot.depots (ipp, auteur_id, cadre, nature, "position", contenu)
    VALUES ('IPP-TEST-001','33333333-3333-3333-3333-333333333333','responsabilite_medicale','lecture_clinique','medecin',
            'Le retrait précède la crise de trois jours, chaque fois.')$$,
  '33333333-3333-3333-3333-333333333333');

-- Et il signe un compte rendu. Un CR à quatre signatures n'est pas un CR.
SELECT test.doit_reussir(
  'le coordinateur signe un compte rendu seul',
  'continuum_soignant',
  $$INSERT INTO depot.depots (ipp, auteur_id, cadre, nature, contenu)
    VALUES ('IPP-TEST-001','33333333-3333-3333-3333-333333333333','responsabilite_medicale','compte_rendu',
            'Synthèse de prise en charge, validée énoncé par énoncé.')$$,
  '33333333-3333-3333-3333-333333333333');

-- La machine écrit chez elle, et seulement chez elle.
SELECT test.doit_reussir(
  'la machine émet une proposition de retypage',
  'continuum_machine',
  $$INSERT INTO machine.propositions_retypage (ipp, type_propose, base_factuelle)
    VALUES ('IPP-TEST-001','nap','4 contacts en 30 j, puis 0 en 45 j')$$);

-- La machine lit le dépôt par la fenêtre — sinon le test 1 confondrait cécité et sanctuaire.
SELECT test.doit_reussir(
  'la machine lit les dépôts par la vue',
  'continuum_machine',
  $$SELECT count(*) FROM lecture.depots WHERE ipp = 'IPP-TEST-001'$$);

-- ══════════════════════════════════════════════════════════════════════════════
--  DEUX GARDES QUE LA STRUCTURE OFFRE EN PRIME
-- ══════════════════════════════════════════════════════════════════════════════

-- Invariant 4 : « aucun nombre sur un dépôt (seuls nombres = des dates) ». Non pas interdit :
-- inexistant. La colonne ne se teste pas, elle se compte — à zéro.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM information_schema.columns
   WHERE table_schema = 'depot' AND table_name = 'depots'
     AND data_type IN ('integer','bigint','smallint','numeric','real','double precision');
  INSERT INTO test.resultats (attendu, nom, verdict, detail)
    VALUES ('echec', 'aucune colonne numérique sur un dépôt',
            CASE WHEN n = 0 THEN 'TENU' ELSE 'ROMPU' END,
            format('%s colonne(s) numérique(s)', n));
END $$;

-- §18 : la machine n'a aucun chemin vers le nom. Pas de consigne d'oubli — pas de chemin.
SELECT test.doit_echouer(
  'la machine lit le nom du patient',
  'continuum_machine',
  $$SELECT nom FROM identite.patients_identite$$,
  '42501');

-- ── Le verdict ────────────────────────────────────────────────────────────────

\echo ''
\echo '════════ CONTINUUM · Phase 0 · tests d''impossibilité ════════'
SELECT lpad(ordre::text, 2) AS n,
       rpad(attendu, 7)     AS attendu,
       rpad(verdict, 6)     AS verdict,
       rpad(nom, 52)        AS geste,
       coalesce(detail,'')  AS detail
FROM test.resultats ORDER BY ordre;

DO $$
DECLARE rompus int;
BEGIN
  SELECT count(*) INTO rompus FROM test.resultats WHERE verdict = 'ROMPU';
  IF rompus > 0 THEN
    RAISE EXCEPTION 'PHASE 0 — % invariant(s) ROMPU(s). La doctrine n''est plus dans la base.', rompus;
  END IF;
  RAISE WARNING 'PHASE 0 — % gestes vérifiés, aucun invariant rompu.', (SELECT count(*) FROM test.resultats);
END $$;

ROLLBACK;
