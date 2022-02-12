# N0rthWestW1nd

Just a random Discord bot made by NorthWestWind#1885 (or call him North for short) because he was really bored.\
There are many better bots out there and I recommend everyone to also check those out.

# Bot Profile
ID: 649611982428962819\
Name: N0rthWestW1nd\
Birthdate: 29th November 2019\
Gender: Unknown\
Favourite Command: (NSFW)\
Language: Node.js\
Author: NorthWestWind#1885

You can invite me right [here](https://discord.com/api/oauth2/authorize?client_id=649611982428962819&permissions=1391586679&scope=bot).\
I demand the right to Manage Server, but if you don't want to give that to me, understandable, have a great day. Just use [this](https://discord.com/api/oauth2/authorize?client_id=649611982428962819&permissions=0&scope=bot).

# Open Source
I'm actually an open source Discord bot, unlike all the other bots. Do whatever you want. You can fork me, copy part of me, or just have a better understanding on me. If you are interested in making a Discord bot, be sure to take a look at me. I'm not a perfect bot, but having a look inside me may inspire you to make something! There is always a great feeling about helping people. You should help others too.

# Website
There's a homepage for me somewhere in the Internet. If you want to visit it, just click [here](https://northwestwind.ml/n0rthwestw1nd). You can find invite link, updates and supports there.

# Requests & Bugs
Want to make requests on new commands? You can do that in my [server](https://discord.gg/n67DUfQ)! For bug reports, you can also do that in my [server](https://discord.gg/n67DUfQ)! North is planning to make another way for users to submit suggestions and issues without joining any Discord servers, so stay tuned!

# Your Data
Some might be concerned whether you are getting tracked while using me in your server. The answer is, I do store some of your data, but they are only messages/attachments provided in several commands, such as `play`, `add`, `config`, `prefix`, etc. Said data is only stored locally where I am running on (a.k.a. North's Raspberry Pi).

If you don't trust me, take a look at my code. I'm an honest man.  
If you still don't trust me, you can ask North to delete the data stored.

# Forking & Running
Some might want to make a copy of me and run it themselves. If you are the chosen one, please take a look at this guide before proceeding!

## Before Starting
Recall that I'm written in Node.js. Therefore, to run my clone, you will also need Node.js, more specifically, Node.js v16 and NPM v8. Please have them installed before running a clone!

## Cloning
First, no matter if you are going to run it on [ReplIt](https://replit.com) or anywhere else, please still use the [`replit`](https://github.com/North-West-Wind/NWWbot/tree/replit) branch. It makes things much easier.  
To clone the repository, simply use
```
git clone -b replit https://github.com/North-West-Wind/NWWbot.git
```
If you are using ReplIt already, you can import from GitHub.

## Database
One of the biggest part of me is the MySQL database. It stores a lot of data inside. Because of that, you will really need a database.  
If you already own a MySQL database or plan to set up a one, please import the [`template.sql`](https://github.com/North-West-Wind/NWWbot/blob/replit/template.sql) file to it. It will create the necessary database structure for you!  
If you don't have a database and don't have any plans to get one, I would recommend using [remotemysql](https://remotemysql.com). Then, you will need to do the same thing as the above line.

## Environment Variables
The next thing is to fill in the environment variables.  
From where you have cloned the files, look for [`example.env`](https://github.com/North-West-Wind/NWWbot/blob/replit/example.env). If you are not using ReplIt, copy it to `.env`. For ReplIt users, you should input them in the `Secrets` tab. Inside `example.env` lists a bunch of stuff.  
The most important one is the bot's token. Repalce `yourtoken` with the actual token of your bot.
```
#Token for the bot
TOKEN0=yourtoken
```
And then there are the database credentials. Quite straight-forward. If your database is not running on port `3306`, add your port number to the end of `DBHOST` with `:<port>`.
```
#MySQL Database
#I recommend remotemysql.com if you don't have one
DBHOST=remotemysql.com
DBNAME=databasename
DBPW=databasepassword
DBUSER=databaseusername
```
You will also find a variable named `DC`. If you want to enable the dev commands, replace it with your user ID.
```
#Just my Discord ID. Replace this with yours.
DC=416227242264363008
```
There are some non-essential variables to set, namely Reddit, Spotify and GFYCat. The bot will work fine without these. However, if you don't plan to use them, please remove them from the `.env` file or whereever the secrets are stored.

## Dependencies
All required dependencies are inside [`package.json`](https://github.com/North-West-Wind/NWWbot/blob/replit/package.json). You can install all of them with ease by running:
```
npm i
```
You may receive errors about something "canvas", "panga", "cairo". If so, please refer to [`node-canvas Wiki`](https://github.com/Automattic/node-canvas/wiki) and troubleshoot from there.

## Starting
Now you are finally ready to start the clone! Use the following command and enjoy!
```
npm start
```

# License
MIT
