-- Script để reset database hoàn toàn
-- Chạy script này trong MySQL Workbench hoặc phpMyAdmin

-- Bước 1: Drop database nếu tồn tại
DROP DATABASE IF EXISTS shop_db;

-- Bước 2: Tạo lại database
CREATE DATABASE shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bước 3: Sử dụng database
USE shop_db;

-- Hoàn tất! Bây giờ chạy: php artisan migrate --seed
