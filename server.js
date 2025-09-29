const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { marked } = require('marked');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https://api.github.com"]
        }
    }
}));

app.use(cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

function initDatabase() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        github_username VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Projects table
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        creator_name VARCHAR(100) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        github_url VARCHAR(500),
        demo_url VARCHAR(500),
        tags VARCHAR(500),
        category VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        votes INTEGER DEFAULT 0,
        featured BOOLEAN DEFAULT FALSE
    )`);

    // Votes table
    db.run(`CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        vote_type INTEGER NOT NULL, -- 1 for upvote, -1 for downvote
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, project_id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (project_id) REFERENCES projects (id)
    )`);

    // Comments table
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (project_id) REFERENCES projects (id)
    )`);
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Routes

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Info
app.get('/api', (req, res) => {
    res.json({
        name: 'Censai Says Weblog API',
        version: '1.0.0',
        description: 'Personal blog platform for opinionated solopreneur thoughts',
        endpoints: {
            'GET /api/projects': 'Get all blog posts',
            'POST /api/projects': 'Create new blog post',
            'GET /api/projects/:id': 'Get specific blog post',
            'PUT /api/projects/:id': 'Update blog post',
            'DELETE /api/projects/:id': 'Delete blog post',
            'POST /api/projects/:id/comments': 'Add comment to blog post'
        }
    });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, github_username } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (username, email, password_hash, github_username) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, github_username || null],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Username or email already exists' });
                    }
                    return res.status(500).json({ error: 'Failed to create user' });
                }

                const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
                res.status(201).json({
                    message: 'User created successfully',
                    token,
                    user: { id: this.lastID, username, email, github_username }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    github_username: user.github_username
                }
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
    db.get('SELECT id, username, email, github_username, created_at FROM users WHERE id = ?',
        [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    });
});

// Projects routes
app.get('/api/projects', (req, res) => {
    const { category, search, sort = 'created_at', order = 'DESC', limit = 20, offset = 0 } = req.query;

    let query = `
        SELECT p.*,
               COUNT(c.id) as comment_count
        FROM projects p
        LEFT JOIN comments c ON p.id = c.project_id
    `;

    const conditions = [];
    const params = [];

    if (category && category !== 'all') {
        conditions.push('p.category = ?');
        params.push(category);
    }

    if (search) {
        conditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` GROUP BY p.id ORDER BY p.${sort} ${order} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, projects) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(projects);
    });
});

app.get('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;

    db.get(`
        SELECT p.*
        FROM projects p
        WHERE p.id = ?
    `, [projectId], (err, project) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get comments
        db.all(`
            SELECT c.*, u.username
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.project_id = ?
            ORDER BY c.created_at ASC
        `, [projectId], (err, comments) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            project.comments = comments;
            res.json(project);
        });
    });
});

app.post('/api/projects', (req, res) => {
    const { title, description, github_url, demo_url, tags, category, creator_name } = req.body;

    if (!title || !description || !creator_name) {
        return res.status(400).json({ error: 'Title, description, and creator name are required' });
    }

    db.run(`
        INSERT INTO projects (creator_name, title, description, github_url, demo_url, tags, category, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [creator_name, title, description, github_url, demo_url, tags, category], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to create project' });
        }

        res.status(201).json({
            message: 'Project created successfully',
            project_id: this.lastID
        });
    });
});

// Voting removed - simple showcase platform

app.post('/api/projects/:id/comments', authenticateToken, (req, res) => {
    const projectId = req.params.id;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Comment content is required' });
    }

    db.run(`
        INSERT INTO comments (user_id, project_id, content)
        VALUES (?, ?, ?)
    `, [req.user.id, projectId, content.trim()], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to add comment' });
        }

        res.status(201).json({
            message: 'Comment added successfully',
            comment_id: this.lastID
        });
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Censai Says Weblog running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});