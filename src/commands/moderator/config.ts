import { Message, MessageReaction, User } from "discord.js";

import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { msgOrRes, ID, color, fixGuildRecord, syncTradeW1nd, checkTradeW1nd } from "../../function";
import { globalClient as client } from "../../common";
import * as Discord from "discord.js";
import { isImageUrl } from "../../function";

const panelEmoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "⏹"],
  welcomeEmoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "⬅", "⏹"],
  yesNo = ["1️⃣", "2️⃣", "⬅", "⏹"],
  leaveEmoji = ["1️⃣", "2️⃣", "⬅", "⏹"],
  safeEmoji = ["1️⃣", "2️⃣", "⬅", "⏹"];

class ConfigCommand implements SlashCommand {
  name = "config"
  description = "Generate a token for logging into the Configuration Panel."
  usage = "[subcommand]"
  subcommands = ["new", "panel"]
  subdesc = ["Generates a new token for the server.", "Opens the Configuration Panel."]
  category = 1
  permissions = { guild: { user: 32 }, channel: { me: 8192 } }
  options = [
    {
      name: "token",
      description: "Retrieves the token of the server.",
      type: "SUB_COMMAND"
    },
    {
      name: "new",
      description: "Generates a new token for the server.",
      type: "SUB_COMMAND"
    },
    {
      name: "panel",
      description: "Configures the server settings.",
      type: "SUB_COMMAND"
    }
  ]

