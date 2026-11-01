# 👗 Marouki Frippe — Maison de Frippe de Luxe en Tunisie

Plateforme e-commerce haute couture et gestionnaire d'inventaire en temps réel propulsés par **Supabase Cloud**, **WebAuthn Biometric Passkeys** et déployés sur **Vercel** sous le nom de domaine officiel **maroukifripe.tn**.

---

## 🌐 Liens de Production Officiels

| Espace | URL Principale (Nom de Domaine) | URL de Secours Vercel | Rôle & Sécurité |
| :--- | :--- | :--- | :--- |
| **🛍️ Vitrine Publique** | **[https://www.maroukifripe.tn](https://www.maroukifripe.tn)** | [https://marouki-frippe.vercel.app](https://marouki-frippe.vercel.app) | Boutique cliente optimisée mobile, filtres, panier, WhatsApp direct. Toute tentative d'accès à `/admin` renvoie une **404 Introuvable**. |
| **🔒 Espace Propriétaire** | **[https://admin.maroukifripe.tn](https://admin.maroukifripe.tn)** | [https://marouki-frippe-admin.vercel.app](https://marouki-frippe-admin.vercel.app) | Espace confidentiel protégé par **Passkeys Biométriques (Face ID / Touch ID)** ou PIN de secours. |
| **⚡ Base Supabase** | **[Dashboard Cloud](https://supabase.com/dashboard/project/muwhwsgiuklmdysjvkrg)** | — | Base PostgreSQL temps réel dédiée (`muwhwsgiuklmdysjvkrg`). |
| **🐙 Code Source** | **[Dépôt GitHub](https://github.com/haythemguidara89-afk/marouki-frippe)** | — | Repository Git synchronisé. |

---

## ✨ Fonctionnalités Clés

1. **Nom de Domaine Personnalisé Officiel** :
   - Domaine apex `maroukifripe.tn` et sous-domaine canonique `www.maroukifripe.tn`.
   - Sous-domaine dédié `admin.maroukifripe.tn` pour l'espace propriétaire.
   - Certificats SSL automatiques et réseau Edge Vercel haute performance.

2. **Typographie Garet Haute Couture** :
   - Utilisation exclusive de la police locale **Garet Book** (fine, géométrique, élégante pour l'univers du textile et de la frippe de luxe).
   - Espacements `tracking-luxury` et `tracking-editorial`.

3. **Sécurité & Authentification Biométrique (FIDO2 / WebAuthn)** :
   - Connexion instantanée avec Face ID, Touch ID ou Windows Hello.
   - Liens d'invitation uniques à usage unique générables depuis l'admin ou via le CLI.
   - Code de secours aléatoire (format `MF-XXXXXX`) et code PIN alternatif.

4. **Synchronisation Temps Réel (Supabase Realtime)** :
   - Mise à jour instantanée du catalogue, des commandes et des paramètres sans recharger la page.
   - Commandes WhatsApp directes pré-remplies.
