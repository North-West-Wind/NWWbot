module.exports = (req, res) => {
  res.sendStatus(200);
  require("child_process").exec("node ./app.js");
}