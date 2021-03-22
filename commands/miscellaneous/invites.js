const Discord = require("discord.js");
const { createEmbedScrolling, color, genPermMsg } = require("../../function.js");
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");

module.exports = {
  name: "invites",
  description: "Display information about users invited on the server.",
  usage: "[subcommand]",
  subcommands: ["me", "toggle"],
  aliases: ["inv"],
  category: 4,
  permissions: 32,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "server", "Displays server invites."),
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "me", "Displays invites of yours."),
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "toggle", "Toggles whether or not the bot should DM you when a user uses your invite.")
  ]),
  async slash(client, interaction, args) {
    if (args[0].name !== "toggle" && !interaction.guild_id) return InteractionResponse.sendMessage("This subcommand only works on server.");
    if (args[0].name === "server") {
      const guild = await client.guilds.fetch(interaction.guild_id);
      if (!guild.me.hasPermission(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 1));
      const allEmbeds = await this.createInvitesEmbed(message.guild, message.client, true);
      return InteractionResponse.sendEmbeds(allEmbeds[0]);
    } else if (args[0].name === "me") {
      const guild = await client.guilds.fetch(interaction.guild_id);
      const author = await client.users.fetch(interaction.member.user.id);
      if (!guild.me.hasPermission(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 1));
      const em = await this.createMyInvitesEmbed(guild, author, client);
      return InteractionResponse.sendEmbeds(em);
    } else if (args[0].name === "toggle") {
      const { author } = await InteractionResponse.createFakeMessage(client, interaction);
      try {
        const [result] = await client.pool.query(`SELECT * FROM nolog WHERE id = '${message.author.id}'`);
        if (result.length < 1) {
          await client.pool.query(`INSERT INTO nolog VALUES('${author.id}')`);
          if (NorthClient.storage.noLog.indexOf(author.id) == -1) NorthClient.storage.noLog.push(author.id);
          return InteractionResponse.sendMessage("You will no longer receive message from me when someone joins the server with your invites.");
        } else {
          client.pool.query(`DELETE FROM nolog WHERE id = '${author.id}'`);
          if (NorthClient.storage.noLog.indexOf(author.id) != -1) NorthClient.storage.noLog.splice(NorthClient.storage.noLog.indexOf(author.id), 1);
          return InteractionResponse.sendMessage("We will message you whenever someone joins the server with your invites.");
        }
      } catch(err) {
        NorthClient.storage.error(err);
        return InteractionResponse.reply(author.id, "there was an error trying to remember your decision!");
      }
    }
  },
  async execute(message, args) {
    if (!args[0]) {
      if (!message.guild.me.hasPermission(this.permissions)) return message.channel.send(genPermMsg(this.permissions, 1));
      const allEmbeds = await this.createInvitesEmbed(message.guild, message.client);
      if (allEmbeds.length > 1) await createEmbedScrolling(message, allEmbeds);
      else await message.channel.send(allEmbeds[0]);
    } else if (args[0].toLowerCase() === "me") {
      if (!message.guild.me.hasPermission(this.permissions)) return message.channel.send(genPermMsg(this.permissions, 1));
      const em = await this.createMyInvitesEmbed(message.guild, message.author, message.client);
      await message.channel.send(em);
    } else if (args[0].toLowerCase() === "toggle") {
      const con = await message.pool.getConnection();
      try {
        var [result] = await con.query(`SELECT * FROM nolog WHERE id = '${message.author.id}'`);
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
        NorthClient.storage.error(err);
        await message.reply("there was an error trying to remember your decision!");
      }
      con.release()
    } else await message.channel.send(`That is not a subcommand! Subcommands: **${this.subcommands.join(", ")}**`);
  },
  async createInvitesEmbed(guild, client, oneOnly = false) {
    const members = Array.from((await guild.members.fetch()).values());
    const invitedStr = [];
    const guildInvites = await guild.fetchInvites();
    for (const member of members) {
      const invites = await guildInvites.filter(i => i.inviter.id === member.id && i.guild.id === guild.id);
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
  },
  async createMyInvitesEmbed(guild, author, client) {
    let guildInvites = await guild.fetchInvites();
    const invites = guildInvites.filter(i => i.inviter.id === author.id && i.guild.id === guild.id);
    const reducer = (a, b) => a + b;
    var uses = invites.map(i => i.uses ? i.uses : 0).reduce(reducer);
    let em = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(`Number of users invited (${author.tag})`)
      .setDescription(`In server **${guild.name}**`)
      .addField("Invited Users", uses, true)
      .addField("Links Created", invites.size, true)
      .setTimestamp()
      .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
  }
};
