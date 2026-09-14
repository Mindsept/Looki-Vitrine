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
   * Formulaire de contact. Le site étant statique, il n'a pas de serveur qui
   * puisse envoyer un e-mail : deux modes sont prévus.
   *
   *  - `endpoint` vide (cas actuel) : le formulaire prépare le message dans la
   *    messagerie du visiteur, déjà adressé à `email`, objet et corps remplis.
   *    Le visiteur l'envoie depuis sa messagerie ; rien n'est simulé.
   *  - `endpoint` renseigné : le message est envoyé en arrière-plan à ce service,
   *    qui le transmet à `email` sans que le visiteur quitte la page
   *    (Formspree, Web3Forms, Netlify Forms, fonction serverless…). Voir README.md.
   */
  contact: {
    /** Boîte de réception de l'équipe : toutes les demandes y arrivent. */
    email: 'mind7.sigl@outlook.fr',
    endpoint: '',
    /** Objet pré-rempli des messages. */
    subject: 'Contact via le site LOOKi',
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
