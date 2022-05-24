import { Card, NorthInteraction, NorthMessage, Player, FullCommand, UnoGame } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { shuffleArray, twoDigits, color, findMember, ms, findMemberWithGuild, wait, duration } from "../../function.js";
import { NorthClient } from "../../classes/NorthClient.js";
import converter from "number-to-words";
import Canvas from "canvas";
import config from "../../../config.json";

const COLOR = ["Yellow", "Blue", "Green", "Red", "Special"];
const NUMBER = ["Reverse", "Skip", "Draw 2", "Draw 4", "Change Color"];
function toString(x: Card) {
  let colorStr = COLOR[x.color];
  let number = x.number.toString();
  if (x.number > 9) number = NUMBER[x.number - 10];
  return `**${colorStr}** - **${number}**`;
}

async function canvasImg(assets: { id: string, url: string }[], cards: Card[]) {
  let canvas = Canvas.createCanvas((cards.length < 5 ? 165 * cards.length : 825), Math.ceil(cards.length / 5) * 256);
  let ctx = canvas.getContext("2d");
  for (let i = 0; i < cards.length; i++) {
    let url = await assets.find(x => x.id === twoDigits(cards[i].color) + twoDigits(cards[i].number)).url;
    let img = await Canvas.loadImage(url);
    ctx.drawImage(img, (i % 5) * 165, Math.floor(i / 5) * 256, 165, 256);
  }
  return canvas.toBuffer();
}

const assets = config.uno.filter((x: any) => !x.deleted && x.type === "image/png" && x.imageWidth === 165 && x.imageHeight === 256).map((x: any) => {
  return {
    id: x.name.slice(0, -4),
    url: x.url
  };
});

class UnoCommand implements FullCommand {
  name = "uno"
  description = "Play UNO with your friends!"
  category = 3
  usage = "<users> [time]"
  args = 2
  options = [
    {
      name: "users",
      description: "The users to invite.",
      required: true,
      type: "STRING"
    },
    {
      name: "time",
      description: "The time allowed for the game. Set to negative to disable.",
      required: true,
      type: "STRING"
    }
  ];

  async execute(interaction: NorthInteraction) {
    var mentions = new Discord.Collection<Discord.Snowflake, Discord.GuildMember>();
    const users = interaction.options.getString("users");
    const t = interaction.options.getString("time");
    for (const arg of users.split(/ +/)) {
      try {
        const member = await findMemberWithGuild(interaction.guild, arg);
        if (!member) continue;
        mentions.set(member.id, member);
      } catch (err) { }
    }
    if (mentions.size < 1) return await interaction.reply("All of your mentions are not valid!");
    await interaction.reply({ content: `You invited ${mentions.map(user => `<@${user.id}>`).join(" ")} to play UNO.`, fetchReply: true });
    var timeLimit = 12 * 60 * 1000;
    if (t) {
      const time = ms(t);
      if (time) timeLimit = time;
    }
    await this.logic(interaction, mentions, timeLimit);
  }

