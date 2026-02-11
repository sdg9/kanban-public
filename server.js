require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8888;

// Google Drive path for tasks
const TASKS_PATH = process.env.TASKS_PATH || 
  path.join(process.env.HOME, 'kanban/tasks.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure tasks file exists
function ensureTasksFile() {
  const dir = path.dirname(TASKS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(TASKS_PATH)) {
    const initial = {
      lastUpdated: new Date().toISOString(),
      boards: [{
        id: 'default',
        title: 'Jarvis Board',
        columns: [
          { id: 'backlog', title: '📋 Backlog', tasks: [] },
          { id: 'in-progress', title: '🔄 In Progress', tasks: [] },
          { id: 'waiting', title: '⏳ Waiting for Steven', tasks: [] },
          { id: 'done', title: '✅ Done', tasks: [] }
        ]
      }]
    };
    fs.writeFileSync(TASKS_PATH, JSON.stringify(initial, null, 2));
  }
}

// GET /api/tasks - Read all tasks
app.get('/api/tasks', (req, res) => {
  try {
    ensureTasksFile();
    const data = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks - Write all tasks (full replace)
app.put('/api/tasks', (req, res) => {
  try {
    const data = req.body;
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TASKS_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true, lastUpdated: data.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/board - Create a new board
app.post('/api/board', (req, res) => {
  try {
    ensureTasksFile();
    const data = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));

    const { title } = req.body;

    // Validate title
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Board title cannot be empty' });
    }

    // Create new board with default columns
    const newBoard = {
      id: `board-${Date.now()}`,
      title: title.trim(),
      columns: [
        { id: 'backlog', title: '📋 Backlog', tasks: [] },
        { id: 'in-progress', title: '🔄 In Progress', tasks: [] },
        { id: 'waiting', title: '⏳ Waiting', tasks: [] },
        { id: 'done', title: '✅ Done', tasks: [] }
      ]
    };

    data.boards.push(newBoard);
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TASKS_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true, board: newBoard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/board/:boardId - Delete a board
app.delete('/api/board/:boardId', (req, res) => {
  try {
    ensureTasksFile();
    const data = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));

    // Prevent deleting the last board
    if (data.boards.length <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last board' });
    }

    const boardIdx = data.boards.findIndex(b => b.id === req.params.boardId);
    if (boardIdx === -1) {
      return res.status(404).json({ error: 'Board not found' });
    }

    data.boards.splice(boardIdx, 1);
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TASKS_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:boardId/task - Add a task to a column
app.post('/api/tasks/:boardId/task', (req, res) => {
  try {
    ensureTasksFile();
    const data = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const board = data.boards.find(b => b.id === req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    
    const { columnId, task } = req.body;
    const column = board.columns.find(c => c.id === columnId);
    if (!column) return res.status(404).json({ error: 'Column not found' });
    
    task.id = task.id || `task-${Date.now()}`;
    task.createdAt = task.createdAt || new Date().toISOString();
    column.tasks.push(task);
    
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TASKS_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true, task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:boardId/column - Create a new column
app.post('/api/tasks/:boardId/column', (req, res) => {
  try {
    ensureTasksFile();
    const data = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const board = data.boards.find(b => b.id === req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const { title, color, afterColumnId } = req.body;

    // Validate title
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Column title cannot be empty' });
    }

    // Create new column
    const newColumn = {
      id: `col-${Date.now()}`,
      title: title.trim(),
      tasks: []
    };

    // Add optional color
    if (color) {
      newColumn.color = color;
    }

    // Insert column at specified position or at end
    if (afterColumnId) {
      const afterIdx = board.columns.findIndex(c => c.id === afterColumnId);
      if (afterIdx !== -1) {
        board.columns.splice(afterIdx + 1, 0, newColumn);
      } else {
        board.columns.push(newColumn);
      }
    } else {
      board.columns.push(newColumn);
    }

    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TASKS_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true, column: newColumn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:boardId/column/:columnId - Update a column
app.patch('/api/tasks/:boardId/column/:columnId', (req, res) => {
  try {
    ensureTasksFile();
    const data = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const board = data.boards.find(b => b.id === req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const column = board.columns.find(c => c.id === req.params.columnId);
    if (!column) return res.status(404).json({ error: 'Column not found' });

    const { title, color } = req.body;

    // Validate title if provided
    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Column title cannot be empty' });
      }
      column.title = title.trim();
    }

    // Update color if provided
    if (color !== undefined) {
      if (color) {
        column.color = color;
      } else {
        delete column.color;
      }
    }

    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TASKS_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true, column });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:boardId/column/:columnId - Delete a column
app.delete('/api/tasks/:boardId/column/:columnId', (req, res) => {
  try {
    ensureTasksFile();
    const data = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const board = data.boards.find(b => b.id === req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    // Prevent deleting the last column
    if (board.columns.length <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last column' });
    }

    const columnIdx = board.columns.findIndex(c => c.id === req.params.columnId);
    if (columnIdx === -1) return res.status(404).json({ error: 'Column not found' });

    const column = board.columns[columnIdx];

    // Validate column is empty
    if (column.tasks && column.tasks.length > 0) {
      return res.status(400).json({
        error: `Cannot delete column with ${column.tasks.length} task${column.tasks.length > 1 ? 's' : ''}. Please move or delete tasks first.`
      });
    }

    board.columns.splice(columnIdx, 1);

    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TASKS_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:boardId/columns/reorder - Reorder columns
app.post('/api/tasks/:boardId/columns/reorder', (req, res) => {
  try {
    ensureTasksFile();
    const data = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const board = data.boards.find(b => b.id === req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const { columnIds } = req.body;

    // Validate all columns are present
    if (!Array.isArray(columnIds) || columnIds.length !== board.columns.length) {
      return res.status(400).json({ error: 'Invalid column order' });
    }

    // Verify all column IDs exist
    const existingIds = new Set(board.columns.map(c => c.id));
    for (const id of columnIds) {
      if (!existingIds.has(id)) {
        return res.status(400).json({ error: `Column ${id} not found` });
      }
    }

    // Reorder columns
    const reorderedColumns = columnIds.map(id =>
      board.columns.find(c => c.id === id)
    );
    board.columns = reorderedColumns;

    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TASKS_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:boardId/task/:taskId - Update a task
app.patch('/api/tasks/:boardId/task/:taskId', (req, res) => {
  try {
    ensureTasksFile();
    const data = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const board = data.boards.find(b => b.id === req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    
    // If comments are being updated, ensure each has an author (default to Jarvis for API calls)
    if (req.body.comments && Array.isArray(req.body.comments)) {
      req.body.comments = req.body.comments.map(comment => ({
        ...comment,
        author: comment.author || 'Jarvis',
        id: comment.id || `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: comment.timestamp || new Date().toISOString()
      }));
    }
    
    let found = false;
    for (const col of board.columns) {
      const taskIdx = col.tasks.findIndex(t => t.id === req.params.taskId);
      if (taskIdx !== -1) {
        col.tasks[taskIdx] = { ...col.tasks[taskIdx], ...req.body };
        found = true;
        break;
      }
    }
    
    if (!found) return res.status(404).json({ error: 'Task not found' });
    
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TASKS_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:boardId/task/:taskId/comment - Add a comment (append, no overwrite)
app.post('/api/tasks/:boardId/task/:taskId/comment', (req, res) => {
  try {
    ensureTasksFile();
    const data = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const board = data.boards.find(b => b.id === req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    
    let task = null;
    for (const col of board.columns) {
      task = col.tasks.find(t => t.id === req.params.taskId);
      if (task) break;
    }
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const { text, author } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      author: author || 'Jarvis',
      timestamp: new Date().toISOString()
    };
    
    task.comments = task.comments || [];
    task.comments.push(comment);
    
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TASKS_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true, comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:boardId/move - Move task between columns
app.post('/api/tasks/:boardId/move', (req, res) => {
  try {
    ensureTasksFile();
    const data = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const board = data.boards.find(b => b.id === req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    
    const { taskId, fromColumnId, toColumnId, toIndex } = req.body;
    
    const fromCol = board.columns.find(c => c.id === fromColumnId);
    const toCol = board.columns.find(c => c.id === toColumnId);
    if (!fromCol || !toCol) return res.status(404).json({ error: 'Column not found' });
    
    const taskIdx = fromCol.tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return res.status(404).json({ error: 'Task not found' });
    
    const [task] = fromCol.tasks.splice(taskIdx, 1);
    
    // Add completion timestamp if moving to done
    if (toColumnId === 'done' && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    }
    // Remove completion if moving out of done
    if (fromColumnId === 'done' && toColumnId !== 'done') {
      delete task.completedAt;
    }
    
    toCol.tasks.splice(toIndex ?? toCol.tasks.length, 0, task);
    
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TASKS_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:boardId/task/:taskId
app.delete('/api/tasks/:boardId/task/:taskId', (req, res) => {
  try {
    ensureTasksFile();
    const data = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const board = data.boards.find(b => b.id === req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    
    for (const col of board.columns) {
      const idx = col.tasks.findIndex(t => t.id === req.params.taskId);
      if (idx !== -1) {
        col.tasks.splice(idx, 1);
        break;
      }
    }
    
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TASKS_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, tasksPath: TASKS_PATH });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 Jarvis Kanban server running on http://localhost:${PORT}`);
  console.log(`📁 Tasks file: ${TASKS_PATH}`);
  ensureTasksFile();
});
