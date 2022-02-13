## Starting the backend
The backend can be started with: 
```
npm start
```
A systemd service can be created to run the app in the long-term.

## For Development
Make sure to start both the frontend and the backend with npm or yarn.
Node will take care of the redirecting for you.

## Interacting with the Backend Properly in Production
The current best way to run the backend is as a systmectl service with nodemon. \
It will automatically restart upon any changes to the code.

Because the frontend is running on Apache and the backend is running on Node, they are on different ports. \
The backend does not support SSL [https] (yet..): but we can support SSL between the client and the server by \
proxying the requests through Apache webserver. 

To achieve this on an ubuntu server modify the VirtualHost file in /etc/apache2/sites-available/ \
and include the following right before the </VirtualHost> tag:
```
ProxyRequests on
ProxyPass /[api-endpoint-path]/ http://localhost:[backend-port]/[api-endpoint-path]
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
