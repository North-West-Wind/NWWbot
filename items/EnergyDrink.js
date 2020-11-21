const { twoDigits, altGetData } = require("../function.js");

module.exports = {
  name: "EnergyDrink",
  async run(message, msg, em, itemObject) {
    altGetData("SELECT doubling FROM currency WHERE user_id = '" + message.author.id + "'", function(err, results) {
      if(err) {
        em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
        console.error(err);
        return msg.edit(em);
      }
      if(results[0].doubling !== null) {
        if((results[0].doubling - Date.now()) > 0) {
          var newDate = new Date(results[0].doubling.getTime() + 86400000);
          var date = newDate.getDate();
          var month = newDate.getMonth();
          var year = newDate.getFullYear();
          var hour = newDate.getHours();
          var minute = newDate.getMinutes();
          var second = newDate.getSeconds();
          var newDateSql =
            year +
            "-" +
            twoDigits(month + 1) +
            "-" +
            twoDigits(date) +
            " " +
            twoDigits(hour) +
            ":" +
            twoDigits(minute) +
            ":" +
            twoDigits(second);
          altGetData(`UPDATE currency SET doubling = '${newDateSql}' WHERE user_id = '${message.author.id}'`, function(err) {
            if(err) {
              em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
              console.error(err);
              return msg.edit(em);
            }
            itemObject["2"] -= 1;
            altGetData(`UPDATE inventory SET items = '${escape(JSON.stringify(itemObject))}' WHERE id = '${message.author.id}'`, function(err) {
              if(err) {
                em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
                console.error(err);
                return msg.edit(em);
              }
              em.setTitle("You drank the Energy Drink!").setDescription("Now you work more efficiently for 24 hours!\nThe amount of money you gain will be doubled during this period!").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
              return msg.edit(em);
            });
          });
        } else {
          var newDate = new Date(Date.now() + 86400000);
          var date = newDate.getDate();
          var month = newDate.getMonth();
          var year = newDate.getFullYear();
          var hour = newDate.getHours();
          var minute = newDate.getMinutes();
          var second = newDate.getSeconds();
          var newDateSql =
            year +
            "-" +
            twoDigits(month + 1) +
            "-" +
            twoDigits(date) +
            " " +
            twoDigits(hour) +
            ":" +
            twoDigits(minute) +
            ":" +
            twoDigits(second);
          altGetData(`UPDATE currency SET doubling = '${newDateSql}' WHERE user_id = '${message.author.id}'`, function(err) {
            if(err) {
              em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
              console.error(err);
              return msg.edit(em);
            }
            itemObject["2"] -= 1;
            altGetData(`UPDATE inventory SET items = '${escape(JSON.stringify(itemObject))}' WHERE id = '${message.author.id}'`, function(err) {
              if(err) {
                em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
                console.error(err);
                return msg.edit(em);
              }
              em.setTitle("You drank the Energy Drink!").setDescription("Now you work more efficiently for 24 hours!\nThe amount of money you gain will be doubled during this period!").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
              return msg.edit(em);
            });
          });
        }
      } else {
        var newDate = new Date(Date.now() + 86400000);
        var date = newDate.getDate();
        var month = newDate.getMonth();
        var year = newDate.getFullYear();
        var hour = newDate.getHours();
        var minute = newDate.getMinutes();
        var second = newDate.getSeconds();
        var newDateSql =
          year +
          "-" +
          twoDigits(month + 1) +
          "-" +
          twoDigits(date) +
          " " +
          twoDigits(hour) +
          ":" +
          twoDigits(minute) +
          ":" +
          twoDigits(second);
        altGetData(`UPDATE currency SET doubling = '${newDateSql}' WHERE user_id = '${message.author.id}'`, function(err) {
          if(err) {
            em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
            console.error(err);
            return msg.edit(em);
          }
          itemObject["2"] -= 1;
          altGetData(`UPDATE inventory SET items = '${escape(JSON.stringify(itemObject))}' WHERE id = '${message.author.id}'`, function(err) {
            if(err) {
              em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
              console.error(err);
              return msg.edit(em);
            }
            em.setTitle("You drank the Energy Drink!").setDescription("Now you work more efficiently for 24 hours!\nThe amount of money you gain will be doubled during this period!").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
            return msg.edit(em);
          });
        });
      }
    });
  }
}