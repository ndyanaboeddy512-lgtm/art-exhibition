-- ==========================================================
-- 55 smartCREATIVES — Relational MySQL Database Schema
-- Database: art_gallery_db
-- ==========================================================

CREATE DATABASE IF NOT EXISTS art_gallery_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE art_gallery_db;

-- 1. Artworks & Catalog Table
CREATE TABLE IF NOT EXISTS artworks (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL DEFAULT '55 smartCREATIVES Studio',
  year INT DEFAULT 2026,
  medium VARCHAR(255) DEFAULT 'Fine Art',
  dimensions VARCHAR(128) DEFAULT 'Curated Scale',
  price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  status ENUM('Available', 'Reserved', 'Sold') NOT NULL DEFAULT 'Available',
  framing VARCHAR(255) DEFAULT 'Standard Gallery Presentation',
  frame_options JSON NULL,
  provenance TEXT NULL,
  curatorial_statement TEXT NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  image VARCHAR(500) NOT NULL,
  high_res_zoom VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_featured (featured),
  INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Customer Inquiries & Acquisition Orders Table
CREATE TABLE IF NOT EXISTS inquiries (
  id VARCHAR(64) PRIMARY KEY,
  artwork_id VARCHAR(64) NULL,
  artwork_title VARCHAR(255) NOT NULL DEFAULT 'General Acquisition Inquiry',
  artwork_artist VARCHAR(255) NULL,
  artwork_price DECIMAL(12, 2) DEFAULT 0.00,
  artwork_image VARCHAR(500) NULL,
  collector_name VARCHAR(255) NOT NULL,
  collector_email VARCHAR(255) NOT NULL,
  collector_phone VARCHAR(64) NULL,
  frame_preference VARCHAR(255) DEFAULT 'Included Framing',
  notes TEXT NULL,
  status ENUM('Pending', 'Contacted', 'Invoice Sent', 'Closed/Sold') NOT NULL DEFAULT 'Pending',
  opened BOOLEAN NOT NULL DEFAULT FALSE,
  is_customer_submission BOOLEAN NOT NULL DEFAULT TRUE,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  curator_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inq_status (status),
  INDEX idx_inq_opened (opened),
  INDEX idx_inq_collector_email (collector_email),
  INDEX idx_inq_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Registered Collectors Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  tier VARCHAR(64) DEFAULT 'Collector Member',
  phone VARCHAR(64) NULL,
  address TEXT NULL,
  wishlist JSON NULL,
  role VARCHAR(32) DEFAULT 'collector',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Gallery Curator Admin Table
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT '55 smartCREATIVES Admin',
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) DEFAULT 'admin',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
