(() => {
  "use strict";

  const world = document.getElementById("gameWorld");
  const player = document.getElementById("player");
  const obstaclesLayer = document.getElementById("obstacles");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const livesEl = document.getElementById("lives");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const startBtn = document.getElementById("startBtn");
  const soundBtn = document.getElementById("soundBtn");

  let running = false;
  let paused = false;
  let score = 0;
  let lives = 3;
  let best = Number(localStorage.getItem("veeramaniTankJumpBest") || 0);
  let playerY = 0;
  let velocityY = 0;
  let isJumping = false;
  let speed = 260;
  let spawnTimer = 0;
  let nextSpawn = 1.25;
  let lastTime = 0;
  let obstacles = [];
  let soundOn = false;
  let audioContext = null;
  let invulnerableUntil = 0;

  bestEl.textContent = formatScore(best);

  function formatScore(value) { return String(Math.floor(value)).padStart(5, "0"); }

  function makeTank() {
    const tank = document.createElement("div");
    tank.className = "tank";
    tank.innerHTML = '<div class="barrel"></div><div class="turret"></div><div class="hull"></div><div class="star">★</div><div class="tracks"></div>';
    obstaclesLayer.appendChild(tank);
    const width = world.clientWidth;
    const item = { el: tank, x: width + 20, width: 92, passed: false };
    tank.style.left = item.x + "px";
    obstacles.push(item);
  }

  function resetGame() {
    score = 0; lives = 3; playerY = 0; velocityY = 0; isJumping = false;
    speed = 260; spawnTimer = 0; nextSpawn = 1.25; invulnerableUntil = 0;
    obstacles.forEach(o => o.el.remove());
    obstacles = [];
    player.style.bottom = "68px";
    player.classList.remove("jumping");
    player.style.opacity = "1";
    updateHUD();
  }

  function startGame() {
    resetGame();
    running = true; paused = false;
    overlay.classList.add("hidden");
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;
    overlay.classList.remove("hidden");
    overlayTitle.textContent = "Game over!";
    overlayText.textContent = `You scored ${score}. ${score > best ? "New high score! " : ""}Ready for another run?`;
    startBtn.textContent = "↻ Play again";
    playTone(170, .16);
  }

  function updateHUD() {
    scoreEl.textContent = formatScore(score);
    livesEl.textContent = "♥ ".repeat(lives).trim() + (lives < 3 ? " ♡".repeat(3-lives) : "");
    livesEl.setAttribute("aria-label", lives + " lives remaining");
    if (score > best) {
      best = score;
      bestEl.textContent = formatScore(best);
      localStorage.setItem("veeramaniTankJumpBest", String(best));
    }
  }

  function jump() {
    if (!running) return;
    if (paused) return;
    if (!isJumping) {
      isJumping = true;
      velocityY = 650;
      player.classList.add("jumping");
      playTone(460, .07);
    }
  }

  function playTone(frequency, duration) {
    if (!soundOn) return;
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = "square";
      gain.gain.value = .045;
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (_) { /* sound is optional */ }
  }

  function rectanglesOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function checkCollisions(now) {
    const p = player.getBoundingClientRect();
    // Smaller hitbox makes the game feel fairer than the full transparent image.
    const hero = { left:p.left+18, right:p.right-14, top:p.top+15, bottom:p.bottom-4 };
    for (const obstacle of obstacles) {
      const r = obstacle.el.getBoundingClientRect();
      const tank = { left:r.left+5, right:r.right-3, top:r.top+8, bottom:r.bottom-1 };
      if (rectanglesOverlap(hero, tank) && now > invulnerableUntil) {
        lives -= 1;
        invulnerableUntil = now + 900;
        updateHUD();
        playTone(120, .22);
        if (lives <= 0) { endGame(); return; }
        // brief visual feedback after losing a life
        player.style.opacity = ".35";
        window.setTimeout(() => { if (running) player.style.opacity = "1"; }, 180);
        break;
      }
    }
  }

  function loop(now) {
    if (!running) return;
    if (paused) { lastTime = now; requestAnimationFrame(loop); return; }
    const dt = Math.min((now - lastTime) / 1000, .035);
    lastTime = now;

    // Jump physics
    if (isJumping) {
      playerY += velocityY * dt;
      velocityY -= 1550 * dt;
      if (playerY <= 0) {
        playerY = 0; velocityY = 0; isJumping = false;
        player.classList.remove("jumping");
      }
      player.style.bottom = (68 + playerY) + "px";
    }

    // Increase difficulty gradually, while keeping the first few seconds approachable.
    speed = Math.min(430, 260 + score * 1.3);
    spawnTimer += dt;
    if (spawnTimer >= nextSpawn) {
      makeTank();
      spawnTimer = 0;
      nextSpawn = 1.15 + Math.random() * .8 - Math.min(score / 500, .25);
    }

    for (const obstacle of obstacles) {
      obstacle.x -= speed * dt;
      obstacle.el.style.left = obstacle.x + "px";
      if (!obstacle.passed && obstacle.x + obstacle.width < world.clientWidth * .09) {
        obstacle.passed = true;
        score += 1;
        updateHUD();
        playTone(700, .045);
      }
    }
    obstacles = obstacles.filter(o => {
      if (o.x < -110) { o.el.remove(); return false; }
      return true;
    });

    checkCollisions(now);
    if (running) requestAnimationFrame(loop);
  }

  startBtn.addEventListener("click", startGame);
  world.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    jump();
  });
  window.addEventListener("keydown", (event) => {
    if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
      event.preventDefault();
      if (!running) startGame(); else jump();
    }
    if (event.code === "KeyP" && running) {
      paused = !paused;
      overlay.classList.toggle("hidden", !paused);
      if (paused) {
        overlayTitle.textContent = "Paused";
        overlayText.textContent = "Take a breather. Your run is waiting.";
        startBtn.textContent = "▶ Resume";
        startBtn.onclick = () => { paused = false; overlay.classList.add("hidden"); lastTime = performance.now(); requestAnimationFrame(loop); startBtn.onclick = null; };
      } else {
        lastTime = performance.now();
        requestAnimationFrame(loop);
      }
    }
    if (event.code === "KeyR") startGame();
  });
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? "🔊 Sound: on" : "🔇 Sound: off";
    soundBtn.setAttribute("aria-pressed", String(soundOn));
    if (soundOn) playTone(520, .08);
  });

  // If the image fails to load, the game remains playable with a simple silhouette.
  document.getElementById("heroImage").addEventListener("error", (event) => {
    event.currentTarget.style.display = "none";
    player.classList.add("fallback-hero");
    player.style.background = "linear-gradient(90deg,#182a3c,#5b392b,#182a3c)";
    player.style.borderRadius = "28px 28px 8px 8px";
    player.style.border = "3px solid #182a3c";
  });
})();
