'use strict';

/*
 * Geometry Dash style game for mQuickJS
 * Resolution: 320x240
 *
 * Controls:
 * A / UP     = Jump
 * START      = Pause
 * SELECT     = Pause
 * B          = Back / Exit
 */

var WIDTH = 320;
var HEIGHT = 240;

var GROUND_Y = 190;

var GRAVITY = 460;
var JUMP_FORCE = -215;

var PLAYER_SIZE = 24;

/*
 * Thời gian bay lý thuyết:
 * t = 2 * jumpForce / gravity
 *
 * Khối vuông sẽ hoàn thành 360 độ
 * trước khi chạm đất.
 */
var JUMP_TIME = (2 * (-JUMP_FORCE)) / GRAVITY;
var ROTATION_TIME = JUMP_TIME * 0.96;
var ROTATION_SPEED = 360 / ROTATION_TIME;

var STATE_MENU = 0;
var STATE_PLAY = 1;
var STATE_PAUSE = 2;
var STATE_GAMEOVER = 3;
var STATE_COMPLETE = 4;

var state = STATE_MENU;

var selectedLevel = 0;

var LEVELS = [
    {
        name: "BABY",
        speed: 85,
        length: 2600,
        spikes: [
            500,
            700,
            900,
            1120,
            1350,
            1550,
            1800,
            2050,
            2300
        ]
    },

    {
        name: "BEGINNER",
        speed: 105,
        length: 3200,
        spikes: [
            450,
            620,
            790,
            980,
            1160,
            1320,
            1510,
            1680,
            1870,
            2050,
            2250,
            2440,
            2650,
            2880
        ]
    },

    {
        name: "EASY",
        speed: 125,
        length: 3900,
        spikes: [
            430,
            570,
            720,
            870,
            1040,
            1190,
            1370,
            1510,
            1690,
            1840,
            2020,
            2180,
            2360,
            2520,
            2700,
            2880,
            3060,
            3240,
            3440,
            3650
        ]
    }
];

var currentLevel = LEVELS[0];

var cameraX = 0;
var gameDistance = 0;

var deathTimer = 0;
var completeTimer = 0;

var keys = 0;
var previousKeys = 0;

var player = {
    x: 55,
    y: GROUND_Y - PLAYER_SIZE,

    vx: 0,
    vy: 0,

    size: PLAYER_SIZE,

    grounded: true,

    rotation: 0,
    jumpElapsed: 0,

    reset: function () {
        this.x = 55;
        this.y = GROUND_Y - this.size;

        this.vx = 0;
        this.vy = 0;

        this.grounded = true;

        this.rotation = 0;
        this.jumpElapsed = 0;
    },

    jump: function () {
        if (!this.grounded) {
            return;
        }

        this.vy = JUMP_FORCE;
        this.grounded = false;

        /*
         * Mỗi lần nhảy bắt đầu lại từ 0 độ.
         */
        this.rotation = 0;
        this.jumpElapsed = 0;
    },

    update: function (dt) {

        if (this.grounded) {
            return;
        }

        /*
         * Vật lý nhảy.
         */
        this.vy += GRAVITY * dt;
        this.y += this.vy * dt;

        /*
         * Tính thời gian của cú nhảy.
         */
        this.jumpElapsed += dt;

        /*
         * Xoay đúng một vòng.
         */
        if (this.jumpElapsed < ROTATION_TIME) {
            this.rotation =
                this.jumpElapsed * ROTATION_SPEED;

            if (this.rotation > 360) {
                this.rotation = 360;
            }
        } else {
            this.rotation = 360;
        }

        /*
         * Chạm mặt đất.
         */
        if (this.y >= GROUND_Y - this.size) {

            this.y = GROUND_Y - this.size;
            this.vy = 0;

            /*
             * Chỉ cho phép tiếp đất sau khi
             * vòng xoay 360 độ đã hoàn thành.
             */
            if (this.rotation >= 360) {
                this.rotation = 0;
                this.grounded = true;
            }
        }
    }
};


/* =========================================================
 * LEVEL
 * ========================================================= */

function loadLevel(index) {

    if (index < 0) {
        index = 0;
    }

    if (index >= LEVELS.length) {
        index = LEVELS.length - 1;
    }

    selectedLevel = index;
    currentLevel = LEVELS[index];

    cameraX = 0;
    gameDistance = 0;

    deathTimer = 0;
    completeTimer = 0;

    player.reset();
}


