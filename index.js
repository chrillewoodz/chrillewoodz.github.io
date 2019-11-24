class View {

  board = document.querySelector('#board');
  title = document.querySelector('#current-player');
  newGame = document.querySelector('#new-game');
  startGame = document.querySelector('#start-game');
  timeSettings = document.querySelectorAll('input[name="time"]'); 

  activeTiles = [];

  constructor() {
    this.render();
  }
  
  onNewGame(cb) {

    this.newGame.addEventListener('click', () => {
      this.activateStartGameBtn();
      this.activateTimeSettings();
      this.setPlayerTimers();
      cb();
    });
  }

  onStartGame(cb) {

    this.startGame.addEventListener('click', () => {
      this.inactivateStartGameBtn();
      this.inactivateTimeSettings();
      cb();
    });
  }

  onTimeSettingsChange(cb) {
    
    this.timeSettings.forEach((input) => {

      input.addEventListener('change', (e) => {
        this.setPlayerTimers();
        cb(e.target.value);
      });
    })
  }

  render() {

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {

        const tile = document.createElement('div');
              tile.classList.add('tile');
              tile.dataset.row = i;
              tile.dataset.column = j;

        this.board.appendChild(tile);
      }
    }
  }

  reset() {

    document.querySelectorAll('.tile').forEach((tile) => {
      
      while (tile.firstChild) {
        tile.removeChild(tile.firstChild);
      }
    });

    this.renderAllTilesAsInactive();

    try {
      document.querySelector('.winner').classList.remove('winner');
      document.querySelector('.active').classList.remove('active');
    }
    catch(e) {}
  }

  addTileEventListener(tile, cb) {

    const tileElement = this.getTileElement(tile);

    const clickFn = () => {
      cb();
    }

    this.activeTiles.push({tile, listener: clickFn});

    tileElement.addEventListener('click', clickFn);
  }

  getCurrentTimeSettings() {

    for (let i = 0; i < this.timeSettings.length; i++) {
      const input = this.timeSettings[i];
      if (input.checked) {
        return input.value;
      }
    }
  }

  getTileQuery(tile) {
    return `.tile[data-row="${tile.row}"][data-column="${tile.column}"]`;
  }

  getMarkerSrc(color) {
    return `./assets/othello-marker-${color}.svg`;
  }

  getTileElement(tile) {
    return document.querySelector(this.getTileQuery(tile));
  }

  flipTile(tile, color) {
    document.querySelector(this.getTileQuery(tile)).querySelector('img').setAttribute('src', this.getMarkerSrc(color));
  }

  renderTileAsPopulated(tile, color) {

    const marker = document.createElement('img');
          marker.src = this.getMarkerSrc(color);

    document.querySelector(this.getTileQuery(tile)).appendChild(marker);
  }

  renderTileAsActive(tile) {
    this.getTileElement(tile).classList.add('active');
  }

  renderTileAsInactive(tile) {
    this.getTileElement(tile).classList.remove('active');
  }

  renderAllTilesAsInactive() {

    this.activeTiles.forEach(({tile, listener}) => {
      const tileElement = this.getTileElement(tile);
      tileElement.removeEventListener('click', listener);
      this.renderTileAsInactive(tile);
    });
  }

  renderPlayerNames({one, two}) {
    document.querySelector('#player-one-name').textContent = one.name;
    document.querySelector('#player-two-name').textContent = two.name;
  }

  activateStartGameBtn() {
    this.startGame.removeAttribute('disabled');
  }

  inactivateStartGameBtn() {
    this.startGame.setAttribute('disabled', '');
  }

  activateTimeSettings() {
    this.timeSettings.forEach((input) => input.removeAttribute('disabled'));
  }

  inactivateTimeSettings() {
    this.timeSettings.forEach((input) => input.setAttribute('disabled', ''));
  }

  showAlert(msg) {

    const alertBox =  document.querySelector('.alert-box');
          alertBox.classList.add('active');
          alertBox.textContent = msg;

    setTimeout(() => {
      alertBox.classList.remove('active');
    }, 2000);
  }

  updateCurrentPlayer() {

    if (game.state.isGameActive) {

      if (game.state.currentPlayer === game.state.players.one) {
        document.querySelector('#player-two-info').classList.remove('active');
        document.querySelector('#player-one-info').classList.add('active');
      }
      else {
        document.querySelector('#player-one-info').classList.remove('active');
        document.querySelector('#player-two-info').classList.add('active');
      }
    }
  }

  updateTileCount({one, two}) {
    document.querySelector('#player-one-tile-count span').textContent = one.populatedTiles.length;
    document.querySelector('#player-two-tile-count span').textContent = two.populatedTiles.length;
  }

  updatePlayerTimer(player) {

    const {viewableTime} = player.timer;
    const timerElement = document.querySelector(`#player-${player.id === 1 ? 'one' : 'two'}-timer`);

    timerElement.querySelector('span').textContent = viewableTime;
    
    if (viewableTime < 10) {
      timerElement.classList.add('low');
    }
  }

  showWinner(msg, winner) {
    this.showAlert(msg);
    document.querySelector(`#player-${winner.id === 1 ? 'one' : 'two'}-info`).classList.add('winner');
    document.querySelector(`#player-${winner.id === 1 ? 'two' : 'one'}-info`).classList.remove('active');
  }

  setPlayerTimers() {
    
    const {one, two} = game.state.players;
    const playerOneTimer = document.querySelector('#player-one-timer');
    const playerTwoTimer = document.querySelector('#player-two-timer');

    playerOneTimer.classList.remove('low');
    playerTwoTimer.classList.remove('low');
    playerOneTimer.querySelector('span').textContent = one.timer.viewableTime;
    playerTwoTimer.querySelector('span').textContent = two.timer.viewableTime;
  }
}

