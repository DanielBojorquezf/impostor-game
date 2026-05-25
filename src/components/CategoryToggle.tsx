import { IonItem, IonLabel, IonToggle } from '@ionic/react';

type CategoryToggleProps = {
  category: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
};

function formatCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function CategoryToggle({ category, checked, onToggle }: CategoryToggleProps) {
  return (
    <IonItem>
      <IonLabel>{formatCategoryLabel(category)}</IonLabel>
      <IonToggle
        slot="end"
        checked={checked}
        onIonChange={(event) => onToggle(event.detail.checked)}
      />
    </IonItem>
  );
}
