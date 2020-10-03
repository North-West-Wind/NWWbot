module.exports = {
  name: "args",
  description: "Check args of messages.",
  category: 10,
  execute(message) {
    console.log(message.content);
  }
}