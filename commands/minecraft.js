const Discord = require("discord.js");
var Buffer = require("buffer").Buffer;
var color = Math.floor(Math.random() * 16777214) + 1;
module.exports = {
  name: "minecraft",
  description: "Connect to the Minecraft API and display information.",
  args: true,
  aliases: ["mc"],
  usage: "<subcommand> <username | UUID | IP>",
  subcommands: ["profile", "server", "history"],
  execute(message, args) {
    const MojangAPI = require("mojang-api");

    if (args[0] === "profile" || !args[1]) {
      if (!args[0]) {
        return message.channel.send(
          "Please tell me the Minecraft username of that user or use a subcommand."
        );
      }
      if(!args[1]) {
        var str = args[0];
      } else
        var str = args[1]
      if(str.length <= 16)
      MojangAPI.nameToUuid(str, function(err, res) {
        if (err) console.log(err);
        else
          if(res[0] === undefined) {
            return message.channel.send("No player named **" + str + "** were found")
          }
          MojangAPI.profile(res[0].id, function(err, res) {
            if (err) console.log(err);
            else {
              console.log(res.id + " is also known as " + res.name + ".");

              let data = res.properties[0].value;
              let buff = new Buffer(data, "base64");
              let text = buff.toString("ascii");
              var obj = JSON.parse(text);
              let skin = "https://visage.surgeplay.com/full/256/" + res.id;

              const Embed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle(res.name)
                .setDescription("Profile:")
                .addField("UUID", res.id, true)
                .addField("Username", res.name, true)
                .setImage(skin)
                .setTimestamp()
                .setFooter(
                  "Have a nice day! :)",
                  message.client.user.displayAvatarURL()
                );
              message.channel.send(Embed);
              return;
            }
          });
      });
      else
        MojangAPI.profile(str, function(err, res) {
            if (err) console.log(err);
            else {
              console.log(res.id + " is also known as " + res.name + ".");

              let data = res.properties[0].value;
              let buff = new Buffer(data, "base64");
              let text = buff.toString("ascii");
              var obj = JSON.parse(text);
              let skin = "https://visage.surgeplay.com/full/256/" + res.id;

              const Embed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle(res.name)
                .setDescription("Profile:")
                .addField("UUID", res.id, true)
                .addField("Username", res.name, true)
                .setImage(skin)
                .setTimestamp()
                .setFooter(
                  "Have a nice day! :)",
                  message.client.user.displayAvatarURL()
                );
              message.channel.send(Embed);
              return;
            }
          });
    }
    if (args[0] === "server") {
      const url = "https://api.mcsrvstat.us/2/" + args.slice(1).join(" ");
      var request = require("request");
      request(
        {
          url: url,
          json: true
        },
        function(err, res, body) {
          if (!err && res.statusCode === 200) {
            console.log("mc server check for " + args.slice(1).join(" "));
          }
          if (body.online === true) {
            const ip = body.ip;
            const port = body.port;
            const player = body.players.online + " / " + body.players.max;
            const version = body.version;
            const hostname = body.hostname;
            const desc = body.motd.clean.join("\n");
            const spaceRemoved = desc.replace(/ +(?= )/g,'');
            const Embed = new Discord.MessageEmbed()
              .setTitle(args.slice(1).join(" "))
              .setColor(color)
              .addField("IP", "`" + ip + "`", true)
              .addField("Port", "`" + port + "`", true)
              .addField("Player/Max", "`" + player + "`", true)
              .addField("Version", "`" + version + "`", true)
              .addField("Hostname", "`" + hostname + "`", true)
              .addField("Description", "`" + spaceRemoved + "`")
              .setTimestamp()
              .setFooter(
                "Have a nice day! :)",
                message.client.user.displayAvatarURL()
              );
            
            return message.channel.send(Embed);
          } else {
            return message.channel.send("The server - **" + args.slice(1).join(" ") + "** - is offline/under maintenance.")
          }
        }
      );
    }
    if(args[0] === "history") {
      MojangAPI.nameToUuid(`${args[1]}`, function(err, res) {
        if (err) console.log(err);
        else
          if(res[0] === undefined) {
            return message.channel.send("No player named **" + args[1] + "** were found")
          }
        MojangAPI.nameHistory(res[0].id, function(err, result) {
    if (err)
        console.log(err);
    else {
      var names = [];
        var num = 0
          for(var i = result.length - 1; i > -1; i--) {
            ++num;
            if(num === 1) {
              names.push("**" + num + ". " + result[i].name + "**");
            } else {
            names.push(num + ". " + result[i].name);
            }
          }
          const Embed = new Discord.MessageEmbed()
          .setColor(color)
          .setTitle(res[0].name + "'s Username History")
          .setDescription(names.join("\n"))
          .setFooter("Last changed on " + new Date(result[result.length - 1].changedToAt), message.client.user.displayAvatarURL());
            
        message.channel.send(Embed);
    }
});
        return;
      });
    }
  }
};
