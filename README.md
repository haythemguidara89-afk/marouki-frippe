# 👗 Marouki Frippe — Deux Pages Séparées (Vitrine & Administration)

Le projet a été scindé en **deux pages web distinctes** avec deux liens indépendants pour garantir une séparation totale entre la vitrine publique pour vos clientes et l'espace de gestion réservé à la propriétaire :

---

## 🔗 Les Deux Liens & Pages Séparées

### 1. 🛍️ La Vitrine Publique pour les Clientes : `index.html`
- **Lien du fichier :** [`index.html`](file:///Users/macbook/Desktop/NEW%20APP/marouki%20frippe/index.html)
- **Objectif :** Destiné au public et à vos clientes sur Instagram/Facebook.
- **Sécurité & Discrétion :** **Aucun bouton "Espace Admin"** n'est affiché sur le site. Les clientes ne voient que les articles, le logo centré, les filtres et le bouton de commande WhatsApp.

### 2. 🔒 L'Espace Administrateur Privé pour la Propriétaire : `admin.html`
- **Lien du fichier :** [`admin.html`](file:///Users/macbook/Desktop/NEW%20APP/marouki%20frippe/admin.html)
- **Objectif :** Lien confidentiel à conserver par la propriétaire pour gérer la boutique.
- **Accès sécurisé par code PIN :**
  - **Code PIN par défaut :** `1234` (modifiable dans les Paramètres).
- **Fonctionnalités :**
  - Importer directement des photos depuis le téléphone ou le PC (jusqu'à 10 photos par article avec compression automatique).
  - Ajouter, modifier ou supprimer des articles.
  - Marquer une pièce unique comme **"Vendue"** en 1 clic (l'article disparaît instantanément de la vitrine).
  - Modifier le numéro WhatsApp pour recevoir les commandes.

---

## 🔄 Synchronisation en Temps Réel

Les deux pages partagent automatiquement la même base de données locale (`LocalStorage`) :
- Dès que vous ajoutez ou modifiez un produit sur `admin.html`, il apparaît instantanément sur `index.html` !
- Si vous marquez un article comme vendu sur `admin.html`, la vitrine cliente `index.html` se met à jour en direct.

---

## 🚀 Comment Lancer les Pages

Vous pouvez ouvrir directement chaque fichier dans votre navigateur, ou lancer un serveur local :
```bash
cd "/Users/macbook/Desktop/NEW APP/marouki frippe" && python3 -m http.server 8080
```
- **Lien public pour vos clientes :** `http://localhost:8080/index.html`
- **Lien privé pour la propriétaire :** `http://localhost:8080/admin.html`
