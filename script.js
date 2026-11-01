const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');
const messageEl = document.getElementById('message');

const keys = {};
const bullets = [];
const enemies = [];
const stars = [];

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 18,
  speed: 4.2,
  cooldown: 0,
};

const mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

let score = 0;
let health = 100;
let lastTime = 0;
let spawnTimer = 0;
let gameOver = false;

function createStars() {
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      speed: Math.random() * 0.8 + 0.2,
    });
  }
}

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = Math.random() * canvas.width;
    y = -30;
  } else if (side === 1) {
    x = canvas.width + 30;
    y = Math.random() * canvas.height;
  } else if (side === 2) {
    x = Math.random() * canvas.width;
    y = canvas.height + 30;
  } else {
    x = -30;
    y = Math.random() * canvas.height;
  }

  enemies.push({
    x,
    y,
    radius: 16 + Math.random() * 14,
    speed: 1 + Math.random() * 1.6,
    hue: Math.random() > 0.5 ? 345 : 190,
  });
}

function shoot() {
  if (gameOver || player.cooldown > 0) return;

  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  bullets.push({
    x: player.x,
    y: player.y,
    radius: 5,
    speed: 8.5,
    angle,
  });

  player.cooldown = 180;
}

function resetGame() {
  score = 0;
  health = 100;
  bullets.length = 0;
  enemies.length = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  gameOver = false;
  scoreEl.textContent = score;
  healthEl.textContent = health;
  messageEl.textContent = 'Move: WASD / Arrow keys • Fire: mouse click';
}

function update(delta) {
  if (gameOver) return;

  const moveX = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
  const moveY = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);

  player.x += moveX * player.speed * (delta / 16.67);
  player.y += moveY * player.speed * (delta / 16.67);

  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

  if (player.cooldown > 0) {
    player.cooldown -= delta;
  }

  for (const star of stars) {
    star.y += star.speed * (delta / 16.67);
    if (star.y > canvas.height) {
      star.y = -5;
      star.x = Math.random() * canvas.width;
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.x += Math.cos(bullet.angle) * bullet.speed * (delta / 16.67);
    bullet.y += Math.sin(bullet.angle) * bullet.speed * (delta / 16.67);

    if (
      bullet.x < -20 ||
      bullet.x > canvas.width + 20 ||
      bullet.y < -20 ||
      bullet.y > canvas.height + 20
    ) {
      bullets.splice(i, 1);
    }
  }

  spawnTimer -= delta;
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = 750 + Math.random() * 450;
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;

    enemy.x += (dx / distance) * enemy.speed * (delta / 16.67);
    enemy.y += (dy / distance) * enemy.speed * (delta / 16.67);

    if (distance < player.radius + enemy.radius) {
      enemies.splice(i, 1);
      health -= 10;
      healthEl.textContent = health;
      if (health <= 0) {
        health = 0;
        gameOver = true;
        messageEl.textContent = 'Game Over! Press R to restart';
        healthEl.textContent = health;
      }
      continue;
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      const bullet = bullets[j];
      const hitDistance = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);

      if (hitDistance < enemy.radius + bullet.radius) {
        bullets.splice(j, 1);
        enemies.splice(i, 1);
        score += 10;
        scoreEl.textContent = score;
        break;
      }
    }
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0c1420';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const star of stars) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.strokeStyle = '#64f5ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(mouse.x - player.x, mouse.y - player.y);
  ctx.stroke();

  ctx.fillStyle = '#2ff3ff';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0b1d2c';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBullets() {
  ctx.fillStyle = '#ffe76a';
  for (const bullet of bullets) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    ctx.fillStyle = `hsl(${enemy.hue}, 90%, 60%)`;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function draw() {
  drawBackground();
  drawPlayer();
  drawBullets();
  drawEnemies();

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 12);
  }
}

function animate(timestamp) {
  const delta = timestamp - lastTime || 16.67;
  lastTime = timestamp;

  update(delta);
  draw();
  requestAnimationFrame(animate);
}

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (gameOver && key === 'r') {
    resetGame();
  }
});

document.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
});

canvas.addEventListener('click', shoot);
canvas.addEventListener('mousedown', shoot);

createStars();
resetGame();
requestAnimationFrame(animate);
