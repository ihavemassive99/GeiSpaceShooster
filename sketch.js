// Game state constants
const STATE_START = 0;
const STATE_PLAYING = 1;
const STATE_GAMEOVER = 2;

// Global variables
let gameState;
let player;
let enemies = [];
let projectiles = [];
let powerUps = [];
let particles = [];
let score = 0;
let lives = 3;
let stars = [];
let galaxies = []; // Add galaxies array
let lastSpawnTime = 0;
let spawnInterval = 1000; // milliseconds
let lastShootTime = 0;
let shootInterval = 500; // milliseconds
let waitingForKeyRelease = false;

// Power-up durations and states
let speedBoostActive = false;
let rapidFireActive = false;
let lastPowerUpTime = 0;
let powerUpInterval = 10000; // Power-up spawn every 10 seconds
let powerUpDuration = 5000; // Power-ups last 5 seconds

// Visual effects
let engineGlow = 0;

function setup() {
  createCanvas(800, 600);
  generateStars();
  gameState = STATE_START;
  // Enable smooth edges
  smooth();
  // Initialize player
  player = new Player(width / 2, height - 50);
}

function draw() {
  background(0); // Black background

  if (gameState === STATE_START) {
    drawStartScreen();
    if (!waitingForKeyRelease && keyIsPressed) {
      resetGame();
      gameState = STATE_PLAYING;
      waitingForKeyRelease = true;
    }
  } else if (gameState === STATE_PLAYING) {
    drawStars();
    player.update();
    player.draw();
    updateProjectiles();
    drawProjectiles();
    spawnEnemies();
    updateEnemies();
    drawEnemies();
    spawnPowerUps();
    updatePowerUps();
    drawPowerUps();
    checkCollisions();
    displayUI();
    updatePowerUpEffects();
    updateParticles();
    if (lives <= 0) {
      gameState = STATE_GAMEOVER;
      waitingForKeyRelease = true;
    }
  } else if (gameState === STATE_GAMEOVER) {
    drawGameOverScreen();
    if (!waitingForKeyRelease && keyIsPressed) {
      resetGame();
      gameState = STATE_PLAYING;
      waitingForKeyRelease = true;
    }
  }

  // Handle key release for state transitions
  if (waitingForKeyRelease && !keyIsPressed) {
    waitingForKeyRelease = false;
  }
}

// Generate background stars and galaxies with different depths
function generateStars() {
  stars = [];
  galaxies = [];
  
  // Generate stars
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 4),
      speed: random(0.5, 2),
      brightness: random(100, 255)
    });
  }
  
  // Generate galaxies
  let galaxyColors = [
    { main: color(255, 100, 150), glow: '#ff6488' }, // Pink
    { main: color(100, 150, 255), glow: '#6496ff' }, // Blue
    { main: color(150, 100, 255), glow: '#9664ff' }, // Purple
    { main: color(255, 150, 100), glow: '#ff9664' }  // Orange
  ];
  
  for (let i = 0; i < 4; i++) {
    galaxies.push({
      x: random(width),
      y: random(height),
      width: random(100, 200),
      height: random(60, 120),
      rotation: random(TWO_PI),
      speed: random(0.1, 0.3),
      color: galaxyColors[i].main,
      glowColor: galaxyColors[i].glow,
      particleCount: floor(random(15, 25)),
      particles: []
    });
    
    // Generate particles for each galaxy
    for (let j = 0; j < galaxies[i].particleCount; j++) {
      let angle = random(TWO_PI);
      let dist = random(galaxies[i].width/4);
      galaxies[i].particles.push({
        x: cos(angle) * dist,
        y: sin(angle) * dist,
        size: random(2, 4),
        angle: random(TWO_PI),
        speed: random(0.001, 0.003),
        distance: dist
      });
    }
  }
}

