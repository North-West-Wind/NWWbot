var mc = require('minecraft-protocol');
var mclient;
const { wait } = require("../function");
const { NorthClient } = require("../classes/NorthClient.js");

module.exports = {
    name: "afk",
    description: "AFK in Minecraft server.",
    subcommands: ["start", "stop"],
    subdesc: ["Start the AFK.", "Stop the AFK."],
    category: 10,
    async execute(message, args) {
        switch (args[0]) {
            case "start":
                return await this.start(message);
            case "stop":
                return await this.stop(message);
        }
    },
    async start(message) {
        if (mclient) return await message.channel.send("Client started already!");
        mclient = mc.createClient({
            host: process.env.HOST,
            port: 25565,
            username: process.env.USER,
            password: process.env.PASS,
            auth: 'mojang'
        });
        mclient.on("kick_disconnect", async () => {
            await wait(3000);
            mclient = mc.createClient({
                host: process.env.HOST,
                port: 25565,
                username: process.env.USER,
                password: process.env.PASS,
                auth: 'mojang'
            });
            NorthClient.storage.log("Reconnected");
        });
        await message.channel.send("Client started!");
    },
    async stop(message) {
        if (!mclient) return await message.channel.send("Client stopped already!");
        mclient.end();
        mclient = undefined;
        await message.channel.send("Client stopped!");
    }
}