A Markdown ➡ HTML live-server + builder.

Takes all .md files inside of the `public` folder and converts them into HTML pages recursively.

Index files are created for folders, containing all the links to the descendants of that folder.
## Preview
![Preview Image](https://raw.githubusercontent.com/sharkota/markitty/refs/heads/main/public/.mk/preview.png)
## Install
```bash
npm i
```
## Live Server
```bash
npm run start
```
Starts a live server at `http://localhost:3000` (default)
## Build
```bash
npm run build
```
Builds the project into the `build` folder.
## Configuration
Live-Server settings found in config.json.

The `public/.mk` folder contains the page template, styles, and script files. These can be modified to change the look and feel of the site.