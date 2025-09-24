const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Contact Us form route
router.post('/contact-us', async (req, res) => {
    try {
        const { name, email, phone_number, message } = req.body;

        // Create new contact
        const contact = new Contact({ name, email, phone_number, message });
        await contact.save();

        res.status(201).json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// get contact-us data ## only for admin 
router.get('/admin/contact-us', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
