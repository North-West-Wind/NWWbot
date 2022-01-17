import { RowDataPacket } from "mysql2";
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import { genPermMsg, createEmbedScrolling, color, msgOrRes } from "../../function";

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
      return await interaction.reply({ embeds: [allEmbeds[0]] });
    } else if (sub === "me") {
      const author = interaction.user;
      if (!interaction.guild.me.permissions.has(BigInt(32))) return interaction.reply(genPermMsg(32, 1));
      const em = await this.createMyInvitesEmbed(interaction.guild, author, interaction.client);
      return await interaction.reply({ embeds: [em] });
    } else if (sub === "toggle") {
      await interaction.deferReply();
      await this.toggle(interaction);
    }
  }

  async run(message: NorthMessage, args: string[]) {
    if (!args[0]) {
      if (!message.guild.me.permissions.has(BigInt(32))) return message.channel.send(genPermMsg(32, 1));
      const allEmbeds = await this.createInvitesEmbed(message.guild, message.client);
      if (allEmbeds.length > 1) await createEmbedScrolling(message, allEmbeds);
      else await message.channel.send({ embeds: [allEmbeds[0]] });
    } else if (args[0].toLowerCase() === "me") {
      if (!message.guild.me.permissions.has(BigInt(32))) return message.channel.send(genPermMsg(32, 1));
      const em = await this.createMyInvitesEmbed(message.guild, message.author, message.client);
      await message.channel.send({ embeds: [em] });
    } else if (args[0].toLowerCase() === "toggle") {
      await this.toggle(message);
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
        .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
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
          .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
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
      .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
    return em;
  }

  async toggle(message: NorthMessage | NorthInteraction) {
    const author = message instanceof Discord.Message ? message.author : message.user;
    try {
      const con = await message.client.pool.getConnection();
      const [result] = <RowDataPacket[][]>await con.query(`SELECT no_log FROM users WHERE id = '${author.id}'`);
      var nolog: boolean;
      if (result.length < 1) {
        await con.query(`INSERT INTO users(id, items) VALUES('${author.id}', '{}')`);
        nolog = false;
      } else {
        nolog = !!result[0].no_log;
      }
      if (nolog) {
        await con.query(`UPDATE users SET no_log = 1 WHERE id = '${author.id}'`);
        if (NorthClient.storage.noLog.indexOf(author.id) == -1) NorthClient.storage.noLog.push(author.id);
        await msgOrRes(message, "You will no longer receive message from me when someone joins the server with your invites.");
      } else {
        await con.query(`UPDATE users SET no_log = 0 WHERE id = '${author.id}'`);
        if (NorthClient.storage.noLog.indexOf(author.id) != -1) NorthClient.storage.noLog.splice(NorthClient.storage.noLog.indexOf(author.id), 1);
        await msgOrRes(message, "We will message you whenever someone joins the server with your invites.");
      }
      con.release();
    } catch (err) {
      console.error(err);
      await msgOrRes(message, "There was an error trying to remember your decision!");
    }
  }
};

const cmd = new InvitesCommand();
export default cmd;