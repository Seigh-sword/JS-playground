// Grab DOM elements
const editor = document.getElementById('editor');
const runBtn = document.getElementById('runBtn');
const preview = document.getElementById('preview');
const themeSelect = document.getElementById('themeSelect');
const projectNameInput = document.getElementById('projectName');

const fileBtn = document.getElementById('fileBtn');
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const renameBtn = document.getElementById('renameBtn');
const deleteBtn = document.getElementById('deleteBtn');
const templateList = document.getElementById('templateList');

// Undo/Redo stacks
let undoStack = [];
let redoStack = [];
let isTyping = false;

// Save current editor state for undo
function saveState() {
  undoStack.push(editor.value);
  // Clear redo stack on new input
  redoStack = [];
  // Limit stack size to prevent memory bloat
  if (undoStack.length > 100) undoStack.shift();
}

// Undo function
function undo() {
  if (undoStack.length === 0) return;
  const current = editor.value;
  const previous = undoStack.pop();
  redoStack.push(current);
  editor.value = previous;
}

// Redo function
function redo() {
  if (redoStack.length === 0) return;
  const current = editor.value;
  const next = redoStack.pop();
  undoStack.push(current);
  editor.value = next;
}

// Listen for input and save state
editor.addEventListener('input', () => {
  if (!isTyping) {
    saveState();
    isTyping = true;
    setTimeout(() => {
      isTyping = false;
    }, 500); // debounce input to save state every 500ms
  }
});

// Bind undo/redo buttons
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

// Keyboard shortcuts for undo (Ctrl+Z) and redo (Ctrl+Y or Ctrl+Shift+Z)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    undo();
  } else if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
    e.preventDefault();
    redo();
  }
});

// Set initial theme from localStorage or default
const savedTheme = localStorage.getItem('jsplayground-theme');
if(savedTheme) {
  document.body.className = savedTheme;
  themeSelect.value = savedTheme;
} else {
  document.body.className = 'dark';
}

// Theme switching
themeSelect.addEventListener('change', () => {
  const theme = themeSelect.value;
  document.body.className = theme;
  localStorage.setItem('jsplayground-theme', theme);
});

// Run the user code inside iframe with canvas and error catching
const errorDisplay = document.createElement('div');
errorDisplay.style.color = 'red';
errorDisplay.style.marginTop = '10px';
errorDisplay.style.fontFamily = 'monospace';
errorDisplay.style.whiteSpace = 'pre-wrap';
document.querySelector('main').insertBefore(errorDisplay, preview);

runBtn.addEventListener('click', () => {
  const userCode = editor.value;
  errorDisplay.textContent = ''; // clear old errors

  const iframe = document.createElement('iframe');
  iframe.width = '600';
  iframe.height = '400';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';

  // Wrap user code in try-catch, and post errors to parent window
  iframe.srcdoc = `
    <html>
      <body style="margin:0; overflow:hidden;">
        <canvas id="canvas" width="600" height="400"></canvas>
        <script>
          const canvas = document.getElementById('canvas');
          const ctx = canvas.getContext('2d');
          try {
            ${userCode}
          } catch (e) {
            ctx.fillStyle = 'red';
            ctx.font = '20px monospace';
            ctx.fillText('Error: ' + e.message, 10, 30);
            window.parent.postMessage({ type: 'code-error', message: e.message }, '*');
          }
        <\/script>
      </body>
    </html>
  `;

  preview.innerHTML = '';
  preview.appendChild(iframe);
});

// Listen for error messages from iframe and show them
window.addEventListener('message', (event) => {
  if(event.data && event.data.type === 'code-error') {
    errorDisplay.textContent = 'Error: ' + event.data.message;
  }
});

// Save project function
function saveProject() {
  const name = projectNameInput.value.trim();
  if (!name) {
    alert('Please enter a project name to save.');
    return;
  }
  const data = {
    code: editor.value,
    theme: themeSelect.value,
  };
  localStorage.setItem('jsplayground-project-' + name, JSON.stringify(data));
  alert(`Project "${name}" saved!`);
}

