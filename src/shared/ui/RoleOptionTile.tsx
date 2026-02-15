import { clsx } from 'clsx';
import { SelectionTile } from '@/shared/ui/SelectionTile';

type RoleOptionTileProps = {
  title: string;
  description: string;
  isActive: boolean;
  activeLabel: string;
  inactiveLabel: string;
  disabled?: boolean;
  onSelect: () => void;
};

export function RoleOptionTile({
  title,
  description,
  isActive,
  activeLabel,
  inactiveLabel,
  disabled = false,
  onSelect,
}: RoleOptionTileProps) {
  return (
    <SelectionTile
      selected={isActive}
      disabled={disabled}
      onClick={onSelect}
      className={clsx('role-option-tile', isActive && 'role-option-tile--active')}
      aria-pressed={isActive}
      aria-label={title}
    >
      <div className="role-option-tile__header">
        <strong className="role-option-tile__title">{title}</strong>
        <span className={clsx('role-option-tile__badge', isActive && 'role-option-tile__badge--active')}>
          {isActive ? activeLabel : inactiveLabel}
        </span>
      </div>
      <p className="app-hint role-option-tile__description">{description}</p>
    </SelectionTile>
  );
}
