const Discord = require("discord.js");
const iiu = require("is-image-url");
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");
const { genPermMsg, ID, color } = require("../../function");
var panelEmoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "⏹"],
  welcomeEmoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "⬅", "⏹"],
  yesNo = ["1️⃣", "2️⃣", "⬅", "⏹"],
  leaveEmoji = ["1️⃣", "2️⃣", "⬅", "⏹"];

module.exports = {
  name: "config",
  description: "Generate a token for logging into the Configuration Panel.",
  usage: "[subcommand]",
  subcommands: ["new", "panel"],
  subdesc: ["Generates a new token for the server.", "Opens the Configuration Panel."],
  category: 1,
  permission: 32,
  channelPermission: 8192,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "token", "Retrieves the token of the server."),
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "new", "Generates a new token for the server."),
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "panel", "Configures the server settings.")
  ]),
  async slash(client, interaction, args) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("Direct messages is not configurable.");
    const { member, guild, channel, author } = await InteractionResponse.createFakeMessage(client, interaction);
    if (!member.permissions.has(this.permission)) return InteractionResponse.sendMessage(genPermMsg(this.permission, 0));
    if (!channel.permissionsFor(guild.me).has(this.channelPermission)) return InteractionResponse.sendMessage(genPermMsg(this.channelPermission, 1));
    if (args[0].name === "panel") return InteractionResponse.sendMessage("Initializing configuration panel...");
    const config = NorthClient.storage.guilds[guild.id];
    const generated = await ID();
    try {
      await author.send(`Created token for guild - **${guild.name}**\nToken: \`${generated}\``);
      if (!config) {
        NorthClient.storage.guilds[guild.id] = { token: generated };
        await client.pool.query(`INSERT INTO servers (id, autorole, giveaway, token) VALUES ('${guild.id}', '[]', '🎉', '${generated}')`);
      } else if (config.token && args[0].name !== "new") await author.send(`Token was created for **${guild.name}** before.\nToken: \`${config.token}\``);
      else {
        NorthClient.storage.guilds[guild.id].token = generated;
        await client.pool.query(`UPDATE servers SET token = '${generated}' WHERE id = '${guild.id}'`);
      }
      return InteractionResponse.ackknowledge();
    } catch (err) {
      NorthClient.storage.error(err);
      return InteractionResponse.reply(member.id, "there was an error trying to update the token! This token will be temporary.");
    }
  },
  async postSlash(client, interaction, args) {
    if (!interaction.guild_id) return;
    const message = await InteractionResponse.createFakeMessage(client, interaction);
    if (!message.member.permissions.has(this.permission)) return;
    if (!message.channel.permissionsFor(message.guild.me).has(this.channelPermission)) return;
    if (args[0].name !== "panel") return;
    return await this.panel(message);
  },
  async execute(message, args) {
    if (!message.guild) return await message.channel.send("Direct messages is not configurable.");
    if (!message.member.permissions.has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
    if (!message.channel.permissionsFor(message.guild.me).has(this.channelPermission)) return message.channel.send(genPermMsg(this.channelPermission, 1));
    const guild = message.guild;
    const config = NorthClient.storage.guilds[guild.id];
    if (args[0] === "panel") return await this.panel(message);
    const generated = await ID();
    try {
      await message.author.send(`Created token for guild - **${guild.name}**\nToken: \`${generated}\``);
      if (!config) {
        NorthClient.storage.guilds[guild.id] = { token: generated };
        await message.pool.query(`INSERT INTO servers (id, autorole, giveaway, token) VALUES ('${guild.id}', '[]', '🎉', '${generated}')`);
      } else if (config.token && args[0] !== "new") await message.author.send(`Token was created for **${guild.name}** before.\nToken: \`${config.token}\``);
      else {
        NorthClient.storage.guilds[guild.id].token = generated;
        await message.pool.query(`UPDATE servers SET token = '${generated}' WHERE id = '${guild.id}'`);
      }
    } catch (err) {
      message.reply("there was an error trying to update the token! This token will be temporary.");
      NorthClient.storage.error(err);
    }
  },
  async panel(message) {
    var config = NorthClient.storage.guilds[message.guild.id];
    const msgFilter = x => x.author.id === message.author.id;
    const filter = (reaction, user) => welcomeEmoji.includes(reaction.emoji.name) && user.id === message.author.id && !user.bot;
    const login = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(message.guild.name + "'s Configuration Panel")
      .setDescription("Please login with the token.")
      .setTimestamp()
      .setFooter("Please enter within 60 seconds.", message.client.user.displayAvatarURL());
    var mesg = await message.channel.send(login);
    const loginToken = await message.channel.awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] });
    if (!loginToken.first() || !loginToken.first().content) return timedOut();
    const receivedToken = loginToken.first().content;
    loginToken.first().delete();
    if (config.token == receivedToken) {
      login.setDescription("Invalid token.").setFooter("Try again when you have the correct one for your server.", message.client.user.displayAvatarURL());
      return await mesg.edit(login);
    }
    const panelEmbed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(message.guild.name + "'s Configuration Panel")
      .setDescription("Please choose an option to configure:\n\n1️⃣ Welcome Message\n2️⃣ Leave Message\n3️⃣ Giveaway Emoji\n⏹ Quit")
      .setTimestamp()
      .setFooter("Try again when you have the correct one for your server.", message.client.user.displayAvatarURL());
    return await mesg.edit(login);
    function end(msg) {
      panelEmbed.setDescription("Panel shutted down.").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      msg.edit(panelEmbed);
      return msg.reactions.removeAll().catch(NorthClient.storage.error);
    }

    function timedOut(msg) {
      panelEmbed.setDescription("Panel timed out.").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      msg.edit(panelEmbed);
      return msg.reactions.removeAll().catch(NorthClient.storage.error);
    }

    async function start(msg) {
      panelEmbed.setDescription("Please choose an option to configure:\n\n1️⃣ Welcome Message\n2️⃣ Leave Message\n3️⃣ Boost Message\n4️⃣ Giveaway Emoji\n⏹ Quit")
        .setFooter("Please choose within 60 seconds.", message.client.user.displayAvatarURL());
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(NorthClient.storage.error);
      for (var i = 0; i < panelEmoji.length; i++) await msg.react(panelEmoji[i]);
      const collected = await msg.awaitReactions(filter, { idle: 6e4, max: 1 });
      if (!collected.first()) return timedOut();

      const reaction = collected.first();
      let receivedID = panelEmoji.indexOf(reaction.emoji.name);
      if (receivedID == 0) return await welcome(msg);
      if (receivedID == 1) return await leave(msg);
      if (receivedID == 2) return await boost(msg);
      if (receivedID == 3) return await giveaway(msg);
      if (receivedID == 4) return await end(msg);
    }

    async function welcome(msg) {
      panelEmbed.setDescription("**Welcome Message**\nPlease choose an option to configure:\n\n1️⃣ Message\n2️⃣ Channel\n3️⃣ Image\n4️⃣ Autorole\n⬅ Back\n⏹ Quit")
        .setFooter("Please choose within 60 seconds.", message.client.user.displayAvatarURL());
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(NorthClient.storage.error);
      for (var i = 0; i < welcomeEmoji.length; i++) await msg.react(welcomeEmoji[i]);
      const collected = await msg.awaitReactions(filter, { idle: 6e4, max: 1 });
      if (!collected.first()) return timedOut();

      const reaction = collected.first();
      let receivedID = welcomeEmoji.indexOf(reaction.emoji.name);
      if (receivedID == 0) return await welcomeMsg(msg);
      if (receivedID == 1) return await welcomeChannel(msg);
      if (receivedID == 2) return await welcomeImage(msg);
      if (receivedID == 3) return await welcomeAutorole(msg);
      if (receivedID == 4) return await start(msg);
      if (receivedID == 5) return await end(msg);
    }

    async function welcomeMsg(msg) {
      panelEmbed.setDescription("**Welcome Message/Message**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter("Please choose within 60 seconds.", message.client.user.displayAvatarURL());
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(NorthClient.storage.error);
      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msg.awaitReactions(filter, { idle: 6e4, max: 1 });
      if (!collected.first()) return await timedOut();
      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Welcome Message/Message/Set**\nPlease enter the Welcome Message in this channel.")
          .setFooter("Please enter within 2 minutes.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        const msgCollected = await msg.channel.awaitMessages(msgFilter, { idle: 120000, max: 1, error: ["time"] })
        if (!msgCollected.first() || !msgCollected.first().content) return timedOut();
        const contents = msgCollected.first().content.replace(/'/g, "\\'");
        msgCollected.first().delete();
        try {
          config.welcome.message = contents;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET welcome = '${contents}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Welcome Message/Message/Set**\nMessage received! Returning to panel main page in 3 seconds...");
        } catch (err) {
          NorthClient.storage.error(err);
          panelEmbed.setDescription("**Welcome Message/Message/Set**\nFailed to update message! Returning to panel main page in 3 seconds...");
        }
        panelEmbed.setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        setTimeout(() => start(msg), 3000);
      } else if (receivedID == 1) {
        panelEmbed.setDescription("**Welcome Message/Message/Reset**\nResetting...")
          .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        try {
          config.welcome.message = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET welcome = NULL WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Welcome Message/Message/Reset**\nWelcome Message was reset! Returning to panel main page in 3 seconds...");
        } catch (err) {
          NorthClient.storage.error(err);
          panelEmbed.setDescription("**Welcome Message/Message/Reset**\nFailed to reset message! Returning to panel main page in 3 seconds...");
        }
        panelEmbed.setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        setTimeout(() => start(msg), 3000);
      } else if (receivedID == 2) return await welcome(msg);
      else if (receivedID == 3) return await end(msg);
    }

    async function welcomeChannel(msg) {
      panelEmbed.setDescription("**Welcome Message/Channel**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter("Please choose within 60 seconds.", message.client.user.displayAvatarURL());
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(NorthClient.storage.error);
      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msg.awaitReactions(filter, { idle: 6e4, max: 1 });
      if (!collected.first()) return await timedOut();
      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Welcome Message/Channel/Set**\nPlease mention the Welcome Channel in this channel.")
          .setFooter("Please enter within 60 seconds.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        const msgCollected = await msg.channel.awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] });
        if (!msgCollected.first()) return await timedOut(msg);
        const channelID = msgCollected.first().content.replace(/<#/g, "").replace(/>/g, "");
        msgCollected.first().delete();
        const channel = msg.guild.channels.resolve(channelID);
        if (!channel) {
          panelEmbed.setDescription("**Welcome Message/Channel/Set**\nThe channel is not valid! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          return setTimeout(() => start(msg), 3000);
        }
        try {
          config.welcome.channel = channelID;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET wel_channel = '${channelID}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Welcome Message/Channel/Set**\nChannel received! Returning to panel main page in 3 seconds...");
        } catch (err) {
          NorthClient.storage.error(err);
          panelEmbed.setDescription("**Welcome Message/Channel/Set**\nFailed to update channel! Returning to panel main page in 3 seconds...");
        }
        panelEmbed.setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        setTimeout(() => start(msg), 3000);
      } else if (receivedID == 1) {
        panelEmbed.setDescription("**Welcome Message/Channel/Reset**\nResetting...")
          .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        try {
          config.welcome.channel = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET wel_channel = NULL WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Welcome Message/Channel/Reset**\nWelcome Channel received! Returning to panel main page in 3 seconds...");
        } catch (err) {
          NorthClient.storage.error(err);
          panelEmbed.setDescription("**Welcome Message/Channel/Reset**\nFailed to reset channel! Returning to panel main page in 3 seconds...");
        }
        await msg.edit(panelEmbed);
        setTimeout(() => start(msg), 3000);
      } else if (receivedID == 2) return await welcome(msg);
      else if (receivedID == 3) return await end(msg);
    }

    async function welcomeImage(msg) {
      panelEmbed.setDescription("**Welcome Message/Image**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter("Please choose within 60 seconds.", message.client.user.displayAvatarURL());
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(NorthClient.storage.error);
      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msg.awaitReactions(filter, { idle: 6e4, max: 1 });
      if (!collected.first()) return await timedOut();
      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Welcome Message/Image/Set**\nPlease paste the Welcome Image or its link in this channel.")
          .setFooter("Please enter within 60 seconds.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        const msgCollected = await msg.channel.awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] });
        if (!msgCollected.first()) return await timedOut(msg);
        await msgCollected.first().delete();
        const attachment = [];
        if (msgCollected.first().content) attachment.concat(msgCollected.first().content.split(/\n+/).filter(att => iiu(att)));
        if (msgCollected.first().attachments.size > 0) attachment.concat(msgCollected.first().attachments.array.map(att => att.url).filter(att => iiu(att)));
        if (attachment.length < 1) {
          panelEmbed.setDescription("**Welcome Message/Image/Set**\nNo image attachment was found! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          return setTimeout(() => start(msg), 3000);
        }
        const con = await message.pool.getConnection();
        try {
          var urls = attachment;
          if (config.welcome.image) {
            try {
              const old = JSON.parse(config.welcome.image);
              urls = old.concat(attachment);
            } catch (err) {
              if (iiu(config.welcome.image)) urls.push(config.welcome.image);
            }
          }
          config.welcome.image = urls;
          NorthClient.storage.guilds[message.guild.id] = config;
          con.query(`UPDATE servers SET wel_img = '${JSON.stringify(urls)}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Welcome Message/Image/Set**\nImage received! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          NorthClient.storage.error(err);
          await message.reply("there was an error trying to update the configuration!");
        }
        con.release();
      }
      if (receivedID == 1) {
        panelEmbed.setDescription("**Welcome Message/Image/Reset**\nResetting...")
          .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        try {
          config.welcome.image = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query("UPDATE servers SET wel_img = NULL WHERE id = " + message.guild.id);
          panelEmbed.setDescription("**Welcome Message/Image/Set**\nImage received! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 2) return await welcome(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function welcomeAutorole(msg) {
      panelEmbed.setDescription("**Welcome Message/Autorole**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter("Please choose within 60 seconds.", message.client.user.displayAvatarURL());
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(NorthClient.storage.error);
      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msgawaitReactions(filter, { idle: 6e4, max: 1 });
      if (!collected.first()) return await timedOut();
      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Welcome Message/Autorole/Set**\nPlease mention the roles or its ID in this channel.")
          .setFooter("Please enter within 60 seconds.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);

        const msgCollected = await msg.channel.awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] });
        if (!msgCollected.first()) return await timedOut(msg);
        await msgCollected.first().delete();
        const collectedArgs = msgCollected.first().content ? msgCollected.first().content.split(/ +/) : ["this is not a number"];
        var roles = [];
        msgCollected.first().delete();

        for (var i = 0; i < collectedArgs.length; i++) {
          if (isNaN(parseInt(collectedArgs[i].replace(/<@&/g, "").replace(/>/g, "")))) {
            panelEmbed.setDescription("**Welcome Message/Autorole/Set**\nOne of the roles is not valid! Returning to panel main page in 3 seconds...")
              .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
            await msg.edit(panelEmbed);
            setTimeout(() => start(msg), 3000);
          }
          roles.push(collectedArgs[i].replace(/<@&/g, "").replace(/>/g, ""));
        }
        try {
          config.welcome.autorole = JSON.stringify(roles);
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET autorole = '${JSON.stringify(roles)}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Welcome Message/Autorole/Set**\nRoles received! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          NorthClient.storage.error(err);
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 1) {
        panelEmbed.setDescription("**Welcome Message/Autorole/Reset**\nResetting...")
          .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        try {
          config.welcome.autorole = "[]";
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query("UPDATE servers SET autorole = '[]' WHERE id = " + message.guild.id);
          panelEmbed.setDescription("**Welcome Message/Autorole/Reset**\nAutorole was reset! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          NorthClient.storage.error(err);
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 2) return await welcome(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function leave(msg) {
      panelEmbed.setDescription("**Leave Message**\nPlease choose an option to configure:\n\n1️⃣ Message\n2️⃣ Channel\n⬅ Back\n⏹ Quit")
        .setFooter("Please choose within 60 seconds.", message.client.user.displayAvatarURL());
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(NorthClient.storage.error);
      for (var i = 0; i < leaveEmoji.length; i++) await msg.react(leaveEmoji[i]);
      const collected = await msgawaitReactions(filter, { idle: 6e4, max: 1 });
      if (!collected.first()) return await timedOut();
      const reaction = collected.first();
      let receivedID = leaveEmoji.indexOf(reaction.emoji.name);
      if (receivedID == 0) return await leaveMsg(msg);
      if (receivedID == 1) return await leaveChannel(msg);
      if (receivedID == 2) return await start(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function leaveMsg(msg) {
      panelEmbed.setDescription("**Leave Message/Message**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter("Please choose within 60 seconds.", message.client.user.displayAvatarURL());
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(NorthClient.storage.error);
      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msgawaitReactions(filter, { idle: 6e4, max: 1 });
      if (!collected.first()) return await timedOut();
      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Leave Message/Message/Set**\nPlease enter the Leave Message in this channel.")
          .setFooter("Please enter within 120 seconds.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        const msgCollected = await msg.channel.awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] });
        if (!msgCollected.first()) return await timedOut(msg);
        await msgCollected.first().delete();
        const contents = msgCollected.first().content ? `'${msgCollected.first().content.replace(/'/g, "\\'")}'` : "NULL";
        try {
          config.leave.message = contents;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET leave_msg = ${contents} WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Leave Message/Message/Set**\nMessage received! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          NorthClient.storage.error(err);
          await message.reply("there was an error trying to update the configuration!");
        }
      }

      if (receivedID == 1) {
        panelEmbed.setDescription("**Leave Message/Message/Reset**\nResetting...")
          .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        try {
          config.leave.message = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query("UPDATE servers SET leave_msg = NULL WHERE id = " + message.guild.id);
          panelEmbed.setDescription("**Leave Message/Message/Reset**\nLeave Message was reset! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          NorthClient.storage.error(err);
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 2) return await leave(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function leaveChannel(msg) {
      panelEmbed.setDescription("**Leave Message/Channel**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter("Please choose within 60 seconds.", message.client.user.displayAvatarURL());
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(NorthClient.storage.error);

      for (var i = 0; i < yesNo.length; i++)  await msg.react(yesNo[i]);

      const collected = await msgawaitReactions(filter, { idle: 6e4, max: 1 });
      if (!collected.first()) return await timedOut();

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Leave Message/Channel/Set**\nPlease mention the Leave Channel in this channel.")
          .setFooter("Please enter within 60 seconds.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        const msgCollected = await msg.channel.awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] });
        if (!msgCollected.first()) return await timedOut(msg);
        await msgCollected.first().delete();
        const channelID = msgCollected.first().content ? msgCollected.first().content.replace(/<#/g, "").replace(/>/g, "") : "";
        const channel = msg.guild.channels.resolve(channelID);
        if (!channel) {
          panelEmbed.setDescription("**Leave Message/Channel/Set**\nThe channel is not valid! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        }
        try {
          config.leave.channel = channelID;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET leave_channel = '${channelID}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Leave Message/Channel/Set**\nChannel received! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 1) {
        panelEmbed.setDescription("**Leave Message/Channel/Reset**\nResetting...")
          .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        try {
          config.leave.channel = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET leave_channel = NULL WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Leave Message/Channel/Reset**\nLeave Channel was reset! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 2) return await leave(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function giveaway(msg) {
      panelEmbed.setDescription("**Giveaway Emoji**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter("Please choose within 60 seconds.", message.client.user.displayAvatarURL());
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(NorthClient.storage.error);

      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msgawaitReactions(filter, { idle: 6e4, max: 1 });
      if (!collected.first()) return await timedOut();

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Giveaway Emoji/Set**\nPlease enter the Giveaway Emoji you preferred in this channel.")
          .setFooter("Please enter within 60 seconds.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        const msgCollected = await msg.channel.awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] });
        if (!msgCollected.first()) return await timedOut(msg);
        await msgCollected.first().delete();
        const newEmo = msgCollected.first().content ? msgCollected.first().content : "🎉";
        try {
          config.giveaway = newEmo;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET giveaway = '${newEmo}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Giveaway Emoji/Set**\nEmoji received! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 1) {
        panelEmbed.setDescription("**Giveaway Emoji/Reset**\nResetting...")
          .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        try {
          config.giveaway = "🎉";
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET giveaway = '🎉' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Giveaway Emoji/Reset**\nGiveaway Emoji was reset! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 2) return await start(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function boost(msg) {
      panelEmbed.setDescription("**Boost Message**\nPlease choose an option to configure:\n\n1️⃣ Message\n2️⃣ Channel\n⬅ Back\n⏹ Quit")
        .setFooter("Please choose within 60 seconds.", message.client.user.displayAvatarURL());
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(NorthClient.storage.error);
      for (var i = 0; i < leaveEmoji.length; i++) await msg.react(leaveEmoji[i]);
      const collected = await msgawaitReactions(filter, { idle: 6e4, max: 1 });
      if (!collected.first()) return await timedOut();

      const reaction = collected.first();
      let receivedID = leaveEmoji.indexOf(reaction.emoji.name);
      if (receivedID == 0) return await boostMsg(msg);
      if (receivedID == 1) return await boostChannel(msg);
      if (receivedID == 2) return await start(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function boostMsg(msg) {
      panelEmbed.setDescription("**Boost Message/Message**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter("Please choose within 60 seconds.", message.client.user.displayAvatarURL());
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(NorthClient.storage.error);
      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msgawaitReactions(filter, { idle: 6e4, max: 1 });
      if (!collected.first()) return await timedOut();

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Boost Message/Message/Set**\nPlease enter the Boost Message in this channel.")
          .setFooter("Please enter within 120 seconds.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        const msgCollected = await msg.channel.awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] });
        if (!msgCollected.first()) return await timedOut(msg);
        await msgCollected.first().delete();
        const contents = msgCollected.first().content ? `'${msgCollected.first().content.replace(/'/g, "\\'")}'` : "NULL";
        try {
          config.boost.message = contents;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET boost_msg = ${contents} WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Boost Message/Message/Set**\nMessage received! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }

      if (receivedID == 1) {
        panelEmbed.setDescription("**Boost Message/Message/Reset**\nResetting...")
          .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        try {
          config.boost.message = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET boost_msg = NULL WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Boost Message/Message/Reset**\nLeave Message was reset! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 2) return await boost(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function boostChannel(msg) {
      panelEmbed.setDescription("**Boost Message/Channel**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter("Please choose within 60 seconds.", message.client.user.displayAvatarURL());
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(NorthClient.storage.error);

      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msgawaitReactions(filter, { idle: 6e4, max: 1 });
      if (!collected.first()) return await timedOut();

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Boost Message/Channel/Set**\nPlease mention the Boost Channel in this channel.")
          .setFooter("Please enter within 60 seconds.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        const msgCollected = await msg.channel.awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] });
        if (!msgCollected.first()) return await timedOut(msg);
        await msgCollected.first().delete();

        const channelID = msgCollected.first().content ? msgCollected.first().content.replace(/<#/g, "").replace(/>/g, "") : "";
        const channel = msg.guild.channels.resolve(channelID);
        if (!channel) {
          panelEmbed.setDescription("**Boost Message/Channel/Set**\nThe channel is not valid! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        }
        try {
          config.boost.channel = channelID;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET boost_channel = '${channelID}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Boost Message/Channel/Set**\nChannel received! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 1) {
        panelEmbed.setDescription("**Boost Message/Channel/Reset**\nResetting...")
          .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(NorthClient.storage.error);
        try {
          config.boost.channel = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await message.pool.query(`UPDATE servers SET boost_channel = NULL WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Boost Message/Channel/Reset**Boost Channel was reset! Returning to panel main page in 3 seconds...")
            .setFooter("Please wait patiently.", msg.client.user.displayAvatarURL());
          await msg.edit(panelEmbed);
          setTimeout(() => start(msg), 3000);
        } catch (err) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 2) return await boost(msg);
      if (receivedID == 3) return await end(msg);
    }
  }
};
