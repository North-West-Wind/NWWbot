module.exports = {
  name: "autorole",
  description: "Automatically give Discord users a hypixel row.",
  execute(message) {
    var request = require("request");

    const data = "http://warofunderworld.000webhostapp.com/json.php";
    request(
      {
        url: data,
        json: true
      },
      function(err, res, info) {
        info.forEach(function(item, index, array) {
          const url =
            "https://api.hypixel.net/player?uuid=" +
            item.dcmc_uuid +
            "&key=" +
            process.env.API;

          request(
            {
              url: url,
              json: true
            },

            function(error, response, body) {
              if (!error && response.statusCode === 200) {
                try {
                
                  if (!body.player.rank) {
                    if (!body.player.newPackageRank) {
                      var rank = "Non";
                    } else {
                      if (body.player.newPackageRank === "VIP") {
                        var rank = "VIP";
                      }
                      if (body.player.newPackageRank === "VIP_PLUS") {
                        var rank = "VIP+";
                      }
                      if (body.player.newPackageRank === "MVP") {
                        var rank = "MVP";
                      }
                      if (body.player.newPackageRank === "MVP_PLUS") {
                        var rank = "MVP+";
                      }
                      if (body.player.newPackageRank === "MVP_PLUS_PLUS") {
                        var rank = "MVP++";
                      }
                    }
                  } else {
                    if (body.player.rank === "ADMIN") {
                      var rank = "Hypixel Admin";
                    }
                  }
                
                message.channel.send("<@" + item.dcmc_dcid + "> is " + rank);
                  let member = message.guild.members.get(item.dcmc_dcid);
                  if(rank != "Non") {
                    let role = message.guild.roles.find(`name`, rank);
                  member.addRole(role).then(role => console.log("Gave " + item.dcmc_dcname + " the role " + role)).catch(console.error);
                  message.channel.send("Gave <@" + item.dcmc_dcid + "> the role " + rank);
                  }
                } catch (err) {
                  console.log(err);
                }
              }
            }
          );
        });
      }
    );
  }
};
