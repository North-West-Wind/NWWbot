require("newrelic")
const express = require("express");
const request = require("request");
const device = require("express-device");
const app = express();
const moment = require("moment");
//require("heroku-self-ping").default(process.env.APP_URL);
app.use(device.capture());
app.get("/", (req, response) => {
  if(req.device.type === "phone")
    response.sendFile(__dirname + "/views/mobile/index.html");
  else
    response.sendFile(__dirname + "/views/index.html");
});
app.get("/news", (req, response) => {
  if(req.device.type === "phone")
    response.sendFile(__dirname + "/views/mobile/news.html");
  else
    response.sendFile(__dirname + "/views/news.html");
});
app.get("/about", (req, response) => {
  if(req.device.type === "phone")
    response.sendFile(__dirname + "/views/mobile/about.html");
  else
    response.sendFile(__dirname + "/views/about.html");
});
app.get("/manual", (req, response) => {
  request("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2Fmanual.pdf?v=1589543070522").pipe(response);
});
app.get("/ping", (req, response) => {
  console.log(`Pinged at ${moment().format("HH:mm:ss")}`);
  response.sendStatus(200);
});
app.listen(process.env.PORT || 3000);