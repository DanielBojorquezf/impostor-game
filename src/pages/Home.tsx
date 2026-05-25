import {
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { addOutline, eyeOffOutline, peopleOutline, settingsOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { AddPlayerModal } from '../components/AddPlayerModal';
import { CategoriesModal } from '../components/CategoriesModal';
import { ImpostorCountModal } from '../components/ImpostorCountModal';
import { getCategories } from '../db/wordsRepo';
import { useGame } from '../state/GameContext';
import { formatImpostorLabel, getMaxImpostors } from '../utils/impostors';
import {
  loadLastCategories,
  loadLastImpostorCount,
  loadLastPlayers,
  saveLastCategories,
  saveLastImpostorCount,
  saveLastPlayers,
} from '../utils/storage';

function formatCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function Home() {
  const history = useHistory();
  const { startGame, hasSavedGame } = useGame();

  const [players, setPlayers] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [impostorCount, setImpostorCount] = useState(1);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [starting, setStarting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [impostorModalOpen, setImpostorModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const maxImpostors = useMemo(() => getMaxImpostors(players.length), [players.length]);
  const canStart = players.length >= 3 && selectedCategories.size > 0 && !starting;

  useEffect(() => {
    setPlayers(loadLastPlayers());
    setImpostorCount(loadLastImpostorCount());
  }, []);

  useEffect(() => {
    if (players.length > 0) {
      saveLastPlayers(players);
    }
  }, [players]);

  useEffect(() => {
    saveLastCategories([...selectedCategories]);
  }, [selectedCategories]);

  useEffect(() => {
    saveLastImpostorCount(impostorCount);
  }, [impostorCount]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const available = await getCategories();
        if (cancelled) {
          return;
        }
        setCategories(available);
        const last = loadLastCategories().filter((cat) => available.includes(cat));
        setSelectedCategories(new Set(last));
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setToastMessage('Algo salió mal al cargar categorías');
          setToastOpen(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (impostorCount > maxImpostors) {
      setImpostorCount(maxImpostors);
    }
  }, [impostorCount, maxImpostors]);

  const removePlayer = (index: number) => {
    setPlayers((current) => current.filter((_, i) => i !== index));
  };

  const removeCategory = (category: string) => {
    setSelectedCategories((current) => {
      const next = new Set(current);
      next.delete(category);
      return next;
    });
  };

  const handleStart = async () => {
    if (!canStart) {
      return;
    }
    setStarting(true);
    try {
      await startGame(players, [...selectedCategories], impostorCount);
      history.push('/game/deal');
    } catch (error) {
      console.error(error);
      setToastMessage('Algo salió mal');
      setToastOpen(true);
    } finally {
      setStarting(false);
    }
  };

  return (
    <IonPage className="home-page">
      <IonHeader className="home-header">
        <IonToolbar className="home-header__toolbar">
          <div className="home-header__brand" slot="start">
            <div className="home-header__icon-wrap">
              <IonIcon icon={eyeOffOutline} className="home-header__icon" />
            </div>
            <div>
              <h1 className="home-header__title">El Impostor</h1>
              <p className="home-header__subtitle">Juego de deducción</p>
            </div>
          </div>
          <IonButton
            slot="end"
            fill="clear"
            className="home-header__settings"
            onClick={() => setSettingsOpen(true)}
          >
            <IonIcon icon={settingsOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="home-content">
        {hasSavedGame && (
          <button
            type="button"
            className="home-continue"
            onClick={() => history.push('/game/deal')}
          >
            <span>Continuar partida en curso</span>
            <IonIcon icon={peopleOutline} />
          </button>
        )}

        <section className="home-section">
          <div className="home-section__header">
            <h2>Jugadores</h2>
            <IonText color="medium">
              <span>Mínimo 3</span>
            </IonText>
          </div>
          <div className="home-chips">
            {players.map((name, index) => (
              <IonChip
                key={`${name}-${index}`}
                className="home-chip home-chip--player"
                onClick={() => removePlayer(index)}
              >
                {name}
                <span className="home-chip__remove" aria-hidden>×</span>
              </IonChip>
            ))}
            <IonChip className="home-chip home-chip--add" onClick={() => setPlayerModalOpen(true)}>
              <IonIcon icon={addOutline} />
              Agregar
            </IonChip>
          </div>
        </section>

        <section className="home-section">
          <div className="home-section__header">
            <h2>Categorías</h2>
            <IonText color="medium">
              <span>Mínimo 1</span>
            </IonText>
          </div>
          <div className="home-chips">
            {[...selectedCategories].map((category) => (
              <IonChip
                key={category}
                className="home-chip home-chip--category home-chip--selected"
                onClick={() => removeCategory(category)}
              >
                {formatCategoryLabel(category)}
                <span className="home-chip__remove" aria-hidden>×</span>
              </IonChip>
            ))}
            <IonChip
              className="home-chip home-chip--add"
              onClick={() => setCategoryModalOpen(true)}
            >
              <IonIcon icon={addOutline} />
              Seleccionar
            </IonChip>
          </div>
        </section>

        <section className="home-section">
          <button type="button" className="home-option-card" onClick={() => setImpostorModalOpen(true)}>
            <div>
              <p className="home-option-card__label">Impostores</p>
              <p className="home-option-card__value">{formatImpostorLabel(impostorCount)}</p>
            </div>
            <IonText color="medium">
              <span>Máx. {maxImpostors}</span>
            </IonText>
          </button>
        </section>

        <div className="home-footer">
          <IonButton
            expand="block"
            size="large"
            className="home-start-btn"
            disabled={!canStart}
            onClick={handleStart}
          >
            {starting ? 'Preparando…' : 'Empezar'}
          </IonButton>
          {players.length < 3 && (
            <IonText color="medium">
              <p className="home-footer__hint">Agrega al menos 3 jugadores para empezar.</p>
            </IonText>
          )}
          {players.length >= 3 && selectedCategories.size === 0 && (
            <IonText color="medium">
              <p className="home-footer__hint">Selecciona al menos 1 categoría para empezar.</p>
            </IonText>
          )}
        </div>
      </IonContent>

      <AddPlayerModal
        isOpen={playerModalOpen}
        players={players}
        onClose={() => setPlayerModalOpen(false)}
        onChange={setPlayers}
      />

      <CategoriesModal
        isOpen={categoryModalOpen}
        categories={categories}
        selected={selectedCategories}
        loading={loadingCategories}
        onClose={() => setCategoryModalOpen(false)}
        onChange={setSelectedCategories}
      />

      <ImpostorCountModal
        isOpen={impostorModalOpen}
        count={impostorCount}
        maxCount={maxImpostors}
        onClose={() => setImpostorModalOpen(false)}
        onChange={setImpostorCount}
      />

      {settingsOpen && (
        <div className="home-settings-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="home-settings-panel" onClick={(event) => event.stopPropagation()}>
            <h3>Ajustes</h3>
            <p>Versión 1.0 — El Impostor</p>
            <IonButton expand="block" fill="outline" onClick={() => setSettingsOpen(false)}>
              Cerrar
            </IonButton>
          </div>
        </div>
      )}

      <IonToast
        isOpen={toastOpen}
        message={toastMessage}
        duration={2500}
        onDidDismiss={() => setToastOpen(false)}
      />
    </IonPage>
  );
}
