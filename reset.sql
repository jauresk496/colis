-- Reset de la base collis : suppression et recréation des tables vides
-- À exécuter dans phpMyAdmin (onglet SQL) ou en ligne de commande

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS historique_colis;
DROP TABLE IF EXISTS colis;
DROP TABLE IF EXISTS livreur;

SET FOREIGN_KEY_CHECKS = 1;

-- Recréation des tables (vides)
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

-- Fin du reset
SELECT 'Tables collis recréées (vides).' AS message;
