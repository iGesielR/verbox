import { useEffect, useState, useRef } from "react";
import "./App.css";
import Keyboard from "./componentes/Teclado";
import { WORDS } from "./data/diccionario";

const MAX_ROWS = 6;

const THEME_EMOJIS = {
  frutas: "🍎",
  animales: "🐶",
  terror: "👻",
  emociones: "🎭",
  lugares: "🏝️",
  espacio: "🚀",
  naturaleza: "🌿",
  random: "🎲",
};

// para Obtener palabras por longitud
function getWordsByLength(length) {
  return WORDS.filter((w) => w.word.length === length);
}

export default function App() {
  const [wordLength, setWordLength] = useState(5);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);

  const [theme, setTheme] = useState("");
  const [secretWord, setSecretWord] = useState("");

  const [guesses, setGuesses] = useState(Array(MAX_ROWS).fill(""));
  const [currentRow, setCurrentRow] = useState(0);

  const [gameStatus, setGameStatus] = useState("playing");
  const [usedKeys, setUsedKeys] = useState({});

  const [flipRow, setFlipRow] = useState(null);
  const [errorRow, setErrorRow] = useState(null);

  const keySoundRef = useRef(null);
  const enterSoundRef = useRef(null);

  //  palabras filtradas por dificultad
  const wordsByLength = getWordsByLength(wordLength);

  const VALID_WORDS = wordsByLength.map((w) => w.word);
  const VALID_WORDS_SET = new Set(VALID_WORDS);

  //  temas automáticos
  const WORDS_BY_THEME = wordsByLength.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }

    acc[item.category].push(item.word);

    return acc;
  }, {});

  //  tema random
  function getRandomTheme() {
    const themes = Object.keys(WORDS_BY_THEME);

    return themes[
      Math.floor(Math.random() * themes.length)
    ];
  }

  //  palabra random por tema
  function getWordByTheme(theme) {
    const words = WORDS_BY_THEME[theme];

    return words[
      Math.floor(Math.random() * words.length)
    ];
  }

  //  sonidos
  useEffect(() => {
    keySoundRef.current = new Audio("/sonidos/key.wav");
    enterSoundRef.current = new Audio("/sonidos/enter.mp3");

    keySoundRef.current.volume = 1;
    enterSoundRef.current.volume = 1;
  }, []);

  //  iniciar / cambiar dificultad
  useEffect(() => {
    const themes = Object.keys(WORDS_BY_THEME);

    if (themes.length === 0) return;

    const randomTheme =
      themes[Math.floor(Math.random() * themes.length)];

    const words = WORDS_BY_THEME[randomTheme];

    const randomWord =
      words[Math.floor(Math.random() * words.length)];

    setTheme(randomTheme);
    setSecretWord(randomWord);

    setGuesses(Array(MAX_ROWS).fill(""));
    setCurrentRow(0);
    setGameStatus("playing");
    setUsedKeys({});
  }, [wordLength]);

  // 
  const playSound = (type) => {
    const baseSound =
      type === "enter"
        ? enterSoundRef.current
        : keySoundRef.current;

    if (!baseSound) return;

    const soundClone = baseSound.cloneNode();

    soundClone.volume = baseSound.volume;
    soundClone.play();
  };

  // 
  useEffect(() => {
    const handleKey = (e) => {
      handleKeyPress(e.key.toUpperCase());
    };

    window.addEventListener("keydown", handleKey);

    return () =>
      window.removeEventListener("keydown", handleKey);
  });

  
  function handleKeyPress(key) {
    if (gameStatus !== "playing") return;

    // letras
    if (/^[A-Z]$/.test(key)) {
      playSound("key");

      setGuesses((prev) => {
        const newGuesses = [...prev];

        if (newGuesses[currentRow].length < wordLength) {
          newGuesses[currentRow] += key;
        }

        return newGuesses;
      });
    }

    // borrar
    if (key === "BACKSPACE" || key === "⌫") {
      playSound("key");

      setGuesses((prev) => {
        const newGuesses = [...prev];

        newGuesses[currentRow] =
          newGuesses[currentRow].slice(0, -1);

        return newGuesses;
      });
    }

    // ENTER
    if (key === "ENTER") {
      const currentGuess = guesses[currentRow];

      if (!currentGuess) return;

      if (currentGuess.length !== wordLength) return;

      //  palabra inválida
      if (!VALID_WORDS_SET.has(currentGuess)) {
        setErrorRow(currentRow);

        setTimeout(() => {
          setErrorRow(null);
        }, 400);

        return;
      }

      playSound("enter");

      setFlipRow(currentRow);

      setTimeout(() => {
        const newUsed = { ...usedKeys };

        currentGuess.split("").forEach((letter, i) => {
          const status = getLetterStatus(letter, i);

          if (status === "correct") {
            newUsed[letter] = "correct";
          } else if (
            status === "present" &&
            newUsed[letter] !== "correct"
          ) {
            newUsed[letter] = "present";
          } else if (!newUsed[letter]) {
            newUsed[letter] = "absent";
          }
        });

        setUsedKeys(newUsed);

        // 🎉 ganar
        if (currentGuess === secretWord) {
          setGameStatus("won");
          setFlipRow(null);
          return;
        }

        // 😢 perder
        if (currentRow === MAX_ROWS - 1) {
          setGameStatus("lost");
          setFlipRow(null);
          return;
        }

        // siguiente fila
        setCurrentRow((r) => r + 1);

        setFlipRow(null);
      }, 200);
    }
  }

  //  estado letra
  function getLetterStatus(letter, index) {
    if (!letter) return "";

    if (letter === secretWord[index]) {
      return "correct";
    }

    if (secretWord.includes(letter)) {
      return "present";
    }

    return "absent";
  }

  //  reiniciar
  function resetGame() {
    const randomTheme = getRandomTheme();

    const randomWord =
      getWordByTheme(randomTheme);

    setTheme(randomTheme);
    setSecretWord(randomWord);

    setGuesses(Array(MAX_ROWS).fill(""));
    setCurrentRow(0);

    setGameStatus("playing");

    setUsedKeys({});
  }

  //  
  if (!secretWord) return null;

  return (
    <div className="app">

      {/* TOP BAR */}
      <div className="top-bar">
        <h1>VerBoX</h1>

        <div className="difficulty-container">
          <button
            className="difficulty-button"
            onClick={() =>
              setShowDifficultyMenu(
                !showDifficultyMenu
              )
            }
          >
            {wordLength} Letras
          </button>

          {showDifficultyMenu && (
            <div className="difficulty-menu">

              <button
                onClick={() => {
                  setWordLength(4);
                  setShowDifficultyMenu(false);
                }}
              >
                4 Letras
              </button>

              <button
                onClick={() => {
                  setWordLength(5);
                  setShowDifficultyMenu(false);
                }}
              >
                5 Letras
              </button>

              <button
                onClick={() => {
                  setWordLength(6);
                  setShowDifficultyMenu(false);
                }}
              >
                6 Letras
              </button>

            </div>
          )}
        </div>
      </div>

      {/* TEMA */}
      <h2 className="theme">
        {THEME_EMOJIS[theme]} Tema:{" "}
        {theme.toUpperCase()}
      </h2>

      {/* TABLERO */}
      <div className="board">
        {guesses.map((guess, rowIndex) => (
          <div
            key={rowIndex}
            className={`row ${
              errorRow === rowIndex
                ? "shake"
                : ""
            }`}
          >
            {Array.from({
              length: wordLength,
            }).map((_, colIndex) => {
              const letter =
                guess[colIndex];

              return (
                <div
                  key={colIndex}
                  className={`cell ${
                    rowIndex < currentRow ||
                    gameStatus !== "playing"
                      ? getLetterStatus(
                          letter,
                          colIndex
                        )
                      : ""
                  } ${
                    flipRow === rowIndex
                      ? "flip"
                      : ""
                  }`}
                  style={{
                    animationDelay: `${colIndex * 0.2}s`,
                  }}
                >
                  {letter || ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* TECLADO */}
      <Keyboard
        onKeyPress={handleKeyPress}
        usedKeys={usedKeys}
      />

      {/* MODAL */}
      {gameStatus !== "playing" && (
        <div className="modal-overlay">
          <div className="modal">

            <h2>
              {gameStatus === "won"
                ? "🎉 ¡Ganaste!"
                : "😢 Perdiste"}
            </h2>

            {gameStatus === "lost" && (
              <p>
                La palabra era:{" "}
                {secretWord}
              </p>
            )}

            <button onClick={resetGame}>
              Jugar otra vez
            </button>

          </div>
        </div>
      )}
    </div>
  );
}