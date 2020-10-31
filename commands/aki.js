const Discord = require("discord.js");
const { Aki } = require("aki-api");
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
    'tr'
  ],
  maxSteps: 420,

  yes: "✅",
  no: "❌",
  unknown: "❓",
  probably: "⭕",
  probablyNot: "🚫",
  back: "⬅",
  stop: "⏹",
  async execute(message, args) {
    var ended = new Map();
    if (args.length >= 1 && args[0].toLowerCase() === "region") {
      return await this.region(message);
    }
    const reactPermissions =
      message.guild.me.permissions.has(90176) &&
      message.channel
        .permissionsFor(message.guild.me)
        .has(90176);

    if (!reactPermissions) {
      return await message.channel.send(
        "`❌` | I need reaction permissions, embed permissions, and read message history permissions."
      );
    }

    // get region if it exists
    let region = "en";
    if (args.length >= 1) {
      const testRegion = args[0];
      const i = this.regions.findIndex(reg => testRegion === reg);

      if (i !== -1) {
        region = this.regions[i];
      }
    }
    const aki = new Aki(region);
    await aki.start().catch(console.error);
    let loop = 0;
    let found = false;
    const str =
      this.yes +
      " **Yes**\n" +
      this.no +
      " **No**\n" +
      this.probably +
      " **Probably**\n" +
      this.probablyNot +
      " **Probably Not**\n" +
      this.unknown +
      " **Don't know**\n" +
      this.back +
      " **Back**\n" +
      this.stop +
      " **Stop**";

    const embed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle("Question 1: " + aki.question)
      .setDescription(str)
      .setTimestamp()
      .setFooter(
        "Please answer within 60 seconds.",
        message.client.user.displayAvatarURL()
      );

    var msg = await message.channel.send(embed);
    await msg.react(this.yes);
    await msg.react(this.no);
    await msg.react(this.probably);
    await msg.react(this.probablyNot);
    await msg.react(this.unknown);
    await msg.react(this.back);
    await msg.react(this.stop);

    await ended.set(msg.id, false);
    
    function pushEnded(ended) {
      ended.set(msg.id, true);
      if (msg != null && msg.deleted != true) {
        msg.reactions.removeAll().catch(console.error);
      }
    }

    const author = message.author.id;
    const filter = (reaction, user) =>
      [
        this.yes,
        this.no,
        this.unknown,
        this.probably,
        this.probablyNot,
        this.back,
        this.stop
      ].includes(reaction.emoji.name) &&
      user.id === author &&
      !user.bot;

    const collector = msg.createReactionCollector(filter, { idle: 6e4 });
    const collectorFunction = async (r) => {
      // timeout to stop the collector (1 minute for each message)

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
        if (answerID === 5) {
          if (aki.currentStep > 0) {
            await aki.back();
          }
        } else if (answerID === 6) {
          pushEnded(ended);
          embed.setTitle("Akinator was stopped");
          embed.setDescription("Thanks for playing!");
          embed.setFooter(
            "Have a nice day! :)",
            message.client.user.displayAvatarURL()
          );
          msg.edit(embed);
          return;
        } else if (answerID != null) {
          // found
          if (found) {
            // we had the right answer
            if (answerID === 0) {
              // send message
              embed.setFooter(
                "I am right!",
                message.client.user.displayAvatarURL()
              );
              embed.setTitle("I got the correct answer!");
              embed.setDescription("");
              msg = await msg.edit(
                `Looks like I got another one correct! This time after ${aki.currentStep} steps. Thanks for playing!`,
                embed
              );

              pushEnded(ended);

              return;
            }
            // wrong answer
            if (answerID === 1) {
              embed
                .setTitle("Akinator")
                .setDescription("Resuming game...")
                .setImage(undefined)
                .setFooter(
                  "Please wait patiently",
                  message.client.user.displayAvatarURL()
                );

              msg.edit(embed);
              await msg.react(this.probably);
              await msg.react(this.probablyNot);
              await msg.react(this.unknown);
              await msg.react(this.back);
              await msg.react(this.stop);
            }
            found = false; // not found, time to reset on our side
          }
          await aki.step(answerID);
        }
        if ((aki.progress >= 90 && loop > 3) || aki.currentStep >= 419) {
          // reset loop to ensure we are not getting the same answer (we have to keep trying)
          loop = 0;

          // try to win, error either goes again or ends
          await aki.win()
            .catch(async error => {
              console.error(error);

              // can continue (max of 80 steps)
              if (aki.currentStep < this.maxSteps) {
                await aki.step(answerID);
              } else {
                msg = await msg.edit("Akinator error has occurred.", {
                  embed: null
                });
                pushEnded(ended);
              }
            });
          // found some answers
          if (aki.answers != null && aki.answers.length > 0) {
            found = true;
            const { name } = aki.answers[aki.guessCount - 1];
            const image = aki.answers[aki.guessCount - 1].absolute_picture_path;
            const description = aki.answers[aki.guessCount - 1].description || "";

            embed
              .setTitle("Akinator")
              .setDescription("Loading result...")
              .setFooter(
                "Please wait patiently",
                message.client.user.displayAvatarURL()
              );

            msg.edit(embed);

            const probably = msg.reactions.cache.get(this.probably);
            try {
                await probably.remove();
              
            } catch (error) {
              console.error("Failed to remove reactions.");
            }
            const probablyNot = msg.reactions.cache.get(this.probablyNot);
            try {
                await probablyNot.remove();
              
            } catch (error) {
              console.error("Failed to remove reactions.");
            }
            const unknown = msg.reactions.cache.get(this.unknown);
            try {
           
                await unknown.remove();
              
            } catch (error) {
              console.error("Failed to remove reactions.");
            }
            const back = msg.reactions.cache.get(this.back);
            try {
        
                await back.remove();
              
            } catch (error) {
              console.error("Failed to remove reactions.");
            }
            const stop = msg.reactions.cache.get(this.stop);
            try {
      
                await stop.remove();
              
            } catch (error) {
              console.error("Failed to remove reactions.");
            }

            if (aki.currentStep >= 419) {
              embed.setTitle("My Final Guess is... 🤔");
            } else {
              embed.setTitle("I'm thinking of... 🤔");
            }

            // add description and image
            embed.setDescription(
              `**${name}**\n**${description}**\n${this.yes} **Yes**\n${this.no} **No**`
            );
            embed.setFooter(
              "Am I correct?",
              message.client.user.displayAvatarURL()
            );
            if (image != null) {
              embed.setImage(image);
            }

            msg = await msg.edit(embed);

            // done with the game, we can't do anything else.
            if (aki.currentStep >= 419) {
              embed.setDescription(`**${name}**\n**${description}**`);
              embed.setFooter(
                "Hope I am correct!",
                message.client.user.displayAvatarURL()
              );
              msg.edit(embed);
              pushEnded(ended);
            }
          }
        }
        // keep going (didn't win or get close yet)
        else {
          loop++;
          embed
            .setTitle(
              `Question ${aki.currentStep + 1}: ${aki.question}`
            )
            .setDescription(str)
            .setImage(undefined)
            .setFooter(
              "Please answer within 60 seconds.",
              message.client.user.displayAvatarURL()
            );
          msg = await msg.edit(embed);
        }
      }, 1000);
    };
    // assign the function
    collector.on("collect", collectorFunction);

    collector.on("end", async() => {
      // remove the user from the set
      const isEnded = await ended.get(msg.id);
      if (isEnded == false) {
        embed
          .setTitle("Akinator has timed out")
          .setDescription("Please start a new game.")
          .setImage(undefined)
          .setFooter(
            "60 seconds have passed!",
            message.client.user.displayAvatarURL()
          );
        msg.edit(embed);
        if (msg != null && msg.deleted != true) {
        msg.reactions.removeAll().catch(console.error);
      }
      }
      await ended.delete(msg.id);
      
    });
  },
  async region(message) {
    const regionEmbed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle("Akinator")
      .setDescription("Region list\n\n`" + this.regions.join("`\n`") + "`")
      .setFooter(
        'Use "' + message.prefix + 'aki [region]" to start a game.',
        message.client.user.displayAvatarURL()
      );
    message.channel.send(regionEmbed);
  }
};
