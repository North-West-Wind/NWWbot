import { GuildMember, Message, MessageEmbed, Role, Snowflake, TextChannel } from "discord.js";

import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg, findRole, msgOrRes } from "../../function";
import { globalClient as client } from "../../common";
import { RowDataPacket } from "mysql2";

class RoleMessageCommand implements SlashCommand {
    name = "role-message"
    description = "Manage messages for users to react and join a role. Deleting the message will cancel the role-message."
    usage = "<subcommand>"
    subcommands = ["create"]
    subdesc = ["Create a role-message."]
    subusage = [null, "<subcommand> <ID>"]
    subaliases = ["cr", "re"]
    aliases = ["role-msg", "rm"]
    category = 0
    args = 1
    permissions = { guild: { user: 268435456, me: 268435456 } }
    options = [
        {
            name: "create",
            description: "Create a new role-message.",
            type: "SUB_COMMAND"
        }
    ];

    async execute(interaction: NorthInteraction) {
        const sub = interaction.options.getSubcommand();
        if (sub === "create") return await this.create(interaction);
    }

    async run(message: NorthMessage, args: string[]) {
        if (args[0] === "create" || args[0] === "cr") return await this.create(message);
    }

    async create(message: NorthMessage | NorthInteraction) {
        const [results] = <RowDataPacket[][]> await message.pool.query(`SELECT guild FROM rolemsg WHERE guild = '${message.guildId}'`);
        if (results.length > 5) return await msgOrRes(message, "You already have 5 role-messages! Try deleting some for this to work!");
        const author = message.member.user;
        var msg = <Message> (message instanceof Message ? await message.channel.send("Please enter the message you want to send.") : await message.reply({ content: "Please enter the message you want to send.", fetchReply: true }));
        const collected = await message.channel.awaitMessages({ filter: x => x.author.id === author.id, time: 120000, max: 1 });
        if (!collected.first()) return await msg.edit("Did not receive any message in time! Action cancelled.");
        await collected.first().delete();
        const pendingMsg = collected.first().content;
        if (!pendingMsg) return await msg.edit("Did not receive any message! Action cancelled.");
        if (pendingMsg === "cancel") return await msg.edit("Action cancelled.");
        await msg.edit("Message received.\n\nNow, please tell me where you want the message to go to by mentioning the channel.");
        const collected2 = await message.channel.awaitMessages({ filter: x => x.author.id === author.id, time: 30000, max: 1 });
        if (!collected2.first()) return msg.edit("30 seconds have passed but you didn't mention any channel! Action cancelled.");
        await collected2.first().delete();
        if (!collected2.first().content) return await msg.edit("Did not receive any channel! Action cancelled.");
        if (collected2.first().content === "cancel") return await msg.edit("Action cancelled.");
        const channelID = collected2.first().content.replace(/<#/g, "").replace(/>/g, "");
        const channel = <TextChannel> await client.channels.fetch(channelID);
        if (!channel) return msg.edit(channelID + " isn't a valid channel!");
        if (!channel.permissionsFor(message.guild.me).has(BigInt(10240))) return await msg.edit(genPermMsg(10240, 1));
        if (!channel.permissionsFor(<GuildMember> message.member).has(BigInt(10240))) return await msg.edit(genPermMsg(10240, 0));
        await msg.edit(`Great! The channel will be <#${channel.id}>.\n\nAfter that, can you tell me what role you are giving the users? Please break a line for each role.`);
        const collected3 = await message.channel.awaitMessages({ filter: x => x.author.id === author.id, time: 60000, max: 1 });
        if (!collected3.first()) return await msg.edit("Did not receive any role in time! Action cancelled.");
        await collected3.first().delete();
        if (!collected3.first().content) return await msg.edit("Did not receive any role! Action cancelled.");
        if (collected3.first().content === "cancel") return msg.edit("Action cancelled.");
        if (collected3.first().content === "no") return msg.edit("Hey! That's rude!");
        const roles: Snowflake[][] = [];
        for (const str of collected3.first().content.split("\n")) {
            const roless: Snowflake[] = [];
            for (const stri of str.split(/ +/).filter(x => !!x)) {
                const role = await findRole(message, stri);
                if (!role) continue;
                const highest = message.guild.me.roles.highest.position;
                if (role.position > highest) return await msg.edit("I cannot assign this role to users.");
                roless.push(role.id);
            }
            roles.push(roless);
        }
        await msg.edit(`**${roles.length}** role${roles.length > 1 ? "s" : ""} received.\n\nAt last, you will need to provide the reactions/emojis you want for each role! Break a line for each of them.`);
        const collected4 = await message.channel.awaitMessages({ filter: x => x.author.id === author.id, time: 60000, max: 1 });
        if (!collected4.first()) return await msg.edit("Did not receive any emoji in time! Action cancelled.");
        await collected4.first().delete();
        if (!collected4.first().content) return await msg.edit("Did not receive any emoji! Action cancelled.");
        if (collected4.first().content === "cancel") return await msg.edit("Action cancelled.");
        var emojis = collected4.first().content.split("\n");
        emojis = emojis.map(emoji => emoji.replace(/ +/g, ""));
        const roleIndexes = new MessageEmbed()
            .setTitle("Role Index")
            .addField("Reaction", emojis.join("\n"), true)
            .addField("Role(s)", roles.map(roless => roless.map(r => `<@&${r}>`)).join("\n"), true)
            .setTimestamp()
            .setFooter("React to claim your role.", message.client.user.displayAvatarURL());
        var mesg = await channel.send({ content: pendingMsg, embeds: [roleIndexes] });
        try {
            for (const emoji of emojis) {
                console.log(emoji);
                await mesg.react(emoji);
            }
        } catch (err: any) {
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
            roles: roles,
            emojis: emojis
        });
        try {
            await client.pool.query(`INSERT INTO rolemsg VALUES('${mesg.id}', '${message.guild.id}', '${channel.id}', '${author.id}', '${escape(JSON.stringify(roles))}', '${escape(JSON.stringify(emojis))}')`);
            await message.channel.send(`Successfully created record for message. Role-messages used on this server: **${results.length}/5**`);
        } catch (err: any) {
            console.error(err);
            await message.reply("there was an error trying to record the message!");
        }
    }
}

const cmd = new RoleMessageCommand();
export default cmd;