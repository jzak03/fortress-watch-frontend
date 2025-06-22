
import { fetchOrganizationSummary } from '@/lib/api';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  // Data is fetched on the server before the page is rendered.
  const summary = await fetchOrganizationSummary();

  if (!summary) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Organization Dashboard</h1>
        <p>Failed to load dashboard data. Please try again later.</p>
      </div>
    );
  }

  // The client component receives the data as props and handles rendering.
  // No client-side loading state is needed for the initial render.
  return <DashboardClient summary={summary} />;
}
