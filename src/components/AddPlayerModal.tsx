import {
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonModal,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { closeCircleOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';

type AddPlayerModalProps = {
  isOpen: boolean;
  players: string[];
  onClose: () => void;
  onChange: (players: string[]) => void;
};

export function AddPlayerModal({ isOpen, players, onClose, onChange }: AddPlayerModalProps) {
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNameInput('');
    }
  }, [isOpen]);

  const addPlayer = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      return;
    }
    onChange([...players, trimmed]);
    setNameInput('');
  };

  const removePlayer = (index: number) => {
    onChange(players.filter((_, i) => i !== index));
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Jugadores</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            Listo
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding players-modal">
        <IonItem className="players-modal__input">
          <IonInput
            label="Nombre"
            labelPlacement="stacked"
            placeholder="Escribe un nombre"
            value={nameInput}
            onIonInput={(event) => setNameInput(event.detail.value ?? '')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                addPlayer();
              }
            }}
          />
        </IonItem>
        <IonButton expand="block" className="ion-margin-top" onClick={addPlayer}>
          Agregar
        </IonButton>

        <div className="players-modal__list-header">
          <IonText color="medium">
            <span>
              {players.length} {players.length === 1 ? 'jugador' : 'jugadores'} · Mínimo 3
            </span>
          </IonText>
        </div>

        {players.length === 0 ? (
          <p className="players-modal__empty">Aún no hay jugadores. Agrega al menos 3.</p>
        ) : (
          <div className="players-modal__chips">
            {players.map((name, index) => (
              <IonChip key={`${name}-${index}`} className="players-modal__chip">
                <span>{name}</span>
                <IonIcon
                  icon={closeCircleOutline}
                  className="players-modal__chip-remove"
                  onClick={() => removePlayer(index)}
                />
              </IonChip>
            ))}
          </div>
        )}
      </IonContent>
    </IonModal>
  );
}
