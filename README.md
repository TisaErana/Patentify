# PATENTIFY
Data Labeling by Active Learning

Get Started:
* Install [Node](https://nodejs.org/en/download/)
  * npm is automatically installed with Node
  * make sure to check the checkbox labeled 'Automatically install the necessary tools' at the end
    * a command prompt window should open, hit enter
    * give admin privilleges, a powershell window should open
    * wait for everything to finish installing
  * check by running ```npm -v``` and ```node -v``` on Terminal
* Install [MongoDB](https://docs.mongodb.com/manual/installation/)
  * import data from live database
  * add an environment variable 'MONGO_URL' with value: 
    * ```mongodb://localhost:27017/[database-name]```
    * MongoDB does not bind to the IPv6 address (::1) by default, \
    if you get ECONNREFUSED errors, localhost might be resolving to ::1 \
    instead use:
    ```mongodb://127.0.0.1:27017/[database-name]```
* Install [Nodemon](https://www.npmjs.com/package/nodemon) 
   - ```npm install -g nodemon```

On the Terminal:
* cd /Patentify/frontend
  * ```npm install```

* cd /Patentify/backend
  * ```npm install```

Node-gyp Errors:
* make sure Python is in your PATH
* try setting the version of the build tools you have (only on Windows): 
  ```
  npm config set msvs_version 2019
  ```
  ```
  npm config set msvs_version 2017
  ```
* if you have not rebooted, reboot and try again
* try installing a [global node-gyp version and telling npm to use it](https://github.com/nodejs/node-gyp/blob/master/docs/Updating-npm-bundled-node-gyp.md)
* if all else fails, switch to [yarn](https://classic.yarnpkg.com/lang/en/docs/install/): \
  ```npm install --global yarn``` \
  then do ```yarn install``` instead of ```npm install```
