const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const speedLevelDisplay = document.getElementById('speedLevel');
const reverseWarning = document.getElementById('reverseWarning');
const instructions = document.getElementById('instructions');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreDisplay = document.getElementById('finalScore');
const highScoreDisplay = document.getElementById('highScore');


function initCanvas() {
    const size = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.8, 600);
    const dpr = window.devicePixelRatio || 1;

    
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.scale(dpr, dpr);

}



let highScore = localStorage.getItem('cursorChaseHighScore') || 0;
highScoreDisplay.textContent = highScore;

let gameState = 'waiting'; 
let score = 0;
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let rawMouseX = canvas.width / 2;
let rawMouseY = canvas.height / 2;
let shakeIntensity = 0;
let isControlsReversed = false;
let reverseControlsTimer = 0;
let speedLevel = 1;
let gameOverReason = '';
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;
let arenaRadius = Math.min(canvas.width, canvas.height) * 0.45;

const ball = {
    x: 0,
    y: 0,
    radius: 15,
    baseSpeed: 3.5,
    currentSpeed: 3.5,
    color: '#ffffff',
    vx: 0,
    vy: 0
};

const starLifetime = 4000; 
const redStarLifetime = 6000; 
const reverseControlsDuration = 3000; 

let stars = [];
const maxStars = 3;
const starRadius = 8;


let isMobile = false;
const touchOverlay = document.createElement('div');
touchOverlay.className = 'touch-overlay';
document.body.appendChild(touchOverlay);

function handlePointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.type.includes('touch')) {
        isMobile = true;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    rawMouseX = clientX - rect.left;
    rawMouseY = clientY - rect.top;
    
    let targetMouseX = rawMouseX;
    let targetMouseY = rawMouseY;

    if (isControlsReversed && gameState === 'playing') {
        targetMouseX = centerX - (rawMouseX - centerX);
        targetMouseY = centerY - (rawMouseY - centerY);
    }

    if (gameState === 'playing') {
        const distFromCenter = Math.sqrt((targetMouseX - centerX) ** 2 + (targetMouseY - centerY) ** 2);
        if (distFromCenter > arenaRadius - 10) {
            const angle = Math.atan2(targetMouseY - centerY, targetMouseX - centerX);
            targetMouseX = centerX + Math.cos(angle) * (arenaRadius - 10);
            targetMouseY = centerY + Math.sin(angle) * (arenaRadius - 10);
        }
    }
    
    mouseX = targetMouseX;
    mouseY = targetMouseY;
}


canvas.addEventListener('mousemove', handlePointerMove);
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handlePointerMove(e);
}, { passive: false });

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'waiting') {
            startGame();
        }
    }
});


canvas.addEventListener('click', () => {
    if (gameState === 'waiting') {
        startGame();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'waiting') {
        startGame();
    }
}, { passive: false });

function startGame() {
    
    initCanvas();
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
    arenaRadius = Math.min(canvas.width, canvas.height) * 0.45;
    
    gameState = 'playing';
    score = 0;
    speedLevel = 1;
    stars = [];
    ball.x = centerX;
    ball.y = centerY - 100;
    ball.vx = 0;
    ball.vy = 0;
    ball.currentSpeed = ball.baseSpeed;
    shakeIntensity = 0;
    isControlsReversed = false;
    reverseControlsTimer = 0;
    instructions.style.display = 'none';
    gameOverScreen.style.display = 'none';
    reverseWarning.style.display = 'none';
    scoreDisplay.textContent = '0';
    speedLevelDisplay.textContent = '1';
    spawnStar();
}

function restartGame() {
    gameState = 'waiting';
    instructions.style.display = 'block';
    instructions.textContent = isMobile ? 'Tap to start playing!' : 'Press SPACE to start playing!';
    gameOverScreen.style.display = 'none';
    scoreDisplay.textContent = '0';
    speedLevelDisplay.textContent = '1';
    reverseWarning.style.display = 'none';
}

