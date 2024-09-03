import { Player, playerInstance } from './Classes/Player.js';
import { Enemy, enemyInstances } from './Classes/Enemy.js';

const fieldType = {
  wall: 'wall',
  tile: 'tile',
  hp: 'hp',
  sword: 'sword',
  enemy: 'enemy',
  player: 'player'
};

const fieldSize = {
  length: 24,
  width: 40
};

let array = Array.from({ length: fieldSize.length }, () => new Array(fieldSize.width).fill(fieldType.wall));
let field = $('.field');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomCoord(fieldSize){
  return [getRandomInt(0,fieldSize.length-1),getRandomInt(0,fieldSize.width-1)]
}

function getRoomSize(){
  return [getRandomInt(3,8),getRandomInt(3,8)]
}

function getPlayerInfo(info){
  let $player = $('.tileP');

  let coord = {
    top: parseInt($player.css('top')),
    left: parseInt($player.css('left')),
  };

  if (info === 'player')
    return  $player;
  else if(info === 'coordinates')
    return { x: coord.left, y: coord.top };
}

function getCoordTile(left,top){
  return {x: left/25, y: top/25}
}

function getCellClass(element,fieldType) {
  let cellClass;
  switch (element) {
    case fieldType.wall:cellClass = 'tileW'; break;
    case fieldType.hp:cellClass = 'tileHP'; break;
    case fieldType.sword:cellClass = 'tileSW'; break;
    case fieldType.enemy:cellClass = 'tileE'; break;
    case fieldType.player:cellClass = 'tileP'; break;
    case fieldType.tile: default: cellClass = 'tile'; break;
  } return cellClass;
}

function createRoom(size) {
  const [length, width] = size;
  let x, y;

  function isSpaceAvailable(x, y, length, width) {
    if (
        x + width + 1 > fieldSize.length ||
        y + length + 1 > fieldSize.width ||
        x < 1 || y < 1
    ) {
      return false;
    }
    for (let i = x - 1; i <= x + width; i++) {
      for (let j = y - 1; j <= y + length; j++) {
        if (array[i][j] !== 'wall') {
          return false;
        }
      }
    }
    return true;
  }

  do {
    [x,y] = getRandomCoord(fieldSize);
  } while (
      x + width > fieldSize.length - 1 ||
      y + length > fieldSize.width - 1 ||
      !isSpaceAvailable(x, y, length, width)
  );

  for (let i = x; i < x + width; i++) {
    for (let j = y; j < y + length; j++) {
      array[i][j] = fieldType.tile;
    }
  }
}

function createPassage(){
  let [countVertical,countHorizontal] = [getRandomInt(3,5),getRandomInt(3,5)]

  let verticalPositions;
  let horizontalPositions;

  function generatePassagePositions(size, passages) {
    let positions = [];

    while (positions.length < passages) {
      let position = getRandomInt(1, size - 2);

      if (!positions.some(p => Math.abs(p - position) <= 2)) {
        positions.push(position);
      }
    }

    return positions.sort((a, b) => a - b);
  }

  verticalPositions = generatePassagePositions(24, countVertical);
  horizontalPositions = generatePassagePositions(40, countHorizontal);

  verticalPositions.forEach(position => {
    for (let i = 0; i < fieldSize.width; i++) {
      array[position][i] = fieldType.tile;
    }
  });

  horizontalPositions.forEach(position => {
    for (let i = 0; i < fieldSize.length; i++) {
      array[i][position] =  fieldType.tile;
    }
  });
}

function addItem(type,count){
  for (let i = 0; i < count; i++){
    let x,y;

    do {
      [x,y] = getRandomCoord(fieldSize);
    } while (
      array[x][y] !== 'tile'
    );

    array[x][y] = fieldType[type]
  }
}



