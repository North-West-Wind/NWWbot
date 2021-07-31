import { RowDataPacket } from "mysql2";
import { Interaction } from "slashcord/dist/Index";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import { genPermMsg, findUser, color } from "../../function";

class UnWarnCommand implements SlashCommand {
    name = "unwarn"
    description = "Remove all warnings of a member of the server."
    usage = "<user | user ID>"
    category = 1
    args = 1
    permissions = 4
    options = [{
        name: "user",
        description: "The user to unwarn.",
        required: true,
        type: 6
    }]

    async execute(obj: { interaction: Interaction, args: any[], client: NorthClient }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        const author = obj.interaction.member;
        const guild = obj.interaction.guild;
        if (!author.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 0));
        if (!guild.me.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 1));
        const user = await obj.client.users.fetch(obj.args[0].value);
        const embeds = this.unwarnEmbeds(guild, author.user, user);
        const [results] = <RowDataPacket[][]>await obj.client.pool.query(`SELECT * FROM warn WHERE user = '${user.id}' AND guild = '${guild.id}'`);
        if (results.length == 0) return await obj.interaction.reply("This user haven't been warned before.");
        else try {
            await obj.client.pool.query(`DELETE FROM warn WHERE user = '${user.id}' AND guild = '${guild.id}'`);
            user.send(embeds[0]).catch(() => { });
            return await obj.interaction.reply(embeds[1]);
        } catch (err) {
            return await obj.interaction.reply(embeds[2]);
        }
    }

    async run(message: NorthMessage, args: string[]) {
        if (!message.member.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
        if (!message.guild.me.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 1));
        const user = await findUser(message, args[0]);
        if (!user) return;
        const con = await message.pool.getConnection();
        const embeds = this.unwarnEmbeds(message.guild, message.author, user);
        var [results] = <RowDataPacket[][]>await con.query(`SELECT * FROM warn WHERE user = '${user.id}' AND guild = '${message.guild.id}'`);
        if (results.length == 0) await message.channel.send("This user haven't been warned before.");
        else try {
            await con.query(`DELETE FROM warn WHERE user = '${user.id}' AND guild = '${message.guild.id}'`);
            user.send(embeds[0]).catch(() => { });
            await message.channel.send(embeds[1]);
        } catch (err) {
            await message.channel.send(embeds[2]);
        }
        con.release();
    }

    unwarnEmbeds(guild, author, user) {
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