// Draw background stars and galaxies with parallax effect
function drawStars() {
  // Draw galaxies
  for (let galaxy of galaxies) {
    push();
    translate(galaxy.x, galaxy.y);
    rotate(galaxy.rotation);
    
    // Draw galaxy glow
    drawingContext.shadowBlur = 30;
    drawingContext.shadowColor = galaxy.glowColor;
    
    // Main galaxy ellipse with gradient
    for (let i = 0; i < 3; i++) {
      let c = color(galaxy.color);
      c.setAlpha(50 - i * 15);
      fill(c);
      noStroke();
      ellipse(0, 0, galaxy.width + i * 20, galaxy.height + i * 15);
    }
    
    // Draw galaxy core
    let coreColor = color(galaxy.color);
    coreColor.setAlpha(100);
    fill(coreColor);
    ellipse(0, 0, galaxy.width/2, galaxy.height/2);
    
    // Draw galaxy particles
    for (let particle of galaxy.particles) {
      // Update particle position
      particle.angle += particle.speed;
      particle.x = cos(particle.angle) * particle.distance;
      particle.y = sin(particle.angle) * particle.distance;
      
      // Draw particle
      fill(255, 255, 255, 150);
      circle(particle.x, particle.y, particle.size);
    }
    
    pop();
    
    // Move galaxy
    galaxy.y += galaxy.speed;
    galaxy.rotation += 0.001;
    
    // Reset galaxy position when it goes off screen
    if (galaxy.y > height + galaxy.height) {
      galaxy.y = -galaxy.height;
      galaxy.x = random(width);
    }
  }
  
  // Draw stars on top of galaxies
  noStroke();
  for (let star of stars) {
    fill(star.brightness);
    circle(star.x, star.y, star.size);
    // Move stars for parallax effect
    star.y += star.speed;
    // Reset stars when they go off screen
    if (star.y > height) {
      star.y = 0;
      star.x = random(width);
    }
  }
}

// Reset game variables
function resetGame() {
  player = new Player(width / 2, height - 50);
  enemies = [];
  projectiles = [];
  powerUps = [];
  score = 0;
  lives = 3;
  lastSpawnTime = millis();
  lastShootTime = millis();
  lastPowerUpTime = millis();
  speedBoostActive = false;
  rapidFireActive = false;
}

// Draw start screen
function drawStartScreen() {
  textAlign(CENTER);
  textSize(32);
  fill(255);
  text("Space Shooting Game", width / 2, height / 2 - 20);
  textSize(24);
  text("Press any key to start", width / 2, height / 2 + 20);
}

// Draw game over screen
function drawGameOverScreen() {
  textAlign(CENTER);
  textSize(32);
  fill(255);
  text("Game Over", width / 2, height / 2 - 40);
  text("Your score: " + score, width / 2, height / 2);
  textSize(24);
  text("Press any key to restart", width / 2, height / 2 + 40);
}

// Update all projectiles
function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    projectiles[i].update();
    if (projectiles[i].isOffScreen()) {
      projectiles.splice(i, 1);
    }
  }
}

// Draw all projectiles
function drawProjectiles() {
  for (let p of projectiles) {
    p.draw();
  }
}

// Spawn new enemies at intervals
function spawnEnemies() {
  if (millis() - lastSpawnTime > spawnInterval) {
    // Enhanced enemy type selection
    let rand = random(100);
    let type;
    if (rand < 5) { // 5% chance for boss
      type = 'boss';
    } else if (rand < 20) { // 15% chance for tank
      type = 'tank';
    } else if (rand < 40) { // 20% chance for scout
      type = 'scout';
    } else if (rand < 70) { // 30% chance for spaceship
      type = 'spaceship';
    } else { // 30% chance for asteroid
      type = 'asteroid';
    }
    
    let x = random(20, width - 20);
    let size, speed, health;
    
    switch(type) {
      case 'boss':
        size = 60;
        speed = 1;
        health = 5;
        break;
      case 'tank':
        size = 40;
        speed = 0.5;
        health = 3;
        break;
      case 'scout':
        size = 15;
        speed = 3;
        health = 1;
        break;
      case 'spaceship':
        size = 20;
        speed = 2;
        health = 1;
        break;
      case 'asteroid':
        size = random(20, 40);
        speed = random(1, 3);
        health = 1;
        break;
    }
    
    enemies.push(new Enemy(x, 0, type, size, speed, health));
    lastSpawnTime = millis();
  }
}

// Update all enemies
function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
    if (enemies[i].isOffScreen()) {
      enemies.splice(i, 1);
    }
  }
}

// Draw all enemies
function drawEnemies() {
  for (let e of enemies) {
    e.draw();
  }
}

// Spawn power-ups
function spawnPowerUps() {
  if (millis() - lastPowerUpTime > powerUpInterval) {
    let type = random(['speed', 'rapid-fire', 'shield']);
    let x = random(20, width - 20);
    powerUps.push(new PowerUp(x, 0, type));
    lastPowerUpTime = millis();
  }
}