function startLevel(index) {

    loadLevel(index);

    state = STATE_PLAY;
}


function returnToMenu() {

    state = STATE_MENU;

    cameraX = 0;
    gameDistance = 0;

    player.reset();
}


/* =========================================================
 * INPUT
 * ========================================================= */

function readKeys() {

    if (typeof Input !== "undefined") {

        if (typeof Input.getKeys === "function") {
            keys = Input.getKeys();
        } else if (typeof Input.read === "function") {
            keys = Input.read();
        }
    }
}


function pressed(mask) {

    return ((keys & mask) !== 0) &&
           ((previousKeys & mask) === 0);
}


/*
 * Bit masks của mQuickJS / GB300
 */
var KEY_B = 1;
var KEY_Y = 2;
var KEY_SELECT = 4;
var KEY_START = 8;

var KEY_UP = 16;
var KEY_DOWN = 32;
var KEY_LEFT = 64;
var KEY_RIGHT = 128;

var KEY_A = 256;
var KEY_X = 512;

var KEY_L = 1024;
var KEY_R = 2048;


/* =========================================================
 * DRAW HELPERS
 * ========================================================= */

function clearScreen(color) {

    if (typeof ScreenDraw !== "undefined") {

        if (typeof ScreenDraw.clear === "function") {
            ScreenDraw.clear(color);
        }

        else if (typeof ScreenDraw.fillRect === "function") {
            ScreenDraw.fillRect(
                0,
                0,
                WIDTH,
                HEIGHT,
                color
            );
        }
    }
}


function rect(x, y, w, h, color) {

    if (typeof ScreenDraw === "undefined") {
        return;
    }

    if (typeof ScreenDraw.fillRect === "function") {
        ScreenDraw.fillRect(
            Math.floor(x),
            Math.floor(y),
            Math.floor(w),
            Math.floor(h),
            color
        );
    }
}


function text(str, x, y, color, size) {

    if (typeof ScreenDraw === "undefined") {
        return;
    }

    if (typeof ScreenDraw.drawText === "function") {

        if (size !== undefined) {
            ScreenDraw.drawText(
                str,
                Math.floor(x),
                Math.floor(y),
                color,
                size
            );
        } else {
            ScreenDraw.drawText(
                str,
                Math.floor(x),
                Math.floor(y),
                color
            );
        }
    }
}


function line(x1, y1, x2, y2, color) {

    if (typeof ScreenDraw === "undefined") {
        return;
    }

    if (typeof ScreenDraw.drawLine === "function") {

        ScreenDraw.drawLine(
            Math.floor(x1),
            Math.floor(y1),
            Math.floor(x2),
            Math.floor(y2),
            color
        );
    }
}


/* =========================================================
 * ROTATED CUBE
 *
 * ScreenDraw không cần hỗ trợ rotate.
 * Ta tự tính 4 góc của hình vuông rồi tô từng scanline.
 * ========================================================= */

function drawRotatedSquare(cx, cy, size, angle, color) {

    var half = size / 2;

    var c = Math.cos(angle);
    var s = Math.sin(angle);

    var px = [
        -half,
         half,
         half,
        -half
    ];

    var py = [
        -half,
        -half,
         half,
         half
    ];

    var rx = [];
    var ry = [];

    var i;

    for (i = 0; i < 4; i++) {

        rx[i] =
            cx +
            px[i] * c -
            py[i] * s;

        ry[i] =
            cy +
            px[i] * s +
            py[i] * c;
    }

    var minY = Math.floor(ry[0]);
    var maxY = Math.ceil(ry[0]);

    for (i = 1; i < 4; i++) {

        if (ry[i] < minY) {
            minY = Math.floor(ry[i]);
        }

        if (ry[i] > maxY) {
            maxY = Math.ceil(ry[i]);
        }
    }

    var y;

    for (y = minY; y <= maxY; y++) {

        var intersections = [];
        var count = 0;

        for (i = 0; i < 4; i++) {

            var j = (i + 1) % 4;

            var y1 = ry[i];
            var y2 = ry[j];

            var x1 = rx[i];
            var x2 = rx[j];

            if ((y1 <= y && y2 > y) ||
                (y2 <= y && y1 > y)) {

                var t =
                    (y - y1) /
                    (y2 - y1);

                intersections[count++] =
                    x1 + (x2 - x1) * t;
            }
        }

        if (count >= 2) {

            var left = intersections[0];
            var right = intersections[1];

            if (right < left) {
                var temp = left;
                left = right;
                right = temp;
            }

            rect(
                Math.floor(left),
                y,
                Math.max(
                    1,
                    Math.ceil(right - left)
                ),
                1,
                color
            );
        }
    }
}


