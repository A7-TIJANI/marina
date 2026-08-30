import { Skeleton } from '@/components/ui/Skeleton';
import { Container } from '@/components/ui/Card';

export default function AdminLoading() {
  return (
    <Container className="py-8">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <Skeleton type="form" rows={6} />
        <div className="space-y-5">
          <Skeleton type="card" />
          <Skeleton type="table" rows={8} />
        </div>
      </div>
    </Container>
  );
}
