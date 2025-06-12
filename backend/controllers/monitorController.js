const queueService = require('../services/queueService');

async function getInstanceStatuses(req, res) {
    try {
        const results = await queueService.getAllInstanceStatuses();
        res.status(200).json(results);
    } catch (error) {
        console.error('An unexpected error occurred in the controller:', error.message);
        res.status(500).json({ message: "An internal server error occurred." });
    }
}

module.exports = {
    getInstanceStatuses
};
