# Mythic Brawl V2 — design des niveaux

Base : les 7 niveaux de la V1 (mêmes vagues, boss et scènes), transposés en 3D toon, vue isométrique, contours noirs.
Héros jouables : Thunderstruck (foudre, cyan), Hawkees (feu, orange), Phantom (sabres, violet).

## Règles communes

- **Caméra** : isométrique orthographique, qui suit le joueur dans un couloir d'environ 6 m de profondeur.
  - Pendant une vague, l'arène se verrouille : barrières lumineuses, comme les murs invisibles de la V1.
  - Exceptions : les Enfers (vue de côté) et le vol vers l'Olympe (rail).
- **Structure d'un niveau** : 3 sections + 1 séquence spéciale + 1 boss, soit 5 à 8 minutes.
  - Une section = un décor distinct et 1 à 2 vagues.
- **Un gadget par niveau**, qui ne revient pas ailleurs (auto-scroll, otages, plateformes…). Il sert à varier le jeu.
- **Décor interactif** dans chaque niveau : des objets cassables (bonus, armes à lancer) et un danger d'environnement.
  - Le danger réagit si possible aux pouvoirs : la foudre électrise l'eau, le feu enflamme l'huile, les sabres tranchent les câbles.
- **Couleurs** : chaque niveau a une palette qui ne se confond pas avec le cyan, l'orange et le violet des héros.
- **Lisibilité** :
  - zone de jeu au sol un peu plus claire que les bords ;
  - les ennemis ont un contour coloré à leur faction.
- **Fin de niveau** : scène de dialogue (ceux de la V1, 1 réplique par héros), puis l'écran de transition.

## 1. Rue de nuit — Steel City

**Rôle** : niveau tutoriel. Il apprend le combo, la garde, la saisie et le lancer d'objets.

**Ambiance** :
- nuit, asphalte mouillé qui reflète des néons magenta et jaune ;
- réverbères, rideaux de fer, escaliers de secours, vapeur des bouches d'égout.
- Palette : bleu nuit, magenta, jaune sodium.

**Déroulé** :

| Section | Décor | Contenu |
|---|---|---|
| 1. Avenue | Voitures garées, vitrines | 2 voyous. On apprend combo et garde |
| 2. Ruelle | Couloir étroit, poubelles, échelles | Ennemis des deux côtés. Les poubelles se cassent et donnent des bonus |
| 3. Chantier | Grue, palettes, bidons | Brute + punks. Les bidons se lancent |
| Boss | Parvis de l'entrepôt Hazard Industries | **The Beast** |

**Gadget** : décor cassable et lançable (poubelles, bidons, panneaux).

**Danger** : les flaques d'eau, électrifiables par Thunderstruck ou par un câble arraché.

**Fait (prototype `v2/rue.html`)** : 4 zones (avenue, ruelle, chantier, cour de l’entrepôt), voyous, punks et brute (mannequin peint), poubelles qui soignent, bidons à lancer, flaques que la foudre électrise, vapeur des égouts, The Beast en 2 phases (charges, onde de choc, barricade de conteneurs défoncée). Cinématiques d’intro (météorites) et de fin (The Beast s’enfuit, Deadeye rate son tir et saute sur un métro, le héros le suit vers le niveau 2). Reste : câble arraché.

**Boss, The Beast** :
- Phase 1 : il charge en ligne droite, et rate sa charge s'il percute un mur.
- Phase 2 (Beast 2), enragé : il défonce le mur de l'entrepôt, l'arène s'agrandit, et ses charges rebondissent.

## 2. Toit du métro

**Rôle** : niveau d'action rapide, l'écran défile tout seul.

**Ambiance** :
- toit d'un métro aérien lancé de nuit ;
- la ville défile en fond, en flou de vitesse ;
- tunnels, portiques de signalisation, étincelles du pantographe.
- Palette : bleu acier, blanc des phares, rouge des feux.

**Déroulé** :
- 4 wagons, une vague par wagon.
- Entre deux wagons :
  - un **saut** obligatoire au-dessus de l'attelage ;
  - un **obstacle** annoncé 2 s à l'avance : pont bas (s'accroupir) ou portique (sauter).
- Les ennemis arrivent de l'arrière du train ou descendent d'un pont.

**Gadget** : défilement automatique (le `auto` de la V1) et obstacles chronométrés.

**Danger** : la caténaire électrique au-dessus. Projeter un ennemi dessus l'assomme, et Thunderstruck y recharge sa jauge.

