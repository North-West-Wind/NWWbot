const { twoDigits } = require("./function.js");
const fs = require("fs");
const { registerFont } = require("canvas");
const { NorthClient } = require("./classes/NorthClient.js");
const mysql = require("mysql2");
const { updateQueue, getQueues } = require("./musics/main.js");
const { Card } = require("./classes/Card.js");
const mysql_config = {
    connectTimeout: 60 * 60 * 1000,
    connectionLimit: 1000,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPW,
    database: process.env.DBNAME,
    supportBigNumbers: true,
    charset: "utf8mb4",
    waitForConnections: true,
    queueLimit: 0
};

module.exports = (...clients) => {
    const fontFiles = fs.readdirSync("./fonts").filter(file => file.endsWith(".ttf") && file.startsWith("NotoSans"));
    for (const file of fontFiles) registerFont(`./fonts/${file}`, { family: "NotoSans", style: file.split(/[\-\.]/)[1].toLowerCase() });
    registerFont("./fonts/FreeSans.ttf", { family: "free-sans" });

    for (let i = 0; i < 4; i++) for (let s = 0; s < 13; s++) NorthClient.storage.card.set(twoDigits(i) + twoDigits(s), new Card(i, s));
    NorthClient.storage.card.set("0413", new Card(4, 13));
    NorthClient.storage.card.set("0414", new Card(4, 14));

    const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
    const musicCommandFiles = fs.readdirSync("./musics").filter(file => file.endsWith(".js") && !file.startsWith("main"));
    const itemFiles = fs.readdirSync("./items").filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        NorthClient.storage.commands.set(command.name, command);
    }
    for (const file of musicCommandFiles) {
        const command = require(`./musics/${file}`);
        NorthClient.storage.commands.set(command.name, command);
    }
    for (const file of itemFiles) {
        const item = require(`./items/${file}`);
        NorthClient.storage.items.set(item.name.toLowerCase(), item);
    }
    var pool = mysql.createPool(mysql_config).promise();
    pool.on("connection", con => con.on("error", async err => {
        if (["PROTOCOL_CONNECTION_LOST", "ECONNREFUSED", "ETIMEDOUT"].includes(err.code) || (err.message === "Pool is closed.")) try {
            await pool.end();
        } catch (err) {
            NorthClient.storage.error(err);
        } finally {
                pool = mysql.createPool(mysql_config).promise();
                clients.forEach(c => c.pool = pool);
                const queue = getQueues();
                for (const [id, serverQueue] of queue) {
                    serverQueue.pool = pool;
                    await updateQueue(id, serverQueue, null);
                }
            }
    }));
    clients.forEach(c => c.pool = pool);
}