function updateRoom(){
  field.empty();

  array.forEach((row, i) => {
    row.forEach((element, j) => {
      let sellClass = getCellClass(element,fieldType);
      let $el;

      if (sellClass === 'tileP' || sellClass === 'tileE'){
        $el = $('<div></div>').addClass('tile'); // Блок плитки
        field.append($el);

        let $absEl = $('<div><div class="health"></div></div>').addClass(sellClass).css({
          'position': 'absolute',
          'left': `${j * 25}px`,
          'top': `${i * 25}px`
        });
        field.append($absEl);
      }
      else if(sellClass === 'tileHP' || sellClass === 'tileSW'){
        $el = $('<div></div>').addClass(sellClass);

        $el.attr('data-x', j);
        $el.attr('data-y', i);

        field.append($el);
      }
      else {
        $el = $('<div></div>').addClass(sellClass);
        field.append($el);
      }
    });
  });
}

function checkAround(playerPosition) {
  const positions = [
    { y: playerPosition.y / 25, x: (playerPosition.x - 25) / 25 }, // Left
    { y: (playerPosition.y - 25) / 25, x: playerPosition.x / 25 }, // Up
    { y: playerPosition.y / 25, x: (playerPosition.x + 25) / 25 }, // Right
    { y: (playerPosition.y + 25) / 25, x: playerPosition.x / 25 }  // Down
  ];

  return positions.map(pos => {
    if (array[pos.y][pos.x] === fieldType.enemy) {

      let $enemy = $('.tileE').filter(function() {
        const $this = $(this);
        const top = parseInt($this.css('top'));
        const left = parseInt($this.css('left'));
        return top === pos.y * 25 && left === pos.x * 25;
      });

      return $enemy.length ? $enemy[0] : null;
    } else {
      return null;
    }
  });
}

function movePlayer(){
  let $player = getPlayerInfo('player');
  let playerPosition = getPlayerInfo('coordinates');
  let playerSpeed = 25;

  const isValidPosition = (y, x) => (
        x >= 0 && y >= 0 &&
        x < fieldSize.width &&
        y < fieldSize.length &&
        array[y][x] !== fieldType.wall &&
        array[y][x] !== fieldType.enemy);

  const takePotion = (y, x) => {
    if (array[y][x] === fieldType.hp) {
      let player = playerInstance;

      player.heal(20);

      array[y][x] = fieldType.tile;

      let $potion = $(`.tileHP[data-x="${x}"][data-y="${y}"]`);
      if ($potion.length) {
        $potion.replaceWith($('<div class="tile"></div>'));
      }
      const $health = $('.tileP .health');
      const healthPercentage = (player.health / 100) * 100;
      $health.css('width', `${healthPercentage}%`);
    }
  };


  const takeSword = (y, x) => {
    if (array[y][x] === fieldType.sword) {
      playerInstance.increaseAttack(10); // Увеличение атаки на 10 единиц

      array[y][x] = fieldType.tile;
      let $sword = $(`.tileSW[data-x="${x}"][data-y="${y}"]`);
      if ($sword.length) {
        $sword.replaceWith($('<div class="tile"></div>'));
      }
    }
  };

  const changePosition = (dx, dy) => {
    let newX = playerPosition.x + dx;
    let newY = playerPosition.y + dy;

    let gridX = newX / 25;
    let gridY = newY / 25;

    if(isValidPosition(gridY, gridX)){
      playerPosition.x = Math.max(0, Math.min(newX, fieldSize.width * 25 - playerSpeed));
      playerPosition.y = Math.max(0, Math.min(newY, fieldSize.length * 25 - playerSpeed));

      takePotion(gridY, gridX);
      takeSword(gridY, gridX);

      $player.css({
        'left': `${playerPosition.x}px`,
        'top': `${playerPosition.y}px`
      });
    }
  }

  $(document).keydown(function(event) {
    switch (event.key) {
      case 'w':
      case 'ц': // Вверх
        changePosition(0, -playerSpeed);
        break;
      case 's':
      case 'ы': // Вниз
        changePosition(0, playerSpeed);
        break;
      case 'a':
      case 'ф': // Влево
        changePosition(-playerSpeed, 0);
        break;
      case 'd':
      case 'в': // Вправо
        changePosition(playerSpeed, 0);
        break;
    }
  });
}

