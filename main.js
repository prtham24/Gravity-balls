const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

const hitSound = new Audio('hit.wav');
const coll = new Audio('collide.mp3');
const loss = new Audio('loss.wav');
const bg = new Audio('bg.mp3');

bg.loop = true;

let isMuted = false;
let score = 0;
let lastBurstColor = null;
let animId;
let balls = [];
const colors = ['#0011ffff', '#39FF14', '#FF69B4', '#FFD300', '#ff0000ff'];

document.addEventListener('DOMContentLoaded', () => {
  const muteBtn = document.getElementById('muteBtn');
  muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
    bg.muted = isMuted;
  });
});

function startBackgroundMusic() {
  if (bg.paused && !isMuted) {
    bg.play().catch(() => {}); 
    }
}

canvas.addEventListener('click', () => {
  startBackgroundMusic();
});

canvas.addEventListener('click', (e) => {
  const x = e.clientX;
  const y = e.clientY;
  const radius = 20 + Math.random() * 20;
  const color = colors[Math.floor(Math.random() * colors.length)];
  balls.push({ x, y, vx: (Math.random() - 0.5) * 8, vy: 10 * Math.random(), radius, color, hitFloor: false });
});

function playSound(sound) {
  if (!isMuted) {
    const s = sound.cloneNode();
    s.play();
  }
}

function gameOver() {
  document.getElementById('finalScore').innerText = `Your Score: ${score}`;
  document.getElementById('gameOverScreen').style.display = 'block';
  cancelAnimationFrame(animId);
  playSound(loss);
}

function animate() {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "36px 'Courier New', monospace";
  ctx.fillStyle = "#00D100";
  ctx.fillText(`Score: ${score}`, 20, 40);

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const ballA = balls[i];
      const ballB = balls[j];
      const dx = ballB.x - ballA.x;
      const dy = ballB.y - ballA.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < ballA.radius + ballB.radius) {
        if (ballA.color === ballB.color) {
          score++;
          if (lastBurstColor === ballA.color) {
            gameOver();
            balls = [];
            lastBurstColor = null;
            return;
          } else {
            lastBurstColor = ballA.color;
            playSound(coll);
          }
          balls.splice(j, 1);
          balls.splice(i, 1);
          i--;
          break;
        } else {
          resolveCollision(ballA, ballB);
          playSound(hitSound);
        }
      }
    }
  }

  balls.forEach(ball => {
    ball.vy += gravity;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y + ball.radius > canvas.height) {
      ball.y = canvas.height - ball.radius;
      ball.vy = -ball.vy * friction;
      if (!ball.hitFloor) {
        playSound(hitSound);
        ball.hitFloor = true;
      }
    }
    if (ball.x + ball.radius > canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.vx = -ball.vx * friction;
    }
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = -ball.vx * friction;
    }

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
  });

  animId = requestAnimationFrame(animate);
}

function resolveCollision(ballA, ballB) {
  const xVelocityDiff = ballA.vx - ballB.vx;
  const yVelocityDiff = ballA.vy - ballB.vy;
  const xDist = ballB.x - ballA.x;
  const yDist = ballB.y - ballA.y;

  if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
    const angle = -Math.atan2(ballB.y - ballA.y, ballB.x - ballA.x);
    const m1 = ballA.radius ** 2;
    const m2 = ballB.radius ** 2;

    const u1 = rotate({ x: ballA.vx, y: ballA.vy }, angle);
    const u2 = rotate({ x: ballB.vx, y: ballB.vy }, angle);

    const v1 = {
      x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2),
      y: u1.y
    };
    const v2 = {
      x: u2.x * (m2 - m1) / (m1 + m2) + u1.x * 2 * m1 / (m1 + m2),
      y: u2.y
    };

    const vFinal1 = rotate(v1, -angle);
    const vFinal2 = rotate(v2, -angle);

    ballA.vx = vFinal1.x;
    ballA.vy = vFinal1.y;
    ballB.vx = vFinal2.x;
    ballB.vy = vFinal2.y;
    playSound(hitSound);
  }
}

function rotate(velocity, angle) {
  return {
    x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
    y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
  };
}

const gravity = 0.6;
const friction = 0.75;

animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