// Update power-ups
function updatePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    powerUps[i].update();
    if (powerUps[i].isOffScreen()) {
      powerUps.splice(i, 1);
    }
  }
}

// Draw power-ups
function drawPowerUps() {
  for (let p of powerUps) {
    p.draw();
  }
}

// Update power-up effects
function updatePowerUpEffects() {
  if (speedBoostActive && millis() - player.speedBoostStart > powerUpDuration) {
    player.speed = 5; // Reset speed
    speedBoostActive = false;
  }
  if (rapidFireActive && millis() - player.rapidFireStart > powerUpDuration) {
    shootInterval = 500; // Reset fire rate
    rapidFireActive = false;
  }
}

// Check for collisions
function checkCollisions() {
  // Player-enemy collisions
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (collideCircleCircle(player.x, player.y, player.radius * 2, enemies[i].x, enemies[i].y, enemies[i].radius * 2)) {
      lives--;
      if (enemies[i].type !== 'boss') {
        createExplosion(enemies[i].x, enemies[i].y, '#ff0000');
        enemies.splice(i, 1);
      }
      if (lives <= 0) {
        createExplosion(player.x, player.y, '#ff0000');
        break;
      }
    }
  }

  // Projectile-enemy collisions
  for (let p = projectiles.length - 1; p >= 0; p--) {
    for (let e = enemies.length - 1; e >= 0; e--) {
      if (collideCircleCircle(projectiles[p].x, projectiles[p].y, projectiles[p].radius * 2, enemies[e].x, enemies[e].y, enemies[e].radius * 2)) {
        createExplosion(projectiles[p].x, projectiles[p].y, '#ffff00');
        if (enemies[e].type === 'boss') {
          enemies[e].health--;
          if (enemies[e].health <= 0) {
            createExplosion(enemies[e].x, enemies[e].y, '#ff0000');
            score += 50;
            enemies.splice(e, 1);
          }
        } else {
          score += enemies[e].type === 'spaceship' ? 10 : 5;
          createExplosion(enemies[e].x, enemies[e].y, enemies[e].type === 'spaceship' ? '#00ff00' : '#666666');
          enemies.splice(e, 1);
        }
        projectiles.splice(p, 1);
        break;
      }
    }
  }

  // Player-powerup collisions
  for (let i = powerUps.length - 1; i >= 0; i--) {
    if (collideCircleCircle(player.x, player.y, player.radius * 2, powerUps[i].x, powerUps[i].y, powerUps[i].radius * 2)) {
      activatePowerUp(powerUps[i].type);
      powerUps.splice(i, 1);
    }
  }
}

// Activate power-up effects
function activatePowerUp(type) {
  switch (type) {
    case 'speed':
      player.speed = 8; // Increase speed
      player.speedBoostStart = millis();
      speedBoostActive = true;
      break;
    case 'rapid-fire':
      shootInterval = 200; // Decrease shooting interval
      player.rapidFireStart = millis();
      rapidFireActive = true;
      break;
    case 'shield':
      lives++; // Add an extra life
      break;
  }
}

// Create explosion particles
function createExplosion(x, y, color) {
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(x, y, color));
  }
}

// Update and draw particles
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
}

// Particle class for explosions
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vel = createVector(random(-1, 1), random(-1, 1)).mult(random(2, 5));
    this.alpha = 255;
    this.life = 255;
  }

  update() {
    this.x += this.vel.x;
    this.y += this.vel.y;
    this.vel.mult(0.95);
    this.life -= 10;
    this.alpha = this.life;
  }

  draw() {
    noStroke();
    let c = color(this.color);
    c.setAlpha(this.alpha);
    fill(c);
    circle(this.x, this.y, 4);
  }

  isDead() {
    return this.life < 0;
  }
}

// Draw all objects with glow effects
function drawWithGlow(drawFunc, glowColor, glowSize) {
  drawingContext.shadowBlur = glowSize;
  drawingContext.shadowColor = glowColor;
  drawFunc();
  drawingContext.shadowBlur = 0;
}

