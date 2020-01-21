const Discord = require("discord.js");

const { Image, createCanvas, loadImage } = require("canvas");
var fs = require("fs");

module.exports = {
  name: "test",
  description: "For test, really.",
  execute(message, args, pool) {
    
    pool.getConnection(function(err, con) {
      if(err) throw err;
      con.query("SELECT wel_img FROM servers WHERE id = " + message.guild.id, function(err, result, fields) {
        if(err) throw err;
        var img = new Image();

    img.onload = async function() {
      var height = img.height;
      var width = img.width;

      // code here to use the dimensions
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const applyText = (canvas, text) => {
        const ctx = canvas.getContext("2d");

        // Declare a base size of the font
        let fontSize = canvas.width / 12;

        do {
          // Assign the font to the context and decrement it so it can be measured again
          ctx.font = `${(fontSize -= 5)}px sans-serif`;
          // Compare pixel width of the text to the canvas minus the approximate avatar size
        } while (ctx.measureText(text).width > canvas.width - (canvas.width / 10));

        // Return the result to use in the actual canvas
        return ctx.font;
      };
      
      const welcomeText = (canvas, text) => {
        const ctx = canvas.getContext("2d");

        // Declare a base size of the font
        let fontSize = canvas.width / 24;

        do {
          // Assign the font to the context and decrement it so it can be measured again
          ctx.font = `${(fontSize -= 5)}px sans-serif`;
          // Compare pixel width of the text to the canvas minus the approximate avatar size
        } while (ctx.measureText(text).width > canvas.width - (canvas.width / 4));

        // Return the result to use in the actual canvas
        return ctx.font;
      };

      const image = await loadImage(url);

      // Select the color of the stroke
      ctx.strokeStyle = "#74037b";
      // Draw a rectangle with the dimensions of the entire canvas
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      const avatar = await loadImage(message.author.displayAvatarURL);

      ctx.drawImage(image, 0, 0, width, height);

      // Select the font size and type from one of the natively available fonts
      var txt = message.author.username + " #" + message.author.discriminator;
      ctx.font = applyText(canvas, txt);

      ctx.strokeStyle = "black";
      ctx.lineWidth = canvas.width / 102.4;
      ctx.strokeText(
        txt,
        canvas.width / 2 - ctx.measureText(txt).width / 2,
        (canvas.height * 3) / 4
      );
      // Select the style that will be used to fill the text in
      ctx.fillStyle = "#ffffff";

      // Actually fill the text with a solid color
      ctx.fillText(
        txt,
        canvas.width / 2 - ctx.measureText(txt).width / 2,
        (canvas.height * 3) / 4
      );

      var welcome = "Welcome to the server!";

      ctx.font = welcomeText(canvas, welcome);
      ctx.strokeStyle = "black";
      ctx.lineWidth = canvas.width / 204.8;
      ctx.strokeText(
        welcome,
        canvas.width / 2 - ctx.measureText(welcome).width / 2,
        (canvas.height * 6) / 7
      );
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        welcome,
        canvas.width / 2 - ctx.measureText(welcome).width / 2,
        (canvas.height * 6) / 7
      );

      // Pick up the pen
      ctx.beginPath();
      //line width setting
      ctx.lineWidth = canvas.width / 102.4;
      // Start the arc to form a circle
      
      ctx.arc(
        canvas.width / 2,
        canvas.height / 3,
        canvas.height / 5,
        0,
        Math.PI * 2,
        true
      );
      // Put the pen down
      ctx.closePath();
      ctx.strokeStyle = "black";
ctx.stroke();
      // Clip off the region you drew on
      ctx.clip();

      var buf = canvas.toBuffer();

      ctx.drawImage(
        avatar,
        canvas.width / 2 - canvas.height / 5,
        canvas.height / 3 - canvas.height / 5,
        canvas.height / 2.5,
        canvas.height / 2.5
      );

      const attachment = new Discord.Attachment(
        canvas.toBuffer(),
        "welcome-image.png"
      );
      //console.log('<img src="' + canvas.toDataURL() + '" />')
      message.channel.send("Image", attachment);
    };

    var url = result[0].wel_img;

    img.src = url;
      });
      con.release();
    })
    
  }
};
