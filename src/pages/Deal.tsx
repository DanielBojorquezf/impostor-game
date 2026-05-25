import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { App } from '@capacitor/app';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { PlayerCard } from '../components/PlayerCard';
import { useGame } from '../state/GameContext';
import { getColorForIndex } from '../utils/colors';

export function Deal() {
  const history = useHistory();
  const { state, nextPlayer, pickFirstToStart } = useGame();
  const [cardKey, setCardKey] = useState(0);
  const [showExitAlert, setShowExitAlert] = useState(false);

  useEffect(() => {
    if (!state) {
      history.replace('/');
    }
  }, [state, history]);

  useEffect(() => {
    const listener = App.addListener('backButton', () => {
      setShowExitAlert(true);
    });
    return () => {
      listener.then((handle) => handle.remove());
    };
  }, []);

  if (!state) {
    return null;
  }

  const playerIndex = state.dealOrder[state.currentIndex];
  const playerName = state.players[playerIndex];
  const isLastPlayer = state.currentIndex === state.players.length - 1;

  const handleNext = () => {
    if (isLastPlayer) {
      pickFirstToStart();
      history.push('/game/first');
      return;
    }
    nextPlayer();
    setCardKey((key) => key + 1);
  };

  return (
    <IonPage className="game-page">
      <IonHeader>
        <IonToolbar className="game-toolbar">
          <IonTitle>Reparto</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding deal-content game-bg">
        <p className="deal-progress">
          Jugador {state.currentIndex + 1} de {state.players.length}
        </p>
        <div key={cardKey} className="deal-card-wrapper fade-in">
          <PlayerCard
            playerName={playerName}
            colorHex={getColorForIndex(playerIndex)}
            isImpostor={state.impostorIndices.includes(playerIndex)}
            word={state.word}
            hint={state.hint}
          />
        </div>
        <IonButton expand="block" className="ion-margin-top" onClick={handleNext}>
          {isLastPlayer ? 'Empezar' : 'Siguiente jugador'}
        </IonButton>

        <IonAlert
          isOpen={showExitAlert}
          header="¿Salir de la partida?"
          message="Podrás continuarla desde el inicio."
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              handler: () => setShowExitAlert(false),
            },
            {
              text: 'Salir',
              handler: () => {
                history.push('/');
              },
            },
          ]}
          onDidDismiss={() => setShowExitAlert(false)}
        />
      </IonContent>
    </IonPage>
  );
}
