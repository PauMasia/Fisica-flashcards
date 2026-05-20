let FORMULAS = [];
let CONSTANTS = [];
let DEPENDENCIES = {};
let BUILDER_TASKS = [];

const state = {
  practice: "quiz",
  mode: "infinite",
  topic: "all",
  hideMeta: false,
  builderShowHelp: false,
  queue: [],
  index: 0,
  current: null,
  locked: false,
  flashFlipped: false,
  builderCurrent: null,
  builderRequired: [],
  builderCycles: [],
  builderSelectedFormulaIds: [],
  builderSelectedUnit: "",
  ok: Number(localStorage.getItem("pauQuizOk") || 0),
  bad: Number(localStorage.getItem("pauQuizBad") || 0),
  regular: Number(localStorage.getItem("pauQuizRegular") || 0)
};

const $ = (id) => document.getElementById(id);
const els = {
  practiceSelect: $("practiceSelect"),
  modeSelect: $("modeSelect"),
  topicSelect: $("topicSelect"),
  hideMetaToggle: $("hideMetaToggle"),
  builderHelpToggle: $("builderHelpToggle"),
  startBtn: $("startBtn"),
  resetStatsBtn: $("resetStatsBtn"),
  sessionModeLabel: $("sessionModeLabel"),
  sessionStatus: $("sessionStatus"),
  questionCard: $("questionCard"),
  metaRow: $("metaRow"),
  topicBadge: $("topicBadge"),
  typeBadge: $("typeBadge"),
  counterLabel: $("counterLabel"),
  quizView: $("quizView"),
  flashcardView: $("flashcardView"),
  builderView: $("builderView"),
  builderTargetText: $("builderTargetText"),
  builderFormulaSections: $("builderFormulaSections"),
  builderUnitBank: $("builderUnitBank"),
  formulaDropZone: $("formulaDropZone"),
  unitDropZone: $("unitDropZone"),
  selectedFormulaChips: $("selectedFormulaChips"),
  selectedUnitChip: $("selectedUnitChip"),
  builderSolveBtn: $("builderSolveBtn"),
  builderGiveUpBtn: $("builderGiveUpBtn"),
  questionText: $("questionText"),
  formulaBox: $("formulaBox"),
  options: $("options"),
  flashcard: $("flashcard"),
  flashInner: $("flashInner"),
  flashFrontTitle: $("flashFrontTitle"),
  flashFrontText: $("flashFrontText"),
  flashBackTitle: $("flashBackTitle"),
  flashBackText: $("flashBackText"),
  flipBtn: $("flipBtn"),
  knowBtn: $("knowBtn"),
  missBtn: $("missBtn"),
  feedback: $("feedback"),
  feedbackTitle: $("feedbackTitle"),
  feedbackText: $("feedbackText"),
  extraText: $("extraText"),
  variablesPanel: $("variablesPanel"),
  variablesList: $("variablesList"),
  nextBtn: $("nextBtn"),
  hintBtn: $("hintBtn"),
  okStat: $("okStat"),
  regularStat: $("regularStat"),
  badStat: $("badStat"),
  pctStat: $("pctStat"),
  progressLabel: $("progressLabel"),
  progressBar: $("progressBar"),
  formulaList: $("formulaList"),
  solutionOverlay: $("solutionOverlay"),
  solutionTitle: $("solutionTitle"),
  solutionText: $("solutionText"),
  solutionExtra: $("solutionExtra"),
  solutionVariablesPanel: $("solutionVariablesPanel"),
  solutionVariablesList: $("solutionVariablesList"),
  closeSolutionBtn: $("closeSolutionBtn"),
  closeSolutionBottomBtn: $("closeSolutionBottomBtn"),
  nextFromSolutionBtn: $("nextFromSolutionBtn")
};

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sample(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function unique(array) {
  return [...new Set(array.filter(Boolean))];
}

function filteredFormulas() {
  return state.topic === "all" ? FORMULAS : FORMULAS.filter((f) => f.topic === state.topic);
}

function filteredConstants() {
  return state.topic === "all" ? CONSTANTS : CONSTANTS.filter((c) => c.topic === state.topic);
}

function filteredBuilderTasks() {
  if (state.topic === "all") return BUILDER_TASKS;
  const allowed = new Set(filteredFormulas().map((f) => f.id));
  return BUILDER_TASKS.filter((task) => allowed.has(task.root));
}

function wrongOptions(correct, pool, count = 3) {
  const wrong = shuffle(unique(pool).filter((x) => x !== correct)).slice(0, count);
  return shuffle([correct, ...wrong]);
}

function parseVars(varsText = "") {
  return varsText
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [symbol, ...rest] = part.split(":");
      return {
        symbol: (symbol || "?").trim(),
        meaning: rest.join(":").trim() || part.trim()
      };
    });
}

