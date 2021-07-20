import { Message, MessageEmbed, MessageReaction, Snowflake, TextChannel } from "discord.js";
import { Aki } from "aki-api";
import { NorthClient, SlashCommand, NorthMessage } from "../../classes/NorthClient";
import { color, genPermMsg } from "../../function.js";
import { Interaction } from "slashcord";
import { ApplicationCommandOption, ApplicationCommandOptionChoice, ApplicationCommandOptionType } from "../../classes/Slash";

export class AkiCommand implements SlashCommand {
  name = "aki";
  description = "Play Akinator on Discord!";
  aliases = ["akinator"];
  usage = "[region]";
  category = 7;
  permission = 90176;

  maxSteps = 420;
  reactions: string[] = [
    "✅",
    "❌",
    "❓",
    "⭕",
    "🚫",
    "⬅",
    "⏹"
  ];
  regions = [
    'en',
    'en_objects',
    'en_animals',
    'ar',
    'cn',
    'de',
    'de_animals',
    'es',
    'es_animals',
    'fr',
    'fr_objects',
    'fr_animals',
    'il',
    'it',
    'it_animals',
    'jp',
    'jp_animals',
    'kr',
    'nl',
    'pl',
    'pt',
    'ru',
    'tr',
    'id'
  ];
  options: any[];

