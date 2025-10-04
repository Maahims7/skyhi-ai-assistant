const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json([]); // Empty tasks for now
});

module.exports = router;