class Tile {

  constructor(row, column) {
    this.row = row;
    this.column = column;
  }

  activate() {

    game.view.renderTileAsActive(this);

    game.view.addTileEventListener(this, () => {

      if (!game.state.isGameActive) {
        return;
      }

      game.state.currentPlayer.addTile(this);
      game.view.renderAllTilesAsInactive();
      game.engine.endTurn();
    });
  }

  connectsUp() {
    for (let i = this.row - 1; i >= 0; i--) {
      if (game.engine.isTileFree(game.state.getTile(i, this.column))) { return false; } // Doesn't connect if there is a free tile
      if (game.state.currentPlayer.populatedTiles.some(t => i === t.row && this.column === t.column)) { return true; }
    }
  }

  connectsBottom() {
    for (let i = this.row + 1; i < 8; i++) {
      if (game.engine.isTileFree(game.state.getTile(i, this.column))) { return false; } // Doesn't connect if there is a free tile
      if (game.state.currentPlayer.populatedTiles.some(t => i === t.row && this.column === t.column)) { return true; }
    }
  }

  connectsRight() {
    for (let i = this.column + 1; i < 8; i++) {
      if (game.engine.isTileFree(game.state.getTile(this.row, i))) { return false; } // Doesn't connect if there is a free tile
      if (game.state.currentPlayer.populatedTiles.some(t => this.row === t.row && i === t.column)) { return true; }
    }
  }

  connectsLeft() {
    for (let i = this.column - 1; i >= 0; i--) {
      if (game.engine.isTileFree(game.state.getTile(this.row, i))) { return false; } // Doesn't connect if there is a free tile
      if (game.state.currentPlayer.populatedTiles.some(t => this.row === t.row && i === t.column)) { return true; }
    }
  }

  connectsTopRight() {

    const rows = [];
    const columns = [];

    for (let i = this.row - 1; i >= 0; i--) {
      rows.push(i);
    }

    for (let i = this.column + 1; i < 8 ; i++) {
      columns.push(i);
    }

    const shortestArr = rows.length < columns.length ? rows : columns;

    for (let i = 0; i < shortestArr.length; i++) {
      if (game.engine.isTileFree(game.state.getTile(rows[i], columns[i]))) { return false; } // Doesn't connect if there is a free tile
      if (game.state.currentPlayer.populatedTiles.some(t => rows[i] === t.row && columns[i] === t.column)) { return true; }
    }
  }

