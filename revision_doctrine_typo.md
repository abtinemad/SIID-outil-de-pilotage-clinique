# Révision doctrinale — typographie de la marque

**Où** : `presentation.md` / `CONTINUUM.md`, §20 *Filiation*, ligne du lignage `Encre`.

**Principe qui déclenche la révision** : l'écriture obéit au logo, jamais l'inverse.
Le fil est l'objet premier, fondé en doctrine ; la police était un choix par défaut.

---

## Avant

> - Lignage esthétique **`Encre`** (noir / rouge / **serif**) : le rouge réservé à
>   l'intouchable (sanctuaire humain, point de nouage du logo).

## Après

> - Lignage esthétique **`Encre`** (noir / rouge / **linéale monolinéaire**) : le rouge
>   réservé à l'intouchable (sanctuaire humain, point de nouage du logo).
>   **La lettre obéit au fil** — épaisseur constante, sans empattement, terminaisons
>   rondes, humaniste. Le serif (choix par défaut, abandonné) modulait pleins et déliés
>   et contredisait le monolinéaire du nœud. Fin visée : une **police-fil**, glyphes
>   écrits du même trait que la marque.

---

## Les cinq contraintes que le fil impose à la lettre

1. **Épaisseur constante** → monolinéaire, pas de pleins/déliés (≠ Palatino).
2. **Pas d'empattement** → un fil n'a pas de pieds (≠ serif tout court).
3. **Terminaisons rondes** → bouts ronds, jamais coupés.
4. **Organique, asymétrique** → humaniste, pas géométrique-froid.
5. **La taille est le module** → hauteur de capitale déduite du nœud, pas un px arbitraire.

Le Palatino violait quatre de ces cinq contraintes.

## État d'implémentation

- Mockup : linéale monolinéaire câblée (`--wordface`), proxy système
  (Nunito / Quicksand / Avenir…) en attendant la police définitive.
- Preuve de la fin visée : `police_fil_NTINUUM.svg` — NTINUUM tracé au fil du nœud.
- À sourcer : ronde-monolinéaire humaniste libre, ou dessin sur mesure des glyphes.
