// Grabby grab
const editor = document.getElementById("editor");
const runBtn = document.getElementById("runBtn");
const preview = document.getElementById("preview");
const themeSelect = document.getElementById("themeSelect");

// Placeholder power
editor.placeholder = "// Write your JavaScript game here";

// Run da code!
runBtn.addEventListener("click", () => {
  const userCode = editor.value;
  const iframe = document.createElement("iframe");

  iframe.width = 600;
  iframe.height = 400;
  iframe.style.border = "none";
  iframe.style.borderRadius = "12px";

  // Inject canvas + user JS inside iframe
  iframe.srcdoc = `
    <html>
      <body style="margin:0;overflow:hidden;">
        <canvas id="canvas" width="600" height="400"></canvas>
        <script>
          const canvas = document.getElementById('canvas');
          const ctx = canvas.getContext('2d');
          try {
            ${userCode}
          } catch (e) {
            ctx.fillStyle = 'red';
            ctx.font = '20px sans-serif';
            ctx.fillText('error' + e.message, 10, 30);
          }
        <\/script>
      </body>
    </html>
  `;

  // Clear old preview
  preview.innerHTML = "";
  preview.appendChild(iframe);
});

// Theme swap-o-matic
themeSelect.addEventListener("change", () => {
  document.body.className = themeSelect.value;
});
