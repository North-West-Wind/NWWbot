const Discord = require("discord.js");
const client = new Discord.Client();

module.exports = {
  name: "config",
  description: "Show configuration of the server.",
  execute(message, args, pool) {
    if (!message.member.hasPermission("MANAGE_GUILD")) {
      message.reply(`you don\'t have the permission to use this command.`);
      return;
    }

    const guild = message.guild;

    if (args[0] === "welcomeMessage") {
      if (args[1].startsWith("<#")) {
        const channel = args[1].replace("<#", "");
        const channel2 = channel.replace(">", "");
        var stuff = [];
        args.forEach(word => {
          if (word.startsWith("{<#")) {
            const first = word.replace("{<#", "");
            const second = first.replace(">}", "");
            const channel = guild.channels.get(second);
            stuff.push("{#" + channel.name + "}");
          } else {
            stuff.push(word);
          }
        });
        pool.getConnection(function(err, con) {
          con.query(
            "UPDATE servers SET welcome = '" +
              stuff
                .slice(2)
                .join(" ")
                .replace(/"/g, '\\"')
                .replace(/'/g, "\\'") +
              "', wel_channel = '" +
              channel2 +
              "' WHERE id=" +
              guild.id,
            function(err, result, fields) {
              if (err) throw err;
              message.channel.send(
                "Saved changes." + "```" + stuff.slice(2).join(" ") + "```"
              );
            }
          );
          con.release();
          if (err) throw err;
        });
      } else {
        pool.getConnection(function(err, con) {
          con.query(
            "UPDATE servers SET welcome = '" +
              stuff
                .slice(1)
                .join(" ")
                .replace(/"/g, '\\"')
                .replace(/'/g, "\\'") +
              "' WHERE id=" +
              guild.id,
            function(err, result, fields) {
              if (err) throw err;
              message.channel.send(
                "WARNING: Only received welcome message. Please make sure if you have enter the welcome channel before.\n" +
                  "Saved changes." +
                  "```" +
                  stuff.slice(1).join(" ") +
                  "```"
              );
            }
          );
          con.release();
          if (err) throw err;
        });
      }
    } else if (args[0] === "autorole") {
      if (!args[1]) {
        return message.channel.send("Please include at least 1 role!");
      }
      var roleArray = [];
      args.slice(1).forEach(role => {
        const first = role.replace("<@&", "");
        const second = first.replace(">", "");
        const getRole = guild.roles.get(second);
        if (getRole === undefined)
          return message.channel.send(role + " is not a role!");
        roleArray.push(getRole.name);
      });
      var autorole = '["' + roleArray.join('", "') + '"]';
      pool.getConnection(function(err, con) {
        con.query(
          "UPDATE servers SET autorole = '" +
            autorole +
            "' WHERE id=" +
            guild.id,
          function(err, result, fields) {
            if (err) throw err;
            message.channel.send(
              "All members will be given " +
                args.slice(1).join(", ") +
                " when joined."
            );
          }
        );
      });
    } else {
      pool.getConnection(function(err, con) {
        con.query("SELECT * FROM servers WHERE id=" + guild.id, function(
          err,
          result,
          fields
        ) {
          const welcomeChannel = guild.channels.get(result[0].wel_channel);
          const Embed = new Discord.RichEmbed()
            .setTitle("Configuration of " + guild.name)
            .setColor()
            .addField("Welcome message", result[0].welcome, true)
            .addField("Welcome channel", welcomeChannel, true);
          message.channel.send(Embed);
          if (err) throw err;
        });

        con.release();
      });
    }
  }
};
