const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { shuffleArray, twoDigits } = require("../function.js");
const converter = require("number-to-words");
const { Image, createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const moment = require("moment");
const formatSetup = require("moment-duration-format");
formatSetup(moment);

function toString(x) {
  let colorStr = "";
  let number = x.number;
  switch (x.color) {
    case 0:
      colorStr = "Yellow";
      break;
    case 1:
      colorStr = "Blue";
      break;
    case 2:
      colorStr = "Green";
      break;
    case 3:
      colorStr = "Red";
      break;
    case 4:
      colorStr = "Special";
      break;
  }
  if (x.number > 9) {
    switch (x.number) {
      case 10:
        number = "Reverse";
        break;
      case 11:
        number = "Skip";
        break;
      case 12:
        number = "Draw 2";
        break;
      case 13:
        number = "Draw 4";
        break;
      case 14:
        number = "Change Color";
        break;
    }
  }
  return `**${colorStr}** - **${number}**`;
}

async function canvasImg(assets, cards) {
  let canvas = createCanvas((cards.length < 5 ? 165 * cards.length : 825), Math.ceil(cards.length / 5) * 256);
  let ctx = canvas.getContext("2d");
  for (let i = 0; i < cards.length; i++) {
    let url = await assets.find(x => x.id === twoDigits(cards[i].color) + twoDigits(cards[i].number)).url;
    let img = await loadImage(url);
    ctx.drawImage(img, (i % 5) * 165, Math.floor(i / 5) * 256, 165, 256);
  }
  return await canvas.toBuffer();
}

module.exports = {
  name: "uno",
  description: "Play UNO with your friends!",
  usage: " ",
  async execute(message, args) {
    var msg = await message.channel.send(
      "Alright, we will start an UNO game. Who will be invited? Please mention them!"
    );
    var collected = await message.channel
      .awaitMessages(x => x.author.id === message.author.id, {
        max: 1,
        time: 30000,
        errors: ["time"]
      })
      .catch(err => msg.edit("Don't make me wait too long. I'm busy."));
    if (!collected || !collected.first())
      return msg.edit("Don't make me wait too long. I'm busy.");
    msg.edit(`You invited ${collected.first().content} to play UNO.`);
    collected.first().delete();
    if (collected.first().mentions.members.size === 0)
      return msg.edit("You didn't invite anyone!");
    if (collected.first().mentions.members.find(x => x.user.bot))
      return msg.edit("Bots cannot play with you!");
    if (
      collected.first().mentions.members.find(x => x.id === message.author.id)
    )
      return msg.edit("Why would you invite yourself?");
    var responses = 0;
    var accepted = 0;
    var participants = [message.author];
    collected.first().mentions.members.forEach(async member => {
      participants.push(member.user);
      var em = new Discord.MessageEmbed()
        .setAuthor(message.author.tag, message.author.displayAvatarURL())
        .setColor(color)
        .setTitle(`${message.author.tag} invited you to play UNO!`)
        .setDescription(
          `Server: **${message.guild.name}**\nChannel: **${message.channel.name}**\nAccept invitation?\n\n✅Accept\n❌Decline`
        )
        .setTimestamp()
        .setFooter(
          "Please decide in 30 seconds.",
          message.client.user.displayAvatarURL()
        );
      var mesg = await member.user.send(em).catch(err => {
        message.channel.send(
          `Failed to send invitation to **${member.user.tag}**.`
        );
        responses += 1;
      });
      await mesg.react("✅");
      await mesg.react("❌");
      var rCollected = await mesg
        .awaitReactions(
          (r, u) => ["✅", "❌"].includes(r.emoji.name) && u.id === member.id,
          { max: 1, time: 30000, errors: ["time"] }
        )
        .catch(async err => {
          mesg.reactions.removeAll().catch(() => { });
        });
      responses += 1;
      mesg.reactions.removeAll().catch(() => { });
      if (!rCollected || !rCollected.first()) {
        em.setDescription("Timed Out").setFooter("The game was cancelled.");
        message.channel.send(`**${member.user.tag}** is not active now.`);
        return await mesg.edit(em);
      }
      var reaction = rCollected.first();
      if (reaction.emoji.name === "✅") {
        message.channel.send(`**${member.user.tag}** accepted the invitation!`);
        em.setDescription(
          `Server: **${message.guild.name}**\nChannel: **${message.channel.name}**\n` +
          "You accepted the invitation!"
        ).setFooter(
          "Head to the channel now.",
          message.client.user.displayAvatarURL()
        );
        mesg.edit(em);
        accepted += 1;
      } else {
        message.channel.send(`**${member.user.tag}** declined the invitation!`);
        em.setDescription(
          `Server: **${message.guild.name}**\nChannel: **${message.channel.name}**\n` +
          "You declined the invitation!"
        ).setFooter(
          "Head to the channel now.",
          message.client.user.displayAvatarURL()
        );
        mesg.edit(em);
      }
    });

    let assets;
    var check = setInterval(async () => {
      if (responses >= collected.first().mentions.members.size) {
        clearInterval(check);
        if (responses !== accepted) {
          return message.channel.send(
            "The game cannot start as someone didn't accept the invitation!"
          );
        } else {
          let readFile = await fs.readFileSync("../.glitch-assets", "utf8");
          let arr = readFile.split("\n");
          for (let i = 0; i < arr.length - 1; i++) arr[i] = JSON.parse(arr[i]);
          assets = arr.filter(x => !x.deleted && x.type === "image/png" && x.imageWidth === 165 && x.imageHeight === 256).map(x => {
            return {
              id: x.name.slice(0, -4),
              url: x.url
            };
          });
          let mesg = await message.channel.send("The game will start soon!");
          var nano = Date.now();
          try {
            mesg = await prepare(mesg, nano);
            await handle(mesg, nano);
          } catch (err) { return console.error(err) }
        }
      }
    }, 1000);

    var players = new Discord.Collection();

    async function prepare(mesg, nano) {
      var uno = console.uno;
      var order = shuffleArray(participants);
      message.channel.send(
        "The order has been decided!" +
        order.map(x => `\n${order.indexOf(x) + 1}. **${x.tag}**`)
      );
      for (const participant of order) {
        let cards = console.card.random(7);
        players.set(participant.id, { user: participant, card: cards });
      }

      for (const [key, player] of players) {
        var readCard = player.card.map(x => toString(x));
        let em = new Discord.MessageEmbed()
          .setColor(color)
          .setTitle(`The cards have been distributed!`)
          .attachFiles([{ attachment: await canvasImg(assets, player.card), name: "canvas.png" }])
          .setImage("attachment://canvas.png")
          .setDescription(
            `Your cards:\n\n${readCard.join("\n")}`
          )
          .setTimestamp()
          .setFooter(
            "Game started.",
            message.client.user.displayAvatarURL()
          );
        player.user.send(em).then(msg => setTimeout(() => msg.edit({ content: "**[Your cards from beginning]**", embed: null }), 30000));
      }
      var numbersOnly = console.card.filter(
        x => x.color < 4 && x.number < 10
      );
      var initial = numbersOnly.random();
      let card = toString(initial);
      uno.set(nano, { players: players, card: initial, cards: 1 });
      let em = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle("The 1st card has been placed!")
        .setThumbnail(message.client.user.displayAvatarURL())
        .setImage(assets.find(x => x.id === twoDigits(initial.color) + twoDigits(initial.number)).url)
        .setDescription(`The card is ${card}`)
        .setTimestamp()
        .setFooter(`Placed by ${message.client.user.tag}`, message.client.user.displayAvatarURL());
      mesg.delete();
      return await mesg.channel.send({ content: null, embed: em });
    }

    async function handle(mesg, nano) {
      let uno = console.uno;
      let drawCard = 0;
      let skip = false;
      var won = false;
      let nores = 0;
      while (!won) {
        if (nores === players.size) {
          mesg.edit({ embed: null, content: "No one responsded. Therefore, the game ended." });
          return;
        }
        nores = 0;
        let i = -1;
        for (const [key, player] of players) {
          i++;
          let top = await uno.get(nano).card;
          if (skip) {
            let skipEm = new Discord.MessageEmbed()
              .setTitle("Your turn was skipped!")
              .setDescription("Someone placed a Skip card!")
              .setColor(color)
              .setTimestamp()
              .setFooter("Better luck next time!", message.client.user.displayAvatarURL());
            player.user.send(skipEm).then(msg => setTimeout(() => msg.edit({ content: "Turn skipped", embed: null }), 10000));
            players.set(key, player);
            uno.set(nano, { players: players, card: top, cards: await uno.get(nano).cards });
            skip = false;
            continue;
          }
          let placeable = player.card.filter(x => {
            if (top.number === 12) {
              if (drawCard > 0)
                return x.number === 12 || x.number === 13;
              return x.color === 4 || x.color === top.color || x.number === 12;
            }
            if (top.number === 13) {
              if (drawCard > 0)
                return x.color === 4 && x.number === 13;
              return x.color === top.color;
            }
            return (x.color === 4) || (x.color === top.color || x.number === top.number)
          });
          let readCard = player.card.map(x => toString(x));
          let em = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(`It's your turn now!`)
            .setDescription(
              `The current card is ${toString(top)}\nYour cards:\n\n${readCard.join("\n")}\n\n📥 Place\n📤 Draw\nIf you draw, you will draw **${drawCard > 0 ? drawCard + " cards" : "1 card"}**.`
            )
            .attachFiles([{ attachment: await canvasImg(assets, player.card), name: "yourCard.png" }])
            .setImage("attachment://yourCard.png")
            .setTimestamp()
            .setFooter(
              "Please decide in 2 minutes.",
              message.client.user.displayAvatarURL()
            );
          let mssg = await player.user.send(em);
          await mssg.react("📥");
          await mssg.react("📤");
          try {
            var collected = await mssg.awaitReactions((r, u) => ["📥", "📤"].includes(r.emoji.name) && u.id === player.user.id, { time: 120 * 1000, max: 1, errors: ["time"] });
          } catch (err) { }
          let newCard = console.card.random(drawCard > 0 ? drawCard : 1);
          let card = !newCard.length ? [toString(newCard)] : newCard.map(x => toString(x));
          let draw = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(`${player.user.tag} drew a card!`)
            .setThumbnail(message.client.user.displayAvatarURL())
            .setDescription(`The top card is ${toString(top)}`)
            .setImage(assets.find(x => x.id === twoDigits(top.color) + twoDigits(top.number)).url)
            .setTimestamp()
            .setFooter(`Placed by ${message.client.user.tag}`, message.client.user.displayAvatarURL());
          if (!collected || !collected.first()) {
            em.setDescription(`2 minutes have passed!\nYou have been forced to draw ${card.length} card${card.length > 1 ? "s" : ""}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`)
              .attachFiles([{ attachment: await canvasImg(assets, newCard), name: "newCard.png" }])
              .setImage("attachment://newCard.png")
              .setFooter("Your turn ended.", message.client.user.displayAvatarURL());
            mssg.edit(em).then(msg => setTimeout(() => {
              msg.delete();
              msg.channel.send({ embed: null, content: `You drew ${card.length} card${card.length > 1 ? "s" : ""}: ${card.join(", ")}` })
            }, 10000));
            player.card = player.card.concat(newCard);
            players.set(key, player);
            uno.set(nano, { players: players, card: top, cards: uno.get(nano).cards });
            drawCard = 0;
            draw.setDescription(`${player.user.tag} drew ${card.length} card${card.length > 1 ? "s" : ""}!`)
            mesg.edit(draw);
            nores += 1;
            continue;
          }
          if (collected.first().emoji.name === "📥") {
            if (placeable.length == 0) {
              em.setDescription(`You don't have any card to place so you are forced to draw ${card.length} card${card.length > 1 ? "s" : ""}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`)
                .attachFiles([{ attachment: await canvasImg(assets, newCard), name: "newCard.png" }])
                .setImage("attachment://newCard.png")
                .setFooter("Your turn ended.", message.client.user.displayAvatarURL());
              mssg.edit(em).then(msg => setTimeout(() => {
                msg.delete();
                msg.channel.send({ embed: null, content: `You drew ${card.length} card${card.length > 1 ? "s" : ""}: ${card.join(", ")}` })
              }, 10000));
              player.card = player.card.concat(newCard);
              players.set(key, player);
              uno.set(nano, { players: players, card: top, cards: await uno.get(nano).cards });
              drawCard = 0;
              draw.setDescription(`${player.user.tag} drew ${card.length} card${card.length > 1 ? "s" : ""}!`)
              mesg.edit(draw);
              continue;
            }
            let keys = [];
            let placeCard = placeable.map(x => {
              keys.push(console.card.findKey(f => f === x));
              return toString(x) + ` : **${console.card.findKey(f => f === x)}**`
            });
            em.setDescription(`Cards you can place:\n\n${placeCard.join("\n")}\nType the ID after the card to place.`)
              .attachFiles([{ attachment: await canvasImg(assets, placeable), name: "place.png" }])
              .setImage("attachment://place.png")
              .setFooter(`Please decide in 2 mintues.`, message.client.user.displayAvatarURL());
            mssg.edit(em);
            try {
              var collected = await mssg.channel.awaitMessages(x => x.author.id === player.user.id, { max: 1, time: 120 * 1000, errors: ["time"] });
            } catch (err) { }
            if (!collected || !collected.first() || !collected.first().content) {
              em.setDescription(`2 minutes have passed!\nYou have been forced to draw ${card.length} card${card.length > 1 ? "s" : ""}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`)
                .attachFiles([{ attachment: await canvasImg(assets, newCard), name: "newCard.png" }])
                .setImage("attachment://newCard.png")
                .setFooter("Your turn ended.", message.client.user.displayAvatarURL());
              mssg.edit(em).then(msg => setTimeout(() => {
                msg.delete();
                msg.channel.send({ embed: null, content: `You drew ${card.length} card${card.length > 1 ? "s" : ""}: ${card.join(", ")}` })
              }, 10000));
              player.card = player.card.concat(newCard);
              players.set(key, player);
              uno.set(nano, { players: players, card: top, cards: await uno.get(nano).cards });
              drawCard = 0;
              draw.setDescription(`${player.user.tag} drew ${card.length} card${card.length > 1 ? "s" : ""}!`)
              mesg.edit(draw);
              nores += 1;
              continue;
            }
            if (!keys.includes(collected.first().content)) {
              em.setDescription(`You cannot place that card so you drew ${card.length} card${card.length > 1 ? "s" : ""}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`)
                .attachFiles([{ attachment: await canvasImg(assets, newCard), name: "newCard.png" }])
                .setImage("attachment://newCard.png")
                .setFooter("Your turn ended.", message.client.user.displayAvatarURL());
              mssg.delete();
              mssg.channel.send(em).then(msg => setTimeout(() => {
                msg.delete();
                msg.channel.send({ embed: null, content: `You drew ${card.length} card${card.length > 1 ? "s" : ""}: ${card.join(", ")}` })
              }, 10000));
              player.card = player.card.concat(newCard);
              players.set(key, player);
              uno.set(nano, { players: players, card: top, cards: await uno.get(nano).cards });
              drawCard = 0;
              draw.setDescription(`${player.user.tag} drew ${card.length} card${card.length > 1 ? "s" : ""}!`)
              mesg.edit(draw);
              continue;
            }
            let placedCard = console.card.get(collected.first().content);
            let changeColor = false;
            if (placedCard.number === 13 || placedCard.number === 14) {
              em.setDescription("Please choose your color:").setFooter("Please decide in 2 minutes.");
              mssg.delete();
              mssg = await mssg.channel.send(em);
              let colors = ["🟥", "🟨", "🟦", "🟩"];
              for (const rColor of colors) {
                mssg.react(rColor);
              }
              try {
                var collected = await mssg.awaitReactions((r, u) => colors.includes(r.emoji.name) && u.id === player.user.id, { max: 1, time: 120 * 1000, errors: ["time"] });
              } catch (err) { }
              if (!collected || !collected.first()) {
                em.setDescription(`2 minutes have passed!\nYou have been forced to draw ${card.length} card${card.length > 1 ? "s" : ""}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`)
                  .attachFiles([{ attachment: await canvasImg(assets, newCard), name: "newCard.png" }])
                  .setImage("attachment://newCard.png")
                  .setFooter("Your turn ended.", message.client.user.displayAvatarURL());
                mssg.edit(em).then(msg => setTimeout(() => {
                  msg.delete();
                  msg.channel.send({ embed: null, content: `You drew ${card.length} card${card.length > 1 ? "s" : ""}: ${card.join(", ")}` })
                }, 10000));
                player.card = player.card.concat(newCard);
                players.set(key, player);
                uno.set(nano, { players: players, card: top, cards: await uno.get(nano).cards });
                drawCard = 0;
                draw.setDescription(`${player.user.tag} drew ${card.length} card${card.length > 1 ? "s" : ""}!`)
                mesg.edit(draw);
                nores += 1;
                continue;
              }
              let reaction = collected.first();
              let chosenColor;
              let colorStr;
              switch (reaction.emoji.name) {
                case colors[0]:
                  chosenColor = 3;
                  colorStr = "Red";
                  break;
                case colors[1]:
                  chosenColor = 0;
                  colorStr = "Yellow";
                  break;
                case colors[2]:
                  chosenColor = 1;
                  colorStr = "Blue";
                  break;
                case colors[3]:
                  chosenColor = 2;
                  colorStr = "Green";
                  break;
              }
              player.card.splice(player.card.indexOf(placedCard), 1);
              players.set(key, player);
              placedCard = { color: chosenColor, number: placedCard.number };
              em.setDescription(`The color you chose: ${colorStr}`).setFooter("Your turn ended.", message.client.user.displayAvatarURL());
            } else {
              player.card.splice(player.card.indexOf(placedCard), 1);
              players.set(key, player);
              em.setDescription(`You placed ${toString(placedCard)}!`).setFooter("Your turn ended.", message.client.user.displayAvatarURL());
            }
            mssg.delete();
            mssg.channel.send(em).then(msg => setTimeout(() => {
              msg.delete();
              msg.channel.send({ embed: null, content: `You placed: ${toString(placedCard)}` })
            }, 10000));
            let data = await uno.get(nano);
            await uno.set(nano, { players: players, card: placedCard, cards: data.cards + 1 });
            let placed = new Discord.MessageEmbed()
              .setColor(color)
              .setTitle(`The ${converter.toOrdinal(data.cards + 1)} card has been placed`)
              .setThumbnail(player.user.displayAvatarURL())
              .setDescription(`The top card is ${toString(placedCard)}`)
              .setImage(assets.find(x => x.id === twoDigits(placedCard.color) + twoDigits(placedCard.number)).url)
              .setTimestamp()
              .setFooter(`Placed by ${player.user.tag}`, console.user.displayAvatarURL());
            mesg.edit(placed);
            let reversing = false;
            switch (placedCard.number) {
              case 10:
                reversing = true;
                break;
              case 11:
                skip = true;
                break;
              case 12:
                drawCard += 2;
                break;
              case 13:
                drawCard += 4;
                break;
            }
            if (player.card.length === 0) {
              won = true;
              let data = await console.uno.get(nano);
              let win = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle(`${player.user.tag} won!`)
                .setThumbnail(player.user.displayAvatarURL())
                .setDescription(`Congratulations to **${player.user.tag}**!\nThe game ended after **${data.cards} cards**, ${moment.duration(Date.now() - nano, "milliseconds").format()}.\nThanks for playing!`)
                .setTimestamp()
                .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
              setTimeout(() => mesg.edit(win), 3000);
              uno.delete(nano);
              break;
            } else {
              if (reversing) {
                let playerKeys = Array.from(players.keys());
                let playerValues = Array.from(players.values());
                let keySliced = playerKeys.slice(0, i);
                let valueSliced = playerValues.slice(0, i);
                playerKeys = playerKeys.slice(i).concat(keySliced).reverse();
                playerValues = playerValues.slice(i).concat(valueSliced).reverse();
                await players.clear();
                for (let s = 0; s < playerKeys.length; s++) {
                  players.set(playerKeys[s], playerValues[s]);
                }
                break;
              }
              continue;
            }
          } else {
            em.setDescription(`You drew ${card.length} card${card.length > 1 ? "s" : ""}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`)
              .attachFiles([{ attachment: await canvasImg(assets, newCard), name: "newCard.png" }])
              .setImage("attachment://newCard.png")
              .setFooter("Your turn ended.", message.client.user.displayAvatarURL());
            mssg.delete();
            mssg.channel.send(em).then(msg => setTimeout(() => {
              msg.delete();
              msg.channel.send({ embed: null, content: `You drew ${card.length} card${card.length > 1 ? "s" : ""}: ${card.join(", ")}` })
            }, 10000));
            player.card = player.card.concat(newCard);
            players.set(key, player);
            uno.set(nano, { players: players, card: top, cards: uno.get(nano).cards });
            drawCard = 0;
            draw.setDescription(`${player.user.tag} drew ${card.length} card${card.length > 1 ? "s" : ""}!`)
            mesg.edit(draw);
            continue;
          }
        }
      }
    }
  }
};
