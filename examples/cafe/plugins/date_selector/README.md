<img src="https://github.com/powerdot/Telegram-Bot-Framework/blob/master/assets/head1-crop-trans.png?raw=true" width=400/>

# TBF • Plugin • Date Selector

## About
Creates date select view.  

## Requirements

* `moment`  

Must to be installed to project.

## Usage

1. Download this module and put it to `/plugins` directory under `date_selector` folder.
2. To call this module use:
```js
this.goToPlugin({
    plugin: "date_selector",
    data: {
        callback: { 
            // Page to go after selection
            page: "booking", 

            // Action to call after selection
            action: 'date_set' 
        }
    }
});
```

## Plugin returns

Means what plugin returns after date selected:  
Returns selected date in format `YYYY-MM-DD`.

```js
// booking.js

actions: {
    date_set({data}){
        /*
            data: selected_date

            for example:
            "2022-01-01"
        */
    }
}
```