/* =========================================================
 * SPIKE
 * ========================================================= */

function drawSpike(x, y, size, color) {

    /*
     * Triangle được tạo từ nhiều đường ngang.
     */
    var i;

    for (i = 0; i < size; i++) {

        var width =
            Math.floor(
                (i / size) * size
            );

        var left =
            x +
            Math.floor(
                (size - width) / 2
            );

        rect(
            left,
            y + size - i - 1,
            Math.max(1, width),
            1,
            color
        );
    }
}


/* =========================================================
 * BACKGROUND
 * ========================================================= */

function drawBackground() {

    clearScreen(0x101820);

    /*
     * Sky
     */
    rect(
        0,
        0,
        WIDTH,
        GROUND_Y,
        0x162330
    );

    /*
     * Grid.
     */
    var gx;

    for (gx = 0; gx < WIDTH; gx += 32) {

        line(
            gx,
            0,
            gx,
            GROUND_Y,
            0x203040
        );
    }

    var gy;

    for (gy = 0; gy < GROUND_Y; gy += 24) {

        line(
            0,
            gy,
            WIDTH,
            gy,
            0x203040
        );
    }

    /*
     * Ground.
     */
    rect(
        0,
        GROUND_Y,
        WIDTH,
        HEIGHT - GROUND_Y,
        0x202830
    );

    rect(
        0,
        GROUND_Y,
        WIDTH,
        4,
        0x55ddff
    );

    /*
     * Ground pattern.
     */
    for (
        gx = -((cameraX * 0.5) % 32);
        gx < WIDTH;
        gx += 32
    ) {

        rect(
            gx,
            GROUND_Y + 10,
            18,
            3,
            0x34404a
        );
    }
}


/* =========================================================
 * WORLD
 * ========================================================= */

function drawWorld() {

    drawBackground();

    var i;

    /*
     * Spikes.
     */
    for (i = 0; i < currentLevel.spikes.length; i++) {

        var worldX =
            currentLevel.spikes[i];

        var screenX =
            worldX - cameraX;

        if (
            screenX > -40 &&
            screenX < WIDTH + 40
        ) {

            drawSpike(
                screenX,
                GROUND_Y - 22,
                22,
                0xff5050
            );
        }
    }

    /*
     * Player.
     */
    var playerScreenX =
        player.x - cameraX;

    var centerX =
        playerScreenX +
        player.size / 2;

    var centerY =
        player.y +
        player.size / 2;

    /*
     * 360 độ = 2PI.
     */
    var angle =
        player.rotation *
        Math.PI /
        180;

    drawRotatedSquare(
        centerX,
        centerY,
        player.size,
        angle,
        0xffd83d
    );

    /*
     * Viền nhỏ bên trong để dễ nhìn
     * hướng xoay của cube.
     */
    var innerSize = 7;

    drawRotatedSquare(
        centerX,
        centerY,
        innerSize,
        angle,
        0x202020
    );
}


/* =========================================================
 * COLLISION
 * ========================================================= */

function checkSpikeCollision() {

    var i;

    var px =
        player.x;

    var py =
        player.y;

    var ps =
        player.size;

    for (i = 0; i < currentLevel.spikes.length; i++) {

        var sx =
            currentLevel.spikes[i];

        var sy =
            GROUND_Y - 22;

        /*
         * Hitbox nhỏ hơn hình cube một chút
         * để gameplay dễ chịu hơn.
         */
        var hitX =
            px + 3;

        var hitY =
            py + 3;

        var hitW =
            ps - 6;

        var hitH =
            ps - 4;

        /*
         * Spike bounding box.
         */
        if (
            hitX < sx + 22 &&
            hitX + hitW > sx &&
            hitY < sy + 22 &&
            hitY + hitH > sy
        ) {

            return true;
        }
    }

    return false;
}


/* =========================================================
 * GAME UPDATE
 * ========================================================= */