function updateDifficulty() {
    
    
    const baseSpeed = 3.5;
    const maxSpeed = 12; 
    
    
    const speedMultiplier = Math.log(score + 1) * 0.5;
    ball.currentSpeed = Math.min(baseSpeed + speedMultiplier, maxSpeed);
    
    
    const newSpeedLevel = Math.floor(Math.log(score + 1) * 2) + 1;
    if (newSpeedLevel !== speedLevel) {
        speedLevel = newSpeedLevel;
        speedLevelDisplay.textContent = speedLevel;
    }
}

function spawnStar() {
    if (stars.length < maxStars) {
        let attempts = 0;
        let validPosition = false;
        let starX, starY;
        
        while (!validPosition && attempts < 50) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * (arenaRadius - starRadius - 30) + starRadius + 30;
            
            starX = centerX + Math.cos(angle) * distance;
            starY = centerY + Math.sin(angle) * distance;
            
            const distFromBall = Math.sqrt((starX - ball.x) ** 2 + (starY - ball.y) ** 2);
            const distFromMouse = Math.sqrt((starX - mouseX) ** 2 + (starY - mouseY) ** 2);
            
            if (distFromBall > ball.radius + starRadius + 40 && distFromMouse > starRadius + 40) {
                validPosition = true;
            }
            attempts++;
        }
        
        if (validPosition) {
            const isRedStar = Math.random() < 0.15;
            const lifetime = isRedStar ? redStarLifetime : starLifetime;
            
            stars.push({
                x: starX,
                y: starY,
                radius: starRadius,
                collected: false,
                isRed: isRedStar,
                spawnTime: Date.now(),
                lifetime: lifetime,
                blinkTimer: 0
            });
        }
    }
}

function updateBall() {
    if (gameState !== 'playing') return;

    const dx = mouseX - ball.x;
    const dy = mouseY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        
        const chaseForce = 0.3 + Math.log(score + 1) * 0.05;
        ball.vx += (dx / distance) * chaseForce;
        ball.vy += (dy / distance) * chaseForce;
    }

    ball.vx *= 0.97; 
    ball.vy *= 0.97;

    const maxSpeed = ball.currentSpeed;
    const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (currentSpeed > maxSpeed) {
        ball.vx = (ball.vx / currentSpeed) * maxSpeed;
        ball.vy = (ball.vy / currentSpeed) * maxSpeed;
    }

    
    const prevX = ball.x;
    const prevY = ball.y;
    
    
    ball.x += ball.vx;
    ball.y += ball.vy;

    
    const cursorDistFromCenter = Math.sqrt((mouseX - centerX) ** 2 + (mouseY - centerY) ** 2);
    if (cursorDistFromCenter > arenaRadius - 10) {
        gameOverReason = 'You hit the wall!';
        triggerGameOver();
        return;
    }

    
    const distFromCenter = Math.sqrt((ball.x - centerX) ** 2 + (ball.y - centerY) ** 2);
    const ballEdgeDist = distFromCenter + ball.radius;
    
    if (ballEdgeDist > arenaRadius) {
        
        const overlap = ballEdgeDist - arenaRadius;
        
        
        const correctionX = (ball.x - centerX) / distFromCenter * overlap;
        const correctionY = (ball.y - centerY) / distFromCenter * overlap;
        ball.x -= correctionX;
        ball.y -= correctionY;
        
        
        const normalX = (ball.x - centerX) / distFromCenter;
        const normalY = (ball.y - centerY) / distFromCenter;
        
        
        const dotProduct = ball.vx * normalX + ball.vy * normalY;
        
        
        ball.vx -= 2 * dotProduct * normalX;
        ball.vy -= 2 * dotProduct * normalY;
        
        
        ball.vx *= 0.85;
        ball.vy *= 0.85;
    }
}

