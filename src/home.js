const root = document.querySelector(".window-shell");
const shrinkWindow = document.querySelector("#shrink-window");
const themeIconToggle = document.querySelector("#theme-icon-toggle");
const minimizeNative = document.querySelector("#minimize-native");
const closeWindow = document.querySelector("#close-window");
const compactCloseWindow = document.querySelector("#compact-close-window");
const restoreWindow = document.querySelector("#restore-window");
const backFolderButton = document.querySelector("#back-folder");
const newFolderButton = document.querySelector("#new-folder");
const createFolderButton = document.querySelector("#create-folder");
const folderNameInput = document.querySelector("#folder-name-input");
const folderGrid = document.querySelector("#folder-grid");
const breadcrumbs = document.querySelector("#breadcrumbs");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyCopy = document.querySelector("#empty-copy");
const classModalBackdrop = document.querySelector("#class-modal-backdrop");
const classModalKicker = document.querySelector("#class-modal-kicker");
const classModalTitle = document.querySelector("#class-modal-title");
const closeClassModal = document.querySelector("#close-class-modal");
const cancelClassModal = document.querySelector("#cancel-class-modal");
const saveClassModal = document.querySelector("#save-class-modal");
const classFields = document.querySelector("#class-fields");
const sessionFields = document.querySelector("#session-fields");
const classCourseInput = document.querySelector("#class-course-input");
const classTeacherInput = document.querySelector("#class-teacher-input");
const classDescriptionInput = document.querySelector("#class-description-input");
const classTeacherNotesInput = document.querySelector("#class-teacher-notes-input");
const classAdditionalNotesInput = document.querySelector("#class-additional-notes-input");
const sessionNameInput = document.querySelector("#session-name-input");
const sessionNotesInput = document.querySelector("#session-notes-input");
const resizeHandle = document.querySelector("#resize-handle");

let currentTone = "light";
let folders = [];
let currentPath = [];
let currentModalMode = "class";

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeFolders(source) {
  return source
    .filter((item) => item.type === "class")
    .map((item) => ({
      ...item,
      children: [],
    }));
}

function getFolderAtPath(path) {
  let current = { children: folders };

  for (const segment of path) {
    const next = (current.children || []).find((item) => item.id === segment);
    if (!next) {
      return null;
    }
    current = next;
  }

  return current;
}

function getCurrentChildren() {
  const current = getFolderAtPath(currentPath);
  return current ? current.children || [] : folders;
}

function isInsideClass() {
  return currentPath.length > 0;
}

function replaceChildrenAtPath(path, nextChildren, source = folders) {
  if (path.length === 0) {
    return nextChildren;
  }

  const [head, ...rest] = path;
  return source.map((item) => {
    if (item.id !== head) {
      return item;
    }

    if (rest.length === 0) {
      return {
        ...item,
        children: nextChildren
      };
    }

    return {
      ...item,
      children: replaceChildrenAtPath(rest, nextChildren, item.children || [])
    };
  });
}

async function persistFolders(nextFolders) {
  folders = await window.overlayApi.updateClassFolders(nextFolders);
  renderFolders();
}

function getSearchQuery() {
  return folderNameInput.value.trim().toLowerCase();
}

function renderBreadcrumbs() {
  const trail = [{ label: "Home", path: [] }];
  let currentChildren = folders;
  const runningPath = [];

  for (const segment of currentPath) {
    const node = currentChildren.find((item) => item.id === segment);
    if (!node) {
      break;
    }

    runningPath.push(segment);
    trail.push({
      label: node.name,
      path: [...runningPath]
    });
    currentChildren = node.children || [];
  }

  breadcrumbs.replaceChildren();

  trail.forEach((entry, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "breadcrumb-button";
    button.textContent = entry.label;
    button.addEventListener("click", () => {
      currentPath = [...entry.path];
      renderFolders();
    });
    breadcrumbs.appendChild(button);

    if (index < trail.length - 1) {
      const separator = document.createElement("span");
      separator.className = "breadcrumb-separator";
      separator.textContent = "/";
      breadcrumbs.appendChild(separator);
    }
  });
}

