// src/components/TicTacToe.js

import React, { useState } from 'react';
import './TicTacToe.css'; // CSS for styling
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Button } from 'react-bootstrap'; // Optional: Using React Bootstrap for styling

const TicTacToe = () => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const initialBoard = Array(9).fill(null);
    const [board, setBoard] = useState(initialBoard);
    const [isXNext, setIsXNext] = useState(true);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [winningLine, setWinningLine] = useState([]);
    const [resetCount, setResetCount] = useState(0);
    const maxResets = 3;

    const handleClick = (index) => {
        if (board[index] || gameOver) return;
        const newBoard = board.slice();
        newBoard[index] = 'X';
        setBoard(newBoard);
        setIsXNext(false);
        const result = checkWinner(newBoard);
        if (result) {
            handleResult(result, getWinningLine(newBoard, result));
            return;
        }
        setTimeout(() => {
            computerMove(newBoard);
        }, 500);
    };

    const computerMove = (currentBoard) => {
        if (gameOver) return;
        const available = currentBoard
            .map((cell, idx) => cell === null ? idx : null)
            .filter(idx => idx !== null);

        if (available.length === 0) return;

        // Simple AI: Choose a random available spot
        const randomIndex = available[Math.floor(Math.random() * available.length)];
        const newBoard = currentBoard.slice();
        newBoard[randomIndex] = 'O';
        setBoard(newBoard);
        const result = checkWinner(newBoard);
        if (result) {
            handleResult(result, getWinningLine(newBoard, result));
            return;
        }
        setIsXNext(true);
    };

    const checkWinner = (currentBoard) => {
        const lines = [
            [0,1,2], [3,4,5], [6,7,8], // Rows
            [0,3,6], [1,4,7], [2,5,8], // Columns
            [0,4,8], [2,4,6]           // Diagonals
        ];
        for (let line of lines) {
            const [a, b, c] = line;
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                return currentBoard[a];
            }
        }
        if (currentBoard.every(cell => cell)) {
            return 'Draw';
        }
        return null;
    };

    const getWinningLine = (currentBoard, winner) => {
        const lines = [
            [0,1,2], [3,4,5], [6,7,8], // Rows
            [0,3,6], [1,4,7], [2,5,8], // Columns
            [0,4,8], [2,4,6]           // Diagonals
        ];
        for (let line of lines) {
            const [a, b, c] = line;
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                return line;
            }
        }
        return [];
    };

    const handleResult = (result, line) => {
        setWinner(result);
        setGameOver(true);
        if (result !== 'Draw') {
            setWinningLine(line);
        }
    };

    const handleReset = () => {
        if (resetCount >= maxResets) return;
        setBoard(initialBoard);
        setIsXNext(true);
        setGameOver(false);
        setWinner(null);
        setWinningLine([]);
        setResetCount(resetCount + 1);
    };

    return (
        <div className="tic-tac-toe">
            <h4 className="mb-3">{t('ticTacToe.playWhileWaiting')}</h4>
            <div className="board">
                {board.map((cell, index) => (
                    <button
                        key={index}
                        className={`cell btn btn-light ${winningLine.includes(index) ? 'winning-cell' : ''}`}
                        onClick={() => handleClick(index)}
                        disabled={gameOver && !winningLine.includes(index)}
                        aria-label={cell ? `${t('ticTacToe.cell')} ${index + 1}` : `${t('ticTacToe.emptyCell')} ${index + 1}`}
                    >
                        <span className="cell-content">{cell}</span>
                    </button>
                ))}
            </div>
            {gameOver && (
                <div className={`result mt-3 ${winner !== 'Draw' ? 'animate-fade-in' : ''}`}>
                    {winner === 'Draw' ? (
                        <p className="text-muted animate-pulse">{t('ticTacToe.draw')}</p>
                    ) : (
                        <p className={winner === 'X' ? 'text-primary animate-fade-in' : 'text-danger animate-fade-in'}>
                            {winner === 'X' ? t('ticTacToe.youWon') : t('ticTacToe.youLost')}
                        </p>
                    )}
                </div>
            )}
            <Button 
                variant="secondary" 
                className="mt-3" 
                onClick={handleReset}
                disabled={resetCount >= maxResets}
            >
                {t('ticTacToe.resetGame')}
            </Button>
            {resetCount >= maxResets && (
                <p className="text-warning mt-2">{t('ticTacToe.maxResetsReached')}</p>
            )}
        </div>
    );
};

export default TicTacToe;
