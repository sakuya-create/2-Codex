const STORAGE_KEY = "hirameki-kobo-v1";

const moods = [
  { id: "relaxed", label: "リラックス", note: "比喩と遊びを多めにします。" },
  { id: "tired", label: "少し疲れた", note: "制約を軽めにして、遠い連想を歓迎します。" },
  { id: "focused", label: "集中している", note: "NGルールを強めて発想をずらします。" },
  { id: "bright", label: "元気", note: "組み合わせ制約を強めにします。" }
];

const practicalPrompts = [
  "朝の準備を短くする道具", "勉強を続ける仕組み", "小さな店の新サービス",
  "片づけが進む仕掛け", "待ち時間を価値に変えるサービス", "忘れ物を減らす工夫"
];

const artisticPrompts = [
  "雨の日を楽しくする作品", "眠る前の短い物語", "音のない音楽体験",
  "見えない友人への贈り物", "記憶を飾る展示", "未来の祭りの演出"
];

const materials = ["紙", "光", "声", "余白", "古い道具", "数字", "色", "影", "手紙", "地図"];
const constraints = [
  "子どもでも使える", "3分以内に価値が伝わる", "電気を使わない", "一人でも複数人でも成立する",
  "失敗した時ほど面白い", "捨てるものを活用する", "音を出さずに伝える", "毎日少し変化する"
];
const bannedWords = ["便利", "楽しい", "新しい", "すごい", "簡単", "効率", "かわいい", "共有"];

const badges = [
  { id: "first", label: "初ひらめき", condition: state => state.history.length >= 1 },
  { id: "streak3", label: "三日工房", condition: state => state.streak >= 3 },
  { id: "constraint5", label: "制約職人", condition: state => state.stats.constraintWins >= 5 },
  { id: "art5", label: "芸術の火花", condition: state => state.stats.artistic >= 5 },
  { id: "practical5", label: "実用発明家", condition: state => state.stats.practical >= 5 }
];

const themes = [
  { id: "theme-mint", label: "ミント工房", cost: 80 },
  { id: "theme-peach", label: "ピーチ工房", cost: 80 }
];

const stroopColors = [
  { name: "桃", color: "#d94673" },
  { name: "若葉", color: "#16803a" },
  { name: "空", color: "#2563eb" },
  { name: "卵", color: "#b45309" }
];

let state = loadState();
let session = freshSession();
let timerStartedAt = null;
let miniInterval = null;
let miniRound = 0;
let miniInkHistory = [];
let currentMiniAnswer = "";
let miniActive = false;
let toastTimer = null;

function loadState() {
  const fallback = {
    coins: 0,
    streak: 0,
    lastPlayed: null,
    history: [],
    unlockedBadges: [],
    ownedThemes: [],
    activeTheme: "",
    stats: { constraintWins: 0, artistic: 0, practical: 0 }
  };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...fallback, ...stored, stats: { ...fallback.stats, ...(stored.stats || {}) } };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function freshSession() {
  return {
    mode: getTodayMode(),
    mood: null,
    prompt: "",
    material: "",
    constraint: "",
    banned: "",
    rough: "",
    final: "",
    miniScore: 0
  };
}

function getTodayMode() {
  const start = new Date(2026, 0, 1);
  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.floor((localToday - start) / 86400000);
  return diff % 2 === 0 ? "practical" : "artistic";
}