  connectsBottomRight() {

    const rows = [];
    const columns = [];

    for (let i = this.row + 1; i < 8; i++) {
      rows.push(i);
    }

    for (let i = this.column + 1; i < 8 ; i++) {
      columns.push(i);
    }

    const shortestArr = rows.length < columns.length ? rows : columns;

    for (let i = 0; i < shortestArr.length; i++) {
      if (game.engine.isTileFree(game.state.getTile(rows[i], columns[i]))) { return false; } // Doesn't connect if there is a free tile
      if (game.state.currentPlayer.populatedTiles.some(t => rows[i] === t.row && columns[i] === t.column)) { return true; }
    }
  }

  connectsBottomLeft() {

    const rows = [];
    const columns = [];

    for (let i = this.row + 1; i < 8; i++) {
      rows.push(i);
    }

    for (let i = this.column - 1; i >= 0 ; i--) {
      columns.push(i);
    }

    const shortestArr = rows.length < columns.length ? rows : columns;

    for (let i = 0; i < shortestArr.length; i++) {
      if (game.engine.isTileFree(game.state.getTile(rows[i], columns[i]))) { return false; } // Doesn't connect if there is a free tile
      if (game.state.currentPlayer.populatedTiles.some(t => rows[i] === t.row && columns[i] === t.column)) { return true; }
    }
  }

  connectsTopLeft() {

    const rows = [];
    const columns = [];

    for (let i = this.row - 1; i >= 0; i--) {
      rows.push(i);
    }

    for (let i = this.column - 1; i >= 0 ; i--) {
      columns.push(i);
    }

    const shortestArr = rows.length < columns.length ? rows : columns;

    for (let i = 0; i < shortestArr.length; i++) {
      if (game.engine.isTileFree(game.state.getTile(rows[i], columns[i]))) { return false; } // Doesn't connect if there is a free tile
      if (game.state.currentPlayer.populatedTiles.some(t => rows[i] === t.row && columns[i] === t.column)) { return true; }
    }
  }

  hasTopOpponentTile() {

    return game.state.getOppositePlayer().populatedTiles.some((t) => {

      if (this.row - 1 === t.row && this.column === t.column) {
        return true;
      }
    });
  }

  hasRightOpponentTile() {

    return game.state.getOppositePlayer().populatedTiles.some((t) => {

      if (this.row === t.row && this.column + 1 === t.column) {
        return true;
      }
    });
  }

  hasBottomOpponentTile() {

    return game.state.getOppositePlayer().populatedTiles.some((t) => {

      if (this.row + 1 === t.row && this.column === t.column) {
        return true;
      }
    });
  }

  hasLeftOpponentTile() {

    return game.state.getOppositePlayer().populatedTiles.some((t) => {

      if (this.row === t.row && this.column - 1 === t.column) {
        return true;
      }
    });
  }

  hasDiagonalTopRightOpponentTile() {

    return game.state.getOppositePlayer().populatedTiles.some((t) => {
      
      if (this.row - 1 === t.row && this.column + 1 === t.column) {
        return true;
      }
    });
  }

  hasDiagonalBottomRightOpponentTile() {

    return game.state.getOppositePlayer().populatedTiles.some((t) => {

      if (this.row + 1 === t.row && this.column + 1 === t.column) {
        return true;
      }
    });
  }

  hasDiagonalTopLeftOpponentTile() {

    return game.state.getOppositePlayer().populatedTiles.some((t) => {

      if (this.row - 1 === t.row && this.column - 1 === t.column) {
        return true;
      }
    });
  }

  hasDiagonalBottomLeftOpponentTile() {

    return game.state.getOppositePlayer().populatedTiles.some((t) => {

      if (this.row + 1 === t.row && this.column - 1 === t.column) {
        return true;
      }
    });
  }
}

class Engine {

  isTileFree(tile) {

    const {one, two} = game.state.players;

    // Note: Notice the ! which checks for empty tile, rather than a populated one
    return ![one, two].some(({populatedTiles}) => {
      return populatedTiles.some((o) => o.row === tile.row && o.column === tile.column);
    });
  }

