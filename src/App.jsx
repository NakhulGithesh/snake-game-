import React, { useState, useEffect, useCallback } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [[5, 10]];
const INITIAL_AI_SNAKE = [[14, 10]];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_AI_DIRECTION = { x: -1, y: 0 };
const GAME_SPEED = 150;
const SCORE_LIMIT = 5;

export default function SnakeGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [aiSnake, setAiSnake] = useState(INITIAL_AI_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [aiDirection, setAiDirection] = useState(INITIAL_AI_DIRECTION);
  const [food, setFood] = useState([10, 10]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [winner, setWinner] = useState(null);

  const generateFood = useCallback((playerSnake, aiSnakeParam) => {
    let newFood;
    const allSegments = [...playerSnake, ...aiSnakeParam];
    do {
      newFood = [
        Math.floor(Math.random() * GRID_SIZE),
        Math.floor(Math.random() * GRID_SIZE)
      ];
    } while (allSegments.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1]));
    return newFood;
  }, []);

  const getAiDirection = useCallback((aiHead, target, currentDir, snakeBody) => {
    const possibleDirs = [
      { x: 0, y: -1, name: 'up' },
      { x: 0, y: 1, name: 'down' },
      { x: -1, y: 0, name: 'left' },
      { x: 1, y: 0, name: 'right' }
    ];

    // Filter out opposite direction
    const validDirs = possibleDirs.filter(dir => {
      if (currentDir.x !== 0) return dir.x === 0;
      return dir.y === 0;
    });

    // Calculate distance for each valid direction
    const dirsWithScore = validDirs.map(dir => {
      const newHead = [aiHead[0] + dir.x, aiHead[1] + dir.y];
      
      // Check if this move would cause wall collision
      const hitWall = newHead[0] < 0 || newHead[0] >= GRID_SIZE || 
                      newHead[1] < 0 || newHead[1] >= GRID_SIZE;

      if (hitWall) {
        return { dir, score: -1000 };
      }

      // Calculate distance to target
      const distance = Math.abs(newHead[0] - target[0]) + Math.abs(newHead[1] - target[1]);
      return { dir, score: -distance };
    });

    // Choose best direction
    dirsWithScore.sort((a, b) => b.score - a.score);
    return dirsWithScore[0].dir;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setAiSnake(INITIAL_AI_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setAiDirection(INITIAL_AI_DIRECTION);
    setFood([10, 10]);
    setGameOver(false);
    setScore(0);
    setAiScore(0);
    setIsPaused(false);
    setWinner(null);
    setGameStarted(false);
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !gameStarted) return;

    let playerDied = false;
    let aiDied = false;

    // Move player snake
    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = [head[0] + direction.x, head[1] + direction.y];

      // Check wall collision - player loses
      if (newHead[0] < 0 || newHead[0] >= GRID_SIZE || newHead[1] < 0 || newHead[1] >= GRID_SIZE) {
        playerDied = true;
        setWinner('ai');
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead[0] === food[0] && newHead[1] === food[1]) {
        const newScore = score + 1;
        setScore(newScore);
        
        // Check if player reached score limit
        if (newScore >= SCORE_LIMIT) {
          setWinner('player');
          setGameOver(true);
          return newSnake;
        }
        
        setFood(generateFood(newSnake, aiSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });

    // Move AI snake
    setAiSnake(prevAiSnake => {
      const aiHead = prevAiSnake[0];
      const newAiDir = getAiDirection(aiHead, food, aiDirection, prevAiSnake);
      setAiDirection(newAiDir);
      
      const newAiHead = [aiHead[0] + newAiDir.x, aiHead[1] + newAiDir.y];

      // Check wall collision - AI loses
      if (newAiHead[0] < 0 || newAiHead[0] >= GRID_SIZE || newAiHead[1] < 0 || newAiHead[1] >= GRID_SIZE) {
        aiDied = true;
        setWinner('player');
        setGameOver(true);
        return prevAiSnake;
      }

      const newAiSnake = [newAiHead, ...prevAiSnake];

      // Check food collision
      if (newAiHead[0] === food[0] && newAiHead[1] === food[1]) {
        const newAiScore = aiScore + 1;
        setAiScore(newAiScore);
        
        // Check if AI reached score limit
        if (newAiScore >= SCORE_LIMIT) {
          setWinner('ai');
          setGameOver(true);
          return newAiSnake;
        }
        
        setFood(generateFood(snake, newAiSnake));
      } else {
        newAiSnake.pop();
      }

      return newAiSnake;
    });
  }, [direction, aiDirection, food, gameOver, isPaused, gameStarted, snake, aiSnake, score, aiScore, generateFood, getAiDirection]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver || !gameStarted) return;

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          e.preventDefault();
          setIsPaused(p => !p);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameOver, gameStarted]);

  useEffect(() => {
    if (!gameStarted) return;
    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [moveSnake, gameStarted]);

  if (!gameStarted && !gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-900 to-green-700 p-8">
        <div className="bg-white rounded-lg shadow-2xl p-12 text-center">
          <h1 className="text-5xl font-bold text-green-800 mb-4">AI vs Player</h1>
          <p className="text-xl text-gray-700 mb-8">First to {SCORE_LIMIT} points wins!</p>
          <div className="mb-8 text-left bg-gray-100 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Rules:</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• <span className="text-green-600 font-bold">Green Snake</span> = You</li>
              <li>• <span className="text-blue-600 font-bold">Blue Snake</span> = AI</li>
              <li>• First to reach {SCORE_LIMIT} points wins</li>
              <li>• Hitting the wall = instant loss</li>
              <li>• Snakes can pass through themselves</li>
              <li>• Compete for the red food!</li>
            </ul>
          </div>
          <button
            onClick={startGame}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-900 to-green-700 p-8">
      <div className="bg-white rounded-lg shadow-2xl p-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-green-800">AI vs Player</h1>
          <div className="flex gap-6 text-xl font-bold">
            <div className="text-green-600">You: {score}/{SCORE_LIMIT}</div>
            <div className="text-blue-600">AI: {aiScore}/{SCORE_LIMIT}</div>
          </div>
        </div>

        <div 
          className="relative bg-gray-900 border-4 border-green-600 rounded"
          style={{ 
            width: GRID_SIZE * CELL_SIZE, 
            height: GRID_SIZE * CELL_SIZE 
          }}
        >
          {/* Player Snake */}
          {snake.map((segment, i) => (
            <div
              key={`player-${i}`}
              className={`absolute ${i === 0 ? 'bg-green-400' : 'bg-green-500'} rounded-sm`}
              style={{
                left: segment[0] * CELL_SIZE,
                top: segment[1] * CELL_SIZE,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
              }}
            />
          ))}

          {/* AI Snake */}
          {aiSnake.map((segment, i) => (
            <div
              key={`ai-${i}`}
              className={`absolute ${i === 0 ? 'bg-blue-400' : 'bg-blue-500'} rounded-sm`}
              style={{
                left: segment[0] * CELL_SIZE,
                top: segment[1] * CELL_SIZE,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
              }}
            />
          ))}

          {/* Food */}
          <div
            className="absolute bg-red-500 rounded-full"
            style={{
              left: food[0] * CELL_SIZE,
              top: food[1] * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-4">
                  {winner === 'player' ? "You Win! 🎉" : "AI Wins!"}
                </h2>
                <p className="text-2xl text-white mb-2">Your Score: {score}/{SCORE_LIMIT}</p>
                <p className="text-2xl text-white mb-6">AI Score: {aiScore}/{SCORE_LIMIT}</p>
                <button
                  onClick={resetGame}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          {/* Pause Overlay */}
          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <h2 className="text-4xl font-bold text-white">Paused</h2>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-gray-700">
          <p className="mb-2">Use arrow keys to move • Press SPACE to pause</p>
          <p className="text-sm">
            <span className="text-green-600 font-bold">Green</span> = You • 
            <span className="text-blue-600 font-bold"> Blue</span> = AI
          </p>
        </div>
      </div>
    </div>
  );
}