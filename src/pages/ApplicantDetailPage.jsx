import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AuthDebugPanel } from '../components/auth/auth-debug-panel.jsx';
import { ApplicantDetailPanel } from '../components/applicants/applicant-detail-panel.jsx';
import DashboardLayout from '../components/layout/DashboardLayout';
import { getApiErrorCode } from '../services/api/api-types.js';
import { getApplicantDetail } from '../services/applicants/applicant-api.js';

function getApplicantDetailErrorState(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'APPLICANT_NOT_FOUND') {
    return {
      title: 'Applicant not found',
      description: 'The requested applicant does not exist or is no longer available.',
    };
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return {
      title: 'Access denied',
      description: 'You do not have permission to view this applicant.',
    };
  }

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return {
      title: 'Session expired',
      description: 'Your session is no longer valid. Please sign in again and retry.',
    };
  }

  if (error?.response === undefined) {
    return {
      title: 'Network error',
      description: 'Unable to reach the server. Please check your connection and try again.',
    };
  }

  return {
    title: 'Unable to load applicant',
    description:
      error instanceof Error && error.message.length > 0
        ? error.message
        : 'The applicant detail request failed. Please try again.',
  };
}

function getApplicantGroupContextErrorState(applicantGroupId, routeGroupId) {
  return {
    title: 'Group context mismatch',
    description:
      applicantGroupId === null
        ? 'The applicant detail response did not include a valid group context.'
        : `This applicant belongs to group "${applicantGroupId}", not "${routeGroupId}".`,
  };
}

function ApplicantDetailLoadingState() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-8 w-1/3 rounded bg-slate-200" />
        <div className="h-5 w-3/4 rounded bg-slate-100" />
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-24 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </section>
  );
}

function ApplicantDetailErrorState({ title, description, onBack, onRetry }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-red-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-red-700">{description}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onBack}
          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          Back to Applicants
        </button>

        <button
          onClick={onRetry}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </section>
  );
}

export function ApplicantDetailPage() {
  const { applicantId, groupId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState(null);
  const [isLoadingApplicant, setIsLoadingApplicant] = useState(true);
  const [applicantErrorState, setApplicantErrorState] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const effectiveGroupId = applicant?.groupId ?? groupId ?? null;
  const backDestination = location.state?.from ?? `/groups/${effectiveGroupId ?? ''}`;
  const recentApplicants =
    applicant === null
      ? []
      : [
          {
            id: applicant.id,
            name: applicant.name ?? 'Unnamed Applicant',
            href:
              typeof applicant.id === 'string' && typeof effectiveGroupId === 'string'
                ? `/groups/${effectiveGroupId}/applicants/${applicant.id}`
                : `/groups/${effectiveGroupId ?? ''}`,
          },
        ];

  useEffect(() => {
    if (typeof applicantId !== 'string' || applicantId.length === 0) {
      setApplicant(null);
      setApplicantErrorState({
        title: 'Invalid applicant',
        description: 'A valid applicant identifier is required to load this page.',
      });
      setIsLoadingApplicant(false);
      return;
    }

    let isMounted = true;

    async function loadApplicantDetail() {
      setIsLoadingApplicant(true);
      setApplicantErrorState(null);

      try {
        const response = await getApplicantDetail(applicantId);

        if (!isMounted) {
          return;
        }

        setApplicant(response.applicant);
        if (
          typeof groupId === 'string' &&
          groupId.length > 0 &&
          typeof response.applicant.groupId === 'string' &&
          response.applicant.groupId.length > 0 &&
          response.applicant.groupId !== groupId
        ) {
          setApplicantErrorState(
            getApplicantGroupContextErrorState(response.applicant.groupId, groupId),
          );
          return;
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setApplicant(null);
        setApplicantErrorState(getApplicantDetailErrorState(error));
      } finally {
        if (isMounted) {
          setIsLoadingApplicant(false);
        }
      }
    }

    void loadApplicantDetail();

    return () => {
      isMounted = false;
    };
  }, [applicantId, groupId, retryCount]);

  function handleBack() {
    navigate(backDestination);
  }

  function handleRetry() {
    setRetryCount((previousRetryCount) => previousRetryCount + 1);
  }

  return (
    <DashboardLayout
      rooms={[]}
      recentItems={recentApplicants}
      recentItemsLabel="Recent Applicants"
      title="Applicant Detail"
      description="Review the full context for one applicant."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          <button
            onClick={handleBack}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to Applicants
          </button>

          {isLoadingApplicant ? <ApplicantDetailLoadingState /> : null}

          {!isLoadingApplicant && applicantErrorState !== null ? (
            <ApplicantDetailErrorState
              title={applicantErrorState.title}
              description={applicantErrorState.description}
              onBack={handleBack}
              onRetry={handleRetry}
            />
          ) : null}

          {!isLoadingApplicant && applicantErrorState === null && applicant !== null ? (
            <ApplicantDetailPanel applicant={applicant} />
          ) : null}
        </section>

        <aside className="space-y-6">
          <AuthDebugPanel />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Navigation Context</h3>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Group ID
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">{groupId ?? '-'}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Applicant ID
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">{applicantId ?? '-'}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Return Path
                </p>
                <p className="mt-2 break-all font-medium text-slate-800">{backDestination}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