// Load project function
function loadProject(name) {
  const dataStr = localStorage.getItem('jsplayground-project-' + name);
  if (!dataStr) {
    alert(`Project "${name}" not found.`);
    return;
  }
  const data = JSON.parse(dataStr);
  editor.value = data.code;
  themeSelect.value = data.theme;
  document.body.className = data.theme;
  projectNameInput.value = name;
}

// Bind save button
saveBtn.addEventListener('click', saveProject);

// Export project as JSON file download
exportBtn.addEventListener('click', () => {
  const name = projectNameInput.value.trim();
  if (!name) {
    alert('Enter a project name before exporting.');
    return;
  }
  const data = {
    code: editor.value,
    theme: themeSelect.value
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.json`;
  a.click();

  URL.revokeObjectURL(url);
});

// Import project JSON file
importBtn.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.code && data.theme) {
          editor.value = data.code;
          themeSelect.value = data.theme;
          document.body.className = data.theme;
          projectNameInput.value = file.name.replace('.json', '');
          alert('Project imported successfully!');
        } else {
          alert('Invalid project file format.');
        }
      } catch {
        alert('Error reading project file.');
      }
    };

    reader.readAsText(file);
  };

  input.click();
});

// File dropdown open/close toggle
fileBtn.addEventListener('click', () => {
  const dropdown = fileBtn.nextElementSibling;
  const isVisible = dropdown.style.display === 'flex';

  // Close all dropdowns first
  document.querySelectorAll('.dropdown-content').forEach(dc => dc.style.display = 'none');

  dropdown.style.display = isVisible ? 'none' : 'flex';
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-content').forEach(dc => dc.style.display = 'none');
  }
});

// Templates
const templates = {
  blank: '// Start coding your game here\n',
  bouncer: `
// Bouncing ball example
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let x = 100, y = 100;
let dx = 2, dy = 2;
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fillStyle = 'blue';
  ctx.fill();
  x += dx;
  y += dy;
  if(x + 20 > canvas.width || x - 20 < 0) dx = -dx;
  if(y + 20 > canvas.height || y - 20 < 0) dy = -dy;
  requestAnimationFrame(loop);
}
loop();
`,
  clicker: `
// Simple clicker game
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let score = 0;
canvas.addEventListener('click', () => {
  score++;
});
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '30px Arial';
  ctx.fillText('Score: ' + score, 10, 50);
  requestAnimationFrame(draw);
}
draw();
`
};

templateList.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-template');
    if (templates[key]) {
      editor.value = templates[key];
      // Close the dropdown
      btn.parentElement.style.display = 'none';
      alert(`Template "${key}" loaded!`);
    }
  });
});

// Rename project
renameBtn.addEventListener('click', () => {
  const oldName = projectNameInput.value.trim();
  if (!oldName) {
    alert('Enter current project name to rename.');
    return;
  }
  const newName = prompt('Enter new project name:', oldName);
  if (!newName) return;
  if (localStorage.getItem('jsplayground-project-' + newName)) {
    alert('Project with that name already exists.');
    return;
  }
  const data = localStorage.getItem('jsplayground-project-' + oldName);
  if (!data) {
    alert('Original project not found.');
    return;
  }
  localStorage.setItem('jsplayground-project-' + newName, data);
  localStorage.removeItem('jsplayground-project-' + oldName);
  projectNameInput.value = newName;
  alert(`Project renamed to "${newName}"`);
});

// Delete project
deleteBtn.addEventListener('click', () => {
  const name = projectNameInput.value.trim();
  if (!name) {
    alert('Enter project name to delete.');
    return;
  }
  if (confirm(`Are you sure you want to delete project "${name}"?`)) {
    localStorage.removeItem('jsplayground-project-' + name);
    alert(`Project "${name}" deleted!`);
    editor.value = '';
    projectNameInput.value = '';
  }
});

// Autosave every 5 seconds
setInterval(() => {
  const name = projectNameInput.value.trim();
  if (name) {
    const data = {
      code: editor.value,
      theme: themeSelect.value,
    };
    localStorage.setItem('jsplayground-project-' + name, JSON.stringify(data));
    // Optionally show a subtle "Autosaved" message here
  }
}, 5000);