function updateGame(dt) {

    if (state !== STATE_PLAY) {
        return;
    }

    /*
     * Jump.
     */
    if (
        pressed(KEY_A) ||
        pressed(KEY_UP)
    ) {

        player.jump();
    }

    /*
     * Pause.
     */
    if (
        pressed(KEY_START) ||
        pressed(KEY_SELECT)
    ) {

        state = STATE_PAUSE;
        return;
    }

    /*
     * B = menu.
     */
    if (pressed(KEY_B)) {

        returnToMenu();
        return;
    }

    /*
     * Di chuyển.
     */
    gameDistance +=
        currentLevel.speed * dt;

    player.x =
        55 + gameDistance;

    /*
     * Player physics.
     */
    player.update(dt);

    /*
     * Camera.
     */
    cameraX =
        gameDistance -
        55;

    if (cameraX < 0) {
        cameraX = 0;
    }

    /*
     * Collision.
     */
    if (checkSpikeCollision()) {

        state = STATE_GAMEOVER;
        deathTimer = 0;

        return;
    }

    /*
     * Finish.
     */
    if (
        gameDistance >=
        currentLevel.length
    ) {

        state = STATE_COMPLETE;
        completeTimer = 0;
    }
}


/* =========================================================
 * MENU
 * ========================================================= */

function drawMenu() {

    clearScreen(0x0c1118);

    /*
     * Title.
     */
    text(
        "GEOMETRY DASH",
        76,
        35,
        0xffffff,
        2
    );

    text(
        "SELECT LEVEL",
        106,
        65,
        0x55ddff,
        1
    );

    /*
     * Level selector.
     */
    var boxX = 40;
    var boxY = 95;
    var boxW = 240;
    var boxH = 60;

    rect(
        boxX,
        boxY,
        boxW,
        boxH,
        0x202c38
    );

    rect(
        boxX,
        boxY,
        boxW,
        3,
        0x55ddff
    );

    /*
     * Mũi tên trái.
     */
    text(
        "<",
        57,
        116,
        0xffffff,
        2
    );

    /*
     * Tên level.
     */
    var name =
        LEVELS[selectedLevel].name;

    text(
        name,
        126,
        116,
        0xffd83d,
        2
    );

    /*
     * Mũi tên phải.
     */
    text(
        ">",
        251,
        116,
        0xffffff,
        2
    );

    /*
     * Level number.
     */
    text(
        "LEVEL " +
        (selectedLevel + 1) +
        " / " +
        LEVELS.length,
        126,
        143,
        0xb0b8c0,
        1
    );

    /*
     * Hướng dẫn.
     */
    text(
        "LEFT / RIGHT : SELECT",
        88,
        180,
        0xb0b8c0,
        1
    );

    text(
        "A : PLAY",
        123,
        198,
        0x55ff88,
        1
    );

    text(
        "A / UP = JUMP",
        111,
        220,
        0x707b86,
        1
    );
}


function updateMenu() {

    if (pressed(KEY_LEFT)) {

        selectedLevel--;

        if (selectedLevel < 0) {
            selectedLevel =
                LEVELS.length - 1;
        }
    }

    if (pressed(KEY_RIGHT)) {

        selectedLevel++;

        if (
            selectedLevel >=
            LEVELS.length
        ) {
            selectedLevel = 0;
        }
    }

    if (pressed(KEY_A)) {

        startLevel(selectedLevel);
    }
}


/* =========================================================
 * PAUSE
 * ========================================================= */

function drawPause() {

    drawWorld();

    rect(
        70,
        70,
        180,
        100,
        0x101820
    );

    rect(
        70,
        70,
        180,
        3,
        0x55ddff
    );

    text(
        "PAUSED",
        126,
        88,
        0xffffff,
        2
    );

    text(
        "A = CONTINUE",
        106,
        120,
        0x55ff88,
        1
    );

    text(
        "B = MENU",
        116,
        140,
        0xff8080,
        1
    );
}


function updatePause() {

    if (pressed(KEY_A)) {

        state = STATE_PLAY;
        return;
    }

    if (pressed(KEY_B)) {

        returnToMenu();
    }
}


/* =========================================================
 * GAME OVER
 * ========================================================= */

function drawGameOver() {

    drawWorld();

    rect(
        55,
        65,
        210,
        110,
        0x101820
    );

    rect(
        55,
        65,
        210,
        3,
        0xff5050
    );

    text(
        "GAME OVER",
        110,
        85,
        0xff5050,
        2
    );

    text(
        "A = RETRY",
        115,
        120,
        0x55ff88,
        1
    );

    text(
        "B = MENU",
        116,
        142,
        0xffffff,
        1
    );
}


