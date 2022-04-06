<img src="https://github.com/powerdot/Telegram-Bot-Framework/blob/master/assets/head1-crop-trans.png" width=400/>

# TBF • Telegram Bot Framework
[![Project Status: Concept – Minimal or no implementation has been done yet, or the repository is only intended to be a limited example, demo, or proof-of-concept.](https://www.repostatus.org/badges/latest/concept.svg)](https://www.repostatus.org/#concept)  

Node.js framework based on [Telegraf](https://github.com/telegraf/telegraf) to facilitate writing multi-level and multi-page bots.

[✈️ Examples are availiable here](https://github.com/powerdot/Telegram-Bot-Framework/tree/master/examples)

<img src="https://github.com/powerdot/Telegram-Bot-Framework/blob/master/assets/structure_example.png" width="100%"/>

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

So next step is create **index** page (check *Introduction to Pages* section below).

## Introduction to Pages

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

* `(1)` - We create component with **Component** function. And exported it to **module.exports**.
* `(2)` - Component function must to return object of our component.
* `(3)` - We define action named **main** in **actions** key. It's a default action for every component.
* `(4)` - We call **clearChat** method to clear chat.
* `(5)` - We send message with **send** method.

That's all.

### TBF data flow scheme
Checkout the scheme below:
<img src="https://github.com/powerdot/Telegram-Bot-Framework/blob/master/assets/tbf-data-scheme.png?v3" width="100%">
Main idea of this scheme is to display that Express and Pages/Plugins are connected by MongoDB database.  
And also you can send user's data with API as in [this example](https://github.com/powerdot/Telegram-Bot-Framework/tree/master/examples/twithub). And of course your API can interact with TBF Engine (send messages to users, etc.). through connection with TBF entry point.  
By the way, you can see there is two routings: 
* TBF routing (TBF Engine, for Bot)  
*You can't change routing rules without forking this project. TBF takes care of it by default.*
* Express routing (Express, for Web)  
*You can change routing rules on yourself in `webserver/index.js` file.*

### Let's start!

Run your bot (`node index.js`) and send `/start` command to it.  

👀 Let's see what happens.
1. Your bot waiting for `/start` command.
```js
// index.js

bot.command("start", async (ctx) => {
    await openPage({ ctx, page: "index" })
})
```
2. When you send `/start` command, your bot will open page with ID **index** by **openPage*** function. 
**`openPage()` function provided by TBF Engine*.
3. TBF automatically adds default action name to `openPage({})` arguments if you don't provide it:
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
    await this.clearChat(); // TBF Engine's method to clear chat with user
    this.send({ // TBF Engine's method to send message back to user
        text: `Hey!` 
    });
}
...
```

🎉 Congratulations!   
You have successfully created your bot with TBF.  
👉 Check out [examples](https://github.com/powerdot/Telegram-Bot-Framework/tree/master/examples) here is code and demos!

## TBF API



## Components

Pages and plugins are components.  

### Component object
Component is a function that returns object with:
```ts
{
    id?: string;
    actions: {
        "main"(){ ... },
        ...(){ ... }
    },
    call?: () => {}
    onCallbackQuery?: () => {}
    onMessage?: () => {}
    open?: () => {}
}
```
The `?` mark after key name means that key is optional.  
If you don't want to change core logic of your Page/Plugin, you can work only with `actions`.  
* `id` defines uniq ID of your component. It's automatically generated by component's file name if you don't provide it.
* `actions` is a object with actions inside. `main` action is default action for every component.
* `call()` is a function that will be triggered when user calls your bot. It's route user's message/action to `onCallbackQuery()` of `onMessage()`. You can override it in your component, but it can destruct your bot.
* `onCallbackQuery()` is a function that will be triggered when user sends callback query to your bot. You can override it in your component, but it can destruct your bot.
* `onMessage()` is a function that will be triggered when user sends message (text, sticker, location...) to your bot. You can override it in your component, but it can destruct your bot.
* `open()` is a function that can open current Component programmatically.  
  
Easiest way to create component is to use **Component** function.  
```js
let { Component } = require("telegram-bot-framework");
module.exports = Component(() => {
    return {
        actions: {
            async main() {
                // code here
            },
        }
    }
})
```

### TBF provides to component 
* `db` TBF database object
* `config` App's configuration
* `parseButtons` Function that parses TBF Buttons/Keyboard to Telegraf format.
```js
let { Component } = require("telegram-bot-framework");
module.exports = Component(({db, config, parseButtons}) => {
                             ^   ^       ^
```
You can use them inside functions declared in Component or in actions.

### Component's action methods  
Routing  
* `this.goToAction({action, data?})` sends user to action inside your component.
* `this.goToPage({page, action?, data?})` sends user to page inside your bot.
* `this.goToPlugin({page, action?, data?})` it's like `goToPage()` but it sends user to plugin.  

Messaging  
* `this.send({text, buttons?, keyboard?})` sends message to user.
* `this.update({text, buttons?, keyboard?})` updates bot's visible last message.
* `this.sendMediaGroup()` sends media group to user.
* `this.clearChat()` clears chat with user.  

Datastore  
* `this.user({user_id?})` returns user database object.
* * `.get()` returns all user data.
* * `.list()` returns users list.
* * `.setValue(key, value)` sets value under key under user.
* * `.getValue(key)` gets value under key under user.
* * `.removeValue(key)` removes value under key under user.
* * `.destroy()` destroys user and all his data.
* * `.collection` contains methods for user's collections
* * * `.find(query)` find one row in user's collection
* * * `.findAll(query)` find many rows in user's collection
* * * `.insert(value)` insert data to user's collection
* * * `.update(query, value)` update one row in user's collection
* * * `.updateMany(query, value)` update many rows in user's collection
* * * `.delete(query)` delete one row in user's collection
* * * `.deleteMany(query)` delete many rows in user's collection

### Component's action properties  
* `this.id` component's id
* `this.ctx` TBF context with Telegraf context. *There is available all Telegraf/Telegram methods and data keys.*
* `this.type` type of component: `page`/`plugin`

Also TBF provides data to action.
```js
actions: {
    async main({data}) {
                ^
```

### Action's handlers

There are 2 types of handers for `callback` and `message`.  
Callback handler can be defined in two ways.  
**1. As default**
```js
actions: {
    async main() {
        // there is callback handler
    },
}
```
**1.1. Strict described - as method of action**
```js
actions: {
    main: {
        async handler() {
            // there is callback handler
        },
    }
}
```
Message handler can be defined only strictly - as method of action  
```js
actions: {
    main: {
        async messageHandler() {
            // there is message handler
        },
    }
}
```

TBF provides to message handler:
* `text`, `photo`, `video`, `animation`, `document`, `voice`, `audio`, `poll`, `sticker`, `location`, `contact`, `venue`, `game`, `invoice`, `dice`
```js
actions: {
    main: {
        async messageHandler({text, location}) {
                              ^     ^
```

For example, if you want catch only text message from user:
```js
actions: {
    main: {
        async messageHandler({text}) {
            if(!text) return false;
            // do something with text...
```
Oh! What is `false` in return?!  
`return false` says to TBF to remove user's message. Without `false` in return his message stay in chat until next chat clearing.

### Combine callback and message handlers.

We can imagine a little action that asks for user's name.  
1. User triggers `/start` command that triggers `index` page that automatically triggers `main` action handler.  
*(1) So now user got a message from bot `Hey, send me your name!`*
```js
main: {
    async handler(){
        this.send({ text: "Hey, send me your name!" }); // (1)
    },
    async messageHandler({text}) {
        if(!text) return false;
        this.update({text: `Your name is ${text}`}); // 2
    },
}
```
2. When user sends message (text in our case) to bot it will handled by current page (`index`) and current action (`main`) by `messageHandler`.
3. We are updating (2) last bot's message (1) with handled text. User message will be automatically removed by TBF

## Express module
TBF wraps Express and runs it on own.  
But TBF requires files in `/webserver/` directory with your logic and also shares `bot`, `db`, `database`, `conponents` with your executive files.

* `bot` - is Telegraf `bot` object
* `db` - MongoDB instance
* `database` - TBF MongoDB database collections
* `components` - list of loaded pages and plugins

There is couple examples of your webserver in TS:
```js
// webserver/index.ts

import type { WebServerArgs } from "telegram-bot-framework/types";
module.exports = ({ bot, db, database, components }: WebServerArgs) => {
  let express = require("express");
  let router = express.Router();
  let path = require("path");

  router.use('/api', require('./api')({ bot, db, database, components } as WebServerArgs));

  return router;
}
```
As you can see:
1. You are creating not `app` but `router`, because TBF creates own `app`,
2. You can pass `WebServerArgs` to your api module and etc.  
Here is example of `./api/index.ts`
```js
// webserver/api/index.ts

import type { WebServerArgs } from "telegram-bot-framework/types";

module.exports = ({ bot, database }: WebServerArgs) => {
    let express = require("express");
    let router = express.Router();

    router.get("/posts", async (req, res) => {
        // some code here
        // for example do something with database or bot
    });

    return router;
}
```
You need always wrap your express routers to function to provide data from parent modules and TBF.  
*Maybe later this concept will be changed...*

## Templates

Here is templates to start your project as quick as possible.  
🕺 [Template with only Bot](https://github.com/powerdot/TBF-b-template)  
💃 [Template with Bot + Webserver](https://github.com/powerdot/TBF-bw-template)  

With them you can easily to touch TBF and write own bot.  

<hr/>

Powered by  [@powerdot](https://github.com/powerdot)
