<img src="https://github.com/powerdot/Telegram-Bot-Framework/blob/master/assets/head1-crop-trans.png?raw=true" width=400/>

# TBF • Example • TwitHub bot

## Try it out 🚀

Available in Telegram [@powerdot_twithub_bot](https://t.me/powerdot_twithub_bot)
And at [twithub.ilyich.ru](https://twithub.ilyich.ru) - as open board.

## About

This is example of little, small and piece of social network.  
Just run bot, make a post and [see it here](https://twithub.ilyich.ru).  
Also you can remove own messages. Each user can post only 5 messages.

## How to run

This bot works relativly as TBF example.  
You can't run it without downloading full repository of [Telegram Bot Framework (.zip)](https://github.com/powerdot/Telegram-Bot-Framework/archive/refs/heads/master.zip).  
1. Download TBF
2. Unzip TBF
3. cd to TBF folder
4. Run `npm i`
5. Create `.env` file with
```
CAFE_TOKEN=XXX
TWITHUB_TOKEN=XXX
DELIVERY_TOKEN=XXX
GAME_TOKEN=XXX

TWITHUB_ADDRESS=http://localhost:8383
TWITHUB_PORT=8383

MONGO_URL=mongodb://localhost:27017/
```
6. Fill `.env` file with your data and tokens
7. Make sure that MongoDB is running.
8. Run bot by `npm run SCRIPTNAME` command
You can find scripts [here](https://github.com/powerdot/Telegram-Bot-Framework/blob/master/package.json).  
Look for `[bot]_run` script to run bot and `[bot]_debug` to debug it with Chrome console.  
8.1. Chrome debug available on `chrome://inspect`

## Create own bot!

This example uses relative dependencies to `src` of TBF.  
If you want create your own bot, copy code and don't forget to replace dependencies to `telegram-bot-framework`.  
Like:  
```js
// from
const { TBF } = require('../../../../src');
// to
const { TBF } = require('telegram-bot-framework');
```

🕺 [Here is you can get empty template](https://github.com/powerdot/TBF-bw-template) to start coding bot like that!
