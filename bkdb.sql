-- MySQL dump 10.13  Distrib 9.2.0, for macos14.7 (x86_64)
--
-- Host: localhost    Database: picsend
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `GroupMembers`
--

DROP TABLE IF EXISTS `GroupMembers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `GroupMembers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `groupId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('member','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'member',
  `joinedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_group_member` (`groupId`,`userId`),
  KEY `userId` (`userId`),
  CONSTRAINT `groupmembers_ibfk_1` FOREIGN KEY (`groupId`) REFERENCES `UserGroups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `groupmembers_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `GroupMembers`
--

LOCK TABLES `GroupMembers` WRITE;
/*!40000 ALTER TABLE `GroupMembers` DISABLE KEYS */;
/*!40000 ALTER TABLE `GroupMembers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Images`
--

DROP TABLE IF EXISTS `Images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `originalFilename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileSize` int NOT NULL,
  `mimeType` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isPublic` tinyint(1) DEFAULT '0',
  `description` text COLLATE utf8mb4_unicode_ci,
  `uploadedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `images_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Images`
--

LOCK TABLES `Images` WRITE;
/*!40000 ALTER TABLE `Images` DISABLE KEYS */;
/*!40000 ALTER TABLE `Images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ImageShares`
--

DROP TABLE IF EXISTS `ImageShares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ImageShares` (
  `id` int NOT NULL AUTO_INCREMENT,
  `imageId` int NOT NULL,
  `sharedWithUserId` int DEFAULT NULL,
  `sharedWithGroupId` int DEFAULT NULL,
  `sharedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `imageId` (`imageId`),
  KEY `sharedWithUserId` (`sharedWithUserId`),
  KEY `sharedWithGroupId` (`sharedWithGroupId`),
  CONSTRAINT `imageshares_ibfk_1` FOREIGN KEY (`imageId`) REFERENCES `Images` (`id`) ON DELETE CASCADE,
  CONSTRAINT `imageshares_ibfk_2` FOREIGN KEY (`sharedWithUserId`) REFERENCES `Users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `imageshares_ibfk_3` FOREIGN KEY (`sharedWithGroupId`) REFERENCES `UserGroups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ImageShares`
--

LOCK TABLES `ImageShares` WRITE;
/*!40000 ALTER TABLE `ImageShares` DISABLE KEYS */;
/*!40000 ALTER TABLE `ImageShares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserGroups`
--

DROP TABLE IF EXISTS `UserGroups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserGroups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ownerId` int NOT NULL,
  `isPublic` tinyint(1) DEFAULT '0',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ownerId` (`ownerId`),
  CONSTRAINT `usergroups_ibfk_1` FOREIGN KEY (`ownerId`) REFERENCES `Users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserGroups`
--

LOCK TABLES `UserGroups` WRITE;
/*!40000 ALTER TABLE `UserGroups` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserGroups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fullName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `lastLoginAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES (1,'09123456789','admin@picsend.com','$2a$10$5J5FsZ1QU5hVG7g3fzRQ8.YHy4xJ7zLJMB7A1U1yWj/o0IBwPJXNi','مدیر سیستم',NULL,1,'admin','2025-03-16 01:25:44','2025-03-16 01:25:44','2025-03-16 01:25:44');
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-03-16 14:31:32
