import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  selected: boolean;
  children: ReactNode;
};

export function SelectionTile({ selected, children, className, disabled, ...props }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={clsx(
        'selection-tile',
        selected && 'selection-tile--selected',
        disabled && 'selection-tile--disabled',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
