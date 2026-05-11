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

  const [revealedCells, setRevealedCells] =
    useState([]);

  const [flipCell, setFlipCell] =
    useState(null);

  const [errorRow, setErrorRow] =
    useState(null);

  // ===== PISTAS =====
  const [showHintModal, setShowHintModal] =
    useState(false);

  const [hintsUsed, setHintsUsed] =
    useState(0);

  const [hintPreview, setHintPreview] = useState("");
  const [hintApplied, setHintApplied] = useState(false);

  const MAX_HINTS = 3;

  const keySoundRef = useRef(null);
  const enterSoundRef = useRef(null);

  // palabras según dificultad
  const wordsByLength =
    getWordsByLength(wordLength);

  const VALID_WORDS =
    wordsByLength.map((w) => w.word);

  const VALID_WORDS_SET =
    new Set(VALID_WORDS);

  // temas automáticos
  const WORDS_BY_THEME =
    wordsByLength.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }

      acc[item.category].push(item.word);

      return acc;
    }, {});

  // tema random
  function getRandomTheme() {
    const themes =
      Object.keys(WORDS_BY_THEME);

    return themes[
      Math.floor(Math.random() * themes.length)
    ];
  }

  // palabra random
  function getWordByTheme(theme) {
    const words =
      WORDS_BY_THEME[theme];

    return words[
      Math.floor(Math.random() * words.length)
    ];
  }

  // sonidos
  useEffect(() => {
    keySoundRef.current =
      new Audio("/sonidos/key.wav");

    enterSoundRef.current =
      new Audio("/sonidos/enter.mp3");

    keySoundRef.current.volume = 1;
    enterSoundRef.current.volume = 1;
  }, []);

  // iniciar juego
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
  }, [wordLength]);

  // sonidos
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

  // teclado físico
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

  // estado letra
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

  // teclado
  function handleKeyPress(key) {
    if (gameStatus !== "playing") return;

    // letras
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

    // borrar
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

    // enter
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

      // palabra inválida
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

      // flip letra por letra
      currentGuess
        .split("")
        .forEach((_, i) => {
          setTimeout(() => {

            setFlipCell(
              `${currentRow}-${i}`
            );

            setRevealedCells((prev) => [
              ...prev,
              `${currentRow}-${i}`,
            ]);

          }, i * 120);
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

        // ganar
        if (
          currentGuess === secretWord
        ) {
          setGameStatus("won");
          return;
        }

        // perder
        if (
          currentRow ===
          MAX_ROWS - 1
        ) {
          setGameStatus("lost");
          return;
        }

        setCurrentRow((r) => r + 1);

        setFlipCell(null);

      }, wordLength * 120 + 250);
    }
  }

  // ===== OBTENER PISTA =====
  function handleGetHint() {

  if (currentRow === 0) return;

  if (hintsUsed >= MAX_HINTS) return;

  const lastGuess =
    guesses[currentRow - 1];


  setHintPreview(lastGuess);

  setHintApplied(false);

  setShowHintModal(true);
}

function applyHint() {

  if (hintApplied) return;

  const lastGuess =
    guesses[currentRow - 1];

  const revealedIndexes =
    lastGuess
      .split("")
      .map((letter, index) =>
        letter === secretWord[index]
          ? index
          : null
      )
      .filter((v) => v !== null);

  const possibleIndexes = [];

  for (
    let i = 0;
    i < secretWord.length;
    i++
  ) {
    if (
      !revealedIndexes.includes(i)
    ) {
      possibleIndexes.push(i);
    }
  }

  if (possibleIndexes.length === 0)
    return;

  const randomIndex =
    possibleIndexes[
      Math.floor(
        Math.random() *
          possibleIndexes.length
      )
    ];

  const preview =
    lastGuess.split("");

  // SOLO MODIFICA PREVIEW
  // NO TABLERO REAL

  preview[randomIndex] =
    secretWord[randomIndex];

  setHintPreview(preview.join(""));

  setHintApplied(true);

  setHintsUsed((prev) => prev + 1);
}

  // reset
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
  }

  if (!secretWord) return null;

  return (
    <div className="app">

      {/* TOP BAR */}
      <div className="top-bar">

        {/* BOTON PISTAS */}
        <div className="hint-container">

          <button
            className="hint-button"
            disabled={
              currentRow === 0 ||
              hintsUsed >= MAX_HINTS
            }
            onClick={handleGetHint}
          >
            💡 Pista
          </button>

          <span className="hint-counter">
            {hintsUsed}/{MAX_HINTS}
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
      {showHintModal && (
        <div className="hint-modal-overlay">

          <div className="hint-modal">

            <h3>💡 Pista aplicada</h3>

            <div className="hint-word">

                {hintPreview
                ?.split("")
                .map((letter, index) => (

                  <div
                    key={index}
                    className={`hint-cell ${getLetterStatus(
                      letter,
                      index
                    )}`}
                  >
                    {letter}
                  </div>
                ))}

            </div>
            {!hintApplied && (
              <button
                className="hint-reveal-button"
                onClick={applyHint}
              >
                Obtener pista
              </button>
            )}

            {hintApplied && (
              <button
                className="hint-continue-button"
                onClick={() =>
                  setShowHintModal(false)
                }
              >
                Continuar
              </button>
            )}

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