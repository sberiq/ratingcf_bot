const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Database setup
const db = new sqlite3.Database('./telegram_catalog.db');

// Initialize database tables
db.serialize(() => {
  // Channels table
  db.run(`CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    link TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tags table
  db.run(`CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending'
  )`);

  // Channel tags relationship
  db.run(`CREATE TABLE IF NOT EXISTS channel_tags (
    channel_id INTEGER,
    tag_id INTEGER,
    FOREIGN KEY (channel_id) REFERENCES channels (id),
    FOREIGN KEY (tag_id) REFERENCES tags (id),
    PRIMARY KEY (channel_id, tag_id)
  )`);

  // Reviews table
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER,
    text TEXT NOT NULL,
    nickname TEXT,
    is_anonymous BOOLEAN DEFAULT 0,
    rating INTEGER DEFAULT 5,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES channels (id)
  )`);

  // Admins table
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  // Insert default admin if not exists
  db.get("SELECT * FROM admins WHERE username = 'admin'", (err, row) => {
    if (!row) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.run("INSERT INTO admins (username, password) VALUES (?, ?)", ['admin', hashedPassword]);
    }
  });

  // Insert default tags if not exists
  const defaultTags = ['Новости', 'Технологии', 'Развлечения', 'Образование', 'Спорт', 'Музыка', 'Кино', 'Игры'];
  defaultTags.forEach(tag => {
    db.run("INSERT OR IGNORE INTO tags (name) VALUES (?)", [tag]);
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get("SELECT * FROM admins WHERE username = ?", [username], (err, admin) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: admin.username });
  });
});

// Get all channels (approved only for public)
app.get('/api/channels', (req, res) => {
  const { search, tag } = req.query;
  let query = `
    SELECT c.*, 
      GROUP_CONCAT(t.name) as tags,
      COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.channel_id = c.id AND r.status = 'approved'), 0) as avgRating,
      COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.channel_id = c.id AND r.status = 'approved'), 0) as reviewCount
    FROM channels c
    LEFT JOIN channel_tags ct ON c.id = ct.channel_id
    LEFT JOIN tags t ON ct.tag_id = t.id
    WHERE c.status = 'approved'
  `;
  const params = [];
  
  if (search) {
    // Сначала проверяем, есть ли тег с таким названием (проверяем все варианты регистра)
    const searchValue = search.trim();
    
    // Создаем все возможные варианты написания слова
    const searchVariants = [
      searchValue, // оригинальное
      searchValue.charAt(0).toUpperCase() + searchValue.slice(1).toLowerCase(), // первая заглавная
      searchValue.toUpperCase(), // все заглавные
      searchValue.toLowerCase() // все строчные
    ];
    
    // Убираем дубликаты
    const uniqueVariants = [...new Set(searchVariants)];
    
    console.log('Варианты поиска тега:', uniqueVariants);
    
    // Проверяем каждый вариант
    const checkTagVariant = (index) => {
      if (index >= uniqueVariants.length) {
        // Если ни один вариант не найден, ищем по названию и описанию
        let finalQuery = query;
        let finalParams = [...params];
        finalQuery += ` AND (LOWER(c.title) LIKE ? OR LOWER(c.description) LIKE ?)`;
        finalParams.push(`%${searchValue.toLowerCase()}%`, `%${searchValue.toLowerCase()}%`);
        finalQuery += ` GROUP BY c.id ORDER BY avgRating DESC, reviewCount DESC, c.created_at DESC`;
        
        db.all(finalQuery, finalParams, (err, channels) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.json(channels);
        });
        return;
      }
      
      const variant = uniqueVariants[index];
      db.get("SELECT id, name FROM tags WHERE name = ? AND status = 'approved'", [variant], (err, tagResult) => {
        console.log(`Поиск тега (вариант ${index + 1}):`, variant, 'Результат:', tagResult);
        
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (tagResult) {
          // Если тег найден, ищем каналы с этим тегом
          let finalQuery = query;
          let finalParams = [...params];
          finalQuery += ` AND c.id IN (SELECT channel_id FROM channel_tags WHERE tag_id = ?)`;
          finalParams.push(tagResult.id);
          finalQuery += ` GROUP BY c.id ORDER BY avgRating DESC, reviewCount DESC, c.created_at DESC`;
          
          db.all(finalQuery, finalParams, (err, channels) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            res.json(channels);
          });
        } else {
          // Проверяем следующий вариант
          checkTagVariant(index + 1);
        }
      });
    };
    
    // Начинаем проверку с первого варианта
    checkTagVariant(0);
  } else if (tag) {
    // Если передан параметр tag, ищем по тегу (без учета регистра)
    query += ` AND c.id IN (SELECT channel_id FROM channel_tags WHERE tag_id = (SELECT id FROM tags WHERE LOWER(name) = LOWER(?)))`;
    params.push(tag.toLowerCase());
    query += ` GROUP BY c.id ORDER BY avgRating DESC, reviewCount DESC, c.created_at DESC`;
    db.all(query, params, (err, channels) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(channels);
    });
  } else {
    // Если нет параметров поиска, возвращаем все каналы
    query += ` GROUP BY c.id ORDER BY avgRating DESC, reviewCount DESC, c.created_at DESC`;
    db.all(query, params, (err, channels) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(channels);
    });
  }
});

