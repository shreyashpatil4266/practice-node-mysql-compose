const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// ================= Database Config =================
const dbConfig = {
  host: "mysql",      // service name from docker-compose
  user: "root",
  password: "pass123",
  database: "testdb"
};

let db;

// Function to connect to DB with retry
function connectWithRetry() {
  db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error("‚ùå DB connection failed. Retrying in 5s...", err.message);
      setTimeout(connectWithRetry, 5000);
    } else {
      console.log("‚úÖ Connected to MySQL!");

      // Auto-create users table if it doesn't exist
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100),
          surname VARCHAR(100)
        )
      `;
      db.query(createTableSQL, (err) => {
        if (err) {
          console.error("‚ùå Failed to create users table:", err.message);
        } else {
          console.log("‚úÖ Users table ready!");
        }
      });
    }
  });

  db.on("error", (err) => {
    console.error("‚ö†Ô∏è DB error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      connectWithRetry();
    } else {
      throw err;
    }
  });
}

connectWithRetry();

// ================= Routes =================

// Save user
app.post("/save-user", (req, res) => {
  const { name, surname } = req.body;

  if (!db) return res.status(500).send("Database not connected yet.");

  const sql = "INSERT INTO users (name, surname) VALUES (?, ?)";
  db.query(sql, [name, surname], (err, result) => {
    if (err) {
      console.error("‚ùå Insert error:", err.message);
      return res.status(500).send("Error inserting data");
    }
    res.send(`
      <h2>‚úÖ User saved successfully! ID: ${result.insertId}</h2>
      <a href="/users">View All Users</a><br>
      <a href="/">Go Back</a>
    `);
  });
});

// List all users
app.get("/users", (req, res) => {
  if (!db) return res.status(500).send("Database not connected yet.");

  const sql = "SELECT * FROM users ORDER BY id DESC";
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("‚ùå Fetch error:", err.message);
      return res.status(500).send("Error fetching users");
    }

    let table = `
      <h2>Ì±• Users List</h2>
      <table border="1" cellpadding="8" cellspacing="0">
        <tr><th>ID</th><th>Name</th><th>Surname</th></tr>
    `;
    rows.forEach((row) => {
      table += `<tr><td>${row.id}</td><td>${row.name}</td><td>${row.surname}</td></tr>`;
    });
    table += "</table><br><a href='/'>Go Back</a>";
    res.send(table);
  });
});

// Start server
app.listen(3000, () => {
  console.log("Ì∫Ä Server running on http://localhost:3000");
});

