#!/usr/bin/env node
/**
 * Kanban CLI - Manage tasks with priority, labels, and filtering
 * 
 * Usage:
 *   kanban list [--priority P1,P2] [--labels work,family] [--column backlog]
 *   kanban add "Task title" --priority P2 --labels work,quick-win --effort small
 *   kanban view                    # Pretty print all columns
 *   kanban focus                   # Show only P1+P2 tasks
 *   kanban sort                    # Sort all columns by priority
 */

const fs = require('fs');
const path = require('path');

const KANBAN_PATH = path.join(
  process.env.HOME,
  'kanban/tasks.json'
);

// Priority sort order
const PRIORITY_ORDER = { P1: 1, P2: 2, P3: 3, P4: 4 };
const PRIORITY_EMOJI = { P1: '🔴', P2: '🟠', P3: '🟡', P4: '🟢' };

function loadKanban() {
  return JSON.parse(fs.readFileSync(KANBAN_PATH, 'utf-8'));
}

function saveKanban(data) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(KANBAN_PATH, JSON.stringify(data, null, 2));
}

function sortTasksByPriority(tasks) {
  return tasks.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] || 99;
    const pb = PRIORITY_ORDER[b.priority] || 99;
    if (pa !== pb) return pa - pb;
    // Secondary sort by createdAt
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

function filterTasks(tasks, { priorities, labels, column }) {
  return tasks.filter(task => {
    if (priorities && priorities.length > 0) {
      if (!priorities.includes(task.priority)) return false;
    }
    if (labels && labels.length > 0) {
      const taskLabels = task.labels || [];
      if (!labels.some(l => taskLabels.includes(l))) return false;
    }
    return true;
  });
}

function formatTask(task) {
  const emoji = PRIORITY_EMOJI[task.priority] || '⚪';
  const labels = (task.labels || []).map(l => `#${l}`).join(' ');
  const effort = task.effort ? `[${task.effort}]` : '';
  return `${emoji} ${task.priority || 'P?'} | ${task.title} ${effort} ${labels}`.trim();
}

// Commands
function cmdList(args) {
  const data = loadKanban();
  const board = data.boards[0];
  
  const priorities = args.priority ? args.priority.split(',') : null;
  const labels = args.labels ? args.labels.split(',') : null;
  const columnFilter = args.column;
  
  for (const column of board.columns) {
    if (columnFilter && column.id !== columnFilter) continue;
    
    let tasks = column.tasks;
    tasks = filterTasks(tasks, { priorities, labels });
    tasks = sortTasksByPriority(tasks);
    
    if (tasks.length === 0 && columnFilter) continue;
    
    console.log(`\n${column.title} (${tasks.length})`);
    console.log('─'.repeat(40));
    
    for (const task of tasks) {
      console.log(formatTask(task));
    }
  }
}

function cmdView() {
  cmdList({});
}

function cmdFocus() {
  console.log('🎯 FOCUS MODE - P1 & P2 tasks only\n');
  cmdList({ priority: 'P1,P2' });
}

function cmdSort() {
  const data = loadKanban();
  const board = data.boards[0];
  
  for (const column of board.columns) {
    column.tasks = sortTasksByPriority(column.tasks);
  }
  
  saveKanban(data);
  console.log('✅ All columns sorted by priority');
  cmdView();
}

function cmdAdd(args) {
  if (!args._.length) {
    console.error('Usage: kanban add "Task title" --priority P2 --labels work');
    process.exit(1);
  }
  
  const data = loadKanban();
  const board = data.boards[0];
  const backlog = board.columns.find(c => c.id === 'backlog');
  
  const maxId = Math.max(0, ...board.columns.flatMap(c => 
    c.tasks.map(t => parseInt(t.id.replace('task-', '')) || 0)
  ));
  
  const newTask = {
    id: `task-${String(maxId + 1).padStart(3, '0')}`,
    title: args._.join(' '),
    description: args.description || '',
    priority: args.priority || 'P3',
    labels: args.labels ? args.labels.split(',') : [],
    effort: args.effort || 'medium',
    createdAt: new Date().toISOString()
  };
  
  backlog.tasks.push(newTask);
  backlog.tasks = sortTasksByPriority(backlog.tasks);
  
  saveKanban(data);
  console.log(`✅ Added: ${formatTask(newTask)}`);
}

function cmdStats() {
  const data = loadKanban();
  const board = data.boards[0];
  
  const stats = { P1: 0, P2: 0, P3: 0, P4: 0, none: 0 };
  const labelCounts = {};
  let total = 0;
  let done = 0;
  
  for (const column of board.columns) {
    for (const task of column.tasks) {
      total++;
      if (column.id === 'done') done++;
      
      const p = task.priority || 'none';
      stats[p] = (stats[p] || 0) + 1;
      
      for (const label of (task.labels || [])) {
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      }
    }
  }
  
  console.log('📊 Kanban Stats\n');
  console.log(`Total: ${total} | Done: ${done} | Active: ${total - done}\n`);
  console.log('By Priority:');
  for (const [p, count] of Object.entries(stats)) {
    if (count > 0) console.log(`  ${PRIORITY_EMOJI[p] || '⚪'} ${p}: ${count}`);
  }
  console.log('\nBy Label:');
  for (const [label, count] of Object.entries(labelCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  #${label}: ${count}`);
  }
}

// Parse args
function parseArgs(argv) {
  const args = { _: [] };
  let i = 0;
  while (i < argv.length) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1] || true;
      i += 2;
    } else {
      args._.push(argv[i]);
      i++;
    }
  }
  return args;
}

// Main
const args = parseArgs(process.argv.slice(2));
const cmd = args._.shift() || 'view';

switch (cmd) {
  case 'list':
    cmdList(args);
    break;
  case 'view':
    cmdView();
    break;
  case 'focus':
    cmdFocus();
    break;
  case 'sort':
    cmdSort();
    break;
  case 'add':
    cmdAdd(args);
    break;
  case 'stats':
    cmdStats();
    break;
  default:
    console.log(`
Kanban CLI

Commands:
  view                          Show all columns
  focus                         Show only P1+P2 (high priority)
  list [options]                List with filters
    --priority P1,P2            Filter by priority
    --labels work,family        Filter by labels
    --column backlog            Filter by column
  add "title" [options]         Add new task to backlog
    --priority P2               Set priority (P1-P4)
    --labels work,quick-win     Set labels
    --effort small              Set effort (small/medium/large)
  sort                          Sort all columns by priority
  stats                         Show statistics
`);
}