function updateGameOver() {

    if (pressed(KEY_A)) {

        startLevel(selectedLevel);
        return;
    }

    if (pressed(KEY_B)) {

        returnToMenu();
    }
}


/* =========================================================
 * COMPLETE
 * ========================================================= */

function drawComplete() {

    drawWorld();

    rect(
        45,
        60,
        230,
        120,
        0x101820
    );

    rect(
        45,
        60,
        230,
        3,
        0x55ff88
    );

    text(
        "LEVEL COMPLETE!",
        85,
        82,
        0x55ff88,
        2
    );

    text(
        currentLevel.name,
        132,
        110,
        0xffd83d,
        1
    );

    if (
        selectedLevel <
        LEVELS.length - 1
    ) {

        text(
            "A = NEXT LEVEL",
            99,
            135,
            0xffffff,
            1
        );

    } else {

        text(
            "A = PLAY AGAIN",
            100,
            135,
            0xffffff,
            1
        );
    }

    text(
        "B = MENU",
        119,
        155,
        0xb0b8c0,
        1
    );
}


function updateComplete() {

    if (pressed(KEY_A)) {

        if (
            selectedLevel <
            LEVELS.length - 1
        ) {

            startLevel(
                selectedLevel + 1
            );

        } else {

            startLevel(0);
        }

        return;
    }

    if (pressed(KEY_B)) {

        returnToMenu();
    }
}


/* =========================================================
 * HUD
 * ========================================================= */

function drawHUD() {

    /*
     * Level name.
     */
    text(
        currentLevel.name,
        8,
        8,
        0xffffff,
        1
    );

    /*
     * Progress.
     */
    var progress =
        gameDistance /
        currentLevel.length;

    if (progress < 0) {
        progress = 0;
    }

    if (progress > 1) {
        progress = 1;
    }

    var percent =
        Math.floor(progress * 100);

    /*
     * Progress bar.
     */
    rect(
        80,
        10,
        160,
        5,
        0x303a44
    );

    rect(
        80,
        10,
        160 * progress,
        5,
        0x55ddff
    );

    text(
        percent + "%",
        278,
        8,
        0xffffff,
        1
    );
}


/* =========================================================
 * PLAY RENDER
 * ========================================================= */

function drawPlay() {

    drawWorld();

    drawHUD();
}


/* =========================================================
 * MAIN UPDATE
 * ========================================================= */

function update(dt) {

    /*
     * Giới hạn dt để tránh game physics
     * bị nhảy quá xa nếu máy lag.
     */
    if (dt > 0.05) {
        dt = 0.05;
    }

    if (dt <= 0) {
        dt = 1 / 60;
    }

    readKeys();

    if (state === STATE_MENU) {

        updateMenu();

    } else if (state === STATE_PLAY) {

        updateGame(dt);

    } else if (state === STATE_PAUSE) {

        updatePause();

    } else if (state === STATE_GAMEOVER) {

        updateGameOver();

    } else if (state === STATE_COMPLETE) {

        updateComplete();
    }

    previousKeys = keys;
}


/* =========================================================
 * MAIN RENDER
 * ========================================================= */

function render() {

    if (state === STATE_MENU) {

        drawMenu();

    } else if (state === STATE_PLAY) {

        drawPlay();

    } else if (state === STATE_PAUSE) {

        drawPause();

    } else if (state === STATE_GAMEOVER) {

        drawGameOver();

    } else if (state === STATE_COMPLETE) {

        drawComplete();
    }
}


/* =========================================================
 * GAME LOOP
 * ========================================================= */

var lastTime = 0;


function gameLoop() {

    var now = Date.now();

    if (lastTime === 0) {
        lastTime = now;
    }

    var dt =
        (now - lastTime) / 1000;

    lastTime = now;

    update(dt);
    render();
}


/*
 * Không tự vào level.
 * Khi khởi động sẽ luôn ở menu.
 */
state = STATE_MENU;
selectedLevel = 0;

player.reset();


/*
 * mQuickJS có thể cung cấp setMainLoop.
 */
if (typeof setMainLoop === "function") {

    setMainLoop(gameLoop);

} else if (typeof setInterval === "function") {

    setInterval(
        gameLoop,
        16
    );
}
