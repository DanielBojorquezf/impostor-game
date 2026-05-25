import {
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonModal,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

type CategoriesModalProps = {
  isOpen: boolean;
  categories: string[];
  selected: Set<string>;
  loading: boolean;
  onClose: () => void;
  onChange: (selected: Set<string>) => void;
};

function formatCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function CategoriesModal({
  isOpen,
  categories,
  selected,
  loading,
  onClose,
  onChange,
}: CategoriesModalProps) {
  const toggleCategory = (category: string) => {
    const next = new Set(selected);
    if (next.has(category)) {
      next.delete(category);
    } else {
      next.add(category);
    }
    onChange(next);
  };

  const selectAll = () => onChange(new Set(categories));
  const clearAll = () => onChange(new Set());

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Categorías</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            Listo
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding categories-modal">
        <div className="categories-modal__actions">
          <IonButton fill="outline" size="small" onClick={selectAll} disabled={loading}>
            Todas
          </IonButton>
          <IonButton fill="outline" size="small" onClick={clearAll} disabled={loading}>
            Ninguna
          </IonButton>
        </div>

        <div className="categories-modal__list-header">
          <IonText color="medium">
            <span>
              {selected.size}{' '}
              {selected.size === 1 ? 'seleccionada' : 'seleccionadas'} · Mínimo 1
            </span>
          </IonText>
        </div>

        {loading ? (
          <div className="centered-spinner">
            <IonSpinner name="crescent" />
          </div>
        ) : categories.length === 0 ? (
          <p className="categories-modal__empty">
            No hay categorías disponibles. Recarga la app.
          </p>
        ) : (
          <div className="categories-modal__chips">
            {categories.map((category) => {
              const isSelected = selected.has(category);
              return (
                <IonChip
                  key={category}
                  className={`categories-modal__chip${isSelected ? ' categories-modal__chip--selected' : ''}`}
                  onClick={() => toggleCategory(category)}
                >
                  {formatCategoryLabel(category)}
                </IonChip>
              );
            })}
          </div>
        )}
      </IonContent>
    </IonModal>
  );
}