// Передвижение врагов
function moveEnemy() {
  const enemySpeed = 25;

  const isTilePassage = (x, y) =>
      y >= 0 && x >= 0 &&
      y < fieldSize.length &&
      x < fieldSize.width &&
      array[y][x] === fieldType.tile;

  const getNextDirection = (x, y, prevX, prevY) => {
    const directions = [
      { dx: 0, dy: -1 }, // Вверх
      { dx: 0, dy: 1 },  // Вниз
      { dx: -1, dy: 0 }, // Влево
      { dx: 1, dy: 0 }   // Вправо
    ].filter(({ dx, dy }) =>
        isTilePassage(x + dx, y + dy) &&
        array[y + dy][x + dx] !== fieldType.enemy &&
        (x + dx !== prevX || y + dy !== prevY)
    );

    return directions.length
        ? directions[getRandomInt(0, directions.length - 1)] :
        prevX !== null &&
        prevY !== null ?
            { dx: prevX - x, dy: prevY - y } : null;
  };

  $('.tileE').each(function() {
    const $enemy = $(this);
    const x = parseInt($enemy.css('left')) / 25;
    const y = parseInt($enemy.css('top')) / 25;

    const direction = getNextDirection(x, y, $enemy.data('previous-x'), $enemy.data('previous-y'));

    if (direction) {
      const [newX, newY] = [x + direction.dx, y + direction.dy];

      if (array[newY]?.[newX] === fieldType.tile) {
        array[y][x] = fieldType.tile;
        array[newY][newX] = fieldType.enemy;

        $enemy.css({
          left: `${newX * enemySpeed}px`,
          top: `${newY * enemySpeed}px`
        });
        $enemy.data({ 'previous-x': x, 'previous-y': y });
      }
    }
  });
}

// Атака игрока
function playerAttack() {
  $(document).keydown(function (event) {
    if (event.code === 'Space') {
      let player = playerInstance;
      let enemiesAround = checkAround(getPlayerInfo('coordinates'));

      enemiesAround.forEach((enemyElement) => {
        if (enemyElement !== null) {
          let $enemy = $(enemyElement);
          let enemyIndex = $('.tileE').index($enemy);
          let enemy = enemyInstances[enemyIndex];

          enemy.takeDamage(player.attack);

          let $health = $enemy.find('.health');
          let healthPercentage = (enemy.health / 50) * 100;
          $health.css('width', `${healthPercentage}%`);

          if (enemy.health <= 0) {
            $enemy.detach();
            const coord = getCoordTile(
                parseInt($enemy.css('left')),
                parseInt($enemy.css('top'))
            );
            array[coord.y][coord.x] = fieldType.tile;
          }
        }
      });
    }
  });
}

// Атака врага
function enemiesAttack() {
  $('.tileE').each(function (index) {
    let $enemy = $(this);
    let enemy = enemyInstances[index];
    const attackRange = 25;

    const enemyX = parseInt($enemy.css('left'));
    const enemyY = parseInt($enemy.css('top'));

    const $player = $('.tileP');
    const playerX = parseInt($player.css('left'));
    const playerY = parseInt($player.css('top'));

    const isPlayerInRange =
        Math.abs(playerX - enemyX) <= attackRange && Math.abs(playerY - enemyY) <= attackRange;

    if (isPlayerInRange) {
      playerInstance.takeDamage(enemy.attack);

      const $health = $player.find('.health');
      const healthPercentage = (playerInstance.health / 100) * 100;
      $health.css('width', `${healthPercentage}%`);

      if (playerInstance.health <= 0) {
        alert('Player defeated!');
      }
    }
  });
}

function initGame() {
  // Создание комнат
  let rooms = Array.from({ length: getRandomInt(5, 10) }, getRoomSize);
  rooms.map((room) => createRoom(room));

  // Создание проходов
  createPassage();

  // Добавление элементов игры
  const items = [['hp', 10], ['sword', 2], ['enemy', 10], ['player', 1]];
  items.map((item) => addItem(item[0], item[1]));

  // Обновление состояния комнаты
  updateRoom();

  // Создание экземпляров игрока и врагов
  const player = new Player();
  Array.from({ length: 10 }, () => new Enemy());

  // Запуск логики движения и атаки
  movePlayer();
  playerAttack();

  setInterval(() => {
    moveEnemy();
    enemiesAttack();
  }, 1000); // Запускаем логику врагов
}
// Запускаем игру
initGame();

