const Discord = require("discord.js");
var Buffer = require("buffer").Buffer;
var color = Math.floor(Math.random() * 16777214) + 1;
module.exports = {
  name: "minecraft",
  description: "Connect to Minecraft API.",
  args: true,
  aliases: ["mc"],
  usage: "<subcommand> <username>",
  subcommands: ["uuid", "profile", "username", "server"],
  execute(message, args) {
    const MojangAPI = require("mojang-api");
    if (`${args[0]}` === "uuid") {
      if (!args[1]) {
        return message.channel.send(
          "Please tell me the Minecraft username of that user."
        );
      }

      MojangAPI.nameToUuid(`${args[1]}`, function(err, res) {
        if (err) console.log(err);
        else
          console.log(res[0].name + "? No, they're " + res[0].id + " to me.");
        const Embed = new Discord.RichEmbed()
          .setColor(color)
          .setTitle(`${args[1]}\'s UUID:`)
          .setDescription(res[0].id);
        message.channel.send(Embed);
        return;
      });
    }

    if (args[0] === "profile") {
      if (!args[1]) {
        return message.channel.send(
          "Please tell me the Minecraft username of that user."
        );
      }
      MojangAPI.nameToUuid(`${args[1]}`, function(err, res) {
        if (err) console.log(err);
        else
          MojangAPI.profile(res[0].id, function(err, res) {
            if (err) console.log(err);
            else {
              console.log(res.id + " is also known as " + res.name + ".");

              let data = res.properties[0].value;
              let buff = new Buffer(data, "base64");
              let text = buff.toString("ascii");
              var obj = JSON.parse(text);
              let skin = "https://visage.surgeplay.com/full/256/" + res.id;

              const Embed = new Discord.RichEmbed()
                .setColor(color)
                .setTitle(res.name)
                .setDescription("Profile:")
                .addField("UUID", res.id, true)
                .addField("Username", res.name, true)
                .setImage(skin)
                .setTimestamp()
                .setFooter(
                  "Have a nice day! :)",
                  "https://i.imgur.com/hxbaDUY.png"
                );
              message.channel.send(Embed);
              return;
            }
          });
      });
    }
    if (args[0] === "username") {
      MojangAPI.profile(args[1], function(err, res) {
        if (err) console.log(err);
        else {
          console.log(res.id + " is also known as " + res.name + ".");

          const Embed = new Discord.RichEmbed()
            .setColor(color)
            .setTitle("UUID to Username:")
            .setDescription(res.id)
            .addField("Username", res.name, true)
            .setTimestamp()
            .setFooter(
              "Have a nice day! :)",
              "https://i.imgur.com/hxbaDUY.png"
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
            const Embed = new Discord.RichEmbed()
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
                "https://i.imgur.com/hxbaDUY.png"
              );
            
            message.channel.send(Embed);
          }
        }
      );
    }
  }
};
