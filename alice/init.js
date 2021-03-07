const { AliceHandler } = require("../classes/Handler");
const { prefix1 } = require("../config.json");

module.exports = (client) => {
    client.prefix = prefix1;
    client.id = 1;
    AliceHandler.setup(client);
    client.login(process.env.TOKEN1);
}