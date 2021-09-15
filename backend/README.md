## Deploying the Backend Properly on Apache
Because the frontend and the backend are on different ports and the backend does not support SSL [https] (yet..): \
it is easier to proxy the requests through Apache webserver.

To acheive this on an ubuntu server modify the VirtualHost file in /etc/apache2/sites-available/ \
and include the following right before the </VirtualHost> tag:
```
ProxyRequests on
ProxyPass / http://localhost:[backend-port]/
ProxyPassReverse / http://localhost:[backend-port]/
```

Then, restart apache:
```
sudo systemctl restart apache2
```
