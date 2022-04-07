<img src="https://github.com/powerdot/Telegram-Bot-Framework/blob/master/assets/head1-crop-trans.png?raw=true" width=400/>

# TBF • Example • Cafe bot

## Try it out 🚀

Available in Telegram [@powerdot_cafe_bot](https://t.me/powerdot_cafe_bot)

## About

This is example about some cafe's telegram bot.  
Here you can find:
* Menu
* Booking
* Gallery
* Contacts

Some pages have "smart function" to demonstrate how to use it.
Here is you can check out **smart search in Menu**, **nearest cafe in Contacts** and **gallery viewer plugin in Gallery**. Also don't forget to check out **Booking** and **Booking History**.  
Booking can remember your name and phone to make it easier to make a booking again.


### Env example
```
CAFE_TOKEN=XX:XXXX...
```

## How to run

## How to debug

## Create own bot!

This example uses relative dependencies to `src` of TBF.  
If you want create your own bot, don't forget to replace them to `telegram-bot-framework`.  
Like:  
```js
// from
const { TBF } = require('../../../../src');
// to
const { TBF } = require('telegram-bot-framework');
```

🕺 [Here is you can get empty template](https://github.com/powerdot/TBF-b-template) to start coding bot like that!