function variablePool() {
  return [
    ["B", "campo magnético"], ["S", "superficie"], ["α", "ángulo"], ["I", "intensidad"],
    ["R", "resistencia o radio, según fórmula"], ["L", "longitud"], ["v", "velocidad"],
    ["N", "número de espiras"], ["ΔΦ", "variación de flujo"], ["Δt", "tiempo"],
    ["m", "masa"], ["a", "aceleración"], ["G", "constante gravitatoria"], ["M", "masa grande"],
    ["r", "distancia"], ["K", "constante eléctrica"], ["Q", "carga creadora"], ["q", "carga"],
    ["V", "potencial"], ["T", "periodo"], ["ε", "fem o tensión"]
  ];
}

function buildQuestionFromFormula(f) {
  const types = ["formulaToName", "nameToFormula", "formulaToGives", "formulaToUnits", "useToFormula", "missingVariable", "varsMeaning"];
  const type = sample(types);
  const all = filteredFormulas();
  const allNames = all.map((x) => x.name);
  const allFormulas = all.map((x) => x.formula);
  const allGives = unique(FORMULAS.map((x) => x.gives));
  const allUnits = unique(FORMULAS.map((x) => x.units));
  const base = { kind: "formula", source: f, topic: f.topic, variables: parseVars(f.vars) };

  if (type === "formulaToName") {
    return {
      ...base,
      typeLabel: "¿Qué fórmula es?",
      question: "¿Qué fórmula estás viendo?",
      formula: f.formula,
      correct: f.name,
      options: wrongOptions(f.name, allNames),
      explanation: f.explanation,
      extra: `Sirve para ${f.use}. Unidades del resultado: ${f.units}.`,
      frontTitle: f.formula,
      frontText: "Piensa el nombre y qué calcula antes de girarla.",
      backTitle: f.name,
      backText: `${f.explanation} Resultado: ${f.gives}, en ${f.units}.`
    };
  }

  if (type === "nameToFormula") {
    return {
      ...base,
      typeLabel: "Elegir fórmula",
      question: `¿Cuál es la fórmula de ${f.name}?`,
      formula: "",
      correct: f.formula,
      options: wrongOptions(f.formula, allFormulas),
      explanation: f.explanation,
      extra: `Variables: ${f.vars}.`,
      frontTitle: f.name,
      frontText: "Recuerda la fórmula completa.",
      backTitle: f.formula,
      backText: `${f.explanation} Variables: ${f.vars}.`
    };
  }

  if (type === "formulaToGives") {
    return {
      ...base,
      typeLabel: "¿Qué calcula?",
      question: "¿Qué magnitud te da esta fórmula?",
      formula: f.formula,
      correct: f.gives,
      options: wrongOptions(f.gives, allGives),
      explanation: f.explanation,
      extra: `Se mide en ${f.units}.`,
      frontTitle: f.formula,
      frontText: "Di qué magnitud calcula.",
      backTitle: f.gives,
      backText: `Unidad: ${f.units}. ${f.explanation}`
    };
  }

  if (type === "formulaToUnits") {
    return {
      ...base,
      typeLabel: "Unidades",
      question: `¿En qué unidad se mide ${f.gives}?`,
      formula: f.formula,
      correct: f.units,
      options: wrongOptions(f.units, allUnits),
      explanation: `Esta fórmula calcula ${f.gives}. Por eso el resultado se expresa en ${f.units}.`,
      extra: `Variables: ${f.vars}.`,
      frontTitle: f.gives,
      frontText: "Piensa en la unidad del resultado.",
      backTitle: f.units,
      backText: `${f.formula}. Variables: ${f.vars}.`
    };
  }

  if (type === "useToFormula") {
    return {
      ...base,
      typeLabel: "¿Cuál usarías?",
      question: `Quieres ${f.use}. ¿Qué fórmula usarías?`,
      formula: "",
      correct: f.formula,
      options: wrongOptions(f.formula, allFormulas),
      explanation: f.explanation,
      extra: `Nombre: ${f.name}. Resultado: ${f.gives}, en ${f.units}.`,
      frontTitle: `Uso: ${f.use}`,
      frontText: "Recuerda qué fórmula toca.",
      backTitle: f.formula,
      backText: `${f.name}. Resultado: ${f.gives}, en ${f.units}.`
    };
  }

  if (type === "missingVariable") {
    const reps = variablePool();
    const present = reps.filter(([symbol]) => f.formula.includes(symbol));
    const picked = present.length ? sample(present) : ["r", "distancia"];
    const missingFormula = f.formula.replace(picked[0], "□");
    return {
      ...base,
      typeLabel: "¿Qué falta?",
      question: "¿Qué símbolo falta en esta fórmula?",
      formula: missingFormula,
      correct: `${picked[0]} = ${picked[1]}`,
      options: wrongOptions(`${picked[0]} = ${picked[1]}`, reps.map(([s, n]) => `${s} = ${n}`)),
      explanation: `En ${f.name}, ${picked[0]} representa ${picked[1]}.`,
      extra: `Fórmula completa: ${f.formula}. ${f.vars}.`,
      frontTitle: missingFormula,
      frontText: "Adivina qué letra falta.",
      backTitle: `${picked[0]} = ${picked[1]}`,
      backText: `Fórmula completa: ${f.formula}.`
    };
  }

  const vars = parseVars(f.vars);
  const chosen = sample(vars.length ? vars : [{ symbol: "?", meaning: f.vars }]);
  const correctText = `${chosen.symbol}: ${chosen.meaning}`;
  const allVarTexts = FORMULAS.flatMap((x) => parseVars(x.vars).map((v) => `${v.symbol}: ${v.meaning}`));
  return {
    ...base,
    typeLabel: "Variables",
    question: `En la fórmula ${f.formula}, ¿qué significa ${chosen.symbol}?`,
    formula: f.formula,
    correct: correctText,
    options: wrongOptions(correctText, allVarTexts),
    explanation: "Esto sirve para no usar fórmulas de memoria sin saber qué representa cada letra.",
    extra: `Fórmula: ${f.name}. Resultado: ${f.gives}, en ${f.units}.`,
    frontTitle: `${f.formula}`,
    frontText: `¿Qué significa ${chosen.symbol}?`,
    backTitle: correctText,
    backText: `${f.name}. Resultado: ${f.gives}, en ${f.units}.`
  };
}

