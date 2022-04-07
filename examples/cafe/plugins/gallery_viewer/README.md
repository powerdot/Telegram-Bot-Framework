<img src="https://github.com/powerdot/Telegram-Bot-Framework/blob/master/assets/head1-crop-trans.png?raw=true" width=400/>

# TBF • Plugin • Gallery Viewer

## About
Creates viewer for array of photos.  

## Requirements

🙅‍♂️ No NPM packages required

## Usage

1. Download this module and put it to `/plugins` directory under `gallery_viewer` folder.
2. Edit `gallery_viewer/photos` array with your photos.
3. To call this module use:
```js
this.goToPlugin({
    plugin: "list",
    data: {
        // Category to show
        place: `bar`, 

        // Exit (back) button route
        callback: {
            page: "gallery",
            action: "backFromPlugin"
        },

        params: { 
            // Exit (back) button text
            backButton: '◀️ Back to Categories' 
        },
    }
})
```

## Plugin returns

Plugin has no returns.




