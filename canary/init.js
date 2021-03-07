const { CanaryHandler } = require("../classes/Handler");

module.exports = (client) => {
    client.prefix = "%";
    client.id = 0;
    CanaryHandler.setup(client);
    client.login(process.env.TOKEN_CANARY);
}