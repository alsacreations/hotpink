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

Chaque couleur nommée dispose de sa propre URL, directement à la racine : `/red/`, `/hotpink/`, `/rebeccapurple/`… Ces 148 pages sont générées au build (contenu pré-rendu, `title` et meta description propres, balises Open Graph, données structurées JSON-LD, URL canonique) afin d'être indexables par les moteurs de recherche. Un `sitemap.xml` et un `robots.txt` sont également produits.

```bash
npm run dev       # serveur de développement (Vite, sans build)
npm run build     # génère le site complet dans dist/
npm run preview   # sert dist/ pour vérifier le résultat
```

- Le script de génération est [scripts/build.mjs](scripts/build.mjs) : il utilise `index.html` comme gabarit et ne nécessite aucune dépendance (Node.js uniquement).
- Le rendu HTML de la fiche couleur et des couleurs proches est partagé entre le navigateur et le build dans [assets/js/modules/render.js](assets/js/modules/render.js) (module sans accès au DOM).
- Au chargement, `app.js` lit la couleur dans l'URL (`/red/`) et la sélection d'une couleur met à jour l'URL via l'API History. Les anciens liens `#red` sont redirigés vers `/red/`.
- **Déploiement** : le workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) lance `npm run build` à chaque push sur `main` et publie `dist/` sur GitHub Pages (`hotpink.alsacreations.com`). Le dossier `dist/` n'est pas versionné. Dans les réglages du dépôt, *Pages → Source* doit être sur **GitHub Actions**.
- En développement (`npm run dev`), les URLs `/red/` fonctionnent grâce au fallback SPA de Vite ; seul `npm run build` produit les vraies pages statiques.
- Le domaine du site est défini par `SITE_URL` dans `scripts/build.mjs` (à garder cohérent avec `CNAME`).

## 🔗 Liens utiles

- [Voir toutes les couleurs CSS triées](https://enes.in/sorted-colors/)
- [En savoir plus sur les couleurs CSS](https://developer.mozilla.org/fr/docs/Web/CSS/color_value)

---

Créé avec ❤️ par Alsacréations
