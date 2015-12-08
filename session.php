<?php

// Database config
$config = array(
    'host' => 'localhost',
    'user' => 'root',
    'password' => 'root',
    'db' => 'wui'
);

// Check method used for script access
if ($_SERVER['REQUEST_METHOD'] != 'PUT')
    throw new Exception('Only PUT requests are accepted', 500);

// Check all required data exists
$_PUT = array();
parse_str(file_get_contents('php://input'), $_PUT);
if (empty($_PUT['terminal']) || empty($_PUT['user']) || empty($_PUT['url']) || empty($_PUT['start']) || empty($_PUT['stop']) || !isset($_PUT['delay']))
    die();

// Connect to database
$connection = new mysqli($config['host'], $config['user'], $config['password'], $config['db']);
if ($connection->connect_error)
    throw new Exception($connection->connect_error, 500);

// Save incoming data
$terminal = $connection->real_escape_string($_PUT['terminal']);
$user = $connection->real_escape_string($_PUT['user']);
$url = $connection->real_escape_string($_PUT['url']);
$start = date('Y-m-d H:i:s', intval($_PUT['start']));
$stop = date('Y-m-d H:i:s', intval($_PUT['stop']));
$delay = intval($_PUT['delay']);
if (!$connection->query("INSERT INTO `sessions`(`computer_name`, `user_name`, `url`, `url_arrival_datetime`, `url_departure_datetime`, `url_view_time`) "
        . "VALUES('$terminal', '$user', '$url', '$start', '$stop', $delay)"))
    throw new Exception($connection->error, 500);

// Close db connection
$connection->close();