import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { msgOrRes, ID, color, fixGuildRecord, syncTradeW1nd, checkTradeW1nd, query, wait, duration, ms } from "../../function.js";
import { globalClient as client } from "../../common.js";
import * as Discord from "discord.js";
import { isImageUrl } from "../../function.js";

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
      await query(`UPDATE servers SET token = '${config.token}' WHERE id = '${guild.id}'`);
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
      await query(`UPDATE servers SET token = '${config.token}' WHERE id = '${guild.id}'`);
    } catch (err: any) {
      message.reply("There was an error trying to update the token! This token will be temporary.");
      console.error(err);
    }
  }

  async panel(message: Discord.Message | NorthInteraction) {
    var config = NorthClient.storage.guilds[message.guildId];
    const authorId = (message instanceof Discord.Message ? message.author : message.user).id;
    const msgFilter = (x: Discord.Message) => x.author.id === authorId;
    const filter = (interaction: Discord.MessageComponentInteraction) => interaction.user.id === authorId;
    const login = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(message.guild.name + "'s Configuration Panel")
      .setDescription("Please login with the token.")
      .setTimestamp()
      .setFooter({ text: "Please enter within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
    var mesg = <Discord.Message>await msgOrRes(message, login);
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
    async function end(msg: Discord.Message) {
      panelEmbed.setDescription("Panel shutted down.").setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed], components: [] });
      if (await checkTradeW1nd(message.guildId)) await syncTradeW1nd(message.guildId);
    }

    async function start(msg: Discord.Message) {
      panelEmbed.setDescription("Please choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row1 = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Welcome", customId: "welcome", style: "PRIMARY", emoji: "🙌" }))
        .addComponents(new Discord.MessageButton({ label: "Leave", customId: "leave", style: "PRIMARY", emoji: "👋" }))
        .addComponents(new Discord.MessageButton({ label: "Boost", customId: "boost", style: "PRIMARY", emoji: "🏎️" }))
        .addComponents(new Discord.MessageButton({ label: "Giveaway Emoji", customId: "giveaway", style: "SECONDARY", emoji: "🎁" }))
        .addComponents(new Discord.MessageButton({ label: "Safe Mode", customId: "safemode", style: "SECONDARY", emoji: "🦺" }));
      const row2 = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Applications", customId: "app", style: "SECONDARY", emoji: "🧑‍💻" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row1, row2] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "welcome": return await welcome(msg);
        case "leave": return await leave(msg);
        case "boost": return await boost(msg);
        case "giveaway": return await giveaway(msg);
        case "safemode": return await safe(msg);
        default: return await end(msg);
      }
    }

    async function set(msg: Discord.Message, path: string, configLoc: string[], thing: string, column: string, time: number, type: "message" | "channel" | "image" | "roles" | "reaction" | "duration", extraData: any = {}) {
      panelEmbed.setDescription(`**${path}/Set**\nPlease enter the ${thing} in this channel.`)
        .setFooter({ text: `You will have ${duration(time, "milliseconds")}`, iconURL: msg.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      const msgCollected = await msg.channel.awaitMessages({ filter: msgFilter, time, max: 1 });
      if (!msgCollected.first() || !msgCollected.first().content) return await end(msg);
      var content;
      if (["message", "channel", "roles", "duration"].includes(type)) {
        content = msgCollected.first().content.replace(/'/g, "\\'");
        msgCollected.first().delete().catch(() => { });
        switch (type) {
          case "channel":
            const channel = await msg.guild.channels.fetch(content);
            if (!channel) {
              panelEmbed.setDescription(`**${path}/Set**\nThe channel is not valid! Returning to panel main page in 3 seconds...`)
                .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
              await msg.edit({ embeds: [panelEmbed] });
              await wait(3000);
              return await start(msg);
            }
            break;
          case "roles":
            const collectedArgs = msgCollected.first().content.split(/ +/);
            content = [];
  
            for (var i = 0; i < collectedArgs.length; i++) {
              if (isNaN(parseInt(collectedArgs[i].replace(/<@&/g, "").replace(/>/g, "")))) {
                panelEmbed.setDescription(`**${path}/Set**\nOne of the roles is not valid! Returning to panel main page in 3 seconds...`)
                  .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
                await msg.edit({ embeds: [panelEmbed] });
                await wait(3000);
                return await start(msg);
              }
              content.push(collectedArgs[i].replace(/<@&/g, "").replace(/>/g, ""));
            }
            if (extraData.max && content.length > extraData.max) 
              panelEmbed.setDescription(`**${path}/Set**\nThere can only be at most ${extraData.max} roles! Returning to panel main page in 3 seconds...`)
                .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
            break;
          case "reaction":
            content = msgCollected.first().content;
            try {
              await msg.react(content);
              msg.reactions.removeAll().catch(() => { });
            } catch (err) {
              panelEmbed.setDescription(`**${path}/Set**\nThe reaction is not valid! Returning to panel main page in 3 seconds...`)
                .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
              await msg.edit({ embeds: [panelEmbed] });
              await wait(3000);
              return await start(msg);
            }
            break;
          case "duration":
            content = ms(content);
            if (isNaN(content)) {
              panelEmbed.setDescription(`**${path}/Set**\nThe channel is not valid! Returning to panel main page in 3 seconds...`)
                .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
              await msg.edit({ embeds: [panelEmbed] });
              await wait(3000);
              return await start(msg);
            }
        }
      } else if (type === "image") {
        content = [];
        if (msgCollected.first().content) content.concat(msgCollected.first().content.split(/\n+/).filter(att => isImageUrl(att)));
        if (msgCollected.first().attachments.size > 0) content.concat(msgCollected.first().attachments.map(att => att.url).filter(att => isImageUrl(att)));
        if (content.length < 1) {
          panelEmbed.setDescription(`**${path}/Set**\nNo image attachment or link found! Returning to panel main page in 3 seconds...`)
            .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [panelEmbed] });
          await wait(3000);
          return await start(msg);
        }
        var cfg;
        if (configLoc.length === 1) cfg = config[configLoc[0]];
        else if (configLoc.length === 2) cfg = config[configLoc[0]][configLoc[1]];
        if (Array.isArray(cfg)) content = content.concat(cfg);
      }
      try {
        if (configLoc.length === 1) config[configLoc[0]] = content;
        else if (configLoc.length === 2) config[configLoc[0]][configLoc[1]] = content;
        NorthClient.storage.guilds[message.guild.id] = config;
        await query(`UPDATE servers SET ${column} = ${typeof content === "number" ? content : `'${content}'`} WHERE id = '${message.guild.id}'`);
        panelEmbed.setDescription(`**${path}/Set**\n${thing} received! Returning to panel main page in 3 seconds...`);
      } catch (err: any) {
        console.error(err);
        panelEmbed.setDescription(`**${path}/Set**\nFailed to update ${thing}! Returning to panel main page in 3 seconds...`);
      }
      panelEmbed.setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await wait(3000);
      return await start(msg);
    }

    async function reset(msg: Discord.Message, path: string, configLoc: string[], thing: string, column: string, defaultVal: any = null) {
      panelEmbed.setDescription(`**${path}/Reset**\nResetting...`)
        .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      try {
        if (configLoc.length === 1) config[configLoc[0]] = defaultVal;
        else if (configLoc.length === 2) config[configLoc[0]][configLoc[1]] = defaultVal;
        NorthClient.storage.guilds[message.guild.id] = config;
        await query(`UPDATE servers SET ${column} = ${defaultVal ? `'${defaultVal}'` : "NULL"} WHERE id = '${message.guild.id}'`);
        panelEmbed.setDescription(`**${path}/Reset**\n${thing} was reset! Returning to panel main page in 3 seconds...`);
      } catch (err: any) {
        console.error(err);
        panelEmbed.setDescription(`**${path}/Reset**\nFailed to reset ${thing}! Returning to panel main page in 3 seconds...`);
      }
      panelEmbed.setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await wait(3000);
      return await start(msg);
    }

    async function getButtonInteraction(msg: Discord.Message) {
      var interaction: Discord.MessageComponentInteraction;
      try { interaction = await msg.awaitMessageComponent({ filter, time: 6e4 }); } catch (err) { interaction = null; }
      return interaction;
    }

    async function welcome(msg: Discord.Message) {
      panelEmbed.setDescription("**Welcome**\nSends a message when someone joins the server.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row1 = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Message", customId: "message", style: "PRIMARY", emoji: "✉️" }))
        .addComponents(new Discord.MessageButton({ label: "Channel", customId: "channel", style: "PRIMARY", emoji: "🏞️" }))
        .addComponents(new Discord.MessageButton({ label: "Image", customId: "image", style: "SECONDARY", emoji: "📷" }))
        .addComponents(new Discord.MessageButton({ label: "Auto-Role", customId: "autorole", style: "SECONDARY", emoji: "🤖" }));
      const row2 = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row1, row2] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "message": return await welcomeMsg(msg);
        case "channel": return await welcomeChannel(msg);
        case "image": return await welcomeImage(msg);
        case "autorole": return await welcomeAutorole(msg);
        case "back": return await start(msg);
        default: return await end(msg);
      }
    }

    async function welcomeMsg(msg: Discord.Message) {
      panelEmbed.setDescription("**Welcome/Message**\nWhat to send for the Welcome Message.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set": return await set(msg, "Welcome/Message", ["welcome", "message"], "Welcome Message", "wel_msg", 600000, "message");
        case "reset": return await reset(msg, "Welcome/Message", ["welcome", "message"], "Welcome Message", "wel_msg");
        case "back": return await welcome(msg);
        default: return await end(msg);
      }
    }

    async function welcomeChannel(msg: Discord.Message) {
      panelEmbed.setDescription("**Welcome/Channel**\nWhere to send the Welcome Message.\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set": return await set(msg, "Welcome/Channel", ["welcome", "channel"], "Welcome Channel", "wel_channel", 60000, "channel");
        case "reset": return await reset(msg, "Welcome/Channel", ["welcome", "channel"], "Welcome Channel", "wel_channel");
        case "back": return await welcome(msg);
        default: return await end(msg);
      }
    }

    async function welcomeImage(msg: Discord.Message) {
      panelEmbed.setDescription("**Welcome/Image**\nIncludes image(s) for the Welcome Message.\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set": return set(msg, "Welcome/Image", ["welcome", "image"], "Welcome Image", "wel_img", 60000, "image");
        case "unset": return reset(msg, "Welcome/Image", ["welcome", "image"], "Welcome Image", "wel_img");
        case "back": return await welcome(msg);
        default: return await end(msg);
      }
    }

    async function welcomeAutorole(msg: Discord.Message) {
      panelEmbed.setDescription("**Welcome Message/Autorole**\nGives users roles when joined automatically.\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set": return set(msg, "Welcome/Auto-Role", ["welcome", "autorole"], "Auto-Role", "autorole", 60000, "roles");
        case "unset": return reset(msg, "Welcome/Image", ["welcome", "autorole"], "Auto-Role", "autorole");
        case "back": return await welcome(msg);
        default: return await end(msg);
      }
    }

    async function leave(msg: Discord.Message) {
      panelEmbed.setDescription("**Leave**\nSends a message when someone leaves the server.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row1 = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Message", customId: "message", style: "PRIMARY", emoji: "✉️" }))
        .addComponents(new Discord.MessageButton({ label: "Channel", customId: "channel", style: "PRIMARY", emoji: "🏞️" }))
      const row2 = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row1, row2] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "message": return await leaveMsg(msg);
        case "channel": return await leaveChannel(msg);
        case "back": return await start(msg);
        default: return await end(msg);
      }
    }

    async function leaveMsg(msg: Discord.Message) {
      panelEmbed.setDescription("**Leave/Message**\nWhat to send for the Leave Message.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set": return await set(msg, "Leave/Message", ["leave", "message"], "Leave Message", "leave_msg", 600000, "message");
        case "reset": return await reset(msg, "Leave/Message", ["leave", "message"], "Leave Message", "leave_msg");
        case "back": return await welcome(msg);
        default: return await end(msg);
      }
    }

    async function leaveChannel(msg: Discord.Message) {
      panelEmbed.setDescription("**Leave/Channel**\nWhere to send the Leave Message.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set": return await set(msg, "Leave/Channel", ["leave", "channel"], "Leave Channel", "leave_channel", 60000, "channel");
        case "reset": return await reset(msg, "Leave/Channel", ["leave", "channel"], "Leave Channel", "leave_channel");
        case "back": return await welcome(msg);
        default: return await end(msg);
      }
    }

    async function boost(msg: Discord.Message) {
      panelEmbed.setDescription("**Boost Message**\nSends a message when someone boosts the server.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row1 = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Message", customId: "message", style: "PRIMARY", emoji: "✉️" }))
        .addComponents(new Discord.MessageButton({ label: "Channel", customId: "channel", style: "PRIMARY", emoji: "🏞️" }))
      const row2 = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row1, row2] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "message": return await boostMsg(msg);
        case "channel": return await boostChannel(msg);
        case "back": return await start(msg);
        default: return await end(msg);
      }
    }

    async function boostMsg(msg: Discord.Message) {
      panelEmbed.setDescription("**Boost/Message**\nWhat to send for the Boost Message.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set": return await set(msg, "Boost/Message", ["boost", "message"], "Boost Message", "boost_msg", 600000, "message");
        case "reset": return await reset(msg, "Boost/Message", ["boost", "message"], "Boost Message", "boost_msg");
        case "back": return await welcome(msg);
        default: return await end(msg);
      }
    }

    async function boostChannel(msg: Discord.Message) {
      panelEmbed.setDescription("**Boost/Channel**\nWhere to send the Boost Message.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set": return await set(msg, "Boost/Channel", ["boost", "channel"], "Boost Channel", "boost_channel", 60000, "channel");
        case "reset": return await reset(msg, "Boost/Channel", ["boost", "channel"], "Boost Channel", "boost_channel");
        case "back": return await welcome(msg);
        default: return await end(msg);
      }
    }

    async function giveaway(msg: Discord.Message) {
      panelEmbed.setDescription("**Giveaway Emoji**\nChanges the emoji used for giveaways.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set": return await set(msg, "Giveaway Emoji", ["giveaway"], "Giveaway Emoji", "giveaway", 60000, "reaction");
        case "reset": return await reset(msg, "Giveaway Emoji", ["giveaway"], "Giveaway Emoji", "giveaway", "🎉");
        case "back": return await welcome(msg);
        default: return await end(msg);
      }
    }

    async function safe(msg: Discord.Message) {
      panelEmbed.setDescription("**Safe Mode**\nToggles NSFW commands on this server.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set":
          try {
            config.safe = true;
            NorthClient.storage.guilds[message.guild.id] = config;
            await query(`UPDATE servers SET safe = 1 WHERE id = '${message.guild.id}'`);
            panelEmbed.setDescription("**Safe Mode/Enable**\nEnabled Safe Mode! Returning to panel main page in 3 seconds...")
            await msg.edit({ embeds: [panelEmbed] });
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
                console.error("Failed to create slash command " + command.name);
                console.error(err);
              }
            }
          } catch (err: any) {
            panelEmbed.setDescription(`**Safe Mode/Set**\nFailed to update Safe Mode! Returning to panel main page in 3 seconds...`);
          }
          panelEmbed.setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await wait(3000);
          return await start(msg);
        case "reset":
          try {
            config.safe = false;
            NorthClient.storage.guilds[message.guild.id] = config;
            await query(`UPDATE servers SET safe = 0 WHERE id = '${message.guild.id}'`);
            panelEmbed.setDescription("**Safe Mode/Disable**\nDisabled Safe Mode! Returning to panel main page in 3 seconds...");
            await msg.edit({ embeds: [panelEmbed] });
            const commands = await message.guild.commands.fetch();
            for (const command of commands.values()) {
              if (NorthClient.storage.commands.get(command.name)?.category !== 5) continue;
              try {
                await client.application.commands.delete(command.id, command.guildId);
              } catch (err: any) {
                console.error("Failed to delete slash command " + command.name);
                console.error(err);
              }
            }
          } catch (err: any) {
            panelEmbed.setDescription(`**Safe Mode/Set**\nFailed to update Safe Mode! Returning to panel main page in 3 seconds...`);
          }
          panelEmbed.setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
          await wait(3000);
          return await start(msg);
        case "back": return await welcome(msg);
        default: return await end(msg);
      }
    }

    async function application(msg: Discord.Message) {
      panelEmbed.setDescription("**Applications**\nAllows user to apply for a specific role.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row1 = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Applicable Roles", customId: "roles", style: "PRIMARY", emoji: "✉️" }))
        .addComponents(new Discord.MessageButton({ label: "Administrator Roles", customId: "admin", style: "PRIMARY", emoji: "🛠️" }))
        .addComponents(new Discord.MessageButton({ label: "Channel", customId: "channel", style: "PRIMARY", emoji: "🏞️" }))
        .addComponents(new Discord.MessageButton({ label: "Duration", customId: "duration", style: "SECONDARY", emoji: "⏰" }));
      const row2 = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row1, row2] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "roles": return await applicationRoles(msg);
        case "admin": return await applicationAdmins(msg);
        case "channel": return await applicationChannel(msg);
        case "duration": return await applicationDuration(msg);
        case "back": return await start(msg);
        default: return await end(msg);
      }
    }

    async function applicationRoles(msg: Discord.Message) {
      panelEmbed.setDescription("**Applications/Applicable Roles**\nRoles that users can apply for.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set": return await set(msg, "Applications/Applicable Roles", ["applications", "roles"], "Applicable Roles", "app_roles", 60000, "roles", { max: 20 });
        case "reset": return await reset(msg, "Applications/Applicable Roles", ["applications", "roles"], "Applicable Roles", "app_roles");
        case "back": return await application(msg);
        default: return await end(msg);
      }
    }

    async function applicationAdmins(msg: Discord.Message) {
      panelEmbed.setDescription("**Applications/Admin Roles**\nRoles that users will be voting for approval.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set": return await set(msg, "Applications/Admin Roles", ["applications", "admins"], "Admin Roles", "admin_roles", 60000, "roles");
        case "reset": return await reset(msg, "Applications/Admin Roles", ["applications", "admins"], "Admin Roles", "admin_roles");
        case "back": return await application(msg);
        default: return await end(msg);
      }
    }

    async function applicationChannel(msg: Discord.Message) {
      panelEmbed.setDescription("**Applications/Channel**\nWhere the application will be sent. Private channels are recommended.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set": return await set(msg, "Applications/Channel", ["applications", "channel"], "Channel", "app_channel", 60000, "channel");
        case "reset": return await reset(msg, "Applications/Channel", ["applications", "channel"], "Channel", "app_channel");
        case "back": return await application(msg);
        default: return await end(msg);
      }
    }

    async function applicationDuration(msg: Discord.Message) {
      panelEmbed.setDescription("**Applications/Duration**\nHow long until the application cannot be voted.\nPlease choose an option to configure by clicking a button.")
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
        .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
        .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
        .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" }));
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      await msg.edit({ embeds: [panelEmbed], components: [row] });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      switch (interaction.customId) {
        case "set": return await set(msg, "Applications/Duration", ["applications", "duration"], "Duration", "vote_duration", 60000, "duration");
        case "reset": return await reset(msg, "Applications/Duration", ["applications", "duration"], "Duration", "vote_duration");
        case "back": return await application(msg);
        default: return await end(msg);
      }
    }
  }
}

const cmd = new ConfigCommand();
export default cmd;