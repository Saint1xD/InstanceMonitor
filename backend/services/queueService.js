const axios = require('axios');
const config = require('../config.json');

async function fetchQueuesForInstance(instanceName) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not found.");
    }

    const endpointUrl = `https://${instanceName}.alochat.com.br:443/int/getAllQueues`;

    const payload = { apiKey: apiKey };

    try {
        const response = await axios.post(endpointUrl, payload, { timeout: 30000 });
        return {
            instanceName: instanceName,
            queues: response.data || []
        };
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`Error fetching queues for instance '${instanceName}': ${errorMessage}`);
        return {
            instanceName: instanceName,
            queues: []
        };
    }
}

async function getAllInstanceStatuses() {
    const instanceNames = config.instances;
    if (!instanceNames || !Array.isArray(instanceNames)) {
        throw new Error("Instance configuration is missing or invalid.");
    }

    const promises = instanceNames.map(name => fetchQueuesForInstance(name));
    return Promise.all(promises);
}

module.exports = {
    getAllInstanceStatuses
};
