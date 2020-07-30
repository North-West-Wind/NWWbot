module.exports = {
  name: "args",
  description: "Check args of messages.",
  execute(message) {
    console.log(message.content);
  }
}