# three-site

Un petit terrain de jeu Three.js pour mettre des images en scène sur des surfaces 3D arrondies.

## Démarrer

```bash
npm install
npm run dev
```

## Surfaces

Les surfaces se créent et se configurent directement dans l’interface, en mode **Édition**. Leur position, leurs dimensions et leurs images sont sauvegardées dans le navigateur.

## Caméra

Dans le même fichier, `sceneConfig.camera.position` définit la position initiale de la caméra, `target` son point de visée et `fov` son champ de vision.

- Glisser avec le bouton gauche pour orbiter autour des surfaces.
- Maintenir `Espace` et glisser pour déplacer la caméra latéralement, comme dans Figma.
- Maintenir `Maj` et glisser pour incliner la caméra autour de l'axe de vue.
- Utiliser la molette pour zoomer.

## Ignorés par Git

Le `.gitignore` exclut les dépendances, les builds, les caches, les fichiers d'environnement locaux, les logs et les fichiers propres aux éditeurs/OS. Les images ajoutées à `public/` restent versionnables.
