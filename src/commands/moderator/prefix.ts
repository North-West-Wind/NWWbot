import { Interaction } from "slashcord/dist/Index";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg } from "../../function";

class PrefixCommand implements SlashCommand {
    name = "prefix"
    description = "Change the prefix of the server."
    usage = "[prefix]"
    category = 1
    aliases = ["pre"]
    permission = 32
    options = [{
        name: "prefix",
        description: "A new prefix.",
        required: false,
        type: 3
    }]

    async execute(obj: { interaction: Interaction, args: any[], client: NorthClient }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        const guild = obj.interaction.guild;
        const member = obj.interaction.member;
        if (!obj.args[0]?.value) return await obj.interaction.reply(`The prefix of this server is \`${NorthClient.storage.guilds[guild.id].prefix || obj.client.prefix}\`. Use \`/prefix [prefix]\` to change the prefix.`);
        if (!member.hasPermission(this.permission)) return await obj.interaction.reply(genPermMsg(this.permission, 0));
        NorthClient.storage.guilds[guild.id].prefix = obj.args[0].value;
        try {
            await obj.client.pool.query(`UPDATE servers SET prefix = ${NorthClient.storage.guilds[guild.id].prefix === obj.client.prefix ? "NULL" : `'${NorthClient.storage.guilds[guild.id].prefix}'`} WHERE id = '${guild.id}'`);
            await obj.interaction.reply(`The prefix of this server has been changed to \`${NorthClient.storage.guilds[guild.id].prefix}\`.`);
        } catch (err) {
            NorthClient.storage.error(err);
            await obj.interaction.reply("there was an error trying to save the changes! The change of the prefix will be temporary!");
        }
    }

    async run(message: NorthMessage, args: string[]) {
        if (!args[0]) return await message.channel.send(`The prefix of this server is \`${message.prefix}\`. Use \`${message.prefix}prefix [prefix]\` to change the prefix.`);
        if (!message.member.hasPermission(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
        NorthClient.storage.guilds[message.guild.id].prefix = args.join(" ");
        await message.channel.send(`The prefix of this server has been changed to \`${NorthClient.storage.guilds[message.guild.id].prefix}\`.`);
        try {
            await message.pool.query(`UPDATE servers SET prefix = ${NorthClient.storage.guilds[message.guild.id].prefix === message.client.prefix ? "NULL" : `'${NorthClient.storage.guilds[message.guild.id].prefix}'`} WHERE id = '${message.guild.id}'`);
            await message.channel.send("Changes have been saved properly!");
        } catch (err) {
            NorthClient.storage.error(err);
            await message.reply("there was an error trying to save the changes! The change of the prefix will be temporary!");
        }
    }
}

const cmd = new PrefixCommand();
export default cmd;