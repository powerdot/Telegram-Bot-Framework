<img src="https://github.com/powerdot/Telegram-Bot-Framework/blob/master/assets/head1-crop-trans.png?raw=true" width=400/>

# TBF • Plugin • Time Selector

## About
Creates time select view.  

## Requirements

🙅‍♂️ No NPM packages required

## Usage

1. Download this module and put it to `/plugins` directory under `time_selector` folder.
2. To call this module use:
```js
this.goToPlugin({
    plugin: "time_selector",
    data: {
        callback: { 
            // Page to go after selection
            page: "booking", 

            // Action to call after selection
            action: 'time_set' 
        }
    }
});
```

## Plugin returns

Means what plugin returns after time selected:  
Returns selected time in format `HH:mm`.

```js
// booking.js

actions: {
    time_set({data}){
        /*
            data: selected_time

            for example:
            "14:00"
        */
    }
}
```



