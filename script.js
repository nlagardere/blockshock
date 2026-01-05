 // ========== GAME CONSTANTS ==========
    const GRID_SIZE = 8;
    const COLORS = ['cyan', 'orange', 'pink', 'green', 'purple', 'yellow'];
    
    const SHAPES = [
      [[1]],
      [[1, 1]],
      [[1], [1]],
      [[1, 1, 1]],
      [[1], [1], [1]],
      [[1, 1], [1, 1]],
      [[1, 0], [1, 0], [1, 1]],
      [[0, 1], [0, 1], [1, 1]],
      [[1, 1, 1], [0, 1, 0]],
      [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
      [[1, 1, 1, 1]],
      [[1], [1], [1], [1]],
      [[1, 1, 1, 1, 1]],
      [[1], [1], [1], [1], [1]],
      [[1, 1, 0], [0, 1, 1]],
      [[0, 1, 1], [1, 1, 0]],
    ];

    // ========== GAME STATE ==========
    let grid = [];
    let pieces = [];
    let score = 0;
    let isGameOver = false;
    let draggingPieceIndex = null;
    let hoverPosition = null;

    // ========== DOM ELEMENTS ==========
    const gameGridEl = document.getElementById('gameGrid');
    const piecesRowEl = document.getElementById('piecesRow');
    const scoreDisplayEl = document.getElementById('scoreDisplay');
    const dragPreviewEl = document.getElementById('dragPreview');
    const gameOverOverlayEl = document.getElementById('gameOverOverlay');
    const finalScoreEl = document.getElementById('finalScore');
    const restartBtnEl = document.getElementById('restartBtn');
    const playAgainBtnEl = document.getElementById('playAgainBtn');

    // ========== UTILITY FUNCTIONS ==========
    function getRandomColor() {
      return COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    function getRandomBlock() {
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      return { shape, color: getRandomColor() };
    }

    function createEmptyGrid() {
      return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    }

    function generateNewPieces() {
      return [getRandomBlock(), getRandomBlock(), getRandomBlock()];
    }

    function canPlaceBlock(block, row, col) {
      const { shape } = block;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const gridRow = row + r;
            const gridCol = col + c;
            if (gridRow < 0 || gridRow >= GRID_SIZE || gridCol < 0 || gridCol >= GRID_SIZE) {
              return false;
            }
            if (grid[gridRow][gridCol] !== null) {
              return false;
            }
          }
        }
      }
      return true;
    }

    function placeBlock(block, row, col) {
      const { shape, color } = block;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            grid[row + r][col + c] = color;
          }
        }
      }
    }

    function findCompletedLines() {
      const rows = [];
      const cols = [];

      for (let r = 0; r < GRID_SIZE; r++) {
        if (grid[r].every(cell => cell !== null)) {
          rows.push(r);
        }
      }

      for (let c = 0; c < GRID_SIZE; c++) {
        let complete = true;
        for (let r = 0; r < GRID_SIZE; r++) {
          if (grid[r][c] === null) {
            complete = false;
            break;
          }
        }
        if (complete) cols.push(c);
      }

      return { rows, cols };
    }

    function clearLines(rows, cols) {
      for (const row of rows) {
        for (let c = 0; c < GRID_SIZE; c++) {
          grid[row][c] = null;
        }
      }
      for (const col of cols) {
        for (let r = 0; r < GRID_SIZE; r++) {
          grid[r][col] = null;
        }
      }
    }

    function getBlockSize(block) {
      return block.shape.flat().filter(Boolean).length;
    }

    function calculateScore(rows, cols, blockSize) {
      const linesCleared = rows.length + cols.length;
      const lineScore = linesCleared * GRID_SIZE * 10;
      const bonusScore = linesCleared > 1 ? linesCleared * 50 : 0;
      return blockSize + lineScore + bonusScore;
    }

    function canPlaceAnyPiece() {
      for (const piece of pieces) {
        if (piece === null) continue;
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            if (canPlaceBlock(piece, row, col)) {
              return true;
            }
          }
        }
      }
      return false;
    }

    // ========== RENDERING ==========
    function renderGrid() {
      gameGridEl.innerHTML = '';
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const cell = document.createElement('div');
          cell.className = 'grid-cell';
          cell.dataset.row = r;
          cell.dataset.col = c;
          
          const color = grid[r][c];
          if (color) {
            cell.classList.add(`block-${color}`, 'placed');
          }
          
          gameGridEl.appendChild(cell);
        }
      }
    }

    function renderPieces() {
      piecesRowEl.innerHTML = '';
      pieces.forEach((piece, index) => {
        const slot = document.createElement('div');
        slot.className = 'piece-slot';
        
        if (piece) {
          const wrapper = document.createElement('div');
          wrapper.className = 'piece-wrapper';
          wrapper.dataset.index = index;
          
          const pieceGrid = document.createElement('div');
          pieceGrid.className = 'piece-grid';
          pieceGrid.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 1fr)`;
          
          piece.shape.forEach(row => {
            row.forEach(cell => {
              const cellEl = document.createElement('div');
              cellEl.className = `piece-cell ${cell ? `block-${piece.color}` : 'empty'}`;
              pieceGrid.appendChild(cellEl);
            });
          });
          
          wrapper.appendChild(pieceGrid);
          slot.appendChild(wrapper);
          
          // Add drag events
          wrapper.addEventListener('pointerdown', (e) => startDrag(e, index));
        } else {
          const empty = document.createElement('div');
          empty.className = 'empty-slot';
          slot.appendChild(empty);
        }
        
        piecesRowEl.appendChild(slot);
      });
    }

    function renderDragPreview(piece, x, y) {
      if (!piece) {
        dragPreviewEl.style.display = 'none';
        return;
      }
      
      const pieceGrid = document.createElement('div');
      pieceGrid.className = 'piece-grid';
      pieceGrid.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 1fr)`;
      
      piece.shape.forEach(row => {
        row.forEach(cell => {
          const cellEl = document.createElement('div');
          cellEl.className = `piece-cell ${cell ? `block-${piece.color}` : 'empty'}`;
          pieceGrid.appendChild(cellEl);
        });
      });
      
      dragPreviewEl.innerHTML = '';
      dragPreviewEl.appendChild(pieceGrid);
      
      const cellSize = window.innerWidth <= 400 ? 32 : 38;
      const offsetX = (piece.shape[0].length * cellSize) / 2;
      const offsetY = (piece.shape.length * cellSize) / 2;
      
      dragPreviewEl.style.left = `${x - offsetX}px`;
      dragPreviewEl.style.top = `${y - offsetY}px`;
      dragPreviewEl.style.display = 'block';
    }

    function updateGridPreview() {
      const cells = gameGridEl.querySelectorAll('.grid-cell');
      cells.forEach(cell => {
        cell.classList.remove('preview-valid', 'preview-invalid');
      });
      
      if (draggingPieceIndex === null || hoverPosition === null) return;
      
      const piece = pieces[draggingPieceIndex];
      if (!piece) return;
      
      const isValid = canPlaceBlock(piece, hoverPosition.row, hoverPosition.col);
      
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c]) {
            const gridRow = hoverPosition.row + r;
            const gridCol = hoverPosition.col + c;
            if (gridRow >= 0 && gridRow < GRID_SIZE && gridCol >= 0 && gridCol < GRID_SIZE) {
              const cell = gameGridEl.querySelector(`[data-row="${gridRow}"][data-col="${gridCol}"]`);
              if (cell && !grid[gridRow][gridCol]) {
                cell.classList.add(isValid ? 'preview-valid' : 'preview-invalid');
              }
            }
          }
        }
      }
    }

    function updateScore() {
      scoreDisplayEl.textContent = score.toLocaleString();
      scoreDisplayEl.classList.add('animate');
      setTimeout(() => scoreDisplayEl.classList.remove('animate'), 300);
    }

    function showGameOver() {
      finalScoreEl.textContent = score.toLocaleString();
      gameOverOverlayEl.classList.remove('hidden');
    }

    // ========== DRAG AND DROP ==========
    function startDrag(e, index) {
      e.preventDefault();
      draggingPieceIndex = index;
      
      const wrapper = piecesRowEl.querySelector(`[data-index="${index}"]`);
      if (wrapper) wrapper.classList.add('dragging');
      
      handleDragMove(e);
      
      document.addEventListener('pointermove', handleDragMove);
      document.addEventListener('pointerup', handleDrop);
    }

    function handleDragMove(e) {
      if (draggingPieceIndex === null) return;
      
      const piece = pieces[draggingPieceIndex];
      renderDragPreview(piece, e.clientX, e.clientY);
      
      // Calculate grid position
      const gridRect = gameGridEl.getBoundingClientRect();
      const cellSize = gridRect.width / GRID_SIZE;
      
      const pieceWidth = piece.shape[0].length;
      const pieceHeight = piece.shape.length;
      
      const x = e.clientX - gridRect.left - (pieceWidth * cellSize) / 2;
      const y = e.clientY - gridRect.top - (pieceHeight * cellSize) / 2;
      
      const col = Math.round(x / cellSize);
      const row = Math.round(y / cellSize);
      
      hoverPosition = { row, col };
      updateGridPreview();
    }

    function handleDrop(e) {
      document.removeEventListener('pointermove', handleDragMove);
      document.removeEventListener('pointerup', handleDrop);
      
      dragPreviewEl.style.display = 'none';
      
      const wrapper = piecesRowEl.querySelector(`[data-index="${draggingPieceIndex}"]`);
      if (wrapper) wrapper.classList.remove('dragging');
      
      if (draggingPieceIndex === null || hoverPosition === null) {
        draggingPieceIndex = null;
        hoverPosition = null;
        updateGridPreview();
        return;
      }
      
      const piece = pieces[draggingPieceIndex];
      if (!piece || !canPlaceBlock(piece, hoverPosition.row, hoverPosition.col)) {
        draggingPieceIndex = null;
        hoverPosition = null;
        updateGridPreview();
        return;
      }
      
      // Place the block
      placeBlock(piece, hoverPosition.row, hoverPosition.col);
      const blockSize = getBlockSize(piece);
      
      // Find and clear lines
      const { rows, cols } = findCompletedLines();
      
      if (rows.length > 0 || cols.length > 0) {
        // Mark cells for animation
        const cells = gameGridEl.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
          const r = parseInt(cell.dataset.row);
          const c = parseInt(cell.dataset.col);
          if (rows.includes(r) || cols.includes(c)) {
            cell.classList.add('clearing');
          }
        });
        
        setTimeout(() => {
          clearLines(rows, cols);
          score += calculateScore(rows, cols, blockSize);
          updateScore();
          
          pieces[draggingPieceIndex] = null;
          if (pieces.every(p => p === null)) {
            pieces = generateNewPieces();
          }
          
          if (!canPlaceAnyPiece()) {
            isGameOver = true;
            showGameOver();
          }
          
          renderGrid();
          renderPieces();
        }, 400);
      } else {
        score += blockSize;
        updateScore();
        
        pieces[draggingPieceIndex] = null;
        if (pieces.every(p => p === null)) {
          pieces = generateNewPieces();
        }
        
        if (!canPlaceAnyPiece()) {
          isGameOver = true;
          showGameOver();
        }
        
        renderGrid();
        renderPieces();
      }
      
      draggingPieceIndex = null;
      hoverPosition = null;
      updateGridPreview();
    }

    // ========== GAME CONTROL ==========
    function initGame() {
      grid = createEmptyGrid();
      pieces = generateNewPieces();
      score = 0;
      isGameOver = false;
      draggingPieceIndex = null;
      hoverPosition = null;
      
      gameOverOverlayEl.classList.add('hidden');
      scoreDisplayEl.textContent = '0';
      
      renderGrid();
      renderPieces();
    }

    // ========== EVENT LISTENERS ==========
    restartBtnEl.addEventListener('click', initGame);
    playAgainBtnEl.addEventListener('click', initGame);

    // ========== START GAME ==========
    initGame();