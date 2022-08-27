import * as dotenv from "dotenv";
import express from "express";
import * as mysql from "mysql2";
import { PoolConnection } from "mysql2/promise";

dotenv.config();

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
const pool = mysql.createPool(mysql_config).promise();
let con: PoolConnection;
let conTimeout: NodeJS.Timeout;

const app = express();
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: '100mb' }));

app.post("/api/query", async (req, res) => {
    if (req.body.token !== process.env.DB_TOKEN) return res.sendStatus(403);
    if (!con) {
        con = await pool.getConnection();
        conTimeout = setTimeout(() => {
            con?.release();
            con = undefined;
            conTimeout = undefined;
        }, 30000);
    } else if (conTimeout) conTimeout.refresh();
    try {
        const [results] = <mysql.RowDataPacket[][]>await con.query(req.body.query);
        res.json(results);
    } catch (err) {
        res.sendStatus(500);
        console.error(err);
    }
});

app.listen(4269, () => console.log("API Ready!"));