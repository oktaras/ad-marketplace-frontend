import type { ReactNode } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { env } from '@/app/config/env';

type Props = {
  children: ReactNode;
};

export function TonProvider({ children }: Props) {
  return <TonConnectUIProvider manifestUrl={env.tonConnectManifestUrl}>{children}</TonConnectUIProvider>;
}
