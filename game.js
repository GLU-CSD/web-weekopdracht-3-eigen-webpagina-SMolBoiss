const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight, 
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let submarine;
let depth = 0;
let money = 0; 
let upgradeCost = 100;
let submarineSpeed = 1;
let background;
let depthText, moneyText, upgradeText, depthUpgradeText;
let overlay;
let uiContainer;
let needle;
let startingangle = -90;  // Define needle at a higher scope
let underwaterSound;  // Define the sound variable
let lightCone;  // Define lightCone at a higher scope
let bubbles;
let maxDepth = 200; // Initial maximum depth
let depthUpgradeCost = 200; // Initial cost for upgrading depth
let moneyPerSec = 1; // Initialize money per second
let obstacles; // Define obstacles at a higher scope

// Define health bar graphics and health variables
let healthBar;
const maxHealth = 100;
let currentHealth = maxHealth;

function preload() {
    console.log("Preloading assets...");
    this.load.image('submarine', 'assets/images/submarine.png');
    // Preload the PNG image
    this.load.image('depthGauge', 'assets/images/depthGauge.png'); // Preload the depth gauge image
    this.load.image('needle', 'assets/images/needle.png'); // Preload the needle image
    this.load.audio('underwater', 'assets/audio/underwater.mp3'); // Preload the underwater audio
    this.load.image('bubble', 'assets/images/bubble.png'); // Load the bubble image
    this.load.image('resetButton', 'assets/images/resetButton.png'); // Load the reset button image
    this.load.image('lightCone', 'assets/images/lightCone.png'); // Load the light cone image
    this.load.audio('metalCreak', 'assets/audio/metalCreak.mp3'); // Preload the metal creaking sound
    this.load.image('obstacle', 'assets/images/obstacle.png'); // Preload the obstacle image
}

