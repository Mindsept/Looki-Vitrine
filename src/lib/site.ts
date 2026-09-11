/**
 * Configuration éditoriale du site. Tout ce qui est susceptible de changer
 * (nom, navigation, coordonnées, formulaire) est centralisé ici.
 */
export const site = {
  name: 'LOOKi',
  tagline: 'Lunettes connectées et assistance vocale pour les personnes malvoyantes',
  description:
    'LOOKi est un projet de lunettes connectées pensées pour accompagner les personnes malvoyantes dans leurs déplacements, avec une assistance vocale en mobilité et un suivi par les professionnels de la basse vision.',
  locale: 'fr_FR',
  /** Porteur du projet, tel que documenté dans les supports de cadrage. */
  team: 'Équipe Mind7 · EPITA, SIGL 2027',
  /**
   * Formulaire de contact.
   * Aucune adresse e-mail ni service d'envoi n'a été fourni : tant que `endpoint`
   * est vide, le formulaire affiche un message explicite et n'envoie rien.
   * Pour l'activer : renseigner l'URL d'un service qui accepte un POST
   * (ex. Formspree, Netlify Forms, une fonction serverless maison) — voir README.md.
   */
  contact: {
    endpoint: '',
    /** Adresse affichée publiquement (facultatif). Laisser vide si non validée. */
    email: '',
  },
} as const;

export type NavItem = { label: string; href: string; id?: string };

/** Navigation principale. Les ancres pointent vers l'accueil. */
export const nav: NavItem[] = [
  { label: 'La solution', href: '/#solution', id: 'solution' },
  { label: 'Au quotidien', href: '/#quotidien', id: 'quotidien' },
  { label: 'Pour les professionnels', href: '/#professionnels', id: 'professionnels' },
  { label: 'Communiqués de presse', href: '/communiques-de-presse/' },
  { label: 'Contact', href: '/#contact', id: 'contact' },
];
