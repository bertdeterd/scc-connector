# SCC-CONNECTOR

A package to be used as express middleware to make a connection to the connectivity service of the Cloud Foundry SAP Cloud Platform (SCP) with the on-premise SAP backend system. <br>
Axios is used as an easy-to-use http client which can be used in other routes with: **req.axios**

## Documentation

```
$ npm install --save scc-connector
```

## Usage

Before your own api routes insert the middleware **route.use(sccConnector.setup)**
This ensures that:
- an oauth request is made to the connectivity service
- an access token is being returned
- global defaults are being set for axios

There are two ways how the virtual host can be known in following order:
- In your app you set the env variable  **SAP_SCC_VIRTUAL_HOSTS: '["<your-scc-virtual-host:port>"]'**
  in the manifest.yml file. <br>Only the first virtual host will be recognized
- If there is no env var supplied, the package will check if a user-provided service instance is binded to your app with the credentails:
  **sap_scc_virtual_host** and **sap_scc_virtual_port**.<br>
  This approach is the recommended way because when a virtual host name changes, you only have to change the user-provided service and all binded apps will have the new virtual host and port settings.



### Example

For testing this scenario go to SICF:
- make sure the sap/bc/ping service is activated
- in Logon Data add a service user and password if principal propagation is not set up


```
const sccConnector = require('scc-connector');

router.use(sccConnector);

router.get("/ping", function(req, res) {
    req.axios.get( '/sap/bc/ping' )
      .then(response => {
         console.log(response);
         res.send(response.data);
        })
      .catch(error => {
         console.log(error);
      });  
});

```

