import { RowDataPacket } from "mysql2";

import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import { findUser, color } from "../../function";

class UnWarnCommand implements SlashCommand {
    name = "unwarn"
    description = "Remove all warnings of a member of the server."
    usage = "<user | user ID>"
    category = 1
    args = 1
    permissions = { guild: { user: 4, me: 4 } }
    options = [{
        name: "user",
        description: "The user to unwarn.",
        required: true,
        type: "USER"
    }]

    async execute(interaction: NorthInteraction) {
        if (!interaction.guild) return await interaction.reply("This command only works on server.");
        const guild = interaction.guild;
        const user = interaction.options.getUser("user");
        const embeds = this.unwarnEmbeds(guild, interaction.user, user);
        const [results] = <RowDataPacket[][]>await interaction.client.pool.query(`SELECT * FROM warn WHERE user = '${user.id}' AND guild = '${guild.id}'`);
        if (results.length == 0) return await interaction.reply("This user haven't been warned before.");
        else try {
            await interaction.client.pool.query(`DELETE FROM warn WHERE user = '${user.id}' AND guild = '${guild.id}'`);
            user.send({embeds: [embeds[0]]}).catch(() => { });
            return await interaction.reply({embeds: [embeds[1]]});
        } catch (error) {
            return await interaction.reply({embeds: [embeds[2]]});
        }
    }

    async run(message: NorthMessage, args: string[]) {
        const user = await findUser(message, args[0]);
        if (!user) return;
        const con = await message.pool.getConnection();
        const embeds = this.unwarnEmbeds(message.guild, message.author, user);
        var [results] = <RowDataPacket[][]>await con.query(`SELECT * FROM warn WHERE user = '${user.id}' AND guild = '${message.guild.id}'`);
        if (results.length == 0) await message.channel.send("This user haven't been warned before.");
        else try {
            await con.query(`DELETE FROM warn WHERE user = '${user.id}' AND guild = '${message.guild.id}'`);
            user.send({embeds: [embeds[0]]}).catch(() => { });
            await message.channel.send({embeds: [embeds[1]]});
        } catch (error) {
            await message.channel.send({embeds: [embeds[2]]});
        }
        con.release();
    }

    unwarnEmbeds(guild: Discord.Guild, author: Discord.User, user: Discord.User) {
        const warningEmbed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle(`Your warnings have been cleared`)
            .setDescription(`In **${guild.name}**`)
            .setTimestamp()
            .setFooter("Cleared by " + author.tag, author.displayAvatarURL());
        const warnSuccessfulEmbed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle("User Successfully Unwarned!")
            .setDescription(`Unwarned **${user.tag}** in server **${guild.name}**.`);
        const warnFailureEmbed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle("Failed to removing warning!")
            .setDescription(`Failed to unwarn **${user.tag}** in server **${guild.name}**.`);
        return [warningEmbed, warnSuccessfulEmbed, warnFailureEmbed];
    }
}

const cmd = new UnWarnCommand();
export default cmd;