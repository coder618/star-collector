import Phaser, { Game } from "phaser";

import generateBlock from "../generateBlock";

var config = {
    type: Phaser.AUTO,
    width: 320,
    height: 640,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 300 },
            debug: true,
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};
var platform, blockGroup;
var game = new Phaser.Game(config);
var player;
var cursors;
var currentBlocks = 5;
var gameOver = false;
var dynamicAdded = false;
var screen = false;
var shouldAddNewBlock = false;
var leftKey, rightKey;
function preload() {
    this.load.image("ground", "assets/ground.png");
    this.load.image("knife", "assets/knife.png");
    this.load.image("block", "assets/star.png");
    this.load.spritesheet("dude", "assets/dude.png", { frameWidth: 32, frameHeight: 48 });
}
var key;
function create() {
    platform = this.physics.add.staticGroup();
    platform.create(400, 610, "ground").setScale(2).refreshBody();
    blockGroup = this.physics.add.group(); // Enable physics for the group

    screen = this;

    function requestNewBlockAdd() {
        if (shouldAddNewBlock) {
            addNewBlock(screen);

            screen.physics.add.collider(
                blockGroup,
                blockGroup,
                function (gameObject1, gameObject2) {
                    const b1 = gameObject1.body;
                    const b2 = gameObject2.body;

                    if (b1.y > b2.y) {
                        b2.y += b1.top - b2.bottom;
                        b2.stop();
                    } else {
                        b1.y += b2.top - b1.bottom;
                        b1.stop();
                    }
                }
            );
        }
    }
    // Set up click event to add item on click
    this.input.on("pointerdown", function (pointer) {
        requestNewBlockAdd();
    });

    leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    leftKey.on("down", function (event) {
        requestNewBlockAdd();
    });

    rightKey.on("down", function (event) {
        requestNewBlockAdd();
    });

    key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    key.on("down", function (event) {
        requestNewBlockAdd();
    });

    for (let i = 0; i < 7; i++) {
        if (i % 2 == 0) {
            let block = this.physics.add
                .sprite(150, 100 * i + 5, "knife")
                .setScale(0)
                .refreshBody();
            block.displayWidth = 150;
            block.displayHeight = 20;

            block.setCollideWorldBounds(true);
            block.setBounce(0.5);
            block.customSeparateY = true;

            blockGroup.add(block);
        } else {
            let block = this.physics.add
                .sprite(150, 100 * i + 5, "block")
                .setScale(0)
                .refreshBody();
            block.displayWidth = 50;
            block.displayHeight = 50;

            block.setCollideWorldBounds(true);
            block.setBounce(0.5);
            block.customSeparateY = true;

            blockGroup.add(block);
        }
    }

    // this.physics.add.collider(blockGroup);

    this.physics.add.collider(blockGroup, blockGroup, function (gameObject1, gameObject2) {
        const b1 = gameObject1.body;
        const b2 = gameObject2.body;

        if (b1.y > b2.y) {
            b2.y += b1.top - b2.bottom;
            b2.stop();
        } else {
            b1.y += b2.top - b1.bottom;
            b1.stop();
        }
    });
    this.physics.add.collider(blockGroup, platform);
    player = this.physics.add.sprite(50, 450, "dude");

    player.setBounce(0.1);
    player.setCollideWorldBounds(true);

    this.physics.add.collider(player, platform);

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

    this.physics.add.overlap(player, blockGroup, removeBlock, null, this);
}

function removeBlock(player, block) {
    let blockType = false;
    const playerTopPosition = player.y;
    const playerXPosition = player.x;
    let itemBottomPosition = false;
    let itemXPosition = 0;
    let sideHitPosition = false;
    let impactFromSide = false;

    block.disableBody(true, false);
    if (block.texture.key == "knife") {
        blockType = "knife";
        itemBottomPosition = block.y + 20;
        itemXPosition = block.y + 150;
    } else {
        blockType = "star";
        itemBottomPosition = block.y + 50;
        itemXPosition = block.y + 50;
    }

    if (playerXPosition > 360 / 2) {
        sideHitPosition = "left";
    } else {
        sideHitPosition = "right";
    }

    if (playerTopPosition < itemBottomPosition) {
        impactFromSide = true;
    }
    /*
    console.log(
        // blockType,
        // "player @ > ",
        // playerTopPosition,
        // "Item @ >> ",
        // itemBottomPosition,
        // "Side impact > ",
        // impactFromSide,
        sideHitPosition,
        "Player X ",
        playerXPosition,
        "Item X ",
        itemXPosition
    );
    */

    if (blockType == "knife" && impactFromSide == false) {
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play("turn");
        gameOver = true;
    } else {
        // Define the tween configuration for the clicked item
        const tweenConfig = {
            targets: block,
            x: sideHitPosition == "right" ? 300 : -300,
            duration: 200,
            ease: "Linear",
            yoyo: false,
            repeat: 0,
            onComplete: function () {
                block.disableBody(true, true);
            },
        };

        // Create the tween and start it
        const tween = this.tweens.add(tweenConfig);
        tween.play();
        shouldAddNewBlock = true;
    }
}

function addNewBlock(t) {
    // console.log("Add new block called ", screen);
    // let newBlock = screen.physics.add.sprite(150, 1, "knife").setScale(0).refreshBody();
    const currentTimestamp = Date.now();
    if (currentTimestamp % 2 == 1) {
        let newBlock = t.physics.add.sprite(150, 0, "knife").setScale(0).refreshBody();

        // addItem(pointer.x, pointer.y);
        newBlock.displayWidth = 150;
        newBlock.displayHeight = 20;

        newBlock.setCollideWorldBounds(true);
        newBlock.setBounce(0.5);
        newBlock.customSeparateY = true;
        blockGroup.add(newBlock);
        blockGroup.add(newBlock);
        blockGroup.add(newBlock);
        blockGroup.add(newBlock);
    } else {
        let newBlock = t.physics.add.sprite(150, 0, "block").setScale(0).refreshBody();

        // addItem(pointer.x, pointer.y);
        newBlock.displayWidth = 50;
        newBlock.displayHeight = 50;

        newBlock.setCollideWorldBounds(true);
        newBlock.setBounce(0.5);
        newBlock.customSeparateY = true;
        blockGroup.add(newBlock);
        blockGroup.add(newBlock);
        blockGroup.add(newBlock);
        blockGroup.add(newBlock);
    }
    shouldAddNewBlock = false;
    console.log("new block added");
}
function update() {
    if (gameOver == true) {
        return;
    }

    if (cursors.left.isDown) {
        player.setVelocityX(-3000);
        player.anims.play("left", true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(3000);
        player.anims.play("right", true);
    } else {
        player.setVelocityX(0);
        player.anims.play("turn");
    }
}
