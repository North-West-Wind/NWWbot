import { ActivityType, GuildMember, Message, PermissionsBitField, TextChannel } from "discord.js";
import { Command, NorthClient, NorthInteraction, NorthMessage } from "../classes/NorthClient.js";
import { genPermMsg, getOwner, msgOrRes } from "../function.js";
let timeout: NodeJS.Timeout;

export function canReset() {
    return !timeout;
}

export async function all(command: Command, message: NorthMessage | NorthInteraction, args: string[] = []) {
    if (command.category < 0 && message.client.id !== 1) return false;
    if (message instanceof Message) {
        if (command.args && args.length < command.args) {
            await msgOrRes(message, `The command \`${message.prefix}${command.name}\` requires ${command.args} arguments.\nHere's how you are supposed to use it: \`${message.prefix}${command.name}${command.usage ? ` ${command.usage}` : ""}\``);
            return false;
        }
        if (message.guild && !(<TextChannel>message.channel).permissionsFor(message.guild.members.me).has(BigInt(84992))) {
            await message.author.send(`I need at least the permissions to \`${new PermissionsBitField(BigInt(84992)).toArray().join("`, `")}\` in order to run any command! Please tell your server administrator about that.`);
            return false;
        }
    }
    if (command.permissions && message.guild) {
        if (command.permissions.guild) {
            if (command.permissions.guild.user && !(<GuildMember> message.member).permissions.has(BigInt(command.permissions.guild.user))) {
                await msgOrRes(message, genPermMsg(command.permissions.guild.user, 0));
                return false;
            }
            if (command.permissions.guild.me && !message.guild.members.me.permissions.has(BigInt(command.permissions.guild.me))) {
                await msgOrRes(message, genPermMsg(command.permissions.guild.me, 1));
                return false;
            }
        }
        if (command.permissions.channel) {
            if (command.permissions.channel.user && !(<TextChannel> message.channel).permissionsFor(<GuildMember> message.member).has(BigInt(command.permissions.channel.user))) {
                await msgOrRes(message, genPermMsg(command.permissions.channel.user, 0));
                return false;
            }
            if (command.permissions.channel.me && !(<TextChannel> message.channel).permissionsFor(message.guild.members.me).has(BigInt(command.permissions.channel.me))) {
                await msgOrRes(message, genPermMsg(command.permissions.channel.me, 1));
                return false;
            }
        }
    }
    if (message.client.id == 0 && !process.argv.includes("--old")) {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        } else message.client.user.setPresence({ activities: [{ name: `${(message instanceof Message ? message.author : message.user).username}'s Commands`, type: ActivityType.Watching }], status: "online", afk: false });
        timeout = setTimeout(() => {
            message.client.user.setPresence({ activities: [{ name: `AFK | ${message.client.prefix}help`, type: ActivityType.Playing }], status: "idle", afk: true });
            timeout = undefined;
        }, 10000);
    }
    return true;
}
export async function managements(_command: Command, message: NorthMessage | NorthInteraction) {
    if (!message.guild) {
        await msgOrRes(message, "You can only use management commands on a server!");
        return false;
    }
    return true;
}
export async function moderator(_command: Command, message: NorthMessage | NorthInteraction) {
    if (!message.guild) {
        await msgOrRes(message, "You can only use moderator commands on a server!");
        return false;
    }
    return true;
}
export async function nsfw(_command: Command, message: NorthMessage | NorthInteraction) {
    if (message.guild) {
        const config = NorthClient.storage.guilds[message.guild.id];
        if (!config || config.safe) {
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
