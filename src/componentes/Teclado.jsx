const rows = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["⌫","Z","X","C","V","B","N","M","ENTER"]
];

export default function Keyboard({ onKeyPress, usedKeys }) {
  return (
    <div className="keyboard">
      {rows.map((row, i) => (
        <div key={i} className="keyboard-row">
          {row.map((key) => {
            const status = usedKeys[key] || "";

            return (
              <button
                key={key}
                className={`key wide ${status}`}
                onClick={() => onKeyPress(key)}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}