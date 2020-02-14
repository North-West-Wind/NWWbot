const randomWords = require("random-words");
const Canvas = require("canvas");
const Discord = require("discord.js")
const { twoDigits, getRandomNumber, applyText } = require("../function.js")

module.exports = {
  name: "work",
  description: "Work and gain money!",
  execute(message, args, pool) {
    var currentDate = new Date();
    var date = currentDate.getDate();
    var month = currentDate.getMonth();
    var year = currentDate.getFullYear();
    var hour = currentDate.getHours();
    var minute = currentDate.getMinutes();
    var second = currentDate.getSeconds();
    var currentDateSql =
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
    pool.getConnection(function(err, con) {
      con.query(
        "SELECT * FROM currency WHERE user_id = " +
          message.author.id +
          " AND guild = " +
          message.guild.id,
        async function(err, results, fields) {
          if (results.length == 0) {
            var gain =
              Math.round((getRandomNumber(1, 1.5) + Number.EPSILON) * 100) /
              100;
            var worked = 1;
            var userID = message.author.id;

            con.query(
              "INSERT INTO currency (user_id, currency, worked, last_worked, guild, bank) VALUES(" +
                userID +
                ", " +
                gain +
                ", " +
                worked +
                ", '" +
                currentDateSql +
                "', " +
                message.guild.id +
                ", 0.00)",
              function(err, result) {
                if (err) throw err;
                console.log(
                  message.author.username +
                    " worked in server " +
                    message.guild.name +
                    " and gained $" +
                    gain +
                    "."
                );
              }
            );
            return message.channel.send(
              message.author + " worked and gained $" + gain + "!"
            );
          } else {
            var lastDate = results[0].last_worked;
            if (new Date() - lastDate < 3600000) {
              return message.channel.send("You can only work once an hour!");
            }
            var worked = results[0].worked;
            const filter = x => x.author.id === message.author.id;
            if (worked <= 20) {
              var gain =
                Math.round((getRandomNumber(1, 1.2) + Number.EPSILON) * 100) /
                100;
              var words = await randomWords(5);
              
            } else if (worked <= 60) {
              var gain =
                Math.round((getRandomNumber(2, 2.4) + Number.EPSILON) * 100) /
                100;
              var words = await randomWords(10);
            } else if (worked <= 120) {
              var gain =
                Math.round((getRandomNumber(5, 6) + Number.EPSILON) * 100) /
                100;
              var words = await randomWords(15);
            } else if (worked <= 200) {
              var gain =
                Math.round((getRandomNumber(13, 15.6) + Number.EPSILON) * 100) /
                100;
              var words = await randomWords(20);
            } else if (worked <= 300) {
              var gain =
                Math.round((getRandomNumber(34, 40.8) + Number.EPSILON) * 100) /
                100;
              var words = await randomWords(25);
            } else if (worked <= 420) {
              var gain =
                Math.round(
                  (getRandomNumber(89, 106.8) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(30);
            } else if (worked <= 560) {
              var gain =
                Math.round(
                  (getRandomNumber(233, 279.6) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(35);
            } else if (worked <= 720) {
              var gain =
                Math.round((getRandomNumber(610, 732) + Number.EPSILON) * 100) /
                100;
              var words = await randomWords(40);
            } else if (worked <= 900) {
              var gain =
                Math.round(
                  (getRandomNumber(1597, 1916.4) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(45);
            } else if (worked <= 1100) {
              var gain =
                Math.round(
                  (getRandomNumber(4181, 5017.2) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(50);
            } else if (worked <= 1320) {
              var gain =
                Math.round(
                  (getRandomNumber(10946, 13135.2) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(55);
            } else if(worked <= 1560){
              var gain =
                Math.round(
                  (getRandomNumber(28657, 34388.4) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(60);
            } else if(worked <= 1820) {
              var gain =
                Math.round(
                  (getRandomNumber(75025, 90030) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(65);
            } else if (worked <= 2100) {
              var gain =
                Math.round(
                  (getRandomNumber(196418, 235701.6) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(70);
            } else if(worked <= 2400) {
              var gain =
                Math.round(
                  (getRandomNumber(514229, 617074.8) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(75);
            } else if(worked <= 2720) {
              var gain =
                Math.round(
                  (getRandomNumber(1346269, 1615522.8) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(80);
            } else if (worked <= 3060) {
              var gain =
                Math.round(
                  (getRandomNumber(3524578, 4229493.6) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(85);
            } else if(worked <= 3420) {
              var gain =
                Math.round(
                  (getRandomNumber(9227465, 11072958) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(90);
            } else if(worked <= 3800) {
              var gain =
                Math.round(
                  (getRandomNumber(24157817, 28989380.4) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(95);
            } else if(worked <= 4200) {
              var gain =
                Math.round(
                  (getRandomNumber(63245986, 75895183.2) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(100);
            } else if(worked <= 4620) {
              var gain =
                Math.round(
                  (getRandomNumber(165580141, 198696169.2) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(105);
            } else if(worked <= 5060) {
              var gain =
                Math.round(
                  (getRandomNumber(433494437, 520193324.4) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(110);
            } else if(worked <= 5520) {
              var gain =
                Math.round(
                  (getRandomNumber(1134903170, 1361883804) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(115);
            } else if(worked <= 6000) {
              var gain =
                Math.round(
                  (getRandomNumber(2971215073, 3565458087.6) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(120);
            } else {
              var gain =
                Math.round(
                  (getRandomNumber(7778742049, 9334490458.8) + Number.EPSILON) * 100
                ) / 100;
              var words = await randomWords(125);
            }

            
            var wordCanvas = await Canvas.createCanvas(720, 360);
            const ctx = await wordCanvas.getContext('2d');
            
            
            
            var txt = words[0];

              //draw font
              ctx.font = applyText(wordCanvas, txt);
              ctx.strokeStyle = "black";
              ctx.lineWidth = wordCanvas.width / 102.4;
              ctx.strokeText(
                txt,
                wordCanvas.width / 2 - ctx.measureText(txt).width / 2,
                (wordCanvas.height) / 2
              );
              ctx.fillStyle = "#ffffff";
              ctx.fillText(
                txt,
                wordCanvas.width / 2 - ctx.measureText(txt).width / 2,
                (wordCanvas.height) / 2
              );
            
            
            var attachment = new Discord.MessageAttachment(
                wordCanvas.toBuffer(),
                "word-image.png"
              );
            
            var msg = await message.channel.send("Type the following words within 60 seconds:\n**Word 1:**", attachment);
              var collected = await message.channel.awaitMessages(filter, { time: 60000, max: 1, error: ["time"]});
            collected.first().delete();
            if(collected.first() === undefined || collected.first() === null || !collected.first()) {
              con.query(
              "UPDATE currency SET last_worked = '" +
                currentDateSql +
                "' WHERE user_id = " +
                message.author.id + " AND guild = " + message.guild.id,
              function(err, result) {
                if (err) throw err;
                console.log(
                  message.author.username +
                    " worked in server " + message.guild.name + " but failed their job."
                    
                );
              }
            );
                  msg.delete()
              return message.channel.send("You didn't type the word within 60 seconds and failed your job. Better luck next time!");
            }
              if(collected.first().content !== words[0]) {
                
                con.query(
              "UPDATE currency SET last_worked = '" +
                currentDateSql +
                "' WHERE user_id = " +
                message.author.id + " AND guild = " + message.guild.id,
              function(err, result) {
                if (err) throw err;
                console.log(
                  message.author.username +
                    " worked in server " + message.guild.name + " but failed their job."
                    
                );
              }
            );
                  msg.delete();
                return message.channel.send("You failed your job. Better luck next time!")
              }
              
              var num = 1;
              for(var i = 1; i < (words.length); i++) {
                var wordCanvas = await Canvas.createCanvas(720, 360);
            const ctx = await wordCanvas.getContext('2d');
            
            
                
                var txt = words[i];

              //draw font
              ctx.font = applyText(wordCanvas, txt);
              ctx.strokeStyle = "black";
              ctx.lineWidth = wordCanvas.width / 102.4;
              ctx.strokeText(
                txt,
                wordCanvas.width / 2 - ctx.measureText(txt).width / 2,
                (wordCanvas.height) / 2
              );
              ctx.fillStyle = "#ffffff";
              ctx.fillText(
                txt,
                wordCanvas.width / 2 - ctx.measureText(txt).width / 2,
                (wordCanvas.height) / 2
              );
            
            var attachment = new Discord.MessageAttachment(
                wordCanvas.toBuffer(),
                "word-image.png"
              );
                msg.delete();
                var msg = await message.channel.send("Type the following words within 60 seconds:\n**Word " + ++num + ":**", attachment);
                var collected2 = await message.channel.awaitMessages(filter, { time: 60000, max: 1, error: ["time"]});
                collected2.first().delete();
                if(collected2.first() === undefined || collected2.first() === null || !collected2.first()) {
              con.query(
              "UPDATE currency SET last_worked = '" +
                currentDateSql +
                "' WHERE user_id = " +
                message.author.id + " AND guild = " + message.guild.id,
              function(err, result) {
                if (err) throw err;
                console.log(
                  message.author.username +
                    " worked in server " + message.guild.name + " but failed their job."
                    
                );
              }
            );
                  msg.delete();
              return message.channel.send("You didn't type the word within 60 seconds and failed your job. Better luck next time!");
            }
                if(collected2.first().content !== words[i]) {
                  con.query(
              "UPDATE currency SET last_worked = '" +
                currentDateSql +
                "' WHERE user_id = " +
                message.author.id + " AND guild = " + message.guild.id,
              function(err, result) {
                if (err) throw err;
                console.log(
                  message.author.username +
                    " worked in server " + message.guild.name + " but failed their job."
                    
                );
              }
            );
                  msg.delete();
                return message.channel.send("You failed your job. Better luck next time!");
              }
               
              }
            worked += 1;
            var userID = message.author.id;
            var currency = results[0].currency;
            var newCurrency =
              Math.round((parseInt(currency) + gain + Number.EPSILON) * 100) /
              100;

            con.query(
              "UPDATE currency SET currency = '" +
                newCurrency +
                "', worked = " +
                worked +
                ", last_worked = '" +
                currentDateSql +
                "' WHERE user_id = " +
                message.author.id + " AND guild = " + message.guild.id,
              function(err, result) {
                if (err) throw err;
                console.log(
                  message.author.username +
                    " worked in server " +
                    message.guild.name +
                    " and gained $" +
                    gain
                );
              }
            );
            msg.delete()
            message.channel.send("<@" +
              message.author.id + "> worked and gained **$" + gain + "**!"
            );
          }
        }
      );
      if (err) throw err;
      con.release();
    });
  }
};