// Player class with enhanced visuals
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 20;
    this.speed = 5;
    this.radius = 15;
    this.speedBoostStart = 0;
    this.rapidFireStart = 0;
    this.engineGlowIntensity = 0;
  }

  draw() {
    // Update engine glow
    this.engineGlowIntensity = (this.engineGlowIntensity + 0.1) % TWO_PI;
    let glowSize = 5 + sin(this.engineGlowIntensity) * 3;

    // Draw engine glow and thrust
    drawWithGlow(() => {
      // Main thrust
      fill(255, 100, 0, 150);
      beginShape();
      vertex(this.x, this.y + this.height/2 + 8);
      vertex(this.x - 8, this.y + this.height/2);
      vertex(this.x, this.y + this.height/2 + 2);
      vertex(this.x + 8, this.y + this.height/2);
      endShape(CLOSE);
      
      // Side thrusters
      fill(255, 150, 0, 100);
      triangle(
        this.x - this.width/2, this.y + this.height/3,
        this.x - this.width/2 - 5, this.y + this.height/2,
        this.x - this.width/2 + 3, this.y + this.height/2
      );
      triangle(
        this.x + this.width/2, this.y + this.height/3,
        this.x + this.width/2 + 5, this.y + this.height/2,
        this.x + this.width/2 - 3, this.y + this.height/2
      );
    }, '#ff6600', glowSize);

    // Draw ship with glow
    drawWithGlow(() => {
      // Wings
      fill(150, 0, 0);
      beginShape();
      vertex(this.x - this.width/2 - 10, this.y + this.height/3);
      vertex(this.x - this.width/2, this.y - this.height/4);
      vertex(this.x - this.width/4, this.y);
      vertex(this.x - this.width/4, this.y + this.height/2);
      endShape(CLOSE);
      
      beginShape();
      vertex(this.x + this.width/2 + 10, this.y + this.height/3);
      vertex(this.x + this.width/2, this.y - this.height/4);
      vertex(this.x + this.width/4, this.y);
      vertex(this.x + this.width/4, this.y + this.height/2);
      endShape(CLOSE);

      // Main body
      fill(200, 0, 0);
      beginShape();
      vertex(this.x, this.y - this.height/2 - 5);
      vertex(this.x - this.width/4, this.y);
      vertex(this.x - this.width/6, this.y + this.height/2);
      vertex(this.x + this.width/6, this.y + this.height/2);
      vertex(this.x + this.width/4, this.y);
      endShape(CLOSE);

      // Cockpit
      drawWithGlow(() => {
        fill(100, 200, 255);
        beginShape();
        vertex(this.x, this.y - this.height/4);
        vertex(this.x - this.width/6, this.y);
        vertex(this.x, this.y + this.height/6);
        vertex(this.x + this.width/6, this.y);
        endShape(CLOSE);
      }, '#00ffff', 5);

      // Detail lines
      stroke(255, 0, 0);
      strokeWeight(1);
      line(this.x - this.width/4, this.y, this.x - this.width/6, this.y + this.height/3);
      line(this.x + this.width/4, this.y, this.x + this.width/6, this.y + this.height/3);
      noStroke();
    }, '#ff0000', 10);

    // Power-up visual effects
    if (speedBoostActive) {
      drawWithGlow(() => {
        fill(0, 255, 255, 100);
        circle(this.x, this.y, this.radius * 3);
      }, '#00ffff', 15);
    }
    if (rapidFireActive) {
      drawWithGlow(() => {
        fill(255, 255, 0, 100);
        circle(this.x, this.y, this.radius * 2.5);
      }, '#ffff00', 15);
    }
  }

  update() {
    // Movement controls
    if (keyIsDown(LEFT_ARROW)) {
      this.x -= this.speed;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.x += this.speed;
    }
    if (keyIsDown(UP_ARROW)) {
      this.y -= this.speed;
    }
    if (keyIsDown(DOWN_ARROW)) {
      this.y += this.speed;
    }

    // Constrain player within canvas
    this.x = constrain(this.x, this.width / 2, width - this.width / 2);
    this.y = constrain(this.y, this.height / 2, height - this.height / 2);

    // Shooting with cooldown (space key = 32)
    if (keyIsDown(32) && millis() - lastShootTime > shootInterval) {
      this.shoot();
      lastShootTime = millis();
    }
  }

  shoot() {
    projectiles.push(new Projectile(this.x, this.y - this.height / 2));
  }
}

