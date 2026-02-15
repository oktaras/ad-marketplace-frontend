type Listener = () => void;

const listeners = new Set<Listener>();

export function openProfileSettingsSheet(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeProfileSettingsSheetOpen(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

