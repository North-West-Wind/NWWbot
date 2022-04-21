import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { msgOrRes, ID, color, fixGuildRecord, syncTradeW1nd, checkTradeW1nd, query, wait, duration, ms, findChannel } from "../../function.js";
import * as Discord from "discord.js";
import { isImageUrl } from "../../function.js";
import { Category, SafeSetting, Setting } from "../../classes/Config.js";

const configs: (Category | Setting)[] = [
  new Category(
    new Setting("message", null, "What to send for the Welcome Message.", "message", 600000, "PRIMARY", "✉️", "Welcome Message").info({ column: "wel_msg" }),
    new Setting("channel", null, "Where to send the Welcome Message.", "channel", 60000, "PRIMARY", "🏞️", "Welcome Channel").info({ column: "wel_channel" }),
    new Setting("image", null, "Includes image(s) for the Welcome Message.", "image", 60000, "SECONDARY", "📷", "Welcome Image").info({ column: "wel_img" }),
    new Setting("autorole", "Auto-Role", "Gives users roles when joined automatically.", "roles", 60000, "SECONDARY", "🤖").info({ column: "autorole" })
  ).info({ id: "welcome", name: "Welcome", description: "Sends a message and adds user to role(s) when someone joins the server.", style: "PRIMARY", emoji: "🙌" }),
  new Category(
    new Setting("message", null, "What to send for the Leave Message.", "message", 600000, "PRIMARY", "✉️", "Leave Message").info({ column: "leave_msg" }),
    new Setting("channel", null, "Where to send the Leave Message.", "channel", 60000, "PRIMARY", "🏞️", "Leave Channel").info({ column: "leave_channel" })
  ).info({ id: "leave", name: "Leave", description: "Sends a message when someone leaves the server.", style: "PRIMARY", emoji: "👋" }),
  new Category(
    new Setting("message", null, "What to send for the Boost Message.", "message", 600000, "PRIMARY", "✉️", "Boost Message").info({ column: "boost_msg" }),
    new Setting("channel", null, "Where to send the Boost Message.", "channel", 60000, "PRIMARY", "🏞️", "Boost Channel").info({ column: "boost_channel" })
  ).info({ id: "boost", name: "Boost", description: "Sends a message when someone boosts the server.", style: "PRIMARY", emoji: "🏎️" }),
  new Setting("giveaway", "Giveaway Emoji", "Changes the emoji used for giveaways.", "reaction", 60000, "SECONDARY", "🎁").def("🎉").info({ column: "giveaway" }),
  new SafeSetting("safe", "Safe Mode", "Toggles NSFW commands on this server.", "boolean", 60000, "SECONDARY", "🦺").info({ column: "safe" }).def(true),
  new Category(
    new Setting("roles", "Applicable Roles", "Roles that users can apply for.", "roles", 60000, "PRIMARY", "✉️").info({ column: "app_roles" }),
    new Setting("admins", "Voter Roles", "Roles that users will be voting for approval.", "roles", 60000, "PRIMARY", "🛠️").info({ column: "admin_roles" }),
    new Setting("channel", null, "Where the application will be sent. Private channels are recommended.", "channel", 60000, "PRIMARY", "🏞️").info({ column: "app_channel" }),
    new Setting("duration", null, "How long until the application cannot be voted.", "duration", 60000, "SECONDARY", "⏰").info({ column: "duration" })
  ).info({ id: "applications", name: "Applications", description: "Allows user to apply for a specific role.", style: "SECONDARY", emoji: "🧑‍💻" })
];

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
      const rows = [];
      for (let ii = 0; ii < Math.floor(configs.length / 5); ii++) {
        const row = new Discord.MessageActionRow();
        for (let jj = ii * 5; jj < Math.min(ii * 5 + 5, configs.length); jj++) {
          const config = configs[jj];
          row.addComponents(new Discord.MessageButton(<Discord.MessageButtonOptions>{ label: config.name, customId: config.id, style: config.style || "PRIMARY", emoji: config.emoji }));
        }
        rows.push(row);
      }
      rows.push(new Discord.MessageActionRow().addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" })));
      await msg.edit({ embeds: [panelEmbed], components: rows });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      if (interaction.customId === "quit") return await end(msg);
      return await next(msg, [interaction.customId]);
    }

    async function set(msg: Discord.Message, path: string, configLoc: string[], thing: string, column: string, time: number, type: "message" | "channel" | "image" | "roles" | "reaction" | "duration" | "boolean", extraData: any = {}) {
      panelEmbed.setDescription(`**${path}/Set**\nPlease enter the ${thing} in this channel.`)
        .setFooter({ text: `You will have ${duration(time, "milliseconds")}`, iconURL: msg.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      const msgCollected = await msg.channel.awaitMessages({ filter: msgFilter, time, max: 1 });
      if (!msgCollected.first() || !msgCollected.first().content) return await end(msg);
      var content;
      if (["message", "channel", "roles", "reaction", "duration"].includes(type)) {
        content = msgCollected.first().content.replace(/'/g, "\\'");
        msgCollected.first().delete().catch(() => { });
        switch (type) {
          case "channel":
            const channel = await findChannel(msg.guild, content);
            if (!channel || !(channel instanceof Discord.TextChannel)) {
              panelEmbed.setDescription(`**${path}/Set**\nThe channel is not valid! Returning to panel main page in 3 seconds...`)
                .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
              await msg.edit({ embeds: [panelEmbed] });
              await wait(3000);
              return await start(msg);
            }
            content = channel.id;
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
        else content.push(cfg);
      } else if (type === "boolean") {
        var cfg;
        if (configLoc.length === 1) cfg = config[configLoc[0]];
        else if (configLoc.length === 2) cfg = config[configLoc[0]][configLoc[1]];
        content = !cfg;
      }
      if (typeof extraData?.handler === "function") await extraData.handler(msg, content);
      try {
        if (configLoc.length === 1) config[configLoc[0]] = content;
        else if (configLoc.length === 2) config[configLoc[0]][configLoc[1]] = content;
        NorthClient.storage.guilds[message.guild.id] = config;
        var val;
        if (typeof content === "number") val = content;
        else if (Array.isArray(content)) val = `"${content.join()}"`;
        else if (typeof content === "boolean") val = content ? 1 : 0;
        else val = `"${content}"`;
        await query(`UPDATE servers SET ${column} = ${val} WHERE id = '${message.guild.id}'`);
        if (type === "boolean") panelEmbed.setDescription(`**${path}/Toggle**\n${content ? "Enabled" : "Disabled"} ${thing}! Returning to panel main page in 3 seconds...`);
        else panelEmbed.setDescription(`**${path}/Set**\n${thing} received! Returning to panel main page in 3 seconds...`);
      } catch (err: any) {
        console.error(err);
        panelEmbed.setDescription(`**${path}/Set**\nFailed to update ${thing}! Returning to panel main page in 3 seconds...`);
      }
      panelEmbed.setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      await wait(3000);
      return await start(msg);
    }

    async function reset(msg: Discord.Message, path: string, configLoc: string[], thing: string, column: string, defaultVal: any = null, handler: Function = null) {
      panelEmbed.setDescription(`**${path}/Reset**\nResetting...`)
        .setFooter({ text: "Please wait patiently.", iconURL: msg.client.user.displayAvatarURL() });
      await msg.edit({ embeds: [panelEmbed] });
      try {
        if (configLoc.length === 1) config[configLoc[0]] = defaultVal;
        else if (configLoc.length === 2) config[configLoc[0]][configLoc[1]] = defaultVal;
        NorthClient.storage.guilds[message.guild.id] = config;
        if (handler) await handler(msg, defaultVal);
        var val;
        if (!defaultVal) val = "NULL"
        else if (typeof defaultVal === "number") val = defaultVal;
        else if (Array.isArray(defaultVal)) val = `"${defaultVal.join()}"`;
        else if (typeof defaultVal === "boolean") val = defaultVal ? 1 : 0;
        else val = `"${defaultVal}"`;
        await query(`UPDATE servers SET ${column} = ${val} WHERE id = '${message.guild.id}'`);
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

    async function next(msg: Discord.Message, paths: string[]) {
      if (!paths.length) return await start(msg);
      var cateSett: Category | Setting;
      const capitalized: string[] = [];
      for (const path of paths) {
        if (!cateSett) cateSett = configs.find(cat => cat.id === path);
        else if (cateSett instanceof Category) cateSett = cateSett.children.find(cat => cat.id === path);
        else return await start(msg);
        capitalized.push(cateSett.name);
      }
      panelEmbed.setDescription(`**${capitalized.join("/")}**\n${cateSett.description}\nPlease choose an option to configure by clicking a button.`)
        .setFooter({ text: "Make your choice in 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const rows = [];
      if (cateSett instanceof Category) {
        for (let ii = 0; ii < Math.ceil(cateSett.children.length / 5); ii++) {
          const row = new Discord.MessageActionRow();
          for (let jj = ii * 5; jj < Math.min(ii * 5 + 5, cateSett.children.length); jj++) {
            const config = cateSett.children[jj];
            row.addComponents(new Discord.MessageButton(<Discord.MessageButtonOptions>{ label: config.name, customId: config.id, style: config.style || "PRIMARY", emoji: config.emoji }));
          }
          rows.push(row);
        }
        rows.push(new Discord.MessageActionRow()
          .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
          .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" })));
      } else {
        rows.push(new Discord.MessageActionRow()
          .addComponents(new Discord.MessageButton({ label: "Set", customId: "set", style: "PRIMARY", emoji: "📥" }))
          .addComponents(new Discord.MessageButton({ label: "Reset", customId: "reset", style: "PRIMARY", emoji: "📤" }))
          .addComponents(new Discord.MessageButton({ label: "Back", customId: "back", style: "SECONDARY", emoji: "⬅" }))
          .addComponents(new Discord.MessageButton({ label: "Quit", customId: "quit", style: "DANGER", emoji: "⏹" })));
      }
      await msg.edit({ embeds: [panelEmbed], components: rows });
      const interaction = await getButtonInteraction(msg);
      if (!interaction) return await end(msg);
      await interaction.update({ components: [] });
      var extra = null;
      if (cateSett instanceof Setting) {
        if (cateSett.max) extra = { max: cateSett.max };
        else if (cateSett.handler) extra = { handler: cateSett.handler };
      }
      var location: string[];
      if (cateSett instanceof Setting) {
        location = cateSett.storage.location || paths;
        var settings: any;
        if (location.length === 1) settings = NorthClient.storage.guilds[message.guildId][location[0]];
        else if (location.length === 2) settings =NorthClient.storage.guilds[message.guildId][location[0]][location[1]];
        panelEmbed.setDescription(panelEmbed.description + `\n\nCurrent settings:\n\`${settings}\``);
      }
      switch (interaction.customId) {
        case "back": return await next(msg, paths.slice(0, -1));
        case "quit": return await end(msg);

        case "set": return await set(msg, capitalized.join("/"), location, (<Setting> cateSett).longname, (<Setting> cateSett).storage.column, (<Setting> cateSett).time, (<Setting> cateSett).type, extra);
        case "reset": return await reset(msg, capitalized.join("/"), location, (<Setting> cateSett).longname, (<Setting> cateSett).storage.column, (<Setting> cateSett).default || null, extra?.handler);

        default:
          const nextSet = (<Category>cateSett).children.find(s => s.id === interaction.customId);
          if (!nextSet) return await start(msg);
          return await next(msg, paths.concat(nextSet.id));
      }
    }
  }
}

const cmd = new ConfigCommand();
export default cmd;