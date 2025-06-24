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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotel_images`
--

LOCK TABLES `hotel_images` WRITE;
/*!40000 ALTER TABLE `hotel_images` DISABLE KEYS */;
INSERT INTO `hotel_images` VALUES (7,1,'The_Peninsula_PMN_Rooms_and_Lounge.jpg','Rooms and Lounge','Experience the refined comfort of our newly refurbished rooms and lounges, where elegance meets contemporary Filipino design. Each space has been thoughtfully crafted to provide a serene sanctuary for relaxation, blending traditional warmth with modern convenience.'),(8,1,'The_Peninsula_Pen_Page_Wedding.jpg','Wedding Venue','Celebrate timeless moments at The Peninsula Manila\'s exquisite wedding venues. Whether an intimate gathering or a grand affair, our elegant spaces and expert service create memories that last a lifetime.'),(9,1,'The_Peninsula_Superior_Queen.jpg','Superior Queen Room','The Superior Queen rooms offer a cozy yet elegant escape for the modern traveler. With thoughtful design, plush bedding, and premium amenities, each room guarantees a restful experience infused with Peninsula’s signature charm.'),(10,1,'The_Peninsula_The_Lobby.jpg','The Lobby','The Lobby at The Peninsula Manila is more than just a meeting space—it’s a destination in itself. Enjoy traditional Afternoon Tea or unwind beneath the high ceilings with live music in a space that reflects both grandeur and warmth.'),(20,1,'art_gallery_in_the_sky.jpg','Art Gallery','Art Gallery In The Sky testing\n\nThe Gallery Club Lounge is a luxurious 90-seat club lounge on the third floor whose intimate spaces and detailed amenities overlook the hotel’s iconic lobby and monumental “Sunburst” sculpture. Surrounded by a collection of Philippine masters, guests can enjoy breakfast, all-day refreshments, The Peninsula Afternoon Tea, and a curated selection of spirits while enjoying live musical entertainment. Other benefits include express early check-in and late check-out, garment pressing, complimentary local calls, and two-hour free use of the board room. The facilities encompass round-the-clock business and concierge services. All these benefits are complimentary to guests of The Gallery Club Lounge.'),(22,3,'sofitel.png','background',''),(25,3,'SofitelPhilippinePlaza.png','What to Expect','🏨 What to Expect at Sofitel Philippine Plaza\r\nNestled along the scenic Manila Bay, Sofitel Philippine Plaza delivers an elegant blend of French sophistication and Filipino warmth. Whether you\'re a business traveler, honeymooner, or family on vacation, you can expect an elevated experience from the moment you arrive. This five-star luxury resort stands out for its exceptional service, iconic architecture, and stunning waterfront views.\r\n\r\nUpon arrival, you’ll be greeted by grand, open-air lobbies that flow seamlessly into lush tropical gardens. The signature Sofitel scent, calming ambiance, and welcoming staff immediately signal that you\'re entering a place of refined relaxation. The check-in process is smooth and courteous, with a concierge team ready to assist with luggage, restaurant reservations, or any other personalized request.\r\n\r\nEach room offers a view — either of the city skyline or the peaceful bay. Rooms are spacious, equipped with plush bedding, elegant furnishings, a private balcony, and modern amenities such as high-speed Wi-Fi, a mini-bar, and a rainfall shower. The Luxury Room with Club Millésime access gives you premium perks like exclusive breakfasts and evening cocktails in a private lounge.\r\n\r\nOne of the highlights is the Spiral buffet restaurant, often considered the best buffet in Manila. It boasts over 20 international dining ateliers (stations) including French, Indian, Japanese, and Filipino cuisines. Guests rave about the cheese room, wood-fired pizzas, and curated wine selections. For more casual settings, Le Bar and Sunset Bar offer drinks and tapas, with live entertainment on select evenings.\r\n\r\nDuring the day, guests can enjoy the lagoon-style pool, which feels like a tropical retreat. Surrounded by palm trees and ocean breezes, it’s perfect for lounging or enjoying cocktails under the sun. Kids will love the children’s playground and Kid’s Club, while adults can unwind at the SoFIT wellness spa, which offers massage therapies, a fitness center, sauna, and yoga classes.\r\n\r\nBusiness travelers are also well catered to, with conference rooms, ballrooms, and event services for meetings or weddings. The hotel also offers curated city tours, bay cruises, and local cultural experiences upon request.\r\n\r\nEvenings at Sofitel are magical — with a Manila Bay sunset painting the sky in warm oranges and purples. Whether you’re dining al fresco, sipping cocktails by the pool, or enjoying the luxurious comfort of your room, you’ll feel the unique charm that makes Sofitel Philippine Plaza a destination in itself.'),(26,3,'SofitelPhilippine.png','','🏛️ History of Sofitel Philippine Plaza\r\nSofitel Philippine Plaza Manila is more than just a luxury hotel — it’s an iconic part of the Philippines’ hospitality and architectural history. Originally inaugurated in 1976 as the Philippine Plaza, it was designed by Leandro V. Locsin, a National Artist for Architecture, whose works are known for fusing modernist sensibilities with Filipino cultural identity.\r\n\r\nThe hotel was one of several major establishments built in preparation for the International Monetary Fund (IMF) and World Bank Conference hosted in Manila that same year. It stood as a proud symbol of the Philippines’ capacity to host world leaders and global institutions. Its strategic position along Manila Bay and proximity to cultural landmarks like the Cultural Center of the Philippines (also a Locsin masterpiece) placed it at the heart of the country’s diplomatic and cultural hub.\r\n\r\nWhat made Sofitel unique then — and still does today — is its brutalist-modern architecture softened by tropical elegance, open-air interiors, and thoughtful use of Filipino elements like capiz shell lighting and native wood textures. Over time, it became a favorite gathering place for dignitaries, celebrities, and Filipino families celebrating life’s milestones.\r\n\r\nIn 2006, the hotel was rebranded under Sofitel, the French luxury hotel chain under Accor. With this transformation came modern renovations that respected its original soul while elevating it to global five-star standards. The hotel retained its Filipino heart while introducing French art de vivre — the art of living well — into every guest experience.\r\n\r\nOne of the most iconic additions was the Spiral buffet, a multi-cuisine dining experience that redefined Manila’s fine dining scene. The fusion of French elegance with Filipino hospitality became Sofitel’s signature, reflected not only in its interiors and cuisine but also in the service culture nurtured over decades.\r\n\r\nThe hotel has also witnessed history unfold — from state visits and ASEAN summits to cultural performances and family reunions. It has survived natural calamities, political transitions, and even the COVID-19 pandemic, during which it adapted to serve as a quarantine facility while still maintaining its world-class service.\r\n\r\nToday, Sofitel Philippine Plaza stands as a living tribute to Philippine resilience, heritage, and world-class hospitality. It represents a meeting point of past and present — where history isn’t just displayed on the walls, but felt in the architecture, the service, and the stories shared across generations.'),(27,3,'grandspiralstaircase.png','','This interior image showcases the lobby of a luxury hotel, inspired by the refined style of Sofitel Philippine Plaza. The space is expansive and flooded with natural light from floor-to-ceiling glass windows that offer views of swaying palm trees outside.\r\n\r\nAt the heart of the lobby is a grand spiral staircase, elegantly curved with an ornate black iron balustrade, adding a sense of drama and architectural sophistication. Above, warm woven pendant lights hang from the ceiling, casting a cozy glow that complements the beige marble flooring and neutral-toned walls.\r\n\r\nThe seating area is arranged in tasteful groups of armchairs around low wooden coffee tables, perfect for casual meetings or relaxed conversations. Each table features a small vase with orchids — a subtle but thoughtful touch of local elegance. A wall of wooden latticework with backlighting adds texture and a cultural nod to traditional Filipino design elements.\r\n\r\nPotted palms enhance the tropical vibe, while the minimalist front desk in the background blends seamlessly into the structure without taking attention away from the staircase centerpiece. The overall ambiance is serene, elegant, and welcoming — striking the perfect balance between modern luxury and Filipino hospitality.'),(28,3,'Guest_Room_01.png','','🛏️ What to Expect: Guest Room Experience at Sofitel\r\nExpect nothing less than comfort and elegance in your stay at Sofitel Philippine Plaza. The guest rooms are designed to be a peaceful sanctuary — combining the warmth of Filipino hospitality with refined French-inspired luxury.\r\n\r\nAs you step into the room, you’ll be greeted by a spacious layout, neutral tones, and thoughtfully selected furnishings that exude sophistication. The centerpiece is a king-sized bed layered with premium linens, plush pillows, and a padded headboard — crafted for the ultimate night’s rest.\r\n\r\nThe floor-to-ceiling sliding glass doors open to your very own private balcony, offering breathtaking views of Manila Bay framed by swaying palm trees. Whether it’s sunrise coffee or sunset drinks, the balcony becomes your front-row seat to a tropical escape.\r\n\r\nInside, you’ll find a cozy sitting area, perfect for reading, working, or simply enjoying a quiet moment. Every piece of furniture — from the modern armchairs to the bedside lighting — is designed with elegance and relaxation in mind. The room also includes a large flat-screen TV, a work desk, and ample storage space for a seamless extended stay.\r\n\r\nThe lighting is warm and ambient, creating a mood that transitions beautifully from day to night. And with wood accents, minimalist decor, and subtle Filipino touches, the space feels both global and grounded — a hallmark of Sofitel’s design philosophy.\r\n\r\nWhether you\'re here for a vacation, business trip, or celebration, this room offers the perfect blend of privacy, comfort, and panoramic beauty. It’s more than just a room — it’s a curated living experience.');
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
  `background_image` varchar(255) DEFAULT NULL,
  `card_image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`hotel_id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `unique_hotel_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotels`
--

LOCK TABLES `hotels` WRITE;
/*!40000 ALTER TABLE `hotels` DISABLE KEYS */;
INSERT INTO `hotels` VALUES (1,'The Peninsula Manila','Corner of Ayala and Makati Avenues','Makati','Metro Manila','Philippines','+63 2 8887 2888','pmn@peninsula.com','https://www.peninsula.com/en/manila/5-star-luxury-hotel-makati','1976-09-14','The Peninsula Hotels','Hongkong and Shanghai Hotels Ltd.',351,45,11,'A 5-star luxury hotel located in the heart of Makati, offering elegant accommodations and world-class amenities.','the-peninsula-manila','PeninsulaBG.png','PeninsulaBG.png'),(3,'Sofitel Philippine Plaza','CCP Complex, Roxas Blvd, Pasay, 1300 Metro Manila','Pasay','NCR','Philippines','+63 2 8573 5555','info@sofitelmanila.com','https://www.sofitelmanila.com','2019-02-06','Accor Hotels','Philippine Plaza Holdings',609,46,11,'Sofitel Philippine Plaza Manila is a 5-star luxury resort nestled along Manila Bay with stunning sunset views, a large lagoon-style pool, and signature French-Filipino hospitality.','sofitel-philippine-plaza','sofitel.png','SofitelPhilippinePlaza.png');
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

-- Dump completed on 2025-06-21 16:26:36