function buildQuestionFromConstant(c) {
  const types = ["constantValue", "constantSymbol", "constantUse"];
  const type = sample(types);
  const constants = filteredConstants().length ? filteredConstants() : CONSTANTS;
  const base = { kind: "constant", source: c, topic: c.topic, variables: [] };

  if (type === "constantValue") {
    return {
      ...base,
      typeLabel: "Constante",
      question: `¿Cuál es el valor de ${c.symbol}?`,
      formula: c.name,
      correct: c.value,
      options: wrongOptions(c.value, constants.map((x) => x.value)),
      explanation: c.explanation,
      extra: `${c.symbol} = ${c.value}.`,
      frontTitle: c.symbol,
      frontText: c.name,
      backTitle: c.value,
      backText: c.explanation
    };
  }

  if (type === "constantSymbol") {
    return {
      ...base,
      typeLabel: "Símbolo",
      question: `¿Qué símbolo corresponde a ${c.name}?`,
      formula: "",
      correct: c.symbol,
      options: wrongOptions(c.symbol, constants.map((x) => x.symbol)),
      explanation: c.explanation,
      extra: `Valor: ${c.value}.`,
      frontTitle: c.name,
      frontText: "Recuerda el símbolo.",
      backTitle: c.symbol,
      backText: `Valor: ${c.value}. ${c.explanation}`
    };
  }

  return {
    ...base,
    typeLabel: "Uso de constante",
    question: `¿Dónde suele aparecer ${c.symbol}?`,
    formula: `${c.symbol} = ${c.value}`,
    correct: c.explanation,
    options: wrongOptions(c.explanation, CONSTANTS.map((x) => x.explanation)),
    explanation: c.explanation,
    extra: `${c.name}: ${c.value}.`,
    frontTitle: `${c.symbol} = ${c.value}`,
    frontText: "Piensa cuándo se usa.",
    backTitle: c.name,
    backText: c.explanation
  };
}

function buildQuestion(item) {
  return item.kind === "constant" ? buildQuestionFromConstant(item.data) : buildQuestionFromFormula(item.data);
}

function buildQueue() {
  const formulaItems = filteredFormulas().map((data) => ({ kind: "formula", data }));
  const constantItems = filteredConstants().map((data) => ({ kind: "constant", data }));
  state.queue = shuffle([...formulaItems, ...constantItems].flatMap((item) => [item, item]));
  state.index = 0;
}

