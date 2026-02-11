# Comments Feature Implementation

## Overview
Enhanced the notes field to support threaded comments similar to GitHub issues or chat messages. Each task can now have multiple timestamped comments with author tracking, markdown formatting, and full edit/delete capabilities.

## Key Features

### 1. **Threaded Comments**
- Replace single "notes" field with a list of individual comments
- Each comment is a separate entry with its own metadata
- Comments appear in chronological order

### 2. **Author Tracking**
- Each comment has an author field (e.g., "User", "LLM", or custom name)
- Color-coded authors:
  - **User**: Green (#4ade80)
  - **LLM**: Purple (#a855f7)
  - **Custom**: Cyan (#00d4ff)

### 3. **Timestamps**
- Every comment shows creation timestamp
- Edited comments show "(edited {timestamp})" indicator

### 4. **Markdown Support**
- Full markdown rendering using marked.js and DOMPurify
- Supports bold, italics, links, code blocks, lists, etc.
- Safe HTML sanitization to prevent XSS attacks

### 5. **Comment Management**
- **Add**: New comments can be added at any time
- **Edit**: Click "Edit" to modify comment text (updates editedAt timestamp)
- **Delete**: Remove comments with confirmation dialog

### 6. **Visual Preview on Cards**
- Comment count badge (💬 N) appears on task cards with comments
- Latest comment preview shown below description
- Format: "Author: Comment text preview..."

## Data Structure

### Old Format (Legacy)
```json
{
  "id": "task-123",
  "title": "Task title",
  "notes": "Single text field"
}
```

### New Format
```json
{
  "id": "task-123",
  "title": "Task title",
  "comments": [
    {
      "id": "comment-1706...",
      "text": "First comment with **markdown**",
      "author": "User",
      "timestamp": "2026-01-31T...",
      "editedAt": "2026-01-31T..." // optional
    }
  ]
}
```

## Migration

### Automatic Migration
When editing a task with old `notes` field:
- The `notes` content is automatically converted to a comment
- Author is set to "User"
- Timestamp is set to task creation time
- Original notes field is preserved until next save

### No Breaking Changes
- Old tasks with `notes` field continue to work
- Migration happens transparently when tasks are edited
- LLM can still access tasks via API normally

## UI Changes

### Task Modal
**Before:**
```
[Title input]
[Priority dropdown]
[Tags]
[Description textarea]
[Notes textarea]      <-- Single field
[Cancel] [Save]
```

**After:**
```
[Title input]
[Priority dropdown]
[Tags]
[Description textarea]

Comments                <-- New section
┌─────────────────────┐
│ [Existing comments] │
│ with edit/delete    │
└─────────────────────┘
[Author input]
[New comment textarea]
[Add Comment button]

[Cancel] [Save]
```

### Task Card
**Before:**
```
Task Title [PRIORITY]
Description text
#tag1 #tag2
📝 (if has notes)
```

**After:**
```
Task Title [PRIORITY]
Description text
#tag1 #tag2
💬 3 (comment count)
User: Latest comment preview...
```

## CSS Classes Added

### Comment Display
- `.comments-section` - Container for entire comments area
- `.comments-list` - Scrollable list of comments
- `.comment` - Individual comment card
- `.comment-header` - Author and timestamp row
- `.comment-author` - Author name (with color variants)
- `.comment-timestamp` - Date/time display
- `.comment-edited` - Edited indicator
- `.comment-body` - Markdown-rendered comment text
- `.comment-actions` - Edit/delete buttons

### Comment Input
- `.add-comment-section` - New comment input area
- `.add-comment-author` - Author name input
- `.add-comment-input` - Comment text input
- `.add-comment-btn` - Submit button

### Task Card Preview
- `.comments-icon` - Comment count badge
- `.comments-preview` - Latest comment preview box

## JavaScript Functions Added

### Core Functions
- `renderComments(comments)` - Renders all comments in the modal
- `addComment()` - Adds a new comment to current task
- `startEditingComment(commentId)` - Switches comment to edit mode
- `saveEditedComment(commentId)` - Saves edited comment
- `cancelEditingComment(commentId)` - Cancels edit mode
- `deleteComment(commentId)` - Deletes a comment with confirmation

### Modified Functions
- `openAddModal()` - Clears comments for new tasks
- `editTask()` - Loads and renders existing comments (with migration)
- `saveTask()` - Saves task with comments instead of notes
- `renderTask()` - Shows comment count/preview on card

## Usage for LLM Integration

### Adding Comments via API
```javascript
// Get current task
const task = await fetch('/api/tasks/board-id/task/task-id');

// Add a new comment
task.comments = task.comments || [];
task.comments.push({
  id: 'comment-' + Date.now(),
  text: 'LLM analysis: This task requires refactoring the auth module',
  author: 'LLM',
  timestamp: new Date().toISOString()
});

// Save back
await fetch('/api/tasks/board-id/task/task-id', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ comments: task.comments })
});
```

### Markdown Examples
```markdown
**Bold text**
*Italic text*
`code snippet`
[Link text](https://example.com)

- List item 1
- List item 2

```code block```
```

## Benefits

1. **Better History Tracking**: See conversation flow over time
2. **LLM Context**: LLM can add detailed analysis as separate comments
3. **Collaborative**: Multiple stakeholders can comment on tasks
4. **Organized**: Comments separated by timestamp and author
5. **Rich Formatting**: Markdown enables clear communication
6. **No Data Loss**: Old notes automatically migrated

## Testing Checklist

- [x] Add comment to new task
- [x] Add comment to existing task
- [x] Edit comment
- [x] Delete comment
- [x] View comment count on card
- [x] View comment preview on card
- [x] Test markdown rendering
- [x] Test author color coding
- [x] Test migration of old notes field
- [x] Verify timestamps display correctly

## Future Enhancements (Optional)

- Comment reactions/emoji
- @mentions for notifications
- Comment threading (replies to comments)
- Comment search/filter
- Rich text editor instead of markdown textarea
- File attachments to comments
- Comment history/version control
