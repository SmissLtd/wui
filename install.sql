CREATE DATABASE IF NOT EXISTS `wui`;

USE `wui`;

CREATE TABLE IF NOT EXISTS `sessions`
(
    `req_id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `computer_name` VARCHAR(128),
    `user_name` VARCHAR(128),
    `url` TEXT,
    `url_arrival_datetime` DATETIME,
    `url_departure_datetime` DATETIME,
    `url_view_time` INT
) ENGINE = MyISAM;