-- Réinsertion des données d’origine dans la base collis (doublons ignorés)
-- À exécuter après le reset.sql ou pour repeupler les tables

SET FOREIGN_KEY_CHECKS = 0;

-- Livreurs
INSERT IGNORE INTO livreur (id, nom, telephone, statut, date_creation) VALUES
  ('11111111-1111-1111-111111111111', 'Amine El Idrissi', '0600000001', 'actif', '2026-02-01 09:00:00'),
  ('22222222-2222-2222-222222222222', 'Sara Benali', '0600000002', 'actif', '2026-02-02 10:00:00'),
  ('33333333-3333-3333-333333333333', 'Youssef Ait Ali', '0600000003', 'inactif', '2026-02-03 11:00:00');

-- Colis
INSERT IGNORE INTO colis (id, numero_suivi, expediteur, destinataire, telephone, adresse, type, date_reception, statut, livreur_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'COL000101', 'Boutique Alpha', 'Omar Lahlou', '0700000001', 'Casablanca, Maarif', 'client', '2026-02-05 09:15:00', 'en_cours', '11111111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'COL000102', 'Boutique Alpha', 'Nadia Ziani', '0700000002', 'Rabat, Agdal', 'client', '2026-02-05 10:20:00', 'livre', '22222222-2222-2222-222222222222'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'COL000103', 'Fournisseur X', 'Said Amrani', '0700000003', 'Marrakech, Gueliz', 'fournisseur', '2026-02-06 08:05:00', 'echec', '11111111-1111-1111-111111111111'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'COL000104', 'Fournisseur Y', 'Khadija Nouri', '0700000004', 'Tanger, Centre', 'fournisseur', '2026-02-06 12:30:00', 'recu', NULL),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'COL000105', 'Boutique Beta', 'Hicham Rami', '0700000005', 'Fes, Ville Nouvelle', 'client', '2026-02-07 14:10:00', 'retourne', '22222222-2222-2222-222222222222');

-- Historique colis (un événement par colis)
INSERT IGNORE INTO historique_colis (id, colis_id, statut, date_evt, commentaire, livreur_id) VALUES
  ('h1-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'recu', '2026-02-05 09:15:00', 'Colis reçu', NULL),
  ('h2-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'recu', '2026-02-05 10:20:00', 'Colis reçu', NULL),
  ('h3-cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'recu', '2026-02-06 08:05:00', 'Colis reçu', NULL),
  ('h4-dddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'recu', '2026-02-06 12:30:00', 'Colis reçu', NULL),
  ('h5-eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'recu', '2026-02-07 14:10:00', 'Colis reçu', NULL),
  ('h6-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'en_cours', '2026-02-05 09:20:00', 'Colis assigné au livreur', '11111111-1111-1111-111111111111'),
  ('h7-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'livre', '2026-02-05 10:25:00', 'Colis livré avec succès', '22222222-2222-2222-222222222222'),
  ('h8-cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'echec', '2026-02-06 08:30:00', 'Échec de livraison', '11111111-1111-1111-111111111111'),
  ('h9-eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'retourne', '2026-02-07 16:00:00', 'Colis retourné à l’entrepôt', '22222222-2222-2222-222222222222');

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Données collis réinsérées.' AS message;
