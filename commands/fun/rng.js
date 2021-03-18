const { getRandomNumber } = require("../../function.js");

module.exports = {
  name: "rng",
  description: "Random number generator. Generate a random number between range.",
  usage: "<min> <max> [count] [decimal place]",
  aliases: ["randomnumber", "randomnumbergenerator"] ,
  category: 3,
  args: 2,
  execute(message, args) {
		let count = 1;
		let decimal = -1;
    
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