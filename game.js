/*
	Pong implemented with HTML features.

	Version: beta
	Author: Daeyong Jeong <daeyong.jeong.18@gmail.com>
	License: GPLv3

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var container, canvas, ctx, game, gameTimeLast;
var unitSize, width, height, fontSize, tdBorder, lrBorder;

const BACKGROUND_COLOR = "black";
const COLOR = "white";

function init() {
  container = document.getElementById("game-container");

  resizeHandler();
  window.addEventListener("resize", resizeHandler);

  let playButton = document.getElementById("playButton");
  playButton.onclick = function() {
    document.getElementById("titleScreen").classList.add("hidden");
    document.getElementById("playScreen").classList.remove("hidden");
    gameStart();
  };
}

function resizeHandler() {
  let lastUnitSize = unitSize;
  unitSize = getUnitSize();
  let resizeRatio = unitSize / lastUnitSize;

  width = 640.0 * unitSize;
  height = 480.0 * unitSize;
  fontSize = 16.0 * unitSize;
  tdBorder = 24.0 * unitSize;
  lrBorder = 64.0 * unitSize;

  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.fontSize = `${fontSize}px`;

  if (document.getElementById("titleScreen").classList.contains("hidden")) {
    game.lineSize = 3 * unitSize;
    game.lineDash = 7 * unitSize;
    game.lineGap = 7 * unitSize;
    game.player.y *= resizeRatio;
    game.computer.y *= resizeRatio;
    game.ball.x *= resizeRatio;
    game.ball.y *= resizeRatio;
    game.ball.vx *= resizeRatio;
    game.ball.vy *= resizeRatio;
    game.playerWidth = 8 * unitSize;
    game.playerHeight = 32 * unitSize;
    draw();
  }
}

function getUnitSize() {
  let width = window.innerWidth;
  let height = window.innerHeight;

  if (width / 4.0 >= height / 3.0) {
    return height / 480.0;
  } else {
    return width / 640.0;
  }
}

function gameStart() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // all in-game variables
  game = {
    player: {
      y: height / 2,
      score: 0
    },
    computer: {
      y: height / 2,
      score: 0,
      speed: 2
    },
    ball: {
      x: width / 2,
      y: height / 2,
      vx: Math.round(Math.random()) ? 1 * unitSize : -1 * unitSize,
      vy: (Math.random() * 4 - 2) * unitSize,
      bounces: 0,
      radius: 5 * unitSize,
      reset: function() {
        this.x = width / 2;
        this.y = height / 2;
        this.vy = (Math.random() * 4 - 2) * unitSize;
      },
      multiplier: 0.2,
      maxSpeed: 5
    },
    lineSize: 3 * unitSize,
    lineDash: 7 * unitSize,
    lineGap: 7 * unitSize,
    playerHeight: 32 * unitSize,
    playerWidth: 8 * unitSize,
    pause: false,
    sound: true
  };

  document.onmousemove = movePaddle;
  canvas.addEventListener("touchmove", movePaddleT);

  gameTimeLast = new Date();
  gameUpdate();
}

function movePaddle(event) {
  let y;
  y = event.pageY;

  if (
    y - game.playerHeight / 2 >= tdBorder &&
    y + game.playerHeight / 2 <= height - tdBorder
  )
    game.player.y = y;
}

function movePaddleT(event) {
  let y;
  y = event.changedTouches.pageY;

  if (
    y - game.playerHeight / 2 >= tdBorder &&
    y + game.playerHeight / 2 <= height - tdBorder
  )
    game.player.y = y;
}

function gameUpdate() {
  dateTime = new Date();

  gameTime = dateTime - gameTimeLast;
  if (gameTime < 0) gameTime = 0;

  moveAmount = gameTime > 0 ? gameTime / 10 : 1;

  if (!game.pause) {
    /* Move cpu player */
    if (
      game.computer.y + 20 < game.ball.y &&
      game.computer.y + game.playerHeight / 2 <= height
    )
      game.computer.y += game.computer.speed * moveAmount;
    else if (
      game.computer.y - 20 > game.ball.y &&
      game.computer.y - game.playerHeight / 2 >= 0
    )
      game.computer.y -= game.computer.speed * moveAmount;

    /* Change direction of ball when hitting a wall */
    if (
      game.ball.y - game.ball.radius < tdBorder ||
      game.ball.y + game.ball.radius > height - tdBorder
    ) {
      if (game.ball.y - game.ball.radius <= tdBorder) {
        game.ball.y = tdBorder + game.ball.radius;
      } else {
        game.ball.y = height - tdBorder - game.ball.radius;
      }

      game.ball.vy *= -1;
    }

    /* checking collision between ball and player */
    if (
      game.ball.x + game.ball.radius >= width - lrBorder * 2 &&
      game.ball.x + game.ball.radius <= width - lrBorder * 2 + game.playerWidth
    ) {
      if (
        game.ball.y - game.ball.radius >=
          game.player.y - game.playerHeight / 2 - Math.sqrt(game.ball.radius) &&
        game.ball.y + game.ball.radius <=
          game.player.y + game.playerHeight / 2 + Math.sqrt(game.ball.radius)
      ) {
        if (game.ball.vx <= game.ball.maxspeed) {
          game.ball.vx += game.ball.multiplier;
        }
        changeBallDirection(game.player);
      }
    } else if (
      game.ball.x - game.ball.radius <= lrBorder * 2 &&
      game.ball.x - game.ball.radius >= lrBorder * 2 - game.playerWidth
    ) {
      /* checking collision between ball and cpu */
      if (
        game.ball.y - game.ball.radius >=
          game.computer.y -
            game.playerHeight / 2 -
            Math.sqrt(game.ball.radius) &&
        game.ball.y + game.ball.radius <=
          game.computer.y + game.playerHeight / 2 + Math.sqrt(game.ball.radius)
      ) {
        if (game.ball.vx >= -game.ball.maxspeed) {
          game.ball.vx -= game.ball.multiplier;
        }
        changeBallDirection(game.computer);
      }
    }
    // hit the right border -> game over
    if (game.ball.x + game.ball.radius >= width - lrBorder) {
      game.computer.score++;
      document.getElementById("computerScore").innerHTML = game.computer.score;
      game.ball.reset();
      game.ball.vx = -1 * unitSize;
    }

    // hit the left border -> game over
    if (game.ball.x - game.ball.radius <= lrBorder) {
      game.player.score++;
      document.getElementById("playerScore").innerHTML = game.player.score;
      game.ball.reset();
      game.ball.vx = 1 * unitSize;
    }
  }
  game.ball.x += game.ball.vx * moveAmount;
  game.ball.y += game.ball.vy * moveAmount;

  draw();

  setTimeout(gameUpdate, 7);

  gameTimeLast = dateTime;
}

