import * as dotenv from "dotenv";
import express from "express";
import * as mysql from "mysql2";
import { PoolConnection } from "mysql2/promise";
import * as DCBots from "discord-user-bots";
import { wait } from "./function.js";

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
var pool = mysql.createPool(mysql_config).promise();
var con: PoolConnection;
var conTimeout: NodeJS.Timeout;

const client = new DCBots.Client(process.env.TOKEN_U);
client.on.message_create = async(message: any) => {
    if (message.author.id != process.env.GBID) return;
    const msg = (await client.fetch_messages(2, process.env.CHANNEL_U))[1];
    if (msg.author.id != client.user.id) return;
    const [ command, name ] = msg.content.split(" ");
    switch (<string> command) {
        case "g.pf":
            if (message.embeds.length || !message.attachments[0]?.url) profiles[name] = { found: false };
            else profiles[name] = { found: true, url: message.attachments[0].url };
            break;
        case "g.clan":
            if (message.embeds.length || !message.content) clans[name] = { found: false };
            else clans[name] = { found: true, url: message.content };
            break;
    }
}
const profiles = {};
const clans = {};

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

app.get("/api/krunker/profile/:username", async(req, res) => {
    await client.send(process.env.CHANNEL_U, { content: `g.pf ${req.params.username}` });
    var timeout = 0;
    async function check() {
        await wait(100);
        timeout += 100;
        if (timeout >= 10000) res.sendStatus(404);
        else if (!profiles[req.params.username]) await check();
        else {
            res.json(profiles[req.params.username]);
            console.log(`Returned profile ${req.params.username} in time`);
            delete profiles[req.params.username];
        }
    }
    await check();
});

app.get("/api/krunker/clan/:name", async (req, res) => {
    await client.send(process.env.CHANNEL_U, { content: `g.clan ${req.params.name}` });
    var timeout = 0;
    async function check() {
        await wait(100);
        timeout += 100;
        if (timeout >= 10000) res.sendStatus(404);
        else if (!clans[req.params.name]) await check();
        else {
            res.json(clans[req.params.name]);
            console.log(`Returned clan ${req.params.name} in time`);
            delete clans[req.params.name];
        }
    }
    await check();
});

app.listen(4269, () => console.log("API Ready!"));