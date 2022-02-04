import express from "express";
import * as mysql from "mysql2";
import { PoolConnection } from "mysql2/promise";

const mysql_config = {
    connectTimeout: 60000,
    connectionLimit: 10,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPW,
    database: process.env.DBNAME,
    supportBigNumbers: true,
    charset: "utf8mb4"
};
var pool = mysql.createPool(mysql_config).promise();
var con: PoolConnection;
var conTimeout: NodeJS.Timeout;

const app = express();

app.get("/api/:query", async(req, res) => {
    if (req.query.token !== process.env.DB_TOKEN) return res.sendStatus(403);
    if (!con) {
        con = await pool.getConnection();
        conTimeout = setTimeout(() => {
            con.release();
            con = undefined;
            conTimeout = undefined;
        }, 30000);
    } else if (conTimeout) conTimeout.refresh();
    const [results] = <mysql.RowDataPacket[][]> await con.query(req.params.query);
    res.json(results);
});

app.listen(4269);