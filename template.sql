-- phpMyAdmin SQL Dump
-- version 5.0.4deb2
-- https://www.phpmyadmin.net/
--
-- 主機： localhost:3306
-- 產生時間： 2022 年 02 月 12 日 22:33
-- 伺服器版本： 10.5.12-MariaDB-0+deb11u1
-- PHP 版本： 7.4.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 資料庫： `nwwbot`
--

-- --------------------------------------------------------

--
-- 資料表結構 `giveaways`
--

CREATE TABLE `giveaways` (
  `id` varchar(18) COLLATE utf8mb4_bin NOT NULL,
  `guild` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `channel` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `item` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `winner` int(11) NOT NULL,
  `endAt` datetime NOT NULL,
  `emoji` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `author` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `color` int(11) NOT NULL,
  `weight` longtext COLLATE utf8mb4_bin NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- 資料表結構 `leveling`
--

CREATE TABLE `leveling` (
  `id` int(11) NOT NULL,
  `user` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `guild` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `exp` bigint(255) NOT NULL,
  `last` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- 資料表結構 `poll`
--

CREATE TABLE `poll` (
  `id` varchar(18) COLLATE utf8mb4_bin NOT NULL,
  `guild` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `channel` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `options` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `endAt` datetime NOT NULL,
  `author` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `color` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_bin NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- 資料表結構 `queue`
--

CREATE TABLE `queue` (
  `id` int(11) NOT NULL,
  `user` varchar(255) NOT NULL,
  `queue` longtext NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `rolemsg`
--

CREATE TABLE `rolemsg` (
  `id` varchar(20) NOT NULL,
  `guild` varchar(255) NOT NULL,
  `channel` varchar(255) NOT NULL,
  `author` varchar(255) NOT NULL,
  `roles` longtext DEFAULT NULL,
  `emojis` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `servers`
--

CREATE TABLE `servers` (
  `id` varchar(18) COLLATE utf8mb4_bin NOT NULL,
  `autorole` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `welcome` mediumtext COLLATE utf8mb4_bin DEFAULT NULL,
  `wel_channel` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `wel_img` longtext COLLATE utf8mb4_bin DEFAULT NULL,
  `leave_msg` mediumtext COLLATE utf8mb4_bin DEFAULT NULL,
  `leave_channel` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `boost_msg` mediumtext COLLATE utf8mb4_bin DEFAULT NULL,
  `boost_channel` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `giveaway` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `prefix` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `queue` longtext COLLATE utf8mb4_bin DEFAULT NULL,
  `looping` tinyint(1) DEFAULT NULL,
  `repeating` tinyint(1) DEFAULT NULL,
  `random` tinyint(1) DEFAULT NULL,
  `safe` tinyint(1) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- 資料表結構 `shop`
--

CREATE TABLE `shop` (
  `id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `guild` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `buy_price` decimal(65,2) NOT NULL,
  `sell_price` decimal(65,2) NOT NULL,
  `buy_limit` bigint(255) NOT NULL,
  `stock_limit` bigint(255) NOT NULL,
  `must_use` tinyint(1) NOT NULL,
  `run` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `args` varchar(255) COLLATE utf8mb4_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- 資料表結構 `users`
--

CREATE TABLE `users` (
  `id` varchar(20) NOT NULL,
  `items` longtext NOT NULL DEFAULT '{}',
  `no_log` tinyint(1) NOT NULL DEFAULT 0,
  `currency` decimal(65,2) NOT NULL DEFAULT 0.00,
  `worked` int(255) NOT NULL DEFAULT 0,
  `last_worked` datetime DEFAULT NULL,
  `bank` decimal(65,2) NOT NULL DEFAULT 0.00,
  `doubling` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `warn`
--

CREATE TABLE `warn` (
  `id` int(11) NOT NULL,
  `guild` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `user` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `giveaways`
--
ALTER TABLE `giveaways`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `leveling`
--
ALTER TABLE `leveling`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `poll`
--
ALTER TABLE `poll`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `queue`
--
ALTER TABLE `queue`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `rolemsg`
--
ALTER TABLE `rolemsg`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `servers`
--
ALTER TABLE `servers`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `shop`
--
ALTER TABLE `shop`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `warn`
--
ALTER TABLE `warn`
  ADD PRIMARY KEY (`id`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `leveling`
--
ALTER TABLE `leveling`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `queue`
--
ALTER TABLE `queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `warn`
--
ALTER TABLE `warn`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
