-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: localhost    Database: hotel_directory
-- ------------------------------------------------------
-- Server version	8.0.42-0ubuntu0.22.04.1

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
-- Table structure for table `amenities`
--

DROP TABLE IF EXISTS `amenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `amenities` (
  `amenity_id` int NOT NULL AUTO_INCREMENT,
  `hotel_id` int DEFAULT NULL,
  `amenity_name` varchar(100) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`amenity_id`),
  UNIQUE KEY `unique_amenity_per_hotel` (`hotel_id`,`amenity_name`),
  CONSTRAINT `amenities_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`hotel_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `amenities`
--

LOCK TABLES `amenities` WRITE;
/*!40000 ALTER TABLE `amenities` DISABLE KEYS */;
INSERT INTO `amenities` VALUES (1,1,'Free Wi-Fi','Complimentary high-speed internet access throughout the hotel.'),(2,1,'Outdoor Pool','A serene outdoor swimming pool surrounded by lush gardens.'),(3,1,'Fitness Center','State-of-the-art gym equipped with modern exercise machines.'),(4,1,'Spa','Full-service spa offering a range of treatments and therapies.'),(5,1,'Business Center','Facilities equipped for business meetings and events.'),(6,1,'Concierge Service','Personalized assistance for guests’ needs and inquiries.'),(7,1,'Airport Shuttle','Transportation services to and from the airport.'),(8,1,'24-Hour Room Service','In-room dining available around the clock.'),(11,1,'Afternoon Tea Lounge','The Lobby hosts the Peninsula’s iconic Afternoon Tea.'),(12,1,'Wedding Services','Luxurious venues and planning services for weddings.'),(14,1,'Free WiFi','Complimentary high-speed wireless internet throughout the hotel.');
/*!40000 ALTER TABLE `amenities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dining_options`
--

DROP TABLE IF EXISTS `dining_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dining_options` (
  `dining_id` int NOT NULL AUTO_INCREMENT,
  `hotel_id` int DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `cuisine` varchar(100) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`dining_id`),
  UNIQUE KEY `unique_dining_per_hotel` (`hotel_id`,`name`,`cuisine`),
  CONSTRAINT `dining_options_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`hotel_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dining_options`
--