function getNextItem() {
  const formulas = filteredFormulas();
  const constants = filteredConstants();
  if (!formulas.length && !constants.length) return null;

  if (state.mode === "review") {
    if (!state.queue.length || state.index >= state.queue.length) return "finished";
    return state.queue[state.index++];
  }

  const pool = [
    ...formulas.map((data) => ({ kind: "formula", data })),
    ...constants.map((data) => ({ kind: "constant", data }))
  ];
  return sample(pool);
}

function resetQuestionUi() {
  state.locked = false;
  state.flashFlipped = false;
  els.nextBtn.disabled = true;
  els.options.innerHTML = "";
  els.feedback.hidden = true;
  els.feedback.className = "feedback-card";
  els.feedbackTitle.textContent = "";
  els.feedbackText.textContent = "";
  els.extraText.textContent = "";
  els.variablesPanel.hidden = true;
  els.variablesList.innerHTML = "";
  els.solutionVariablesPanel.hidden = true;
  els.solutionVariablesList.innerHTML = "";
  closeSolution();
  els.flashInner.classList.remove("flipped");
  els.questionCard.classList.remove("shake");
}

function nextQuestion() {
  resetQuestionUi();
  if (state.practice === "builder") {
    nextBuilderTask();
    return;
  }
  const item = getNextItem();

  if (item === null) {
    els.questionText.textContent = "No hay preguntas para este tema.";
    els.formulaBox.hidden = true;
    updateStats();
    return;
  }

  if (item === "finished") {
    els.questionText.textContent = "Recorrido terminado. Pulsa empezar para repetirlo.";
    els.formulaBox.hidden = true;
    els.sessionStatus.textContent = "Repaso completado";
    updateStats();
    return;
  }

  state.current = buildQuestion(item);
  renderQuestion();
  updateStats();
}

function shouldRevealMeta() {
  if (!state.hideMeta) return true;
  if (state.practice === "quiz") return state.locked;
  return state.flashFlipped;
}

function renderMeta() {
  if (!state.current) return;
  const reveal = shouldRevealMeta();
  els.topicBadge.textContent = reveal ? state.current.topic : "Tema oculto";
  els.typeBadge.textContent = reveal ? state.current.typeLabel : "Tipo oculto";
  els.topicBadge.classList.toggle("hidden-clue", !reveal);
  els.typeBadge.classList.toggle("hidden-clue", !reveal);
}

function renderQuestion() {
  const q = state.current;
  els.quizView.hidden = state.practice !== "quiz";
  els.flashcardView.hidden = state.practice !== "flashcards";
  els.builderView.hidden = state.practice !== "builder";

  renderMeta();
  els.questionText.textContent = q.question;
  els.sessionStatus.textContent = state.practice === "quiz" ? "Responde la tarjeta" : "Gira la flashcard";

  if (q.formula) {
    els.formulaBox.hidden = false;
    els.formulaBox.textContent = q.formula;
  } else {
    els.formulaBox.hidden = true;
  }

  q.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.className = "option-card";
    btn.type = "button";
    btn.innerHTML = `<span>${option}</span><span class="letter">${String.fromCharCode(65 + index)}</span>`;
    btn.addEventListener("click", () => answer(option, btn));
    els.options.appendChild(btn);
  });

  els.flashFrontTitle.textContent = q.frontTitle || q.question;
  els.flashFrontText.textContent = q.frontText || "Piensa la respuesta y gira la tarjeta.";
  els.flashBackTitle.textContent = q.backTitle || q.correct;
  els.flashBackText.textContent = q.backText || q.explanation;
}

function fillVariables(container, panel, q) {
  container.innerHTML = "";

  if (!q || q.kind !== "formula" || !q.variables.length) {
    panel.hidden = true;
    return;
  }

  q.variables.forEach((variable) => {
    const div = document.createElement("div");
    div.className = "variable-chip";
    div.innerHTML = `<strong>${variable.symbol}</strong><span>${variable.meaning}</span>`;
    container.appendChild(div);
  });

  panel.hidden = false;
}

function renderVariables(q) {
  fillVariables(els.variablesList, els.variablesPanel, q);
}

function renderSolutionVariables(q) {
  fillVariables(els.solutionVariablesList, els.solutionVariablesPanel, q);
}

function openSolution(title, text, extra = "", q = state.current) {
  els.solutionTitle.textContent = title;
  els.solutionText.textContent = text;
  els.solutionExtra.textContent = extra || "";
  renderSolutionVariables(q);
  els.solutionOverlay.hidden = false;
  document.body.classList.add("modal-open");
}

function closeSolution() {
  els.solutionOverlay.hidden = true;
  document.body.classList.remove("modal-open");
}

