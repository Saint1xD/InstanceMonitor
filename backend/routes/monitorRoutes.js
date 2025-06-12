const express = require('express');
const router = express.Router();
const monitorController = require('../controllers/monitorController');

router.get('/', monitorController.getInstanceStatuses);

module.exports = router;
