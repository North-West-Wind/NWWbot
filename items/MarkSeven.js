const { elegantPair } = require("../function.js");
const ID = "3f4442c06b90c39340394ab33bab928b7a290593a54ea1d4";
const { NorthClient } = require("../classes/NorthClient.js");

module.exports = {
  name: "MarkSeven",
  async run(message, msg, em, itemObject) {
    const con = await message.pool.getConnection();
    try {
      var [results] = await con.query("SELECT * FROM lottery WHERE id = '" + message.author.id + "'");
      if (results.length > 0) em.setTitle("ERROR!").setDescription("You have already participate this one.\nPlease wait until the next one come out to participate.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
      else {
        em.setDescription("Type 7 numbers between 1-39!\nIntegers only!").setFooter("I will only wait for 60 seconds.", message.client.user.displayAvatarURL());
        msg.edit(em);
        const collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 60000 }).catch(NorthClient.storage.error);
        if (!collected.first()) em.setTitle("ERROR!").setDescription("You didn't type the numbers in time!").setFooter("Cancelled.", message.client.user.displayAvatarURL());
        else {
          await collected.first().delete();
          const cArgs = collected.first().content.split(" ");
          if (cArgs.length < 7) em.setTitle("ERROR!").setDescription("You only typed " + cArgs.length + (cArgs.length === 1 ? " word" : " words") + "!").setFooter("Cancelled.", message.client.user.displayAvatarURL());
          else {
            const numbers = [];
            var error = false;
            for (const cArg of cArgs) {
              var integer = parseInt(cArg);
              if (isNaN(integer)) em.setTitle("ERROR!").setDescription("One of the words is not a number!").setFooter("Cancelled.", message.client.user.displayAvatarURL());
              else if (integer < 1 || integer > 39) em.setTitle("ERROR!").setDescription("One of the numbers is not in range!").setFooter("Cancelled.", message.client.user.displayAvatarURL());
              else if (cArgs.filter(x => x === cArg).length > 1) em.setTitle("ERROR!").setDescription("Do not repeat the numbers!").setFooter("Cancelled.", message.client.user.displayAvatarURL());
              if (em.title === "ERROR!") {
                error = true;
                await msg.edit(em);
                break;
              }
              numbers.push(integer);
            }
            if (!error) {
              numbers.sort();
              var first = elegantPair(numbers[0], numbers[1]);
              var second = elegantPair(numbers[2], numbers[3]);
              var third = elegantPair(numbers[4], numbers[5]);
              var fourth = elegantPair(first, second);
              var fifth = elegantPair(third, numbers[6]);
              var final = elegantPair(fourth, fifth);
              await con.query("INSERT INTO lottery VALUES('" + message.author.id + "', " + final + ")");
              itemObject[ID] -= 1;
              var str = JSON.stringify(itemObject);
              await con.query(`UPDATE inventory SET items = '${escape(str)}' WHERE id = '${message.author.id}'`)
              em.setTitle("Success!").setDescription("Your have participated in the lottery!").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
            }
          }
        }
      }
    } catch (err) {
      em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
      NorthClient.storage.error(err);
    }
    await msg.edit(em);
    con.release();
  }
}