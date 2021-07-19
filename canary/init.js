const { CanaryHandler } = require("../classes/Handler.js");

module.exports = (client) => {
    client.prefix = "%";
    client.id = 0;
    CanaryHandler.setup(client);
    client.login(process.env.TOKEN_CANARY);
}