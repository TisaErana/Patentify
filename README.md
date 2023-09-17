# PATENTIFY
# Updates by Tisa, Sept 17, 2023
# More Update blah blah 
Data Labeling by Active Learning

![image](https://drive.google.com/uc?export=view&id=1CoShKjYYYLIZikTTeZymdjyz9HW5xe6b)
![image](https://drive.google.com/uc?export=view&id=13DXDrB4bs_eIvXqCSE97RPr6KGEnLOzB)

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
    * There are a number of ways to add this: \
      the easiest way is to add it to the .env file in the backend folder
    * MongoDB does not bind to the IPv6 address (::1) by default, \
    if you get ECONNREFUSED errors, localhost might be resolving to ::1 \
    instead use:
    ```mongodb://127.0.0.1:27017/[database-name]```
* Install [Nodemon](https://www.npmjs.com/package/nodemon) 
   - ```npm install -g nodemon```
* Add missing files: \
   .env file: 
   ```
   AUTH_EMAIL=""
   AUTH_PASS=""
   DOMAIN_NAME="https://localhost:3000"
   ```
  backend/svm/data/decision_boundary-462.pkl \
  backend/svm/data/seed_antiseed_476.pkl
  
On the Terminal:
* cd /Patentify/frontend
  * ```npm install```

* cd /Patentify/backend
  * ```npm install```

Node-gyp Errors:
* make sure Python is in your PATH
* if you have Python 2, uninstall it! \
  Python 3 is required for this project to work correctly
* try setting the version of the build tools you have (only on Windows): 
  ```
  npm config set msvs_version 2019
  ```
  ```
  npm config set msvs_version 2017
  ```
* if you have not rebooted, reboot and try again

* try deleting the package-lock.json files and try again
* try installing a [global node-gyp version and telling npm to use it](https://github.com/nodejs/node-gyp/blob/master/docs/Updating-npm-bundled-node-gyp.md)
* if all else fails, switch to [yarn](https://classic.yarnpkg.com/lang/en/docs/install/): \
  ```npm install --global yarn``` \
  then do ```yarn install``` instead of ```npm install```
  
Useful Links:
* [Upgrading Node.js to latest version](https://stackoverflow.com/a/10076029)
