const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const methodOverride = require('method-override');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const https = require('https');
const http = require('http');

// Configure dotenv with explicit path
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
} else {
    console.warn(`.env file not found at ${envPath}`);
    require('dotenv').config();
}

const Post = require('./models/post.js');
const User = require('./models/user.js');

const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://KhushiKC:Khushi%40123@pathly-posts.adep9ts.mongodb.net/?appName=pathly-posts';
const PUBLIC_URL = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || 'https://pathlylab-posts.onrender.com';

console.log('Environment check:', {
    MONGO_URL: MONGO_URL ? '✓ Loaded' : '✗ Missing',
    PUBLIC_URL: PUBLIC_URL ? '✓ Loaded' : '✗ Missing'
});

async function main() {
    await mongoose.connect(MONGO_URL);
}

main().then(() => {
    console.log('Connected to MongoDB');
}).catch(err => console.log(err));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: 'pathlylab-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Expose current user to templates
app.use((req, res, next) => {
    if (req.session.userId) {
        res.locals.currentUser = {
            username: req.session.username,
            email: req.session.email,
            id: req.session.userId.toString()
        };
        res.locals.userId = req.session.userId.toString();
    } else {
        res.locals.currentUser = null;
        res.locals.userId = null;
    }
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Auth guard
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    return res.redirect('/login');
};

// Home route
app.get('/', (req, res) => {
    res.render('home.ejs', { currentUser: res.locals.currentUser });
});

// Register routes
app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const trimmedUsername = username.trim();
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({ $or: [{ username: trimmedUsername }, { email: normalizedEmail }] });
        if (existingUser) {
            return res.render('register.ejs', { error: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username: trimmedUsername,
            email: normalizedEmail,
            password: hashedPassword
        });

        await user.save();

        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.email = user.email;

        res.redirect('/posts');
    } catch (err) {
        console.log(err);
        res.render('register.ejs', { error: 'Registration failed. Please try again.' });
    }
});

// Login routes
app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const trimmedUsername = username.trim();

        const user = await User.findOne({ username: trimmedUsername });
        if (!user) {
            return res.render('login.ejs', { error: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login.ejs', { error: 'Invalid username or password' });
        }

        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.email = user.email;

        res.redirect('/posts');
    } catch (err) {
        console.log(err);
        res.render('login.ejs', { error: 'Login failed. Please try again.' });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
    });
});

// Posts index
app.get('/posts', isAuthenticated, async (req, res) => {
    try {
        const rawPosts = await Post.find({}).sort({ createdAt: -1 }).lean();
        const posts = rawPosts.map((p) => {
            const createdSource = p.createdAt || (p._id && p._id.getTimestamp ? p._id.getTimestamp() : null);
            return { ...p, id: p._id.toString(), createdAt: createdSource };
        });

        res.render('index.ejs', { posts, currentUser: res.locals.currentUser, userId: res.locals.userId });
    } catch (err) {
        console.log(err);
        res.status(500).send('Unable to fetch posts right now.');
    }
});

// New post form
app.get('/posts/new', isAuthenticated, (req, res) => {
    res.render('new.ejs', { currentUser: res.locals.currentUser });
});

// Create post
app.post('/posts', isAuthenticated, async (req, res) => {
    try {
        const content = req.body.content ? req.body.content.trim() : '';
        if (!content) {
            return res.status(400).send('Content cannot be empty.');
        }

        const post = new Post({
            username: req.session.username,
            content,
            userId: req.session.userId
        });

        await post.save();
        res.redirect('/posts');
    } catch (err) {
        console.log(err);
        res.status(500).send('Unable to create post right now.');
    }
});

// Show post
app.get('/posts/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id).lean();
        if (!post) {
            return res.status(404).send('Post not found.');
        }

        const createdSource = post.createdAt || (post._id && post._id.getTimestamp ? post._id.getTimestamp() : null);
        const isOwner = post.userId && req.session.userId && post.userId.toString() === req.session.userId.toString();
        res.render('show.ejs', { post: { ...post, id: post._id.toString(), createdAt: createdSource }, currentUser: res.locals.currentUser, isOwner });
    } catch (err) {
        console.log(err);
        res.status(500).send('Unable to load that post right now.');
    }
});

// Update post
app.patch('/posts/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).send('Post not found.');
        }

        if (!post.userId || post.userId.toString() !== req.session.userId.toString()) {
            return res.status(403).send('You can only edit your own posts');
        }

        const newContent = req.body.content ? req.body.content.trim() : '';
        if (!newContent) {
            return res.status(400).send('Updated content cannot be empty.');
        }

        await Post.findByIdAndUpdate(id, { content: newContent }, { new: true });
        res.redirect('/posts');
    } catch (err) {
        console.log(err);
        res.status(500).send('Unable to update that post right now.');
    }
});

// Edit form
app.get('/posts/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).send('Post not found.');
        }

        if (!post.userId || post.userId.toString() !== req.session.userId.toString()) {
            return res.status(403).send('You can only edit your own posts');
        }

        res.render('edit.ejs', { post: { ...post.toObject(), id: post._id.toString(), createdAt: post.createdAt }, currentUser: res.locals.currentUser });
    } catch (err) {
        console.log(err);
        res.status(500).send('Unable to load the edit form right now.');
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Delete post
app.delete('/posts/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).send('Post not found.');
        }

        if (!post.userId || post.userId.toString() !== req.session.userId.toString()) {
            return res.status(403).send('You can only delete your own posts');
        }

        await Post.findByIdAndDelete(id);
        res.redirect('/posts');
    } catch (err) {
        console.log(err);
        res.status(500).send('Unable to delete that post right now.');
    }
});

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
    console.log(`Public URL for pinging: ${PUBLIC_URL}`);
    
    // Self-ping to keep app alive on Render - starts after 1 minute
    setTimeout(() => {
        console.log('Starting self-ping mechanism...');
        
        setInterval(() => {
            try {
                const pingUrl = `${PUBLIC_URL}/health`;
                const client = pingUrl.startsWith('https') ? https : http;
                
                const request = client.get(pingUrl, { timeout: 5000 }, (response) => {
                    console.log(`[${new Date().toISOString()}] ✓ Ping successful (Status: ${response.statusCode}) - App staying alive`);
                });
                
                request.on('error', (error) => {
                    console.error(`[${new Date().toISOString()}] ✗ Ping failed: ${error.message}`);
                });
                
                request.on('timeout', () => {
                    request.destroy();
                    console.error(`[${new Date().toISOString()}] ✗ Ping timeout`);
                });
                
            } catch (error) {
                console.error(`[${new Date().toISOString()}] ✗ Ping error: ${error.message}`);
            }
        }, 4 * 60 * 1000); // Ping every 4 minutes
    }, 60 * 1000); // Start pinging after 1 minute
});