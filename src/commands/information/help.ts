import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { color, deepReaddir, fixGuildRecord, wait } from "../../function";
import * as Discord from "discord.js";

import { AkiCommand } from "../api/aki";
import { globalClient as client } from "../../common";

const categories = ["Managements", "Moderator", "Economy", "Fun", "Miscellaneous", "NSFW", "Information", "API", "Music", "Under Development", "Dev Command"];
export const sCategories = ["Managements", "Moderator", "Economy", "Fun", "Miscellaneous", "NSFW", "Information", "API", "Music", "InDev", "Dev"];

class HelpCommand implements SlashCommand {
  name = "help"
  description = "Sends you a DM with an embed of all available commands and the user manual."
  usage = "[command]"
  cooldown = 5
  category = 6
  options: any[];

  constructor() {
    this.options = [
      {
        name: "all",
        description: "Display all the commands.",
        type: "SUB_COMMAND"
      }
    ];
    const commandFiles = deepReaddir("./out/commands").filter(file => file.endsWith(".js"));
    for (const category of sCategories) {
      const fetchOpt = {
        name: "command",
        description: "The command to fetch.",
        required: true,
        type: "STRING",
        choices: commandFiles.map(file => require(file)).filter(command => command.category === sCategories.indexOf(category)).map(x => ({ name: x.name, value: x.name }))
      };
      const option = {
        name: category.toLowerCase(),
        description: `${category} - Command Category`,
        type: "SUB_COMMAND",
        options: [fetchOpt]
      };
      this.options.push(option);
    }
  }

  async execute(interaction: NorthInteraction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "all") {
      const msg = await interaction.user.send({embeds: [await this.getAllCommands(interaction.guildId)]});
      interaction.reply("Slided into your DM!").then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000)).catch(() => {});
      await wait(60000);
      var content;
      if (this.isSafe(interaction.guildId)) content = "This is the **[manual](https://northwestwind.ml/n0rthwestw1nd/manual)**, my friend.";
      else content = "This is the **[manual](https://northwestwind.ml/n0rthwestw1nd/manual/unsafe)**, my friend.";
      await msg.edit({
        content,
        embeds: []
      });
      return;
    }
    const name = interaction.options.getString("command").toLowerCase();
    await interaction.reply(this.getCommand(name, "/", interaction.guildId).join("\n"));
  }

  async run(message: NorthMessage, args: string[]) {
    if (!args.length) {
      const msg = await message.author.send({embeds: [await this.getAllCommands(message.guildId)]});
      await message.react("💨");
      var content;
      if (this.isSafe(message.guildId)) content = "This is the **[manual](https://northwestwind.ml/n0rthwestw1nd/manual)**, my friend.";
      else content = "This is the **[manual](https://northwestwind.ml/n0rthwestw1nd/manual/unsafe)**, my friend.";
      await wait(60000);
      await msg.edit({ content, embeds: [] });
      return;
    }
    const name = args[0].toLowerCase();
    await message.channel.send(this.getCommand(name, message.prefix, message.guildId).join("\n"));
  }

  async getAllCommands(guildID: Discord.Snowflake) {
    var config = NorthClient.storage.guilds[guildID];
    if (!config) config = await fixGuildRecord(guildID);
    const safe = config.safe;
    const end = safe ? "" : "/unsafe";
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Command list is here!")
      .setDescription(`[**Click this**](https://northwestwind.ml/n0rthwestw1nd/manual${end}) for the user manual.\nIf you need any support, you can join the [**Support Server**](https://discord.gg/S44PNSh)\n\nI don't know if you need but [**here's me**](https://top.gg/bot/649611982428962819) in [**Discord bot List**](https://top.gg)!`)
      .setThumbnail(client.user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
    for (let i = 0; i < categories.length; i++) {
      if (safe && categories[i] === "NSFW") continue;
      Embed.addField(`**${categories[i]}**`, Array.from(NorthClient.storage.commands.filter(x => x.category === i).keys()).join("\n"), true);
    }
    return Embed;
  }

  getCommand(name: string, prefix: string, guildID: Discord.Snowflake) {
    const data = [];
    const { commands, guilds } = NorthClient.storage;
    const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));
    if (!command || (guilds[guildID].safe && command.category === 5)) return ["That's not a valid command!"];
    data.push(`**Name:** ${command.name}`);

    if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(", ")}`);
    if (command.description) data.push(`**Description:** ${command.description}`);
    if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
    else data.push(`**Usage:** ${prefix}${command.name}`);
    if (command.subcommands) {
      const strs = [];
      for (let i = 0; i < command.subcommands.length; i++) {
        var str = "    • ";
        if (command.subaliases) str = `**${command.subcommands[i]} | ${command.subaliases[i]}**${command.subdesc ? ` - ${command.subdesc[i]}` : ""}`;
        else str = `**${command.subcommands[i]}**${command.subdesc ? ` - ${command.subdesc[i]}` : ""}`;
        str += "\n        • "
        if (command.subusage && (command.subusage[i] || command.subusage[i] == 0) && !isNaN(<number>command.subusage[i])) str += `${prefix}${command.name} ${command.subusage[command.subusage[i]].replace("<subcommand>", command.subcommands[i])}`;
        else if (command.subusage && command.subusage[i]) str += `${prefix}${command.name} ${command.subusage[i].toString().replace("<subcommand>", command.subcommands[i])}`;
        else str += `${prefix}${command.name} ${command.usage ? command.usage.replace(/(?!\s)[\<\[\w\s\|]*subcommand[\w\s\|\>\]]*/, command.subcommands[i]) : command.subcommands[i]}`;
        strs.push(str);
      }
      data.push(`**Subcommands:**\n${strs.join("\n")}`);
    }
    if (command instanceof AkiCommand) data.push(`**Regions:** ${command.regions.join(", ")}`)
    if (command.subcommands) data.push("\nIf you want to know how subcommands work, please refer to the manual.");
    return data;
  }

  isSafe(guildID: Discord.Snowflake) {
    if (!NorthClient.storage.guilds[guildID]) return true;
    return NorthClient.storage.guilds[guildID].safe;
  }
};

const cmd = new HelpCommand();
export default cmd;