import type { ReactNode } from 'react';
import { ToastProvider as UiKitToastProvider } from '@telegram-tools/ui-kit';

type Props = {
  children: ReactNode;
};

export function ToastProvider({ children }: Props) {
  return <UiKitToastProvider>{children}</UiKitToastProvider>;
}
