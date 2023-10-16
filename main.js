import Phaser from "phaser";

var config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 720,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 300 },
            debug: false,
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;

var game = new Phaser.Game(config);

function preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("ground", "assets/ground.png");
    this.load.image("bar", "assets/bar.png");
    this.load.image("star", "assets/star.png");
    this.load.image("bomb", "assets/bomb.png");
    this.load.spritesheet("dude", "assets/dude.png", { frameWidth: 32, frameHeight: 48 });
}

function create() {
    //  A simple background for our game
    this.add.image(0, 0, "background").setOrigin(0, 0).setScale(1);

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = this.physics.add.staticGroup();

    platforms.create(510, 710, "ground");

    platforms.create(100, 100, "bar");
    platforms.create(420, 190, "bar");
    platforms.create(900, 220, "bar");
    platforms.create(620, 295, "bar");
    platforms.create(100, 250, "bar");
    platforms.create(200, 380, "bar");
    platforms.create(400, 380, "bar");
    platforms.create(300, 550, "bar");
    platforms.create(600, 550, "bar");
    platforms.create(1000, 650, "bar");
    platforms.create(900, 450, "bar");

    player = this.physics.add.sprite(100, 450, "dude");

    player.setBounce(0.1);
    player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: "left",
        frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
    });

    this.anims.create({
        key: "turn",
        frames: [{ key: "dude", frame: 4 }],
        frameRate: 30,
    });

    this.anims.create({
        key: "right",
        frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
        frameRate: 15,
        repeat: -1,
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    stars = this.physics.add.group({
        key: "star",
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 },
    });

    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    bombs = this.physics.add.group();

    scoreText = this.add.text(16, 16, "score: 0", { fontSize: "32px", fill: "#000" });

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);

    this.physics.add.overlap(player, stars, collectStar, null, this);

    this.physics.add.collider(player, bombs, hitBomb, null, this);
}

function update() {
    if (gameOver) {
        return;
    }

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play("left", true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);

        player.anims.play("right", true);
    } else {
        player.setVelocityX(0);
        player.anims.play("turn");
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText("Score: " + score);

    if (stars.countActive(true) === 0) {
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });

        var x = player.x < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, "bomb");
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }
}

function hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play("turn");
    gameOver = true;
}
