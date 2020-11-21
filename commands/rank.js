const Discord = require("discord.js");
module.exports = {
  name: "rank",
  description:
    "Display your rank in the server. However, this command requires a DLC to work. Leveling system was inspired by MEE6.",
    category: 3,
  async execute(message, args, pool) {
    pool.getConnection(function(err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to connect to the database!"
        );
      }
      con.query(
        "SELECT * FROM leveling WHERE user = " +
          message.author.id +
          " AND guild = " +
          message.guild.id,
        function(err, results) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to fetch data from the database!"
            );
          }
          var expBackup = parseInt(results[0].exp);
          var exp = parseInt(results[0].exp);
          var cost = 50;
          var costs = [];
          var level = 0;
          while (exp >= cost) {
            exp -= cost;
            costs.push(cost);
            cost += 50;
            level++;
          }

          costs.push(cost);
          con.query(
            "SELECT id FROM leveling WHERE guild = " +
              message.guild.id +
              " ORDER BY exp DESC",
            function(err, result, fields) {
              if (err) {
                console.error(err);
                return message.reply(
                  "there was an error trying to fetch data from the database!"
                );
              }

              var everyone = [];

              for (var i = 0; i < result.length; i++) {
                everyone.push(result[i].id);
              }

              var dashes = [];

              for (var i = 0; i < 20; i++) {
                dashes.push("=");
              }

              var percentage = Math.floor((exp / cost) * 100);
              var progress = Math.round(percentage / 5);
              dashes.splice(progress, 1, "+");
              var rank = everyone.indexOf(results[0].id) + 1;
              const rankEmbed = new Discord.MessageEmbed()
                .setColor(console.color())
                .setTitle(
                  "Rank of **" +
                    message.author.tag +
                    "** in **" +
                    message.guild.name +
                    "**"
                )
                .setDescription(
                  "Rank: **" +
                    rank +
                    "**\nLevel: **" +
                    level +
                    "**\nOverall Progress: **" +
                    expBackup +
                    "** / **" +
                    costs.reduce((a, b) => a + b) +
                    "**\n\nProgress to Next Level: \n**" +
                    exp +
                    "** / **" +
                    cost +
                    "** - **" +
                    percentage +
                    "%**\n" +
                    level +
                    " **" +
                    dashes.join("") +
                    "** " +
                    (level + 1)
                )
                .setFooter(
                  "Every level requires 50 XP more to level up.",
                  message.client.user.displayAvatarURL()
                )
                .setTimestamp();

              message.channel.send(rankEmbed);
            }
          );
        }
      );
      con.release();
    });
  }
};