// Get channel by ID
app.get('/api/channels/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT c.*, GROUP_CONCAT(t.name) as tags
    FROM channels c
    LEFT JOIN channel_tags ct ON c.id = ct.channel_id
    LEFT JOIN tags t ON ct.tag_id = t.id
    WHERE c.id = ? AND c.status = 'approved'
    GROUP BY c.id
  `, [id], (err, channel) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.json(channel);
  });
});

// Add new channel
app.post('/api/channels', (req, res) => {
  const { title, description, link, tags } = req.body;
  
  if (!title || !link) {
    return res.status(400).json({ error: 'Title and link are required' });
  }
  
  db.run("INSERT INTO channels (title, description, link) VALUES (?, ?, ?)", 
    [title, description, link], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const channelId = this.lastID;
    
    // Add tags if provided
    if (tags && tags.length > 0) {
      const tagValues = tags.map(tagId => `(${channelId}, ${tagId})`).join(', ');
      db.run(`INSERT INTO channel_tags (channel_id, tag_id) VALUES ${tagValues}`, (err) => {
        if (err) console.error('Error adding tags:', err);
      });
    }
    
    res.json({ id: channelId, message: 'Channel added successfully' });
  });
});

// Get reviews for a channel
app.get('/api/channels/:id/reviews', (req, res) => {
  const { id } = req.params;
  
  db.all(`
    SELECT r.*, c.title as channel_title
    FROM reviews r
    JOIN channels c ON r.channel_id = c.id
    WHERE r.channel_id = ? AND r.status = 'approved'
    ORDER BY r.created_at DESC
  `, [id], (err, reviews) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(reviews);
  });
});

// Add review
app.post('/api/channels/:id/reviews', (req, res) => {
  const { id } = req.params;
  const { text, nickname, isAnonymous, rating } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Review text is required' });
  }
  
  db.run("INSERT INTO reviews (channel_id, text, nickname, is_anonymous, rating) VALUES (?, ?, ?, ?, ?)", 
    [id, text, nickname || null, isAnonymous ? 1 : 0, rating || 5], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ id: this.lastID, message: 'Review added successfully' });
  });
});

// Add new tag (user suggestion)
app.post('/api/tags/suggest', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Tag name required' });
  db.run("INSERT INTO tags (name, status) VALUES (?, 'pending')", [name], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ id: this.lastID, name, status: 'pending' });
  });
});

// Approve tag (admin)
app.post('/api/admin/tags/:id/approve', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run("UPDATE tags SET status = 'approved' WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Tag approved' });
  });
});
// Reject tag (admin)
app.post('/api/admin/tags/:id/reject', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM tags WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Tag rejected and deleted' });
  });
});

// Get tags (public, only approved)
app.get('/api/tags', (req, res) => {
  db.all("SELECT * FROM tags WHERE status = 'approved' ORDER BY name ASC", (err, tags) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(tags);
  });
});
// Get tags (admin, all)
app.get('/api/admin/tags', authenticateToken, (req, res) => {
  db.all("SELECT * FROM tags ORDER BY status DESC, name ASC", (err, tags) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(tags);
  });
});

// Admin routes
app.get('/api/admin/channels/pending', authenticateToken, (req, res) => {
  db.all(`
    SELECT c.*, GROUP_CONCAT(t.name) as tags
    FROM channels c
    LEFT JOIN channel_tags ct ON c.id = ct.channel_id
    LEFT JOIN tags t ON ct.tag_id = t.id
    WHERE c.status = 'pending'
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `, (err, channels) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(channels);
  });
});

app.get('/api/admin/reviews/pending', authenticateToken, (req, res) => {
  db.all(`
    SELECT r.*, c.title as channel_title
    FROM reviews r
    JOIN channels c ON r.channel_id = c.id
    WHERE r.status = 'pending'
    ORDER BY r.created_at DESC
  `, (err, reviews) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(reviews);
  });
});

// Approve/reject channel
app.post('/api/admin/channels/:id/approve', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run("UPDATE channels SET status = 'approved' WHERE id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Channel approved' });
  });
});

app.post('/api/admin/channels/:id/reject', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run("UPDATE channels SET status = 'rejected' WHERE id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Channel rejected' });
  });
});

// Approve/reject review
app.post('/api/admin/reviews/:id/approve', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run("UPDATE reviews SET status = 'approved' WHERE id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Review approved' });
  });
});

app.post('/api/admin/reviews/:id/reject', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run("UPDATE reviews SET status = 'rejected' WHERE id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Review rejected' });
  });
});

// Create tag (admin only)
app.post('/api/admin/tags', authenticateToken, (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Tag name is required' });
  }
  
  db.run("INSERT INTO tags (name) VALUES (?)", [name], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ error: 'Tag already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ id: this.lastID, name, message: 'Tag created successfully' });
  });
});

// Delete tag (admin only)
app.delete('/api/admin/tags/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run("DELETE FROM tags WHERE id = ?", [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.json({ message: 'Tag deleted successfully' });
  });
});

// Create admin (admin only)
app.post('/api/admin/admins', authenticateToken, (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run("INSERT INTO admins (username, password) VALUES (?, ?)", [username, hashedPassword], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ error: 'Admin already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ id: this.lastID, username, message: 'Admin created successfully' });
  });
});

// Get all admins (admin only)
app.get('/api/admin/admins', authenticateToken, (req, res) => {
  db.all("SELECT id, username FROM admins", (err, admins) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(admins);
  });
});

// Delete admin (admin only)
app.delete('/api/admin/admins/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run("DELETE FROM admins WHERE id = ?", [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json({ message: 'Admin deleted successfully' });
  });
});

// Для админов: добавить удаление отзыва
app.delete('/api/admin/reviews/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM reviews WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Review deleted' });
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin credentials: admin / admin123`);
}); 