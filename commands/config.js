const Discord = require("discord.js");
const client = new Discord.Client();

module.exports = {
  name: "config",
  description: "Show configuration of the server.",
  usage: "[subcommand]",
  subcommands: ["new"],
  async execute(message, args, pool) {
    if (message.channel instanceof Discord.DMChannel) {
       return message.channel.send("Direct messages is not configurable.")
     }
    if (!message.member.hasPermission("MANAGE_GUILD")) {
      message.reply(`you don\'t have the permission to use this command.`);
      return;
    }
    
    

    const guild = message.guild;

    if (args[0] === "new") {
      return await this.new(message, args, pool)
    }
    
      pool.getConnection(function(err, con) {
        if (err) throw err;
        con.query("SELECT * FROM token WHERE guild=" + guild.id, async function(
          err,
          result,
          fields
        ) {
          if (err) throw err;
          if (result.length > 0) {
            return message.author.send(
              "Token was created for **" +
                guild.name +
                "** before.\nToken: `" +
                result[0].id +
                "`"
            );
          } else {
            require("crypto").randomBytes(24, function(err, buffer) {
              var generated = buffer.toString("hex");

              con.query(
                "INSERT INTO token (id, guild) VALUES('" +
                  generated +
                  "', '" +
                  guild.id +
                  "')",
                function(err, result) {
                  if (err) throw err;
                  console.log("Created token for server " + guild.name);
                  message.author.send(
                    "Created token for guild - **" +
                      guild.name +
                      "**\nToken: `" +
                      generated +
                      "`"
                  );
                }
              );
            });
          }
        });
        con.release();
      });
    
  },
  new(message, args, pool) {
    var guild = message.guild;
    require("crypto").randomBytes(24, function(err, buffer) {
        var generated = buffer.toString("hex");
        pool.getConnection(function(err, con) {
          if (err) throw err;
          con.query(
            "UPDATE token SET id = '" +
              generated +
              "' WHERE guild = '" +
              guild.id +
              "'",
            function(err, result) {
              if (err) throw err;
              console.log("Generated a new token for " + guild.name);
              message.author.send(
                "Generated a new token for server - **" +
                  guild.name +
                  "**\nToken: `" +
                  generated + "`"
              );
            }
          );
          con.release();
        });
      });
  }
};