  flipTiles(tile) {

    function checkAndFlipTile(row, column) {

      const opp = game.state.getOppositePlayer();
          
      if (opp.isPlayerTile(row, column)) {
        opp.flipTile(row, column);
        return true;
      }
    }

    if (tile.hasTopOpponentTile() && tile.connectsUp()) {

      for (let i = tile.row - 1; i >= 0; i--) {
        if (!checkAndFlipTile(i, tile.column)) break;
      }
    }

    if (tile.hasRightOpponentTile() && tile.connectsRight()) {

      for (let i = tile.column + 1; i < 8; i++) {
        if (!checkAndFlipTile(tile.row, i)) break;
      }
    }

    if (tile.hasBottomOpponentTile() && tile.connectsBottom()) {

      for (let i = tile.row + 1; i < 8; i++) {
        if (!checkAndFlipTile(i, tile.column)) break;
      }
    }

    if (tile.hasLeftOpponentTile() && tile.connectsLeft()) {
        
      for (let i = tile.column - 1; i >= 0; i--) {
        if (!checkAndFlipTile(tile.row, i)) break;
      }
    }

    if (tile.hasDiagonalTopRightOpponentTile() && tile.connectsTopRight()) {
      
      const rows = [];
      const columns = [];

      for (let i = tile.row - 1; i >= 0; i--) {
        rows.push(i);
      }

      for (let i = tile.column + 1; i < 8 ; i++) {
        columns.push(i);
      }

      const shortestArr = rows.length < columns.length ? rows : columns;

      for (let i = 0; i < shortestArr.length; i++) {
        if (!checkAndFlipTile(rows[i], columns[i])) break;
      }
    }

    if (tile.hasDiagonalBottomRightOpponentTile() && tile.connectsBottomRight()) {
      
      const rows = [];
      const columns = [];

      for (let i = tile.row + 1; i < 8; i++) {
        rows.push(i);
      }

      for (let i = tile.column + 1; i < 8 ; i++) {
        columns.push(i);
      }

      const shortestArr = rows.length < columns.length ? rows : columns;

      for (let i = 0; i < shortestArr.length; i++) {
        if (!checkAndFlipTile(rows[i], columns[i])) break;
      }
    }

    if (tile.hasDiagonalBottomLeftOpponentTile() && tile.connectsBottomLeft()) {
      
      const rows = [];
      const columns = [];

      for (let i = tile.row + 1; i < 8; i++) {
        rows.push(i);
      }

      for (let i = tile.column - 1; i >= 0 ; i--) {
        columns.push(i);
      }

      const shortestArr = rows.length <= columns.length ? rows : columns;

      for (let i = 0; i < shortestArr.length; i++) {
        if (!checkAndFlipTile(rows[i], columns[i])) break;
      }
    }

    if (tile.hasDiagonalTopLeftOpponentTile() && tile.connectsTopLeft()) {
      
      const rows = [];
      const columns = [];

      for (let i = tile.row - 1; i >= 0; i--) {
        rows.push(i);
      }

      for (let i = tile.column - 1; i >= 0 ; i--) {
        columns.push(i);
      }

      const shortestArr = rows.length < columns.length ? rows : columns;

      for (let i = 0; i < shortestArr.length; i++) {
        if (!checkAndFlipTile(rows[i], columns[i])) break;
      }
    }
  }

  endTurn(opponentHadNoMoves) {

    game.state.currentPlayer.stopTimer();
    game.view.updateTileCount(game.state.players);
    game.state.nextTurn();
    game.state.currentPlayer.startTimer();

    const hasMovesAvailable = this.checkAvailableTiles();

    if (!hasMovesAvailable && !opponentHadNoMoves) {
      this.endTurn(true);
    }
    else if (!hasMovesAvailable && opponentHadNoMoves) {
      game.endGame();
    }
  }

