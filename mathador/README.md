# Mathador (clone web)

Recréation du jeu de calcul mental [Mathador](https://www.mathador.fr/) en HTML/CSS/JS pur, sans aucune dépendance.

## Lancer le jeu

Ouvrir `index.html` dans un navigateur (ou publier le dossier sur GitHub Pages / n'importe quel hébergement statique).

## Tests

```
npm test   # ou : node test.js
```

## Fichiers

- `index.html` — page du jeu
- `style.css` — mise en page
- `mathador.js` — moteur du jeu (tirage, solveur, évaluation, barème), aussi utilisable sous Node
- `app.js` — interface (clic sur les nombres/opérateurs, vérification, score)

## Règles implémentées

- Tirage : 4 petits nombres (1–9 ; 1 à 4 au plus 2 fois, 5 à 9 au plus 1 fois) + 1 grand nombre (10–99), et une cible entre 1 et 99.
- Chaque nombre du tirage utilisable au plus une fois, au moins une opération requise.
- Résultats intermédiaires : entiers strictement positifs ; divisions exactes uniquement.
- Barème : `+` = 1 pt, `×` = 1 pt, `−` = 2 pts, `÷` = 3 pts ; coup Mathador (5 nombres + les 4 opérations) = 13 pts.
- Chaque tirage généré est garanti solvable (et comporte un coup Mathador possible dans la grande majorité des cas, comme dans le jeu officiel Solo/Chrono).
