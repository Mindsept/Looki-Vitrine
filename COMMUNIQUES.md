# Ajouter un communiqué de presse

Les communiqués vivent dans `src/content/communiques/`. Un fichier Markdown = un communiqué.
Le site les liste automatiquement sur `/communiques-de-presse/` (du plus récent au plus ancien)
et crée une page permanente `/communiques-de-presse/<nom-du-fichier>/`.

## Procédure

1. Dupliquer le modèle `src/content/communiques/_modele.md`.
2. Le renommer **sans** underscore initial, en minuscules et sans accents, par exemple
   `2026-10-01-premier-pilote.md`. Ce nom devient l'adresse permanente :
   `/communiques-de-presse/2026-10-01-premier-pilote/`.
3. Renseigner l'en-tête (frontmatter) :

   | Champ      | Obligatoire | Rôle |
   |------------|-------------|------|
   | `title`    | oui | Titre du communiqué |
   | `date`     | oui | Date de publication, format `AAAA-MM-JJ` |
   | `summary`  | oui | Résumé (liste, description de page, partage) |
   | `location` | non | Lieu affiché avant la date (ex. `Paris`) |
   | `image`    | non | Chemin relatif vers une image, ex. `./images/visuel.jpg` |
   | `imageAlt` | si image | Description de l'image pour les lecteurs d'écran |
   | `pdf`      | non | Chemin public du PDF, ex. `/communiques/2026-10-01-premier-pilote.pdf` |
   | `draft`    | non | `true` pour masquer le communiqué sans le supprimer |

4. Écrire le contenu en Markdown sous l'en-tête (titres `##`, listes, citations `>`, liens).
5. Image : la déposer dans `src/content/communiques/images/` (elle sera optimisée automatiquement).
6. PDF : le déposer dans `public/communiques/` et renseigner `pdf` avec le chemin `/communiques/....pdf`.
7. Lancer `npm run build` (ou `npm run dev` pour vérifier). Aucune autre étape : pas de base de données ni de CMS.

## Règles

- Les fichiers commençant par `_` ne sont jamais publiés (modèle, brouillons).
- Un communiqué avec `draft: true` est absent de la liste et n'a pas de page.
- La liste reste correcte avec zéro, un ou plusieurs communiqués ; au-delà d'une année, les entrées sont regroupées par année.
- Ne renommez pas un fichier déjà publié : son nom est son lien permanent.

## Exemple minimal

```md
---
title: "LOOKi lance son premier pilote avec un centre de rééducation"
date: 2026-10-01
summary: "Un premier groupe d'utilisateurs testera les lunettes connectées pendant trois mois."
location: "Paris"
pdf: /communiques/2026-10-01-premier-pilote.pdf
---

Paragraphe d'ouverture…
```
