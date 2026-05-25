import { useState } from 'react';
import './PlayerCard.css';

type PlayerCardProps = {
  playerName: string;
  colorHex: string;
  isImpostor: boolean;
  word: string;
  hint: string;
};

export function PlayerCard({
  playerName,
  colorHex,
  isImpostor,
  word,
  hint,
}: PlayerCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [pressed, setPressed] = useState(false);

  const reveal = (event: React.SyntheticEvent) => {
    event.preventDefault();
    setRevealed(true);
    setPressed(true);
  };

  const hide = () => {
    setRevealed(false);
    setPressed(false);
  };

  return (
    <div
      className={`player-card${pressed ? ' player-card--pressed' : ''}`}
      style={{ backgroundColor: colorHex }}
      onPointerDown={reveal}
      onPointerUp={hide}
      onPointerLeave={hide}
      onPointerCancel={hide}
      onTouchStart={reveal}
      onTouchEnd={hide}
    >
      {!revealed ? (
        <>
          <h2 className="player-card__name">{playerName}</h2>
          <p className="player-card__hint-text">Mantén presionado para revelar</p>
        </>
      ) : isImpostor ? (
        <>
          <p className="player-card__label">Eres el impostor</p>
          <p className="player-card__secret">Pista: {hint}</p>
        </>
      ) : (
        <>
          <p className="player-card__label">Palabra secreta:</p>
          <p className="player-card__secret">{word}</p>
        </>
      )}
    </div>
  );
}
