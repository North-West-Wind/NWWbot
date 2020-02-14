const { getRandomNumber } = require("../function.js")

module.exports = {
  name: "rng",
  description: "Generates random number.",
  usage: "<min> <max>",
  aliases: ["randomnumber", "randomnumbergenerator"] ,
  execute(message, args) {
    
    if(!args[0]) {
      return message.channel.send("You didn't provide the minimum number!");
    }
    if(!args[1]) {
      return message.channel.send("You didn't provide the maximum number!")
    }
    
    if(isNaN(Number(args[0])) || isNaN(Number(args[1]))) return message.channel.send("Discovered non-number objects!");
    
    
    
    var number = getRandomNumber(Number(args[0]), Number(args[1]))
    
    message.channel.send(number);
  }
}