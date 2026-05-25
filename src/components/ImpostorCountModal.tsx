import {
  IonButton,
  IonContent,
  IonHeader,
  IonModal,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { formatImpostorLabel } from '../utils/impostors';

type ImpostorCountModalProps = {
  isOpen: boolean;
  count: number;
  maxCount: number;
  onClose: () => void;
  onChange: (count: number) => void;
};

export function ImpostorCountModal({
  isOpen,
  count,
  maxCount,
  onClose,
  onChange,
}: ImpostorCountModalProps) {
  const decrease = () => onChange(Math.max(1, count - 1));
  const increase = () => onChange(Math.min(maxCount, count + 1));

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Impostores</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            Listo
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding ion-text-center">
        <p className="impostor-modal-hint">
          Máximo 1 impostor por cada 6 jugadores.
        </p>
        <div className="impostor-stepper">
          <IonButton fill="outline" shape="round" onClick={decrease} disabled={count <= 1}>
            −
          </IonButton>
          <div className="impostor-stepper__value">
            <span className="impostor-stepper__number">{count}</span>
            <span className="impostor-stepper__label">{formatImpostorLabel(count)}</span>
          </div>
          <IonButton
            fill="outline"
            shape="round"
            onClick={increase}
            disabled={count >= maxCount}
          >
            +
          </IonButton>
        </div>
        <IonText color="medium">
          <p>Máximo permitido: {maxCount}</p>
        </IonText>
      </IonContent>
    </IonModal>
  );
}
