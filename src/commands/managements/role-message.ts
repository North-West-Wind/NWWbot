import { Message, TextChannel } from "discord.js";
import moment from "moment";
import { Interaction } from "slashcord/dist/Index";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { setTimeout_, genPermMsg, findRole } from "../../function";
import { globalClient as client } from "../../common";
import { RowDataPacket } from "mysql2";

export async function expire(message, length, id) {
    setTimeout_(async () => {
        const con = await message.pool.getConnection();
        try {
            var [results] = await con.query(`SELECT expiration, channel FROM rolemsg WHERE id = '${id}'`);
            if (!results[0]) throw new Error("No results");
            const date = Date.now();
            if (results[0].expiration - date <= 0) {
                await con.query(`DELETE FROM rolemsg WHERE id = '${id}'`);
                const channel = await message.client.channels.fetch(results[0].channel);
                const msg = await channel.messages.fetch(results[0].id);
                msg.reactions.removeAll().catch(() => { });
            } else expire(message, results[0].expiration - date, id);
        } catch (err) {
            NorthClient.storage.error(err);
        }
        con.release();
    }, length);
}

class RoleMessageCommand implements SlashCommand {
    name = "role-message"
    description = "Manage messages for users to react and join a role."
    usage = "<subcommand>"
    subcommands = ["create", "refresh"]
    subdesc = ["Create a role-message.", "Refresh an existing role-message."]
    subusage = [null, "<subcommand> <ID>"]
    subaliases = ["cr", "re"]
    aliases = ["role-msg", "rm"]
    category = 0
    args = 1
    permissions = 10240
    options = [
        {
            name: "create",
            description: "Create a new role-message.",
            type: 1
        },
        {
            name: "refresh",
            description: "Refresh an existing role-message.",
            type: 1,
            options: [{
                name: "message",
                description: "The ID of the role-message.",
                required: true,
                type: 3
            }]
        }
    ];

    async execute(obj: { interaction: Interaction, args: any[] }) {
        if (obj.args[0].name === "create") return await this.create(obj.interaction);
        if (obj.args[0].name === "refresh") return await this.refresh(obj.interaction, obj.args[0].options[0].value);
    }

    async run(message: NorthMessage, args: string[]) {
        if (args[0] === "create" || args[0] === "cr") return await this.create(message);
        if (args[0] === "refresh" || args[0] === "re") return await this.refresh(message, args[1]);
    }

