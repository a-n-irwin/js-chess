const gameBoard = document.querySelector('#gameboard');
const playerDisplay = document.querySelector('#player');
const infoDisplay = document.querySelector('#info-display');

const width = 8;


let playerGo = 'black';
// The position on the board the piece starts from
let startPositionId = -1;
let draggedElement;

let taken, takenByOpponent;
let targetId, startId, idInterval;
let startRow, startCol, targetRow, targetCol;
// How far apart are the rows and how far apart are the columns
let rowInterval, colInterval;


const startPieces = [
    rook, bishop, knight, queen, king, knight, bishop, rook,
    pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn,
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn,
    rook, bishop, knight, queen, king, knight, bishop, rook
];

let allSquares;


function init() {
    playerDisplay.textContent = playerGo;

    createBoard();

    allSquares = document.querySelectorAll('.square');
    allSquares.forEach(square => {
        square.addEventListener('dragstart', dragStart);
        square.addEventListener('dragover', dragOver);
        square.addEventListener('drop', dragDrop);
    });
}

function createBoard() {
    startPieces.forEach((startPiece, i) => {
        const square = document.createElement('div');

        square.classList.add('square');
        square.setAttribute('square-id', i);
        square.innerHTML = startPiece;
        square.firstChild?.setAttribute('draggable', 'true');

        // Zero-based: first row = 0, second row = 1, etc...
        const row = Math.floor(i / 8);

        if (row % 2 === 0) {
            square.classList.add(i % 2 === 0 ? 'white-square' : 'black-square');
        } else {
            square.classList.add(i % 2 === 0 ? 'black-square' : 'white-square');
        }

        // Determine the color of the pieces
        if (i <= 15) {
            square.firstChild.firstChild.classList.add('white-piece');
        } else if (i >= 48) {

            square.firstChild.firstChild.classList.add('black-piece');
        }

        gameBoard.append(square);
    });
}


function dragStart(e) {
    draggedElement = e.target;
    startPositionId = draggedElement.parentNode.getAttribute('square-id');
}


function dragOver(e) {
    //
    e.preventDefault();
}


function dragDrop(e) {
    //
    e.stopPropagation();

    correctGo = draggedElement.firstChild.classList.contains(playerGo + '-piece');
    opponentGo = playerGo === 'black' ? 'white' : 'black';
    taken = e.target.classList.contains('piece');
    takenByOpponent = e.target.firstChild?.classList.contains(opponentGo + '-piece');

    if (correctGo) {
        if (isValidMove(e.target)) {
            // This will immediately reset the info display when a valid move is made before the notification reset timer clears the last notification
            notifyPlayer('', false);
            if (!taken) {
                e.target.append(draggedElement);
                // Only change players if the game is still ongoing
                if (!checkWin()) changePlayer();
            } else if (takenByOpponent) {
                document.getElementById(`${playerGo}-captures`).innerHTML += `<div class="captured-piece">${e.target.innerHTML}</div>`;
                e.target.parentNode.append(draggedElement);
                e.target.remove();
                // Only change players if the game is still ongoing
                if (!checkWin()) changePlayer();
            } else notifyPlayer('You can not go there!');
        }
        else notifyPlayer('You can not go there!');
    }
}

function notifyPlayer(message, useTimer = true) {
    infoDisplay.textContent = message;
    if (useTimer) setTimeout(() => { infoDisplay.textContent = '' }, 2000);
}


function changePlayer() {
    playerGo = playerGo === 'black' ? 'white' : 'black';
    playerDisplay.textContent = playerGo;
}


// Move validation lookup object
const validMoves = {
    'pawn': () => {
        let direction = 1;
        // Flip the rows depending on who's playing. 
        if (playerGo === 'black') {
            startRow = width - 1 - startRow;
            targetRow = width - 1 - targetRow;
            direction = -1;
        }
        // Check if the pawn's movement is blocked by any piece
        const blockedByPiece = Boolean(document.querySelector(`[square-id="${startId + direction * width}"]`).firstChild);

        return targetRow > startRow && ((!taken && !blockedByPiece && startRow === 1 && idInterval === 2 * width) || (!taken && idInterval === width) || (takenByOpponent && (idInterval === width - 1 || idInterval === width + 1)));
    },
    'rook': () => {
        // Successful vertical movement or horizontal movement
        if ((rowInterval !== 0 && colInterval === 0) || (rowInterval === 0 && colInterval !== 0)) {
            // Check if the rook's movement is blocked by any piece
            for (let i = Math.abs(rowInterval ? rowInterval : colInterval) - 1; i > 0; --i) {
                const id = rowInterval ? startId + Math.sign(rowInterval) * i * width : startId + Math.sign(colInterval) * i;
                if (Boolean(document.querySelector(`[square-id="${id}"]`).firstChild)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    },
    'bishop': () => {
        // Successful diagonal movement
        if (Math.abs(rowInterval) === Math.abs(colInterval) && rowInterval !== 0) {
            // Check if the bishop's movement is blocked by any piece
            for (let i = Math.abs(rowInterval) - 1; i > 0; --i) {
                if (Boolean(document.querySelector(`[square-id="${startId + Math.sign(rowInterval) * i * width + Math.sign(colInterval) * i
                    }"]`).firstChild)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    },
    'knight': () => {
        // Two steps up or down, one step right or left - Two steps right or left, one step up or down
        return (Math.abs(rowInterval) === 2 && Math.abs(colInterval) === 1) || (Math.abs(colInterval) === 2 && Math.abs(rowInterval) === 1);
    },
    'queen': () => {
        // A queen is simply just a rook and a bishop at the same time
        // return this.rook() || this.bishop();
        return (validMoves['rook']() || validMoves['bishop']());
    },
    'king': () => {
        // King moves one step anywhere
        return (idInterval === width || idInterval === width - 1 || idInterval === width + 1 || idInterval === 1);
    }
}


function isValidMove(target) {
    targetId = Number(target.getAttribute('square-id') || target.parentNode.getAttribute('square-id'));
    startId = Number(startPositionId);
    idInterval = Math.abs(targetId - startId);

    startRow = Math.floor(startId / width);
    startCol = startId % width;
    targetRow = Math.floor(targetId / width);
    targetCol = targetId % width;

    // How far apart are the rows and how far apart are the columns
    rowInterval = targetRow - startRow;
    colInterval = targetCol - startCol;

    return validMoves[draggedElement.id]();
}

function checkWin() {
    const kings = document.querySelectorAll('#gameboard #king');

    // If there is one less king piece then the current player wins: Player turns only change when this function returns false
    if (kings.length < 2) {
        notifyPlayer(`${playerGo} player wins`, false);
        playerDisplay.parentElement.textContent = '';
        playerGo = '';
        // Make all the remaining pieces non-draggable so the game kind of ends
        document.querySelectorAll('.piece').forEach(piece => {
            piece.setAttribute('draggable', false);
        });

        return true;
    }

    return false;
}


init();
