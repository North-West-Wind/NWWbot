const giveaways = require("discord-giveaways");
const ms = require("ms"); // npm install ms
const Discord = require("discord.js");
const client = new Discord.Client();
var color = Math.floor(Math.random() * 16777214) + 1;
const moment = require("moment");
const mysql = require("mysql");

function twoDigits(d) {
  if (0 <= d && d < 10) return "0" + d.toString();
  if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
  return d.toString();
}

function rollIt(randomNumber, values) {
  for (let i = 0; i < randomNumber; i++) {
    if (i == randomNumber - 1) {
      return values.next();
    } else {
      values.next();
    }
  }
}

function end(msg, pool, guild) {
  msg.channel.fetchMessage(msg.id).then(mesg => {
    pool.getConnection(function(err, con) {
      if (err) throw err;
      con.query("SELECT giveaway FROM servers WHERE id = " + guild.id, function(
        err,
        result,
        fields
      ) {
        const reactions = mesg.reactions.find(
          reaction => reaction.emoji.name == result[0].giveaway
        );
        const randomNumber =
          Math.floor(Math.random() * (reactions.count - 1)) + 1;
        let values = reactions.users
          .filter(user => user !== client.user)
          .values();
        const winner = rollIt(randomNumber, values).value;
        if (winner == undefined)
      return mesg.channel.send(
        "No one reacted to the message, so no one wins."
      );
        con.query("SELECT * FROM giveaways WHERE id = " + msg.id, function(err2, result2, fields2) {
          if(err2) throw err2;
          mesg.channel.send(`The winner of \`${result2[0].item}\` is... <@${winner.id}>!`);
        });
    
      });
      con.release();
    });

    
  });
}

module.exports = {
  name: "giveaway",
  description: "Giveaway something.",
  args: true,
  usage: "<time> <winners> <items>",
  execute(message, args, pool) {
    var millisec = ms(args[1]);

    var currentDate = new Date();

    var newDate = new Date(currentDate.getTime() + millisec);
    console.log(newDate);
    var date = newDate.getDate();
    var month = newDate.getMonth();
    var year = newDate.getFullYear();
    var hour = newDate.getHours();
    var minute = newDate.getMinutes();
    var second = newDate.getSeconds();

    var monthDateYear =
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
    console.log(monthDateYear);

    const Embed = new Discord.RichEmbed()
    .setColor(color)
    .setTitle(args.slice(3).join(" "))
    .setDescription("End at " + monthDateYear)
    .setTimestamp()
	.setFooter('React to participate', 'https://i.imgur.com/hxbaDUY.png');
    
    message.channel
      .send(Embed)
      .then(msg => {
        var id = msg.id;
        pool.getConnection(function(err, con) {
          con.query(
            "INSERT INTO giveaways VALUES ('" +
              id +
              "', '" +
              guild.id +
              "', '" +
              message.channel.id +
              "', '" +
              args
                .slice(3)
                .join(" ")
                .replace(/"/g, '\\"')
                .replace(/'/g, "\\'") +
              "', '" +
              args[2] +
              "', '" +
              monthDateYear +
              "')",
            function(err, result) {
              if (err) throw err;
              console.log("Inserted successfully.");
            }
          );
          con.release();
        });
      })
      .then(msg => {
        pool.getConnection(function(err, con) {
          if (err) throw err;
          con.query(
            "SELECT giveaway FROM servers WHERE id = " + guild.id,
            async function(err, result, fields) {
              if (err) throw err;
              try {
              await msg.react(result[0].giveaway);
              } catch(err) {
                throw err;
              }
            }
          );
          con.release();
        });
      }).then(msg => {
      setTimeout(end(msg, pool, guild), newDate - currentDate);
    });

    var guild = message.guild;
    
  }
};
