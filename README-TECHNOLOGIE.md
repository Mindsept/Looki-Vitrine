# La technologie LOOKi

Page intégrée au site Astro + React à **`/technologie/`**, accessible depuis le menu principal, le pied de page et le bouton « Explorer la technologie » de l’accueil.

## Utilisation

Depuis le dossier `Vitrine` :

```sh
npm ci
npm run dev
```

La route locale par défaut est `http://localhost:4321/technologie/`.

```sh
npm run check
node qa/verify-timing.mjs
npm run build
```

Le build produit le site complet dans `dist/`. Les médias préparés sont inclus : aucun outil vidéo ni modèle d’interpolation n’est nécessaire pour compiler ou héberger le site.

## Expérience

- Scène épinglée : 590 svh sur ordinateur, 690 svh sur mobile.
- Cinq chapitres, avec une seule annotation HTML visible à la fois.
- La progression suit le scroll. Après 180 ms sans défilement, une stabilisation de 360 à 680 ms rejoint le cadrage suivant dans le sens du geste : avancer en descendant, reculer en remontant.
- Les arrêts correspondent aux images sources 0, 31, 60, 83 et 106. Un nouveau geste interrompt la stabilisation ; un arrêt exact reste stable. La sortie de la scène reste libre.
- Le téléphone dispose d’un temps de lecture plus long, particulièrement sur mobile. La correspondance entre scroll et temps vidéo est réglable dans `src/lib/technology.ts`.
- Le film conserve son cadrage ; les textes disposent d’une zone distincte sur mobile.
- La conclusion « Une technologie. Un projet humain. » reprend le visuel existant d’accompagnement, converti en WebP responsive et chargé paresseusement, avec un voile bleu nuit.

## Médias et chargement

`public/assets/technology/looki-technology.mp4` est la vidéo originale (2560 × 1440, 24 images/s, 107 images). Le MP4 n’est pas téléchargé pendant la visite.

La séquence utilisée comprend 425 images WebP préparées localement avec RIFE 4.26 : 1440 px sur ordinateur, 900 px sur mobile. Les images originales sont conservées à chaque quatrième position. Les images intermédiaires sont des estimations visuelles et ne documentent aucune caractéristique matérielle supplémentaire.

Le chargement progressif utilise quatre téléchargements simultanés et une fenêtre de 24 images détaillées sur ordinateur / 20 sur mobile. Une version compacte pré-décodée permet de traverser rapidement la séquence pendant le décodage détaillé. Les textes suivent l’image réellement affichée. Le poster est disponible dès le HTML initial.

Les variantes représentent environ 16 Mo sur ordinateur et 9 Mo sur mobile. Les bitmaps peuvent occuper environ 320 Mo / 135 Mo lorsque la séquence est entièrement préparée. Ils sont libérés au démontage et lors du passage en mode statique.

Les images sources sous `frames/` et les scripts permettent de régénérer les assets. Ce traitement est facultatif :

```sh
# FFmpeg et Sharp
node scripts/prepare-technology.mjs

# rife-metal v0.1.6 et modèle RIFE 4.26 installés localement
RIFE_BIN=/chemin/vers/rife-metal RIFE_MODEL=/chemin/vers/rife-v4.26.rmw node scripts/prepare-motion.mjs
```

Outil de préparation : [rife-metal](https://github.com/cinemore/rife-metal). Les exécutables, modèles, caches et images temporaires ne sont pas inclus dans Git.

## Accessibilité

Les textes sont rendus dans le HTML. Les boutons des chapitres et le lien permettant de passer la visite sont accessibles au clavier. `prefers-reduced-motion`, le mode sans JavaScript, le bouton « Version sans animation » et une panne persistante de chargement donnent accès aux cinq étapes en présentation statique. Aucun chargement de séquence n’est lancé lorsque la préférence de mouvement réduit est active.

## Fichiers principaux

- `src/pages/technologie.astro` : intégration au layout et optimisation de l’image de conclusion.
- `src/components/react/TechnologyExperience.tsx` : scène, navigation et stabilisation.
- `src/components/react/TechnologyExperience.css` : composition responsive.
- `src/lib/technology.ts` : textes, chapitres et correspondance temporelle.
- `src/lib/motion-sequence.ts` : chargement progressif et décodage.
- `qa/verify-timing.mjs` : monotonie des courbes, positions réversibles, lisibilité des arrêts et respect du sens du geste.

La version d’origine a été vérifiée visuellement dans Chrome sur ordinateur et plusieurs tailles de viewport mobile ; cela ne remplace pas un essai sur téléphone physique. L’intégration dans `Vitrine` conserve les mêmes composants et assets.
