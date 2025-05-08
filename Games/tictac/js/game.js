let boardState = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = true;
let winningLine = [];
let scores = { X: 0, O: 0, draw: 0 };

const winningConditions = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

const board = document.getElementById("board");
const statusDisplay = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const scoreX = document.getElementById("scoreX");
const scoreO = document.getElementById("scoreO");
const scoreDraw = document.getElementById("scoreDraw");

// Звуковые эффекты
const clickSound = new Audio('sounds/click.mp3');
const winSound = new Audio('sounds/win.mp3');
const drawSound = new Audio('sounds/draw.mp3');

// Безопасное воспроизведение звука
function playSoundSafely(sound) {
  try {
    sound.play().catch(err => {
      console.log("Не удалось воспроизвести звук:", err);
    });
  } catch (err) {
    console.log("Ошибка воспроизведения звука:", err);
  }
}

function createBoard() {
  board.innerHTML = "";
  boardState.forEach((cell, index) => {
    const cellDiv = document.createElement("div");
    cellDiv.classList.add("cell");
    if (cell === "X") cellDiv.classList.add("x");
    if (cell === "O") cellDiv.classList.add("o");
    
    // Добавляем класс winner для подсветки победной линии
    if (winningLine.includes(index)) {
      cellDiv.classList.add("winner");
    }
    
    cellDiv.setAttribute("data-index", index);
    cellDiv.innerText = cell;
    cellDiv.addEventListener("click", handleCellClick);
    board.appendChild(cellDiv);
  });
  updateStatus();
}

function checkWin() {
  for (let condition of winningConditions) {
    const [a, b, c] = condition;
    if (
      boardState[a] &&
      boardState[a] === boardState[b] &&
      boardState[a] === boardState[c]
    ) {
      gameActive = false;
      winningLine = [a, b, c];
      return boardState[a];
    }
  }
  return "";
}

function handleCellClick(e) {
  const index = e.target.getAttribute("data-index");
  if (boardState[index] || !gameActive) return;
  
  // Используем безопасное воспроизведение звука
  playSoundSafely(clickSound);
  boardState[index] = currentPlayer;
  const winner = checkWin();
  
  if (winner) {
    statusDisplay.innerText = `Победитель: ${winner}`;
    scores[winner]++;
    updateScoreDisplay();
    // Используем безопасное воспроизведение звука
    playSoundSafely(winSound);
  } else if (!boardState.includes("")) {
    statusDisplay.innerText = "Ничья!";
    gameActive = false;
    scores.draw++;
    updateScoreDisplay();
    // Используем безопасное воспроизведение звука
    playSoundSafely(drawSound);
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
  }
  
  createBoard();
}

function updateStatus() {
  if (gameActive) {
    statusDisplay.innerText = `Ход игрока: ${currentPlayer}`;
    statusDisplay.style.color = currentPlayer === "X" ? "#e74c3c" : "#3498db";
  }
}

function updateScoreDisplay() {
  scoreX.innerText = scores.X;
  scoreO.innerText = scores.O;
  scoreDraw.innerText = scores.draw;
}

function restartGame() {
  boardState = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  gameActive = true;
  winningLine = [];
  createBoard();
}

restartBtn.addEventListener("click", restartGame);

// Инициализация игры
createBoard();

// Сохранение счета в локальное хранилище
function saveScores() {
  localStorage.setItem('tictactoe-scores', JSON.stringify(scores));
}

// Загрузка счета из локального хранилища при запуске
function loadScores() {
  const savedScores = localStorage.getItem('tictactoe-scores');
  if (savedScores) {
    scores = JSON.parse(savedScores);
    updateScoreDisplay();
  }
}

// Сохраняем счет перед закрытием страницы
window.addEventListener('beforeunload', saveScores);

// Загружаем счет при запуске
loadScores(); 