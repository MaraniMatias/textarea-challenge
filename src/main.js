import "./style.css";

/** @type {HTMLTextAreaElement} */
const textarea = document.getElementById("textarea");
/** @type {HTMLPreElement} */
const textareaMirror = document.getElementById("textarea-mirror");
/** @type {HTMLInputElement} */
const colorPicker = document.getElementById("colorPicker");
/** @type {HTMLButtonElement} */
const applyColorButton = document.getElementById("applyColor");
/** @type {HTMLButtonElement} */
const clearColorsButton = document.getElementById("clearColors");
/** @type {HTMLButtonElement} */
const boldButton = document.getElementById("boldButton");
/** @type {HTMLButtonElement} */
const italicButton = document.getElementById("italicButton");
/** @type {HTMLButtonElement} */
const clearStylesButton = document.getElementById("clearStyles");
/** @type {HTMLDivElement} */
const tooltip = document.getElementById("tooltip");

// Variable to store the previous text (used to compare changes).
let previousText = textarea.value;

/**
 * Escapes special HTML characters to prevent injection.
 * @param {string} text - Text string to escape.
 * @returns {string} Escaped (safe) text string.
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Determines the difference between two strings (old vs. new) to check
 * if the change was an insertion, deletion, or replacement.
 * @param {string} oldStr - Previous text string.
 * @param {string} newStr - Current text string.
 * @returns {null | object | object[]}
 *  - `null` if no differences,
 *  - An object `{ type, index, length }` for a single operation,
 *  - Or an array with two objects (delete + insert) for a replacement.
 */
function findDiff(oldStr, newStr) {
  let start = 0;
  while (start < oldStr.length && start < newStr.length && oldStr[start] === newStr[start]) {
    start++;
  }

  let oldEnd = oldStr.length - 1;
  let newEnd = newStr.length - 1;
  while (oldEnd >= start && newEnd >= start && oldStr[oldEnd] === newStr[newEnd]) {
    oldEnd--;
    newEnd--;
  }

  if (start > oldEnd && start > newEnd) {
    // No changes
    return null;
  }

  if (oldEnd < start) {
    // Pure insertion
    return {
      type: "insert",
      index: start,
      length: newEnd - start + 1,
    };
  }

  if (newEnd < start) {
    // Pure deletion
    return {
      type: "delete",
      index: start,
      length: oldEnd - start + 1,
    };
  }

  // Replacement => delete + insert
  return [
    {
      type: "delete",
      index: start,
      length: oldEnd - start + 1,
    },
    {
      type: "insert",
      index: start,
      length: newEnd - start + 1,
    },
  ];
}

/**
 * @typedef {object} StyledRange
 * @property {number} start - Start index in the text.
 * @property {number} end - End index in the text.
 * @property {string|null} color - Applied color (e.g., "#ff0000" or null).
 * @property {boolean|null} bold - Indicates if it's bold.
 * @property {boolean|null} italic - Indicates if it's italic.
 */

/**
 * Global array of ranges with applied styles.
 * @type {StyledRange[]}
 */
let styledRanges = [];

/**
 * Merges adjacent ranges in `styledRanges` if they share the same
 * styles (color, bold, italic) and one starts exactly where the other ends.
 * This avoids fragmentation in the array.
 * @param {StyledRange[]} styledRanges - Array of ranges to merge.
 * @returns {StyledRange[]} -
 */
function mergeAdjacentRanges(styledRanges) {
  if (styledRanges.length === 0) return styledRanges;

  styledRanges.sort((a, b) => a.start - b.start);

  let merged = [];
  let prev = styledRanges[0];

  let length = styledRanges.length;
  for (let i = 1; i < length; i++) {
    const current = styledRanges[i];
    if (
      prev.color === current.color &&
      prev.bold === current.bold &&
      prev.italic === current.italic &&
      prev.end === current.start
    ) {
      // Extend the previous range
      prev.end = current.end;
    } else {
      merged.push(prev);
      prev = current;
    }
  }
  merged.push(prev);

  // Add span for missing ranges
  merged = merged.reduce((acc, range) => {
    let lastOnRange = acc.at(-1);
    if (lastOnRange && lastOnRange.end < range.start) {
      acc.push({
        start: lastOnRange.end,
        end: range.start,
        color: null,
        bold: null,
        italic: null,
      });
    }

    acc.push(range);
    return acc;
  }, []);

  styledRanges = merged;
  return merged;
}

