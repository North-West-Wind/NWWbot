function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}
function twoDigits(d) {
  if (0 <= d && d < 10) return "0" + d.toString();
  if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
  return d.toString();
}

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
        function(err, results, fields) {
          if (results.length == 0) {
            var gain =
              Math.round((getRandomNumber(1, 1.5) + Number.EPSILON) * 100) /
              100;
            var worked = 1;
            var userID = message.author.id;

            con.query(
              "INSERT INTO currency (user_id, currency, worked, last_worked, guild) VALUES(" +
                userID +
                ", " +
                gain +
                ", " +
                worked +
                ", '" +
                currentDateSql +
                "', " +
                message.guild.id +
                ")",
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
            if (worked <= 50) {
              var gain =
                Math.round((getRandomNumber(1, 1.2) + Number.EPSILON) * 100) /
                100;
            } else if (worked <= 100) {
              var gain =
                Math.round((getRandomNumber(2, 2.4) + Number.EPSILON) * 100) /
                100;
            } else if (worked <= 250) {
              var gain =
                Math.round((getRandomNumber(5, 6) + Number.EPSILON) * 100) /
                100;
            } else if (worked <= 500) {
              var gain =
                Math.round((getRandomNumber(13, 15.6) + Number.EPSILON) * 100) /
                100;
            } else if (worked <= 1000) {
              var gain =
                Math.round((getRandomNumber(34, 40.8) + Number.EPSILON) * 100) /
                100;
            } else if (worked <= 2500) {
              var gain =
                Math.round(
                  (getRandomNumber(89, 106.8) + Number.EPSILON) * 100
                ) / 100;
            } else if (worked <= 5000) {
              var gain =
                Math.round(
                  (getRandomNumber(233, 279.6) + Number.EPSILON) * 100
                ) / 100;
            } else if (worked <= 10000) {
              var gain =
                Math.round((getRandomNumber(610, 732) + Number.EPSILON) * 100) /
                100;
            } else if (worked <= 25000) {
              var gain =
                Math.round(
                  (getRandomNumber(1597, 1916.4) + Number.EPSILON) * 100
                ) / 100;
            } else if (worked <= 50000) {
              var gain =
                Math.round(
                  (getRandomNumber(4181, 5017.2) + Number.EPSILON) * 100
                ) / 100;
            } else if (worked <= 100000) {
              var gain =
                Math.round(
                  (getRandomNumber(10946, 13135.2) + Number.EPSILON) * 100
                ) / 100;
            } else {
              var gain =
                Math.round(
                  (getRandomNumber(28657, 34388.4) + Number.EPSILON) * 100
                ) / 100;
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
            message.channel.send(
              message.author + " worked and gained $" + gain + "!"
            );
          }
        }
      );
      if (err) throw err;
      con.release();
    });
  }
};
