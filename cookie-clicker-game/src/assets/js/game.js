(function() {
    const config = {
        type: Phaser.AUTO,
        width: 1000,
        height: 700,
        parent: 'game-container',
        scene: {
            preload: preload,
            create: create,
            update: update
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        }
    };

    const game = new Phaser.Game(config);
    let score = 0;
    let scoreText;
    let cpsText;
    let cookie;
    let upgrade1Cost = 50;
    let upgrade1Interval;
    let cps = 0;

    function preload() {
        this.load.image('cookie', 'assets/images/cookie.png');
    }

    function create() {
        cookie = this.add.image(200, 320, 'cookie').setInteractive();
        cookie.setScale(0.2); // Scale down the cookie to 20% of its original size
        cookie.on('pointerdown', increaseScore);

        scoreText = this.add.text(16, 0, 'Score: 0', { fontSize: '32px', fill: '#fff' }); // Move the score text up
        cpsText = this.add.text(16, 40, 'CPS: 0', { fontSize: '32px', fill: '#fff' }); // Add CPS text

        // Add event listeners for upgrades
        document.getElementById('upgrade1').addEventListener('click', buyUpgrade1);
        document.getElementById('upgrade2').addEventListener('click', buyUpgrade2);
    }

    function update() {
        // Game logic can be added here
    }

    function increaseScore() {
        score++;
        scoreText.setText('Score: ' + score);
    }

    function buyUpgrade1() {
        if (score >= upgrade1Cost) {
            score -= upgrade1Cost;
            scoreText.setText('Score: ' + score);
            upgrade1Cost = Math.floor(upgrade1Cost * 1.5); // Increase the cost by 50%
            document.getElementById('upgrade1').innerText = `Upgrade 1 (Cost: ${upgrade1Cost})`;

            cps += 1; // Increase CPS by 1
            cpsText.setText('CPS: ' + cps);

            if (!upgrade1Interval) {
                upgrade1Interval = setInterval(() => {
                    score += cps;
                    scoreText.setText('Score: ' + score);
                }, 1000); // Add cookies per second based on CPS
            }
        } else {
            alert('Not enough cookies!');
        }
    }

    function buyUpgrade2() {
        console.log('Upgrade 2 purchased');
        // Implement upgrade logic here
    }
})();