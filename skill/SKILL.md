# Jarvis Kanban Skill

Manage tasks on the Jarvis Kanban board via CLI or REST API.

## Quick Start

**CLI (recommended for simple ops):**
```bash
node ~/.openclaw/skills/kanban/kanban.js view
```

**API (for full control):**
```bash
curl -s http://localhost:8888/api/tasks | jq
```

---

## CLI Commands

The CLI directly reads/writes the tasks.json file.

```bash
KANBAN=~/.openclaw/skills/kanban/kanban.js

# View all tasks (pretty print)
node $KANBAN view

# Focus mode (P1 + P2 only)
node $KANBAN focus

# List with filters
node $KANBAN list --priority P1,P2 --labels work

# Add new task
node $KANBAN add "Task title" --priority P2 --labels work,quick-win --effort small

# Sort all columns by priority
node $KANBAN sort

# Show stats
node $KANBAN stats
```

### Priority Levels
| Level | Emoji | Meaning |
|-------|-------|---------|
| P1 | 🔴 | Critical - do today |
| P2 | 🟠 | High - do this week |
| P3 | 🟡 | Medium - when possible |
| P4 | 🟢 | Low - nice to have |

### Labels
- **Context:** `work`, `marqeta`, `side-biz`, `family`, `faith`, `home`
- **Status:** `quick-win`, `blocked`, `waiting`, `recurring`

### Effort
- `small` - < 30 min
- `medium` - 30 min - 2 hours
- `large` - > 2 hours

---

## REST API

Base URL: `http://localhost:8888` (requires server running)

### Quick Reference

| Action | Command |
|--------|---------|
| Health check | `curl -s http://localhost:8888/api/health` |
| List boards | `curl -s http://localhost:8888/api/tasks \| jq '.boards[] \| {id, title}'` |
| Get all tasks | `curl -s http://localhost:8888/api/tasks` |
| Add task | `curl -X POST ... /api/tasks/{boardId}/task` |
| Move task | `curl -X POST ... /api/tasks/{boardId}/move` |
| Update task | `curl -X PATCH ... /api/tasks/{boardId}/task/{taskId}` |
| Delete task | `curl -X DELETE ... /api/tasks/{boardId}/task/{taskId}` |

Default board ID: `default`

### Common Operations

#### List all tasks (human-readable)
```bash
curl -s http://localhost:8888/api/tasks | jq '.boards[0].columns[] | {column: .title, tasks: [.tasks[].title]}'
```

#### Add a task to backlog
```bash
curl -s -X POST http://localhost:8888/api/tasks/default/task \
  -H "Content-Type: application/json" \
  -d '{
    "columnId": "backlog",
    "task": {
      "title": "Task title here",
      "description": "Optional details",
      "priority": "P2",
      "labels": ["work"]
    }
  }' | jq
```

#### Move task to in-progress
```bash
curl -s -X POST http://localhost:8888/api/tasks/default/move \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-XXXXX",
    "fromColumnId": "backlog",
    "toColumnId": "in-progress"
  }' | jq
```

#### Complete a task (move to done)
```bash
curl -s -X POST http://localhost:8888/api/tasks/default/move \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-XXXXX",
    "fromColumnId": "in-progress",
    "toColumnId": "done"
  }' | jq
```

#### Add a comment to a task
```bash
curl -s -X POST http://localhost:8888/api/tasks/default/task/task-XXXXX/comment \
  -H "Content-Type: application/json" \
  -d '{"text": "Progress update here"}' | jq
```
Note: Author defaults to "Jarvis" for API calls.

#### Find task by title
```bash
curl -s http://localhost:8888/api/tasks | jq -r '.boards[0].columns[].tasks[] | select(.title | test("search term"; "i")) | "\(.id): \(.title)"'
```

---

## Column IDs

Default columns:
- `backlog` - 📋 New tasks
- `in-progress` - 🔄 Currently working
- `waiting` - ⏳ Blocked/waiting
- `done` - ✅ Completed

---

## Workflow Patterns

### "Add this to my task list"
**CLI:** `node $KANBAN add "Task title" --priority P2`
**API:** POST to `/api/tasks/default/task` with `columnId: "backlog"`

### "What's on my plate?"
**CLI:** `node $KANBAN focus`
**API:** GET `/api/tasks` and filter for `in-progress`

### "Start working on X"
**API:** POST to `/api/tasks/default/move` from `backlog` to `in-progress`

### "Mark X as done"
**API:** POST to `/api/tasks/default/move` to `done`

---

## Data Location

Tasks stored in Google Drive:
```
~/kanban/tasks.json (configure via TASKS_PATH env var)
```

---

## Error Handling

If API server isn't running:
```bash
cd /Users/steven/clawd/jarvis-kanban && npm start &
```

Check status:
```bash
curl -s http://localhost:8888/api/health || echo "Server not running"
```

---

## Full API Reference

See `/Users/steven/clawd/jarvis-kanban/API.md` for complete endpoint documentation.