LOCK TABLES `dining_options` WRITE;
/*!40000 ALTER TABLE `dining_options` DISABLE KEYS */;
INSERT INTO `dining_options` VALUES (1,1,'Old Manila','Modern European','Fine dining restaurant offering contemporary European cuisine.'),(2,1,'Spices','Southeast Asian','Restaurant serving authentic dishes from Southeast Asia.'),(3,1,'Escolta','International Buffet','Buffet-style dining with a variety of international dishes.'),(4,1,'The Lobby','International','All-day dining venue known for its Afternoon Tea.'),(5,1,'The Bar','Cocktails and Light Bites','Chic bar offering a selection of drinks and snacks.'),(6,1,'Salon de Ning','Lounge','Stylish lounge with live entertainment and unique cocktails.'),(7,1,'The Pool Bar','Light Meals','Casual dining by the pool with a selection of light meals.');
/*!40000 ALTER TABLE `dining_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotel_images`
--

DROP TABLE IF EXISTS `hotel_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotel_images` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `hotel_id` int DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`image_id`),
  UNIQUE KEY `unique_image_per_hotel` (`hotel_id`,`filename`,`category`),
  CONSTRAINT `hotel_images_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`hotel_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotel_images`
--

LOCK TABLES `hotel_images` WRITE;
/*!40000 ALTER TABLE `hotel_images` DISABLE KEYS */;
INSERT INTO `hotel_images` VALUES (6,1,'The_Peninsula_Manila_Lifestyle_Spices.jpg','Dining Area','Test Share the history of an icon of sophistication in the Filipino capital. The Peninsula Manila is awarded the coveted Forbes Travel Guide Five-Star rating – the only hotel in the principal central business districts of Makati and Bonifacio Global City to receive the coveted ranking in the publisher’s annual announcement of the world’s finest luxury hotels. Testing!!!'),(7,1,'The_Peninsula_PMN_Rooms_and_Lounge.jpg','Rooms and Lounge','Experience the refined comfort of our newly refurbished rooms and lounges, where elegance meets contemporary Filipino design. Each space has been thoughtfully crafted to provide a serene sanctuary for relaxation, blending traditional warmth with modern convenience.'),(8,1,'The_Peninsula_Pen_Page_Wedding.jpg','Wedding Venue','Celebrate timeless moments at The Peninsula Manila\'s exquisite wedding venues. Whether an intimate gathering or a grand affair, our elegant spaces and expert service create memories that last a lifetime.'),(9,1,'The_Peninsula_Superior_Queen.jpg','Superior Queen Room','The Superior Queen rooms offer a cozy yet elegant escape for the modern traveler. With thoughtful design, plush bedding, and premium amenities, each room guarantees a restful experience infused with Peninsula’s signature charm.'),(10,1,'The_Peninsula_The_Lobby.jpg','The Lobby','The Lobby at The Peninsula Manila is more than just a meeting space—it’s a destination in itself. Enjoy traditional Afternoon Tea or unwind beneath the high ceilings with live music in a space that reflects both grandeur and warmth.');
/*!40000 ALTER TABLE `hotel_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotels`
--

DROP TABLE IF EXISTS `hotels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotels` (
  `hotel_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `opening_date` date DEFAULT NULL,
  `operator` varchar(100) DEFAULT NULL,
  `owner` varchar(100) DEFAULT NULL,
  `number_of_rooms` int DEFAULT NULL,
  `number_of_suites` int DEFAULT NULL,
  `floors` int DEFAULT NULL,
  `description` text,
  `slug` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`hotel_id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `unique_hotel_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotels`
--

LOCK TABLES `hotels` WRITE;
/*!40000 ALTER TABLE `hotels` DISABLE KEYS */;
INSERT INTO `hotels` VALUES (1,'The Peninsula Manila','Corner of Ayala and Makati Avenues','Makati','Metro Manila','Philippines','+63 2 8887 2888','pmn@peninsula.com','https://www.peninsula.com/en/manila/5-star-luxury-hotel-makati','1976-09-14','The Peninsula Hotels','Hongkong and Shanghai Hotels Ltd.',351,45,11,'A 5-star luxury hotel located in the heart of Makati, offering elegant accommodations and world-class amenities.','the-peninsula-manila');
/*!40000 ALTER TABLE `hotels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `room_id` int NOT NULL AUTO_INCREMENT,
  `hotel_id` int DEFAULT NULL,
  `room_type` varchar(100) DEFAULT NULL,
  `bed_type` varchar(50) DEFAULT NULL,
  `size_sqm` int DEFAULT NULL,
  `occupancy` int DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`room_id`),
  UNIQUE KEY `unique_room_type_per_hotel` (`hotel_id`,`room_type`,`bed_type`),
  CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`hotel_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,1,'Deluxe Room','King or Twin',43,3,'Spacious rooms with elegant furnishings and modern amenities.'),(2,1,'Grand Deluxe Room','King or Twin',46,3,'Larger rooms offering enhanced comfort and city views.'),(3,1,'Premier Suite','King',88,3,'Luxurious suite with separate living area and premium amenities.'),(4,1,'Executive Suite','King or Twin',93,3,'Elegant suite with expansive space and exclusive services.'),(5,1,'Deluxe Suite','King',124,3,'Sophisticated suite featuring a dining area and panoramic views.'),(6,1,'Peninsula Suite','King',280,3,'The hotel’s most opulent suite with top-tier facilities.'),(7,1,'Superior Queen','Queen',40,2,'A cozy yet elegant room with premium bedding and modern comforts. Perfect for solo travelers or couples.');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spa_services`
--

DROP TABLE IF EXISTS `spa_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spa_services` (
  `service_id` int NOT NULL AUTO_INCREMENT,
  `hotel_id` int DEFAULT NULL,
  `service_name` varchar(100) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`service_id`),
  UNIQUE KEY `unique_spa_per_hotel` (`hotel_id`,`service_name`),
  CONSTRAINT `spa_services_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`hotel_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spa_services`
--

LOCK TABLES `spa_services` WRITE;
/*!40000 ALTER TABLE `spa_services` DISABLE KEYS */;
INSERT INTO `spa_services` VALUES (1,1,'Swedish Massage','Traditional massage technique to relax muscles and improve circulation.'),(2,1,'Thai Massage','Ancient healing system combining acupressure and assisted yoga postures.'),(3,1,'Facial Treatments','Skincare services to rejuvenate and cleanse the skin.'),(4,1,'Aromatherapy','Therapeutic use of essential oils to enhance physical and emotional well-being.'),(5,1,'Body Scrubs','Exfoliating treatments to remove dead skin cells and improve skin texture.'),(6,1,'Signature Massage','90-minute full-body massage using Peninsula techniques and aromatic oils.');
/*!40000 ALTER TABLE `spa_services` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-01 19:36:50