// Enemy class with enhanced visuals
class Enemy {
  constructor(x, y, type, size, speed, health) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = size;
    this.speed = speed;
    this.radius = size/2;
    this.health = health;
    this.rotation = 0;
    this.oscillation = random(TWO_PI); // For scout movement
  }

  draw() {
    this.rotation += 0.02;
    
    if (this.type === 'tank') {
      drawWithGlow(() => {
        push();
        translate(this.x, this.y);
        rotate(PI);
        
        // Heavy armor plating
        fill(100, 100, 150);
        beginShape();
        vertex(-this.size/2 - 5, this.size/2);
        vertex(-this.size/2, -this.size/2);
        vertex(this.size/2, -this.size/2);
        vertex(this.size/2 + 5, this.size/2);
        endShape(CLOSE);

        // Reinforced wings
        fill(80, 80, 120);
        rect(-this.size/2 - 8, 0, 16, this.size/2);
        rect(this.size/2 - 8, 0, 16, this.size/2);

        // Armored cockpit
        fill(150, 150, 200);
        arc(0, 0, this.size/2, this.size/2, PI, TWO_PI);

        // Energy shield effect
        drawWithGlow(() => {
          noFill();
          stroke(100, 150, 255, 100);
          strokeWeight(2);
          arc(0, 0, this.size * 1.2, this.size, PI * 0.8, TWO_PI * 0.6);
        }, '#4488ff', 10);

        // Health bar
        let healthWidth = this.size * (this.health / 3);
        strokeWeight(4);
        stroke(0, 0, 0, 100);
        noFill();
        rect(-this.size/2, -this.size/2 - 15, this.size, 8, 4);
        noStroke();
        fill(100, 150, 255, 200);
        rect(-this.size/2, -this.size/2 - 15, healthWidth, 8, 4);
        
        pop();
      }, '#4488ff', 15);
      
    } else if (this.type === 'scout') {
      drawWithGlow(() => {
        push();
        translate(this.x, this.y);
        rotate(PI + sin(this.oscillation) * 0.2); // Bank while turning
        
        // Sleek body
        fill(255, 150, 0);
        beginShape();
        vertex(0, -this.size);
        vertex(-this.size/2, this.size/2);
        vertex(0, 0);
        vertex(this.size/2, this.size/2);
        endShape(CLOSE);

        // Engine trails
        for (let i = 0; i < 2; i++) {
          let offset = this.size/4;
          drawWithGlow(() => {
            fill(255, 100, 0, 150);
            beginShape();
            vertex(-offset + i * this.size/2, this.size/2);
            vertex(-offset + i * this.size/2 - 2, this.size);
            vertex(-offset + i * this.size/2 + 2, this.size);
            endShape(CLOSE);
          }, '#ff6600', 8);
        }

        // Cockpit
        fill(255, 200, 0, 200);
        ellipse(0, -this.size/4, this.size/3, this.size/2);
        
        pop();
      }, '#ff9900', 10);
    } else if (this.type === 'boss') {
      drawWithGlow(() => {
        push();
        translate(this.x, this.y);
        rotate(this.rotation);
        
        // Enhanced main head with gradient effect
        drawingContext.shadowBlur = 20;
        drawingContext.shadowColor = '#003333';
        
        // Outer glow
        for (let i = 0; i < 3; i++) {
          fill(20, 40 + i * 10, 40 + i * 10, 50 - i * 10);
          beginShape();
          for (let j = 0; j < 12; j++) {
            let angle = map(j, 0, 12, 0, TWO_PI);
            let r = this.size/1.5 + cos(angle * 2 + this.rotation) * 5;
            let px = cos(angle) * (r + i * 5);
            let py = sin(angle) * (r + i * 5) - this.size/4;
            vertex(px, py);
          }
          endShape(CLOSE);
        }

        // Main head with more detail
        fill(20, 40, 40);
        beginShape();
        for (let i = 0; i < 12; i++) {
          let angle = map(i, 0, 12, 0, TWO_PI);
          let r = this.size/1.5 + cos(angle * 2 + this.rotation) * 5;
          let px = cos(angle) * r;
          let py = sin(angle) * r - this.size/4;
          vertex(px, py);
        }
        endShape(CLOSE);

        // Enhanced glowing eyes
        let eyeGlow = abs(sin(this.rotation * 2)) * 20;
        drawingContext.shadowBlur = eyeGlow;
        drawingContext.shadowColor = '#00ff00';
        
        // Eye sockets
        fill(10, 20, 20);
        ellipse(-this.size/4, -this.size/4, this.size * 0.25, this.size * 0.2);
        ellipse(this.size/4, -this.size/4, this.size * 0.25, this.size * 0.2);
        
        // Glowing eyes
        fill(0, 255, 0, 200);
        let eyeSize = this.size * 0.15;
        circle(-this.size/4, -this.size/4, eyeSize);
        circle(this.size/4, -this.size/4, eyeSize);
        
        // Eye shine
        fill(255, 255, 255, 150);
        circle(-this.size/4 - eyeSize/4, -this.size/4 - eyeSize/4, eyeSize/3);
        circle(this.size/4 - eyeSize/4, -this.size/4 - eyeSize/4, eyeSize/3);

        // Enhanced tentacles with gradient
        let tentacleCount = 8;
        for (let i = 0; i < tentacleCount; i++) {
          let angle = map(i, 0, tentacleCount, -PI/2, PI + PI/2);
          let tentacleLength = this.size * 1.2;
          let startX = cos(angle) * this.size/3;
          let startY = sin(angle) * this.size/3 + this.size/4;
          
          // Multiple segments for each tentacle
          for (let j = 0; j < 3; j++) {
            strokeWeight(this.size/10 - j * 2);
            stroke(20, 40 + j * 10, 40 + j * 10, 200 - j * 30);
            
            beginShape();
            for (let t = 0; t <= 1; t += 0.1) {
              let waveOffset = sin(this.rotation * 2 + i + t * PI) * this.size/4;
              let tx = startX + cos(angle) * t * tentacleLength + sin(t * TWO_PI + this.rotation) * waveOffset;
              let ty = startY + sin(angle) * t * tentacleLength + cos(t * TWO_PI + this.rotation) * waveOffset/2;
              curveVertex(tx, ty);
            }
            endShape();
          }
        }

        // Health bar with enhanced visuals
        let healthWidth = this.size * (this.health / 5);
        strokeWeight(4);
        stroke(0, 0, 0, 100);
        noFill();
        rect(-this.size/2, -this.size/2 - 15, this.size, 8, 4);
        noStroke();
        
        // Health bar gradient
        for (let i = 0; i < this.health; i++) {
          let segmentWidth = this.size/5;
          fill(0, 255 - i * 30, 0, 200);
          rect(-this.size/2 + i * segmentWidth, -this.size/2 - 15, segmentWidth, 8, 4);
        }
        
        pop();
      }, '#003333', 20);
    } else if (this.type === 'spaceship') {
      drawWithGlow(() => {
        push();
        translate(this.x, this.y);
        rotate(PI);
        
        // Enhanced enemy ship design
        // Wing shadows
        fill(0, 100, 0);
        triangle(-this.size/2 - 5, this.size/3, -this.size/2, -this.size/4, -this.size/4, this.size/4);
        triangle(this.size/2 + 5, this.size/3, this.size/2, -this.size/4, this.size/4, this.size/4);

        // Main wings
        fill(0, 180, 0);
        beginShape();
        vertex(-this.size/2 - 8, this.size/2);
        vertex(-this.size/2, -this.size/3);
        vertex(-this.size/4, 0);
        vertex(-this.size/4, this.size/2);
        endShape(CLOSE);
        
        beginShape();
        vertex(this.size/2 + 8, this.size/2);
        vertex(this.size/2, -this.size/3);
        vertex(this.size/4, 0);
        vertex(this.size/4, this.size/2);
        endShape(CLOSE);

        // Main body
        fill(0, 220, 0);
        beginShape();
        vertex(0, -this.size/2 - 5);
        vertex(-this.size/3, -this.size/4);
        vertex(-this.size/4, this.size/2);
        vertex(this.size/4, this.size/2);
        vertex(this.size/3, -this.size/4);
        endShape(CLOSE);

        // Cockpit
        fill(50, 255, 50, 150);
        beginShape();
        vertex(0, -this.size/3);
        vertex(-this.size/4, -this.size/6);
        vertex(0, this.size/4);
        vertex(this.size/4, -this.size/6);
        endShape(CLOSE);

        // Energy core
        drawWithGlow(() => {
          fill(0, 255, 0, 150);
          circle(0, 0, this.size/3);
        }, '#00ff00', 10);

        // Detail lines
        stroke(0, 255, 0);
        strokeWeight(1);
        line(-this.size/3, -this.size/4, -this.size/4, this.size/3);
        line(this.size/3, -this.size/4, this.size/4, this.size/3);
        noStroke();
        
        pop();
      }, '#00ff00', 15);
    } else { // Asteroid
      drawWithGlow(() => {
        push();
        translate(this.x, this.x);
        rotate(this.rotation);
        
        fill(150);
        beginShape();
        let sides = 6;
        for (let i = 0; i < sides; i++) {
          let angle = map(i, 0, sides, 0, TWO_PI);
          let r = this.size/2 + sin(angle * 3 + this.rotation) * 5;
          let px = cos(angle) * r;
          let py = sin(angle) * r;
          vertex(px, py);
        }
        endShape(CLOSE);

        // Crater details
        fill(100);
        for (let i = 0; i < 3; i++) {
          let angle = i * TWO_PI/3 + this.rotation;
          let r = this.size/4;
          let px = cos(angle) * r;
          let py = sin(angle) * r;
          circle(px, py, this.size/5);
        }
        
        pop();
      }, '#666666', 5);
    }
  }

  update() {
    this.y += this.speed;
    if (this.type === 'scout') {
      // Scouts move in a sine wave pattern
      this.oscillation += 0.1;
      this.x += sin(this.oscillation) * 2;
      // Keep within screen bounds
      this.x = constrain(this.x, this.size, width - this.size);
    }
  }

  isOffScreen() {
    return this.y > height + this.size;
  }
}

