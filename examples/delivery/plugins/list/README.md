<img src="https://github.com/powerdot/Telegram-Bot-Framework/blob/master/assets/head1-crop-trans.png?raw=true" width=400/>

# TBF • Plugin • List

## About
Creates paginated list for your array of objects.

## Requirements

🙅‍♂️ No NPM packages required

## Usage

1. Download this module and put it to `/plugins` directory under `list` folder.
2. To call this module use:
```js
this.goToPlugin({
    plugin: "list",
    data: {
        // Text to show in the list
        text: `Here is the list!`, 

        // Full list of items
        list: [
            {
                text: `Item 1`,
                page: "product", // Page to go after clicking on the item
                action: "main", // Action to perform after clicking on the item
                data: 1 // Any data on click to pass to the page and action
            },
            {
                text: `Item 2`,
                page: "product", // Page to go after clicking on the item
                action: "main", // Action to perform after clicking on the item
                data: 2 // Any data on click to pass to the page and action
            }
        ],

        // * Footer buttons to show under the list
        footer_buttons: [
            [{ text: "⬅️ Back", page: 'index', action: "main" }]
        ],

        // * Page index to show
        page: 0,

        // * Page size - amount of items to show per page
        page_size: 5,
    }
})
```

`*` - Not required

## Plugin returns

Means what plugin returns with the data after item click:
```js
// product.js

actions: {
    main({data}){
        /*
            data:
            [
                current_page_index,
                passed_item_data
            ]

            for example:
            [ 0, 1 ] or [ 0, 2 ]
        */
    }
}
```