function create() {
    // Load the game state from local storage
    const savedState = JSON.parse(localStorage.getItem('gameState'));
    if (savedState) {
        depth = savedState.depth || 0;
        money = savedState.money || 0;
        moneyPerSec = savedState.moneyPerSec || 1; // Default to 1 if not valid
        upgradeCost = savedState.upgradeCost || 100;
        depthUpgradeCost = savedState.depthUpgradeCost || 200;
    }
    


    // Create a semi-transparent background rectangle with an ocean blue color
    background = this.add.rectangle(config.width / 2, config.height / 2, config.width, config.height, 0x0077cc);
    background.setOrigin(0.5);

    // Play the underwater sound on repeat with lower volume
    underwaterSound = this.sound.add('underwater');
    underwaterSound.play({ loop: true, volume: 0.2 });  // Set volume to 0.2 (adjust as needed)

    // Submarine setup (left side of the screen)
    submarine = this.add.sprite(400, config.height / 2, 'submarine');
    submarine.setOrigin(0.5, 0.5);
    submarine.setScale(config.height / 800 * 0.2); // Scale relative to height

    // Add light cone at the front of the submarine
    lightCone = this.add.image(submarine.x + 50, submarine.y, 'lightCone');
    lightCone.setOrigin(0, 0.5); // Set origin to the left center
    lightCone.setScale(0.5); // Adjust the scale as needed
    lightCone.angle = 0; // Rotate to point to the right
    lightCone.setAlpha(1); // Set initial alpha to 1 for full opacity
    lightCone.setBlendMode(Phaser.BlendModes.ADD); // Use ADD blend mode for brightness effect

    // Create a semi-transparent black overlay
    overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0);  // Start with alpha 0
    overlay.fillRect(0, 0, config.width, config.height);

    // Store background (right-hand tab)
    const storeWidth = 300; // Width of the store tab
    const storeBackground = this.add.rectangle(config.width - storeWidth / 2, config.height / 2, storeWidth, config.height, 0x333333);
    storeBackground.setOrigin(0.5);

    // Store title and upgrades
    this.add.text(config.width - storeWidth + 20, 20, 'STORE', { font: '32px Arial', fill: '#ffffff' });
    upgradeText = this.add.text(config.width - storeWidth + 20, 80, `Upgrade Money/Sec: ${upgradeCost} coins`, { font: '16px Arial', fill: '#ffffff' });
    const upgradeButton = this.add.text(config.width - storeWidth + 20, 120, '[Upgrade]', { font: '16px Arial', fill: '#00ff00' })
        .setInteractive()
        .on('pointerdown', () => {
            if (money >= upgradeCost) {
                money -= upgradeCost;
                upgradeMoneyPerSec();
            }
        });

    depthUpgradeText = this.add.text(config.width - storeWidth + 20, 160, `Upgrade Depth: ${depthUpgradeCost} coins`, { font: '16px Arial', fill: '#ffffff' });
    const depthUpgradeButton = this.add.text(config.width - storeWidth + 20, 200, '[Upgrade Depth]', { font: '16px Arial', fill: '#00ff00' })
        .setInteractive()
        .on('pointerdown', () => {
            if (money >= depthUpgradeCost) {
                money -= depthUpgradeCost;
                upgradeMaxDepth();
            }
        });

    // Depth and money trackers (top-left corner)
    depthText = this.add.text(20, 20, `Depth: ${depth} meters`, { font: '16px Arial', fill: '#ffffff' });
    moneyText = this.add.text(20, 50, `Money: ${money} coins`, { font: '16px Arial', fill: '#ffffff' });

    // Add depth gauge image at the bottom of the store
    const depthGauge = this.add.image(config.width - storeWidth / 2, config.height - 50, 'depthGauge');
    depthGauge.setOrigin(0.5, 1);  // Set origin to the bottom center
    depthGauge.setScale(0.3);

    // Add needle image to the center of the depth gauge
    needle = this.add.image(depthGauge.x, depthGauge.y - depthGauge.displayHeight / 2, 'needle');
    needle.setOrigin(0.9, 0.9);  // Set origin to the center
    needle.setScale(0.35);
    needle.angle = startingangle;  // Set the starting angle of the needle to 45 degrees

    // Create a container for the UI elements
    uiContainer = this.add.container(0, 0);
    uiContainer.add([depthText, moneyText, upgradeText, upgradeButton, depthUpgradeText, depthUpgradeButton, depthGauge, needle]);

    // Add event listener for window resize
    window.addEventListener('resize', resizeGame);
    resizeGame();  // Call it once to set the initial size

    // Initialize bubbles group
    bubbles = this.add.group();

    // Add reset button in the bottom left corner
    const resetButton = this.add.image(50, config.height - 50, 'resetButton')
        .setInteractive()
        .on('pointerdown', showResetConfirmation);
    resetButton.setScale(0.15); // Adjust the scale as needed

    // Create confirmation dialog
    const confirmDialog = this.add.container(config.width / 2, config.height / 2);
    const dialogBackground = this.add.rectangle(0, 0, 300, 200, 0x000000, 0.8);
    const confirmText = this.add.text(0, -50, 'Are you sure?', { font: '24px Arial', fill: '#ffffff' }).setOrigin(0.5);
    const yesButton = this.add.text(-90, 50, '[Yes]', { font: '24px Arial', fill: '#00ff00' })
        .setInteractive()
        .on('pointerdown', () => {
            resetGame();
            confirmDialog.setVisible(false);
        });
    const noButton = this.add.text(50, 50, '[No]', { font: '24px Arial', fill: '#ff0000' })
        .setInteractive()
        .on('pointerdown', () => {
            confirmDialog.setVisible(false);
        });

    confirmDialog.add([dialogBackground, confirmText, yesButton, noButton]);
    confirmDialog.setVisible(false);

    function showResetConfirmation() {
        confirmDialog.setVisible(true);
    }

    // Cheat button for free money
    this.input.keyboard.on('keydown-F', function (event) {
        money += 1000; // Add 1000 coins
        moneyText.setText(`Money: ${money} coins`);
    });

    // Initialize health bar
    healthBar = this.add.graphics();
    updateHealthBar();

    // Initialize obstacles group
    obstacles = this.physics.add.group();

    // Enable collision detection between the submarine and obstacles
    this.physics.add.overlap(submarine, obstacles, hitObstacle, null, this);

    // Enable physics for the submarine
    this.physics.add.existing(submarine);

    // Define the new width and height for the hitbox
    const newWidth = submarine.width * 0.5; // 50% of the original width
    const newHeight = submarine.height * 0.2; // 50% of the original height

    // Adjust the hitbox size
    submarine.body.setSize(newWidth, newHeight);

    // Optionally, you can also offset the hitbox if needed
    submarine.body.setOffset((submarine.width - newWidth) / 2, (submarine.height - newHeight) / 2);
}

