const { Permissions } = require("discord.js");
var timeout;

module.exports = {
    async all(command, message, args) {
        if (command.name === "guild" && message.client.id != 1) return false;
        if (command.args && args.length < command.args) {
            await message.channel.send(`The command \`${message.prefix}${command.name}\` requires ${command.args} arguments.\nHere's how you are supposed to use it: \`${message.prefix}${command.name}${command.usage ? ` ${command.usage}` : ""}\``);
            return false;
        }
        if (command.category === 10 && message.author.id != process.env.DC) {
            await message.channel.send("Please don't use Dev Commands.");
            return false;
        }
        if (message.guild && !(message.channel).permissionsFor(message.guild.me).has(84992)) {
            await message.author.send(`I need at least the permissions to \`${new Permissions(84992).toArray().join("`, `")}\` in order to run any command! Please tell your server administrator about that.`);
            return false;
        }
        if (message.client.id == 0) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = undefined;
            } else message.client.user.setPresence({ activity: { name: `${message.author.username}'s Commands`, type: "WATCHING" }, status: "online", afk: false });
            timeout = setTimeout(() => {
                message.client.user.setPresence({ activity: { name: "AFK", type: "PLAYING" }, status: "idle", afk: true });
                timeout = undefined;
            }, 10000);
        }
        return true;
    },
    async music(_command, message) {
        if (!message.guild) {
            await message.channel.send("You can only use music commands in server!");
            return false;
        }
        return true;
    },
    async nsfw(_command, message) {
        if (!message.channel.nsfw) {
            await message.channel.send("Please use an NSFW channel to use this command!");
            return false;
        }
        return true;
    }
}