# Jarvis Kanban API Reference

Base URL: `http://localhost:8888`

## Data Model

### Board
```json
{
  "id": "board-1234567890",
  "title": "Board Name",
  "columns": [Column, ...]
}
```

### Column
```json
{
  "id": "backlog",
  "title": "📋 Backlog",
  "color": "#optional-hex-color",
  "tasks": [Task, ...]
}
```

### Task
```json
{
  "id": "task-1234567890",
  "title": "Task title",
  "description": "Optional description",
  "priority": "critical|high|medium|low",
  "tags": ["tag1", "tag2"],
  "createdAt": "2026-01-31T12:00:00.000Z",
  "completedAt": "2026-01-31T14:00:00.000Z",
  "archived": false
}
```

Default columns (created with new boards):
- `backlog` - 📋 Backlog
- `in-progress` - 🔄 In Progress
- `waiting` - ⏳ Waiting
- `done` - ✅ Done

---

## Health Check

### GET /api/health

Check server status and configuration.

**Response:**
```json
{
  "ok": true,
  "tasksPath": "/path/to/tasks.json"
}
```

---

## Tasks (Full State)

### GET /api/tasks

Retrieve all boards, columns, and tasks.

**Response:**
```json
{
  "lastUpdated": "2026-01-31T12:00:00.000Z",
  "boards": [Board, ...]
}
```

### PUT /api/tasks

Replace entire state (use with caution).

**Request Body:** Full state object with `boards` array.

**Response:**
```json
{
  "ok": true,
  "lastUpdated": "2026-01-31T12:00:00.000Z"
}
```

---

## Boards

### POST /api/board

Create a new board.

**Request Body:**
```json
{
  "title": "New Board Name"
}
```

**Response:**
```json
{
  "ok": true,
  "board": {
    "id": "board-1234567890",
    "title": "New Board Name",
    "columns": [/* default columns */]
  }
}
```

**Errors:**
- `400` - Empty title

### DELETE /api/board/:boardId

Delete a board.

**Response:**
```json
{
  "ok": true
}
```

**Errors:**
- `400` - Cannot delete last board
- `404` - Board not found

---

## Columns

### POST /api/tasks/:boardId/column

Create a new column.

**Request Body:**
```json
{
  "title": "New Column",
  "color": "#ff6b6b",
  "afterColumnId": "backlog"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| title | Yes | Column title |
| color | No | Hex color for column header |
| afterColumnId | No | Insert after this column (else append) |

**Response:**
```json
{
  "ok": true,
  "column": {
    "id": "col-1234567890",
    "title": "New Column",
    "color": "#ff6b6b",
    "tasks": []
  }
}
```

### PATCH /api/tasks/:boardId/column/:columnId

Update column properties.

**Request Body:**
```json
{
  "title": "Updated Title",
  "color": "#4ecdc4"
}
```

**Response:**
```json
{
  "ok": true,
  "column": { /* updated column */ }
}
```

### DELETE /api/tasks/:boardId/column/:columnId

Delete a column (must be empty).

**Response:**
```json
{
  "ok": true
}
```

**Errors:**
- `400` - Cannot delete last column
- `400` - Column has tasks (must move/delete tasks first)
- `404` - Column not found

### POST /api/tasks/:boardId/columns/reorder

Reorder columns.

**Request Body:**
```json
{
  "columnIds": ["done", "in-progress", "backlog", "waiting"]
}
```

**Response:**
```json
{
  "ok": true
}
```

---

## Tasks

### POST /api/tasks/:boardId/task

Add a new task.

**Request Body:**
```json
{
  "columnId": "backlog",
  "task": {
    "title": "Task title",
    "description": "Optional description",
    "priority": "high",
    "tags": ["work", "urgent"]
  }
}
```

| Task Field | Required | Description |
|------------|----------|-------------|
| title | Yes | Task title |
| description | No | Longer description |
| priority | No | `critical`, `high`, `medium`, `low` |
| tags | No | Array of tag strings |
| id | No | Auto-generated if not provided |
| createdAt | No | Auto-set if not provided |

**Response:**
```json
{
  "ok": true,
  "task": {
    "id": "task-1234567890",
    "title": "Task title",
    "createdAt": "2026-01-31T12:00:00.000Z",
    ...
  }
}
```

### PATCH /api/tasks/:boardId/task/:taskId

Update a task.

**Request Body:** Any task fields to update.
```json
{
  "title": "Updated title",
  "priority": "critical"
}
```

**Response:**
```json
{
  "ok": true
}
```

### POST /api/tasks/:boardId/move

Move a task between columns.

**Request Body:**
```json
{
  "taskId": "task-1234567890",
  "fromColumnId": "backlog",
  "toColumnId": "in-progress",
  "toIndex": 0
}
```

| Field | Required | Description |
|-------|----------|-------------|
| taskId | Yes | Task to move |
| fromColumnId | Yes | Source column |
| toColumnId | Yes | Destination column |
| toIndex | No | Position in target column (default: end) |

**Notes:**
- Moving to `done` sets `completedAt` timestamp
- Moving out of `done` removes `completedAt`

**Response:**
```json
{
  "ok": true
}
```

### DELETE /api/tasks/:boardId/task/:taskId

Delete a task.

**Response:**
```json
{
  "ok": true
}
```

### POST /api/tasks/:boardId/task/:taskId/comment

Add a comment to a task (append-only, no overwrite risk).

**Request Body:**
```json
{
  "text": "Comment text here",
  "author": "Jarvis"
}
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| text | Yes | - | Comment text |
| author | No | `Jarvis` | Author name (defaults to Jarvis for API calls) |

**Response:**
```json
{
  "ok": true,
  "comment": {
    "id": "comment-1234567890-abc123",
    "text": "Comment text here",
    "author": "Jarvis",
    "timestamp": "2026-02-01T00:10:00.000Z"
  }
}
```

---

## Error Responses

All errors return:
```json
{
  "error": "Error message"
}
```

Status codes:
- `400` - Bad request (validation error)
- `404` - Resource not found
- `500` - Server error

---

## Common Workflows

### Add a task to backlog
```bash
curl -X POST http://localhost:8888/api/tasks/default/task \
  -H "Content-Type: application/json" \
  -d '{"columnId":"backlog","task":{"title":"New task","priority":"high"}}'
```

### Move task to in-progress
```bash
curl -X POST http://localhost:8888/api/tasks/default/move \
  -H "Content-Type: application/json" \
  -d '{"taskId":"task-123","fromColumnId":"backlog","toColumnId":"in-progress"}'
```

### Complete a task
```bash
curl -X POST http://localhost:8888/api/tasks/default/move \
  -H "Content-Type: application/json" \
  -d '{"taskId":"task-123","fromColumnId":"in-progress","toColumnId":"done"}'
```

### List all boards
```bash
curl http://localhost:8888/api/tasks | jq '.boards[] | {id, title}'
```

### Get tasks in a specific column
```bash
curl http://localhost:8888/api/tasks | jq '.boards[0].columns[] | select(.id=="backlog") | .tasks'
```
