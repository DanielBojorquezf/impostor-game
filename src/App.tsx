import { IonApp, IonContent, IonLoading, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { initDB } from './db/init';
import { Deal } from './pages/Deal';
import { EndGame } from './pages/EndGame';
import { FirstToStart } from './pages/FirstToStart';
import { Home } from './pages/Home';
import { GameProvider } from './state/GameContext';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';
import './theme/global.css';

setupIonicReact();

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    initDB()
      .then(() => setDbReady(true))
      .catch((error) => {
        console.error(error);
        setDbError(true);
      });
  }, []);

  return (
    <IonApp>
      {dbError ? (
        <IonContent className="ion-padding ion-text-center">
          <p>No se pudo cargar la base de datos. Recarga la página.</p>
        </IonContent>
      ) : dbReady ? (
        <GameProvider>
          <IonReactRouter>
            <IonRouterOutlet>
              <Route exact path="/" component={Home} />
              <Route exact path="/game/deal" component={Deal} />
              <Redirect exact from="/setup/players" to="/" />
              <Redirect exact from="/setup/categories" to="/" />
              <Route exact path="/game/first" component={FirstToStart} />
              <Route exact path="/game/end" component={EndGame} />
              <Redirect exact from="/home" to="/" />
            </IonRouterOutlet>
          </IonReactRouter>
        </GameProvider>
      ) : null}
      <IonLoading
        isOpen={!dbReady && !dbError}
        message="Cargando…"
        spinner="crescent"
      />
    </IonApp>
  );
}
