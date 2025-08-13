document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("resume");
  const drop = document.getElementById("dropzone");
  const fileName = document.getElementById("fileName");

  function setName(files) {
    if (!files || !files.length) return;
    fileName.textContent = files.length > 1
      ? `${files.length} files selected`
      : files[0].name;
  }

  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("dragover");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files) {
      input.files = e.dataTransfer.files;
      setName(input.files);
    }
  });

  input.addEventListener("change", () => setName(input.files));
});


