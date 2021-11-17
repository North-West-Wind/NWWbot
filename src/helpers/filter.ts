import { GuildMember, Message, Permissions, TextChannel } from "discord.js";
import { Command, NorthClient, NorthInteraction, NorthMessage } from "../classes/NorthClient";
import { checkTradeW1nd, genPermMsg, getFetch, getOwner, msgOrRes } from "../function";
const fetch = getFetch();
var timeout: NodeJS.Timeout;

export async function all(command: Command, message: NorthMessage | NorthInteraction, args: string[] = []) {
    if (message instanceof Message) {
        if (command.args && args.length < command.args) {
            await msgOrRes(message, `The command \`${message.prefix}${command.name}\` requires ${command.args} arguments.\nHere's how you are supposed to use it: \`${message.prefix}${command.name}${command.usage ? ` ${command.usage}` : ""}\``);
            return false;
        }
        if (message.guild && !(<TextChannel>message.channel).permissionsFor(message.guild.me).has(BigInt(84992))) {
            await message.author.send(`I need at least the permissions to \`${new Permissions(BigInt(84992)).toArray().join("`, `")}\` in order to run any command! Please tell your server administrator about that.`);
            return false;
        }
    }
    if (command.permissions && message.guild) {
        if (command.permissions.guild) {
            if (command.permissions.guild.user && !(<GuildMember> message.member).permissions.has(BigInt(command.permissions.guild.user))) {
                await msgOrRes(message, genPermMsg(command.permissions.guild.user, 0));
                return false;
            }
            if (command.permissions.guild.me && !message.guild.me.permissions.has(BigInt(command.permissions.guild.me))) {
                await msgOrRes(message, genPermMsg(command.permissions.guild.me, 1));
                return false;
            }
        }
        if (command.permissions.channel) {
            if (command.permissions.channel.user && !(<TextChannel> message.channel).permissionsFor(<GuildMember> message.member).has(BigInt(command.permissions.channel.user))) {
                await msgOrRes(message, genPermMsg(command.permissions.channel.user, 0));
                return false;
            }
            if (command.permissions.channel.me && !(<TextChannel> message.channel).permissionsFor(message.guild.me).has(BigInt(command.permissions.channel.me))) {
                await msgOrRes(message, genPermMsg(command.permissions.channel.me, 1));
                return false;
            }
        }
    }
    if (message.client.id == 0) {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        } else message.client.user.setPresence({ activities: [{ name: `${(message instanceof Message ? message.author : message.user).username}'s Commands`, type: "WATCHING" }], status: "online", afk: false });
        timeout = setTimeout(() => {
            message.client.user.setPresence({ activities: [{ name: "AFK", type: "PLAYING" }], status: "idle", afk: true });
            timeout = undefined;
        }, 10000);
    }
    return true;
}
export async function managements(_command: Command, message: NorthMessage | NorthInteraction) {
    if (!message.guild) {
        await msgOrRes(message, "You can only use management commands in server!");
        return false;
    }
    return true;
}
export async function moderator(_command: Command, message: NorthMessage | NorthInteraction) {
    if (!message.guild) {
        await msgOrRes(message, "You can only use moderator commands in server!");
        return false;
    }
    return true;
}
export async function music(_command: Command, message: NorthMessage | NorthInteraction) {
    if (!message.guild) {
        await msgOrRes(message, "You can only use music commands in server!");
        return false;
    }
    try {
        if (await checkTradeW1nd(message.guild.id)) return false;
    } catch (err) {}
    return true;
}
export async function nsfw(_command: Command, message: NorthMessage | NorthInteraction) {
    if (message.guild) {
        if (NorthClient.storage.guilds[message.guild.id].safe) {
            const msg = await msgOrRes(message, "Safe mode is ON!");
            setTimeout(async () => { try { await msg.delete(); } catch (err) {} }, 10000);
            return false;
        }
        if (!(<TextChannel>message.channel).nsfw) {
            await msgOrRes(message, "Please use an NSFW channel to use this command!");
            return false;
        }
    }
    return true;
}
export async function dev(_command: Command, message: NorthMessage | NorthInteraction) {
    if ((message instanceof Message ? message.author : message.user).id != await getOwner()) {
        await msgOrRes(message, "Please don't use Dev Commands.");
        return false;
    }
    return true;
}