  checkAvailableTiles() {

    let hasMovesAvailable = false;

    function checkTile(row, column) {

      const t = game.state.getTile(row, column);
          
      if (t && game.engine.isTileFree(t)) {
        t.activate();
        hasMovesAvailable = true;
        return true;
      }
    }

    game.state.currentPlayer.populatedTiles.forEach((tile) => {

      if (tile.hasTopOpponentTile() && !tile.connectsUp()) {
        for (let i = tile.row - 1; i >= 0; i--) {
          if (checkTile(i - 1, tile.column)) break;
        }
      }

      if (tile.hasRightOpponentTile() && !tile.connectsRight()) {
        for (let i = tile.column + 1; i < 8; i++) {
          if (checkTile(tile.row, i + 1)) break;
        }
      }

      if (tile.hasBottomOpponentTile() && !tile.connectsBottom()) {
        for (let i = tile.row + 1; i < 8; i++) {
          if (checkTile(i + 1, tile.column)) break;
        }
      }
    
      if (tile.hasLeftOpponentTile() && !tile.connectsLeft()) {
        for (let i = tile.column - 1; i >= 0; i--) {
          if (checkTile(tile.row, i - 1)) break;
        }
      }

      if (tile.hasDiagonalTopRightOpponentTile() && !tile.connectsTopRight()) {

        const rows = [];
        const columns = [];

        for (let i = tile.row - 1; i >= 0; i--) {
          rows.push(i);
        }

        for (let i = tile.column + 1; i < 8; i++) {
          columns.push(i);
        }

        const shortestArr = rows.length <= columns.length ? rows : columns;

        for (let i = 0; i < shortestArr.length; i++) {
          if (checkTile(rows[i] - 1, columns[i] + 1)) break;
        }
      }

      if (tile.hasDiagonalBottomRightOpponentTile() && !tile.connectsBottomRight()) {
        
        const rows = [];
        const columns = [];

        for (let i = tile.row + 1; i < 8; i++) {
          rows.push(i);
        }

        for (let i = tile.column + 1; i < 8; i++) {
          columns.push(i);
        }

        const shortestArr = rows.length < columns.length ? rows : columns;

        for (let i = 0; i < shortestArr.length; i++) {
          if (checkTile(rows[i] + 1, columns[i] + 1)) break;
        }
      }

      if (tile.hasDiagonalTopLeftOpponentTile() && !tile.connectsTopLeft()) {
        
        const rows = [];
        const columns = [];

        for (let i = tile.row - 1; i >= 0; i--) {
          rows.push(i);
        }

        for (let i = tile.column - 1; i >= 0; i--) {
          columns.push(i);
        }

        const shortestArr = rows.length < columns.length ? rows : columns;

        for (let i = 0; i < shortestArr.length; i++) {
          if (checkTile(rows[i] - 1, columns[i] - 1)) break;
        }
      }

      if (tile.hasDiagonalBottomLeftOpponentTile() && !tile.connectsBottomLeft()) {
        
        const rows = [];
        const columns = [];

        for (let i = tile.row + 1; i < 8; i++) {
          rows.push(i);
        }

        for (let i = tile.column - 1; i >= 0; i--) {
          columns.push(i);
        }

        const shortestArr = rows.length < columns.length ? rows : columns;

        for (let i = 0; i < shortestArr.length; i++) {
          if (checkTile(rows[i] + 1, columns[i] - 1)) break;
        }
      }
    });

    return hasMovesAvailable;
  }
}

class Timer {

  player;
  startTime;
  elapsedTime = 0;
  viewableTime;
  remainingTime;
  isPaused = true;

  constructor(player) {
    this.player = player;
  }

  setTime(milliseconds) {
    this.remainingTime = milliseconds;
    this.setViewableTime();
  }

  setViewableTime() {
    const time = ((this.remainingTime - this.elapsedTime) / 1000).toFixed(2);
    this.viewableTime = parseInt(time) <= 0 ? '0.00' : time;
  }

  create() {

    this.interval = setInterval(() => {

      if (!this.isPaused && game.state.isGameActive) {

        this.elapsedTime = Date.now() - this.startTime;

        this.setViewableTime();

        game.view.updatePlayerTimer(this.player);

        if (this.viewableTime <= 0) {
          this.ranOut();
        }
      }
    }, 100);
  }

  start() {

    this.startTime = Date.now();
    this.elapsedTime = 0;
 
    this.isPaused = false;

    if (!this.interval) {
      this.create();
    }
  }

  stop() {
    this.isPaused = true;
    this.remainingTime = this.remainingTime - this.elapsedTime;
  }

  reset() {
    clearInterval(this.interval);
    this.startTime = undefined;
    this.elapsedTime = 0;
    this.viewableTime = undefined;
    this.interval = undefined;
    this.isPaused = true;
  }

  ranOut() {
    game.endGame(true);
  }
}

class Player {

