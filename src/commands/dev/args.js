const { NorthClient } = require("../../classes/NorthClient.js");

module.exports = {
  name: "args",
  description: "Check args of messages.",
  category: 10,
  execute(message) {
    NorthClient.storage.log(message.content);
  }
}