function getLocalDateKey(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function modeLabel(mode = session.mode) {
  return mode === "practical" ? "実用" : "芸術";
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function drawCards() {
  session.prompt = pick(session.mode === "practical" ? practicalPrompts : artisticPrompts);
  session.material = pick(materials);
  session.constraint = pick(constraints);
  session.banned = pick(bannedWords);
  renderPromptCards();
  renderSessionBrief();
}

function render() {
  document.body.className = state.activeTheme || "";
  document.getElementById("todayModeLabel").textContent = modeLabel();
  document.getElementById("coinCount").textContent = state.coins;
  document.getElementById("streakCount").textContent = state.streak;
  document.getElementById("ideaCount").textContent = state.history.length;
  renderMoods();
  renderHistory();
  renderRewards();
}

function renderMoods() {
  const wrap = document.getElementById("moodChoices");
  wrap.innerHTML = moods.map(mood => `
    <button class="choice" data-mood="${mood.id}">
      <strong>${mood.label}</strong>
      <span>${mood.note}</span>
    </button>
  `).join("");
}

function renderPromptCards() {
  const cards = [
    ["モード", `${modeLabel()}アイデア`],
    ["テーマ", session.prompt],
    ["素材", session.material],
    ["制約", session.constraint],
    ["NGワード", session.banned]
  ];
  document.getElementById("promptCards").innerHTML = cards.map(([title, text]) => `
    <div class="prompt-card"><strong>${title}</strong><span>${text}</span></div>
  `).join("");
  document.getElementById("ideaHint").textContent =
    `素材「${session.material}」を必ず入れ、制約「${session.constraint}」を守り、NGワード「${session.banned}」を避けます。`;
}

function renderSessionBrief() {
  const mood = moods.find(item => item.id === session.mood);
  const brief = [
    ["モード", `${modeLabel()}アイデア`],
    ["テーマ", session.prompt || "未抽選"],
    ["素材", session.material || "未抽選"],
    ["制約", session.constraint || "未抽選"],
    ["NGワード", session.banned || "未抽選"],
    ["現在の状態", mood ? mood.label : "未選択"]
  ].map(([label, value]) => `
    <div class="brief-item"><strong>${label}</strong><span>${escapeHtml(value)}</span></div>
  `).join("");
  ["ideaBrief", "finalBrief"].forEach(id => {
    const target = document.getElementById(id);
    if (target) target.innerHTML = brief;
  });
}

function renderRoughIdeaPreview() {
  const source = document.getElementById("roughIdea");
  const target = document.getElementById("roughPreview");
  if (!source || !target) return;
  const rough = source.value.trim();
  target.innerHTML = rough ? escapeHtml(rough) : "まだ発想メモがありません。";
}

function switchView(viewId) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("is-active", view.id === viewId));
  document.querySelectorAll(".tab").forEach(tab => tab.classList.toggle("is-active", tab.dataset.view === viewId));
}

function showStep(stepName) {
  const map = { mood: 20, cards: 40, ideas: 60, mini: 80, final: 100 };
  ["Mood", "Cards", "Ideas", "Mini", "Final"].forEach(name => {
    document.getElementById(`step${name}`).classList.add("is-hidden");
  });
  document.getElementById(`step${stepName[0].toUpperCase()}${stepName.slice(1)}`).classList.remove("is-hidden");
  document.getElementById("progressBar").style.width = `${map[stepName]}%`;
  renderSessionBrief();
  renderRoughIdeaPreview();
  if (!timerStartedAt) startTimer();
}

function startTimer() {
  timerStartedAt = Date.now();
  setInterval(() => {
    const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
    const remaining = Math.max(0, 600 - elapsed);
    const min = String(Math.floor(remaining / 60));
    const sec = String(remaining % 60).padStart(2, "0");
    document.getElementById("timerText").textContent = `目安 ${min}:${sec}`;
  }, 1000);
}

function startMiniGame() {
  clearInterval(miniInterval);
  let left = 60;
  session.miniScore = 0;
  miniRound = 0;
  miniInkHistory = [];
  currentMiniAnswer = "";
  miniActive = true;
  document.getElementById("miniTime").textContent = left;
  document.getElementById("miniScore").textContent = session.miniScore;
  document.getElementById("miniRound").textContent = miniRound;
  nextStroopRound();
  miniInterval = setInterval(() => {
    left -= 1;
    document.getElementById("miniTime").textContent = left;
    if (left <= 0) {
      clearInterval(miniInterval);
      miniActive = false;
      showToast("ミニゲーム終了。仕上げに戻りましょう。");
    }
  }, 1000);
}

