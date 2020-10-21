const Discord = require("discord.js");
const fetch = require("node-fetch");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "speedrun",
  description: "Display speedrun attempts of a game from Speedrun.com.",
  aliases: ["sr"],
  usage: "<game>",
  category: 7,
  args: 1,
  async execute(message, args) {
    var gameFetch = await fetch(`https://www.speedrun.com/api/v1/games/${escape(args.join(" "))}`).then(res => res.json());
    if(gameFetch.status && gameFetch.status === 404) {
    var result = await fetch(
      `https://www.speedrun.com/api/v1/games?name=${escape(
        args.join(" ")
      )}&_bulk=1`
    ).then(res => res.json());
    if (result.data.length == 0) {
      return message.channel.send("No game was found!");
    }
    if (result.data.length > 1) {
      var games = [];
      for (
        var i = 0;
        i < (result.data.length > 10 ? 10 : result.data.length);
        i++
      ) {
        games.push(
          `${i + 1}. **${result.data[i].names.international}** : **${
            result.data[i].abbreviation
          }**`
        );
      }
      var em = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle("Which game are you looking for?")
        .setDescription(games.join("\n"))
        .setTimestamp()
        .setFooter(
          "Cannot find your game? Try to be more specified.",
          message.client.user.displayAvatarURL()
        );

      var msg = await message.channel.send(em);
      var choices = [
        "1️⃣",
        "2️⃣",
        "3️⃣",
        "4️⃣",
        "5️⃣",
        "6️⃣",
        "7️⃣",
        "8️⃣",
        "9️⃣",
        "🔟",
        "⏹"
      ];
      for (var i = 0; i < games.length; i++) {
        msg.react(choices[i]);
      }
      await msg.react(choices[10]);
      var collected = await msg
        .awaitReactions(
          (reaction, user) =>
            choices.includes(reaction.emoji.name) &&
            user.id === message.author.id,
          { max: 1, time: 30000, errors: ["time"] }
        )
        .catch(console.error);
        msg.reactions.removeAll().catch(console.error);
      if (collected === undefined) {
        em.setTitle("Timed Out")
          .setDescription("Please try again.")
          .setFooter(
            "Have a nice day! :)",
            message.client.user.displayAvatarURL()
          );
        return msg.edit(em);
      }
      em.setTitle("Loading...")
      .setDescription("This will take a while.")
      .setTimestamp()
      .setFooter("Please be patient.", message.client.user.displayAvatarURL());
      msg.edit(em);
      var reaction = collected.first();
      if (reaction.emoji.name === choices[10]) {
        em.setTitle("Action Cancelled.")
          .setDescription("")
          .setFooter(
            "Have a nice day! :)",
            message.client.user.displayAvatarURL()
          );
        return msg.edit(em);
      }
      
      var index = choices.indexOf(reaction.emoji.name);
      var id = result.data[index].id;
     
    } else {
      var em = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle("Loading...")
      .setDescription("This will take a while.")
      .setTimestamp()
      .setFooter("Please be patient.", message.client.user.displayAvatarURL());
      var msg = await message.channel.send(em);
      var index = 0;
      var id = result.data[0].id;
    }
       } else {
         var em = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle("Loading...")
      .setDescription("This will take a while.")
      .setTimestamp()
      .setFooter("Please be patient.", message.client.user.displayAvatarURL());
      var msg = await message.channel.send(em);
        var id = gameFetch.data.id;
      }

    var allEmbeds = [];

    var results = await fetch(
      `https://www.speedrun.com/api/v1/games/${id}/records`
    ).then(res => res.json());
    for (const record of results.data) {
      if(record.level !== null)
      var levelFetch = await fetch(
        `https://www.speedrun.com/api/v1/levels/${record.level}`
      ).then(res => res.json());
      if(record.category !== null)
      var categoryFetch = await fetch(
        `https://www.speedrun.com/api/v1/categories/${record.category}`
      ).then(res => res.json());

      var level = levelFetch && levelFetch.data ? levelFetch.data.name : "N/A";
      var category = categoryFetch && categoryFetch.data ? categoryFetch.data.name : "N/A";
      const embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(result && result.data[0] ? result.data[index ? index : 0].names.international : gameFetch.data.names.international)
        .setDescription(`Category: **${category}**\nLevel: **${level}**`)
        .setURL(record.weblink ? record.weblink : undefined)
        .setTimestamp()
        .setFooter(
          "Have a nice day! :)",
          message.client.user.displayAvatarURL()
        );
      for (const run of record.runs) {
        if(run.run.system.platform !== null)
        var platformFetch = await fetch(
          `https://www.speedrun.com/api/v1/platforms/${run.run.system.platform}`
        ).then(res => res.json());
        if(run.run.system.region !== null)
        var regionFetch = await fetch(
          `https://www.speedrun.com/api/v1/regions/${run.run.system.region}`
        ).then(res => res.json());
        var platform = platformFetch && platformFetch.data ? platformFetch.data.name : "N/A";
        var region = regionFetch && regionFetch.data ? regionFetch.data.name : "N/A"
        if(run.run.players[0].rel === "guest")
          var player = run.run.players[0].name;
        else {
          var playerFetch = await fetch(`https://www.speedrun.com/api/v1/users/${run.run.players[0].id}`).then(res => res.json());
          var player = playerFetch.data.names.international;
        }
        var time = run.run.times.primary_t;
        var date = run.run.date;
        var place = run.place;
        embed.addField(
          `Rank #${place}`,
          `Player: **${player}**\nTime: **${time}s**\nDate: **${date}**\nPlatform: **${platform}**\nRegion: **${region}**`
        );
        platformFetch = undefined;
        regionFetch = undefined;
      }
      allEmbeds.push(embed);
      levelFetch = undefined;
      categoryFetch = undefined;
    }
    if (allEmbeds.length == 1) {
      msg.edit(allEmbeds[0]);
    } else if (allEmbeds.length == 0) {
      em.setTitle(result && result.data[0] ? result.data[index ? index : 0].names.international : gameFetch.data.names.international)
        .setDescription("No record was found for this game!")
        .setFooter(
          "Have a nice day! :)",
          message.client.user.displayAvatarURL()
        );
      msg.edit(em);
    } else {
      const filter = (reaction, user) => {
        return (
          ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
          user.id === message.author.id
        );
      };
      var s = 0;
      var msg = await msg.edit(allEmbeds[0]);
      await msg.react("⏮");
      await msg.react("◀");
      await msg.react("▶");
      await msg.react("⏭");
      await msg.react("⏹");
      var collector = await msg.createReactionCollector(filter, {
        idle: 60000,
        errors: ["time"]
      });

      collector.on("collect", function(reaction, user) {
        reaction.users.remove(user.id);
        switch (reaction.emoji.name) {
          case "⏮":
            s = 0;
            msg.edit(allEmbeds[s]);
            break;
          case "◀":
            s -= 1;
            if (s < 0) {
              s = allEmbeds.length - 1;
            }
            msg.edit(allEmbeds[s]);
            break;
          case "▶":
            s += 1;
            if (s > allEmbeds.length - 1) {
              s = 0;
            }
            msg.edit(allEmbeds[s]);
            break;
          case "⏭":
            s = allEmbeds.length - 1;
            msg.edit(allEmbeds[s]);
            break;
          case "⏹":
            collector.emit("end");
            break;
        }
      });
      collector.on("end", function() {
        msg.reactions.removeAll().catch(console.error);
      });
    }
  }
};
