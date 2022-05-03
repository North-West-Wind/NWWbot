
import { GuildMember } from "discord.js";
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { checkTradeW1nd, fixGuildRecord, genPermMsg, query, syncTradeW1nd } from "../../function.js";

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
        if (!NorthClient.storage.guilds[guild.id]) await fixGuildRecord(guild.id);
        NorthClient.storage.guilds[guild.id].prefix = interaction.options.getString("prefix");
        await interaction.deferReply();
        try {
            await query(`UPDATE configs SET prefix = ${NorthClient.storage.guilds[guild.id].prefix === interaction.client.prefix ? "NULL" : `'${NorthClient.storage.guilds[guild.id].prefix}'`} WHERE id = '${guild.id}'`);
            await interaction.editReply(`The prefix of this server has been changed to \`${NorthClient.storage.guilds[guild.id].prefix}\`.`);
            try {
                if (await checkTradeW1nd(interaction.guildId)) {
                    await syncTradeW1nd(interaction.guildId);
                    await interaction.followUp("Synced changes to TradeW1nd!");
                }
            } catch (err) { }
        } catch (err: any) {
            console.error(err);
            await interaction.editReply("There was an error trying to save the changes! The change of the prefix will be temporary!");
        }
    }

    async run(message: NorthMessage, args: string[]) {
        if (!args[0]) return await message.channel.send(`The prefix of this server is \`${message.prefix}\`. Use \`${message.prefix}prefix [prefix]\` to change the prefix.`);
        if (!message.member.permissions.has(BigInt(32))) return await message.channel.send(genPermMsg(32, 0));
        if (!NorthClient.storage.guilds[message.guildId]) await fixGuildRecord(message.guildId);
        NorthClient.storage.guilds[message.guildId].prefix = args.join(" ");
        await message.channel.send(`The prefix of this server has been changed to \`${NorthClient.storage.guilds[message.guildId].prefix}\`.`);
        try {
            await query(`UPDATE configs SET prefix = ${NorthClient.storage.guilds[message.guildId].prefix === message.client.prefix ? "NULL" : `'${NorthClient.storage.guilds[message.guild.id].prefix}'`} WHERE id = '${message.guild.id}'`);
            await message.channel.send("Changes have been saved properly!");
            try {
                if (await checkTradeW1nd(message.guildId)) {
                    await syncTradeW1nd(message.guildId);
                    await message.channel.send("Synced changes to TradeW1nd!");
                }
            } catch (err) { }
        } catch (err: any) {
            console.error(err);
            await message.reply("There was an error trying to save the changes! The change of the prefix will be temporary!");
        }
    }
}

const cmd = new PrefixCommand();
export default cmd;