// src/database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Ruta absoluta al archivo SQLite
const dbName = path.join(__dirname, "database.sqlite");

// Crear/abrir la base de datos
const db = new sqlite3.Database(dbName, (err) => {
  if (err) {
    console.error("Error al abrir la base de datos:", err);
  } else {
    console.log("Conectado a la base de datos SQLite.");
  }
});

// Crear tabla 'tasks' si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    state TEXT NOT NULL,
    fechaRegistro TEXT,
    fechaFinEstimada TEXT,
    priority TEXT
  )
`);

module.exports = db;
