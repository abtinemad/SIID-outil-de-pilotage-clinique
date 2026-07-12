#!/usr/bin/env bash
# Monte une base neuve, applique la DDL, passe les tests d'impossibilité. Jetable.
set -euo pipefail
PSQL="psql -h ${PGHOST:-/tmp} -p ${PGPORT:-5432} -U ${PGUSER:-$(whoami)} -v ON_ERROR_STOP=1 -q"
DB=${DB:-continuum_phase0}
$PSQL -d postgres -c "DROP DATABASE IF EXISTS $DB" -c "DROP ROLE IF EXISTS continuum_soignant" \
      -c "DROP ROLE IF EXISTS continuum_machine" -c "DROP ROLE IF EXISTS continuum_migration"
$PSQL -d postgres -c "CREATE DATABASE $DB"
$PSQL -d "$DB" -f 00_roles_schemas.sql
$PSQL -d "$DB" -c "GRANT CREATE ON DATABASE $DB TO continuum_migration"
for f in 10_domaine_0_identite.sql 20_domaine_1_recolte.sql 30_domaine_2_depots.sql \
         35_domaine_2_avis.sql 40_domaine_3_machine.sql 50_lecture_machine.sql \
         60_privileges.sql 70_contenu_non_vide.sql; do
  echo "── $f"; $PSQL -d "$DB" -f "$f"
done
psql -h ${PGHOST:-/tmp} -p ${PGPORT:-5432} -U ${PGUSER:-$(whoami)} -v ON_ERROR_STOP=1 -d "$DB" -f tests/impossibilites.sql
