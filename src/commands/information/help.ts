import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { ApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandOptionChoice } from "../../classes/Slash";
import { color, wait } from "../../function";
import * as Discord from "discord.js";
import { Interaction } from "slashcord";
import { AkiCommand } from "../api/aki";
import { globalClient as client } from "../../common";

const categories = ["Managements", "Moderator", "Economy", "Fun", "Miscellaneous", "NSFW", "Information", "API", "Music", "Under Development", "Dev Command"];
const sCategories = ["Managements", "Moderator", "Economy", "Fun", "Miscellaneous", "NSFW", "Information", "API", "Music", "InDev", "Dev"];

class HelpCommand implements SlashCommand {
  name = "help"
  description = "Send you a DM with an embed of “help” and this PDF file."
  usage = "[command]"
  cooldown = 5
  category = 6
    options: any[];

  constructor() {
      this.options = [
          new ApplicationCommandOption(1, "all", "Display all the commands."),
      ];
      for (const category of sCategories) {
        const option = new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), category.toLowerCase(), `${category} - Command Category`);
        const filtered = Array.from(NorthClient.storage.commands.filter(x => x.category === sCategories.indexOf(category)).keys());
        const fetchOpt = new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "command", "The command to fetch.").setRequired(true);
        fetchOpt.setChoices([]);
        for (const command of filtered) fetchOpt.choices.push(new ApplicationCommandOptionChoice(command, command));
        option.setOptions([fetchOpt]);
        this.options.push(option);
      }
      this.options = this.options.map(x => JSON.parse(JSON.stringify(x)));
  }
  
  async execute(obj: { interaction: Interaction, args: any[], client: NorthClient }) {
    if (obj.args[0]?.name === "all" || !obj.args[0]?.options || !obj.args[0]?.options[0]?.value) {
      await obj.interaction.reply(this.getAllCommands());
      await wait(60000);
      await obj.interaction.edit({
        content: "This is the **[manual](https://northwestwind.ml/manual.pdf)**, my friend.",
        embeds: null
      });
    }

    const name = obj.args[0]?.options[0]?.value?.toLowerCase();
    await obj.interaction.reply(this.getCommand(name, "/").join("\n"));
  }

  async run(message: NorthMessage, args: string[]) {
    if (!args.length) {
      const msg = await message.channel.send(this.getAllCommands());
      setTimeout(async() => {
        await msg.edit({ content: "This is the **manual**, my friend:\nhttps://northwestwind.ml/manual.pdf", embed: null });
      }, 60000);
      return;
    }
    const name = args[0].toLowerCase();
    await message.channel.send(this.getCommand(name, message.prefix), { split: true });
  }

  getAllCommands() {
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Command list is here!")
      .setDescription(`[**Click this**](https://northwestwind.ml/manual.pdf) for the user manual.\nIf you need any support, you can join the [**Support Server**](https://discord.gg/S44PNSh)\n\nI don't know if you need but [**here's me**](https://top.gg/bot/649611982428962819) in [**Discord bot List**](https://top.gg)!`)
      .setThumbnail(client.user.displayAvatarURL())
      .setTimestamp()
      .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
    for (let i = 0; i < categories.length; i++) Embed.addField(`**${categories[i]}**`, Array.from(NorthClient.storage.commands.filter(x => x.category === i).keys()).join("\n"), true);
    return Embed;
  }

  getCommand(name, prefix) {
      const data = [];
    const { commands } = NorthClient.storage;
    const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));
    if (!command) return ["That's not a valid command!"];
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
        if (command.subusage && (command.subusage[i] || command.subusage[i] == 0) && !isNaN(<number> command.subusage[i])) str += `${prefix}${command.name} ${command.subusage[command.subusage[i]].replace("<subcommand>", command.subcommands[i])}`;
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
};

const cmd = new HelpCommand();
export default cmd;