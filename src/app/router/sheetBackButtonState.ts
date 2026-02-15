type Listener = () => void;

type SheetBackRegistration = {
  id: number;
  onBack: () => void;
};

let nextRegistrationId = 1;
const registrations: SheetBackRegistration[] = [];
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function registerSheetBackButton(onBack: () => void): () => void {
  const registrationId = nextRegistrationId;
  nextRegistrationId += 1;
  registrations.push({ id: registrationId, onBack });
  notify();

  return () => {
    const registrationIndex = registrations.findIndex((registration) => registration.id === registrationId);
    if (registrationIndex === -1) {
      return;
    }

    registrations.splice(registrationIndex, 1);
    notify();
  };
}

export function isSheetBackButtonActive(): boolean {
  return registrations.length > 0;
}

export function getActiveSheetBackHandler(): (() => void) | null {
  const activeRegistration = registrations.at(-1);
  return activeRegistration?.onBack ?? null;
}

export function subscribeSheetBackButton(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
