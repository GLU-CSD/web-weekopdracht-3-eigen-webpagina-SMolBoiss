// This file contains the JavaScript code for the cookie clicker game.
// It manages game logic, including cookie clicking, score tracking, and upgrades.

let score = 0;
let upgradeCost = 10;
let upgrades = 0;

const scoreDisplay = document.getElementById('score');
const upgradeDisplay = document.getElementById('upgrades');
const watermelonButton = document.getElementById('watermelon-button');
const upgradeButton = document.getElementById('upgrade-button');

watermelonButton.addEventListener('click', () => {
    score++;
    updateDisplay();
});

upgradeButton.addEventListener('click', () => {
    if (score >= upgradeCost) {
        score -= upgradeCost;
        upgrades++;
        upgradeCost = Math.floor(upgradeCost * 1.5);
        updateDisplay();
    }
});

function updateDisplay() {
    scoreDisplay.textContent = `Score: ${score}`;
    upgradeDisplay.textContent = `Upgrades: ${upgrades}`;
    upgradeButton.textContent = `Upgrade (Cost: ${upgradeCost})`;
}

// Initial display update
updateDisplay();