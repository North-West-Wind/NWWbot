import { Permissions, TextChannel } from "discord.js";
import { Command, NorthMessage } from "../classes/NorthClient";

var timeout;

export async function all(command: Command, message: NorthMessage, args: string[]) {
    if (command.args && args.length < command.args) {
        await message.channel.send(`The command \`${message.prefix}${command.name}\` requires ${command.args} arguments.\nHere's how you are supposed to use it: \`${message.prefix}${command.name}${command.usage ? ` ${command.usage}` : ""}\``);
        return false;
    }
    if (command.category === 10 && message.author.id != process.env.DC) {
        await message.channel.send("Please don't use Dev Commands.");
        return false;
    }
    if (message.guild && !(<TextChannel>message.channel).permissionsFor(message.guild.me).has(84992)) {
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
}
export async function managements(_command: Command, message: NorthMessage) {
    if (!message.guild) {
        await message.channel.send("You can only use management commands in server!");
        return false;
    }
    return true;
}
export async function moderator(_command: Command, message: NorthMessage) {
    if (!message.guild) {
        await message.channel.send("You can only use moderator commands in server!");
        return false;
    }
    return true;
}
export async function music(_command: Command, message: NorthMessage) {
    if (!message.guild) {
        await message.channel.send("You can only use music commands in server!");
        return false;
    }
    return true;
}
export async function nsfw(_command: Command, message: NorthMessage) {
    if (message.guild && !(<TextChannel>message.channel).nsfw) {
        await message.channel.send("Please use an NSFW channel to use this command!");
        return false;
    }
    return true;
}
export async function dev(_command: Command, message: NorthMessage) {
    if (message.author.id != process.env.DC) return false;
    return true;
}