/**
 * Aplica o combina un estilo dado ("color", "bold" o "italic") sobre la selección
 * de texto especificada. Si el texto seleccionado se superpone con uno o más
 * rangos existentes, cada rango se divide o ajusta para reflejar el nuevo estilo
 * únicamente en la parte que se superpone.
 * @param {"color"|"bold"|"italic"} styleType - Tipo de estilo a aplicar.
 * @param {string|boolean} value - Valor del estilo (ej. "#ff0000" o `true`).
 * @param {number} selectionStart - Índice de inicio de la selección.
 * @param {number} selectionEnd - Índice de fin de la selección.
 * @returns {void}
 */
function applyStyle(styleType, value, selectionStart, selectionEnd) {
  if (selectionStart === selectionEnd) return;

  let newRanges = [];
  let anyOverlap = false;

  styledRanges.forEach((range) => {
    // Sin superposición
    if (range.end <= selectionStart || range.start >= selectionEnd) {
      newRanges.push(range);
    } else {
      anyOverlap = true;

      // Parte del rango antes de la selección
      if (range.start < selectionStart) {
        newRanges.push({ ...range, end: selectionStart });
      }

      // Parte del rango después de la selección
      if (range.end > selectionEnd) {
        newRanges.push({ ...range, start: selectionEnd });
      }

      // Parte solapada: combinamos el nuevo estilo
      const overlappedStart = Math.max(range.start, selectionStart);
      const overlappedEnd = Math.min(range.end, selectionEnd);

      const mergedColor = styleType === "color" ? value : range.color;
      const mergedBold = styleType === "bold" ? (range.bold === true ? true : !!value) : range.bold;
      const mergedItalic = styleType === "italic" ? (range.italic === true ? true : !!value) : range.italic;

      newRanges.push({
        start: overlappedStart,
        end: overlappedEnd,
        color: mergedColor,
        bold: mergedBold,
        italic: mergedItalic,
      });
    }
  });

  // Si no hubo superposición, creamos un nuevo rango
  if (!anyOverlap) {
    newRanges.push({
      start: selectionStart,
      end: selectionEnd,
      color: styleType === "color" ? value : null,
      bold: styleType === "bold" ? true : null,
      italic: styleType === "italic" ? true : null,
    });
  }

  styledRanges = mergeAdjacentRanges(newRanges);
}

/**
 * Alterna (añade o quita) un estilo "bold" o "italic" sobre la selección.
 * Funciona de forma parecida a `applyStyle`, pero en lugar de asignar un valor
 * específico, invierte (true/false) el estilo en el rango solapado.
 * @param {"bold"|"italic"} styleType - Estilo a alternar.
 * @param {number} selectionStart - Índice de inicio de la selección.
 * @param {number} selectionEnd - Índice de fin de la selección.
 * @returns {void}
 */
function toggleStyle(styleType, selectionStart, selectionEnd) {
  if (selectionStart === selectionEnd) {
    return;
  }

  let newRanges = [];
  let anyOverlap = false;

  styledRanges.forEach((range) => {
    if (range.end <= selectionStart || range.start >= selectionEnd) {
      newRanges.push(range);
    } else {
      anyOverlap = true;

      // Parte antes de la selección
      if (range.start < selectionStart) {
        newRanges.push({ ...range, end: selectionStart });
      }
      // Parte después de la selección
      if (range.end > selectionEnd) {
        newRanges.push({ ...range, start: selectionEnd });
      }

      // Parte solapada: invertimos bold/italic
      const overlappedStart = Math.max(range.start, selectionStart);
      const overlappedEnd = Math.min(range.end, selectionEnd);

      let { bold, italic, color } = range;
      if (styleType === "bold") {
        bold = bold ? false : true;
      } else if (styleType === "italic") {
        italic = italic ? false : true;
      }

      newRanges.push({ start: overlappedStart, end: overlappedEnd, color, bold, italic });
    }
  });

  // Si no se solapó con ningún rango, creamos uno nuevo
  if (!anyOverlap) {
    newRanges.push({
      start: selectionStart,
      end: selectionEnd,
      color: null,
      bold: styleType === "bold" ? true : null,
      italic: styleType === "italic" ? true : null,
    });
  }

  styledRanges = mergeAdjacentRanges(newRanges);
}

