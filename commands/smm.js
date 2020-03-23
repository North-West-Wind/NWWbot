const Discord = require("discord.js");
const smm = require("smm-api");
var color = Math.floor(Math.random() * 16777214) + 1;
const { twoDigits } = require("../function.js");
const { prefix } = require("../config.json");

module.exports = {
  name: "smm",
  description: "Connect to SMMDB's API.",
  aliases: ["supermariomaker"],
  async execute(message, args) {
    if (!args[0])
      return message.channel.send("Please provide a query for searching!" + ` Usage: \`${prefix}${this.name} ${this.usage}\``);
    smm.searchCourses(
      {
        title: args.join(" ")
      },
      async (error, courses) => {
        if (error) throw error;
        var allEmbeds = [];
        for (var i = 0; i < courses.length; i++) {
          var uploaded = new Date(courses[i].uploaded);
          var lastModified = new Date(courses[i].lastmodified);

          var date = uploaded.getDate();
          var month = uploaded.getMonth();
          var year = uploaded.getFullYear();
          var hour = uploaded.getHours();
          var minute = uploaded.getMinutes();
          var second = uploaded.getSeconds();

          var uploadedTime =
            twoDigits(date) +
            "/" +
            twoDigits(month + 1) +
            "/" +
            twoDigits(year) +
            " " +
            twoDigits(hour) +
            ":" +
            twoDigits(minute) +
            ":" +
            twoDigits(second) +
            " UTC";

          var ldate = lastModified.getDate();
          var lmonth = lastModified.getMonth();
          var lyear = lastModified.getFullYear();
          var lhour = lastModified.getHours();
          var lminute = lastModified.getMinutes();
          var lsecond = lastModified.getSeconds();

          var modifiedTime =
            twoDigits(ldate) +
            "/" +
            twoDigits(lmonth + 1) +
            "/" +
            twoDigits(lyear) +
            " " +
            twoDigits(lhour) +
            ":" +
            twoDigits(lminute) +
            ":" +
            twoDigits(lsecond) +
            " UTC";

          const difficultyID = courses[i].difficulty;
          const creator = courses[i].maker;
          const gameStyleID = courses[i].gameStyle;
          const courseThemeID = courses[i].courseTheme;
          const courseThemeSubID = courses[i].courseThemeSub;
          const time = courses[i].time;
          const uploader = courses[i].uploader;

          if (difficultyID == 0) {
            var difficulty = "Easy";
          } else if (difficultyID == 1) {
            var difficulty = "Normal";
          } else if (difficultyID == 2) {
            var difficulty = "Expert";
          } else if (difficultyID == 3) {
            var difficulty = "Super Expert";
          }

          if (gameStyleID == 0) {
            var gameStyle = "Super Mario Bros.";
          } else if (gameStyleID == 1) {
            var gameStyle = "Super Mario Bros. 3";
          } else if (gameStyleID == 2) {
            var gameStyle = "Super Mario World";
          } else if (gameStyleID == 3) {
            var gameStyle = "New Super Mario Bros. U";
          }

          if (courseThemeID == 0) {
            var courseTheme = "Ground";
          } else if (courseThemeID == 1) {
            var courseTheme = "Underground";
          } else if (courseThemeID == 2) {
            var courseTheme = "Castle";
          } else if (courseThemeID == 3) {
            var courseTheme = "Airship";
          } else if (courseThemeID == 4) {
            var courseTheme = "Underwater";
          } else if (courseThemeID == 5) {
            var courseTheme = "Ghost House";
          }

          if (courseThemeSubID == 0) {
            var courseThemeSub = "Ground";
          } else if (courseThemeSubID == 1) {
            var courseThemeSub = "Underground";
          } else if (courseThemeSubID == 2) {
            var courseThemeSub = "Castle";
          } else if (courseThemeSubID == 3) {
            var courseThemeSub = "Airship";
          } else if (courseThemeSubID == 4) {
            var courseThemeSub = "Underwater";
          } else if (courseThemeSubID == 5) {
            var courseThemeSub = "Ghost House";
          }

          if (courses[i].description == undefined)
            var description = "No description.";
          else var description = courses[i].description;

          const Embed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(courses[i].title)
            .setDescription(description)
            .addField("Uploaded", uploadedTime, true)
            .addField("Last Modified", modifiedTime, true)
            .addField("Difficulty", difficulty, true)
            .addField("Game Style", gameStyle, true)
            .addField("Course Theme", courseTheme, true)
            .addField("Subcourse Theme", courseThemeSub, true)
            .addField("Time", time, true)
            .addField("Maker", creator, true)
            .addField("Uploader", uploader, true)
            .setTimestamp()
            .setFooter(
              "Have a nice day :)",
              message.client.user.displayAvatarURL()
            );

          allEmbeds.push(Embed);
        }

        const filter = (reaction, user) => {
          return (
            ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
            user.id === message.author.id
          );
        };
        var msg = await message.channel.send(allEmbeds[0]);
        var s = 0;
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
    );
  }
};
