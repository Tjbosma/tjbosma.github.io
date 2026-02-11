const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
const numberOfParticles = 150;

// Mouse interaction
let mouse = {
    x: null,
    y: null,
    radius: 150
}

window.addEventListener('mousemove', function (event) {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
});

class Particle {
    constructor() {
        this.init();
    }

    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1; // Smaller, finer particles
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        // Cool colors: white, light grey, and subtle accent pop
        const colors = ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)', 'rgba(255, 0, 85, 0.6)'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around screen
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Mouse interaction - gentle push
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const maxDistance = mouse.radius;
            const force = (maxDistance - distance) / maxDistance;
            const directionX = forceDirectionX * force * this.density;
            const directionY = forceDirectionY * force * this.density;

            this.x -= directionX;
            this.y -= directionY;
        }

        this.draw();
    }
}

function init() {
    particlesArray = [];
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connect();
    requestAnimationFrame(animate);
}

// Draw subtle lines between particles if close
function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
                ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));

            // Connect if close enough
            if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                opacityValue = 1 - (distance / 20000);
                if (opacityValue > 0) {
                    ctx.strokeStyle = 'rgba(255, 255, 255,' + (opacityValue * 0.05) + ')'; // Very subtle lines
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }
}

init();
animate();


// Scroll Observer for sections
const observerOptions = {
    threshold: 0.2
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.section').forEach(section => {
    observer.observe(section);
});

/* --- CONFETTI LOGIC --- */
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');

confettiCanvas.width = window.innerWidth;
confettiCanvas.height = window.innerHeight;

let confettiArray = [];
const confettiColors = ['#ff007a', '#7600ff', '#00ffff', '#ffffff', '#ffd700'];

// Targets for collision (The "Words" / Elements)
let collisionTargets = [];

function updateCollisionTargets() {
    // We want the particles to land ONLY on the Button "details"
    const elements = document.querySelectorAll('.cta-btn');
    collisionTargets = Array.from(elements).map(el => el.getBoundingClientRect());
}

window.addEventListener('resize', () => {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    updateCollisionTargets();
});

// Update targets on scroll so particles stick to moving elements
window.addEventListener('scroll', () => {
    updateCollisionTargets();

    // Fade out confetti when scrolling down
    const scrollY = window.scrollY;
    const fadeStart = 100; // Start fading after 100px
    const fadeDistance = window.innerHeight * 0.8; // Fade out completely over this distance

    let opacity = 1 - ((scrollY - fadeStart) / fadeDistance);
    if (opacity < 0) opacity = 0;
    if (opacity > 1) opacity = 1;

    confettiCanvas.style.opacity = opacity;
});

// Initial update
updateCollisionTargets();

class Confetti {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        this.x = Math.random() * confettiCanvas.width;
        // If initial, randomize y on screen, else start above
        this.y = initial ? Math.random() * confettiCanvas.height - confettiCanvas.height : -20;
        this.size = Math.random() * 10 + 5;
        this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        this.speedY = Math.random() * 3 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 0.2 - 0.1;
        this.landed = false;
        this.landedY = 0; // The Y position relative to the element it landed on? No, simplest is just screen Y
    }

    update() {
        if (this.landed) {
            // If landed, we need to check if it's still on top of the target (in case of scroll/resize)
            // But for simplicity with fixed canvas & moving targets:
            // The simple approach: If it landed, it stays at that Y *unless* the target moves away?
            // Since we update targets every scroll, we can re-verify collision or just let them fall if target moves.
            // BETTER: Just have them stick to the screen coordinate? 
            // PROBLEM: If user scrolls, screen coordinate of text changes.
            // SOLUTION: We are updating current target rects every frame effectively via scroll listener.
            // We need to re-check collision every frame if we want them to "ride" the element up.

            // To make them ride the element, we'd need to link the particle to the specific element object.
            // Let's keep it simple: simpler physics.
            // 1. Gravity always applies.
            // 2. Collision checks floor relative to particle.

            this.y += this.speedY; // Apply gravity? No, if landed speedY is 0.
        } else {
            this.y += this.speedY;
            this.x += this.speedX;
            this.rotation += this.rotationSpeed;
        }

        // Collision Detection
        this.landed = false; // Reset and re-check
        // If we are falling (speedY > 0), check for collisions below us
        for (let rect of collisionTargets) {
            // Check if x is within horizontal bounds (with 10px inset so it doesn't hang off)
            if (this.x > rect.left + 10 && this.x < rect.right - 10) {
                // Check if y is close to top
                // Center exactly on the border line so it doesn't float
                if (this.y + this.size / 2 >= rect.top && this.y < rect.top + 20) {
                    this.y = rect.top;
                    this.landed = true;
                }
            }
        }

        if (this.landed) {
            // If landed, move with the element (which we just set to rect.top)
            // But we also want a little friction/slide maybe?
            // For now, just stick.
            this.speedY = 0;
            this.speedX *= 0.9; // Friction
            this.x += this.speedX; // Still slide a bit
        } else {
            // Resume falling
            if (this.speedY === 0) this.speedY = Math.random() * 3 + 2;
        }

        // Reset if fell off screen
        if (this.y > confettiCanvas.height) {
            this.reset();
        }
    }

    draw() {
        // Don't draw if opacity is 0 (optimization handled by canvas opacity mostly, but good for logic)
        confettiCtx.save();
        confettiCtx.translate(this.x, this.y);
        confettiCtx.rotate(this.rotation);

        confettiCtx.fillStyle = this.color;
        // Draw centered
        confettiCtx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        confettiCtx.restore();
    }
}

function initConfetti() {
    confettiArray = [];
    for (let i = 0; i < 150; i++) {
        confettiArray.push(new Confetti());
    }
}

function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    // We update collisions every frame if we want smooth "riding" on scroll? 
    // Actually the scroll listener updates `collisionTargets` global.
    // However, fast scroll might lag. 
    // Let's just trust valid `collisionTargets`.

    for (let i = 0; i < confettiArray.length; i++) {
        confettiArray[i].update();
        confettiArray[i].draw();
    }
    requestAnimationFrame(animateConfetti);
}

// Start confetti
// Only run this if we are near top? Or always run but fade out?
initConfetti();
animateConfetti();

/* --- PARKING MODAL LOGIC --- */
const modal = document.getElementById("parking-modal");
const btn = document.getElementById("parking-btn");
const closeBtn = document.querySelector(".close-btn");

if (btn && modal && closeBtn) {
    btn.onclick = function () {
        modal.style.display = "flex";
        // Small delay to trigger CSS transition
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    function closeModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = "none";
        }, 300); // Match CSS transition time
    }

    closeBtn.onclick = closeModal;

    window.onclick = function (event) {
        if (event.target == modal) {
            closeModal();
        }
    }
}