**Boss, Deadeye**, sur le dernier wagon :
- Il tire de loin, avec une **ligne de visée** visible avant chaque tir.
- Il recule de wagon en wagon : il faut le rattraper entre deux obstacles.
- Phase 2 (Deadeye 2) : rafales en éventail.

**Fait (`v2/metro.html`)** : alternance arène / course. 10 wagons, combats sur les wagons 1, 4, 7 et 10 ; entre eux, course automatique : sauter les attelages, s’accroupir (H) sous les ponts bas, sauter les portiques, annoncés à l’écran. La ville, les poteaux et la voie défilent. Caténaire côté fond : recharge plus rapide, ennemis projetés dessous électrocutés. Deadeye : garde ses distances, tir visé (le laser se fige juste avant le tir), rafale de 3, coup de pied ; phase 2 : éventail de 5 et 2 punks en renfort. Fin : il indique SkyCell. Pas encore : Deadeye qui recule de wagon en wagon, ennemis qui descendent d’un pont, tunnels.

## 3. SkyCell (prototype existant)

**Rôle** : premier niveau de l'histoire de fond. C'est la prison volante de Hazard Industries.

**Ambiance** :
- au-dessus des nuages, passerelles en acier, verre blindé ;
- cellules à champ de force, alarme rouge tournante.
- Palette : gris acier, blanc nuage, rouge d'alarme. C'est la base du prototype actuel.

**Déroulé** :

| Section | Décor | Contenu |
|---|---|---|
| 1. Hangar | Aire d'atterrissage, caisses, vent | Robots + tireurs |
| 2. Bloc des cellules | Couloir de cellules à champ de force | Couper l'alarme libère des **détenus** qui se battent contre les gardes |
| 3. Cœur du réacteur | Puits central, étincelles divines en cuves | Vague mixte, piliers de protection |
| Boss | Salle de confinement | **Indigo** |

**Gadget** : les **portes laser**. Elles s'allument et s'éteignent en cycle, et un interrupteur les coupe.
- Projeter un robot dans un laser l'élimine.

**Danger** :
- le vent du hangar pousse vers le bord ;
- une vitre brisée aspire les ennemis légers.

**Boss, Indigo** : créature de brume qui absorbe les étincelles divines.
- Il **imite les pouvoirs des 3 héros**, au hasard : éclair, boule de feu, ruée aux sabres.
- Ses attaques ont la couleur du héros imité, pour les annoncer.
- À la fin, il est enfermé dans une prison en métal olympien. On ne le tue pas.
- Puis vient la scène du portail d'Arès.

**Fait (prototype)** : gardes et tireurs (mannequin repeint), vent, lasers mortels, détenus, vitre qui aspire, Indigo en 2 phases. Reste : cycle on/off des lasers et interrupteur, objets cassables, scène du portail d’Arès.

## 4. Temple en ruines

**Rôle** : arrivée dans le monde grec, et la défaite face à Zeus.

**Ambiance** :
- ruines antiques au coucher du soleil, colonnes brisées ;
- braseros, lierre, statues décapitées.
- Palette : ocre, marbre rosé, ciel orange et violet.

**Déroulé** :
- 3 sections : parvis, nef, autel.
- Chaque vague a **un otage enchaîné** (le `inno` de la V1).
  - Le libérer rapporte un bonus.
  - S'il est frappé, on perd des points.
- Les ennemis sont des squelettes, des satyres et un golem.

**Gadget** : **protéger et libérer les otages**. Il faut briser leurs chaînes avec une attaque chargée.

**Danger** : des colonnes fragiles, qu'on fait tomber sur les ennemis. Elles écrasent aussi le joueur s'il est mal placé.

**Boss, Arès** :
- Phase 1 : lame, combos et charge.
- Phase 2 (Flamme de guerre) : chaque coup laisse **du sol en feu**.

**Séquence spéciale** : Zeus tend une embuscade (le `zeusA` de la V1).
- C'est un combat qu'on ne peut pas gagner, qui finit dans la tempête.
- Il fait passer aux Enfers.

## 5. Les Enfers

**Rôle** : changement de rythme, niveau de plateformes et d'exploration, et le sauvetage d'un héros.

**Caméra** : passe **de côté**, en 2,5D, pour lire correctement les sauts. C'est la seule exception à la vue isométrique.

**Ambiance** :
- cavernes, Styx luminescent vert, lave en contrebas ;
- chaînes suspendues, âmes errantes.
- Palette : noir bleuté, vert spectral, rouge lave.

