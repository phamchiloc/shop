-- =====================================================
-- Database Schema for Free Hosting (COMPLETE VERSION)
-- Compatible with: FreeSQLDatabase.com, db4free.net
-- 
-- ✅ Giống 100% cấu trúc DBWebBanDoBongDa.sql
-- ✅ Tích hợp sẵn: AI_Data_Cleanup_And_Constraints + AI_Performance_Indexes + UPDATE_VNPAY
-- ✅ Tương thích MySQL 5.x (DATETIME thay vì TIMESTAMP, không có utf8mb4_0900_ai_ci)
-- 
-- IMPORTANT: Dùng database có sẵn, KHÔNG tạo database mới
-- =====================================================

-- =====================================================
-- Table 1: account
-- =====================================================
DROP TABLE IF EXISTS `account`;
CREATE TABLE `account` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(191) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `account` VALUES 
(37,'user@gmail.com','hiepUser','$2y$10$c0o7hyazY0CPSNDmV6hKTO1Xn9sQH37zjvdnHoPBuE2oFcfnmnChu','user','2025-05-09 15:48:32','2025-11-14 04:09:14',NULL,NULL),
(39,'hiep542004s@gmail.com','hiep','$2y$10$4QJDo5XYYCXFQVJNB16JLeGX/Q4N6chN3RhVyCBCX4QabRi4xSuzC','user','2025-05-12 11:53:19','2025-05-23 11:41:10',NULL,NULL),
(41,'admin@gmail.com','admin','$2y$10$y2TWpCrT9XImGxKUTSdHIO/vcugZ/La.kw8sEPvdEgzZDnourtO3W','admin','2025-05-23 12:47:29','2025-05-23 12:47:47',NULL,NULL),
(42,'user@user.com','user','$2b$10$4wD7.gGtatFiztGauuC6yu5RyHsLehBF4DaFP77ljuLihq/eQHOsm','user','2025-11-13 17:40:57','2025-11-13 17:40:57',NULL,NULL),
(43,'admin@admin.com','admin','$2b$10$QZBG9odfjCmeuFR/24Qc7.NHN0jsmK3k0sh9mkwzhDd8SjvnmQ3J6','admin','2025-11-13 18:57:25','2025-11-13 19:07:48',NULL,NULL);

-- =====================================================
-- Table 2: address
-- =====================================================
DROP TABLE IF EXISTS `address`;
CREATE TABLE `address` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `provinceName` varchar(255) NOT NULL,
  `districtName` varchar(255) NOT NULL,
  `wardName` varchar(255) NOT NULL,
  `address_detail` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `address_account_fk` (`account_id`),
  CONSTRAINT `address_account_fk` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `address` VALUES 
(9,39,'hiep','0977850642','Thành phố Hồ Chí Minh','Thành phố Thủ Đức','Phường Linh Trung','96 Lê Văn Chí'),
(10,42,'Lê Đức Thịnh','0383190880','Tỉnh Phú Thọ','Huyện Thanh Thuỷ','Xã Đồng Trung','Đạ teh, lâm đồng')
(11,43,'Phạm chí lộc','0832090304','tỉnh phú yên','Quận Ba Đình','Phường Phúc Xá','Số 1, Đường ABC');

-- =====================================================
-- Table 3: ai_conversations
-- =====================================================
DROP TABLE IF EXISTS `ai_conversations`;
CREATE TABLE `ai_conversations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_id` varchar(64) NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `role` varchar(32) NOT NULL,
  `content` longtext,
  `tool_name` varchar(128) DEFAULT NULL,
  `tool_payload` longtext,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_user_role` (`user_id`,`role`),
  KEY `idx_ai_conv_created` (`created_at`),
  KEY `idx_ai_conv_session` (`session_id`,`id`),
  KEY `idx_ai_conv_user` (`user_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table 4: ai_memory
-- =====================================================
DROP TABLE IF EXISTS `ai_memory`;
CREATE TABLE `ai_memory` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `summary` text,
  `embedding` longtext,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ai_mem_user` (`user_id`),
  KEY `idx_ai_mem_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table 5: category