// Projectile class with enhanced visuals
class Projectile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 3;
    this.speed = 7;
    this.life = 255;
    this.rotation = 0;
  }

  draw() {
    this.rotation += 0.2;
    drawWithGlow(() => {
      push();
      translate(this.x, this.y);
      rotate(this.rotation);
      
      // Missile body
      fill(200, 200, 200);
      rect(-2, -6, 4, 12, 1);
      
      // Missile head
      fill(255, 200, 0);
      triangle(-2, -6, 2, -6, 0, -10);
      
      // Fins
      fill(150, 150, 150);
      triangle(-2, 2, -2, -2, -5, 2);
      triangle(2, 2, 2, -2, 5, 2);
      
      // Exhaust trail
      for (let i = 0; i < 3; i++) {
        let alpha = map(i, 0, 2, 200, 0);
        fill(255, 100 + i * 50, 0, alpha);
        let size = map(i, 0, 2, 4, 1);
        circle(0, 6 + i * 3, size);
      }
      pop();
    }, '#ffff00', 8);
  }

  update() {
    this.y -= this.speed; // Move upwards
  }

  isOffScreen() {
    return this.y < -this.radius;
  }
}

// Power-up class with enhanced visuals
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 10;
    this.speed = 2;
    this.angle = 0;
  }

  draw() {
    this.angle += 0.05;
    let glowColor;
    let mainColor;
    
    switch (this.type) {
      case 'speed':
        glowColor = '#00ffff';
        mainColor = color(0, 255, 255);
        break;
      case 'rapid-fire':
        glowColor = '#ffff00';
        mainColor = color(255, 255, 0);
        break;
      case 'shield':
        glowColor = '#ff00ff';
        mainColor = color(255, 0, 255);
        break;
    }

    drawWithGlow(() => {
      push();
      translate(this.x, this.y);
      rotate(this.angle);
      
      // Outer ring
      fill(mainColor.levels[0], mainColor.levels[1], mainColor.levels[2], 100);
      circle(0, 0, this.radius * 3);
      
      // Inner shape
      fill(mainColor);
      beginShape();
      for (let i = 0; i < 6; i++) {
        let angle = map(i, 0, 6, 0, TWO_PI);
        let r = this.radius * 1.5;
        let px = cos(angle) * r;
        let py = sin(angle) * r;
        vertex(px, py);
      }
      endShape(CLOSE);
      
      pop();
    }, glowColor, 15);
  }

  update() {
    this.y += this.speed;
  }

  isOffScreen() {
    return this.y > height + this.radius;
  }
}

// Display score and lives
function displayUI() {
  textAlign(LEFT);
  textSize(16);
  fill(255);
  text("Score: " + score, 20, 20);

  // Draw lives as red circles
  for (let i = 0; i < lives; i++) {
    fill(255, 0, 0);
    circle(width - 20 - i * 30, 20, 10);
  }
}

// Circle collision detection (takes diameters)
function collideCircleCircle(x1, y1, d1, x2, y2, d2) {
  let dist = sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  return dist < (d1 / 2 + d2 / 2);
}