**Déroulé** :
- descente en plateformes, avec fantômes, démons et chauves-souris ;
- **traversée du Styx** sur la barque de Charon : défilement automatique, avec des mains qui surgissent de l'eau ;
- cellule du **héros prisonnier** : le héros non choisi est libéré ;
- boss.

**Gadget** : plateformes et chaînes. Le vol de Hawkees et la super vitesse de Phantom ouvrent des raccourcis.

**Danger** :
- lave : chute = dégâts et retour à la dernière plateforme ;
- eau du Styx, qui ralentit.

**Boss, Cerbère** :
- Trois têtes, chacune avec son souffle : feu, glace, ombre.
- Il charge à travers l'arène, puis bondit en provoquant une onde de choc.
- Chaque tête tombe séparément.

## 6. Vers l'Olympe

**Rôle** : niveau de shoot 'em up court (2 à 3 min) à dos de Pégase, en respiration avant la fin.

**Caméra** : **rail**, Pégase vu de 3/4 arrière. On bouge dans le plan et on tire droit devant.

**Ambiance** :
- mer de nuages, colonnes flottantes, orage qui monte.
- Palette : blanc, or, gris d'orage.

**Déroulé** :
- harpies en formation ;
- champ de débris flottants ;
- **éclairs de Zeus** qui frappent des zones signalées au sol des nuages ;
- arrivée aux portes d'or.

**Gadget** : le tir de chaque héros remplace son combo : éclair, boule de feu, lames volantes.

**Fin** : Pégase se pose et les portes d'or s'ouvrent sur le trône de Zeus.

## 7. L'Olympe

**Rôle** : niveau final.

**Ambiance** :
- cité de marbre blanc et d'or dans le ciel ;
- **puits de puissance** : des générateurs d'étincelles divines, en colonnes de lumière.
- Zeus détruit la ville pendant le niveau : débris qui tombent, ciel qui s'assombrit section après section.
- Palette : marbre, or, puis gris d'orage et éclairs.

**Déroulé** :

| Section | Décor | Contenu |
|---|---|---|
| 1. Agora | Colonnades, fontaines | Hoplites + archers |
| 2. Rue des temples | Chutes de débris annoncées par une ombre au sol | Sentinelles (automates de bronze) |
| 3. Puits de puissance | 3 puits à détruire | Vagues qui défendent les puits |
| Boss | Salle du trône, puis le toit dans la tempête | **Zeus** |

**Gadget** : **les puits de puissance**.
- Chaque puits encore actif donne une armure à Zeus.
- Les détruire avant le boss l'affaiblit.

**Danger** : chutes de débris, et éclairs de Zeus sur le toit.

**Boss, Zeus** :
- Phase 1, sur le trône : charge et éclairs.
- Phase 2 (Roi de l'Olympe), sur le toit : bouclier, vol, tempête.
- **Duel final** : si le joueur est Thunderstruck, une scène de duel foudre contre foudre, fidèle au scénario du jeu de rôle. Avec un autre héros, Thunderstruck vient en renfort pour le coup final.

## Ce qu'il faut produire

**Modèles 3D d'ennemis**, aucun n'est encore fait en V2 :
- voyous, punks, brute ;
- robots, tireurs ;
- squelettes, satyres, golem ;
- démons, fantômes ;
- hoplites, archers, sentinelles.

Piste : les personnages modulaires Quaternius recolorés (comme pour Hawkees) et leurs packs de monstres, à vérifier pack par pack.

**Modèles de boss** : The Beast, Deadeye, Indigo, Arès, Cerbère, Zeus. Ce sont les plus coûteux. Le mannequin peint et accessoirisé (cornes, armure, cape) pourrait couvrir Arès, Zeus et Deadeye.

**Kits de décor** : rue et ville (réutilisable pour le métro), sci-fi (SkyCell), ruines antiques (temple et Olympe), caverne (Enfers).

**Systèmes de jeu** :
- objets à lancer ;
- défilement automatique ;
- otages ;
- caméra de côté pour les plateformes ;
- mode rail ;
- dangers d'environnement.

## Ordre de production conseillé

1. **SkyCell** : le prototype existe déjà. On remplace les robots et on habille le décor, ce qui valide la chaîne de production des décors.
2. **Rue de nuit** : premier niveau joué. Son kit urbain sert aussi au métro.
3. **Toit du métro** : même kit, plus le défilement automatique.
4. **Temple en ruines** : son kit antique sert aussi à l'Olympe.
5. **L'Olympe** : niveau final.
6. **Les Enfers**, puis **Vers l'Olympe** : les deux changent de caméra, donc ils coûtent le plus cher.
