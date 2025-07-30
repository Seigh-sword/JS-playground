// === Elements ===
const runBtn = document.getElementById('runBtn');
const projectNameInput = document.getElementById('projectName');
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const themeSelect = document.getElementById('themeSelect');
const preview = document.getElementById('preview');

// === Code Area Creation ===
const codeArea = document.createElement('textarea');
codeArea.id = 'codeArea';
document.querySelector('main').insertBefore(codeArea, preview);

// === History ===
let history = [];
let historyIndex = -1;

function saveHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(codeArea.value);
  historyIndex++;
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    codeArea.value = history[historyIndex];
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    codeArea.value = history[historyIndex];
  }
}

codeArea.addEventListener('input', saveHistory);

// === Run Code ===
runBtn.addEventListener('click', () => {
  try {
    const result = eval(codeArea.value);
    preview.innerText = result !== undefined ? result : 'Code executed.';
  } catch (e) {
    preview.innerText = 'Error: ' + e.message;
  }
});

// === Save Project ===
saveBtn.addEventListener('click', () => {
  const name = projectNameInput.value.trim() || 'Untitled';
  const data = {
    name,
    code: codeArea.value,
    theme: themeSelect.value
  };
  localStorage.setItem('project_' + name, JSON.stringify(data));
  alert('Project saved as: ' + name);
});

// === Export ===
exportBtn.addEventListener('click', () => {
  const data = {
    name: projectNameInput.value,
    code: codeArea.value
  };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.name || 'untitled'}.json`;
  a.click();
});

// === Import ===
importBtn.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = () => {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        projectNameInput.value = data.name || '';
        codeArea.value = data.code || '';
        saveHistory();
        alert('Imported: ' + data.name);
      } catch (e) {
        alert('Invalid file format.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
});

// === Undo/Redo ===
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

// === Theme Switch ===
themeSelect.addEventListener('change', () => {
  document.body.className = themeSelect.value;
});

// === Initial Setup ===
saveHistory();
