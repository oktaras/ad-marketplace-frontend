import { Spinner } from '@telegram-tools/ui-kit';

type Props = {
  label?: string;
};

export function PageLoading({ label = 'Loading...' }: Props) {
  return (
    <section
      className="page-content"
      style={{ minHeight: '40dvh', display: 'grid', placeItems: 'center', textAlign: 'center' }}
    >
      <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
        <Spinner size="24px" />
        <p style={{ color: 'var(--color-foreground-secondary)', fontSize: 14 }}>{label}</p>
      </div>
    </section>
  );
}
