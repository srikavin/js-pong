const screen_width = 640;
const screen_height = 640;

const paddle_width = 10;
const paddle_height = 150;
const ball_radius = 15;

function main() {
    const gameElement = document.getElementById('game');
    const context = gameElement.getContext('2d');

    const STATES = {
        PLAYING: 'playing',
        DISPLAY_SCORE: 'display_score',
        WAITING: 'waiting'
    };

    let status = STATES.WAITING;

    let score = {
        human: 0,
        ai: 0
    };

    let state = {
        human_paddle: {x: 0, y: 0}, // x,y are top-left
        ai_paddle: {x: screen_width - paddle_width, y: 0}, // x,y are top-left
        ball: {x: screen_width / 2, y: screen_height / 2, vel_x: -100, vel_y: -300} // x,y are center
    };

    let aiDifficulty = 3;
    let speedMultiplier = 1.1;


    let ai_cur_dir = 'none';
    let ai_speed = 20;
    let ai_frame = 0;

    (function () {
        // Event handlers
        gameElement.addEventListener('mousemove', e => {
            let newY = e.offsetY - (paddle_height / 2);

            if (newY < 0) {
                newY = 0
            }

            if (newY > screen_height - paddle_height) {
                newY = screen_height - paddle_height
            }

            state.human_paddle.y = newY
        });

        gameElement.addEventListener('keydown', e => {
            if (status === STATES.WAITING || status === STATES.DISPLAY_SCORE) {
                status = STATES.PLAYING;
                e.preventDefault()
            }
        });

        gameElement.addEventListener('mousedown', e => {
            if (status === STATES.WAITING || status === STATES.DISPLAY_SCORE) {
                status = STATES.PLAYING;
            }
            e.preventDefault()
        });
    })();

    (function () {
        // Settings listener
        const speedElement = document.getElementById("speedValue");
        const aiLevelElement = document.getElementById("aiLevel");
        const speedSlider = document.getElementById("speed");
        const aiLevelSlider = document.getElementById("difficulty");

        speedSlider.addEventListener('input', () => {
            speedElement.innerText = speedSlider.value.toString();
            speedMultiplier = speedSlider.value
        });

        aiLevelSlider.addEventListener('input', () => {
            aiLevelElement.innerText = aiLevelSlider.value.toString();
            aiDifficulty = aiLevelSlider.value
        });
    })();

    function reset() {
        state = {
            human_paddle: {x: 0, y: (screen_height - paddle_height) / 2}, // x,y are top-left
            ai_paddle: {x: screen_width - paddle_width, y: (screen_height - paddle_height) / 2},
            ball: {
                x: screen_width / 2,
                y: screen_height / 2,
                vel_x: Math.max(100, Math.random() * 300) * (Math.random() > 0.5 ? -1 : 1),
                vel_y: Math.max(100, Math.random() * 300) * (Math.random() > 0.5 ? -1 : 1)
            }
        };
    }

    let lastSimulate = -1;

    function requestDraw(timestamp) {
        handleSizing();

        if (lastSimulate === -1) {
            lastSimulate = timestamp;
        }

        if (status === STATES.WAITING) {
            context.textAlign = 'center';
            context.font = '70px sans-serif';
            context.fillText("Pong", screen_width / 2, screen_height / 2, screen_width);
            context.font = '30px sans-serif';
            context.fillText("Press any key to start", screen_width / 2, 3 * screen_height / 4, screen_width);
            reset()
        } else if (status === STATES.DISPLAY_SCORE) {
            context.textAlign = 'center';
            context.font = '30px sans-serif';
            if (score.ai >= 5) {
                context.fillText(`The AI wins!`, screen_width / 2, 3 * screen_height / 4, screen_width);
            } else if (score.human >= 5) {
                context.fillText(`You win!`, screen_width / 2, 3 * screen_height / 4, screen_width);
            }
            context.fillText(`You: ${score.human} vs AI: ${score.ai}`, screen_width / 2, screen_height / 4, screen_width);
            context.fillText("Press any key to start", screen_width / 2, screen_height / 2, screen_width);
            reset()
        } else if (status === STATES.PLAYING) {
            if (score.ai >= 5 || score.human > 5) {
                score = {ai: 0, human: 0};
                status = STATES.WAITING
            }
            process_ai(state);
            simulate((timestamp - lastSimulate) / 1000, timestamp);
            draw(state, context);
        }

        lastSimulate = timestamp;

        requestAnimationFrame(requestDraw);
    }


    function process_ai(state) {
        let {ai_paddle, ball} = state;

        ai_frame++;

        if (ai_frame % 3 !== 0) {
            ai_cur_dir = 'none';
            return
        }

        if (ball.y > (ai_paddle.y + (paddle_height / 2))) {
            ai_cur_dir = 'down'
        } else {
            ai_cur_dir = 'up'
        }
        ai_speed = (screen_width - (ai_paddle.x - ball.x)) * (aiDifficulty * 0.5);
    }

    function handleSizing() {
        gameElement.width = 640;
        gameElement.height = 640;
    }

    function draw(state, ctx) {
        let {human_paddle, ai_paddle, ball} = state;
        ctx.fillRect(human_paddle.x, human_paddle.y, paddle_width, paddle_height);
        ctx.fillRect(ai_paddle.x, ai_paddle.y, paddle_width, paddle_height);

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball_radius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    let lastCollide = 0;

    function simulate(dt, time) {
        let {ball, human_paddle, ai_paddle} = state;

        function onCollide() {
            if (time - lastCollide < 500) {
                return
            }
            lastCollide = time;
            if (ball.vel_x < 500 && ball.vel_y < 500) {
                ball.vel_x *= speedMultiplier;
                ball.vel_y *= speedMultiplier;
            }
        }

        function handleWin() {
            if (ball.x + ball_radius < 0) {
                // AI-Win
                score.ai += 1;
                status = STATES.DISPLAY_SCORE;
            }
            if (ball.x - ball_radius > screen_width) {
                // Human-Win
                score.human += 1;
                status = STATES.DISPLAY_SCORE;
            }
        }

        function handleCollisions() {
            if (ball.x - ball_radius <= human_paddle.x + paddle_width &&
                ball.x - ball_radius >= human_paddle.x &&
                ball.y + ball_radius >= human_paddle.y &&
                ball.y - ball_radius <= human_paddle.y + paddle_height) {

                console.log("Collision with human paddle");
                onCollide();
                ball.vel_x = Math.abs(ball.vel_x)
            }
            if (ball.x + ball_radius >= ai_paddle.x &&
                ball.x + ball_radius <= ai_paddle.x + paddle_width &&
                ball.y - ball_radius >= ai_paddle.y &&
                ball.y + ball_radius <= ai_paddle.y + paddle_height) {

                console.log("Collision with ai paddle");
                onCollide();
                ball.vel_x = -1 * Math.abs(ball.vel_x)
            }

            if (ball.y <= ball_radius) {
                ball.y = ball_radius;
                ball.vel_y *= -1
            }

            if (ball.y + ball_radius >= screen_height) {
                ball.y = screen_height - ball_radius;
                ball.vel_y *= -1
            }

        }

        function handlePaddle(paddle, dir, speed) {
            if (dir === 'up') {
                paddle.y -= speed * dt
            }
            if (dir === 'down') {
                paddle.y += speed * dt
            }

            if (paddle.y < 0) {
                paddle.y = 0
            }
            if (paddle.y > screen_height - paddle_height) {
                paddle.y = screen_height - paddle_height
            }
        }

        ball.x += ball.vel_x * dt;
        ball.y += ball.vel_y * dt;

        handlePaddle(ai_paddle, ai_cur_dir, ai_speed);
        handleCollisions();
        handleWin();
    }

    requestAnimationFrame(requestDraw);
}

window.onload = main;