  constructor() {
    this.options = [
      new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "region", "The region/language to play in.").setChoices(
        this.regions.map(region => new ApplicationCommandOptionChoice(region, region)).concat([
          new ApplicationCommandOptionChoice("region", "Displays all regions available.")
        ])
      )
    ].map(x => JSON.parse(JSON.stringify(x)));
  }

  async execute(obj: { interaction: Interaction, args: any[] }) {
    await obj.interaction.reply("Initializing Akinator...");
    const args = obj.args?.map(x => <string>x?.value).filter(x => !!x) || [];
    const msg = <NorthMessage> await obj.interaction.fetchReply();
    msg.prefix = "/";
    msg.pool = (<NorthClient> obj.interaction.client).pool;
    await this.run(msg, <string[]>args);
  }

  async run(message: NorthMessage, args: string[]) {
    if (args.length >= 1 && args[0].toLowerCase() === "region") return await this.region(message);
    if (!message.guild.me.permissions.has(this.permission) && (<TextChannel>message.channel).permissionsFor(message.guild.me).has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 1));
    let region = "en";
    if (args.length >= 1) {
      const testRegion = args[0];
      const i = this.regions.findIndex(reg => testRegion === reg);
      if (i !== -1) region = this.regions[i];
    }
    await this.logic(message, region);
  };

  async logic(message: Message | Interaction, region: string) {
    const aki = new Aki(region);
    await aki.start();
    let loop = 0;
    let found = false;
    const str = `${this.reactions[0]} **Yes**\n${this.reactions[1]} **No**\n${this.reactions[2]} **Probably**\n${this.reactions[3]} **Probably Not**\n${this.reactions[4]} **Don't know**\n${this.reactions[5]} **Back**\n${this.reactions[6]} **Stop**`;

    var author: Snowflake;
    if (message instanceof Message) author = message.author.id;
    else author = message.member?.id ?? message.channelID;
    const embed = new MessageEmbed()
      .setColor(color())
      .setTitle("Getting ready...")
      .setTimestamp()
      .setFooter("Please wait until all reactions appear.", message.client.user.displayAvatarURL());
    var msg = await message.channel.send(embed);
    for (const r of this.reactions) await msg.react(r);
    embed.setTitle("Question 1: " + aki.question)
      .setDescription(str)
      .setFooter("Please answer within 60 seconds.", message.client.user.displayAvatarURL());
    const filter = (reaction, user) => this.reactions.includes(reaction.emoji.name) && user.id === author && !user.bot;

    const collector = msg.createReactionCollector(filter, { idle: 6e4 });
    const collectorFunction = async (r: MessageReaction) => {
      setTimeout(async () => {
        const answerID = this.reactions.indexOf(r.emoji.name);
        await r.users.remove(author);
        if (answerID === 5 && aki.currentStep > 0) await aki.back();
        else if (answerID === 6) {
          embed.setTitle("Akinator was stopped");
          embed.setDescription("Thanks for playing!");
          embed.setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
          await msg.edit(embed);
          return collector.emit("end", true);
        } else if (answerID !== undefined) {
          if (found) {
            if (answerID === 0) {
              embed.setFooter("I am right!", message.client.user.displayAvatarURL());
              embed.setTitle("I got the correct answer!");
              embed.setDescription("");
              msg = await msg.edit({ content: `Looks like I got another one correct! This time after ${aki.currentStep} steps. Thanks for playing!`, embed: embed });
              return msg.reactions.removeAll().catch(() => { });
            }
            if (answerID === 1) {
              embed
                .setTitle("Akinator")
                .setDescription("Resuming game...")
                .setImage(undefined)
                .setFooter("Please wait patiently", message.client.user.displayAvatarURL());
              await msg.edit(embed);
              for (const r of this.reactions.slice(2)) await msg.react(r);
            }
            found = false;
          }
          await aki.step(answerID);
        }
        if ((aki.progress >= 90 && loop > 3) || aki.currentStep >= 79) {
          loop = 0;
          await aki.win();
          if (aki.answers && aki.answers.length) {
            found = true;
            const { name } = aki.answers[aki.guessCount - 1];
            const image = aki.answers[aki.guessCount - 1].absolute_picture_path;
            const description = aki.answers[aki.guessCount - 1].description || "";
            embed
              .setTitle("Akinator")
              .setDescription("Loading result...")
              .setFooter("Please wait patiently", message.client.user.displayAvatarURL());
            await msg.edit(embed);
            try {
              for (const r of this.reactions.slice(2)) {
                const re = msg.reactions.cache.get(r);
                await re.remove();
              }
            } catch (error) {
              NorthClient.storage.error("Failed to remove reactions.");
            }
            if (aki.currentStep >= 79) embed.setTitle("My Final Guess is... 🤔");
            else embed.setTitle("I'm thinking of... 🤔");
            embed.setDescription(`**${name}**\n**${description}**\n${this.reactions[0]} **Yes**\n${this.reactions[1]} **No**`);
            embed.setFooter("Am I correct?", message.client.user.displayAvatarURL());
            if (image) embed.setImage(image);
            msg = await msg.edit(embed);
            if (aki.currentStep >= 79) {
              embed.setDescription(`**${name}**\n**${description}**`);
              embed.setFooter("Hope I am correct!", message.client.user.displayAvatarURL());
              await msg.edit(embed);
              msg.reactions.removeAll().catch(() => { });
            }
          }
        } else {
          loop++;
          embed
            .setTitle(`Question ${aki.currentStep + 1}: ${aki.question}`)
            .setDescription(str)
            .setImage(undefined)
            .setFooter("Please answer within 60 seconds.", message.client.user.displayAvatarURL());
          msg = await msg.edit(embed);
        }
      }, 1000);
    };
    collector.on("collect", collectorFunction);
    collector.on("end", async (isEnded) => {
      if (!isEnded) {
        embed
          .setTitle("Akinator has timed out")
          .setDescription("Please start a new game.")
          .setImage(undefined)
          .setFooter("60 seconds have passed!", message.client.user.displayAvatarURL());
        await msg.edit(embed);
        msg.reactions.removeAll().catch(() => { });
      }
    });
  }

  async region(message: NorthMessage) {
    const regionEmbed = new MessageEmbed()
      .setColor(color())
      .setTitle("Akinator")
      .setDescription("Region list\n\n`" + this.regions.join("`\n`") + "`")
      .setFooter(`Use "${message.prefix}${this.name} ${this.usage}" to start a game.`, message.client.user.displayAvatarURL());
    await message.channel.send(regionEmbed);
  }
}

const cmd = new AkiCommand();
export default cmd;