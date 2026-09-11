import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Communiqués de presse.
 * Un fichier Markdown = un communiqué, dans `src/content/communiques/`.
 * Les fichiers dont le nom commence par `_` sont ignorés (brouillons, modèle).
 * Voir COMMUNIQUES.md à la racine pour la procédure complète.
 */
const communiques = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/communiques' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      date: z.coerce.date(),
      summary: z.string().min(1),
      /** Image d'illustration facultative (chemin relatif au fichier .md). */
      image: image().optional(),
      imageAlt: z.string().optional(),
      /** PDF facultatif, déposé dans `public/communiques/` et référencé par `/communiques/nom.pdf`. */
      pdf: z.string().optional(),
      /** Lieu affiché en tête du communiqué, ex. "Paris". */
      location: z.string().optional(),
      /** `true` pour retirer un communiqué de la liste publique sans le supprimer. */
      draft: z.boolean().default(false),
    }),
});

export const collections = { communiques };