  populatedTiles = [];

  constructor(id, name, color) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.timer = new Timer(this);
  }

  startTimer() {
    this.timer.start();
  }

  stopTimer() {
    this.timer.stop();
  }

  flipTile(row, column) {

    const i = this.populatedTiles.findIndex(tile => tile.row === row && tile.column === column);
    const tile = this.populatedTiles.splice(i, 1)[0];

    const opponent = game.state.currentPlayer;
          opponent.populatedTiles.push(tile);
          opponent.populatedTiles.sort((a, b) => (a.row - b.row) || (a.column - b.column));

    game.view.flipTile(tile, opponent.color);
  }

  addTile(tile, init = false) {

    this.populatedTiles.push(tile);
    this.populatedTiles.sort((a, b) => (a.row - b.row) || (a.column - b.column));

    game.view.renderTileAsPopulated(tile, this.color);

    if (!init) {
      game.engine.flipTiles(tile);
    }
  }

  isPlayerTile(row, column) {
    return this.populatedTiles.some(t => t.row === row && t.column === column);
  }

  reset() {
    this.populatedTiles = [];
    this.timer.reset();
  }
}

class State {

  tiles = [];
  isGameActive = false;

  constructor() {

    this.players = {
      one: new Player(1, 'Snakeboi229', 'black'),
      two: new Player(2, 'leetmeister', 'white')
    };

    this.currentPlayer = this.players.one;

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        this.tiles.push(new Tile(i, j));
      }
    }
  }

  getTile(row, column) {
    return this.tiles.find(tile => tile.row === row && tile.column === column);
  }

  getOppositePlayer() {
    const {one, two} = this.players;
    return this.currentPlayer === one ? two : one;
  }

  nextTurn() {
    this.currentPlayer = this.getOppositePlayer();
    game.view.updateCurrentPlayer();
  }

  start() {
    this.isGameActive = true;
  }

  stop() {
    this.isGameActive = false;
  }
}

class Game {

  constructor() {

    this.engine = new Engine();
    this.state = new State();
    this.view = new View();

    this.view.onNewGame(() => {
      this.resetGame();
    });

    this.view.onStartGame(() => {
      this.startGame();
    })

    this.view.onTimeSettingsChange(this.setPlayerTimers);
  }

  setPlayerTimers(time = this.view.getCurrentTimeSettings()) {
    game.state.players.one.timer.setTime(time);
    game.state.players.two.timer.setTime(time);
    game.view.setPlayerTimers();
  }

  setup() {

    const {one, two} = this.state.players;

    one.addTile(this.state.getTile(3, 4), true);
    one.addTile(this.state.getTile(4, 3), true);
    two.addTile(this.state.getTile(3, 3), true);
    two.addTile(this.state.getTile(4, 4), true);

    this.view.renderPlayerNames(this.state.players);
    this.view.updateTileCount(this.state.players)
    this.setPlayerTimers();
  }

  resetGame() {
    this.view.reset();
    this.state.players.one.reset();
    this.state.players.two.reset();
    this.state.currentPlayer = this.state.players.one;
    this.setup();
    this.view.updateCurrentPlayer();
  }

  startGame() {
    this.state.start();
    this.state.currentPlayer.startTimer();
    this.view.updateCurrentPlayer();
    this.engine.checkAvailableTiles();
  }

  endGame(ranOutOfTime) {

    const {one, two} = this.state.players;
    const {currentPlayer} = this.state;
    const opposition = this.state.getOppositePlayer();
    const numOfPlayerOneTiles = one.populatedTiles.length;
    const numOfPlayerTwoTiles = two.populatedTiles.length;

    if (ranOutOfTime) {
      this.view.showWinner(`${currentPlayer.name} ran out of time. ${opposition.name} wins!`, opposition);
    }
    else if (numOfPlayerOneTiles === numOfPlayerTwoTiles) {
      this.view.showAlert('It ends in a draw!');
    }
    else {
      const winner = numOfPlayerOneTiles > numOfPlayerTwoTiles ? one : two;
      this.view.showWinner(`${winner.name} wins!`, winner);
    }

    this.state.stop();
    this.view.renderAllTilesAsInactive();
  }
}

const game = new Game();

game.setup();