import { CarsSingleViewShell } from '@/components/workspace/cars-single-view-shell';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@va/ui';
import { baselineWorkspaceLayout, type CoordinateSpace } from '@va/view-system';
import { AppWindow, Network, Orbit, PanelsTopLeft } from 'lucide-react';

const releases = [
  { version: 'v2.0.0', label: 'React shell', detail: 'Workspace scaffold, monorepo layout, and starter contracts.' },
  { version: 'v2.1.0', label: 'Data foundation', detail: 'Query contracts, coordinated state, and workerized compute.' },
  { version: 'v2.2.0', label: 'Single-view analytics', detail: 'A focused cars workflow with one chart, one control surface, and one detail panel.' },
];

const pillars = [
  {
    title: 'Single-page workspace',
    detail: `${baselineWorkspaceLayout.mode} canvas shell with room for focused and exploratory flows.`,
    icon: PanelsTopLeft,
  },
  {
    title: 'Data-native core',
    detail: 'The view system is being rebuilt around query contracts, dataset descriptors, and local/remote execution.',
    icon: Network,
  },
  {
    title: 'Spatial-ready future',
    detail: `Coordinate space starts in ${String('screen-2d' satisfies CoordinateSpace)} and will expand toward surrounding-user layouts later.`,
    icon: Orbit,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(44,125,160,0.25),_transparent_38%),linear-gradient(180deg,_#07131c_0%,_#081927_48%,_#f4f8fb_48%,_#f4f8fb_100%)] text-slate-50">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
          <Card className="border-white/10 bg-slate-950/55 text-white shadow-2xl shadow-cyan-950/30 backdrop-blur">
            <CardHeader className="gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">v2.2.0 current release</Badge>
                <Badge variant="outline">Next.js App Router</Badge>
                <Badge variant="outline">FastAPI</Badge>
              </div>
              <div className="max-w-3xl space-y-4">
                <CardTitle className="font-[family-name:var(--font-display)] text-4xl tracking-tight md:text-6xl">
                  The React rewrite now has its first real analytic workflow.
                </CardTitle>
                <CardDescription className="max-w-2xl text-base text-slate-300 md:text-lg">
                  The framework has moved past the data-foundation milestone and into a concrete single-view
                  experience. The cars analysis below is the first proof that the shared contracts, execution
                  planner, and coordination store can drive a usable analytic surface.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {pillars.map(({ title, detail, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-lg shadow-slate-950/10"
                >
                  <Icon className="mb-4 size-5 text-cyan-300" />
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-950/65 text-white shadow-2xl shadow-cyan-950/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-[family-name:var(--font-display)] text-2xl">Release ladder</CardTitle>
              <CardDescription className="text-slate-300">
                Each minor adds one new core capability. Patches are reserved for small batches and hotfixes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {releases.map((release) => (
                <div key={release.version} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-[family-name:var(--font-display)] text-lg">{release.version}</p>
                    <Badge variant="outline">{release.label}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{release.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-950/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AppWindow className="size-5 text-cyan-700" />
              <CardTitle className="font-[family-name:var(--font-display)] text-2xl">Single-view release focus</CardTitle>
            </div>
            <CardDescription className="max-w-3xl text-slate-600">
              v2.2.0 keeps the product intentionally constrained: one main chart, one coordinated table,
              one detail panel, and one control rail. That gives the next graph, spatio-temporal, and multi-view
              milestones a concrete interaction pattern to evolve from instead of another abstract scaffold.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {baselineWorkspaceLayout.slots.map((slot) => (
                <div key={slot.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{slot.role}</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-lg text-slate-900">{slot.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <CarsSingleViewShell />
      </section>
    </main>
  );
}
