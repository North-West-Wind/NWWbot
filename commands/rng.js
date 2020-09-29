const { getRandomNumber } = require("../function.js");

module.exports = {
  name: "rng",
  description: "Random number generator. Generate a random number between range.",
  usage: "<min> <max> [count] [decimal place]",
  aliases: ["randomnumber", "randomnumbergenerator"] ,
  execute(message, args) {
		let count = 1;
		let decimal = -1;
    
    if(!args[0]) {
      return message.channel.send("You didn't provide the minimum number!" + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
    }
    if(!args[1]) {
      return message.channel.send("You didn't provide the maximum number!" + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``)
    }
    
    if(isNaN(Number(args[0])) || isNaN(Number(args[1]))) return message.channel.send("Discovered non-number objects!");
    
    if(args[2] && !isNaN(Number(args[2]))) count = parseInt(args[2]);
		if(args[3] && !isNaN(parseInt(args[3]))) decimal = parseInt(args[3]);
		let msg = "";
    
		for(let i = 0; i < count; i++) {
    	var number = decimal < 0 ? getRandomNumber(Number(args[0]), Number(args[1])) : Math.round((getRandomNumber(Number(args[0]), Number(args[1])) + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
			msg += number + "\n";
		}
    
    message.channel.send(msg);
  }
}