/**
 * Elimina el color de la selección, pero **mantiene** estilos de negrita o cursiva.
 * @param {number} selectionStart - Índice de inicio.
 * @param {number} selectionEnd - Índice de fin.
 * @returns {void}
 */
function clearColorsInRanges(selectionStart, selectionEnd) {
  if (selectionStart === selectionEnd) {
    return;
  }

  let newRanges = [];
  styledRanges.forEach((range) => {
    if (range.end <= selectionStart || range.start >= selectionEnd) {
      newRanges.push(range);
    } else {
      // Parte antes
      if (range.start < selectionStart) {
        newRanges.push({ ...range, end: selectionStart });
      }
      // Parte después
      if (range.end > selectionEnd) {
        newRanges.push({ ...range, start: selectionEnd });
      }
      // Parte solapada: color = null
      const overlappedStart = Math.max(range.start, selectionStart);
      const overlappedEnd = Math.min(range.end, selectionEnd);
      newRanges.push({
        start: overlappedStart,
        end: overlappedEnd,
        color: null,
        bold: range.bold,
        italic: range.italic,
      });
    }
  });

  styledRanges = mergeAdjacentRanges(newRanges);
}

/**
 * Ajusta los `styledRanges` cuando se detecta un cambio en el texto (inserción, borrado o reemplazo).
 * @param {object | object[] | null} diff - Objeto con la info de la operación
 * de cambio (insert/delete) proveniente de `findDiff`.
 * @returns {void}
 */
function adjustStyledRanges(diff) {
  if (!diff) return;

  const diffs = Array.isArray(diff) ? diff : [diff];

  diffs.forEach((change) => {
    const { type, index, length } = change;

    if (type === "insert") {
      // Desplazar los rangos hacia la derecha
      styledRanges.forEach((range) => {
        if (range.start >= index) {
          range.start += length;
          range.end += length;
        } else if (range.start < index && range.end > index) {
          range.end += length;
        }
      });
    } else if (type === "delete") {
      // Desplazar o recortar
      styledRanges.forEach((range) => {
        if (range.end <= index) {
          // Sin cambios
        } else if (range.start >= index + length) {
          range.start -= length;
          range.end -= length;
        } else {
          if (range.start < index) {
            range.end = Math.max(range.start, index);
          } else {
            range.start = index;
          }
          if (range.end < range.start) {
            range.end = range.start;
          }
        }
      });
      // Eliminar rangos vacíos
      styledRanges = styledRanges.filter((r) => r.start < r.end);
    }
  });

  styledRanges = mergeAdjacentRanges(styledRanges);
}

/**
 * Actualiza el <pre> espejado (textareaMirror) para mostrar texto con
 * los estilos definidos en `styledRanges`. Cada rango se envuelve en <span>
 * con estilos en línea (color, negrita, cursiva, etc.)
 * @param {StyledRange[]} styledRanges - Arreglo de rangos con estilos
 * @returns {void}
 */
function updateHighlightedCode(styledRanges) {
  styledRanges.sort((a, b) => a.start - b.start);

  const text = textarea.value;
  let result = "";
  let currentIndex = 0;

  styledRanges.forEach((range, index) => {
    const { start, end, color, bold, italic } = range;
    // Text without styles
    if (start > currentIndex) {
      const segment = text.slice(currentIndex, start);
      result += escapeHtml(segment);
    }

    let styleString = "";
    if (color) styleString += `color: ${color};`;
    if (bold) styleString += "font-weight: bold;";
    if (italic) styleString += "font-style: italic;";

    const styledSegment = text.slice(start, end);
    if (styleString) {
      result += `<span data-range-id="${index}" style="${styleString}">${escapeHtml(styledSegment)}</span>`;
    } else {
      result += `<span data-range-id="${index}">${escapeHtml(styledSegment)}</span>`;
    }

    currentIndex = end;
  });

  // Add last text
  if (currentIndex < text.length) {
    result += escapeHtml(text.slice(currentIndex));
  }

  textareaMirror.innerHTML = result;
}

/**
 * Calcula las coordenadas (top, left) de la posición del caret
 * en un `<textarea>` dado, basándose en un "clone" invisible
 * para medir dónde quedaría exactamente el cursor.
 * @param {HTMLTextAreaElement} element - El textarea donde está el caret.
 * @param {number} position - Índice en el texto (0-based) donde medir la posición.
 * @returns {{top: number, left: number}} Coordenadas absolutas del caret.
 */
