-- Script unique pour InfinityFree: création des tables + données initiales
-- À exécuter dans phpMyAdmin (onglet SQL) sur la base if0_42314164_colis

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS historique_colis;
DROP TABLE IF EXISTS colis;
DROP TABLE IF EXISTS livreur;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE livreur (
  id VARCHAR(36) PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  telephone VARCHAR(50) NOT NULL,
  statut ENUM('actif','inactif') NOT NULL DEFAULT 'actif',
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE colis (
  id VARCHAR(36) PRIMARY KEY,
  numero_suivi VARCHAR(50) NOT NULL UNIQUE,
  expediteur VARCHAR(255) NOT NULL,
  destinataire VARCHAR(255) NOT NULL,
  telephone VARCHAR(50) NOT NULL,
  adresse TEXT NOT NULL,
  type ENUM('client','fournisseur') NOT NULL DEFAULT 'client',
  date_reception DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  statut ENUM('recu','en_cours','livre','echec','retourne') NOT NULL DEFAULT 'recu',
  livreur_id VARCHAR(36) NULL,
  INDEX idx_livreur_id (livreur_id),
  INDEX idx_statut (statut),
  INDEX idx_date_reception (date_reception),
  FOREIGN KEY (livreur_id) REFERENCES livreur(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE historique_colis (
  id VARCHAR(36) PRIMARY KEY,
  colis_id VARCHAR(36) NOT NULL,
  statut ENUM('recu','en_cours','livre','echec','retourne') NOT NULL,
  date_evt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  commentaire TEXT NULL,
  livreur_id VARCHAR(36) NULL,
  INDEX idx_colis_id (colis_id),
  INDEX idx_date_evt (date_evt),
  FOREIGN KEY (colis_id) REFERENCES colis(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (livreur_id) REFERENCES livreur(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Données initiales
SET FOREIGN_KEY_CHECKS = 0;

INSERT IGNORE INTO livreur (id, nom, telephone, statut, date_creation) VALUES
('11111111-1111-1111-1111-111111111111', 'Amine El Idrissi', '0600000001', 'actif', '2026-01-10 08:00:00'),
('22222222-2222-2222-2222-222222222222', 'Sara Benali', '0600000002', 'actif', '2026-01-12 09:30:00'),
('33333333-3333-3333-3333-333333333333', 'Youssef Mansouri', '0600000003', 'inactif', '2026-01-15 14:00:00'),
('44444444-4444-4444-4444-444444444444', 'Fatima Zahra', '0600000004', 'actif', '2026-01-20 10:15:00');

INSERT IGNORE INTO colis (id, numero_suivi, expediteur, destinataire, telephone, adresse, type, date_reception, statut, livreur_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'COL000101', 'Boutique Alpha', 'Omar Lahlou', '0700000001', 'Casablanca, Maarif', 'client', '2026-02-05 09:15:00', 'en_cours', '22222222-2222-2222-2222-222222222222'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'COL000102', 'Boutique Alpha', 'Nadia Ziani', '0700000002', 'Rabat, Agdal', 'client', '2026-02-05 10:20:00', 'livre', '22222222-2222-2222-2222-222222222222'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'COL000104', 'Fournisseur Y', 'Khadija Nouri', '0700000004', 'Tanger, Centre', 'fournisseur', '2026-02-06 12:30:00', 'en_cours', '11111111-1111-1111-1111-111111111111'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'COL000105', 'Boutique Beta', 'Hicham Rami', '0700000005', 'Fes, Ville Nouvelle', 'client', '2026-02-07 14:10:00', 'retourne', '22222222-2222-2222-2222-222222222222');

INSERT IGNORE INTO historique_colis (id, colis_id, statut, date_evt, commentaire, livreur_id) VALUES
('h1aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'recu', '2026-02-05 09:15:00', 'Colis reçu en entrepôt', NULL),
('h1bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'en_cours', '2026-02-05 14:00:00', 'Pris en charge par Sara', '22222222-2222-2222-2222-222222222222'),
('h2aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'recu', '2026-02-05 10:20:00', 'Colis reçu', NULL),
('h2bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'en_cours', '2026-02-05 11:00:00', 'En livraison', '22222222-2222-2222-2222-222222222222'),
('h2cccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'livre', '2026-02-05 16:30:00', 'Livré au destinataire', '22222222-2222-2222-2222-222222222222'),
('h3aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'recu', '2026-02-06 12:30:00', 'Colis reçu', NULL),
('h3bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'en_cours', '2026-02-06 15:00:00', 'En cours de livraison', '11111111-1111-1111-1111-111111111111'),
('h4aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'recu', '2026-02-07 14:10:00', 'Colis reçu', NULL),
('h4bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'en_cours', '2026-02-07 16:00:00', 'En livraison', '22222222-2222-2222-2222-222222222222'),
('h4cccccc-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'retourne', '2026-02-08 10:00:00', 'Destinataire absent - retour', '22222222-2222-2222-2222-222222222222');

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Base if0_42314164_colis initialisée avec succès!' AS message;
