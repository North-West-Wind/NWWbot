import { RowDataPacket } from "mysql2";
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import { genPermMsg, createEmbedScrolling, color } from "../../function";

class InvitesCommand implements SlashCommand {
  name = "invites"
  description = "Display information about users invited on the server."
  usage = "[subcommand]"
  subcommands = ["me", "toggle"]
  aliases = ["inv"]
  category = 4
  options = [
      {
          name: "server",
          description: "Displays server invites.",
          type: "SUB_COMMAND"
      },
      {
          name: "me",
          description: "Displays invites of yours.",
          type: "SUB_COMMAND"
      },
      {
          name: "toggle",
          description: "Toggles whether or not the bot should notify you when a user uses your invite.",
          type: "SUB_COMMAND"
      }
  ]

  async execute(interaction: NorthInteraction) {
    const sub = interaction.options.getSubcommand();
    if (sub !== "toggle" && !interaction.guild) return await interaction.reply("This subcommand only works on server.");
    if (sub === "server") {
      if (!interaction.guild.me.permissions.has(BigInt(32))) return await interaction.reply(genPermMsg(32, 1));
      const allEmbeds = await this.createInvitesEmbed(interaction.guild, interaction.client, true);
      return await interaction.reply({embeds: [allEmbeds[0]]});
    } else if (sub === "me") {
      const author = interaction.user;
      if (!interaction.guild.me.permissions.has(BigInt(32))) return interaction.reply(genPermMsg(32, 1));
      const em = await this.createMyInvitesEmbed(interaction.guild, author, interaction.client);
      return await interaction.reply({embeds: [em]});
    } else if (sub === "toggle") {
        const author = interaction.user;
      try {
        const [result] = <RowDataPacket[][]> await interaction.client.pool.query(`SELECT * FROM nolog WHERE id = '${author.id}'`);
        if (result.length < 1) {
          await interaction.client.pool.query(`INSERT INTO nolog VALUES('${author.id}')`);
          if (NorthClient.storage.noLog.indexOf(author.id) == -1) NorthClient.storage.noLog.push(author.id);
          return await interaction.reply("You will no longer receive message from me when someone joins the server with your invites.");
        } else {
          interaction.client.pool.query(`DELETE FROM nolog WHERE id = '${author.id}'`);
          if (NorthClient.storage.noLog.indexOf(author.id) != -1) NorthClient.storage.noLog.splice(NorthClient.storage.noLog.indexOf(author.id), 1);
          return await interaction.reply("We will message you whenever someone joins the server with your invites.");
        }
      } catch(err) {
        console.error(err);
        return await interaction.reply("There was an error trying to remember your decision!");
      }
    }
  }

  async run(message: NorthMessage, args: string[]) {
    if (!args[0]) {
      if (!message.guild.me.permissions.has(BigInt(32))) return message.channel.send(genPermMsg(32, 1));
      const allEmbeds = await this.createInvitesEmbed(message.guild, message.client);
      if (allEmbeds.length > 1) await createEmbedScrolling(message, allEmbeds);
      else await message.channel.send({embeds: [allEmbeds[0]]});
    } else if (args[0].toLowerCase() === "me") {
      if (!message.guild.me.permissions.has(BigInt(32))) return message.channel.send(genPermMsg(32, 1));
      const em = await this.createMyInvitesEmbed(message.guild, message.author, message.client);
      await message.channel.send({embeds: [em]});
    } else if (args[0].toLowerCase() === "toggle") {
      const con = await message.pool.getConnection();
      try {
        var [result] = <RowDataPacket[][]> await con.query(`SELECT * FROM nolog WHERE id = '${message.author.id}'`);
        if (result.length < 1) {
          await con.query(`INSERT INTO nolog VALUES('${message.author.id}')`);
          if (NorthClient.storage.noLog.indexOf(message.author.id) == -1) NorthClient.storage.noLog.push(message.author.id);
          message.channel.send("You will no longer receive message from me when someone joins the server with your invites.");
        } else {
          con.query(`DELETE FROM nolog WHERE id = '${message.author.id}'`);
          if (NorthClient.storage.noLog.indexOf(message.author.id) != -1) NorthClient.storage.noLog.splice(NorthClient.storage.noLog.indexOf(message.author.id), 1);
          await message.channel.send("We will message you whenever someone joins the server with your invites.");
        }
      } catch(err) {
        console.error(err);
        await message.reply("there was an error trying to remember your decision!");
      }
      con.release()
    } else await message.channel.send(`That is not a subcommand! Subcommands: **${this.subcommands.join(", ")}**`);
  }

  async createInvitesEmbed(guild: Discord.Guild, client: NorthClient, oneOnly = false) {
    const members = Array.from((await guild.members.fetch()).values());
    const invitedStr = [];
    const guildInvites = await guild.invites.fetch();
    for (const member of members) {
      const invites = guildInvites.filter(i => i.inviter.id === member.id && i.guild.id === guild.id);
      const reducer = (a, b) => a + b;
      var uses = 0;
      if (invites.size > 0) uses = invites.map(i => (i.uses ? i.uses : 0)).reduce(reducer);
      if (uses == 0) continue;
      invitedStr.push({ text: `**${uses} users** from **${member.user.tag}**`, uses });
    }
    const compare = (a, b) => -(a.uses - b.uses);
    invitedStr.sort(compare);
    if (oneOnly || invitedStr.length <= 10) {
      const em = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle("Number of users invited")
        .setDescription(invitedStr.map(x => x.text).join("\n"))
        .setTimestamp()
        .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
      return [em];
    } else {
      const pages = Math.ceil(invitedStr.length / 10);
      const allEmbeds = [];
      for (let i = 0; i < pages; i++) {
        const em = new Discord.MessageEmbed()
          .setColor(color())
          .setTitle(`Number of users invited (Page ${i + 1}/${pages})`)
          .setDescription(invitedStr.slice(i * 10, (i * 10) + 10).map(x => x.text).join("\n"))
          .setTimestamp()
          .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
        allEmbeds.push(em);
      }
      return allEmbeds;
    }
  }

  async createMyInvitesEmbed(guild: Discord.Guild, author: Discord.User, client: Discord.Client) {
    let guildInvites = await guild.invites.fetch();
    const invites = guildInvites.filter(i => i.inviter.id === author.id && i.guild.id === guild.id);
    const reducer = (a, b) => a + b;
    var uses = invites.map(i => i.uses ? i.uses : 0).reduce(reducer);
    let em = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(`Number of users invited (${author.tag})`)
      .setDescription(`In server **${guild.name}**`)
      .addField("Invited Users", uses.toString(), true)
      .addField("Links Created", invites.size.toString(), true)
      .setTimestamp()
      .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
    return em;
  }
};

const cmd = new InvitesCommand();
export default cmd;