const { getRandomNumber } = require("../function.js");
const { prefix } = require("../config.json");

module.exports = {
  name: "rng",
  description: "Random number generator. Generate a random number between range.",
  usage: "<min> <max>",
  aliases: ["randomnumber", "randomnumbergenerator"] ,
  execute(message, args) {
    
    if(!args[0]) {
      return message.channel.send("You didn't provide the minimum number!" + ` Usage: \`${prefix}${this.name} ${this.usage}\``);
    }
    if(!args[1]) {
      return message.channel.send("You didn't provide the maximum number!" + ` Usage: \`${prefix}${this.name} ${this.usage}\``)
    }
    
    if(isNaN(Number(args[0])) || isNaN(Number(args[1]))) return message.channel.send("Discovered non-number objects!");
    
    
    
    var number = getRandomNumber(Number(args[0]), Number(args[1]))
    
    message.channel.send(number);
  }
}