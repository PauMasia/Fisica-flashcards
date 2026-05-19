let FORMULAS = [];
let CONSTANTS = [];

const state = {
  practice: "quiz",
  mode: "infinite",
  topic: "all",
  hideMeta: false,
  queue: [],
  index: 0,
  current: null,
  locked: false,
  flashFlipped: false,
  ok: Number(localStorage.getItem("pauQuizOk") || 0),
  bad: Number(localStorage.getItem("pauQuizBad") || 0)
};

const $ = (id) => document.getElementById(id);
const els = {
  practiceSelect: $("practiceSelect"),
  modeSelect: $("modeSelect"),
  topicSelect: $("topicSelect"),
  hideMetaToggle: $("hideMetaToggle"),
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

function saveStats() {
  localStorage.setItem("pauQuizOk", state.ok);
  localStorage.setItem("pauQuizBad", state.bad);
}

function updateStats() {
  const total = state.ok + state.bad;
  const pct = total ? Math.round((state.ok / total) * 100) : 0;
  els.okStat.textContent = state.ok;
  els.badStat.textContent = state.bad;
  els.pctStat.textContent = `${pct}%`;

  els.sessionModeLabel.textContent = state.mode === "review" ? "Recorrer todo" : "Modo infinito";

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
  if (state.current) renderQuestion();
}

async function loadQuizData() {
  try {
    const response = await fetch("./data.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`No se pudo cargar data.json (${response.status})`);
    const data = await response.json();

    FORMULAS = data.formulas || [];
    CONSTANTS = data.constants || [];

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
els.practiceSelect.addEventListener("change", updatePracticeView);
els.modeSelect.addEventListener("change", start);
els.topicSelect.addEventListener("change", start);
els.hideMetaToggle.addEventListener("change", () => {
  state.hideMeta = els.hideMetaToggle.checked;
  renderMeta();
});
els.resetStatsBtn.addEventListener("click", () => {
  state.ok = 0;
  state.bad = 0;
  localStorage.removeItem("pauQuizOk");
  localStorage.removeItem("pauQuizBad");
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

updateStats();
loadQuizData();
