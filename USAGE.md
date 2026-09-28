# Multi-Board Tabs - Usage Guide

## Quick Start

1. **Open the app**: Navigate to http://localhost:8888
2. **Default view**: You'll see one tab labeled "Kanban_Bot Board"
3. **Add more tabs**: Click "+ Add Tab" button in tab bar

## Opening Boards in Tabs

### Method 1: Board Picker
1. Click "+ Add Tab" button
2. Select a board from the list
3. Board opens in a new tab

### Method 2: Create New Board
1. Click "+ Add Tab" button
2. Scroll to "Create New Board" section
3. Enter board name
4. Click "Create"
5. New board opens in new tab

### Method 3: Keyboard Shortcut
1. Press `Ctrl+t` to open board picker
2. Select or create board
3. Press `Enter` to confirm

## Switching Between Tabs

### Mouse
- Click on any tab to switch to that board

### Keyboard
- `Ctrl+Tab` - Next tab (cycles forward)
- `Ctrl+Shift+Tab` - Previous tab (cycles backward)

## Closing Tabs

### Mouse
1. Hover over a tab
2. Click the × button that appears
3. Note: Cannot close the last remaining tab

### Keyboard
- `Ctrl+w` - Close current tab
- Note: Shows alert if trying to close last tab

## Tab State Persistence

- All open tabs are saved to browser localStorage
- Tab state persists across:
  - Page refreshes (F5)
  - Browser restarts
  - Computer restarts
- Clear with: `localStorage.removeItem('kanban-tabs')`

## Per-Board Features

Each board has independent:

### Filters
- Priority filter (All, Critical, High, Medium, Low)
- Tag filters (click tags to filter)
- Sort order (Priority, Newest, Oldest)

### Display Settings
- Focus mode (shows only Critical/High priority)
- Archive view (shows/hides archived tasks)
- Archive auto-delete days (3, 7, 14, 30, Never)

### Vim Navigation
- Selected column (h/l navigation)
- Selected task (j/k navigation)
- Navigation state resets when switching boards

## Keyboard Shortcuts Summary

### Tab Management
| Shortcut | Action |
|----------|--------|
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+t` | Open board picker |
| `Ctrl+w` | Close current tab |

### Task Navigation (Vim-style)
| Shortcut | Action |
|----------|--------|
| `h` / `l` | Move between columns |
| `j` / `k` | Move up/down in column |
| `1-9` | Jump to column by number |
| `gg` | Go to first task |
| `G` | Go to last task |

### Task Actions
| Shortcut | Action |
|----------|--------|
| `Enter` | Edit selected task |
| `o` | New task in current column |
| `O` | New task in backlog |
| `Space` | Quick complete (move to done) |
| `x` / `dd` | Delete task |
| `m` + column key | Move task (mb, mp, mw, md) |

### Other
| Shortcut | Action |
|----------|--------|
| `:` | Open command mode |
| `f` | Toggle focus mode |
| `a` | Toggle archive view |
| `r` | Refresh board |
| `?` | Show help |
| `Esc` | Close modal / cancel |

## Tips & Best Practices

1. **Organize by context**: Use separate boards for Work, Personal, Projects
2. **Keep related tabs open**: Open boards you switch between frequently
3. **Use keyboard shortcuts**: Faster than clicking
4. **Leverage per-board filters**: Set filters appropriate for each board
5. **Archive old tasks**: Keep boards clean with auto-archiving

## Troubleshooting

### Tabs not showing
- Verify server is running: `npm start`
- Check browser console for errors (F12)
- Clear localStorage: `localStorage.removeItem('kanban-tabs')`
- Refresh page (F5)

### Board picker empty
- Create a new board using "Create New Board" section
- Check server has boards: `curl http://localhost:8888/api/tasks | jq .boards`

### Tab state not persisting
- Check browser allows localStorage
- Try different browser
- Check browser isn't in private/incognito mode

### Cannot close tab
- You cannot close the last remaining tab
- Open another tab first, then close the unwanted one

## API Reference

### Create Board
```bash
curl -X POST http://localhost:8888/api/board \
  -H "Content-Type: application/json" \
  -d '{"title": "New Board Name"}'
```

Response:
```json
{
  "ok": true,
  "board": {
    "id": "board-1234567890",
    "title": "New Board Name",
    "columns": [...]
  }
}
```

### Delete Board
```bash
curl -X DELETE http://localhost:8888/api/board/board-1234567890
```

Response:
```json
{"ok": true}
```

### List All Boards
```bash
curl http://localhost:8888/api/tasks | jq '.boards[] | {id, title}'
```

## Examples

### Workflow Example 1: Work + Personal Separation
1. Default board renamed to "Work Tasks"
2. Create "Personal Tasks" board
3. Create "Side Projects" board
4. Keep Work + Personal open in tabs
5. Switch with `Ctrl+Tab`

### Workflow Example 2: Client Projects
1. Create board per client: "Client A", "Client B", "Client C"
2. Open current clients in tabs
3. Close completed client tabs with `Ctrl+w`
4. Reopen as needed from "+ Add Tab"

### Workflow Example 3: Team Collaboration
1. Shared board in Google Drive (syncs across team)
2. Each team member creates personal board for private tasks
3. Use tabs to switch between team board and personal board
4. Filters set per-board (team = all, personal = high priority only)
