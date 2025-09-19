const game = document.getElementById('game');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const message = document.getElementById('message');
const restartBtn = document.getElementById('restart');

let gameWidth = window.innerWidth;
let gameHeight = window.innerHeight;

let playerY = 0;
let velocityY = 0;
const gravity = 1.1;
const jumpForce = 18;
let isOnGround = true;

let obstacles = [];
let bonusStars = [];
let baseObstacleSpeed = 8;
let obstacleSpeed = baseObstacleSpeed;

let score = 0;
let distanceTraveled = 0;
let highScore = localStorage.getItem("highScore") || 0;

let gameOver = false;
let lastObstacleTime = 0;
const minObstacleInterval = 800;
const maxObstacleInterval = 2000;

const obstacleColors = [
  '#FF3344', '#FFAA33', '#33FF88', '#33Aaff',
  '#aa33ff', '#ff33cc', '#44ff99', '#ff6666',
  '#33ffaa', '#00ffff', '#ffcc00'
];

let rotation = 0;
let rotating = false;

function updateGameDimensions() {
  gameWidth = window.innerWidth;
  gameHeight = window.innerHeight;
}
window.addEventListener('resize', updateGameDimensions);

function jump() {
  if (gameOver) return;
  if (isOnGround) {
    velocityY = jumpForce;
    isOnGround = false;
    if (!rotating) {
      rotating = true;
      rotation += 90;
      player.style.transition = "transform 0.25s linear";
      player.style.transform = `rotate(${rotation - 15}deg)`;
      setTimeout(() => {
        player.style.transition = "transform 0.3s ease-out";
        player.style.transform = `rotate(${rotation}deg)`;
        setTimeout(() => { rotating = false; }, 300);
      }, 250);
    }
  }
}

function createObstacle() {
  const chance = Math.random();
  let stackCount;
  if (chance < 0.7) {
    stackCount = Math.floor(Math.random() * 2) + 1;
  } else {
    stackCount = 3;
  }

  const baseHeight = 35;
  const baseWidth = 25 + Math.random() * 25;
  let obstacleGroup = document.createElement('div');
  obstacleGroup.style.position = 'absolute';
  obstacleGroup.style.right = '0px';
  obstacleGroup.style.bottom = '0px';
  obstacleGroup.style.width = baseWidth + 'px';
  obstacleGroup.style.height = (baseHeight * stackCount) + 'px';
  obstacleGroup.style.pointerEvents = 'none';

  const color = obstacleColors[Math.floor(Math.random() * obstacleColors.length)];

  for (let i = 0; i < stackCount; i++) {
    let block = document.createElement('div');
    block.classList.add('obstacle');
    block.style.width = baseWidth + 'px';
    block.style.height = baseHeight + 'px';
    block.style.position = 'absolute';
    block.style.bottom = (i * baseHeight) + 'px';
    block.style.left = '0';
    block.style.backgroundColor = color;
    block.style.boxShadow = `0 0 8px ${color}`;
    obstacleGroup.appendChild(block);
  }

  game.appendChild(obstacleGroup);
  obstacles.push(obstacleGroup);

  if (Math.random() < 0.25 && stackCount <= 3) {
    createBonusStar(baseWidth, stackCount * baseHeight);
  }
}

function createBonusStar(width, heightAboveGround) {
  const star = document.createElement('div');
  star.classList.add('star');
  star.style.position = 'absolute';
  star.style.width = '20px';
  star.style.height = '20px';
  star.style.right = '0px';
  star.style.bottom = `${heightAboveGround + 20}px`;
  game.appendChild(star);
  bonusStars.push(star);
}

function isColliding(a, b, padding = 6) {
  return !(
    a.right - padding < b.left + padding ||
    a.left + padding > b.right - padding ||
    a.bottom - padding < b.top + padding ||
    a.top + padding > b.bottom - padding
  );
}

function update(timestamp) {
  if (gameOver) return;

  if (!isOnGround) {
    velocityY -= gravity;
    playerY += velocityY;
    if (playerY <= 0) {
      playerY = 0;
      isOnGround = true;
      velocityY = 0;
    }
    player.style.bottom = playerY + 'px';
  }

  distanceTraveled += obstacleSpeed / 100;
  score = Math.floor(distanceTraveled);
  scoreDisplay.textContent = `Score: ${score}  |  High Score: ${highScore}`;

  obstacleSpeed = baseObstacleSpeed + score * 0.04;

  const playerRect = player.getBoundingClientRect();

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obsGroup = obstacles[i];
    let currentRight = parseFloat(obsGroup.style.right);
    currentRight += obstacleSpeed;
    obsGroup.style.right = currentRight + 'px';

    if (currentRight > gameWidth + 50) {
      obsGroup.remove();
      obstacles.splice(i, 1);
    } else {
      for (let block of obsGroup.children) {
        const blockRect = block.getBoundingClientRect();
        if (isColliding(playerRect, blockRect)) {
          endGame();
          return;
        }
      }
    }
  }

  for (let i = bonusStars.length - 1; i >= 0; i--) {
    let star = bonusStars[i];
    let currentRight = parseFloat(star.style.right);
    currentRight += obstacleSpeed;
    star.style.right = currentRight + 'px';

    const starRect = star.getBoundingClientRect();
    if (isColliding(playerRect, starRect, 4)) {
      score += 5;
      distanceTraveled += 5;
      game.removeChild(star);
      bonusStars.splice(i, 1);
    } else if (currentRight > gameWidth + 50) {
      game.removeChild(star);
      bonusStars.splice(i, 1);
    }
  }

  if (!lastObstacleTime) lastObstacleTime = timestamp;
  if (timestamp - lastObstacleTime > minObstacleInterval) {
    if (timestamp - lastObstacleTime > maxObstacleInterval || Math.random() < 0.02) {
      createObstacle();
      lastObstacleTime = timestamp;
    }
  }

  requestAnimationFrame(update);
}

function endGame() {
  gameOver = true;
  showMessage(`Game Over! Your score: ${score}`);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    showMessage(`New High Score! ${score}`);
  }
  restartBtn.style.display = 'block';
}

function showMessage(text) {
  message.textContent = text;
  message.style.opacity = '1';
  setTimeout(() => { message.style.opacity = '0'; }, 4000);
}

function enableGameplay() {
  window.addEventListener('keydown', keyHandler);
  window.addEventListener('mousedown', jump);
  window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
  }, { passive: false });
}

function keyHandler(e) {
  if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
    e.preventDefault();
    jump();
  }
}

restartBtn.addEventListener('click', () => {
  location.reload();
});

function startGame() {
  enableGameplay();
  showMessage("WELCOME TO THE WORLD OF BLOCKS");
  requestAnimationFrame(update);
}

player.style.bottom = '0px';
scoreDisplay.textContent = `Score: ${score}`;
updateGameDimensions();
startGame();
