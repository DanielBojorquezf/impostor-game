import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useGame } from '../state/GameContext';

function formatCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function EndGame() {
  const history = useHistory();
  const { state, endGame } = useGame();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!state) {
      history.replace('/');
    }
  }, [state, history]);

  if (!state) {
    return null;
  }

  const impostorNames = state.impostorIndices.map((index) => state.players[index]);

  const handleClose = () => {
    endGame();
    history.replace('/');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Fin de partida</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding ion-text-center">
        <p className="end-game-intro">Cuando terminen de discutir…</p>

        {revealed && (
          <div className="reveal-panel fade-in">
            <p>
              <strong>{impostorNames.length === 1 ? 'Impostor' : 'Impostores'}:</strong>{' '}
              {impostorNames.join(', ')}
            </p>
            <p>
              <strong>Palabra:</strong> {state.word}
            </p>
            <p>
              <strong>Categoría:</strong> {formatCategoryLabel(state.category)}
            </p>
          </div>
        )}

        <IonButton expand="block" onClick={() => setRevealed(true)}>
          Mostrar impostor
        </IonButton>
        <IonButton expand="block" fill="outline" className="ion-margin-top" onClick={handleClose}>
          Cerrar
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
