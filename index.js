// backend/index.js
const express = require('express');
const bodyParser = require('body-parser');
const Twit = require('twit');
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// Function to create Twit instance using session cookies
const createTwitInstance = (req) => {
    return new Twit({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token: req.session.twitterCookies.accessToken,
        access_token_secret: req.session.twitterCookies.accessTokenSecret,
    });
};

// Endpoint to handle user login (store session cookies)
app.post('/login', (req, res) => {
    const { sessionCookies } = req.body;

    // Log the received session cookies
    console.log('Received session cookies:', sessionCookies);

    // Store session cookies in the user's session
    req.session.twitterCookies = sessionCookies;

    res.json({ success: true, message: 'User logged in successfully!' });
});

// Endpoint to send a DM
app.post('/sendDM', async (req, res) => {
    const { userId, message } = req.body;

    try {
        const T = createTwitInstance(req);

        await T.post('direct_messages/events/new', {
            event: {
                type: 'message_create',
                message_create: {
                    target: { recipient_id: userId },
                    message_data: { text: message },
                },
            },
        });

        res.json({ success: true, message: 'DM sent successfully!' });
    } catch (error) {
        console.error('Error sending DM:', error);
        res.status(500).json({ success: false, message: 'Error sending DM', error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