function answer(selected, btn) {
  if (state.locked || !state.current) return;
  state.locked = true;
  const q = state.current;
  const ok = selected === q.correct;

  if (ok) state.ok += 1;
  else state.bad += 1;
  saveStats();

  [...els.options.children].forEach((child) => {
    const optionText = child.querySelector("span")?.textContent?.trim() || child.textContent.trim();
    if (optionText === q.correct) child.classList.add("correct");
    if (child === btn && !ok) child.classList.add("wrong");
    child.disabled = true;
  });

  if (!ok) {
    els.questionCard.classList.remove("shake");
    setTimeout(() => els.questionCard.classList.add("shake"), 0);
  }

  showFeedback(ok ? "ok" : "bad", ok ? "Bien ✅" : "Fallaste, mira la solución", ok ? q.explanation : `Respuesta correcta: ${q.correct}. ${q.explanation}`, q.extra || "", true);
  renderVariables(q);
  renderMeta();
  els.nextBtn.disabled = false;
  updateStats();
}

function showFeedback(type, title, text, extra = "", popup = false) {
  els.feedback.hidden = false;
  els.feedback.className = `feedback-card ${type}`;
  els.feedbackTitle.textContent = title;
  els.feedbackText.textContent = text;
  els.extraText.textContent = extra;

  if (popup) {
    openSolution(title, text, extra, state.current);
  }
}

function showHint() {
  if (!state.current) return;
  const q = state.current;
  showFeedback("hint", "Pista", q.extra || q.explanation, "Mira primero qué magnitud te piden y después las unidades.");
  renderVariables(q);
}

function flipFlashcard() {
  if (!state.current || state.practice !== "flashcards") return;
  state.flashFlipped = !state.flashFlipped;
  els.flashInner.classList.toggle("flipped", state.flashFlipped);
  renderMeta();
  if (state.flashFlipped) {
    showFeedback("hint", "Resumen de la tarjeta", state.current.explanation, state.current.extra || "");
    renderVariables(state.current);
  }
}

function markFlashcard(known) {
  if (!state.current || state.practice !== "flashcards") return;
  if (known) state.ok += 1;
  else state.bad += 1;
  saveStats();
  state.locked = true;
  state.flashFlipped = true;
  els.flashInner.classList.add("flipped");
  renderMeta();
  showFeedback(known ? "ok" : "bad", known ? "La sabías ✅" : "Repásala otra vez", state.current.explanation, state.current.extra || "", true);
  renderVariables(state.current);
  els.nextBtn.disabled = false;
  updateStats();
}


function formulaById(id) {
  return FORMULAS.find((formula) => formula.id === id) || null;
}

function formulaDisplay(formula) {
  if (!formula || !formula.formula) return "";
  const parts = formula.formula.split("=");
  return parts.length > 1 ? parts.slice(1).join("=").trim() : formula.formula.trim();
}

function unitText(formula) {
  return formula?.units || "";
}

function requiredFormulaIds(rootId) {
  const required = [];
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();

  function walk(id, path = []) {
    if (!id) return;
    if (visiting.has(id)) {
      cycles.push([...path, id]);
      return;
    }
    if (visited.has(id)) return;

    visiting.add(id);
    visited.add(id);
    required.push(id);

    const deps = DEPENDENCIES[id] || [];
    deps.forEach((dep) => walk(dep, [...path, id]));
    visiting.delete(id);
  }

  walk(rootId);
  return { required, cycles };
}

function nextBuilderTask() {
  state.practice = "builder";
  els.quizView.hidden = true;
  els.flashcardView.hidden = true;
  els.builderView.hidden = false;
  els.feedback.hidden = true;
  els.nextBtn.disabled = true;
  els.sessionStatus.textContent = "Elige las fórmulas necesarias";
  els.counterLabel.textContent = "fórmulas";

  const tasks = filteredBuilderTasks();
  if (!tasks.length) {
    els.builderTargetText.textContent = "No hay retos para este tema.";
    els.builderFormulaSections.innerHTML = "";
    return;
  }

  const task = state.mode === "review"
    ? tasks[state.index++ % tasks.length]
    : sample(tasks);

  state.builderCurrent = task;
  state.builderSelectedFormulaIds = [];
  state.builderSelectedUnit = "";
  const solved = requiredFormulaIds(task.root);
  state.builderRequired = solved.required;
  state.builderCycles = solved.cycles;
  state.current = {
    topic: formulaById(task.root)?.topic || "Física",
    typeLabel: "Fórmulas necesarias"
  };

  renderMeta();
  els.builderTargetText.textContent = task.description || `Te pido ${task.target}.`;
  renderBuilderFormulaSections();
  renderBuilderUnitBank();
  renderBuilderSelections();
  updateStats();
}

