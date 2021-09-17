## Interacting with the Backend Properly
Because the frontend and the backend are on different ports and the backend does not support SSL [https] (yet..): \
it is easier to proxy the requests through Apache webserver.

To acheive this on an ubuntu server modify the VirtualHost file in /etc/apache2/sites-available/ \
and include the following right before the </VirtualHost> tag:
```
ProxyRequests on
ProxyPass /[api-endpoint-path]/ http://localhost:[backend-port]/[api-endpoin-path]
ProxyPassReverse /[api-endpoint-path]/ http://localhost:[backend-port]/[api-endpoint-path]
```
For example:
```
ProxyRequests on
ProxyPass /users/ http://localhost:4150/users/
ProxyPassReverse /users/ http://localhost:4150/users/
```
You must ProxyPass and ProxyPassReverse for every endpoint in the backend.

Then, restart apache:
```
sudo systemctl restart apache2
```
## Deploying the app with pm2
```
cd into the backend app directory
pm2 start app.js --watch
```
The --watch will monitor for file changes and automatically restart the server.

You can view the status of all apps running with:
```
pm2 list
```

You can view the details of the app with:
```
pm2 show [app-name]
```
