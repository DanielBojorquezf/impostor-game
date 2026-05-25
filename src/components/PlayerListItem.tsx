import { IonButton, IonItem, IonLabel } from '@ionic/react';

type PlayerListItemProps = {
  name: string;
  onRemove: () => void;
};

export function PlayerListItem({ name, onRemove }: PlayerListItemProps) {
  return (
    <IonItem>
      <IonLabel>{name}</IonLabel>
      <IonButton slot="end" fill="clear" color="danger" onClick={onRemove}>
        Eliminar
      </IonButton>
    </IonItem>
  );
}
