const { prefix } = require("../config.json");
const { Handler } = require("../classes/Handler.js");

module.exports = (client) => {
    client.prefix = prefix;
    client.id = 0;
    Handler.setup(client);
    client.login(process.env.TOKEN0);
}