module.exports = {
  name: "args",
  description: "Check args of messages.",
  category: 9,
  execute(message) {
    console.log(message.content);
  }
}