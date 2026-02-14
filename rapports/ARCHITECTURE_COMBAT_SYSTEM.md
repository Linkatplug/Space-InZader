🧠 Space InZader – Combat & Stat Architecture (Official)
🎯 Objectif

Définir clairement les responsabilités de chaque système afin d'éviter :

Logique dupliquée

Mutations directes de stats

Systèmes contradictoires

Régressions futures

Cette architecture est la référence officielle.

🛡 1️⃣ DefenseSystem (Autorité Unique)
Responsabilités

Calcul critique

Application des résistances

Application pénétration

Application dégâts couche par couche

Déclenchement des événements

Gestion de la mort

Ne doit PAS :

Calculer les stats finales

Modifier les stats

Connaître les modules

Connaître les upgrades

Connaître le joueur ou les ennemis

Pipeline Officiel des Dégâts
DamagePacket
→ Crit
→ Résistance (couche active)
→ Pénétration
→ Absorption
→ Couche suivante
→ entityDestroyed event

📊 2️⃣ FinalStatsCalculator
Responsabilités

Agréger :

BaseStats

BaseResistances

Modifiers (modules, effets, upgrades, synergies)

Appliquer :

Additifs

Puis multiplicatifs

Retourner runtimeStats immutable

Dirty Flag System

Chaque entité possède :

statsDirty: boolean


Recalcul uniquement si :

Modifier ajouté

Modifier retiré

Effet appliqué

Effet expiré

Tempête commence/finit

🔥 3️⃣ EffectSystem
Responsabilités

Appliquer effets

Gérer durée

Gérer stacks

Injecter modifiers temporaires

Générer DamagePacket si DOT

Les résistances influencent :

Dégâts

Intensité effet

Durée effet

🌪 4️⃣ EnvironmentalSystem
Responsabilités

Gérer événements globaux

Appliquer effets globaux

Affecter joueur ET ennemis

Déclencher recalcul via dirty flag

🔫 5️⃣ Weapon System
WeaponData (Unique source)

Les armes :

Produisent uniquement DamagePacket

Ne modifient jamais stats

Ne contiennent aucune logique défensive

🎮 6️⃣ Game.js
Rôle

Orchestration

Initialisation

Gestion boucle principale

Interdictions

Ne modifie jamais stats

N’applique jamais dégâts

Ne calcule jamais résistances

Ne gère jamais mort

🧱 7️⃣ Structure Runtime Officielle
entity = {
  baseStats,
  baseResistances,
  modifiers,
  runtimeStats,
  statsDirty,
  defense
}

🎨 8️⃣ Damage Type Color Standard
Type	Couleur
EM	BLEU
Thermal	ROUGE
Kinetic	VERT
Explosive	JAUNE

Standard officiel UI.

🏛 9️⃣ Autorités Officielles
Domaine	Autorité
Résistances	FinalStatsCalculator
Application dégâts	DefenseSystem
Calcul crit	DefenseSystem
Application effets	EffectSystem
Tick effets	EffectSystem
Mort	DefenseSystem
Tempêtes globales	EnvironmentalSystem
🚫 Règle d’Or

Aucun système ne doit empiéter sur la responsabilité d’un autre.

Si un système viole ces règles → c’est un bug architectural.

🔒 Ce document est la référence officielle.

Toute nouvelle feature doit respecter cette architecture.