function updateGameState() {
    if (gameState !== 'playing') return;

    if (isControlsReversed) {
        reverseControlsTimer -= 16; 
        if (reverseControlsTimer <= 0) {
            isControlsReversed = false;
            reverseWarning.style.display = 'none';
        }
    }

    const currentTime = Date.now();
    stars.forEach((star, index) => {
        const age = currentTime - star.spawnTime;
        const timeRemaining = star.lifetime - age;

        if (timeRemaining < 1000) {
            star.blinkTimer += 16;
            star.isBlinking = Math.floor(star.blinkTimer / 200) % 2 === 0;
        }

        if (timeRemaining <= 0) {
            stars.splice(index, 1);
        }
    });

    updateDifficulty();
}

function checkCollisions() {
    if (gameState !== 'playing') return;

    const distToCursor = Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2);
    if (distToCursor < ball.radius + 8) {
        gameOverReason = 'The ball caught you!';
        triggerGameOver();
        return;
    }

    stars.forEach((star, index) => {
        if (!star.collected) {
            const distToStar = Math.sqrt((mouseX - star.x) ** 2 + (mouseY - star.y) ** 2);
            if (distToStar < star.radius + 12) {
                star.collected = true;
                
                if (star.isRed) {
                    isControlsReversed = true;
                    reverseControlsTimer = reverseControlsDuration;
                    reverseWarning.style.display = 'block';
                    score += 5; 
                } else {
                    score += 10;
                }
                
                scoreDisplay.textContent = score;
                stars.splice(index, 1);
                
                setTimeout(spawnStar, 800);
            }
        }
    });
}

function drawStar(ctx, x, y, radius, points = 5) {
    const outerRadius = radius;
    const innerRadius = radius * 0.4;
    
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const starX = x + Math.cos(angle) * r;
        const starY = y + Math.sin(angle) * r;
        
        if (i === 0) {
            ctx.moveTo(starX, starY);
        } else {
            ctx.lineTo(starX, starY);
        }
    }
    ctx.closePath();
}

function triggerGameOver() {
    gameState = 'gameOver';
    finalScoreDisplay.textContent = score;
    
    
    const gameOverReasonElement = document.getElementById('gameOverReason');
    if (gameOverReasonElement) {
        gameOverReasonElement.textContent = gameOverReason;
    }
    
    gameOverScreen.style.display = 'block';
    
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cursorChaseHighScore', highScore);
        highScoreDisplay.textContent = highScore;
    }
}

function draw() {
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, arenaRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.fill();

    
    stars.forEach(star => {
        if (star.isBlinking && star.blinkTimer && Math.floor(star.blinkTimer / 200) % 2 === 1) {
            return;
        }
        
        if (star.isRed) {
            ctx.fillStyle = '#ff4444';
            ctx.strokeStyle = '#ff4444';
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#ffffff';
        }
        
        ctx.lineWidth = 2;
        drawStar(ctx, star.x, star.y, star.radius);
        ctx.fill();
        ctx.stroke();
    });

    
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    
    ctx.fillStyle = ball.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

function gameLoop() {
    updateBall();
    updateGameState();
    checkCollisions();
    draw();
    
    if (gameState === 'playing' && Math.random() < 0.008) {
        spawnStar();
    }
    
    requestAnimationFrame(gameLoop);
}


window.addEventListener('resize', () => {
  initCanvas();

  
  const dpr = window.devicePixelRatio || 1;
  centerX = canvas.width / 2 / dpr;
  centerY = canvas.height / 2 / dpr;
  arenaRadius = Math.min(canvas.width, canvas.height) * 0.45 / dpr;

  
  if (gameState === 'waiting') {
    ball.x = centerX;
    ball.y = centerY - 100;
  }
});



initCanvas();
centerX = canvas.width / 2;
centerY = canvas.height / 2;
arenaRadius = Math.min(canvas.width, canvas.height) * 0.45;
ball.x = centerX;
ball.y = centerY - 100;


isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
instructions.textContent = isMobile ? 'Tap to start playing!' : 'Press SPACE to start playing!';
gameLoop();