  async run(message: NorthMessage, args: string[]) {
    var mentions = new Discord.Collection<Discord.Snowflake, Discord.GuildMember>();
    var t: string;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      try {
        const member = await findMemberWithGuild(message.guild, arg);
        if (!member) {
          if (i === args.length - 1) t = arg;
          else continue;
        }
        mentions.set(member.id, member);
      } catch (err) { }
    }
    if (mentions.size < 1) return await message.channel.send("All of your mentions are not valid!");
    await message.channel.send(`You invited ${mentions.map(user => `<@${user.id}>`).join(" ")} to play UNO.`);
    var timeLimit = 12 * 60 * 1000;
    if (t) {
      const time = ms(t);
      if (time) timeLimit = time;
    }
    await this.logic(message, mentions, timeLimit);
  }

  async logic(message: Discord.Message | NorthInteraction, mentions: Discord.Collection<Discord.Snowflake, Discord.GuildMember>, timeLimit: number) {
    const author = message instanceof Discord.Message ? message.author : message.user;
    const c = color();
    var responses = 0;
    var accepted = 0;
    var ingame = false;
    var participants = [author];
    mentions.forEach(async member => {
      var otherGames = NorthClient.storage.uno.find(game => game.players.has(member.id));
      if (!!otherGames) {
        responses++;
        ingame = true;
        return message.channel.send(`**${member.user.tag}** is already in another game!`);
      }
      participants.push(member.user);
      var em = new Discord.MessageEmbed()
        .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL()})
        .setColor(c)
        .setTitle(`${author.tag} invited you to play UNO!`)
        .setDescription(`Server: **${message.guild.name}**\nChannel: **${(<Discord.TextChannel>message.channel).name}**\nAccept invitation?\n\n✅ Accept\n❌ Deny`)
        .setTimestamp()
        .setFooter({ text: "Please decide in 30 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ customId: "accept", label: "Accept", style: "SUCCESS", emoji: "✅" }))
        .addComponents(new Discord.MessageButton({ customId: "deny", label: "Deny", style: "DANGER", emoji: "❌" }));
      var mesg: Discord.Message;
      try {
        mesg = await member.user.send({ embeds: [em], components: [row] });
      } catch (err: any) {
        message.channel.send(`Failed to send invitation to **${member.user.tag}**.`);
        responses += mentions.size;
        return;
      }
      const cCollected = <Discord.ButtonInteraction> await mesg.awaitMessageComponent({ filter: interaction => interaction.user.id === member.id, time: 30000 }).catch(() => null);
      responses += 1;
      await cCollected.update({ components: [] });

      if (!cCollected) {
        em.setDescription("Timed Out").setFooter({ text: "The game was cancelled." });
        await message.channel.send(`**${member.user.tag}** is not active now.`);
        return await mesg.edit({ embeds: [em] });
      }
      em.setFooter({ text: "Head to the channel now.", iconURL: message.client.user.displayAvatarURL() });
      if (cCollected.customId === "accept") {
        await message.channel.send(`**${member.user.tag}** accepted the invitation!`);
        em.setDescription(`Server: **${message.guild.name}**\nChannel: **${(<Discord.TextChannel>message.channel).name}**\nYou accepted the invitation!`);
        accepted += 1;
      } else {
        await message.channel.send(`**${member.user.tag}** declined the invitation!`);
        em.setDescription(`Server: **${message.guild.name}**\nChannel: **${(<Discord.TextChannel>message.channel).name}**\n"You denied the invitation!`);
      }
      await mesg.edit({ embeds: [em] });
    });
    var players = new Discord.Collection<Discord.Snowflake, Player>();

    async function prepare(mesg: Discord.Message, id: number) {
      const uno = NorthClient.storage.uno;
      const order = shuffleArray(participants);
      await message.channel.send(`The order has been decided!${order.map(x => `\n${order.indexOf(x) + 1}. **${x.tag}**`)}`);
      for (const participant of order) players.set(participant.id, new Player(participant, NorthClient.storage.card.random(7)));
      for (const [_key, player] of players) {
        let em = new Discord.MessageEmbed()
          .setColor(c)
          .setTitle(`The cards have been distributed!`)
          .setImage("attachment://canvas.png")
          .setDescription(`Your cards:\n\n${player.card.map(x => toString(x)).join("\n")}`)
          .setTimestamp()
          .setFooter({ text: "Game started.", iconURL: message.client.user.displayAvatarURL() });
        player.user.send({ embeds: [em], files: [{ attachment: await canvasImg(assets, player.card), name: "canvas.png" }] });
      }
      var initial = NorthClient.storage.card.filter(x => x.color < 4 && x.number < 10).random();
      uno.set(id, new UnoGame(players, initial, 1));
      let em = new Discord.MessageEmbed()
        .setColor(c)
        .setTitle("The 1st card has been placed!")
        .setThumbnail(message.client.user.displayAvatarURL())
        .setImage(assets.find(x => x.id === twoDigits(initial.color) + twoDigits(initial.number)).url)
        .setDescription(`The card is ${toString(initial)}`)
        .setTimestamp()
        .setFooter({ text: `Placed by ${message.client.user.tag}`, iconURL: message.client.user.displayAvatarURL() });
      mesg.delete().catch(() => { });
      return await mesg.channel.send({ embeds: [em] });
    }

    var overTime = false;
    async function handle(mesg: Discord.Message, id: number) {
      let uno = NorthClient.storage.uno;
      let drawCard = 0;
      let skip = false;
      var won = false;
      var cancelled = false;
      let nores = 0;
      while (!won) {
        if (nores === players.size) {
          mesg.edit({ embeds: [], content: "No one responsded. Therefore, the game ended." });
          uno.delete(id);
          return;
        }
        nores = 0;
        let i = -1;
        for (var [key, player] of players) {
          let data = await NorthClient.storage.uno.get(id);
          if (overTime) {
            won = true;
            var scores = 0;
            var lowestP = [], lowestS = -1;
            for (var p of Array.from(data.players.values())) {
              var s = 0;
              for (const card of p.card) {
                if (card.number < 10) s += card.number;
                else if (card.number < 13) s += 20;
                else s += 50;
              }
              if (lowestS < 0 || s <= lowestS) {
                lowestS = s;
                if (s == lowestS) lowestP.push(p.user);
                else lowestP = [p.user];
              }
              scores += s;
            }
            scores -= lowestS * lowestP.length;
            let win = new Discord.MessageEmbed()
              .setColor(c)
              .setTitle(`The time limit has been reached!`)
              .setThumbnail(player.user.displayAvatarURL())
              .setDescription(`Congratulations to **${lowestP.map(u => u.tag).join("**, **")}** winning with **${scores} scores**!\nThe game ended after **${data.cards} cards**, ${duration(Date.now() - id, "milliseconds")}.\nThanks for playing!`)
              .setTimestamp()
              .setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
            lowestP.forEach(u => u.send("You won the game! Congratulations!"));
            await mesg.delete();
            await mesg.channel.send({ embeds: [win] });
            uno.delete(id);
            break;
          }
          player.card.sort((a, b) => (a.color * 100 + a.number) - (b.color * 100 + b.number));
          i++;
          let top = uno.get(id).card;
          if (skip) {
            let skipEm = new Discord.MessageEmbed()
              .setTitle("Your turn was skipped!")
              .setDescription("Someone placed a Skip card!")
              .setColor(c)
              .setTimestamp()
              .setFooter({ text: "Better luck next time!", iconURL: message.client.user.displayAvatarURL() });
            player.user.send({ embeds: [skipEm] });
            players.set(key, player);
            uno.set(id, { players: players, card: top, cards: uno.get(id).cards });
            skip = false;
            continue;
          }
          let placeable = player.card.filter(x => {
            if (top.number === 12) {
              if (drawCard > 0) return x.number === 12 || x.number === 13;
              return x.color === 4 || x.color === top.color || x.number === 12;
            } else if (top.number === 13) {
              if (drawCard > 0) return x.color === 4 && x.number === 13;
              return x.color === top.color;
            }
            return (x.color === 4) || (x.color === top.color || x.number === top.number);
          });
          var em = new Discord.MessageEmbed()
            .setColor(c)
            .setTitle(`It's your turn now!`)
            .setDescription(`The current card is ${toString(top)}\nYour cards:\n\n${player.card.map(x => toString(x)).join("\n")}\n\n📥 Place\n📤 Draw\n⏹️ Stop\nIf you draw, you will draw **${drawCard > 0 ? drawCard + " cards" : "1 card"}**.`)
            .setImage("attachment://yourCard.png")
            .setTimestamp()
            .setFooter({ text: "Please decide in 30 seconds.", iconURL: message.client.user.displayAvatarURL() });
          const row = new Discord.MessageActionRow()
            .addComponents(new Discord.MessageButton({ customId: "place", label: "Place", style: "PRIMARY", emoji: "📥" }))
            .addComponents(new Discord.MessageButton({ customId: "draw", label: "Draw", style: "PRIMARY", emoji: "📤" }))
            .addComponents(new Discord.MessageButton({ customId: "quit", label: "Quit", style: "DANGER", emoji: "⏹️" }));
          let mssg = await player.user.send({ embeds: [em], files: [{ attachment: await canvasImg(assets, player.card), name: "yourCard.png" }], components: [row] });
          var collected: Discord.MessageComponentInteraction = <Discord.ButtonInteraction> await mssg.awaitMessageComponent({ filter: interaction => interaction.user.id === player.user.id, time: 30 * 1000 }).catch(() => null);
          collected?.update({ components: [] });
          var newCard = NorthClient.storage.card.random(drawCard > 0 ? drawCard : 1);
          var card = !newCard.length ? [toString(newCard[0])] : newCard.map(x => toString(x));
          var draw = new Discord.MessageEmbed()
            .setColor(c)
            .setTitle(`${player.user.tag} drew a card!`)
            .setThumbnail(message.client.user.displayAvatarURL())
            .setDescription(`The top card is ${toString(top)}`)
            .setImage(assets.find(x => x.id === twoDigits(top.color) + twoDigits(top.number)).url)
            .setTimestamp()
            .setFooter({ text: `Placed by ${message.client.user.tag}`, iconURL: message.client.user.displayAvatarURL() });
          if (!collected) {
            em = new Discord.MessageEmbed()
              .setColor(c)
              .setTitle(`Your turn ended!`)
              .setDescription(`30 seconds have passed!\nYou have been forced to draw ${card.length} card${card.length > 1 ? "s" : ""}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`)
              .setImage("attachment://newCard.png")
              .setTimestamp()
              .setFooter({ text: `Game started by ${author.tag} | Played in server **${message.guild.name}** - channel **${(<Discord.TextChannel>message.channel).name}**`, iconURL: message.client.user.displayAvatarURL() });
            await mssg.delete();
            await mssg.channel.send({ embeds: [em], files: [{ attachment: await canvasImg(assets, newCard), name: "newCard.png" }] });
            player.card = player.card.concat(newCard);
            players.set(key, player);
            uno.set(id, { players: players, card: top, cards: uno.get(id).cards });
            drawCard = 0;
            draw.setDescription(`${player.user.tag} drew ${card.length} card${card.length > 1 ? "s" : ""}!`)
            await mesg.edit({ embeds: [draw] });
            nores += 1;
            continue;
          }
          if (collected.customId === "place") {
            if (placeable.length == 0) {
              em = new Discord.MessageEmbed()
                .setColor(c)
                .setTitle(`Your turn ended!`)
                .setDescription(`You don't have any card to place so you are forced to draw ${card.length} card${card.length > 1 ? "s" : ""}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`)
                .setImage("attachment://newCard.png")
                .setTimestamp()
                .setFooter({ text: `Game started by ${author.tag} | Played in server **${message.guild.name}** - channel **${(<Discord.TextChannel>message.channel).name}**`, iconURL: message.client.user.displayAvatarURL() });
              await mssg.delete();
              await mssg.channel.send({ embeds: [em], files: [{ attachment: await canvasImg(assets, newCard), name: "newCard.png" }] });
              player.card = player.card.concat(newCard);
              players.set(key, player);
              uno.set(id, { players: players, card: top, cards: await uno.get(id).cards });
              drawCard = 0;
              draw.setDescription(`${player.user.tag} drew ${card.length} card${card.length > 1 ? "s" : ""}!`)
              await mesg.edit({ embeds: [draw] });
              continue;
            }
            em = new Discord.MessageEmbed()
              .setColor(c)
              .setTitle(`Action: Placing`)
              .setDescription(`Select the card to place from the menu.\nCards you can place:`)
              .setImage("attachment://place.png")
              .setTimestamp()
              .setFooter({ text: `Please decide in 30 seconds.`, iconURL: message.client.user.displayAvatarURL() });
            await mssg.delete();
            const placeableSet = new Set(placeable);
            const menu = new Discord.MessageSelectMenu();
            const keys = [];
            for (const p of placeableSet) {
              const key = NorthClient.storage.card.findKey(f => f === p);
              keys.push(key);
              menu.addOptions({ label: toString(p), value: key });
            }

            mssg = await mssg.channel.send({ embeds: [em], files: [{ attachment: await canvasImg(assets, placeable), name: "place.png" }], components: [new Discord.MessageActionRow().addComponents(menu)] });
            collected = <Discord.SelectMenuInteraction> await mssg.channel.awaitMessageComponent({ filter: interaction => interaction.user.id === player.user.id, time: 30 * 1000 }).catch(() => null);
            collected?.update({ components: [] });
            if (!collected) {
              em = new Discord.MessageEmbed()
                .setColor(c)
                .setTitle(`Your turn ended!`)
                .setDescription(`30 seconds have passed!\nYou have been forced to draw ${card.length} card${card.length > 1 ? "s" : ""}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`)
                .setImage("attachment://newCard.png")
                .setTimestamp()
                .setFooter({ text: `Game started by ${author.tag} | Played in server **${message.guild.name}** - channel **${(<Discord.TextChannel>message.channel).name}**`, iconURL: message.client.user.displayAvatarURL() });
              await mssg.delete();
              await mssg.channel.send({ embeds: [em], files: [{ attachment: await canvasImg(assets, newCard), name: "newCard.png" }] });
              player.card = player.card.concat(newCard);
              players.set(key, player);
              uno.set(id, { players: players, card: top, cards: await uno.get(id).cards });
              drawCard = 0;
              draw.setDescription(`${player.user.tag} drew ${card.length} card${card.length > 1 ? "s" : ""}!`)
              mesg.edit({ embeds: [draw] });
              nores += 1;
              continue;
            }
            let placedCard = NorthClient.storage.card.get((<Discord.SelectMenuInteraction> collected).values[0]);
            if (placedCard.number === 13 || placedCard.number === 14) {
              em.setDescription("Please choose your color:").setFooter({ text: "Please decide in 30 seconds." });
              await mssg.delete();
              const row = new Discord.MessageActionRow()
                .addComponents(new Discord.MessageButton({ customId: "red", label: "Red", style: "DANGER", emoji: "🟥" }))
                .addComponents(new Discord.MessageButton({ customId: "yellow", label: "Yellow", style: "SECONDARY", emoji: "🟨" }))
                .addComponents(new Discord.MessageButton({ customId: "blue", label: "Blue", style: "PRIMARY", emoji: "🟦" }))
                .addComponents(new Discord.MessageButton({ customId: "green", label: "Green", style: "SUCCESS", emoji: "🟩" }));
              mssg = await mssg.channel.send({ embeds: [em], components: [row] });
              collected = <Discord.ButtonInteraction> await mssg.awaitMessageComponent({ filter: interaction => interaction.user.id === player.user.id, time: 30000 }).catch(() => null);
              collected?.update({ components: [] });
              if (!collected) {
                em = new Discord.MessageEmbed()
                  .setColor(c)
                  .setTitle(`Your turn ended!`)
                  .setDescription(`30 seconds have passed!\nYou have been forced to draw ${card.length} card${card.length > 1 ? "s" : ""}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`)
                  .setImage("attachment://newCard.png")
                  .setTimestamp()
                  .setFooter({ text: `Game started by ${author.tag} | Played in server **${message.guild.name}** - channel **${(<Discord.TextChannel>message.channel).name}**`, iconURL: message.client.user.displayAvatarURL() });
                await mssg.delete();
                await mssg.channel.send({ embeds: [em], files: [{ attachment: await canvasImg(assets, newCard), name: "newCard.png" }] });
                player.card = player.card.concat(newCard);
                players.set(key, player);
                uno.set(id, { players: players, card: top, cards: await uno.get(id).cards });
                drawCard = 0;
                draw.setDescription(`${player.user.tag} drew ${card.length} card${card.length > 1 ? "s" : ""}!`)
                mesg.edit({ embeds: [draw] });
                nores += 1;
                continue;
              }
              let chosenColor: number;
              let colorStr: string;
              switch (collected.customId) {
                case "red":
                  chosenColor = 3;
                  colorStr = "Red";
                  break;
                case "yellow":
                  chosenColor = 0;
                  colorStr = "Yellow";
                  break;
                case "blue":
                  chosenColor = 1;
                  colorStr = "Blue";
                  break;
                case "green":
                  chosenColor = 2;
                  colorStr = "Green";
                  break;
              }
              player.card.splice(player.card.indexOf(placedCard), 1);
              players.set(key, player);
              placedCard = { color: chosenColor, number: placedCard.number };
              em = new Discord.MessageEmbed()
                .setColor(c)
                .setTitle(`Your turn ended!`)
                .setDescription(`The color you chose: ${colorStr}`)
                .setTimestamp()
                .setFooter({ text: `Game started by ${author.tag} | Played in server **${message.guild.name}** - channel **${(<Discord.TextChannel>message.channel).name}**`, iconURL: message.client.user.displayAvatarURL() });
            } else {
              player.card.splice(player.card.indexOf(placedCard), 1);
              players.set(key, player);
              em = new Discord.MessageEmbed()
                .setColor(c)
                .setTitle(`Your turn ended!`)
                .setDescription(`You placed ${toString(placedCard)}!`)
                .setTimestamp()
                .setFooter({ text: `Game started by ${author.tag} | Played in server **${message.guild.name}** - channel **${(<Discord.TextChannel>message.channel).name}**`, iconURL: message.client.user.displayAvatarURL() });
            }
            await mssg.delete();
            await mssg.channel.send({ embeds: [em] });
            uno.set(id, { players: players, card: placedCard, cards: data.cards + 1 });
            let placed = new Discord.MessageEmbed()
              .setColor(c)
              .setTitle(`The ${converter.toOrdinal(data.cards + 1)} card has been placed`)
              .setThumbnail(player.user.displayAvatarURL())
              .setDescription(`The top card is ${toString(placedCard)}`)
              .setImage(assets.find(x => x.id === twoDigits(placedCard.color) + twoDigits(placedCard.number)).url)
              .setTimestamp()
              .setFooter({ text: `Placed by ${player.user.tag}`, iconURL: message.client.user.displayAvatarURL() });
            await mesg.edit({ embeds: [placed] });
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
              let data = NorthClient.storage.uno.get(id);
              var scores = 0;
              for (var p of Array.from(data.players.values())) {
                for (const card of p.card) {
                  if (card.number < 10) scores += card.number;
                  else if (card.number < 13) scores += 20;
                  else scores += 50;
                }
              }
              let win = new Discord.MessageEmbed()
                .setColor(c)
                .setTitle(`${player.user.tag} won!`)
                .setThumbnail(player.user.displayAvatarURL())
                .setDescription(`Congratulations to **${player.user.tag}** winning with **${scores} scores**!\nThe game ended after **${data.cards} cards**, ${duration(Date.now() - id, "milliseconds")}.\nThanks for playing!`)
                .setTimestamp()
                .setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
              await player.user.send("You won the game! Congratulations!");
              await mesg.delete();
              await mesg.channel.send({ embeds: [win] });
              uno.delete(id);
              break;
            } else {
              if (reversing) {
                let playerKeys = Array.from(players.keys());
                let playerValues = Array.from(players.values());
                let keySliced = playerKeys.slice(0, i);
                let valueSliced = playerValues.slice(0, i);
                playerKeys = playerKeys.slice(i).concat(keySliced).reverse();
                playerValues = playerValues.slice(i).concat(valueSliced).reverse();
                players.clear();
                for (let s = 0; s < playerKeys.length; s++) {
                  players.set(playerKeys[s], playerValues[s]);
                }
                break;
              }
              continue;
            }
          } else if (collected.customId === "draw") {
            em = new Discord.MessageEmbed()
              .setColor(c)
              .setTitle(`Your turn ended!`)
              .setDescription(`You drew ${card.length} card${card.length > 1 ? "s" : ""}!\n\nYour new card${card.length > 1 ? "s" : ""}:\n${card.join("\n")}`)
              .setImage("attachment://newCard.png")
              .setTimestamp()
              .setFooter({ text: `Game started by ${author.tag} | Played in server **${message.guild.name}** - channel **${(<Discord.TextChannel>message.channel).name}**`, iconURL: message.client.user.displayAvatarURL() });
            await mssg.delete();
            await mssg.channel.send({ embeds: [em], files: [{ attachment: await canvasImg(assets, newCard), name: "newCard.png" }] });
            player.card = player.card.concat(newCard);
            players.set(key, player);
            uno.set(id, { players: players, card: top, cards: uno.get(id).cards });
            drawCard = 0;
            draw.setDescription(`${player.user.tag} drew ${card.length} card${card.length > 1 ? "s" : ""}!`)
            mesg.edit({ embeds: [draw] });
            continue;
          } else {
            let data = await NorthClient.storage.uno.get(id);
            cancelled = true;
            let cancel = new Discord.MessageEmbed()
              .setColor(c)
              .setTitle(`${player.user.tag} doesn't want to play with you anymore!`)
              .setThumbnail(player.user.displayAvatarURL())
              .setDescription(`**${player.user.tag}** left the game!\nThe game ended after **${data.cards} cards**, ${duration(Date.now() - id, "milliseconds")}.\nThanks for playing!`)
              .setTimestamp()
              .setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
            await mesg.edit({ embeds: [cancel] });
            uno.delete(id);
            return;
          }
        }
      }
    }
    while (responses < mentions.size) {
      await wait(1000);
    }
    if (responses !== accepted) return await message.channel.send("The game cannot start as someone didn't accept the invitation!");
    else if (ingame) return await message.channel.send("The game cannot start as somebody is in another game!");
    else {
      var mesg = await message.channel.send("The game will start soon!");
      var id = Date.now();
      try {
        mesg = await prepare(mesg, id);
        if (timeLimit > 0) setTimeout(() => overTime = true, timeLimit);
        await handle(mesg, id);
      } catch (err: any) { return console.error(err) }
    }
  }
};

const cmd = new UnoCommand();
export default cmd;