function getCaretCoordinates(element, position) {
  const div = document.createElement("div");
  const style = getComputedStyle(element);

  for (const prop of style) {
    div.style[prop] = style[prop];
  }
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";

  // Insertar texto hasta la posición
  const textContent = element.value.substring(0, position);
  div.textContent = textContent.replace(/\n/g, "\n\u200b");

  // Span de posición real
  const span = document.createElement("span");
  span.textContent = element.value.substring(position) || ".";
  div.appendChild(span);

  document.body.appendChild(div);

  const { offsetLeft: spanLeft, offsetTop: spanTop } = span;
  const { offsetLeft: divLeft, offsetTop: divTop } = div;

  document.body.removeChild(div);

  return {
    top: divTop + spanTop - element.scrollTop,
    left: divLeft + spanLeft - element.scrollLeft,
  };
}

/**
 * Muestra el tooltip flotante cerca del final de la selección de texto.
 * Si no hay selección, lo oculta.
 * @returns {void}
 */
function showTooltip() {
  const { selectionStart, selectionEnd } = textarea;
  if (selectionStart === selectionEnd) {
    tooltip.style.display = "none";
    return;
  }

  // Calculamos coordenadas con la función importada
  const { top, left } = getCaretCoordinates(textarea, selectionEnd);

  tooltip.style.top = `${top + 20}px`;
  tooltip.style.left = `${left}px`;
  tooltip.style.display = "flex";
}

/**
 * Oculta el tooltip flotante.
 * @returns {void}
 */
function hideTooltip() {
  tooltip.style.display = "none";
}

/**
 * Borra todos los rangos de estilos (preguntando confirmación)
 * y actualiza la vista.
 * @returns {void}
 */
function clearAllStyles() {
  if (confirm("¿Seguro que deseas eliminar todos los estilos aplicados?")) {
    // Simplemente reiniciamos el arreglo global
    styledRanges.length = 0;
    updateHighlightedCode(styledRanges);
  }
}

/* -----------------------------
   Event listeners
----------------------------- */

// Detectamos cambios en el textarea para ajustar los rangos
textarea.addEventListener("input", () => {
  const newText = textarea.value;
  const diff = findDiff(previousText, newText);
  if (diff) {
    adjustStyledRanges(diff);
  }
  previousText = newText;
  updateHighlightedCode(styledRanges);
});

// Sincroniza la barra de scroll del <textarea> con la del <pre> espejado
textarea.addEventListener("scroll", () => {
  textareaMirror.parentElement.scrollTop = textarea.scrollTop;
  textareaMirror.parentElement.scrollLeft = textarea.scrollLeft;
});

// MouseUp: mostramos el tooltip (si hay texto seleccionado) y resaltamos spans.
textarea.addEventListener("mouseup", () => {
  setTimeout(showTooltip, 0);
});

// Oculta el tooltip si hacemos clic fuera de él y del textarea
document.addEventListener("click", (e) => {
  if (!tooltip.contains(e.target) && e.target !== textarea) {
    hideTooltip();
  }
});

// Botones del tooltip
applyColorButton.addEventListener("click", () => {
  const { selectionStart, selectionEnd } = textarea;
  applyStyle("color", colorPicker.value, selectionStart, selectionEnd);
  hideTooltip();
  updateHighlightedCode(styledRanges);
});

clearColorsButton.addEventListener("click", () => {
  const { selectionStart, selectionEnd } = textarea;
  clearColorsInRanges(selectionStart, selectionEnd);
  hideTooltip();
  updateHighlightedCode(styledRanges);
});

boldButton.addEventListener("click", () => {
  const { selectionStart, selectionEnd } = textarea;
  toggleStyle("bold", selectionStart, selectionEnd);
  hideTooltip();
  updateHighlightedCode(styledRanges);
});

italicButton.addEventListener("click", () => {
  const { selectionStart, selectionEnd } = textarea;
  toggleStyle("italic", selectionStart, selectionEnd);
  hideTooltip();
  updateHighlightedCode(styledRanges);
});

clearStylesButton.addEventListener("click", () => {
  clearAllStyles();
  hideTooltip();
});

// Inicializar la vista al cargar
updateHighlightedCode(styledRanges);
