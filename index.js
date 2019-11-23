class View {

  board = document.querySelector('#board');
  title = document.querySelector('#current-player');
  newGame = document.querySelector('#new-game');

  activeTiles = [];

  constructor() {
    this.render();
  }
  
  onNewGame(cb) {
    this.newGame.addEventListener('click', cb);
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

  addTileEventListener(tile, cb) {

    const tileElement = this.getTileElement(tile);

    const clickFn = () => {
      cb();
    }

    this.activeTiles.push({tile, listener: clickFn});

    tileElement.addEventListener('click', clickFn);
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

  showAlert(msg) {

    const alertBox =  document.querySelector('.alert-box');
          alertBox.classList.add('active');
          alertBox.textContent = msg;

    setTimeout(() => {
      alertBox.classList.remove('active');
    }, 2000);
  }

  updateCurrentPlayer() {

    if (game.state.currentPlayer === game.state.players.one) {
      document.querySelector('#player-two-info').classList.remove('active');
      document.querySelector('#player-one-info').classList.add('active');
    }
    else {
      document.querySelector('#player-one-info').classList.remove('active');
      document.querySelector('#player-two-info').classList.add('active');
    }
  }

  updateTileCount({one, two}) {
    document.querySelector('#player-one-tile-count span').textContent = one.populatedTiles.length;
    document.querySelector('#player-two-tile-count span').textContent = two.populatedTiles.length;
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

    if (tile.hasTopOpponentTile() && tile.connectsUp()) {

      for (let i = tile.row - 1; i >= 0; i--) {

        const opp = game.state.getOppositePlayer();

        if (opp.isPlayerTile(i, tile.column)) {
          opp.flipTile(i, tile.column);
        }
        else {
          break;
        }
      }
    }

    if (tile.hasRightOpponentTile() && tile.connectsRight()) {

      for (let i = tile.column + 1; i < 8; i++) {

        const opp = game.state.getOppositePlayer();

        if (opp.isPlayerTile(tile.row, i)) {
          opp.flipTile(tile.row, i);
        }
        else {
          break;
        }
      }
    }

    if (tile.hasBottomOpponentTile() && tile.connectsBottom()) {

      for (let i = tile.row + 1; i < 8; i++) {

        const opp = game.state.getOppositePlayer();

        if (opp.isPlayerTile(i, tile.column)) {
          opp.flipTile(i, tile.column);
        }
        else {
          break;
        }
      }
    }

    if (tile.hasLeftOpponentTile() && tile.connectsLeft()) {
        
      for (let i = tile.column - 1; i >= 0; i--) {
       
        const opp = game.state.getOppositePlayer();

        if (opp.isPlayerTile(tile.row, i)) {
          opp.flipTile(tile.row, i);
        }
        else {
          break;
        }
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

        const opp = game.state.getOppositePlayer();

        if (opp.isPlayerTile(rows[i], columns[i])) {
          opp.flipTile(rows[i], columns[i]);
        }
        else {
          break;
        }
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

        const opp = game.state.getOppositePlayer();

        if (opp.isPlayerTile(rows[i], columns[i])) {
          opp.flipTile(rows[i], columns[i]);
        }
        else {
          break;
        }
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

        const opp = game.state.getOppositePlayer();

        if (opp.isPlayerTile(rows[i], columns[i])) {
          opp.flipTile(rows[i], columns[i]);
        }
        else {
          break;
        }
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

        const opp = game.state.getOppositePlayer();

        if (opp.isPlayerTile(rows[i], columns[i])) {
          opp.flipTile(rows[i], columns[i]);
        }
        else {
          break;
        }
      }
    }
  }

  endTurn(opponentHadNoMoves) {

    game.view.updateTileCount(game.state.players);
    game.state.nextTurn();

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

class Player {

  populatedTiles = [];

  constructor(id, name, color) {
    this.id = id;
    this.name = name;
    this.color = color;
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

    if (this.currentPlayer === this.players.one) {
      this.currentPlayer = this.players.two;
    }
    else {
      this.currentPlayer = this.players.one;
    }

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
      game.resetGame();
      game.startGame();
    });
  }

  setup() {

    const {one, two} = this.state.players;

    one.addTile(game.state.getTile(3, 4), true);
    one.addTile(game.state.getTile(4, 3), true);
    two.addTile(game.state.getTile(3, 3), true);
    two.addTile(game.state.getTile(4, 4), true);

    this.view.renderPlayerNames(this.state.players);
    this.view.updateTileCount(this.state.players)
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
    this.view.updateCurrentPlayer();
    game.engine.checkAvailableTiles();
  }

  endGame() {

    const {one, two} = game.state.players;
    const numOfPlayerOneTiles = one.populatedTiles.length;
    const numOfPlayerTwoTiles = two.populatedTiles.length;

    if (numOfPlayerOneTiles === numOfPlayerTwoTiles) {
      this.view.showAlert('It ends in a draw!');
    }
    else {

      const winner = numOfPlayerOneTiles > numOfPlayerTwoTiles ? one : two;
      this.view.showAlert(`${winner.name} wins!`);
    }

    game.state.stop();
  }
}

const game = new Game();

game.setup();
game.startGame();