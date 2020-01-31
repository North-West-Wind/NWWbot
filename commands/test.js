const Discord = require("discord.js");
const ms = require("ms");

const { Image, createCanvas, loadImage } = require("canvas");
var fs = require("fs");

module.exports = {
  name: "test",
  description: "For test, really.",
  execute(message, args, pool) {
    const filter = user => user.author.id === message.author.id;
    const guild = message.guild;
    message.channel
      .send(
        "Giveaway creation started. Which channel do you want the giveaway be in? (Please mention the channel)"
      )
      .then(() => {
        message.channel
          .awaitMessages(filter, { time: 30000, max: 1, error: ["time"] })
          .then(collected => {
            var channelID = collected
              .first()
              .content.replace(/<#/, "")
              .replace(/>/, "");
            var channel = guild.channels.get(channelID);
            message.channel.send("The channel will be " + channel + "\n\nNow please enter the duration of the giveaway!")
              .then(() => {
                message.channel
                  .awaitMessages(filter, {
                    time: 30000,
                    max: 1,
                    error: ["time"]
                  })
                  .then(collected2 => {
                    var duration = ms(collected2.first().content);
                    var sec = duration / 1000;
                    var dd = Math.floor(sec / 86400);
                    var dh = Math.floor((sec % 86400) / 3600);
                    var dm = Math.floor(((sec % 86400) % 3600) / 60);
                    var ds = Math.floor(((sec % 86400) % 3600) % 60);
                    message.channel.send(
                      "The duration will be **" +
                        dd +
                        " days " +
                        dh +
                        " hours " +
                        dm +
                        " minutes " +
                        ds +
                        " seconds** \n\nI'd like to know how many participants can win this giveaway. Please enter the winner count."
                      )
                      .then(() => {
                        message.channel
                          .awaitMessages(filter, {
                            time: 30000,
                            max: 1,
                            error: ["time"]
                          })
                          .then(collected3 => {
                            if (parseInt(collected3.first().content) == 1) {
                              var participant = "participant";
                            } else {
                              var participant = "participants";
                            }
                            message.channel.send(
                              "Alright! **" +
                                collected3.first().content +
                                "** " +
                                participant +
                                " will win the giveaway. \n\nAt last, please tell me what is going to be giveaway!"
                              )
                              .then(() => {
                                message.channel
                                  .awaitMessages(filter, {
                                    time: 30000,
                                    max: 1,
                                    error: ["time"]
                                  })
                                  .then(collected4 => {
                                    message.channel.send(
                                      "The items will be **" +
                                        collected4.first().content +
                                        "**"
                                    );
                                  })
                                  .catch(err => {
                                    message.channel.send(
                                      "30 seconds have passed. Action cancelled."
                                    );
                                  });
                              });
                          })
                          .catch(err => {
                            message.channel.send(
                              "30 seconds have passed. Action cancelled."
                            );
                          });
                      });
                  })
                  .catch(err => {
                    message.channel.send(
                      "30 seconds have passed. Action cancelled."
                    );
                  });
              });
          })
          .catch(err => {
            message.channel.send("30 seconds have passed. Action cancelled.");
          });
      });
  }
};