function changeBallDirection(player) {
  if (player.y > game.ball.y)
    game.ball.vy -=
      ((player.y - game.ball.y) / game.playerHeight) * game.ball.maxSpeed;
  else if (player.y < game.ball.y)
    game.ball.vy +=
      ((game.ball.y - player.y) / game.playerHeight) * game.ball.maxSpeed;

  game.ball.vx *= -1;
}

function draw() {
  canvas.width = width;
  canvas.height = height;

  // background
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, width, height);

  // center line
  ctx.fillStyle = COLOR;
  for (
    let y = tdBorder;
    y < height - tdBorder;
    y += game.lineDash + game.lineGap
  ) {
    ctx.fillRect(
      width / 2 - game.lineSize / 2,
      y,
      game.lineSize,
      game.lineDash
    );
  }

  // left player
  ctx.fillStyle = COLOR;
  ctx.fillRect(
    lrBorder * 2 - game.playerWidth / 2,
    game.computer.y - game.playerHeight / 2,
    game.playerWidth,
    game.playerHeight
  );

  // right player
  ctx.fillStyle = COLOR;
  ctx.fillRect(
    width - lrBorder * 2 - game.playerWidth / 2,
    game.player.y - game.playerHeight / 2,
    game.playerWidth,
    game.playerHeight
  );

  // ball
  ctx.fillStyle = COLOR;
  let ball = new Path2D();
  ball.arc(game.ball.x, game.ball.y, game.ball.radius, 0, 2 * Math.PI);
  ctx.fill(ball);
}

init();
