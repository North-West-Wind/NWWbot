
import { GuildMember } from "discord.js";
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg } from "../../function";

class PrefixCommand implements SlashCommand {
    name = "prefix"
    description = "Change the prefix of the server."
    usage = "[prefix]"
    category = 1
    aliases = ["pre"]
    options = [{
        name: "prefix",
        description: "A new prefix.",
        required: false,
        type: "STRING"
    }]

    async execute(interaction: NorthInteraction) {
        if (!interaction.guild) return await interaction.reply("This command only works on server.");
        const guild = interaction.guild;
        const member = <GuildMember> interaction.member;
        if (!interaction.options.getString("prefix")) return await interaction.reply(`The prefix of this server is \`${NorthClient.storage.guilds[guild.id].prefix || interaction.client.prefix}\`. Use \`/prefix [prefix]\` to change the prefix.`);
        if (!member.permissions.has(BigInt(32))) return await interaction.reply(genPermMsg(32, 0));
        NorthClient.storage.guilds[guild.id].prefix = interaction.options.getString("prefix");
        await interaction.deferReply();
        try {
            await interaction.client.pool.query(`UPDATE servers SET prefix = ${NorthClient.storage.guilds[guild.id].prefix === interaction.client.prefix ? "NULL" : `'${NorthClient.storage.guilds[guild.id].prefix}'`} WHERE id = '${guild.id}'`);
            await interaction.editReply(`The prefix of this server has been changed to \`${NorthClient.storage.guilds[guild.id].prefix}\`.`);
        } catch (err: any) {
            console.error(err);
            await interaction.editReply("There was an error trying to save the changes! The change of the prefix will be temporary!");
        }
    }

    async run(message: NorthMessage, args: string[]) {
        if (!args[0]) return await message.channel.send(`The prefix of this server is \`${message.prefix}\`. Use \`${message.prefix}prefix [prefix]\` to change the prefix.`);
        if (!message.member.permissions.has(BigInt(32))) return await message.channel.send(genPermMsg(32, 0));
        NorthClient.storage.guilds[message.guild.id].prefix = args.join(" ");
        await message.channel.send(`The prefix of this server has been changed to \`${NorthClient.storage.guilds[message.guild.id].prefix}\`.`);
        try {
            await message.pool.query(`UPDATE servers SET prefix = ${NorthClient.storage.guilds[message.guild.id].prefix === message.client.prefix ? "NULL" : `'${NorthClient.storage.guilds[message.guild.id].prefix}'`} WHERE id = '${message.guild.id}'`);
            await message.channel.send("Changes have been saved properly!");
        } catch (err: any) {
            console.error(err);
            await message.reply("There was an error trying to save the changes! The change of the prefix will be temporary!");
        }
    }
}

const cmd = new PrefixCommand();
export default cmd;