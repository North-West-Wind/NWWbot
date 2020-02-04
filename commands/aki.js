const Discord = require("discord.js");
const aki = require("aki-api");
const { prefix } = require("../config.json");
var color = Math.floor(Math.random() * 16777214) + 1;

/**
 * module for Aki. Testing it out.
 * @type {{name: string, description: string, cooldown: number, guildOnly: boolean, run(*, *, *, *): Promise<Promise<Message|Message[]>|*>, help: (function(): string)}}
 */
module.exports = {
  name: "aki",
  description: "aki.",
  aliases: ["akinator"],
  cooldown: 25,
  type: "other",
  guildOnly: true,
  usage: "[region]",
  users: new Set(),

  regions: [
    "en",
    "en2",
    "en3",
    "ar",
    "cn",
    "de",
    "es",
    "fr",
    "il",
    "it",
    "jp",
    "kr",
    "nl",
    "pl",
    "pt",
    "ru",
    "tr"
  ],
  maxSteps: 80,

  yes: "✅",
  no: "❌",
  unknown: "❓",
  probably: "🤔",
  probablyNot: "🚫",
  back: "⬅",
  stop: "⏹",

  /**
   * run for aki command
   * @param bot the client
   * @param prefix the prefix of the user
   * @param message the message sent by the user
   * @param args the arguments from the user
   * @returns {Promise<Promise<Message|Message[]>|*>}
   */
  async execute(message, args) {
   if (args.length >= 1 && args[0].toLowerCase() === 'help') {
      return await message.channel.send(await this.help(prefix, message, args));
    }
    if (args.length >= 1 && args[0].toLowerCase() === 'region') {
      return await this.region(message, args);
    }
    const reactPermissions = message.guild.me.hasPermission(['ADD_REACTIONS', 'EMBED_LINKS', 'READ_MESSAGE_HISTORY'])
        && message.channel.permissionsFor(message.guild.me).has(['ADD_REACTIONS', 'EMBED_LINKS', 'READ_MESSAGE_HISTORY']);

    if (!reactPermissions) {
      return await message.channel.send('`❌` | I need reaction permissions, embed permissions, and read message history permissions.');
    }
    
    // get region if it exists
    let region = 'en';
    if (args.length >= 1) {
      const testRegion = args[0];
      const i = this.regions.findIndex(reg => testRegion === reg);

      if (i !== -1) {
        region = this.regions[i];
      }
    }
    const userReactions = message.reactions.filter(reaction =>
      reaction.users.has(message.author.id)
    );
    let info = await aki.start(region).catch(console.error);
    if (!info) {
      region = "en2";
      info = await aki.start(region).catch(console.error);
      if (!info) {
        region = "en3";
        info = await aki.start(region).catch(console.error);

        // if still no info, then we have no info.
        if (!info) {
          return await message.channel.send(
            "Aki servers are down :(\nPlease check back later."
          );
        }
      }
    }
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

    let nextInfo = {};
    nextInfo.nextQuestion = str;

    const embed = new Discord.RichEmbed()
      .setColor(color)
      .setTitle("Question 1: " + info.question)
      .setDescription(nextInfo.nextQuestion)
      .setTimestamp()
      .setFooter("Please answer within 60 seconds.");

    var msg = await message.channel.send(embed);
    await msg.react(this.yes);
    await msg.react(this.no);
    await msg.react(this.probably);
    await msg.react(this.probablyNot);
    await msg.react(this.unknown);
    await msg.react(this.back);
    await msg.react(this.stop);

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

    const collector = msg.createReactionCollector(filter);

    const timeout = setTimeout(() => {
      if (collector != null && collector.emit) {
        collector.emit("end");
      }
    }, 6e4);

    const collectorFunction = async (r, collector) => {
      // timeout to stop the collector (1 minute for each message)
      timeout.refresh();

      setTimeout(async () => {
        let answerID;
        switch (r.emoji.name) {
          case this.yes:
            answerID = 0;

            await r.remove(message.author.id);

            break;
          case this.no:
            answerID = 1;
            await r.remove(message.author.id);
            break;
          case this.unknown:
            answerID = 2;
            await r.remove(message.author.id);
            break;
          case this.probably:
            answerID = 3;
            await r.remove(message.author.id);
            break;
          case this.probablyNot:
            answerID = 4;
            await r.remove(message.author.id);
            break;
          case this.back:
            answerID = 5;
            await r.remove(message.author.id);
            break;
          case this.stop:
            answerID = 6;
            await r.remove(message.author.id);
            break;
        }
        if (answerID === 5) {
          if (nextInfo.nextStep > 0) {
            nextInfo = await aki.back(
              region,
              info.session,
              info.signature,
              answerID,
              nextInfo.nextStep || 0
            );
          }
        }
        // stop
        else if (answerID === 6) {
          if (collector != null && collector.emit) {
            collector.emit("end");
          }
          embed.setTitle("Akinator was stopped");
          embed.setDescription("Thanks for playing!");
          embed.setFooter("Have a nice day! :)");
          msg.edit(embed);
          return;
        } else if (answerID != null) {
          // found
          if (found) {
            
            // we had the right answer
            if (answerID === 0) {
              // send message
              embed.setFooter("I am right!")
              msg = await msg.edit(
                `Looks like I win again! This time after ${nextInfo.nextStep} steps. Thanks for playing!`,
                embed
              );

              if (collector != null && collector.emit) {
                collector.emit("end");
              }

              return;
            }
            // wrong answer
            if (answerID === 1) {
              embed.setTitle("Akinator")
            .setDescription("Resuming game...")
            .setImage(undefined)
            .setFooter("Please wait patiently")
            
            msg.edit(embed)
              await msg.react(this.probably)
              await msg.react(this.probablyNot)
              await msg.react(this.unknown)
              await msg.react(this.back)
              await msg.react(this.stop)
            }
            found = false; // not found, time to reset on our side
          }
          nextInfo = await aki.step(
            region,
            info.session,
            info.signature,
            answerID,
            nextInfo.nextStep || 0
          );
        }
        if ((nextInfo.progress >= 78 && loop > 3) || nextInfo.nextStep >= 79) {
          // reset loop to ensure we are not getting the same answer (we have to keep trying)
          loop = 0;

          // try to win, error either goes again or ends
          const win = await aki
            .win(region, info.session, info.signature, nextInfo.nextStep || 0)
            .catch(async error => {
              console.error(error);

              // can continue (max of 80 steps)
              if (nextInfo.nextStep < this.maxSteps) {
                nextInfo = await aki.step(
                  region,
                  info.session,
                  info.signature,
                  answerID,
                  nextInfo.nextStep || 0
                );
              } else {
                msg = await msg.edit("Akinator error has occurred.", {
                  embed: null
                });
                if (collector != null && collector.emit) {
                  collector.emit("end");
                }
              }
            });
          // found some answers
          if (win.answers != null && win.answers.length > 0) {
            found = true;
            const { name } = win.answers[0];
            const image = win.answers[0].absolute_picture_path;
            const description = win.answers[0].description || "";
            
            embed.setTitle("Akinator")
            .setDescription("Loading result...")
            .setFooter("Please wait patiently")
            
            msg.edit(embed)
            
            const probably = msg.reactions.get(this.probably);
            try {
              for (const user of probably.users.values()) {
                await probably.remove(user);
              }
            } catch (error) {
              console.error("Failed to remove reactions.");
            }
            const probablyNot = msg.reactions.get(this.probablyNot);
            try {
              for (const user of probablyNot.users.values()) {
                await probablyNot.remove(user);
              }
            } catch (error) {
              console.error("Failed to remove reactions.");
            }
            const unknown = msg.reactions.get(this.unknown);
            try {
              for (const user of unknown.users.values()) {
                await unknown.remove(user);
              }
            } catch (error) {
              console.error("Failed to remove reactions.");
            }
            const back = msg.reactions.get(this.back);
            try {
              for (const user of back.users.values()) {
                await back.remove(user);
              }
            } catch (error) {
              console.error("Failed to remove reactions.");
            }
            const stop = msg.reactions.get(this.stop);
            try {
              for (const user of stop.users.values()) {
                await stop.remove(user);
              }
            } catch (error) {
              console.error("Failed to remove reactions.");
            }

            if (nextInfo.nextStep >= 79) {
              embed.setTitle("My Final Guess is... 🤔");
            } else {
              embed.setTitle("I'm thinking of... 🤔");
            }

            // add description and image
            embed.setDescription(
              `**${name}**\n**${description}**\n${this.yes} **Yes**\n${this.no} **No**`
            );
            embed.setFooter("Am I correct?")
            if (image != null) {
              embed.setImage(image);
            }

            msg = await msg.edit(embed);

            // done with the game, we can't do anything else.
            if (nextInfo.nextStep >= 79) {
              embed.setDescription(`**${name}**\n**${description}**`)
              embed.setFooter("This is my final guess!")
              if (collector != null && collector.emit) {
                collector.emit("end");
              }
            }
          }
        }
        // keep going (didn't win or get close yet)
        else {
          loop++;
          embed
            .setTitle(
              `Question ${nextInfo.nextStep + 1}: ${nextInfo.nextQuestion}`
            )
            .setDescription(str)
            .setImage(undefined)
            .setFooter("Please answer within 60 seconds.");
          msg = await msg.edit(embed);
        }
      }, 1000);
    };
    // assign the function
    collector.on("collect", collectorFunction);

    collector.on("end", (collected, reason) => {
      // remove the user from the set
      this.users.delete(message.author.id);
      if (msg != null && msg.deleted != true) {
        msg.clearReactions().catch(console.error);
      }
    });
  },

  /**
   * shows help info.
   * @param bot the discord bot.
   * @param prefix the user's prefix.
   * @param message the discord message.
   * @param args the arguments parsed from the message.
   * @returns {Promise<{embed: *}>}
   */
  async help(prefix, message, args) {
    const helpEmbed = new Discord.RichEmbed()
      .setTitle("Akinator")
      .setDescription("• Can I guess it?\n• Supports up to 15 languages!")
      .addField("❯ Usage", `\`${prefix}aki [region]\``)
      .addField(
        "❯ Examples",
        `\`${prefix}aki fr\`
                \`${prefix}aki\``
      )
      .addField(
        "❯ Regions",
        "`[en, en2, en3, ar, cn, de, es, fr, il, it, jp, kr, nl, pl, pt, ru, tr]`"
      )
      .addField("❯ Aliases", "`akinator`")
      .setColor("PURPLE")
      .setFooter("It's magic. Trust me. ");

    return message.channel.send(helpEmbed);
  },
  async region(message, args) {
    const regionEmbed = new Discord.RichEmbed()
    .setColor(color)
    .setTitle("Akinator")
    .setDescription("Region list\n\n`" + this.regions.join("`\n`") + "`")
    .setFooter("Use \"" + prefix + "aki [region]\" to start a game.", message.client.user.displayAvatarURL)
    message.channel.send(regionEmbed);
  }
};
