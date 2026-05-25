import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useGame } from '../state/GameContext';

export function FirstToStart() {
  const history = useHistory();
  const { state } = useGame();

  useEffect(() => {
    if (!state) {
      history.replace('/');
    }
  }, [state, history]);

  if (!state) {
    return null;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Primero en empezar</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding ion-text-center">
        <p className="first-start-label">El primero en empezar es:</p>
        <h1 className="first-start-name">{state.firstToStart}</h1>
        <IonButton expand="block" onClick={() => history.push('/game/end')}>
          Continuar
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
