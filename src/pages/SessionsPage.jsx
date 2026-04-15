import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { openCreateRoomModal } from '../utils/createRoomModal';

const WORKFLOW_STEPS = [
  {
    id: '01',
    title: '그룹 만들기',
    description:
      '면접을 진행할 그룹을 만들고 프레임워크, 데이터베이스, 컬처 핏 우선순위를 설정합니다.',
  },
  {
    id: '02',
    title: '지원자 추가',
    description:
      '그룹 상세 페이지에서 지원자를 등록해 팀이 한 곳에서 관리하고 분석할 수 있도록 합니다.',
  },
  {
    id: '03',
    title: '분석 실행',
    description:
      '그룹 페이지에서 일괄 분석을 시작해 각 지원자에 대한 면접 준비용 인사이트를 생성합니다.',
  },
  {
    id: '04',
    title: '질문 검토',
    description:
      '지원자 상세 페이지에서 분석 결과와 진행 상태를 확인하고 생성된 질문을 검토합니다.',
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
      <h3 className="text-lg font-semibold text-slate-900">주요 화면 안내</h3>
      <dl className="mt-4 space-y-3 text-sm text-slate-600">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <dt>그룹 목록</dt>
          <dd className="font-medium text-slate-900">/dashboard</dd>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <dt>그룹 상세</dt>
          <dd className="font-medium text-slate-900">지원자 추가 및 일괄 분석</dd>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <dt>지원자 상세</dt>
          <dd className="font-medium text-slate-900">질문 및 진행 현황 확인</dd>
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
      title="워크플로우"
      description="그룹 생성부터 지원자 검토까지 실제 사용 흐름을 한눈에 확인할 수 있습니다."
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                사용 흐름
              </span>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">
                그룹 설정부터 면접 질문 확인까지 한 흐름으로 이어집니다.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
                실제 주요 흐름은 그룹에서 시작해 지원자 목록으로 확장되고, 지원자 상세에서
                질문 검토로 마무리됩니다. 이 페이지는 그 순서를 쉽게 따라갈 수 있도록
                정리한 안내 화면입니다.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                빠른 실행
              </p>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={openCreateRoomModal}
                  className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-600"
                >
                  그룹 만들기
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  그룹 목록 열기
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
              <h3 className="text-lg font-semibold text-slate-900">권장 순서</h3>
              <ol className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="rounded-xl bg-slate-50 px-4 py-3">1. 사이드바나 대시보드에서 그룹을 만듭니다.</li>
                <li className="rounded-xl bg-slate-50 px-4 py-3">2. 그룹 상세 페이지로 들어가 지원자를 추가합니다.</li>
                <li className="rounded-xl bg-slate-50 px-4 py-3">3. 같은 화면에서 분석을 시작하고 진행 상황을 확인합니다.</li>
                <li className="rounded-xl bg-slate-50 px-4 py-3">4. 각 지원자 상세 페이지에서 질문을 검토합니다.</li>
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
