import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { openCreateRoomModal } from '../utils/createRoomModal';

const WORKFLOW_STEPS = [
  {
    id: '01',
    title: 'Create a Group',
    description:
      'Start by defining the interview group with the framework, database, and culture-fit priority that should guide the review.',
  },
  {
    id: '02',
    title: 'Add Applicants',
    description:
      'Open the group detail page and register applicants so the team has a single queue to manage and analyze.',
  },
  {
    id: '03',
    title: 'Run Analysis',
    description:
      'Trigger batch analysis from the group page to generate interview-ready insights for each applicant in the list.',
  },
  {
    id: '04',
    title: 'Review Questions',
    description:
      'Use the applicant detail page to inspect the analysis result, confirm progress, and review the generated questions.',
  },
];

function WorkflowStepCard({ step }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-blue-600">{step.id}</p>
      <h3 className="mt-3 text-xl font-semibold text-slate-900">{step.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{step.description}</p>
    </div>
  );
}

function PageLandmarkCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Page Landmarks</h3>
      <dl className="mt-4 space-y-3 text-sm text-slate-600">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <dt>Groups</dt>
          <dd className="font-medium text-slate-900">/dashboard</dd>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <dt>Group Detail</dt>
          <dd className="font-medium text-slate-900">Add applicants and batch analysis</dd>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <dt>Applicant Detail</dt>
          <dd className="font-medium text-slate-900">Review questions and progress</dd>
        </div>
      </dl>
    </div>
  );
}

export function WorkflowPage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout
      rooms={[]}
      title="Workflow"
      description="Follow the real product flow from group creation to applicant review."
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                Product Flow
              </span>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">
                Move from group setup to interview-ready questions without detours.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
                The main experience starts in groups, expands into applicants, and ends in the
                applicant detail review. This page keeps that order visible so the next action is
                always obvious.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Quick Actions
              </p>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={openCreateRoomModal}
                  className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-600"
                >
                  Create Group
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Open Group List
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-6 md:grid-cols-2">
            {WORKFLOW_STEPS.map((step) => (
              <WorkflowStepCard key={step.id} step={step} />
            ))}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Recommended Order</h3>
              <ol className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="rounded-xl bg-slate-50 px-4 py-3">1. Create a group from the sidebar or dashboard.</li>
                <li className="rounded-xl bg-slate-50 px-4 py-3">2. Enter the group detail page and add applicants.</li>
                <li className="rounded-xl bg-slate-50 px-4 py-3">3. Start analysis and track progress in the same group.</li>
                <li className="rounded-xl bg-slate-50 px-4 py-3">4. Open each applicant detail page to review questions.</li>
              </ol>
            </div>

            <PageLandmarkCard />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default WorkflowPage;
