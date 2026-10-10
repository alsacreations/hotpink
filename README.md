# Hotpink 🎨

Chaque couleur nommée du Web a une particularité ou une histoire à raconter.

**Hotpink** vous permet de voyager au pays des couleurs web nommées, découvrir des teintes originales et leur histoire, et organiser et créer des palettes stylées.

## 🌟 Les couleurs nommées ?

Historiquement au nombre de 16 couleurs en CSS1, la liste a été enrichie au fil des années pour atteindre aujourd'hui 148 couleurs nommées officielles (comme "hotpink", "peachpuff", "rebeccapurple"…) et reconnues par les navigateurs web. **Hotpink** vous permet de les trouver, de découvrir leurs particularités et de trouver des couleurs similaires en quelques clics.

## 🔍 Recherche intelligente

- **Recherche par nom** : Tapez le nom d'une couleur et l'autocomplétion vous suggère les couleurs correspondantes
- **Recherche par teinte** : Utilisez le curseur de teinte pour filtrer les couleurs selon leur tonalité (rouge, bleu, vert, etc.)
- **Filtres originaux** : Découvrez des sélections spéciales comme les couleurs comestibles, les noms les plus courts/longs, les plantes ou les minéraux
- **Recherche par image** : Chargez une image et découvrez la couleur dominante qui la compose ainsi que les couleurs nommées proches

## 🎯 Exploration des couleurs

- **Couleurs similaires** : Quand vous sélectionnez une couleur, découvrez automatiquement les couleurs proches par teinte, luminosité ou saturation
- **Informations détaillées** : Pour chaque couleur, visualisez :
  - Son nom
  - Son histoire, sa particularité ou son origine
  - Son code hexadécimal (ex: `#FF69B4`) ou OKLCH (format moderne)
  - Son taux de contraste combiné avec un texte noir ou blanc
  - Un aperçu visuel avec un contraste de texte optimal

## ⭐ Favoris

- Enregistrez vos couleurs préférées pour y accéder rapidement
- Vos favoris sont sauvegardés localement dans votre navigateur

## 🎨 Palettes

- Explorez des palettes d'inspiration pour vos maquettes graphiques

## 💡 Astuces

- Les couleurs sont affichées avec un texte dont le contraste est toujours optimal pour une meilleure lisibilité
- Vous pouvez copier facilement les codes couleur affichés pour les utiliser dans vos projets
- L'outil fonctionne entièrement dans votre navigateur, aucune connexion internet n'est nécessaire après le premier chargement

## 🛠️ Développement et pages statiques

Chaque couleur nommée dispose de sa propre URL, directement à la racine : `/red/`, `/hotpink/`, `/rebeccapurple/`… Les filtres originaux ont aussi leur page : `/couleurs-pastel/`, `/couleurs-vintage/`, `/niveaux-de-gris/`, `/plantes-et-fleurs/`… (hors couleurs système, dont le rendu dépend du navigateur).

Ces pages sont générées au build afin d'être indexables par les moteurs de recherche :
- contenu pré-rendu (fiche, couleurs proches ou liste du filtre, en vrais liens `<a>`), `title`, meta description et URL canonique propres à chaque page ;
- un seul `<h1>` par page : « Hotpink » sur l'accueil, le nom de la couleur sur `/red/`, le titre du filtre sur `/couleurs-pastel/` ;
- balises Open Graph / Twitter Card et image de partage 1200×630 dédiée (`/og/red.png`…), données structurées JSON-LD ;
- `sitemap.xml` et `robots.txt`.

```bash
npm install       # une seule fois (génération des images Open Graph)
npm run dev       # serveur de développement (Vite, sans build)
npm run build     # génère le site complet dans dist/
npm run preview   # sert dist/ pour vérifier le résultat
```

- Le script de génération est [scripts/build.mjs](scripts/build.mjs) : il utilise `index.html` comme gabarit. Les images Open Graph sont produites par [scripts/og-image.mjs](scripts/og-image.mjs) (SVG rasterisé avec `@resvg/resvg-js`, polices Chicle et Lexend embarquées dans `scripts/fonts/`).
- Le rendu HTML de la fiche couleur, des cartes et les helpers de pages sont partagés entre le navigateur et le build dans [assets/js/modules/render.js](assets/js/modules/render.js) (module sans accès au DOM). Les textes et URLs des filtres sont dans [assets/js/modules/filters.js](assets/js/modules/filters.js).
- Au chargement, `app.js` lit la page dans l'URL (couleur ou filtre) ; sélectionner une couleur ou un filtre met à jour l'URL via l'API History, et le `<h1>` est réattribué en conséquence. Les anciens liens `#red` sont redirigés vers `/red/`.
- **Déploiement** : le workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) lance `npm ci` puis `npm run build` à chaque push sur `main` et publie `dist/` sur GitHub Pages (`hotpink.alsacreations.com`). Le dossier `dist/` n'est pas versionné. Dans les réglages du dépôt, *Pages → Source* doit être sur **GitHub Actions**.
- En développement (`npm run dev`), les URLs `/red/` fonctionnent grâce au fallback SPA de Vite ; seul `npm run build` produit les vraies pages statiques.
- Le domaine du site est défini par `SITE_URL` dans `scripts/build.mjs` (à garder cohérent avec `CNAME` et les URLs absolues d'`index.html`).

## 🔗 Liens utiles

- [Voir toutes les couleurs CSS triées](https://enes.in/sorted-colors/)
- [En savoir plus sur les couleurs CSS](https://developer.mozilla.org/fr/docs/Web/CSS/color_value)

---

Créé avec ❤️ par Alsacréations
