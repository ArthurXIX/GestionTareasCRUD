// Ajusta la URL de tu API
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api/tasks'
  : '/api/tasks';
  
// Variables globales
let editingTaskId = null; // null = creando; != null = editando
let allTasks = []; // Aquí guardamos la lista completa para filtrar

// Referencias al DOM
const modalTitle = document.getElementById("modalTitle");
const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const taskState = document.getElementById("taskState");
const taskPriority = document.getElementById("taskPriority");
const taskFechaRegistro = document.getElementById("taskFechaRegistro");
const taskFechaFinEstimada = document.getElementById("taskFechaFinEstimada");

// Columnas Kanban
const todoTasksContainer = document.getElementById("todo-tasks-container");
const inprogressTasksContainer = document.getElementById("inprogress-tasks-container");
const doneTasksContainer = document.getElementById("done-tasks-container");

// Barra de búsqueda
const searchInput = document.getElementById("searchInput");

// Modal de Bootstrap
const taskModal = new bootstrap.Modal(document.getElementById("taskModal"), {
  backdrop: "static",
  keyboard: false,
});

// Al cargar la página, obtenemos tareas y configuramos drag & drop
window.addEventListener("DOMContentLoaded", () => {
  fetchTasks();
  initDragAndDrop();
  searchInput.addEventListener("input", onSearch);
});

/* ======================================
   OBTENER LISTA DE TAREAS Y RENDERIZAR
   ====================================== */
async function fetchTasks() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    allTasks = data; // Guardamos la lista en memoria
    renderTasks(allTasks);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo obtener la lista de tareas",
    });
  }
}

function renderTasks(tasks) {
  // Limpiar contenedores
  todoTasksContainer.innerHTML = "";
  inprogressTasksContainer.innerHTML = "";
  doneTasksContainer.innerHTML = "";

  // Filtramos según la búsqueda actual
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filteredTasks = tasks.filter((t) => {
    // Si no hay texto en searchTerm, se devuelven todas
    if (!searchTerm) return true;
    // De lo contrario, revisa si coincide en título o descripción
    const inTitle = t.title.toLowerCase().includes(searchTerm);
    const inDesc = (t.description || "").toLowerCase().includes(searchTerm);
    return inTitle || inDesc;
  });

  filteredTasks.forEach((task) => {
    // Crear tarjeta
    const card = createTaskCard(task);
    // Ubicar la tarjeta según su estado
    if (task.state === "En Curso") {
      inprogressTasksContainer.appendChild(card);
    } else if (task.state === "Completada") {
      doneTasksContainer.appendChild(card);
    } else {
      todoTasksContainer.appendChild(card);
    }
  });
}

/* =================================
   CREAR ELEMENTO CARD PARA TAREA
   ================================= */
function createTaskCard(task) {
  const card = document.createElement("div");
  card.classList.add("card", "task-card");

  // Color de la etiqueta de prioridad
  const priorityClass = getPriorityClass(task.priority);

  card.innerHTML = `
    <div class="card-body">
      <div class="d-flex justify-content-between">
        <h5 class="card-title mb-2">${escapeHtml(task.title)}</h5>
        <!-- Etiqueta de prioridad -->
        <span class="priority-tag ${priorityClass}">
          ${escapeHtml(task.priority || "Medium")}
        </span>
      </div>
      <p class="card-text mb-2">${escapeHtml(task.description) || ""}</p>
      ${renderDates(task.fechaRegistro, task.fechaFinEstimada)}
      <div class="d-flex justify-content-between align-items-center mt-2">
        <small class="text-muted">Estado: ${escapeHtml(task.state)}</small>
        <div>
          <button
            class="btn btn-sm btn-outline-primary me-2"
            onclick="openEditModal(${task.id}, '${escapeQuotes(task.title)}',
              '${escapeQuotes(task.description)}','${task.state}',
              '${task.priority}','${task.fechaRegistro}','${task.fechaFinEstimada}')"
          >
            <i class="bi bi-pencil-square"></i> Editar
          </button>
          <button
            class="btn btn-sm btn-outline-danger"
            onclick="deleteTask(${task.id})"
          >
            <i class="bi bi-trash"></i> Eliminar
          </button>
        </div>
      </div>
    </div>
  `;
  // Al usar SortableJS, la tarjeta se podrá arrastrar
  return card;
}