    async create(message: Message | Interaction) {
        if (!message.guild.me.permissions.has(268435456)) return await message.channel.send(genPermMsg(268435456, 1));
        if (!message.member.permissions.has(268435456)) return await message.channel.send(genPermMsg(268435456, 0));
        const author = message.member.user;
        var msg = <Message> (message instanceof Message ? await message.channel.send("Please enter the message you want to send.") : await message.reply("Please enter the message you want to send.", { fetchReply: true }));
        const collected = await message.channel.awaitMessages(x => x.author.id === author.id, { time: 120000, max: 1 });
        if (!collected.first()) return await msg.edit("Did not receive any message in time! Action cancelled.");
        await collected.first().delete();
        const pendingMsg = collected.first().content;
        if (!pendingMsg) return await msg.edit("Did not receive any message! Action cancelled.");
        if (pendingMsg === "cancel") return await msg.edit("Action cancelled.");
        await msg.edit("Message received.\n\nNow, please tell me where you want the message to go to by mentioning the channel.");
        const collected2 = await message.channel.awaitMessages(x => x.author.id === author.id, { time: 30000, max: 1 });
        if (!collected2.first()) return msg.edit("30 seconds have passed but you didn't mention any channel! Action cancelled.");
        await collected2.first().delete();
        if (!collected2.first().content) return await msg.edit("Did not receive any channel! Action cancelled.");
        if (collected2.first().content === "cancel") return await msg.edit("Action cancelled.");
        const channelID = collected2.first().content.replace(/<#/g, "").replace(/>/g, "");
        const channel = <TextChannel> await client.channels.fetch(channelID);
        if (!channel) return msg.edit(channelID + " isn't a valid channel!");
        if (!channel.permissionsFor(message.guild.me).has(this.permissions)) return await msg.edit(genPermMsg(this.permissions, 1));
        if (!channel.permissionsFor(message.member).has(this.permissions)) return await msg.edit(genPermMsg(this.permissions, 0));
        await msg.edit(`Great! The channel will be <#${channel.id}>.\n\nAfter that, can you tell me what role you are giving the users? Please break a line for each role.`);
        const collected3 = await message.channel.awaitMessages(x => x.author.id === author.id, { time: 60000, max: 1 });
        if (!collected3.first()) return await msg.edit("Did not receive any role in time! Action cancelled.");
        await collected3.first().delete();
        if (!collected3.first().content) return await msg.edit("Did not receive any role! Action cancelled.");
        if (collected3.first().content === "cancel") return msg.edit("Action cancelled.");
        if (collected3.first().content === "no") return msg.edit("Hey! That's rude!");
        const roles = [];
        for (const str of collected3.first().content.split("\n")) {
            const roless = [];
            for (const stri of str.split(/ +/)) {
                const role = await findRole(message, stri);
                if (!role) return;
                const highest = message.guild.me.roles.highest.position;
                if (role.position > highest) return await msg.edit("I cannot assign this role to users.");
                roless.push(role.id);
            }
            roles.push(roless);
        }
        await msg.edit(`**${roles.length}** role${roles.length > 1 ? "s" : ""} received.\n\nAt last, you will need to provide the reactions/emojis you want for each role! Break a line for each of them.`);
        const collected4 = await message.channel.awaitMessages(x => x.author.id === author.id, { time: 60000, max: 1 });
        if (!collected4.first()) return await msg.edit("Did not receive any emoji in time! Action cancelled.");
        if (!collected4.first().content) return await msg.edit("Did not receive any emoji! Action cancelled.");
        await collected4.first().delete();
        if (collected4.first().content === "cancel") return await msg.edit("Action cancelled.");
        collected4.first().delete();
        var emojis = collected4.first().content.split("\n");
        var mesg = await channel.send(pendingMsg);
        emojis.map(emoji => {
            const id = emoji.match(/\d+/g);
            if (!Array.isArray(id)) return emoji;
            else return id[id.length - 1];
        });
        try {
            for (const emoji of emojis) await mesg.react(emoji);
        } catch (err) {
            await mesg.delete();
            return await msg.edit("I cannot react with one of the reactions!");
        }
        const now = Date.now();
        const expiration = now + (7 * 24 * 3600 * 1000);
        NorthClient.storage.rm.push({
            id: mesg.id,
            guild: message.guild.id,
            channel: channel.id,
            author: author.id,
            expiration: expiration,
            roles: JSON.stringify(roles),
            emojis: JSON.stringify(emojis)
        });
        try {
            await client.pool.query(`INSERT INTO rolemsg VALUES('${mesg.id}', '${message.guild.id}', '${channel.id}', '${author.id}', '${moment(expiration).format("YYYY-MM-DD HH:mm:ss")}', '${JSON.stringify(roles)}', '${JSON.stringify(emojis)}')`);
            await message.channel.send("Successfully created record for message. The message will expire after 7 days.");
            expire(message, 7 * 24 * 3600 * 1000, mesg.id);
        } catch (err) {
            NorthClient.storage.error(err);
            await message.reply("there was an error trying to record the message!");
        }
    }

    async refresh(message: NorthMessage | Interaction, id: string) {
        const author = message.member.user;
        const con = await client.pool.getConnection();
        try {
            var [results] = <RowDataPacket[][]> await con.query(`SELECT * FROM rolemsg WHERE id = '${id}' AND guild = '${message.guild.id}' AND author = '${author.id}'`);
            if (results.length == 0) {
                if (message instanceof Message) await message.channel.send("No message was found with that ID!");
                else await message.reply("No message was found with that ID!");
            } else {
                await con.query(`UPDATE rolemsg SET expiration = '${moment(Date.now() + (7 * 24 * 3600 * 1000)).format("YYYY-MM-DD HH:mm:ss")}' WHERE id = '${results[0].id}'`);
                if (message instanceof Message) await message.channel.send("The message has been refreshed. It will last for 7 more days.");
                else await message.reply("The message has been refreshed. It will last for 7 more days.");
            }
        } catch (err) {
            NorthClient.storage.error(err);
            await message.reply("there was an error while refreshing the message!");
        }
        con.release();
    }
}

const cmd = new RoleMessageCommand();
export default cmd;