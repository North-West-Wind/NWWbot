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
                if (!body.player.prefix) {
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
                    if (body.player.rank === "YOUTUBER") {
                      var rank = "Youtuber";
                    }
                    if (body.player.rank === "ADMIN") {
                      var rank = "ADMIN";
                    }
                  }
                } else {
                  if (body.player.prefix === "§c[OWNER]") {
                    var rank = "OWNER";
                  }
                  if (body.player.prefix === "§d[PIG§b+++§d]") {
                    var rank = "PIG+++";
                  }
                }
                message.channel.send("<@" + item.dcmc_dcid + "> is " + rank);
              }
            }
          );
        });
      }
    );
  }
};
