// server.js
const express = require("express");
const cors = require("cors");
const app = express();

// Importa conexión de DB (para inicializarla, crear tablas, etc.)
require("./src/database");

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
const tasksRoutes = require("./src/routes/tasks.routes");
app.use("/tasks", tasksRoutes);

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
