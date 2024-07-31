-- MySQL dump 10.13  Distrib 8.0.37, for Linux (x86_64)
--
-- Host: localhost    Database: utn-db
-- ------------------------------------------------------
-- Server version	8.0.37-0ubuntu0.22.04.3

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
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `secretaria_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre_secretaria_unique` (`nombre`,`secretaria_id`),
  KEY `secretaria_id` (`secretaria_id`),
  CONSTRAINT `categorias_ibfk_1` FOREIGN KEY (`secretaria_id`) REFERENCES `secretarias` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (7,' Capacitación y desarrollo',1),(20,'Capacitación del Personal',7),(12,'Compra cafetera',1),(19,'Compra de equipos de maquinaria',8),(10,'Compra de suministros	 ',8),(18,'Costos de subcontratación',8),(26,'Curso Paneles Solares',5),(4,'Gastos de logistica',1),(11,'Gastos de transporte',8),(25,'Gastos Monitor',7),(21,'Ingreso Cuota',7),(22,'Jardinería',8),(9,'Otros gastos administrativos',1),(23,'Pintura',8),(24,'Programa de jardineria',5),(8,'Publicidad y marketing',1),(5,'Repuestos A.C	',8),(6,'Seguros',1),(1,'Sueldos y salarios del personal ',1),(3,'Viajes y gastos de representación',1);
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias_fondos`
--

DROP TABLE IF EXISTS `categorias_fondos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_fondos` (
  `id_categoria_fondo` int NOT NULL AUTO_INCREMENT,
  `nombre_categoria_fondo` varchar(255) NOT NULL,
  `destino` enum('universidad','fundacion') NOT NULL,
  PRIMARY KEY (`id_categoria_fondo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias_fondos`
--

LOCK TABLES `categorias_fondos` WRITE;
/*!40000 ALTER TABLE `categorias_fondos` DISABLE KEYS */;
INSERT INTO `categorias_fondos` VALUES (1,'Banco SFE CTE','universidad');
/*!40000 ALTER TABLE `categorias_fondos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha_carga` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `nombre_factura` varchar(100) NOT NULL,
  `categoria_id` int DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `estado` enum('aceptado','denegado','en proceso') NOT NULL DEFAULT 'en proceso',
  `visibilidad` enum('visible','no visible') NOT NULL DEFAULT 'visible',
  `usuario_id` int DEFAULT NULL,
  `archivo_factura` varchar(255) DEFAULT NULL,
  `destino` enum('universidad','fundación') NOT NULL DEFAULT 'universidad',
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `facturas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
INSERT INTO `facturas` VALUES (23,'2024-04-29 12:33:22','CV MatÃ­as Goldaraz 2024.pdf',20,42222.00,'denegado','visible',14,'uploads/CV MatÃ­as Goldaraz 2024.pdf','universidad'),(25,'2024-04-29 17:27:36','COSTOS DE LAS CLASES MAyO 2024.pdf',5,50000.00,'aceptado','visible',15,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(26,'2024-04-29 17:27:51','COSTOS DE LAS CLASES MAyO 2024.pdf',10,25300.00,'aceptado','visible',15,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(27,'2024-04-29 17:30:59','COSTOS DE LAS CLASES MAyO 2024.pdf',1,650000.00,'aceptado','visible',7,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(28,'2024-04-29 17:31:18','COSTOS DE LAS CLASES MAyO 2024.pdf',3,127450.00,'aceptado','no visible',7,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(29,'2024-04-29 17:31:40','COSTOS DE LAS CLASES MAyO 2024.pdf',7,75000.00,'aceptado','visible',7,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(30,'2024-04-29 17:31:55','COSTOS DE LAS CLASES MAyO 2024.pdf',12,186000.00,'aceptado','visible',7,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(32,'2024-04-29 18:38:13','COSTOS DE LAS CLASES MAyO 2024.pdf',5,22000.00,'aceptado','no visible',18,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(33,'2024-05-06 06:36:38','COSTOS DE LAS CLASES MAyO 2024.pdf',24,25000.00,'aceptado','visible',19,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(34,'2024-05-06 07:13:36','COSTOS DE LAS CLASES MAyO 2024.pdf',18,16000.00,'aceptado','visible',18,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(35,'2024-05-06 22:55:14','COSTOS DE LAS CLASES MAyO 2024.pdf',22,60000.00,'aceptado','no visible',18,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(36,'2024-05-27 22:30:12','CV MatÃ­as Goldaraz 2024.pdf',25,3030.00,'aceptado','no visible',16,'uploads/CV MatÃ­as Goldaraz 2024.pdf','universidad'),(37,'2024-05-27 22:33:03','COSTOS DE LAS CLASES MAyO 2024.pdf',24,100000.00,'aceptado','visible',19,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(39,'2024-06-05 22:20:20','CV MatÃ­as Goldaraz 2024.pdf',1,1000.50,'aceptado','visible',17,'uploads/CV MatÃ­as Goldaraz 2024.pdf','universidad'),(40,'2024-06-10 18:09:34','COSTOS DE LAS CLASES MAyO 2024.pdf',22,75700.00,'aceptado','visible',18,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(41,'2024-06-10 18:11:22','COSTOS DE LAS CLASES MAyO 2024.pdf',20,570000.00,'aceptado','visible',16,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(42,'2024-06-10 18:13:48','COSTOS DE LAS CLASES MAyO 2024.pdf',26,200000.00,'aceptado','no visible',19,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad'),(43,'2024-06-25 20:13:00','COSTOS DE LAS CLASES MAyO 2024.pdf',3,10000.00,'en proceso','visible',17,'uploads/COSTOS DE LAS CLASES MAyO 2024.pdf','universidad');
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fondos_disponibles`
--

DROP TABLE IF EXISTS `fondos_disponibles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fondos_disponibles` (
  `id_fondo` int NOT NULL AUTO_INCREMENT,
  `id_categoria_fondo` int DEFAULT NULL,
  `fecha_carga` date DEFAULT NULL,
  `monto_peso` decimal(20,2) DEFAULT NULL,
  `monto_dolar` decimal(20,2) DEFAULT NULL,
  PRIMARY KEY (`id_fondo`),
  KEY `id_categoria_fondo` (`id_categoria_fondo`),
  CONSTRAINT `fondos_disponibles_ibfk_1` FOREIGN KEY (`id_categoria_fondo`) REFERENCES `categorias_fondos` (`id_categoria_fondo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fondos_disponibles`
--

LOCK TABLES `fondos_disponibles` WRITE;
/*!40000 ALTER TABLE `fondos_disponibles` DISABLE KEYS */;
INSERT INTO `fondos_disponibles` VALUES (1,1,'2024-05-27',NULL,NULL);
/*!40000 ALTER TABLE `fondos_disponibles` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_insert_fondos_disponibles` BEFORE INSERT ON `fondos_disponibles` FOR EACH ROW BEGIN
    SET NEW.fecha_carga = CURDATE();
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `ingresos`
--

DROP TABLE IF EXISTS `ingresos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingresos` (
  `id_ingreso` int NOT NULL AUTO_INCREMENT,
  `fecha_ingreso` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `nombre_ingreso` varchar(100) NOT NULL,
  `categoria_id` int NOT NULL,
  `monto` decimal(20,2) NOT NULL,
  `usuario_id` int NOT NULL,
  `secretaria_id` int NOT NULL,
  PRIMARY KEY (`id_ingreso`),
  KEY `categoria_id` (`categoria_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `secretaria_id` (`secretaria_id`),
  CONSTRAINT `ingresos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`),
  CONSTRAINT `ingresos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `ingresos_ibfk_3` FOREIGN KEY (`secretaria_id`) REFERENCES `secretarias` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingresos`
--

LOCK TABLES `ingresos` WRITE;
/*!40000 ALTER TABLE `ingresos` DISABLE KEYS */;
INSERT INTO `ingresos` VALUES (6,'2024-05-04 21:58:54','Devolución de IVA',6,1010.00,6,1),(8,'2024-05-24 01:56:02','Devolución de IVA',6,1000.00,17,1),(9,'2024-06-10 18:10:33','Cuota Programación',21,2425500.66,16,7),(10,'2024-06-10 18:13:20','Cuota del Curso PS',26,350000.00,19,5),(11,'2024-06-10 18:18:49','Reembolso de Seguro',3,25000.00,17,1);
/*!40000 ALTER TABLE `ingresos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `secretarias`
--

DROP TABLE IF EXISTS `secretarias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `secretarias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `secretarias`
--

LOCK TABLES `secretarias` WRITE;
/*!40000 ALTER TABLE `secretarias` DISABLE KEYS */;
INSERT INTO `secretarias` VALUES (1,'Administrativa'),(3,'Académica'),(5,'Extensión Universitaria'),(7,'Ciencia y Tecnologia'),(8,'Mantenimiento');
/*!40000 ALTER TABLE `secretarias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombres` varchar(200) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `secretaria_id` int DEFAULT NULL,
  `usuario` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `secretaria_id` (`secretaria_id`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`secretaria_id`) REFERENCES `secretarias` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Lautaro Zacarias','yoyoyzacarias@gmail.com','$2a$08$uY81NFhP7Rgr0jrvjm0wVO.Rv/8PkONgMb5B74lY1UcgCwGYoRNf6',1,'LeuxDeux'),(2,'Sasha Lujan Bais','sasham.lb@gmail.com','$2a$08$67x/FQqrxX8uBlPwDSJJ9uUjOh/fuKF5TeAD9zzE9cBD9lJm2OR8y',1,'xayahlb27'),(4,'Jose Antonio','joseantonio@email.com','$2a$08$B3mH2Uh10iGjv4WHKetXjOF2vO8cFl3iy9n4Yk6mo0yZxc.MrqeGK',8,'joseantonio'),(5,'Mati','admin@demo.com','$2a$08$qmWavNNPH2g/wzJrWUv1Xe5OZTSZ848yDX9BjrGBXa6Vn/c1CQh0m',7,'crack'),(6,'Dios','admin1@gmail.com','$2a$08$FDZkZIIJzwEVltyj9OgAuuD/Xj.56R6xskxMWJ/x.bDv/xwf2z1ya',1,'admin'),(7,'Carlos','carlos123@gmail.com','$2a$08$YqdX3p8MoEtwzO3y/bGZl.UWHG.Mszjyu.BQd2nu2FuazTrSgRBvq',1,'carlos'),(11,'Carlos11','carlitos1@gmail.com','$2a$08$0lqunXQ3BxxjJ351Aywkle7QkT7wWkyGjqGL2kZsI8v12icZ5r2X2',8,'carlos11'),(12,'pruebita','pruebita@gmail.com','$2a$08$MjrbqKiJe4hTc5igEvA8iOu2r81AxhJo4n3fa1Py9077gWxC0gSrq',8,'ptuebita'),(13,'prueba1','prueba1@gmail.com','$2a$08$xmtzgpYIWotgWOtV1hNfKu8WZ3ffM5pN54wSle4f9JMyuq64C3JfG',8,'prueba1'),(14,'carlos3','carlos3@gmail.com','$2a$08$i8HhEeeD/0Na59nYCO6MV.Mptm.C1kOQxNjN1WH2lipvqEQ3.w0xu',7,'carlos3'),(15,'Miguel','miguel@gmail.com','$2a$08$JH3MwV69ZYqGi.Wfk3sTT.U1IR92.J9GO5iKZ7w0s0LVzkWZmkpfu',8,'miguel'),(16,'walter blanco','walter@gmail.com','$2a$08$.osxR9uTT1ktoUWKAEHtguJof8kjjD4Rrvd5xka1SuxF5RQzdOZhG',7,'walter'),(17,'Javier','javier@gmail.com','$2a$08$0bjDyy3UTQFEn41JnIAN.OnnTm6sw18dJszGXbQ2sRMrCLRILTSaW',1,'javier'),(18,'Valentin','valentin@gmail.com','$2a$08$1b6mHkTmf790YwSCwKXiFeHjnJthqCHij4FZ9oN3iDN8GJONDiQPa',8,'valentin'),(19,'milton','milton@gmail.com','$2a$08$afJCO9n3ljWJKJsqLS4w/eGF8V9UIH8YM6P1ahJ3FzbmfHOSGC7ge',5,'milton');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-07-28 21:14:31
