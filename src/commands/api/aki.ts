import { Message, MessageEmbed, MessageReaction, Snowflake } from "discord.js";
import { Aki, region } from "aki-api";
import { SlashCommand, NorthMessage, NorthInteraction } from "../../classes/NorthClient";
import { color } from "../../function.js";

export class AkiCommand implements SlashCommand {
  name = "aki";
  description = "Play Akinator on Discord!";
  aliases = ["akinator"];
  usage = "[region]";
  category = 7;
  permissions = {
    guild: { me: 90176 },
    channel: { me: 90176 }
  };

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
      {
        name: "region",
        description: "The region/language to play in.",
        required: false,
        type: "STRING",
        choices: this.regions.map(region => ({ name: region, value: region })).concat([{ name: "region", value: "region" }])
      }
    ];
  }

  async execute(interaction: NorthInteraction) {
    let region = interaction.options.getString("region") || "en";
    await interaction.deferReply();
    await this.logic(interaction, region);
  }

  async run(message: NorthMessage, args: string[]) {
    if (args.length >= 1 && args[0].toLowerCase() === "region") return await this.region(message);
    let region = "en";
    if (args.length >= 1) {
      const testRegion = args[0];
      const i = this.regions.findIndex(reg => testRegion === reg);
      if (i !== -1) region = this.regions[i];
    }
    await this.logic(message, region);
  };

  async logic(message: Message | NorthInteraction, region: string) {
    const aki = new Aki({ region: <region>region });
    await aki.start();
    let loop = 0;
    let found = false;
    const str = `${this.reactions[0]} **Yes**\n${this.reactions[1]} **No**\n${this.reactions[2]} **Probably**\n${this.reactions[3]} **Probably Not**\n${this.reactions[4]} **Don't know**\n${this.reactions[5]} **Back**\n${this.reactions[6]} **Stop**`;

    var author: Snowflake;
    if (message instanceof Message) author = message.author.id;
    else author = message.user.id;
    const embed = new MessageEmbed()
      .setColor(color())
      .setTitle("Getting ready...")
      .setTimestamp()
      .setFooter({ text: "Please wait until all reactions appear.", iconURL: message.client.user.displayAvatarURL() });
    var msg: Message;
    if (message instanceof Message) msg = await message.channel.send({ embeds: [embed] });
    else msg = <Message>await message.editReply({ embeds: [embed] });
    for (const r of this.reactions) await msg.react(r);
    embed.setTitle("Question 1: " + aki.question)
      .setDescription(str)
      .setFooter({ text: "Please answer within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
    await msg.edit({ embeds: [embed] });
    const filter = (reaction, user) => this.reactions.includes(reaction.emoji.name) && user.id === author && !user.bot;
    const collector = msg.createReactionCollector({ filter, idle: 6e4 });
    const collectorFunction = async (r: MessageReaction) => {
      const answerID = this.reactions.indexOf(r.emoji.name);
      await r.users.remove(author).catch(() => {});
      if (answerID === 5 && aki.currentStep > 0) await aki.back();
      else if (answerID === 6) {
        embed.setTitle("Akinator was stopped");
        embed.setDescription("Thanks for playing!");
        embed.setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [embed] });
        return collector.emit("end", true);
      } else if (answerID !== undefined) {
        if (found) {
          if (answerID === 0) {
            embed.setFooter({ text: "I am right!", iconURL: message.client.user.displayAvatarURL() });
            embed.setTitle("I got the correct answer!");
            embed.setDescription("");
            msg = await msg.edit({ content: `Looks like I got another one correct! This time after ${aki.currentStep} steps. Thanks for playing!`, embeds: [embed] });
            return msg.reactions.removeAll().catch(() => { });
          }
          if (answerID === 1) {
            embed
              .setTitle("Akinator")
              .setDescription("Resuming game...")
              .setImage(undefined)
              .setFooter({ text: "Please wait patiently", iconURL: message.client.user.displayAvatarURL() });
            await msg.edit({ embeds: [embed] });
            for (const r of this.reactions.slice(2)) await msg.react(r);
          }
          found = false;
        }
        await aki.step(<any>answerID);
      }
      if ((aki.progress >= 90 && loop > 3) || aki.currentStep >= 79) {
        loop = 0;
        await aki.win();
        if (aki.answers && aki.answers.length) {
          found = true;
          const guess = <any><unknown>aki.answers[aki.guessCount - 1];
          const { name, absolute_picture_path: image } = guess;
          const description = guess.description || "";
          embed
            .setTitle("Akinator")
            .setDescription("Loading result...")
            .setFooter({ text: "Please wait patiently", iconURL: message.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [embed] });
          try {
            for (const r of this.reactions.slice(2)) {
              const re = msg.reactions.cache.get(r);
              await re.remove();
            }
          } catch (error: any) {
            console.error("Failed to remove reactions.");
          }
          if (aki.currentStep >= 79) embed.setTitle("My Final Guess is... 🤔");
          else embed.setTitle("I'm thinking of... 🤔");
          embed.setDescription(`**${name}**\n**${description}**\n${this.reactions[0]} **Yes**\n${this.reactions[1]} **No**`);
          embed.setFooter({ text: "Am I correct?", iconURL: message.client.user.displayAvatarURL() });
          if (image) embed.setImage(image);
          msg = await msg.edit({ embeds: [embed] });
          if (aki.currentStep >= 79) {
            embed.setDescription(`**${name}**\n**${description}**`);
            embed.setFooter({ text: "Hope I am correct!", iconURL: message.client.user.displayAvatarURL() });
            await msg.edit({ embeds: [embed] });
            msg.reactions.removeAll().catch(() => { });
          }
        }
      } else {
        loop++;
        embed
          .setTitle(`Question ${aki.currentStep + 1}: ${aki.question}`)
          .setDescription(str)
          .setImage(undefined)
          .setFooter({ text: "Please answer within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [embed] });
      }
    };
    collector.on("collect", collectorFunction);
    collector.on("end", async (isEnded) => {
      if (!isEnded) {
        embed
          .setTitle("Akinator has timed out")
          .setDescription("Please start a new game.")
          .setImage(undefined)
          .setFooter({ text: "60 seconds have passed!", iconURL: message.client.user.displayAvatarURL() });
        await msg.edit({ embeds: [embed] });
        msg.reactions.removeAll().catch(() => { });
      }
    });
  }

  async region(message: NorthMessage) {
    const regionEmbed = new MessageEmbed()
      .setColor(color())
      .setTitle("Akinator")
      .setDescription("Region list\n\n`" + this.regions.join("`\n`") + "`")
      .setFooter({ text: `Use "${message.prefix}${this.name} ${this.usage}" to start a game.`, iconURL: message.client.user.displayAvatarURL() });
    await message.channel.send({ embeds: [regionEmbed] });
  }
}

const cmd = new AkiCommand();
export default cmd;