function renderBuilderFormulaSections() {
  els.builderFormulaSections.innerHTML = "";
  const formulas = filteredFormulas();
  const topics = unique(formulas.map((f) => f.topic));

  topics.forEach((topic) => {
    const details = document.createElement("details");
    details.className = "builder-topic";
    details.open = false;
    details.innerHTML = `<summary>${topic}</summary><div class="builder-topic-body"></div>`;
    const body = details.querySelector(".builder-topic-body");

    formulas.filter((f) => f.topic === topic).forEach((f) => {
      const row = document.createElement("button");
      row.className = "builder-formula-row builder-draggable";
      row.type = "button";
      row.draggable = true;
      row.dataset.formulaId = f.id;
      row.innerHTML = state.builderShowHelp
        ? `
          <span>
            <b>${f.name}</b>
            <code>${formulaDisplay(f)}</code>
            <small>${f.use}</small>
          </span>
        `
        : `
          <span>
            <code>${formulaDisplay(f)}</code>
          </span>
        `;
      row.addEventListener("click", () => addBuilderFormula(f.id));
      row.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", `formula:${f.id}`);
      });
      body.appendChild(row);
    });

    els.builderFormulaSections.appendChild(details);
  });
}

function renderBuilderUnitBank() {
  els.builderUnitBank.innerHTML = "";
  const units = unique(FORMULAS.map((f) => f.units));
  units.forEach((unit) => {
    const btn = document.createElement("button");
    btn.className = "unit-chip builder-draggable";
    btn.type = "button";
    btn.draggable = true;
    btn.dataset.unit = unit;
    btn.textContent = unit;
    btn.addEventListener("click", () => setBuilderUnit(unit));
    btn.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", `unit:${unit}`);
    });
    els.builderUnitBank.appendChild(btn);
  });
}

function addBuilderFormula(id) {
  if (!id || state.builderSelectedFormulaIds.includes(id)) return;
  state.builderSelectedFormulaIds.push(id);
  renderBuilderSelections();
}

function removeBuilderFormula(id) {
  state.builderSelectedFormulaIds = state.builderSelectedFormulaIds.filter((formulaId) => formulaId !== id);
  renderBuilderSelections();
}

function setBuilderUnit(unit) {
  state.builderSelectedUnit = unit || "";
  renderBuilderSelections();
}

function renderBuilderSelections() {
  els.selectedFormulaChips.innerHTML = "";
  if (!state.builderSelectedFormulaIds.length) {
    els.selectedFormulaChips.classList.add("empty");
    els.selectedFormulaChips.textContent = "Arrastra aquí las fórmulas";
  } else {
    els.selectedFormulaChips.classList.remove("empty");
    state.builderSelectedFormulaIds.forEach((id) => {
      const f = formulaById(id);
      if (!f) return;
      const chip = document.createElement("button");
      chip.className = "selected-chip";
      chip.type = "button";
      chip.title = "Tocar para quitar";
      chip.innerHTML = state.builderShowHelp
        ? `<b>${f.name}</b><code>${formulaDisplay(f)}</code><span>×</span>`
        : `<code>${formulaDisplay(f)}</code><span>×</span>`;
      chip.addEventListener("click", () => removeBuilderFormula(id));
      els.selectedFormulaChips.appendChild(chip);
    });
  }

  els.selectedUnitChip.innerHTML = "";
  if (!state.builderSelectedUnit) {
    els.selectedUnitChip.classList.add("empty");
    els.selectedUnitChip.textContent = "Arrastra aquí la unidad";
  } else {
    els.selectedUnitChip.classList.remove("empty");
    const chip = document.createElement("button");
    chip.className = "selected-chip unit-selected";
    chip.type = "button";
    chip.title = "Tocar para quitar";
    chip.innerHTML = `<b>${state.builderSelectedUnit}</b><span>×</span>`;
    chip.addEventListener("click", () => setBuilderUnit(""));
    els.selectedUnitChip.appendChild(chip);
  }
}

function setupDropZone(zone, type) {
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.classList.add("drag-over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("drag-over");
    const raw = event.dataTransfer.getData("text/plain");
    const [kind, ...rest] = raw.split(":");
    const value = rest.join(":");
    if (type === "formula" && kind === "formula") addBuilderFormula(value);
    if (type === "unit" && kind === "unit") setBuilderUnit(value);
  });
}

