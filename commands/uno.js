const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { shuffle, contain } = require("../function.js");
const converter = require("number-to-words");

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
          mesg.reactions.removeAll().catch(() => {});
          em.setDescription("Timed Out").setFooter("The game was cancelled.");
          message.channel.send(`**${member.user.tag}** is not active now.`);
          await mesg.edit(em);
        });
      responses += 1;
      mesg.reactions.removeAll().catch(() => {});
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

    var check = setInterval(async () => {
      if (responses >= collected.first().mentions.members.size) {
        clearInterval(check);
        if (responses !== accepted) {
          return message.channel.send(
            "The game cannot start as someone didn't accept the invitation!"
          );
        } else {
          let mesg = await message.channel.send("The game will start soon!");
          var nano = process.hrtime.bigint();
          mesg = await prepare(mesg, nano);
          await handle(mesg, nano);
        }
      }
    }, 1000);

    var players = new Discord.Collection();

    async function prepare(mesg, nano) {
      var uno = message.client.uno;
      var order = shuffle(participants);
      message.channel.send(
        "The order has been decided!" +
          order.map(x => `\n${order.indexOf(x) + 1}. **${x.tag}**`)
      );
      for (const participant of order) {
        let cards = message.client.card.random(7);
        players.set(participant.id, { user: participant, card: cards });
      }

      for (const [key, player] of players) {
        var readCard = player.card.map(x => toString(x));
        let em = new Discord.MessageEmbed()
          .setColor(color)
          .setTitle(`The cards have been distributed!`)
          .setDescription(
            `Your cards:\n\n${readCard.join("\n")}`
          )
          .setTimestamp()
          .setFooter(
            "Game started.",
            message.client.user.displayAvatarURL()
          );
        player.user.send(em).then(msg => setTimeout(() => msg.edit("**[Your cards from beginning]**"), 30000));
      }
      var numbersOnly = message.client.card.filter(
        x => x.color < 4 && x.number < 10
      );
      var initial = numbersOnly.random();
      let card = toString(initial);
      uno.set(nano, { players: players, card: initial, cards: 1 });
      let em = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle("The 1st card has been placed!")
        .setThumbnail(message.client.user.displayAvatarURL())
        .setDescription(`The card is ${card}`)
        .setTimestamp()
        .setFooter(`Placed by ${message.client.user.tag}`, message.client.user.displayAvatarURL());
      mesg.delete();
      return await mesg.channel.send({ content: null, embed: em });
    }

    async function handle(mesg, nano) {
      let uno = message.client.uno;
      let drawCard = 0;
      let skip = false;
      var won = false;
      let nores = 0;
      while(!won) {
      if(nores === players.size) {
        mesg.edit({ embed: null, content: "No one responsded. Therefore, the game ended."});
        return;
      }
      nores = 0;
      for (const [key, player] of players) {
        let top = await uno.get(nano).card;
        if(skip) {
          let skipEm = new Discord.MessageEmbed()
          .setTitle("Your turn was skipped!")
          .setDescription("Someone placed a Skip card!")
          .setColor(color)
          .setTimestamp()
          .setFooter("Better luck next time!", message.client.user.displayAvatarURL());
          player.user.send(skipEm).then(msg => setTimeout(() => msg.edit({ content: "Turn skipped", embed: null }), 10000));
          players.set(key, player);
          uno.set(nano, { players: players, card: top, cards: await uno.get(nano).cards});
          skip = false;
          continue;
        }
        let placeable = player.card.filter(x => {
          if(top.number === 12) {
            if(drawCard > 0)
              return x.number === 12 || x.number === 13;
            return x.color === top.color || x.number === 12;
          }
          if(top.number === 13) {
            if(drawCard > 0)
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
          .setTimestamp()
          .setFooter(
            "Please decide in 2 minutes.",
            message.client.user.displayAvatarURL()
          );
        let mssg = await player.user.send(em);
        await mssg.react("📥");
        await mssg.react("📤");
        try {
          var collected = await mssg.awaitReactions((r, u) => ["📥", "📤"].includes(r.emoji.name) && u.id === player.user.id, { time: 120 * 1000, max: 1, errors: ["time"]});
        } catch(err) {}
        let newCard = message.client.card.random(drawCard > 0 ? drawCard : 1);
        let card = !newCard.length ? [toString(newCard)] : [];
        if(newCard.length) for(const newCardd of newCard) card.push(toString(newCardd));
        let draw = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(`${player.user.tag} drew a card!`)
        .setThumbnail(message.client.user.displayAvatarURL())
        .setDescription(`The top card is ${toString(top)}`)
        .setTimestamp()
        .setFooter(`Placed by ${message.client.user.tag}`, message.client.user.displayAvatarURL());
        if(!collected || !collected.first()) {
          em.setDescription(`2 minutes have passed!\nYou have been forced to draw ${card.length > 1 ? "cards" : "a card"}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`).setFooter("Your turn ended.", message.client.user.displayAvatarURL());
          mssg.edit(em).then(msg => setTimeout(() => msg.edit({ embed: null, content: `You drew ${card.length > 1 ? "cards" : "a card"}: ${card.join(", ")}`}), 10000));
          player.card = player.card.concat(newCard);
          players.set(key, player);
          uno.set(nano, { players: players, card: top, cards: uno.get(nano).cards});
          drawCard = 0;
          mesg.edit(draw);
          nores += 1;
          continue;
        }
        if(collected.first().emoji.name === "📥") {
          if(placeable.length == 0) {
            em.setDescription(`You don't have any card to place so you are forced to draw ${card.length > 1 ? "cards" : "a card"}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`).setFooter("Your turn ended.", message.client.user.displayAvatarURL());
            mssg.edit(em).then(msg => setTimeout(() => msg.edit({ embed: null, content: `You drew ${card.length > 1 ? "cards" : "a card"}: ${card.join(", ")}`}), 10000));
            player.card = player.card.concat(newCard);
            players.set(key, player);
            uno.set(nano, { players: players, card: top, cards: await uno.get(nano).cards});
            drawCard = 0;
            mesg.edit(draw);
            continue;
          }
          let keys = [];
          let placeCard = placeable.map(x => {
            keys.push(message.client.card.findKey(f => f === x));
            return toString(x) + ` : **${message.client.card.findKey(f => f === x)}**`
          });
          em.setDescription(`Cards you can place:\n\n${placeCard.join("\n")}\nType the ID after the card to place.`).setFooter(`Please decide in 2 mintues.`, message.client.user.displayAvatarURL());
          mssg.edit(em);
          try {
            var collected = await mssg.channel.awaitMessages(x => x.author.id === player.user.id, { max: 1, time: 120 * 1000, errors: ["time"]});
          } catch(err) {}
          if(!collected || !collected.first() || !collected.first().content) {
            em.setDescription(`2 minutes have passed!\nYou have been forced to draw ${card.length > 1 ? "cards" : "a card"}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`).setFooter("Your turn ended.", message.client.user.displayAvatarURL());
            mssg.edit(em).then(msg => setTimeout(() => msg.edit({ embed: null, content: `You drew ${card.length > 1 ? "cards" : "a card"}: ${card.join(", ")}`}), 10000));
            player.card = player.card.concat(newCard);
            players.set(key, player);
            uno.set(nano, { players: players, card: top, cards: await uno.get(nano).cards});
            drawCard = 0;
            mesg.edit(draw);
            nores += 1;
            continue;
          }
          if(!keys.includes(collected.first().content)) {
            em.setDescription(`You cannot place that card so you drew ${card.length > 1 ? "cards" : "a card"}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`).setFooter("Your turn ended.", message.client.user.displayAvatarURL());
            mssg.delete();
            mssg.channel.send(em).then(msg => setTimeout(() => msg.edit({ embed: null, content: `You drew ${card.length > 1 ? "cards" : "a card"}: ${card.join(", ")}`}), 10000));
            player.card = player.card.concat(newCard);
            players.set(key, player);
            uno.set(nano, { players: players, card: top, cards: await uno.get(nano).cards});
            drawCard = 0;
            mesg.edit(draw);
            continue;
          }
          let placedCard = message.client.card.get(collected.first().content);
          let changeColor = false;
          if(placedCard.number === 13 || placedCard.number === 14) {
            em.setDescription("Please choose your color:").setFooter("Please decide in 2 minutes.");
            mssg.delete();
            mssg = await mssg.channel.send(em);
            let colors = ["🟥", "🟨", "🟦", "🟩"];
            for(const rColor of colors) {
              mssg.react(rColor);
            }
            try {
              var collected = await mssg.awaitReactions((r, u) => colors.includes(r.emoji.name) && u.id === player.user.id, { max: 1, time: 120 * 1000, errors: ["time"]});
            } catch(err) {}
            if(!collected || !collected.first()) {
              em.setDescription(`2 minutes have passed!\nYou have been forced to draw ${card.length > 1 ? "cards" : "a card"}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`).setFooter("Your turn ended.", message.client.user.displayAvatarURL());
              mssg.edit(em).then(msg => setTimeout(() => msg.edit({ embed: null, content: `You drew ${card.length > 1 ? "cards" : "a card"}: ${card.join(", ")}`}), 10000));
              player.card = player.card.concat(newCard);
              players.set(key, player);
              uno.set(nano, { players: players, card: top, cards: await uno.get(nano).cards});
            drawCard = 0;
              mesg.edit(draw);
              nores += 1;
              continue;
            }
            let reaction = collected.first();
            let chosenColor;
            let colorStr;
            switch(reaction.emoji.name) {
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
          mssg.channel.send(em).then(msg => setTimeout(() => msg.edit({ embed: null, content: `You placed a card: ${toString(placedCard)}`}), 10000));
          let data = await uno.get(nano);
          await uno.set(nano, { players: players, card: placedCard, cards: data.cards + 1 });
          let placed = new Discord.MessageEmbed()
          .setColor(color)
          .setTitle(`The ${converter.toOrdinal(data.cards + 1)} card has been placed`)
          .setThumbnail(player.user.displayAvatarURL())
          .setDescription(`The top card is ${(placedCard.color < 4 && placedCard.number < 13) ? toString(placedCard) : (placedCard.number === 13 ? "Special - Draw 4" : "Special - Change Color")}`)
          .setTimestamp()
          .setFooter(`Placed by ${player.user.tag}`, message.client.user.displayAvatarURL());
          mesg.edit(placed);
          switch(placedCard.number) {
            case 10:
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
            case 14:
              break;
          }
          if(player.card.length === 0) {
            won = true;
            let win = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(`${player.user.tag} won!`)
            .setThumbnail(player.user.displayAvatarURL())
            .setDescription("Congratulations!")
            .setTimestamp()
            .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
            setTimeout(() => mesg.edit(win), 3000);
            uno.delete(nano);
            break;
          } else {
            continue;
          }
        } else {
          em.setDescription(`You drew ${card.length > 1 ? "cards" : "a card"}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`).setFooter("Your turn ended.", message.client.user.displayAvatarURL());
          mssg.delete();
          mssg.channel.send(em).then(msg => setTimeout(() => msg.edit({ embed: null, content: `You drew ${card.length > 1 ? "cards" : "a card"}: ${card.join(", ")}`}), 10000));
          player.card = player.card.concat(newCard);
          players.set(key, player);
          uno.set(nano, { players: players, card: top, cards: uno.get(nano).cards});
          drawCard = 0;
          mesg.edit(draw);
          continue;
        }
      }
      }
    }
  }
};
