import { Group, GroupItem } from '@telegram-tools/ui-kit';
import { PageHeader } from '@/components/layout/PageHeader';

type Props = {
  title: string;
  route: string;
  description?: string;
};

export function PageStub({ title, route, description }: Props) {
  return (
    <section className="page-content">
      <PageHeader title={title} />
      <div className="px-4">
        <p className="text-muted-foreground text-sm mb-4">{description ?? 'Phase 0 skeleton page'}</p>
        <Group header="Route">
          <GroupItem text={route} description="Scaffolded for migration" />
        </Group>
      </div>
    </section>
  );
}