function resizeGame() {
    const canvas = game.canvas;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const wratio = width / height;
    const ratio = game.config.width / game.config.height;

    if (wratio < ratio) {
        canvas.style.width = width + 'px';
        canvas.style.height = (width / ratio) + 'px';
    } else {
        canvas.style.width = (height * ratio) + 'px';
        canvas.style.height = height + 'px';
    }
}

function update(time, delta) {
    // Increase depth over time
    if (depth < maxDepth) {
        depth += submarineSpeed * 0.1;
    }


    // Save
    localStorage.setItem('gameState', JSON.stringify({ depth, money, moneyPerSec, upgradeCost,depthUpgradeCost }));

    // Earn money over time based on money per second
    money += moneyPerSec * (delta / 1000); // delta is in milliseconds, so divide by 1000 to get seconds

    // Update displays
    depthText.setText(`Depth: ${Math.floor(depth)} meters`);
    moneyText.setText(`Money: ${Math.floor(money)} coins`);
    upgradeText.setText(`Upgrade Money/Sec: ${upgradeCost} coins`);
    depthUpgradeText.setText(`Upgrade Depth: ${depthUpgradeCost} coins`);

    // Darken the background color as the depth increases
    const blueComponent = Math.max(0, Math.floor(200 - (depth * 0.0002)));  // Start with blue and decrease over time
    const greenComponent = Math.max(0, Math.floor(128 - (depth * 0.0001))); // Add a green component to make it more ocean blue
    background.setFillStyle(Phaser.Display.Color.GetColor(0, greenComponent, blueComponent));  // Darker ocean blue shade

    // Increase the alpha of the overlay to make the background look darker
    const overlayAlpha = Math.min(0.8, depth * 0.0007);  // Increase alpha based on depth, capped at 0.8
    overlay.clear();
    overlay.fillStyle(0x000000, overlayAlpha);
    overlay.fillRect(0, 0, config.width, config.height);

    // Make the submarine bob up and down
    submarine.y = config.height / 2 + Math.sin(time * 0.0009) * 20;
    submarine.rotation = Math.sin(time * 0.0005) * 0.02; // Gentle rocking

    // Update lightCone position to follow the submarine
    lightCone.x = submarine.x + 90;
    lightCone.y = submarine.y - 9;
    lightCone.setScale(2); // Adjust the scale as needed

    // Apply flicker effect based on depth
    if (Math.random() < 0.6) { // 10% chance to flicker
        lightCone.setAlpha(0.6 + Math.random() * 0.5); // Random alpha between 0.5 and 1
    } else {
        lightCone.setAlpha(1); 
    }

    // Play metal creaking sound randomly based on depth
    if (Math.random() < depth * 0.0000000005) { // Decrease chance based on depth
        this.sound.play('metalCreak', { volume: 0.1 }); 
    }

    // Change the angle of the needle
    needle.angle = depth * 0.0019 + startingangle;  // Example: rotate based on depth

    // Move bubbles upwards
    bubbles.getChildren().forEach((bubble, index) => {
        bubble.y -= bubble.speed;
        if (bubble.y < -bubble.height) {
            bubbles.remove(bubble, true, true); // Remove bubble if it goes off screen
        }
    });

    // Spawn a new bubble occasionally
    if (time % 1000 < delta) { // Spawn every second
        spawnBubble.call(this);
    }

    // Spawn a new obstacle occasionally
    if (time % 12000 < delta) { // Spawn every 12 seconds
        spawnObstacle.call(this);
    }

    // Add bubble trail behind obstacles
    obstacles.getChildren().forEach((obstacle) => {
        if (Math.random() < 0.05) { // Adjust the frequency of bubble spawning
            spawnBubbleAt.call(this, obstacle.x, obstacle.y - 20);
        }

        // Remove obstacle if it goes off screen
        if (obstacle.y > config.height) {
            obstacle.destroy();
        }
    });

    updateHealthBar();
    
}

