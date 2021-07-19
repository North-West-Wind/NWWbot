const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");
const { getRandomNumber } = require("../../function.js");

module.exports = {
  name: "rng",
  description: "Random number generator. Generate a random number between range.",
  usage: "<min> <max> [count] [decimal place]",
  aliases: ["randomnumber", "randomnumbergenerator"] ,
  category: 3,
  args: 2,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "min", "The minimum of the random number.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "max", "The maximum of the random number.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.INTEGER.valueOf(), "count", "How many numbers to generate."),
    new ApplicationCommandOption(ApplicationCommandOptionType.INTEGER.valueOf(), "decimal", "The maximum decimal place.")
  ]),
  async slash(_client, _interaction, args) {
		let count = 1;
		let decimal = -1;
    const min = Number(args[0].value);
    const max = Number(args[1].value);
    if (isNaN(min)) return InteractionResponse.sendMessage("The minimum must be a number!");
    if (isNaN(max)) return InteractionResponse.sendMessage("The maximum must be a number!");
    if(args[2]?.value && !isNaN(Number(args[2].value))) count = parseInt(args[2].value);
		if(args[3]?.value !== undefined && !isNaN(parseInt(args[3].value))) decimal = parseInt(args[3].value);
		let msg = "";
		for(let i = 0; i < count; i++) {
    	var number = decimal < 0 ? getRandomNumber(min, max) : Math.round((getRandomNumber(Number(args[0]), Number(args[1])) + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
      if (decimal >= 0) number = Math.round((number + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
			msg += number + "\n";
		}
    return InteractionResponse.sendMessage(msg);
  },
  async execute(message, args) {
		let count = 1;
		let decimal = -1;
    const min = Number(args[0]);
    const max = Number(args[1]);
    if(isNaN(min) || isNaN(max)) return message.channel.send("Discovered non-number objects!");
    
    if(args[2] && !isNaN(Number(args[2]))) count = parseInt(args[2]);
		if(args[3] !== undefined && !isNaN(parseInt(args[3]))) decimal = parseInt(args[3]);
		let msg = "";
		for(let i = 0; i < count; i++) {
    	var number = decimal < 0 ? getRandomNumber(min, max) : Math.round((getRandomNumber(Number(args[0]), Number(args[1])) + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
      if (decimal >= 0) number = Math.round((number + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
			msg += number + "\n";
		}
    await message.channel.send(msg);
  }
}