-- =====================================================
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  KEY `idx_category_name` (`name`(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `category` VALUES 
(11,'Bộ đồ','áo + quần'),
(12,'Áo',NULL),
(13,'Quần',NULL),
(14,'Giày',NULL),
(15,'Phụ kiện',NULL);

-- =====================================================
-- Table 6: sizes
-- =====================================================
DROP TABLE IF EXISTS `sizes`;
CREATE TABLE `sizes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `size` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sizes_size` (`size`),
  KEY `idx_sizes_size` (`size`(10))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `sizes` VALUES 
(31,'10'),(32,'11'),(33,'12'),(20,'39'),(21,'40'),(22,'41'),(23,'42'),(24,'43'),(25,'44'),(26,'45'),(34,'5'),(27,'6'),(28,'7'),(29,'8'),(30,'9'),(16,'L'),(15,'M'),(14,'S'),(17,'XL'),(18,'XXL'),(19,'XXXL');

-- =====================================================
-- Table 7: product
-- =====================================================
DROP TABLE IF EXISTS `product`;
CREATE TABLE `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `image` varchar(500) DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `idx_product_name` (`name`),
  KEY `idx_product_price` (`price`),
  KEY `idx_product_category` (`category_id`),
  KEY `idx_product_category_price` (`category_id`,`price`),
  CONSTRAINT `product_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `product` VALUES 
(60,'Áo bóng đá MU đỏ sân nhà 24/25','Áo MU đỏ mùa giải 24/25',139000.00,25.00,'ao_mu_do.jpg',12),
(61,'Áo Bóng Đá Câu Lạc Bộ Real Madrid Đen Rồng Viền Tím 2024-2025','Áo Real Madrid phiên bản rồng đen',120000.00,30.00,'ao_real_den_rong.jpg',12),
(62,'Mẫu áo bóng đá Câu lạc bộ Atlético Nacional sân nhà 2023 màu xanh lá V3499','Áo Atlético Nacional xanh lá',159000.00,15.00,'ao_nacional_xanh.jpg',12),
(63,'Đồ Đá Banh CLB Miami Màu Hồng 2023','Áo Miami màu hồng Messi',169000.00,20.00,'ao_miami_hong.jpg',12),
(64,'Giày đá bóng Nike Mercurial Vapor 15 Academy TF - Xanh dương đậm','Giày Nike Mercurial chất lượng cao',890000.00,10.00,'giay_nike_mercurial.jpg',14),
(65,'Giày đá bóng Adidas X Speedportal.3 TF - Vàng đen','Giày Adidas X Speedportal phiên bản TF',850000.00,15.00,'giay_adidas_x.jpg',14),
(66,'Quần đấu Manchester United sân nhà 2024/25 - Đỏ','Quần đấu MU mùa giải mới',99000.00,20.00,'quan_mu_do.jpg',13),
(67,'Quần đấu Real Madrid sân khách 2024/25 - Đen','Quần đấu Real Madrid màu đen',110000.00,18.00,'quan_real_den.jpg',13),
(68,'Bộ đồ đá banh Barcelona sân nhà 2024/25','Bộ áo + quần Barcelona xanh đỏ',250000.00,25.00,'bo_barca_home.jpg',11),
(69,'Bộ đồ đá banh PSG sân khách 2024/25','Bộ áo + quần PSG màu trắng',280000.00,20.00,'bo_psg_away.jpg',11),
(70,'Tất đá bóng Nike Everyday Cushioned - Trắng','Tất đá bóng Nike cao cổ',45000.00,10.00,'tat_nike_trang.jpg',15),
(71,'Tất đá bóng Adidas Copa Zone - Đen','Tất Adidas chống trơn trượt',50000.00,12.00,'tat_adidas_den.jpg',15),
(72,'Băng đội trưởng Captain Armband - Đỏ','Băng đội trưởng cao su',30000.00,0.00,'bang_doi_truong_do.jpg',15),
(73,'Băng đội trưởng Captain Armband - Xanh','Băng đội trưởng màu xanh',30000.00,0.00,'bang_doi_truong_xanh.jpg',15),
(74,'Bảo hộ ống đồng Nike Mercurial Lite - Trắng đen','Bảo hộ ống đồng Nike siêu nhẹ',120000.00,15.00,'bao_ho_nike.jpg',15),
(75,'Bảo hộ ống đồng Adidas Predator Match - Đỏ','Bảo hộ ống đồng Adidas',130000.00,10.00,'bao_ho_adidas.jpg',15),
(76,'Găng tay thủ môn Adidas Predator Pro - Đen vàng','Găng tay thủ môn chuyên nghiệp',450000.00,20.00,'gang_tay_adidas.jpg',15),
(77,'Găng tay thủ môn Nike Vapor Grip3 - Xanh trắng','Găng tay Nike bám tốt',480000.00,18.00,'gang_tay_nike.jpg',15),
(78,'Túi đựng giày thể thao Nike Utility - Đen','Túi đựng giày chống nước',180000.00,0.00,'tui_giay_nike.jpg',15);

-- =====================================================
-- Table 8: product_embeddings
-- =====================================================
DROP TABLE IF EXISTS `product_embeddings`;
CREATE TABLE `product_embeddings` (
  `product_id` int NOT NULL,
  `embedding` longtext,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`product_id`),
  KEY `idx_pe_updated` (`updated_at`),
  CONSTRAINT `fk_pe_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table 9: product_sizes
-- =====================================================
DROP TABLE IF EXISTS `product_sizes`;
CREATE TABLE `product_sizes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `size_id` int NOT NULL,
  `quantity` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_size` (`product_id`,`size_id`),
  KEY `size_id` (`size_id`),
  KEY `idx_ps_product` (`product_id`),
  KEY `idx_ps_size` (`size_id`),
  CONSTRAINT `product_sizes_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_sizes_ibfk_2` FOREIGN KEY (`size_id`) REFERENCES `sizes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `product_sizes` VALUES 
(66,60,14,36),(67,60,15,44),(68,60,16,24),(69,60,17,15),(70,60,18,9),
(71,61,14,20),(72,61,15,30),(73,61,16,25),(74,61,17,18),(75,61,18,12),
(76,62,14,10),(77,62,15,20),(78,62,16,11),(79,62,17,23),(80,62,18,6),
(81,63,14,15),(82,63,15,25),(83,63,16,20),(84,63,17,10),(85,63,18,8),(86,63,19,5),
(87,64,20,10),(88,64,21,12),(89,64,22,15),(90,64,23,8),(91,64,24,6),(92,64,25,5),
(93,65,20,8),(94,65,21,10),(95,65,22,12),(96,65,23,7),(97,65,24,5),(98,65,25,4),
(99,66,14,25),(100,66,15,30),(101,66,16,20),(102,66,17,15),(103,66,18,10),
(104,67,14,20),(105,67,15,25),(106,67,16,18),(107,67,17,12),(108,67,18,8),
(109,68,14,10),(110,68,15,15),(111,68,16,12),(112,68,17,8),(113,68,18,5),
(114,69,14,12),(115,69,15,18),(116,69,16,14),(117,69,17,10),(118,69,18,6),
(119,70,14,50),(120,70,15,60),(121,70,16,40),(122,71,14,45),(123,71,15,55),(124,71,16,35),
(125,72,14,100),(126,73,14,100),(127,74,14,30),(128,74,15,35),(129,74,16,25),
(130,75,14,28),(131,75,15,32),(132,75,16,22),
(133,76,27,8),(134,76,28,10),(135,76,29,12),(136,76,30,10),(137,76,31,8),
(138,77,27,7),(139,77,28,9),(140,77,29,11),(141,77,30,9),(142,77,31,7),
(143,78,14,20),(144,78,15,25),(145,78,16,18);

-- =====================================================
-- Table 10: orders
-- =====================================================
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `status` enum('pending','confirmed','shipping','delivered','cancelled','received') DEFAULT 'pending',
  `created_at` datetime DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  `total_amount` decimal(20,2) DEFAULT '0.00',
  `payment_method` varchar(50) DEFAULT 'cod',
  `is_paid` tinyint(1) DEFAULT '0',
  `payment_info` text COMMENT 'Thông tin giao dịch thanh toán (JSON format)',
  PRIMARY KEY (`id`),
  KEY `account_id` (`account_id`),
  KEY `idx_orders_account_created` (`account_id`,`created_at`),
  KEY `idx_orders_account` (`account_id`,`id` DESC),
  KEY `idx_orders_status` (`status`),
  KEY `idx_payment_method` (`payment_method`),
  KEY `idx_is_paid` (`is_paid`),
  CONSTRAINT `orders_account_fk` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table 11: order_details
-- =====================================================
DROP TABLE IF EXISTS `order_details`;
CREATE TABLE `order_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_sizes_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `order_details_ibfk_3` (`product_sizes_id`),
  KEY `idx_od_order` (`order_id`),
  KEY `idx_od_ps` (`product_sizes_id`),
  CONSTRAINT `order_details_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `order_details_ibfk_3` FOREIGN KEY (`product_sizes_id`) REFERENCES `product_sizes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Table 12: rating
-- =====================================================
DROP TABLE IF EXISTS `rating`;
CREATE TABLE `rating` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rating_value` tinyint NOT NULL,
  `comment` text,
  `created_at` datetime DEFAULT NULL,
  `order_detail_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rating_order_detail` (`order_detail_id`),
  CONSTRAINT `rating_order_detail_fk` FOREIGN KEY (`order_detail_id`) REFERENCES `order_details` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- COMPLETED! Database ready for FREE HOSTING
-- =====================================================
-- 
-- ✅ 12 bảng đầy đủ giống DBWebBanDoBongDa.sql
-- ✅ Tích hợp sẵn tất cả indexes từ AI_Performance_Indexes.sql
-- ✅ Tích hợp sẵn constraints từ AI_Data_Cleanup_And_Constraints.sql
-- ✅ Tích hợp sẵn VNPay support từ UPDATE_VNPAY.sql
-- ✅ Tương thích 100% với FreeSQLDatabase.com
-- 
-- Import vào: http://www.phpmyadmin.co
-- Chọn database có sẵn (vd: sql12811307)
-- =====================================================