function getSelectedBuilderIds() {
  return [...state.builderSelectedFormulaIds];
}

function explainBuilderSolution(giveUp = false) {
  if (!state.builderCurrent) return;

  const selected = new Set(getSelectedBuilderIds());
  const required = new Set(state.builderRequired);
  const rootFormula = formulaById(state.builderCurrent.root);
  const expectedUnit = unitText(rootFormula);
  const unitOk = state.builderSelectedUnit === expectedUnit;
  const missing = [...required].filter((id) => !selected.has(id));
  const extra = [...selected].filter((id) => !required.has(id));
  const formulasOk = !missing.length && !extra.length;
  const ok = formulasOk && unitOk;
  const regular = formulasOk && !unitOk;

  if (!giveUp) {
    if (ok) state.ok += 1;
    else if (regular) state.regular += 1;
    else state.bad += 1;
  }
  saveStats();

  const requiredNames = [...required].map((id) => formulaById(id)).filter(Boolean);
  const missingNames = missing.map((id) => formulaById(id)).filter(Boolean);
  const extraNames = extra.map((id) => formulaById(id)).filter(Boolean);

  const list = (items) => items.length
    ? `<ul class="builder-result-list">${items.map((f) => `<li><b>${f.name}</b>: <code>${formulaDisplay(f)}</code></li>`).join("")}</ul>`
    : "<p>No hay.</p>";

  const cycleText = state.builderCycles.length
    ? `<p><b>Nota:</b> he detectado dependencia circular y la he cortado para evitar bucle infinito.</p>`
    : "";

  els.feedback.hidden = false;
  els.feedback.className = `feedback-card ${ok && !giveUp ? "ok" : (regular && !giveUp ? "regular" : "hint")}`;
  els.feedbackTitle.textContent = giveUp ? "Solución" : (ok ? "Bien ✅" : (regular ? "Regular: fórmulas bien, unidad mal" : "Revisa la cadena de fórmulas"));
  els.feedbackText.innerHTML = `Para <b>${state.builderCurrent.target}</b> deberías usar:${list(requiredNames)}<p><b>Unidad final:</b> ${expectedUnit}</p>`;
  els.extraText.innerHTML = `${missing.length ? `<p class="builder-bad">Te faltan:</p>${list(missingNames)}` : ""}${extra.length ? `<p class="builder-bad">Has marcado fórmulas que no hacían falta:</p>${list(extraNames)}` : ""}${!unitOk ? `<p class="builder-bad">Unidad incorrecta o vacía. La unidad final correcta es: <b>${expectedUnit}</b>.</p>` : ""}${cycleText}`;

  const unitMsg = unitOk ? `Unidad correcta: ${expectedUnit}.` : `La unidad final correcta era ${expectedUnit}.`;
  openSolution(
    giveUp ? "Solución" : (ok ? "Bien ✅" : (regular ? "Regular: solo falla la unidad" : "Revisa la solución")),
    `Para ${state.builderCurrent.target}, las fórmulas necesarias son: ${requiredNames.map((f) => f.name).join(", ")}.`,
    `${missing.length ? `Te faltaban: ${missingNames.map((f) => f.name).join(", ")}. ` : ""}${extra.length ? `Sobraban: ${extraNames.map((f) => f.name).join(", ")}. ` : ""}${unitMsg}`,
    null
  );

  renderMeta();
  els.nextBtn.disabled = false;
  updateStats();
}

function saveStats() {
  localStorage.setItem("pauQuizOk", state.ok);
  localStorage.setItem("pauQuizBad", state.bad);
  localStorage.setItem("pauQuizRegular", state.regular);
}

function updateStats() {
  const total = state.ok + state.bad + state.regular;
  const pct = total ? Math.round((state.ok / total) * 100) : 0;
  els.okStat.textContent = state.ok;
  if (els.regularStat) els.regularStat.textContent = state.regular;
  els.badStat.textContent = state.bad;
  els.pctStat.textContent = `${pct}%`;

  els.sessionModeLabel.textContent = state.practice === "builder" ? "Modo fórmulas necesarias" : (state.mode === "review" ? "Recorrer todo" : "Modo infinito");

  if (state.mode === "review") {
    const totalQ = state.queue.length;
    const done = Math.min(state.index, totalQ);
    els.progressLabel.textContent = `Progreso del repaso: ${done} / ${totalQ}`;
    els.progressBar.style.width = totalQ ? `${(done / totalQ) * 100}%` : "0%";
    els.counterLabel.textContent = totalQ ? `${done} / ${totalQ}` : "0 / 0";
  } else {
    els.progressLabel.textContent = "Modo infinito: sin final";
    els.progressBar.style.width = "100%";
    els.counterLabel.textContent = "∞";
  }
}

