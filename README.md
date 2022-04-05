<img src="https://github.com/powerdot/Telegram-Bot-Framework/blob/master/assets/head1-crop-trans.png?raw=true" width=400/>

# TBF • Telegram Bot Framework
Node.js framework based on [Telegraf](https://github.com/telegraf/telegraf) to facilitate writing multi-level and multi-page bots.

[✈️ Examples are availiable here](https://github.com/powerdot/Telegram-Bot-Framework/tree/master/examples)

<img src="https://github.com/powerdot/Telegram-Bot-Framework/blob/master/assets/structure_example.png?raw=true&v3" width="100%"/>

## Features
* Component-like developing (pages/plugins)
* Built-in MongoDB support (to collect user's data: routing, sessions, etc.)
* Built-in Express.js support
* Works with JS and TS
* Supports inherit Telegram and Telegraf methods

## Installation

### Requirements

⚠️ **To run TBF you need to have [MongoDB](https://www.mongodb.com/) installed and running.**

### Install package

```bash
npm install telegram-bot-framework
```
or
```bash
yarn add telegram-bot-framework
```

### Add to your project

For JS project:
```js
// index.js
let { TBF } = require("telegram-bot-framework")
```

For TS project:
```js
// index.ts
import { TBF } from "telegram-bot-framework"
```

Create **enter point** for your bot:
```js
// index.js / index.ts

TBF({
    telegram: {
        token: "xxx", // provide your token
    },
    mongo: {
        dbName: "testbot" // provide your db name in MongoDB
    }
}).then(({ openPage }) => {
    // If bot is ready, you can define own middlewares

    // here is one for /start command
    bot.command("start", async (ctx) => {
        // open page with ID "index"
        await openPage({ ctx, page: "index" })
    })
})
```

So next step is create **index** page (check *First meeting* section below).

## First meeting

Here we will get acquainted with the concept of pages in the telegram bot.

### Page

1. Create **'pages' folder** in your project
2. Create **'index.js'** file in **'pages'** folder
3. Paste code below to **'index.js'** file
```js
// pages/index.js

let { Component } = require("telegram-bot-framework")
module.exports = Component(() => { // (1)
    return { // (2)
        actions: {
            async main() { // (3)
                await this.clearChat(); // (4)
                this.send({ // (5)
                    text: `Hey!`
                });
            },
        }
    }
})
```

Ok, now we have a page with ID **index** and one action named **main**.  
**Page ID is file name without extension.*  

🤔 But how it works?

* (1) - we create component with **Component** function. And exported it to **module.exports**.
* (2) - Component function must to return object of our component.
* (3) - we define action named **main** in **actions** key. It's a default action for every component.
* (4) - we call **clearChat** method to clear chat.
* (5) - we send message with **send** method.

That's all.

### Let's start!

Run your bot (`node index.js`) and send **/start** command to it.  

👀 Let's see what happens.
1. Your bot waiting for **/start** command.
```js
// index.js

bot.command("start", async (ctx) => {
    await openPage({ ctx, page: "index" })
})
```
2. When you send **/start** command, your bot will open page with ID **index** by **openPage*** function. 
**openPage function provided by TBF*.
3. TBF automatically adds default action name to openPage arguments if you don't provide it:
```js
// from
await openPage({ ctx, page: "index" })
// to
await openPage({ ctx, page: "index", action: "main" })
```
*So that's why we need to add **main** to our **actions** in component. It's just a default action.*  
4. TBF triggers **main** action in **index** page.
```js
// pages/index.js

let { Component } = require("telegram-bot-framework")
module.exports = Component(() => {
    return {
        actions: { 
            async main() { ... // <-- triggered action
```
5. And now we have only 2 commands to execute: 
```js
// pages/index.js

...
async main() {
    await this.clearChat(); // built-in method to clear chat
    this.send({ // built-in method to send message
        text: `Hey!` 
    });
}
...
```

🎉 Congratulations!   
You have successfully created your bot with TBF.  
👉 Check out [examples](https://github.com/powerdot/Telegram-Bot-Framework/tree/master/examples) here is code and demos!

## API



## Plugins

<hr/>

By [@powerdot](https://github.com/powerdot)