// Muestra las fechas si existen
function renderDates(fechaReg, fechaFinEst) {
  let html = "";
  if (fechaReg || fechaFinEst) {
    html += `<p class="mb-1">`;
    if (fechaReg) {
      html += `<strong>Registro:</strong> ${fechaReg}<br/>`;
    }
    if (fechaFinEst) {
      html += `<strong>Fin Est.:</strong> ${fechaFinEst}`;
    }
    html += `</p>`;
  }
  return html;
}
function openCreateModal() {
  editingTaskId = null;
  modalTitle.innerText = "Nueva Tarea";
  taskForm.reset(); // Limpiar campos
  taskState.value = "Por Hacer"; // Valor por defecto
  taskPriority.value = "Medium"; // Valor por defecto
  taskModal.show();
}
/* ==============================
   FORM: CREAR / EDITAR TAREA
   ============================== */
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = taskTitle.value.trim();
  const description = taskDescription.value.trim();
  const state = taskState.value;
  const priority = taskPriority.value;
  const fechaRegistro = taskFechaRegistro.value || null;
  const fechaFinEstimada = taskFechaFinEstimada.value || null;

  if (!title) {
    Swal.fire({
      icon: "warning",
      title: "Título obligatorio",
      text: "No puedes guardar la tarea sin título",
    });
    return;
  }

  const taskData = {
    title,
    description,
    state,
    priority,
    fechaRegistro,
    fechaFinEstimada,
  };

  try {
    let responseMessage;
    if (editingTaskId === null) {
      // CREAR
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) throw new Error("Error al crear la tarea");
      responseMessage = "Tarea creada con éxito";
    } else {
      // ACTUALIZAR
      const res = await fetch(`${API_URL}/${editingTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) throw new Error("Error al actualizar la tarea");
      responseMessage = "Tarea actualizada con éxito";
    }

    // Recargar y cerrar modal
    await fetchTasks();
    taskModal.hide();

    // Éxito
    Swal.fire({
      icon: "success",
      title: "¡Listo!",
      text: responseMessage,
      showConfirmButton: false,
      timer: 1500,
    });
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Ocurrió un error al guardar la tarea.",
    });
  }
});

/* ===============================
   ABRIR MODAL PARA EDITAR TAREA
   =============================== */
function openEditModal(id, title, description, state, priority, fechaRegistro, fechaFinEstimada) {
  editingTaskId = id;
  modalTitle.innerText = "Editar Tarea";

  taskTitle.value = title;
  taskDescription.value = description;
  taskState.value = state;
  taskPriority.value = priority || "Medium";
  taskFechaRegistro.value = fechaRegistro || "";
  taskFechaFinEstimada.value = fechaFinEstimada || "";

  taskModal.show();
}

/* ======================
   ELIMINAR TAREA
   ====================== */
async function deleteTask(id) {
  const { isConfirmed } = await Swal.fire({
    title: "¿Eliminar tarea?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!isConfirmed) return;
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar la tarea");

    await fetchTasks();
    Swal.fire({
      icon: "success",
      title: "Eliminada",
      text: "La tarea fue eliminada correctamente",
      showConfirmButton: false,
      timer: 1500,
    });
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Ocurrió un error al eliminar la tarea.",
    });
  }
}

/* ========================
   DRAG & DROP (SortableJS)
   ======================== */
function initDragAndDrop() {
  // Configuración base para cada contenedor
  const options = {
    group: "kanban", // mismo grupo => se puede arrastrar entre ellos
    animation: 150,
    onEnd: handleDragEnd, // se llama tras soltar la tarjeta
  };

  // Inicializamos Sortable en cada columna
  new Sortable(todoTasksContainer, options);
  new Sortable(inprogressTasksContainer, options);
  new Sortable(doneTasksContainer, options);
}

// Cuando el usuario suelta la tarjeta en otra columna
async function handleDragEnd(evt) {
  // El DOM <div> arrastrado
  const itemEl = evt.item;
  // La nueva columna donde se soltó
  const newColumn = evt.to.id;

  // Identificar el state en función de la columna
  let newState = "Por Hacer";
  if (newColumn === "inprogress-tasks-container") newState = "En Curso";
  if (newColumn === "done-tasks-container") newState = "Completada";

  // Extraer el ID de la tarea
  // Suele ser más fácil si en createTaskCard() guardamos data-id en itemEl
  // Para este ejemplo, buscaremos en su innerHTML la acción "openEditModal(...)" y parseamos
  // Pero es más seguro poner itemEl.dataset.id = task.id
  // => Haremos un truco: parsear la onclick.
  const editButton = itemEl.querySelector("button[onclick^='openEditModal']");
  if (!editButton) return; // por si algo salió mal
  const onclickValue = editButton.getAttribute("onclick");
  // Ej: "openEditModal(4,'Task Title','Desc','Por Hacer','High','2025-03-12','2025-03-15')"
  // El ID está después de '(' y antes de ','
  const match = onclickValue.match(/\((\d+),/);
  if (!match) return;
  const taskId = match[1];

  // Actualizar en la DB
  try {
    const res = await fetch(`${API_URL}/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: newState }),
    });
    if (!res.ok) throw new Error("No se pudo actualizar estado de la tarea");
    console.log(`Tarea ${taskId} movida a ${newState}`);
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo actualizar la tarea al arrastrar.",
    });
  }
}

/* =========================
   FILTRO / BÚSQUEDA
   ========================= */
function onSearch() {
  // Re-render con la lista guardada en allTasks
  renderTasks(allTasks);
}

/* ================================
   UTILS: ESCAPAR HTML Y PRIORIDAD
   ================================ */
function getPriorityClass(priority) {
  switch ((priority || "").toLowerCase()) {
    case "high":
      return "priority-high";
    case "medium":
      return "priority-medium";
    case "low":
      return "priority-low";
    default:
      return "priority-medium";
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeQuotes(str) {
  return str ? str.replace(/'/g, "\\'") : "";
}

const resetForm = () => {
  setNewTask({ title: "", description: "", status: "Pendiente" });
  setEditingTask(null);
};