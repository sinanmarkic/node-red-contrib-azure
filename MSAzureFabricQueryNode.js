const axios = require('axios');

module.exports = function (RED) {
    function AzureFabricQueryNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.azureFabricConfig = RED.nodes.getNode(config.client);

        // Ensure that the config node is present
        if (!node.azureFabricConfig) {
            node.error('No Azure Fabric Auth config node provided. Please select a valid config.');
            return;
        }

        node.on('input', async function (msg) {
            const payload = msg.payload || {};
            const url = payload.url || config.url || ''; // API URL
            const method = payload.method || config.method || 'GET'; // HTTP method
            const headers = payload.headers || config.headers ? JSON.parse(config.headers) : {}; // Headers
            const body = payload.body || config.body ? JSON.parse(config.body) : {}; // Body for POST/PUT requests

            try {
                if (!node.azureFabricConfig.accessToken) {
                    msg.statusCode = 401;
                    throw new Error('Access token not available. Please check your authentication.');
                }

                // Add the Authorization header with the access token
                headers['Authorization'] = `Bearer ${node.azureFabricConfig.accessToken}`;

                const response = await makeApiRequest(url, method, headers, body);
                msg.payload = response.data;
                msg.statusCode = response.status;
                node.send(msg);
            } catch (error) {
                handleError(error, msg, node);
            }
        });

        async function makeApiRequest(url, method, headers, body) {
            switch (method.toUpperCase()) {
                case 'GET':
                    return axios.get(url, { headers });
                case 'POST':
                    return axios.post(url, body, { headers });
                case 'PUT':
                    return axios.put(url, body, { headers });
                case 'DELETE':
                    return axios.delete(url, { headers });
                case 'PATCH':
                    return axios.patch(url, body, {headers});
                default:
                    throw new Error(`Unsupported HTTP method: ${method}`);
            }
        }

        function handleError(error, msg, node) {
            if (error.response) {
                msg.payload = {
                    error: `Error querying API: ${error.message}`,
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                };
                node.error(msg.payload.error, msg);
            } else if (error.request) {
                msg.payload = {
                    error: `Error querying API: No response received`,
                    request: error.request
                };
                node.error(msg.payload.error, msg);
            } else {
                msg.payload = { error: `Error querying API: ${error.message}` };
                node.error(msg.payload.error, msg);
            }
            msg.statusCode = 500;
            node.send(msg);
        }
    }

    RED.nodes.registerType("azure-fabric-query", AzureFabricQueryNode);
};