  async execute(interaction: NorthInteraction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "panel") return await this.panel(interaction);
    const guild = interaction.guild;
    const author = interaction.user;
    const client = interaction.client;
    var config = NorthClient.storage.guilds[guild.id];
    const generated = await ID();
    try {
      if (sub === "new" || !config?.token) await author.send(`Created token for guild - **${guild.name}**\nToken: \`${generated}\``);
      if (!config?.token) {
        if (!config) config = await fixGuildRecord(guild.id);
      } else if (sub !== "new") return await author.send(`Token was created for **${guild.name}** before.\nToken: \`${config.token}\``);
      config.token = generated;
      NorthClient.storage.guilds[guild.id] = config;
      await interaction.reply("See you in DM!");
      await client.pool.query(`UPDATE servers SET token = '${config.token}' WHERE id = '${guild.id}'`);
      return;
    } catch (err: any) {
      console.error(err);
      return await interaction.reply("There was an error trying to update the token! This token will be temporary.");
    }
  }

  async run(message: NorthMessage, args: string[]) {
    const guild = message.guild;
    var config = NorthClient.storage.guilds[guild.id];
    if (args[0] === "panel") return await this.panel(message);
    const generated = await ID();
    try {
      if (args[0] === "new" || !config?.token) await message.author.send(`Created token for guild - **${guild.name}**\nToken: \`${generated}\``);
      if (!config?.token) {
        if (!config) config = await fixGuildRecord(guild.id);
      } else if (args[0] !== "new") return await message.author.send(`Token was created for **${guild.name}** before.\nToken: \`${config.token}\``);
      config.token = generated;
      NorthClient.storage.guilds[guild.id] = config;
      await message.pool.query(`UPDATE servers SET token = '${config.token}' WHERE id = '${guild.id}'`);
    } catch (err: any) {
      message.reply("There was an error trying to update the token! This token will be temporary.");
      console.error(err);
    }
  }

  async panel(message: Message | NorthInteraction) {
    var config = NorthClient.storage.guilds[message.guildId];
    const msgFilter = (x: Message) => x.author.id === (message instanceof Message ? message.author : message.user).id;
    const filter = (reaction: MessageReaction, user: User) => panelEmoji.includes(reaction.emoji.name) && user.id === (message instanceof Message ? message.author : message.user).id && !user.bot;
    const login = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(message.guild.name + "'s Configuration Panel")
      .setDescription("Please login with the token.")
      .setTimestamp()
      .setFooter({ text: "Please enter within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
    var mesg = <Message>await msgOrRes(message, login);
    const loginToken = await message.channel.awaitMessages({ filter: msgFilter, idle: 60000, max: 1 });
    if (!loginToken.first() || !loginToken.first().content) return await end(mesg);
    const receivedToken = loginToken.first().content;
    loginToken.first().delete().catch(() => { });
    if (config.token !== receivedToken) {
      login.setDescription("Invalid token.").setFooter({ text: "Try again when you have the correct one for your server.", iconURL: message.client.user.displayAvatarURL() });
      return await mesg.edit({ embeds: [login] });
    }
    const panelEmbed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(message.guild.name + "'s Configuration Panel");
    await start(mesg);
    async function end(msg: Message) {
      panelEmbed.setDescription("Panel shutted down.").setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      msg.reactions.removeAll().catch(() => { });
      if (await checkTradeW1nd(message.guildId)) await syncTradeW1nd(message.guildId);
    }

    async function start(msg: Message) {
      panelEmbed.setDescription("Please choose an option to configure:\n\n1️⃣ Welcome Message\n2️⃣ Leave Message\n3️⃣ Boost Message\n4️⃣ Giveaway Emoji\n5️⃣ Safe Mode\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });
      for (var i = 0; i < panelEmoji.length; i++) await msg.react(panelEmoji[i]);
      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      const reaction = collected.first();
      if (!reaction) return await end(msg);
      switch(panelEmoji.indexOf(reaction.emoji.name)) {
        case 0: return await welcome(msg);
        case 1: return await leave(msg);
        case 2: return await boost(msg);
        case 3: return await giveaway(msg);
        case 4: return await safe(msg);
        default: return await end(msg);
      }
    }

    async function welcome(msg: Message) {
      panelEmbed.setDescription("**Welcome Message**\nSends a message when someone joins the server.\nPlease choose an option to configure:\n\n1️⃣ Message\n2️⃣ Channel\n3️⃣ Image\n4️⃣ Autorole\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });
      for (var i = 0; i < welcomeEmoji.length; i++) await msg.react(welcomeEmoji[i]);
      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      const reaction = collected.first();
      if (!reaction) return await end(msg);
      switch(panelEmoji.indexOf(reaction.emoji.name)) {
        case 0: return await welcomeMsg(msg);
        case 1: return await welcomeChannel(msg);
        case 2: return await welcomeImage(msg);
        case 3: return await welcomeAutorole(msg);
        case 4: return await start(msg);
        default: return await end(msg);
      }
    }

    async function welcomeMsg(msg: Message) {
      panelEmbed.setDescription("**Welcome Message/Message**\nWhat to send for the Welcome Message.\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });
      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      if (!collected.first()) return await end(msg);
      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Welcome Message/Message/Set**\nPlease enter the Welcome Message in this channel.")
          .setFooter({ text: "Please enter within 2 minutes.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        const msgCollected = await msg.channel.awaitMessages({ filter: msgFilter, idle: 120000, max: 1 })
        if (!msgCollected.first() || !msgCollected.first().content) return await end(msg);
        const contents = msgCollected.first().content.replace(/'/g, "\\'");
        msgCollected.first().delete().catch(() => { });
        try {
          config.welcome.message = contents;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET welcome = '${contents}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Welcome Message/Message/Set**\nMessage received! Returning to panel main page in 3 seconds...");
        } catch (err: any) {
          console.error(err);
          panelEmbed.setDescription("**Welcome Message/Message/Set**\nFailed to update message! Returning to panel main page in 3 seconds...");
        }
        panelEmbed.setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        setTimeout(() => start(msg), 3000);
      } else if (receivedID == 1) {
        panelEmbed.setDescription("**Welcome Message/Message/Reset**\nResetting...")
          .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        try {
          config.welcome.message = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET welcome = NULL WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Welcome Message/Message/Reset**\nWelcome Message was reset! Returning to panel main page in 3 seconds...");
        } catch (err: any) {
          console.error(err);
          panelEmbed.setDescription("**Welcome Message/Message/Reset**\nFailed to reset message! Returning to panel main page in 3 seconds...");
        }
        panelEmbed.setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        setTimeout(() => start(msg), 3000);
      } else if (receivedID == 2) return await welcome(msg);
      else if (receivedID == 3) return await end(msg);
    }

    async function welcomeChannel(msg: Message) {
      panelEmbed.setDescription("**Welcome Message/Channel**\nWhere to send the Welcome Message.\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });
      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      if (!collected.first()) return await end(msg);
      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Welcome Message/Channel/Set**\nPlease mention the Welcome Channel in this channel.")
          .setFooter({ text: "Please enter within 60 seconds.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        const msgCollected = await msg.channel.awaitMessages({ filter: msgFilter, idle: 60000, max: 1 });
        if (!msgCollected.first()) return await end(msg);
        const channelID = msgCollected.first().content.replace(/<#/g, "").replace(/>/g, "");
        msgCollected.first().delete().catch(() => { });
        const channel = msg.guild.channels.resolve(channelID);
        if (!channel) {
          panelEmbed.setDescription("**Welcome Message/Channel/Set**\nThe channel is not valid! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          return setTimeout(() => start(msg), 3000);
        }
        try {
          config.welcome.channel = channelID;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET wel_channel = '${channelID}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Welcome Message/Channel/Set**\nChannel received! Returning to panel main page in 3 seconds...");
        } catch (err: any) {
          console.error(err);
          panelEmbed.setDescription("**Welcome Message/Channel/Set**\nFailed to update channel! Returning to panel main page in 3 seconds...");
        }
        panelEmbed.setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        setTimeout(() => start(msg), 3000);
      } else if (receivedID == 1) {
        panelEmbed.setDescription("**Welcome Message/Channel/Reset**\nResetting...")
          .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        try {
          config.welcome.channel = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET wel_channel = NULL WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Welcome Message/Channel/Reset**\nWelcome Channel received! Returning to panel main page in 3 seconds...");
        } catch (err: any) {
          console.error(err);
          panelEmbed.setDescription("**Welcome Message/Channel/Reset**\nFailed to reset channel! Returning to panel main page in 3 seconds...");
        }
        await msg.edit({ embeds: [panelEmbed] });
        setTimeout(() => start(msg), 3000);
      } else if (receivedID == 2) return await welcome(msg);
      else if (receivedID == 3) return await end(msg);
    }

    async function welcomeImage(msg: Message) {
      panelEmbed.setDescription("**Welcome Message/Image**\nIncludes image(s) for the Welcome Message.\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });
      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      if (!collected.first()) return await end(msg);
      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Welcome Message/Image/Set**\nPlease paste the Welcome Image or its link in this channel.")
          .setFooter({ text: "Please enter within 60 seconds.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        const msgCollected = await msg.channel.awaitMessages({ filter: msgFilter, idle: 60000, max: 1 });
        if (!msgCollected.first()) return await end(msg);
        msgCollected.first().delete().catch(() => { });
        const attachment = [];
        if (msgCollected.first().content) attachment.concat(msgCollected.first().content.split(/\n+/).filter(att => isImageUrl(att)));
        if (msgCollected.first().attachments.size > 0) attachment.concat(msgCollected.first().attachments.map(att => att.url).filter(att => isImageUrl(att)));
        if (attachment.length < 1) {
          panelEmbed.setDescription("**Welcome Message/Image/Set**\nNo image attachment was found! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          return setTimeout(() => start(msg), 3000);
        }
        const con = await client.pool.getConnection();
        try {
          if (config.welcome.image) attachment.concat(config.welcome.image);
          config.welcome.image = attachment;
          NorthClient.storage.guilds[message.guild.id] = config;
          con.query(`UPDATE servers SET wel_img = '${JSON.stringify(attachment)}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Welcome Message/Image/Set**\nImage received! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          console.error(err);
          await message.reply("there was an error trying to update the configuration!");
        }
        con.release();
      }
      if (receivedID == 1) {
        panelEmbed.setDescription("**Welcome Message/Image/Reset**\nResetting...")
          .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        try {
          config.welcome.image = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query("UPDATE servers SET wel_img = NULL WHERE id = " + message.guild.id);
          panelEmbed.setDescription("**Welcome Message/Image/Set**\nImage received! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 2) return await welcome(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function welcomeAutorole(msg: Message) {
      panelEmbed.setDescription("**Welcome Message/Autorole**\nGives users roles when joined automatically.\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });
      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      if (!collected.first()) return await end(msg);
      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Welcome Message/Autorole/Set**\nPlease mention the roles or its ID in this channel.")
          .setFooter({ text: "Please enter within 60 seconds.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });

        const msgCollected = await msg.channel.awaitMessages({ filter: msgFilter, idle: 60000, max: 1 });
        if (!msgCollected.first()) return await end(msg);
        msgCollected.first().delete().catch(() => { });
        const collectedArgs = msgCollected.first().content ? msgCollected.first().content.split(/ +/) : ["this is not a number"];
        var roles = [];

        for (var i = 0; i < collectedArgs.length; i++) {
          if (isNaN(parseInt(collectedArgs[i].replace(/<@&/g, "").replace(/>/g, "")))) {
            panelEmbed.setDescription("**Welcome Message/Autorole/Set**\nOne of the roles is not valid! Returning to panel main page in 3 seconds...")
              .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
            await msg.edit({ embeds: [panelEmbed] });
            setTimeout(() => start(msg), 3000);
          }
          roles.push(collectedArgs[i].replace(/<@&/g, "").replace(/>/g, ""));
        }
        try {
          config.welcome.autorole = roles;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET autorole = '${JSON.stringify(roles)}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Welcome Message/Autorole/Set**\nRoles received! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          console.error(err);
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 1) {
        panelEmbed.setDescription("**Welcome Message/Autorole/Reset**\nResetting...")
          .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        try {
          config.welcome.autorole = [];
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query("UPDATE servers SET autorole = '[]' WHERE id = " + message.guild.id);
          panelEmbed.setDescription("**Welcome Message/Autorole/Reset**\nAutorole was reset! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          console.error(err);
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 2) return await welcome(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function leave(msg: Message) {
      panelEmbed.setDescription("**Leave Message**\nSends a message when someone leaves the server.\nPlease choose an option to configure:\n\n1️⃣ Message\n2️⃣ Channel\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });
      for (var i = 0; i < leaveEmoji.length; i++) await msg.react(leaveEmoji[i]);
      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      const reaction = collected.first();
      if (!reaction) return await end(msg);
      switch(panelEmoji.indexOf(reaction.emoji.name)) {
        case 0: return await leaveMsg(msg);
        case 1: return await leaveChannel(msg);
        case 2: return await start(msg);
        default: return await end(msg);
      }
    }

    async function leaveMsg(msg: Message) {
      panelEmbed.setDescription("**Leave Message/Message**\nWhat to send for the Leave Message.\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });
      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      if (!collected.first()) return await end(msg);
      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Leave Message/Message/Set**\nPlease enter the Leave Message in this channel.")
          .setFooter({ text: "Please enter within 120 seconds.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        const msgCollected = await msg.channel.awaitMessages({ filter: msgFilter, idle: 60000, max: 1 });
        if (!msgCollected.first()) return await end(msg);
        msgCollected.first().delete().catch(() => { });
        const contents = msgCollected.first().content ? `'${msgCollected.first().content.replace(/'/g, "\\'")}'` : "NULL";
        try {
          config.leave.message = contents;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET leave_msg = ${contents} WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Leave Message/Message/Set**\nMessage received! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          console.error(err);
          await message.reply("there was an error trying to update the configuration!");
        }
      }

      if (receivedID == 1) {
        panelEmbed.setDescription("**Leave Message/Message/Reset**\nResetting...")
          .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        try {
          config.leave.message = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query("UPDATE servers SET leave_msg = NULL WHERE id = " + message.guild.id);
          panelEmbed.setDescription("**Leave Message/Message/Reset**\nLeave Message was reset! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          console.error(err);
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 2) return await leave(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function leaveChannel(msg: Message) {
      panelEmbed.setDescription("**Leave Message/Channel**\nWhere to send the Leave Message.\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });

      for (var i = 0; i < yesNo.length; i++)  await msg.react(yesNo[i]);

      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      if (!collected.first()) return await end(msg);

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Leave Message/Channel/Set**\nPlease mention the Leave Channel in this channel.")
          .setFooter({ text: "Please enter within 60 seconds.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        const msgCollected = await msg.channel.awaitMessages({ filter: msgFilter, idle: 60000, max: 1 });
        if (!msgCollected.first()) return await end(msg);
        msgCollected.first().delete().catch(() => { });
        const channelID = msgCollected.first().content ? msgCollected.first().content.replace(/<#/g, "").replace(/>/g, "") : "";
        const channel = msg.guild.channels.resolve(channelID);
        if (!channel) {
          panelEmbed.setDescription("**Leave Message/Channel/Set**\nThe channel is not valid! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        }
        try {
          config.leave.channel = channelID;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET leave_channel = '${channelID}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Leave Message/Channel/Set**\nChannel received! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 1) {
        panelEmbed.setDescription("**Leave Message/Channel/Reset**\nResetting...")
          .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        try {
          config.leave.channel = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET leave_channel = NULL WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Leave Message/Channel/Reset**\nLeave Channel was reset! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 2) return await leave(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function giveaway(msg: Message) {
      panelEmbed.setDescription("**Giveaway Emoji**\nChanges the emoji used for giveaways.\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });

      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      if (!collected.first()) return await end(msg);

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Giveaway Emoji/Set**\nPlease enter the Giveaway Emoji you preferred in this channel.")
          .setFooter({ text: "Please enter within 60 seconds.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        const msgCollected = await msg.channel.awaitMessages({ filter: msgFilter, idle: 60000, max: 1 });
        if (!msgCollected.first()) return await end(msg);
        msgCollected.first().delete().catch(() => { });
        const newEmo = msgCollected.first().content ? msgCollected.first().content : "🎉";
        try {
          config.giveaway = newEmo;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET giveaway = '${newEmo}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Giveaway Emoji/Set**\nEmoji received! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 1) {
        panelEmbed.setDescription("**Giveaway Emoji/Reset**\nResetting...")
          .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        try {
          config.giveaway = "🎉";
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET giveaway = '🎉' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Giveaway Emoji/Reset**\nGiveaway Emoji was reset! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 2) return await start(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function boost(msg: Message) {
      panelEmbed.setDescription("**Boost Message**\nSends a message when someone boosts the server.\nPlease choose an option to configure:\n\n1️⃣ Message\n2️⃣ Channel\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });
      for (var i = 0; i < leaveEmoji.length; i++) await msg.react(leaveEmoji[i]);
      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      const reaction = collected.first();
      if (!reaction) return await end(msg);
      switch(panelEmoji.indexOf(reaction.emoji.name)) {
        case 0: return await boostMsg(msg);
        case 1: return await boostChannel(msg);
        case 2: return await start(msg);
        default: return await end(msg);
      }
    }

    async function boostMsg(msg: Message) {
      panelEmbed.setDescription("**Boost Message/Message**\nWhat to send for the Boost Message.\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });
      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      if (!collected.first()) return await end(msg);

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Boost Message/Message/Set**\nPlease enter the Boost Message in this channel.")
          .setFooter({ text: "Please enter within 120 seconds.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        const msgCollected = await msg.channel.awaitMessages({ filter: msgFilter, idle: 60000, max: 1 });
        if (!msgCollected.first()) return await end(msg);
        msgCollected.first().delete().catch(() => { });
        const contents = msgCollected.first().content ? `'${msgCollected.first().content.replace(/'/g, "\\'")}'` : "NULL";
        try {
          config.boost.message = contents;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET boost_msg = ${contents} WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Boost Message/Message/Set**\nMessage received! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }

      if (receivedID == 1) {
        panelEmbed.setDescription("**Boost Message/Message/Reset**\nResetting...")
          .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        try {
          config.boost.message = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET boost_msg = NULL WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Boost Message/Message/Reset**\nLeave Message was reset! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          await message.reply("there was an error trying to update the configuration!");
        }
      }
      if (receivedID == 2) return await boost(msg);
      if (receivedID == 3) return await end(msg);
    }

    async function boostChannel(msg: Message) {
      panelEmbed.setDescription("**Boost Message/Channel**\nWhere to send the Boost Message.\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });

      for (var i = 0; i < yesNo.length; i++) await msg.react(yesNo[i]);
      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      if (!collected.first()) return await end(msg);

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed.setDescription("**Boost Message/Channel/Set**\nPlease mention the Boost Channel in this channel.")
          .setFooter({ text: "Please enter within 60 seconds.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        const msgCollected = await msg.channel.awaitMessages({ filter: msgFilter, idle: 60000, max: 1 });
        if (!msgCollected.first()) return await end(msg);
        msgCollected.first().delete().catch(() => { });

        const channelID = msgCollected.first().content ? msgCollected.first().content.replace(/<#/g, "").replace(/>/g, "") : "";
        const channel = msg.guild.channels.resolve(channelID);
        if (!channel) {
          panelEmbed.setDescription("**Boost Message/Channel/Set**\nThe channel is not valid! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        }
        try {
          config.boost.channel = channelID;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET boost_channel = '${channelID}' WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Boost Message/Channel/Set**\nChannel received! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          await message.reply("there was an error trying to update the configuration!");
        }
      } else if (receivedID == 1) {
        panelEmbed.setDescription("**Boost Message/Channel/Reset**\nResetting...")
          .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [panelEmbed] });
        await msg.reactions.removeAll().catch(() => { });
        try {
          config.boost.channel = null;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET boost_channel = NULL WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Boost Message/Channel/Reset**Boost Channel was reset! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
        } catch (err: any) {
          await message.reply("there was an error trying to update the configuration!");
        }
      } else if (receivedID == 2) return await boost(msg);
      else if (receivedID == 3) return await end(msg);
    }

    async function safe(msg: Message) {
      panelEmbed.setDescription("**Safe Mode**\nToggles NSFW commands on this server.\nPlease choose an option to configure:\n\n1️⃣ Enable\n2️⃣ Disable\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Please choose within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await msg.reactions.removeAll().catch(() => { });
      for (var i = 0; i < safeEmoji.length; i++) await msg.react(safeEmoji[i]);
      const collected = await msg.awaitReactions({ filter, idle: 6e4, max: 1 });
      if (!collected.first()) return await end(msg);

      const reaction = collected.first();
      let receivedID = safeEmoji.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        try {
          config.safe = true;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET safe = 1 WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Safe Mode/Enable**\nEnabled Safe Mode! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
          for (const command of NorthClient.storage.commands.values()) {
            if (command.category !== 5) continue;
            try {
              const options = {
                name: command.name,
                description: command.description,
                options: command.options
              };
              await client.application.commands.create(options, message.guild.id);
            } catch (err: any) {
              console.log("Failed to create slash command " + command.name);
              console.error(err);
            }
          }
        } catch (err: any) {
          await message.reply("there was an error trying to update the configuration!");
        }
      } else if (receivedID == 1) {
        try {
          config.safe = false;
          NorthClient.storage.guilds[message.guild.id] = config;
          await client.pool.query(`UPDATE servers SET safe = 0 WHERE id = '${message.guild.id}'`);
          panelEmbed.setDescription("**Safe Mode/Disable**\nDisabled Safe Mode! Returning to panel main page in 3 seconds...")
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          setTimeout(() => start(msg), 3000);
          const commands = await message.client.application.commands.fetch();
          for (const command of commands.values()) {
            if (command.guildId !== message.guildId) continue;
            if (NorthClient.storage.commands.get(command.name)?.category !== 5) continue;
            try {
              await client.application.commands.delete(command.id, command.guildId);
            } catch (err: any) {
              console.log("Failed to delete slash command " + command.name);
              console.error(err);
            }
          }
        } catch (err: any) {
          await message.reply("there was an error trying to update the configuration!");
        }
      } else if (receivedID == 2) return await start(msg);
      else if (receivedID == 3) return await end(msg);
    }
  }
}

const cmd = new ConfigCommand();
export default cmd;