function updateHealthBar() {
    healthBar.clear();
    healthBar.fillStyle(0x000000, 1);
    healthBar.fillRect(submarine.x + 10, submarine.y + 100, 100, 10); // Background
    healthBar.fillStyle(0xff0000, 1);
    healthBar.fillRect(submarine.x + 10, submarine.y + 100, currentHealth, 10); // Health
}

function upgradeMaxDepth() {
    if (money >= depthUpgradeCost) {
        maxDepth += 200; // Increase max depth by 100 meters
        money -= depthUpgradeCost;
        depthUpgradeCost = Math.floor(depthUpgradeCost * 1.5);
    }
}

function upgradeMoneyPerSec() {
    if (money >= upgradeCost) {
        moneyPerSec += 0.5; // Increase money per second by 0.5
        money -= upgradeCost;
        upgradeCost = Math.floor(upgradeCost * 1.5);
    }
}

// Function to spawn a bubble
function spawnBubble() {
    const bubble = this.add.sprite(Math.random() * config.width, config.height, 'bubble');
    bubble.speed = Math.random() * 2 + 1;
    bubble.setScale(Math.random() * 0.02 + 0.01); // Smaller random scale for variety
    bubble.setAlpha(0.5); // Set lower opacity
    bubble.setDepth(0); // Set depth to ensure bubbles are behind obstacles
    bubbles.add(bubble);
}

// Function to spawn a bubble at a specific position
function spawnBubbleAt(x, y) {
    const bubble = this.add.sprite(x, y, 'bubble');
    bubble.speed = Math.random() * 2 + 1;
    this.physics.add.existing(bubble);
    bubble.setScale(Math.random() * 0.02 + 0.01); // Smaller random scale for variety
    bubble.setAlpha(0.5); // Set lower opacity
    bubble.body.setVelocityY(-bubble.speed * 10); // Adjust the speed as needed
    bubble.setDepth(0); // Set depth to ensure bubbles are behind obstacles
}

// Function to spawn obstacles
function spawnObstacle() {
    const x = Phaser.Math.Between(0, config.width - 500);
    const obstacle = obstacles.create(x, 0, 'obstacle');
    obstacle.setVelocityY(Phaser.Math.Between(50, 100));
    obstacle.setScale(0.1); // Scale down the obstacle to 50% of its original size
    obstacle.setRotation(Phaser.Math.Between(0, 360)); // Add random rotation
    obstacle.setInteractive();
    obstacle.setDepth(1); // Set depth to ensure obstacles are in front of bubbles
    obstacle.on('pointerdown', () => {
        obstacle.destroy();
        money += 10; // Add 10 coins
        moneyText.setText(`Money: ${money} coins`); // Update money text

        // Create a "+10 coins!" text
        const coinText = this.add.text(obstacle.x, obstacle.y, '+10 coins!', { fontSize: '16px', fill: '#00ff00' });
        coinText.setDepth(2); // Ensure the text is in front of other objects

        // Animate the text to move up and fade out
        this.tweens.add({
            targets: coinText,
            y: coinText.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => {
                coinText.destroy(); // Destroy the text after the animation
            }
        });
    });
}

// Function to reset the game
function resetGame() {
    depth = 0;
    money = 0;
    moneyPerSec = 1; // Initialize money per second
    upgradeCost = 100;
    depthUpgradeCost = 200;
    currentHealth = maxHealth; // Reset health to maximum
    localStorage.setItem('gameState', JSON.stringify({ depth, money, moneyPerSec, upgradeCost }));
    depthText.setText(`Depth: ${depth} meters`);
    moneyText.setText(`Money: ${money} coins`);
    upgradeText.setText(`Upgrade Money/Sec: ${upgradeCost} coins`);
    depthUpgradeText.setText(`Upgrade Depth: ${depthUpgradeCost} coins`);
    updateHealthBar(); // Update the health bar

    // Clear all obstacles
    obstacles.getChildren().forEach(obstacle => {
        obstacle.destroy();
    });
}

function showResetConfirmation() {
    confirmDialog.setVisible(true);
}

function hitObstacle(submarine, obstacle) {
    obstacle.destroy();
    currentHealth -= 10; // Decrease health by 10
    if (currentHealth < 0) currentHealth = 0;
    updateHealthBar();
}
