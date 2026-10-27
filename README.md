# three-site

Un petit terrain de jeu Three.js pour mettre des images en scène sur des surfaces 3D arrondies.

## Démarrer

```bash
npm install
npm run dev
```

## Configurer les surfaces

Tout se règle dans `src/config/surfaces.ts`.

```ts
export const surfaces: Surface[][] = [
  [
    { width: 340, height: 230, src: "/images/projet-a.jpg" },
    { width: 280, height: 230, src: "/images/projet-b.jpg" },
  ],
  [
    { width: 280, height: 190, src: "/images/projet-c.jpg" },
    { width: 340, height: 190, src: "/images/projet-d.jpg" },
  ],
];
```

- Chaque tableau imbriqué représente une rangée.
- Chaque objet représente une surface.
- `width` et `height` sont exprimés en pixels de référence. `pixelsPerUnit` convertit ces dimensions en unités Three.js.
- `src` accepte un chemin local dans `public/` (par exemple `/images/projet-a.jpg`) ou une URL.
- `radius` permet de régler individuellement l'arrondi ; sinon `cornerRadius` s'applique à toutes les surfaces.
- `columnGap` et `rowGap` règlent les espaces entre surfaces.

## Caméra

Dans le même fichier, `sceneConfig.camera.position` définit la position initiale de la caméra, `target` son point de visée et `fov` son champ de vision.

- Glisser avec le bouton gauche pour orbiter autour des surfaces.
- Maintenir `Espace` et glisser pour déplacer la caméra latéralement, comme dans Figma.
- Maintenir `Maj` et glisser pour incliner la caméra autour de l'axe de vue.
- Utiliser la molette pour zoomer.

## Ignorés par Git

Le `.gitignore` exclut les dépendances, les builds, les caches, les fichiers d'environnement locaux, les logs et les fichiers propres aux éditeurs/OS. Les images ajoutées à `public/` restent versionnables.
