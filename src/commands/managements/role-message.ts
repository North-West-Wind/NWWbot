import { GuildMember, Message, MessageEmbed, Snowflake, TextChannel } from "discord.js";

import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { genPermMsg, findRole, msgOrRes, query, findChannel } from "../../function.js";

class RoleMessageCommand implements SlashCommand {
    name = "role-message"
    description = "Creates messages for users to react and join roles. Delete the message to disable a message."
    aliases = ["role-msg", "rm"]
    category = 0
    permissions = { guild: { user: 268435456, me: 268435456 } }

    async execute(interaction: NorthInteraction) {
        await this.create(interaction);
    }

    async run(message: NorthMessage) {
        await this.create(message);
    }

    async create(message: NorthMessage | NorthInteraction) {
        const results = await query(`SELECT guild FROM rolemsg WHERE guild = '${message.guildId}'`);
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
        const channel = await findChannel(message.guild, channelID);
        if (!channel || !(channel instanceof TextChannel)) return msg.edit(channelID + " isn't a valid channel!");
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
                const role = await findRole(message.guild, stri);
                if (!role) {
                    await message.channel.send(`No role was found with \`${stri}\`!`);
                    continue;
                }
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
        await this.directCreate(message, pendingMsg, channel, author.id, roles, emojis, results.length);
    }

    async directCreate(message: NorthMessage | NorthInteraction, msg: string, channel: TextChannel, authorId: Snowflake, roles: Snowflake[][], emojis: string[], totalRm: number) {
        emojis = emojis.map(emoji => emoji.replace(/ +/g, ""));
        const roleIndexes = new MessageEmbed()
            .setTitle("Role Index")
            .addField("Reaction", emojis.join("\n"), true)
            .addField("Role(s)", roles.map(roless => roless.map(r => `<@&${r}>`)).join("\n"), true)
            .setTimestamp()
            .setFooter({ text: "React to claim your role.", iconURL: message.client.user.displayAvatarURL() });
        var mesg = await channel.send({ content: msg, embeds: [roleIndexes] });
        try {
            for (const emoji of emojis) await mesg.react(emoji);
        } catch (err: any) {
            await mesg.delete();
            return await msgOrRes(message, "I cannot react with one of the reactions!");
        }
        NorthClient.storage.rm.push({
            id: mesg.id,
            guild: message.guild.id,
            channel: channel.id,
            author: authorId,
            roles: roles,
            emojis: emojis
        });
        try {
            await query(`INSERT INTO rolemsg VALUES('${mesg.id}', '${message.guild.id}', '${channel.id}', '${authorId}', '${escape(JSON.stringify(roles))}', '${escape(JSON.stringify(emojis))}')`);
            await message.channel.send(`Successfully created record for message. Role-messages used on this server: **${totalRm}/5**`);
        } catch (err: any) {
            console.error(err);
            await message.reply("there was an error trying to record the message!");
        }

    }
}

const cmd = new RoleMessageCommand();
export default cmd;