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
  random: "🎲",
};

// Obtener palabras por longitud
function getWordsByLength(length) {
  return WORDS.filter((w) => w.word.length === length);
}

export default function App() {

  const [wordLength, setWordLength] = useState(5);

  const [showDifficultyMenu, setShowDifficultyMenu] =
    useState(false);

  const [theme, setTheme] = useState("");

  const [secretWord, setSecretWord] = useState("");

  const [guesses, setGuesses] = useState(
    Array(MAX_ROWS).fill("")
  );

  const [currentRow, setCurrentRow] = useState(0);

  const [gameStatus, setGameStatus] =
    useState("playing");

  const [usedKeys, setUsedKeys] = useState({});

  // FLIP
  const [revealedCells, setRevealedCells] =
    useState([]);

  const [flipCell, setFlipCell] =
    useState(null);

  // ERROR
  const [errorRow, setErrorRow] =
    useState(null);

  // PISTAS
  const [showHint, setShowHint] =
    useState(false);

  const [hintsUsed, setHintsUsed] =
    useState(0);

  const [revealedHintLetters, setRevealedHintLetters] =
    useState([]);

  const keySoundRef = useRef(null);

  const enterSoundRef = useRef(null);

  // Palabras según dificultad
  const wordsByLength =
    getWordsByLength(wordLength);

  const VALID_WORDS =
    wordsByLength.map((w) => w.word);

  const VALID_WORDS_SET =
    new Set(VALID_WORDS);

  // Temas automáticos
  const WORDS_BY_THEME =
    wordsByLength.reduce((acc, item) => {

      if (!acc[item.category]) {
        acc[item.category] = [];
      }

      acc[item.category].push(item.word);

      return acc;

    }, {});

  // Tema random
  function getRandomTheme() {

    const themes =
      Object.keys(WORDS_BY_THEME);

    return themes[
      Math.floor(Math.random() * themes.length)
    ];
  }

  // Palabra random por tema
  function getWordByTheme(theme) {

    const words =
      WORDS_BY_THEME[theme];

    return words[
      Math.floor(Math.random() * words.length)
    ];
  }

  // SONIDOS
  useEffect(() => {

    keySoundRef.current =
      new Audio("/sonidos/key.wav");

    enterSoundRef.current =
      new Audio("/sonidos/enter.mp3");

    keySoundRef.current.volume = 1;

    enterSoundRef.current.volume = 1;

  }, []);

  // INICIAR JUEGO
  useEffect(() => {

    const themes =
      Object.keys(WORDS_BY_THEME);

    if (themes.length === 0) return;

    const randomTheme =
      themes[
        Math.floor(Math.random() * themes.length)
      ];

    const words =
      WORDS_BY_THEME[randomTheme];

    const randomWord =
      words[
        Math.floor(Math.random() * words.length)
      ];

    setTheme(randomTheme);

    setSecretWord(randomWord);

    setGuesses(Array(MAX_ROWS).fill(""));

    setCurrentRow(0);

    setGameStatus("playing");

    setUsedKeys({});

    setFlipCell(null);

    setRevealedCells([]);

    setHintsUsed(0);

    setRevealedHintLetters([]);

  }, [wordLength]);

  // Sonidos
  const playSound = (type) => {

    const baseSound =
      type === "enter"
        ? enterSoundRef.current
        : keySoundRef.current;

    if (!baseSound) return;

    const soundClone =
      baseSound.cloneNode();

    soundClone.volume =
      baseSound.volume;

    soundClone.play();
  };

  // TECLADO FISICO
  useEffect(() => {

    const handleKey = (e) => {
      handleKeyPress(
        e.key.toUpperCase()
      );
    };

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKey
      );
  });

  // PISTA
  function handleHint() {

    if (hintsUsed >= 3) return;

    const unrevealedIndexes = [];

    for (let i = 0; i < secretWord.length; i++) {

      const alreadyRevealed =
        revealedHintLetters.some(
          (item) => item.index === i
        );

      if (!alreadyRevealed) {
        unrevealedIndexes.push(i);
      }
    }

    if (unrevealedIndexes.length === 0) return;

    const randomIndex =
      unrevealedIndexes[
        Math.floor(
          Math.random() *
          unrevealedIndexes.length
        )
      ];

    const revealedLetter =
      secretWord[randomIndex];

    setRevealedHintLetters((prev) => [
      ...prev,
      {
        index: randomIndex,
        letter: revealedLetter,
      },
    ]);

    setHintsUsed((prev) => prev + 1);

    setShowHint(true);
  }

  // TECLAS
  function handleKeyPress(key) {

    if (gameStatus !== "playing") return;

    // LETRAS
    if (/^[A-Z]$/.test(key)) {

      playSound("key");

      setGuesses((prev) => {

        const newGuesses = [...prev];

        if (
          newGuesses[currentRow].length <
          wordLength
        ) {
          newGuesses[currentRow] += key;
        }

        return newGuesses;
      });
    }

    // BORRAR
    if (
      key === "BACKSPACE" ||
      key === "⌫"
    ) {

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

      const currentGuess =
        guesses[currentRow];

      if (!currentGuess) return;

      if (
        currentGuess.length !==
        wordLength
      ) {
        return;
      }

      // INVALIDA
      if (
        !VALID_WORDS_SET.has(
          currentGuess
        )
      ) {

        setErrorRow(currentRow);

        setTimeout(() => {
          setErrorRow(null);
        }, 400);

        return;
      }

      playSound("enter");

      // FLIP LETRA POR LETRA
      currentGuess
        .split("")
        .forEach((_, i) => {

          setTimeout(() => {

            setFlipCell(
              `${currentRow}-${i}`
            );

            setRevealedCells(prev => [
              ...prev,
              `${currentRow}-${i}`
            ]);

          }, i * 180);
        });

      setTimeout(() => {

        const newUsed = {
          ...usedKeys,
        };

        currentGuess
          .split("")
          .forEach((letter, i) => {

            const status =
              getLetterStatus(
                letter,
                i
              );

            if (
              status === "correct"
            ) {

              newUsed[letter] =
                "correct";

            } else if (
              status === "present" &&
              newUsed[letter] !==
              "correct"
            ) {

              newUsed[letter] =
                "present";

            } else if (
              !newUsed[letter]
            ) {

              newUsed[letter] =
                "absent";
            }
          });

        setUsedKeys(newUsed);

        // GANAR
        if (
          currentGuess === secretWord
        ) {

          setGameStatus("won");

          return;
        }

        // PERDER
        if (
          currentRow ===
          MAX_ROWS - 1
        ) {

          setGameStatus("lost");

          return;
        }

        setCurrentRow((r) => r + 1);

        setFlipCell(null);

      }, wordLength * 250 + 300);
    }
  }

  // ESTADO LETRA
  function getLetterStatus(
    letter,
    index
  ) {

    if (!letter) return "";

    if (
      letter === secretWord[index]
    ) {
      return "correct";
    }

    if (
      secretWord.includes(letter)
    ) {
      return "present";
    }

    return "absent";
  }

  // RESET
  function resetGame() {

    const randomTheme =
      getRandomTheme();

    const randomWord =
      getWordByTheme(randomTheme);

    setTheme(randomTheme);

    setSecretWord(randomWord);

    setGuesses(Array(MAX_ROWS).fill(""));

    setCurrentRow(0);

    setGameStatus("playing");

    setUsedKeys({});

    setFlipCell(null);

    setRevealedCells([]);

    setHintsUsed(0);

    setRevealedHintLetters([]);

    setShowHint(false);
  }

  if (!secretWord) return null;

  return (

    <div className="app">

      {/* TOP BAR */}
      <div className="top-bar">

        {/* PISTAS */}
        <div className="hint-container">

          <button
            className="hint-button"
            onClick={handleHint}
          >
            💡 Obtener pista
          </button>

          <span className="hint-count">
            {hintsUsed}/3
          </span>

        </div>

        <h1>VerBoX</h1>

        {/* DIFICULTAD */}
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
                    revealedCells.includes(
                      `${rowIndex}-${colIndex}`
                    )
                      ? getLetterStatus(
                          letter,
                          colIndex
                        )
                      : ""
                  } ${
                    flipCell ===
                    `${rowIndex}-${colIndex}`
                      ? "flip"
                      : ""
                  }`}
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

      {/* MODAL PISTA */}
      {showHint && (

        <div className="hint-modal-overlay">

          <div className="hint-modal">

            <h3>💡 Pista</h3>

            <div className="hint-board">

              {Array.from({
                length: wordLength,
              }).map((_, index) => {

                const lastGuess =
                  guesses[currentRow] ||
                  guesses[currentRow - 1] ||
                  "";

                const letter =
                  lastGuess[index];

                return (

                  <div
                    key={index}
                    className={`cell hint-cell ${
                      getLetterStatus(
                        letter,
                        index
                      )
                    }`}
                  >
                    {letter || ""}
                  </div>
                );
              })}
            </div>

            <div className="revealed-letters">

              {revealedHintLetters.map(
                (item, index) => (

                  <div
                    key={index}
                    className="revealed-letter"
                  >
                    Letra {item.index + 1}:
                    <strong>
                      {" "}
                      {item.letter}
                    </strong>
                  </div>
                )
              )}

            </div>

            <button
              onClick={() =>
                setShowHint(false)
              }
            >
              Cerrar
            </button>

          </div>
        </div>
      )}

      {/* MODAL FINAL */}
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