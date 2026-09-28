# Kanban_Bot

A kanban board with file-system backend, designed for AI assistants to manage tasks.

## Architecture

```
Browser ──▶ Node Server ──▶ tasks.json (local or cloud-synced)
                ▲
                │
          AI Assistant (API calls or file writes)
```

## Quick Start

```bash
npm install
npm start
# Visit http://localhost:8888
```

## Data Location

Tasks stored locally (or synced via cloud storage):
```
~/kanban/tasks.json
```

Override with `TASKS_PATH` env var or `.env` file.

## Documentation

| Document | Description |
|----------|-------------|
| [API.md](./API.md) | Full REST API reference |
| [USAGE.md](./USAGE.md) | UI usage guide and keyboard shortcuts |
| [skill/SKILL.md](./skill/SKILL.md) | Skill instructions |

## API Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | Get all boards/tasks |
| PUT | `/api/tasks` | Replace all data |
| POST | `/api/board` | Create board |
| DELETE | `/api/board/:boardId` | Delete board |
| POST | `/api/tasks/:boardId/task` | Add task |
| PATCH | `/api/tasks/:boardId/task/:taskId` | Update task |
| DELETE | `/api/tasks/:boardId/task/:taskId` | Delete task |
| POST | `/api/tasks/:boardId/move` | Move task between columns |
| POST | `/api/tasks/:boardId/column` | Create column |
| PATCH | `/api/tasks/:boardId/column/:columnId` | Update column |
| DELETE | `/api/tasks/:boardId/column/:columnId` | Delete column |
| POST | `/api/tasks/:boardId/columns/reorder` | Reorder columns |

## For AI Assistants

### Add a task
```bash
curl -X POST http://localhost:8888/api/tasks/default/task \
  -H "Content-Type: application/json" \
  -d '{"columnId":"backlog","task":{"title":"New task","priority":"high"}}'
```

### Move to in-progress
```bash
curl -X POST http://localhost:8888/api/tasks/default/move \
  -H "Content-Type: application/json" \
  -d '{"taskId":"task-XXX","fromColumnId":"backlog","toColumnId":"in-progress"}'
```

### Complete a task
```bash
curl -X POST http://localhost:8888/api/tasks/default/move \
  -H "Content-Type: application/json" \
  -d '{"taskId":"task-XXX","fromColumnId":"in-progress","toColumnId":"done"}'
```

See [skill/SKILL.md](./skill/SKILL.md) for complete integration instructions.

## Features

- Multi-board tabs with persistence
- Drag-and-drop between columns
- Vim-style keyboard navigation
- Auto-refresh every 30 seconds
- Priority levels and tags
- Archive with auto-cleanup
- Focus mode (critical/high only)
- Dark theme
- Mobile-friendly

## Keyboard Shortcuts

### Tab Management
- `Ctrl+Tab` / `Ctrl+Shift+Tab` - Switch tabs
- `Ctrl+t` - Open board picker
- `Ctrl+w` - Close tab

### Navigation (Vim-style)
- `h/l` - Move between columns
- `j/k` - Move up/down in column
- `1-9` - Jump to column by number
- `gg/G` - First/last task

### Actions
- `o/O` - New task
- `Enter` - Edit task
- `Space` - Quick complete
- `x/dd` - Delete task
- `m` + column key - Move task

See [USAGE.md](./USAGE.md) for complete keyboard reference.
