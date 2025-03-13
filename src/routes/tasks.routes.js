// src/routes/tasks.routes.js
const express = require("express");
const router = express.Router();
const db = require("../database");

// Opcional: definimos arrays con valores permitidos
const allowedStates = ["Por Hacer", "En Curso", "Completada"];
const allowedPriorities = ["High", "Medium", "Low"];

// POST /tasks → Crear tarea
router.post("/", (req, res) => {
  const {
    title,
    description = "",
    state = "Por Hacer",
    fechaRegistro = null,
    fechaFinEstimada = null,
    priority = "Medium",
  } = req.body;

  // Validaciones mínimas
  if (!title) {
    return res.status(400).json({ message: "El título es obligatorio" });
  }
  if (!allowedStates.includes(state)) {
    return res.status(400).json({ message: "Estado inválido" });
  }
  if (!allowedPriorities.includes(priority)) {
    return res.status(400).json({ message: "Prioridad inválida" });
  }

  // Insertar en la base de datos
  const sql = `
    INSERT INTO tasks (title, description, state, fechaRegistro, fechaFinEstimada, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(
    sql,
    [title, description, state, fechaRegistro, fechaFinEstimada, priority],
    function (err) {
      if (err) {
        console.error("Error al crear tarea:", err);
        return res.status(500).json({ error: err.message });
      }
      // 'this.lastID' → ID autogenerado
      return res.status(201).json({
        id: this.lastID,
        title,
        description,
        state,
        fechaRegistro,
        fechaFinEstimada,
        priority,
      });
    }
  );
});

// GET /tasks → Listar todas las tareas
router.get("/", (req, res) => {
  const sql = "SELECT * FROM tasks";
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error al obtener tareas:", err);
      return res.status(500).json({ error: err.message });
    }
    return res.json(rows);
  });
});

// PUT /tasks/:id → Actualizar tarea
router.put("/:id", (req, res) => {
  const { id } = req.params;
  let {
    title,
    description = "",
    state,
    fechaRegistro,
    fechaFinEstimada,
    priority,
  } = req.body;

  // Primero, recuperamos la tarea actual para no pisar campos no enviados
  const findSql = "SELECT * FROM tasks WHERE id = ?";
  db.get(findSql, [id], (err, existing) => {
    if (err) {
      console.error("Error al buscar tarea:", err);
      return res.status(500).json({ error: err.message });
    }
    if (!existing) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    // Si en el body no vino "title", reutilizamos el actual
    if (title === undefined) title = existing.title;
    if (description === undefined) description = existing.description;
    if (state === undefined) state = existing.state;
    if (fechaRegistro === undefined) fechaRegistro = existing.fechaRegistro;
    if (fechaFinEstimada === undefined) fechaFinEstimada = existing.fechaFinEstimada;
    if (priority === undefined) priority = existing.priority;

    // Validaciones
    if (!title) {
      return res.status(400).json({ message: "El título es obligatorio" });
    }
    if (!allowedStates.includes(state)) {
      return res.status(400).json({ message: "Estado inválido" });
    }
    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({ message: "Prioridad inválida" });
    }

    const updateSql = `
      UPDATE tasks
      SET title = ?, description = ?, state = ?, fechaRegistro = ?, fechaFinEstimada = ?, priority = ?
      WHERE id = ?
    `;
    db.run(
      updateSql,
      [title, description, state, fechaRegistro, fechaFinEstimada, priority, id],
      function (err2) {
        if (err2) {
          console.error("Error al actualizar tarea:", err2);
          return res.status(500).json({ error: err2.message });
        }
        if (this.changes === 0) {
          // No se actualizó nada (raro en este punto, pero por si acaso)
          return res.status(404).json({ message: "Tarea no encontrada" });
        }
        return res.json({ message: "Tarea actualizada correctamente" });
      }
    );
  });
});

// DELETE /tasks/:id → Eliminar tarea
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM tasks WHERE id = ?";
  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Error al eliminar tarea:", err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }
    return res.json({ message: "Tarea eliminada correctamente" });
  });
});

module.exports = router;