function renderFolders() {
  const searchQuery = getSearchQuery();
  const currentChildren = getCurrentChildren();
  const filteredChildren = isInsideClass()
    ? []
    : currentChildren;
  const visibleChildren = searchQuery
    ? filteredChildren.filter((item) => item.name.toLowerCase().includes(searchQuery))
    : filteredChildren;
  folderGrid.replaceChildren();
  renderBreadcrumbs();
  backFolderButton.disabled = currentPath.length === 0;
  emptyState.hidden = visibleChildren.length > 0;
  folderNameInput.placeholder = isInsideClass() ? "Search sessions" : "Search classes";
  createFolderButton.textContent = isInsideClass() ? "Start Session" : "Create Class";
  newFolderButton.textContent = isInsideClass() ? "Start Session" : "Create Class";
  emptyTitle.textContent = isInsideClass() ? "No saved sessions here." : "No classes here yet.";
  emptyCopy.textContent = isInsideClass()
    ? "Sessions are one-time only. Start a session when you want to jump into chat for this class."
    : "Create a class folder to start organizing courses, notes, and study context.";

  for (const folder of visibleChildren) {
    const article = document.createElement("article");
    article.className = "folder-card";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "folder-open-button";
    openButton.innerHTML = `
      <span class="folder-card-icon" aria-hidden="true">
        <svg class="icon-svg" viewBox="0 0 24 24">
          <path d="M10 4 12 6h8c1.1 0 2 .9 2 2v8.5c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h6z"></path>
        </svg>
      </span>
      <span class="folder-card-title">${folder.name}</span>
      <span class="folder-card-meta">${`${(folder.children || []).length} item${(folder.children || []).length === 1 ? "" : "s"}`}</span>
    `;
    openButton.addEventListener("click", () => {
      currentPath = [...currentPath, folder.id];
      renderFolders();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "folder-delete-button";
    deleteButton.setAttribute("aria-label", `Delete ${folder.name}`);
    deleteButton.innerHTML = `
      <svg class="icon-svg" viewBox="0 0 24 24">
        <path d="M16 9v10H8V9h8m-1.5-6H9.5l-1 1H5v2h14V4h-3.5l-1-1z"></path>
      </svg>
    `;
    deleteButton.addEventListener("click", async () => {
      const nextChildren = getCurrentChildren().filter((item) => item.id !== folder.id);
      const nextFolders = replaceChildrenAtPath(currentPath, nextChildren);
      await persistFolders(nextFolders);
    });

    article.append(openButton, deleteButton);

    folderGrid.appendChild(article);
  }
}

function openModal(mode) {
  currentModalMode = mode;
  classModalBackdrop.hidden = false;
  classFields.hidden = mode !== "class";
  sessionFields.hidden = mode !== "session";
  classModalKicker.textContent = mode === "class" ? "New class" : "Session setup";
  classModalTitle.textContent = mode === "class" ? "Create Class" : "Start Session";
  saveClassModal.textContent = mode === "class" ? "Save Class" : "Start Session";
  if (mode === "class") {
    classCourseInput.focus();
  } else {
    sessionNameInput.focus();
  }
}

function closeModal() {
  classModalBackdrop.hidden = true;
  classCourseInput.value = "";
  classTeacherInput.value = "";
  classDescriptionInput.value = "";
  classTeacherNotesInput.value = "";
  classAdditionalNotesInput.value = "";
  sessionNameInput.value = "";
  sessionNotesInput.value = "";
}

async function saveModal() {
  if (currentModalMode === "class") {
    const course = classCourseInput.value.trim();
    if (!course) {
      classCourseInput.focus();
      return;
    }

    const nextFolder = {
      id: makeId(),
      type: "class",
      name: course,
      teacherName: classTeacherInput.value.trim(),
      description: classDescriptionInput.value.trim(),
      teacherNotes: classTeacherNotesInput.value.trim(),
      additionalNotes: classAdditionalNotesInput.value.trim(),
      children: []
    };
    const nextChildren = [...getCurrentChildren(), nextFolder];
    const nextFolders = replaceChildrenAtPath(currentPath, nextChildren);
    await persistFolders(nextFolders);
    closeModal();
    return;
  }

  const sessionName = sessionNameInput.value.trim();
  if (!sessionName) {
    sessionNameInput.focus();
    return;
  }

  const classFolder = getFolderAtPath(currentPath);
  closeModal();
  await window.overlayApi.startSession({
    classId: classFolder?.id || "",
    className: classFolder?.name || "",
    teacherName: classFolder?.teacherName || "",
    description: classFolder?.description || "",
    teacherNotes: classFolder?.teacherNotes || "",
    additionalNotes: classFolder?.additionalNotes || "",
    sessionId: makeId(),
    sessionName,
    sessionNotes: sessionNotesInput.value.trim(),
  });
}

function applyThemeState({ shouldUseDarkColors }) {
  currentTone = shouldUseDarkColors ? "dark" : "light";
  root.dataset.tone = currentTone;
}

function setMode(mode) {
  root.dataset.mode = mode;
}

function attachResizeHandle(handle) {
  let startPointer = null;
  let startBounds = null;

  handle.addEventListener("pointerdown", async (event) => {
    event.preventDefault();
    startPointer = { x: event.screenX, y: event.screenY };
    startBounds = await window.overlayApi.getWindowBounds();
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener("pointermove", async (event) => {
    if (!startPointer || !startBounds) {
      return;
    }

    await window.overlayApi.resizeWindow({
      width: startBounds.width + (event.screenX - startPointer.x),
      height: startBounds.height + (event.screenY - startPointer.y),
    });
  });

  handle.addEventListener("pointerup", (event) => {
    startPointer = null;
    startBounds = null;
    handle.releasePointerCapture(event.pointerId);
  });
}

shrinkWindow.addEventListener("click", async () => {
  await window.overlayApi.minimizeToDock();
});

themeIconToggle.addEventListener("click", async () => {
  const nextSource = currentTone === "dark" ? "light" : "dark";
  const result = await window.overlayApi.setThemeSource(nextSource);
  applyThemeState(result);
});

minimizeNative.addEventListener("click", async () => {
  await window.overlayApi.minimizeNative();
});

closeWindow.addEventListener("click", async () => {
  await window.overlayApi.closeWindow();
});

compactCloseWindow.addEventListener("click", async () => {
  await window.overlayApi.closeWindow();
});

restoreWindow.addEventListener("click", async () => {
  await window.overlayApi.expandWindow();
});

backFolderButton.addEventListener("click", () => {
  currentPath = currentPath.slice(0, -1);
  renderFolders();
});

newFolderButton.addEventListener("click", () => {
  openModal(isInsideClass() ? "session" : "class");
});

createFolderButton.addEventListener("click", () => {
  openModal(isInsideClass() ? "session" : "class");
});

folderNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    folderNameInput.value = "";
    renderFolders();
  }
});

folderNameInput.addEventListener("input", renderFolders);

closeClassModal.addEventListener("click", closeModal);
cancelClassModal.addEventListener("click", closeModal);
saveClassModal.addEventListener("click", saveModal);
classModalBackdrop.addEventListener("click", (event) => {
  if (event.target === classModalBackdrop) {
    closeModal();
  }
});

window.overlayApi.onThemeChanged(applyThemeState);
window.overlayApi.onWindowMode(({ mode }) => setMode(mode));

window.addEventListener("DOMContentLoaded", async () => {
  const storedFolders = await window.overlayApi.getClassFolders();
  const normalizedFolders = normalizeFolders(storedFolders);
  const shouldPersistNormalized =
    normalizedFolders.length !== storedFolders.length ||
    storedFolders.some((item) => Array.isArray(item.children) && item.children.length > 0);

  if (shouldPersistNormalized) {
    folders = await window.overlayApi.updateClassFolders(normalizedFolders);
  } else {
    folders = normalizedFolders;
  }
  renderFolders();
  attachResizeHandle(resizeHandle);
});
