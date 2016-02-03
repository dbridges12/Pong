/**
 * Created by davidbridges on 2/2/16.
 */

// Create the app using the module pattern //
pong = function () {
    'use strict';
    // Main Variables for the game //
    var gameWidth = 700, gameHeight = 600, pi = Math.PI,
        canvas = null,
        canvasCtx = null,
        keyState = null,
        human = {}, computer = {}, ball = {},
        upArrow = 38, downArrow = 40, escapeKey = 27, enterKey = 13,
        animateRequest;

    // define the game objects //
    human = {
        // location coordinates //
        x: null,
        y: null,

        // size of the object
        width: 20,
        height: 100,

        // human paddle is controller by up and down arrow keys //
        update: function () {
            var paddleSpeed = 8; // larger number moves faster, but less precise //
            if (keyState[upArrow]) {
                this.y -= paddleSpeed;
            }

            if (keyState[downArrow]) {
                this.y += paddleSpeed;
            }

            // keep the paddle on the screen //
            this.y = Math.max(Math.min(this.y, gameHeight - this.height), 0);

        },

        draw: function () {
            canvasCtx.fillRect(this.x, this.y, this.width, this.height);
        }
    };

    computer = {
        x: null,
        y: null,

        // size of the object
        width: 20,
        height: 100,

        // the computer paddle will track the ball position
        update: function () {
            var destY = ball.y - (this.height - ball.side)/2;

            // this calculation causes the computer to play the ball slightly offset //
            // this.y = destY; and computer would never lose :)
            this.y += (destY - this.y) * 0.1;

            // keep the paddle on the screen //
            this.y = Math.max(Math.min(this.y, gameHeight - this.height), 0);
        },

        draw: function () {
            canvasCtx.fillRect(this.x, this.y, this.width, this.height);
        }
    };

    ball = {
        x: null,
        y: null,
        velocity: null,
        speed: 10,
        side: 20,  // size of the object

        serve: function(side) {
            var rand = Math.random();
            this.x = side === 1 ? human.x + human.width : computer.x - this.side;
            this.y = (gameHeight - this.side) * rand;

            var phi = 0.1 * pi * (1 - 2*rand);
            this.velocity = {
                x: side * this.speed * Math.cos(phi),
                y: this.speed * Math.sin(phi)
            };
        },

        update: function () {
            this.x += this.velocity.x;
            this.y += this.velocity.y;

            // if the ball hits the top or bottom, reverse the velocity/direction //
            if (this.y < 0 || this.y + this.side > gameHeight) {
                var offset = this.velocity.y < 0 ? 0 - this.y : gameHeight - (this.y + this.side);
                this.y += 2*offset;  // makes the collision appear elastic
                this.velocity.y *= -1;
            }

            // function that checks when the center of two boxes intersect //
            var AABBIntersect = function (ax, ay, aw, ah, bx, by, bw, bh) {
                return ax < bx+bw && ay < by+bh && bx < ax+aw && by < ay+ah;
            };

            // determine paddle to check by which way ball is moving //
            var paddle = this.velocity.x < 0 ? human : computer;

            // if the ball intersects this paddle, reverse the ball direction //
            if (AABBIntersect(paddle.x, paddle.y, paddle.width, paddle.height,
                    this.x, this.y, this.side, this.side))
            {
                this.x = (paddle === human ? human.x + human.width : computer.x - this.side);

                // calculate the normalized height offset (0 to 1) where the ball strikes the paddle //
                var n = (this.y + this.side - paddle.y)/(paddle.height + this.side);

                // calculate the reflection angle (-1 to 1) //
                var phi = (pi/4) * (2*n - 1); // pi/4 = 45 degrees //

                // SMASH function to hit the ball at higher velocity //
                var smash = Math.abs(phi) > 0.2 * pi ? 1.5 : 1;

                this.velocity.x = smash * (paddle === human ? 1 : -1) * this.speed*Math.cos(phi);
                this.velocity.y = smash * this.speed*Math.sin(phi);
            }

            // reset the game if someone misses the ball //
            if (this.x + this.side < 0 || this.x > gameWidth) {
                this.serve (paddle === human ? 1 : -1);
            }
        },

        draw: function () {
            canvasCtx.fillRect(this.x, this.y, this.side, this.side);
        }
    };

    function init() {
        // position the objects on the canvas //
        human.x = (human.width); // the width of the object form the left edge of the canvas //
        human.y = (gameHeight - human.height)/2; // center the paddle halfway down the screen //

        computer.x = gameWidth - (computer.width + human.width);
        computer.y = (gameHeight - human.height)/2;

        ball.serve(1);  // always start with the human //
    }

    function draw() {
        // 1. Draw the court in black //
        canvasCtx.fillRect(0, 0, gameWidth, gameHeight);
        canvasCtx.fillStyle = "#00f";  // color of the court

        // 2. save current canvas //
        canvasCtx.save();

        // 3. change the fill style color to green //
        canvasCtx.fillStyle = "#fff";  // color of the objects

        // 4. draw the objects //
        ball.draw();
        human.draw();
        computer.draw();

        // 5. draw the net //
        var netWidth = 4,
            netX = (gameWidth-netWidth)/ 2,
            netY = 0,
            netGap = gameHeight/15;

        while (netY < gameHeight) {
            canvasCtx.fillRect(netX, netY + netGap * 0.25, netWidth, netGap * 0.5);
            netY += netGap;
        }

        // 6. Restore the original canvas state ..
        canvasCtx.restore();
    }

    function update() {
        ball.update();
        human.update();
        computer.update();
    }

    function main() {
        // initialize the game court on the canvas //
        canvas = document.createElement('canvas');
        canvas.width = gameWidth;
        canvas.height = gameHeight;

        // get the 2d canvas context so we can draw on it //
        canvasCtx = canvas.getContext('2d');
        document.body.appendChild(canvas);

        // listen for keydown and keyup events to move the human paddle
        keyState = [];
        document.addEventListener('keydown', function(evt) {
            keyState[evt.keyCode] = true;
        });

        document.addEventListener('keyup', function(evt) {
            delete keyState[evt.keyCode];
        });

        init();

        // main animation loop //
        var loop = function () {
            update();
            draw();


            animateRequest = window.requestAnimationFrame(loop);

            if (keyState[escapeKey]) {
                window.cancelAnimationFrame(animateRequest);
            }
        };

        // call this to get the animation started //
        animateRequest = window.requestAnimationFrame(loop);
    }

    // run the game loop //
    main();
}();