function nextStroopRound() {
  miniRound += 1;
  const textColor = pick(stroopColors);
  let inkColor = pick(stroopColors);
  if (inkColor.name === textColor.name) {
    inkColor = stroopColors[(stroopColors.indexOf(inkColor) + 1) % stroopColors.length];
  }
  const isMemoryRound = miniRound > 3 && miniRound % 4 === 0 && miniInkHistory.length >= 2;
  const asksInk = !isMemoryRound && miniRound % 2 === 0;
  currentMiniAnswer = isMemoryRound ? miniInkHistory[miniInkHistory.length - 2].name : asksInk ? inkColor.name : textColor.name;
  miniInkHistory.push(inkColor);

  const chip = document.getElementById("colorChip");
  chip.textContent = textColor.name;
  chip.style.background = "#fffdfa";
  chip.style.color = inkColor.color;
  chip.dataset.answer = currentMiniAnswer;
  document.getElementById("miniRound").textContent = miniRound;
  document.getElementById("miniRule").textContent = isMemoryRound
    ? "記憶ラウンド: 2手前のインク色を答える"
    : asksInk
      ? "インク色を答える。文字の意味は無視"
      : "文字を答える。インク色は無視";
  document.getElementById("sortButtons").innerHTML = stroopColors.map((option, index) =>
    `<button data-mini-answer="${option.name}"><span>${index + 1}. </span>${option.name}</button>`
  ).join("");
}

function answerMiniGame(answer) {
  if (!miniActive || !currentMiniAnswer) return;
  const isMemoryRound = miniRound > 3 && miniRound % 4 === 0;
  if (answer === currentMiniAnswer) {
    session.miniScore += isMemoryRound ? 4 : 2;
  } else {
    session.miniScore = Math.max(0, session.miniScore - 1);
  }
  document.getElementById("miniScore").textContent = session.miniScore;
  nextStroopRound();
}

function scoreSession() {
  session.rough = document.getElementById("roughIdea").value.trim();
  session.final = document.getElementById("finalIdea").value.trim();
  const hasMaterial = session.final.includes(session.material);
  const avoidsBanned = !session.final.includes(session.banned);
  const enoughLength = session.final.length >= 60;
  const revised = session.rough && session.final && session.rough !== session.final;
  const points = [hasMaterial, avoidsBanned, enoughLength, revised].filter(Boolean).length;
  return { hasMaterial, avoidsBanned, enoughLength, revised, points };
}

function updateScorePreview() {
  const score = scoreSession();
  document.getElementById("scoreBox").innerHTML = [
    ["素材入り", score.hasMaterial],
    ["NG回避", score.avoidsBanned],
    ["60字以上", score.enoughLength],
    ["改稿あり", score.revised]
  ].map(([label, ok]) => `<span>${ok ? "OK" : "未達"} ${label}</span>`).join("");
}

function finishSession() {
  const score = scoreSession();
  if (!session.final) {
    showToast("最終案を入力してください。");
    return;
  }
  const todayKey = getLocalDateKey();
  const yesterday = getLocalDateKey(-1);
  if (state.lastPlayed !== todayKey) {
    state.streak = state.lastPlayed === yesterday ? state.streak + 1 : 1;
  }
  state.lastPlayed = todayKey;
  const earned = 20 + score.points * 10 + Math.min(20, Math.max(0, session.miniScore));
  state.coins += earned;
  if (score.hasMaterial && score.avoidsBanned) state.stats.constraintWins += 1;
  state.stats[session.mode] += 1;
  state.history.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: todayKey,
    mode: session.mode,
    mood: session.mood,
    prompt: session.prompt,
    material: session.material,
    constraint: session.constraint,
    banned: session.banned,
    rough: session.rough,
    final: session.final,
    score: score.points,
    coins: earned
  });
  unlockBadges();
  saveState();
  render();
  showToast(`${earned}コインを獲得しました。`);
  session = freshSession();
  drawCards();
  document.getElementById("roughIdea").value = "";
  document.getElementById("finalIdea").value = "";
  showStep("mood");
  switchView("home");
}

