// api/tasks.js
const express = require('express');
const router = express.Router();
const cors = require('cors');

// Configura CORS
router.use(cors());
router.use(express.json());

// Base de datos temporal (para ejemplo)
let tasks = [
  { id: 1, title: "Tarea de ejemplo", state: "Por Hacer" }
];

// GET todas las tareas
router.get('/', (req, res) => {
  res.json(tasks);
});

// POST nueva tarea
router.post('/', (req, res) => {
  const newTask = {
    id: tasks.length + 1,
    ...req.body
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT actualizar tarea
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) return res.status(404).send('Tarea no encontrada');
  
  tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
  res.json(tasks[taskIndex]);
});

// DELETE tarea
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  tasks = tasks.filter(t => t.id !== id);
  res.status(204).send();
});

module.exports = router;