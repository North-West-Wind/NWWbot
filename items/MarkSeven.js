const { elegantPair, altGetData } = require("../function.js");
const id = "1";

module.exports = {
  name: "MarkSeven",
  async run(message, msg, em, itemObject) {
    altGetData("SELECT * FROM lottery WHERE id = '" + message.author.id + "'", async function(err, results) {
      if(err) {
        em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
        return msg.edit(em);
      }
      if(results.length > 0) {
        em.setTitle("ERROR!").setDescription("You have already participate this one.\nPlease wait until the next one come out to participate.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
        return msg.edit(em);
      }
      em.setDescription("Type 7 numbers between 1-39!\nIntegers only!").setFooter("I will only wait 60 seconds.", message.client.user.displayAvatarURL());
      msg.edit(em);
      var collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 60000, errors: ["time"]}).catch(console.error);
      if(collected === undefined) {
        em.setTitle("ERROR!").setDescription("You didn't type the numbers in time!").setFooter("Cancelled.", message.client.user.displayAvatarURL());
        return msg.edit(em);
      }
      var cArgs = collected.first().content.split(" ");
      collected.first().delete();
      if(cArgs.length < 7) {
        em.setTitle("ERROR!").setDescription("You only typed " + cArgs.length + (cArgs.length === 1 ? " word" : " words") + "!").setFooter("Cancelled.", message.client.user.displayAvatarURL());
        return msg.edit(em);
      }
      var numbers = [];
      for(const cArg of cArgs) {
        var integer = parseInt(cArg);
        if(isNaN(integer)) {
          em.setTitle("ERROR!").setDescription("One of the words is not a number!").setFooter("Cancelled.", message.client.user.displayAvatarURL());
          return msg.edit(em);
        }
        if(integer < 1 || integer > 39) {
          em.setTitle("ERROR!").setDescription("One of the numbers is not in range!").setFooter("Cancelled.", message.client.user.displayAvatarURL());
          return msg.edit(em);
        }
        var arr = cArgs.filter(x => x === cArg);
        if(arr.length > 1) {
          em.setTitle("ERROR!").setDescription("Do not repeat the numbers!").setFooter("Cancelled.", message.client.user.displayAvatarURL());
          return msg.edit(em);
        }
        numbers.push(integer);
      }
      numbers.sort();
      var first = elegantPair(numbers[0], numbers[1]);
      var second = elegantPair(numbers[2], numbers[3]);
      var third = elegantPair(numbers[4], numbers[5]);
      var fourth = elegantPair(first, second);
      var fifth = elegantPair(third, numbers[6]);
      var final = elegantPair(fourth, fifth);
      altGetData("INSERT INTO lottery VALUES('" + message.author.id + "', " + final + ")", function(err) {
        if(err) {
          em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
          console.error(err);
          return msg.edit(em);
        }
        itemObject[id] -= 1;
        var str = JSON.stringify(itemObject);
        altGetData(`UPDATE inventory SET items = '${escape(str)}' WHERE id = '${message.author.id}'`, function(err) {
          if(err) {
            em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
            console.error(err);
            return msg.edit(em);
          }
          em.setTitle("Success!").setDescription("Your have participated in the lottery!").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
          return msg.edit(em);
        })
      });
    });
  }
}