// server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));

async function readDb() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading DB file:", error);
    if (error.code === 'ENOENT') {
      console.log("db.json not found. Creating a default one.");
      const defaultDb = {
        "users": [
          { "id": 1, "username": "admin", "password": "admin", "role": "admin" },
          { "id": 2, "username": "user", "password": "user", "role": "user" }
        ],
        "reviews": [],
        "content": {
          "movies": {
            "trending": [],
            "recommended": [],
            "upcoming": []
          },
          "books": {
            "trending": [],
            "recommended": [],
            "upcoming": []
          }
        }
      };
      await fs.writeFile(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf8');
      return defaultDb;
    }
    throw error;
  }
}

async function writeDb(db) {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// Delete a review - Admin only
app.delete('/api/reviews/:id', async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  const db = await readDb();
  const user = db.users.find(u => u.username === username);

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can delete reviews' });
  }

  const reviewIndex = db.reviews.findIndex(r => r.id === id);
  if (reviewIndex === -1) {
    return res.status(404).json({ message: 'Review not found' });
  }

  db.reviews.splice(reviewIndex, 1);
  await writeDb(db);

  res.status(200).json({ message: 'Review deleted successfully' });
});

//ban user
app.post('/api/admin/ban-user', async (req, res) => {
  const { usernameToBan, requestedBy } = req.body;
  const db = await readDb();
  const requester = db.users.find(u => u.username === requestedBy);

  if (!requester || requester.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can ban users' });
  }

  const user = db.users.find(u => u.username === usernameToBan);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.banned = true;
  await writeDb(db);
  res.status(200).json({ message: `${usernameToBan} has been banned.` });
});

//report user
app.post('/api/report-user', async (req, res) => {
  const { reportedUsername, reason } = req.body;
  if (!reportedUsername || !reason) {
    return res.status(400).json({ message: 'Missing reported user or reason' });
  }

  const db = await readDb();
  db.reportedUsers = db.reportedUsers || [];

  db.reportedUsers.push({ username: reportedUsername, reason });
  await writeDb(db);

  res.status(200).json({ message: 'User reported successfully' });
});


//reported user list
app.get('/api/admin/reported-users', async (req, res) => {
  const db = await readDb();
  res.status(200).json(db.reportedUsers || []);
});

//suspend user
app.post('/api/admin/suspend-user', async (req, res) => {
  const { usernameToSuspend, requestedBy } = req.body;
  const db = await readDb();
  const requester = db.users.find(u => u.username === requestedBy);

  if (!requester || requester.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can suspend users' });
  }

  const user = db.users.find(u => u.username === usernameToSuspend);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.suspended = true;
  await writeDb(db);
  res.status(200).json({ message: `${usernameToSuspend} has been suspended.` });
});


// User login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const db = await readDb();
  const user = db.users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  if (user.banned) {
    return res.status(403).json({ message: 'Your account has been banned.' });
  }

  if (user.suspended) {
    return res.status(403).json({ message: 'Your account has been suspended.' });
  }

  res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } });
});

// User signup
app.post('/api/signup', async (req, res) => {
  const { username, email, password, role } = req.body;
  const db = await readDb();

  if (db.users.some(u => u.username === username)) {
    return res.status(409).json({ message: 'Username already exists' });
  }

  const newUser = {
    id: db.users.length ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
    username,
    email,
    password,
    role: role || 'user' // Default to 'user' role
  };

  db.users.push(newUser);
  await writeDb(db);
  res.status(201).json({ message: 'User registered successfully', user: newUser });
});


// Get content (movies/books)
app.get('/api/content', async (req, res) => {
  try {
    const db = await readDb();
    res.status(200).json(db.content);
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ message: 'Failed to fetch content' });
  }
});

// Get reviews for a specific item
app.get('/api/reviews/:type/:itemId', async (req, res) => {
  const { type, itemId } = req.params;
  try {
    const db = await readDb();
    const itemReviews = db.reviews.filter(review => review.type === type && review.item === itemId);
    res.status(200).json(itemReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// Post a new review
app.post('/api/reviews', async (req, res) => {
  const { user, content, item, type, timestamp, rating } = req.body;

  if (!user || !content || !item || !type || !timestamp || rating === undefined) {
    return res.status(400).json({ message: 'Missing required review fields' });
  }

  const db = await readDb();
  const foundUser = db.users.find(u => u.username === user);

  if (!foundUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (foundUser.banned) {
    return res.status(403).json({ message: 'You are banned and cannot post reviews.' });
  }

  if (foundUser.suspended) {
    return res.status(403).json({ message: 'You are suspended and cannot post reviews.' });
  }

  const newReview = {
    id: db.reviews.length ? String(Math.max(...db.reviews.map(r => Number(r.id) || 0)) + 1) : "1",
    user,
    content,
    item,
    type,
    timestamp,
    rating: Number(rating)
  };

  db.reviews.push(newReview);
  await writeDb(db);
  res.status(201).json({ message: 'Review posted successfully', review: newReview });
});


// Admin add new item
app.post('/api/admin/add-item', async (req, res) => {
  const { type, category, item } = req.body;
  if (!type || !category || !item || !item.id || !item.title || !item.imageUrl) {
    return res.status(400).json({ message: 'Missing required item fields' });
  }

  try {
    const db = await readDb();
    if (!db.content[type]) {
      db.content[type] = {};
    }
    if (!db.content[type][category]) {
      db.content[type][category] = [];
    }

    // Check for duplicate item ID within the category
    if (db.content[type][category].some(existingItem => existingItem.id === item.id)) {
      return res.status(409).json({ message: `Item with ID ${item.id} already exists in ${type} ${category}.` });
    }

    db.content[type][category].push(item);
    await writeDb(db);
    res.status(201).json({ message: 'Item added successfully', item });
  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).json({ message: 'Failed to add item' });
  }
});


// Serve HTML files explicitly - good practice
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/review.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'review.html'));
});

// Catch-all for serving index.html (SPA fallback)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});