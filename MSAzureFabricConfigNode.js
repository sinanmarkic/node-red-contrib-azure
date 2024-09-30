module.exports = function(RED) {
    const msal = require("@azure/msal-node");
    const MSALCachePlugin = require('./msalCachePlugin');
    const path = require('path');

    function AzureFabricAuthNode(config) {
        RED.nodes.createNode(this, config);

        // Store configuration variables
        this.authUrl = config.authUrl;
        this.tokenUrl = config.tokenUrl;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.scope = config.scope;
        this.accessToken = null;

        // Define cache file location
        const cacheFilePath = path.join(RED.settings.userDir, 'azureauthcache.json');

        // Initialize MSAL Cache Plugin
        const cachePlugin = new MSALCachePlugin(cacheFilePath);

        // Initialize MSAL client
        this.client = new msal.ConfidentialClientApplication({
            auth: {
                clientId: this.clientId,
                authority: this.authUrl,
                clientSecret: this.clientSecret
            },
            cache: {
                cachePlugin
            }
        });

        // Get the access token
        this.client.acquireTokenByClientCredential({
            scopes: [this.scope],
            authority: this.authUrl
        }).then(tokenResponse => {
            if (tokenResponse) {
                this.accessToken = tokenResponse.accessToken;
                this.log('Access token retrieved.');
            } else {
                this.log('Failed to retrieve access token.');
            }
        }).catch(error => {
            this.error('Error retrieving token: ' + error.message);
        });
    }

    // Register the node type in Node-RED
    RED.nodes.registerType("azure-fabric-auth", AzureFabricAuthNode);
}