function renderFormulaList() {
  els.formulaList.innerHTML = "";

  FORMULAS.forEach((formula) => {
    const card = document.createElement("div");
    card.className = "mini-card";
    card.innerHTML = `
      <b>${formula.name}</b>
      <code>${formula.formula}</code>
      <small>${formula.topic}. Resultado: ${formula.gives} → ${formula.units}. ${formula.vars}.</small>
    `;
    els.formulaList.appendChild(card);
  });

  CONSTANTS.forEach((constant) => {
    const card = document.createElement("div");
    card.className = "mini-card";
    card.innerHTML = `
      <b>${constant.name}</b>
      <code>${constant.symbol} = ${constant.value}</code>
      <small>${constant.topic}. ${constant.explanation}</small>
    `;
    els.formulaList.appendChild(card);
  });
}

function start() {
  state.practice = els.practiceSelect.value;
  state.mode = els.modeSelect.value;
  state.topic = els.topicSelect.value;
  state.hideMeta = els.hideMetaToggle.checked;
  state.builderShowHelp = els.builderHelpToggle.checked;

  if (state.mode === "review") buildQueue();
  else {
    state.queue = [];
    state.index = 0;
  }

  nextQuestion();
}

function updatePracticeView() {
  state.practice = els.practiceSelect.value;
  els.quizView.hidden = state.practice !== "quiz";
  els.flashcardView.hidden = state.practice !== "flashcards";
  els.builderView.hidden = state.practice !== "builder";
  if (state.current) renderQuestion();
}

async function loadQuizData() {
  try {
    const response = await fetch("./data.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`No se pudo cargar data.json (${response.status})`);
    const data = await response.json();

    FORMULAS = data.formulas || [];
    CONSTANTS = data.constants || [];
    DEPENDENCIES = data.dependencies || {};
    BUILDER_TASKS = data.builderTasks || [];

    renderFormulaList();
    updateStats();
    els.sessionStatus.textContent = "Datos cargados";
  } catch (error) {
    console.error(error);
    els.questionText.textContent = "No se pudo cargar data.json.";
    els.formulaBox.hidden = true;
    showFeedback(
      "bad",
      "Error cargando los datos",
      "Como los datos están separados en data.json, el navegador puede bloquearlos si abres index.html con doble click.",
      "Ábrelo con Live Server de VS Code o con un servidor local dentro de esta carpeta."
    );
  }
}

els.startBtn.addEventListener("click", start);
els.nextBtn.addEventListener("click", nextQuestion);
els.hintBtn.addEventListener("click", showHint);
els.flipBtn.addEventListener("click", flipFlashcard);
els.flashcard.addEventListener("click", flipFlashcard);
els.knowBtn.addEventListener("click", () => markFlashcard(true));
els.missBtn.addEventListener("click", () => markFlashcard(false));
els.builderSolveBtn.addEventListener("click", () => explainBuilderSolution(false));
els.builderGiveUpBtn.addEventListener("click", () => explainBuilderSolution(true));
els.practiceSelect.addEventListener("change", updatePracticeView);
els.modeSelect.addEventListener("change", start);
els.topicSelect.addEventListener("change", start);
els.hideMetaToggle.addEventListener("change", () => {
  state.hideMeta = els.hideMetaToggle.checked;
  renderMeta();
});

els.builderHelpToggle.addEventListener("change", () => {
  state.builderShowHelp = els.builderHelpToggle.checked;
  if (state.practice === "builder") {
    renderBuilderFormulaSections();
    renderBuilderSelections();
  }
});
els.resetStatsBtn.addEventListener("click", () => {
  state.ok = 0;
  state.bad = 0;
  state.regular = 0;
  localStorage.removeItem("pauQuizOk");
  localStorage.removeItem("pauQuizBad");
  localStorage.removeItem("pauQuizRegular");
  updateStats();
});

els.closeSolutionBtn.addEventListener("click", closeSolution);
els.closeSolutionBottomBtn.addEventListener("click", closeSolution);
els.solutionOverlay.addEventListener("click", (event) => {
  if (event.target === els.solutionOverlay) closeSolution();
});
els.nextFromSolutionBtn.addEventListener("click", () => {
  closeSolution();
  nextQuestion();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.solutionOverlay.hidden) closeSolution();
});

setupDropZone(els.formulaDropZone, "formula");
setupDropZone(els.unitDropZone, "unit");

updateStats();
loadQuizData();