function unlockBadges() {
  badges.forEach(badge => {
    if (!state.unlockedBadges.includes(badge.id) && badge.condition(state)) {
      state.unlockedBadges.push(badge.id);
    }
  });
}

function renderHistory() {
  const wrap = document.getElementById("historyList");
  if (!state.history.length) {
    wrap.innerHTML = `<article class="panel"><h3>まだ履歴はありません</h3><p>今日の工房を完了すると、途中メモと最終案がここに残ります。</p></article>`;
    return;
  }
  wrap.innerHTML = state.history.map(item => `
    <details class="history-item">
      <summary>${item.date} ${modeLabel(item.mode)}: ${item.prompt}</summary>
      <p class="history-meta">素材: ${item.material} / 制約: ${item.constraint} / NG: ${item.banned} / ${item.coins}コイン</p>
      <div class="history-block"><strong>発想メモ</strong>\n${escapeHtml(item.rough || "")}</div>
      <div class="history-block"><strong>最終案</strong>\n${escapeHtml(item.final || "")}</div>
    </details>
  `).join("");
}

function renderRewards() {
  document.getElementById("badgeList").innerHTML = badges.map(badge => {
    const unlocked = state.unlockedBadges.includes(badge.id);
    return `<article class="reward-card ${unlocked ? "" : "is-locked"}"><h3>${unlocked ? "獲得" : "未獲得"} ${badge.label}</h3></article>`;
  }).join("");
  document.getElementById("themeShop").innerHTML = themes.map(theme => {
    const owned = state.ownedThemes.includes(theme.id);
    return `<button class="theme-card ${owned ? "is-owned" : ""}" data-theme="${theme.id}">
      <strong>${theme.label}</strong><br>
      <span>${owned ? "選択する" : `${theme.cost}コインで解放`}</span>
    </button>`;
  }).join("");
}

function buyOrSelectTheme(themeId) {
  const theme = themes.find(item => item.id === themeId);
  if (!theme) return;
  if (!state.ownedThemes.includes(themeId)) {
    if (state.coins < theme.cost) {
      showToast("コインが足りません。");
      return;
    }
    state.coins -= theme.cost;
    state.ownedThemes.push(themeId);
  }
  state.activeTheme = state.activeTheme === themeId ? "" : themeId;
  saveState();
  render();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

document.addEventListener("click", event => {
  const tab = event.target.closest("[data-view]");
  if (tab) switchView(tab.dataset.view);

  const go = event.target.closest("[data-go]");
  if (go) switchView(go.dataset.go);

  const mood = event.target.closest("[data-mood]");
  if (mood) {
    session.mood = mood.dataset.mood;
    drawCards();
    renderSessionBrief();
    showStep("cards");
  }

  if (event.target.id === "redrawCards") drawCards();
  if (event.target.id === "startMini") startMiniGame();
  if (event.target.id === "finishSession") finishSession();

  const next = event.target.closest("[data-next]");
  if (next) showStep(next.dataset.next);

  const answer = event.target.closest("[data-mini-answer]");
  if (answer) answerMiniGame(answer.dataset.miniAnswer);

  const theme = event.target.closest("[data-theme]");
  if (theme) buyOrSelectTheme(theme.dataset.theme);
});

document.getElementById("finalIdea").addEventListener("input", updateScorePreview);
document.getElementById("roughIdea").addEventListener("input", renderRoughIdeaPreview);
document.addEventListener("keydown", event => {
  if (!miniActive || !["1", "2", "3", "4"].includes(event.key)) return;
  const option = stroopColors[Number(event.key) - 1];
  if (option) answerMiniGame(option.name);
});

drawCards();
render();
renderSessionBrief();
renderRoughIdeaPreview();
showStep("mood");
