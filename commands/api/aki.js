const Discord = require("discord.js");
const { Aki } = require("aki-api");
const { genPermMsg, color } = require("../../function");
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse, ApplicationCommandOptionChoice } = require("../../classes/Slash.js");

module.exports = {
  name: "aki",
  description: "Play Akinator on Discord!",
  aliases: ["akinator"],
  usage: "[region]",
  category: 7,
  regions: [
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
  ],
  maxSteps: 420,
  yes: "✅",
  no: "❌",
  unknown: "❓",
  probably: "⭕",
  probablyNot: "🚫",
  back: "⬅",
  stop: "⏹",
  permission: 90176,
  slashInit: true,
  register() {
    return ApplicationCommand.createBasic(module.exports).setOptions([
      new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "region", "The region/language to play in.").setChoices(
        this.regions.map(region => new ApplicationCommandOptionChoice(region, region)).concat([
          new ApplicationCommandOptionChoice("region", "Displays all regions available.")
        ])
      )
    ])
  },
  async slash() {
    return InteractionResponse.sendMessage("Initializing Akinator game...");
  },
  async postSlash(client, interaction, args) {
    await InteractionResponse.deleteMessage(client, interaction);
    args = args[0]?.value.split(/ +/) || [];
    const message = await InteractionResponse.createFakeMessage(client, interaction);
    await this.execute(message, args);
  },
  async execute(message, args) {
    if (args.length >= 1 && args[0].toLowerCase() === "region") return await this.region(message);
    if (!message.guild.me.permissions.has(this.permission) && message.channel.permissionsFor(message.guild.me).has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 1));
    let region = "en";
    if (args.length >= 1) {
      const testRegion = args[0];
      const i = this.regions.findIndex(reg => testRegion === reg);
      if (i !== -1) region = this.regions[i];
    }
    const aki = new Aki(region);
    await aki.start();
    let loop = 0;
    let found = false;
    const str = `${this.yes} **Yes**\n${this.no} **No**\n${this.probably} **Probably**\n${this.probablyNot} **Probably Not**\n${this.unknown} **Don't know**\n${this.back} **Back**\n${this.stop} **Stop**`;

    const embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Question 1: " + aki.question)
      .setDescription(str)
      .setTimestamp()
      .setFooter("Please answer within 60 seconds.", message.client.user.displayAvatarURL());
    var msg = await message.channel.send(embed);
    await msg.react(this.yes);
    await msg.react(this.no);
    await msg.react(this.probably);
    await msg.react(this.probablyNot);
    await msg.react(this.unknown);
    await msg.react(this.back);
    await msg.react(this.stop);
    const filter = (reaction, user) =>
      [
        this.yes,
        this.no,
        this.unknown,
        this.probably,
        this.probablyNot,
        this.back,
        this.stop
      ].includes(reaction.emoji.name) && user.id === message.author.id && !user.bot;

    const collector = msg.createReactionCollector(filter, { idle: 6e4 });
    const collectorFunction = async (r) => {
      setTimeout(async () => {
        let answerID;
        switch (r.emoji.name) {
          case this.yes:
            answerID = 0;
            break;
          case this.no:
            answerID = 1;
            break;
          case this.unknown:
            answerID = 2;
            break;
          case this.probably:
            answerID = 3;
            break;
          case this.probablyNot:
            answerID = 4;
            break;
          case this.back:
            answerID = 5;
            break;
          case this.stop:
            answerID = 6;
            break;
        }
        await r.users.remove(message.author.id);
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
              await msg.react(this.probably);
              await msg.react(this.probablyNot);
              await msg.react(this.unknown);
              await msg.react(this.back);
              await msg.react(this.stop);
            }
            found = false;
          }
          await aki.step(answerID);
        }
        if ((aki.progress >= 90 && loop > 3) || aki.currentStep >= 419) {
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
            const probably = msg.reactions.cache.get(this.probably);
            const probablyNot = msg.reactions.cache.get(this.probablyNot);
            const unknown = msg.reactions.cache.get(this.unknown);
            const back = msg.reactions.cache.get(this.back);
            const stop = msg.reactions.cache.get(this.stop);
            try {
              await probably.remove();
              await probablyNot.remove();
              await unknown.remove();
              await back.remove();
              await stop.remove();
            } catch (error) {
              NorthClient.storage.error("Failed to remove reactions.");
            }
            if (aki.currentStep >= 419) embed.setTitle("My Final Guess is... 🤔");
            else embed.setTitle("I'm thinking of... 🤔");
            embed.setDescription(`**${name}**\n**${description}**\n${this.yes} **Yes**\n${this.no} **No**`);
            embed.setFooter("Am I correct?", message.client.user.displayAvatarURL());
            if (image) embed.setImage(image);
            msg = await msg.edit(embed);
            if (aki.currentStep >= 419) {
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
  },
  async region(message) {
    const regionEmbed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Akinator")
      .setDescription("Region list\n\n`" + this.regions.join("`\n`") + "`")
      .setFooter(`Use "${message.prefix}${this.name} ${this.usage}" to start a game.`, message.client.user.displayAvatarURL());
    await message.channel.send(regionEmbed);
  }
};
