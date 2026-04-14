import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AuthDebugPanel } from '../components/auth/auth-debug-panel.jsx';
import { GroupDetailPanel } from '../components/groups/group-detail-panel.jsx';
import DashboardLayout from '../components/layout/DashboardLayout';
import { getApiErrorCode } from '../services/api/api-types.js';
import { getGroupDetail } from '../services/groups/group-api.js';

function getGroupDetailErrorState(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'GROUP_NOT_FOUND') {
    return {
      title: 'Group not found',
      description: 'The requested group does not exist or is no longer available.',
    };
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return {
      title: 'Access denied',
      description: 'You do not have permission to view this group.',
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
    title: 'Unable to load group',
    description:
      error instanceof Error && error.message.length > 0
        ? error.message
        : 'The group detail request failed. Please try again.',
  };
}

function GroupDetailLoadingState() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-8 w-2/5 rounded bg-slate-200" />
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

function GroupDetailErrorState({ title, description, onBack, onRetry }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-red-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-red-700">{description}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onBack}
          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          Back to Groups
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

export function GroupDetailPage() {
  const { groupId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [groupErrorState, setGroupErrorState] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const backDestination = location.state?.from ?? '/dashboard';
  const recentGroups =
    group === null
      ? []
      : [
          {
            id: group.id,
            name: group.name ?? 'Untitled Group',
            href: typeof group.id === 'string' ? `/groups/${group.id}` : '/dashboard',
          },
        ];

  useEffect(() => {
    if (typeof groupId !== 'string' || groupId.length === 0) {
      setGroup(null);
      setGroupErrorState({
        title: 'Invalid group',
        description: 'A valid group identifier is required to load this page.',
      });
      setIsLoadingGroup(false);
      return;
    }

    let isMounted = true;

    async function loadGroupDetail() {
      setIsLoadingGroup(true);
      setGroupErrorState(null);

      try {
        const response = await getGroupDetail(groupId);

        if (!isMounted) {
          return;
        }

        setGroup(response.group);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setGroup(null);
        setGroupErrorState(getGroupDetailErrorState(error));
      } finally {
        if (isMounted) {
          setIsLoadingGroup(false);
        }
      }
    }

    void loadGroupDetail();

    return () => {
      isMounted = false;
    };
  }, [groupId, retryCount]);

  function handleBack() {
    navigate(backDestination);
  }

  function handleRetry() {
    setRetryCount((previousRetryCount) => previousRetryCount + 1);
  }

  return (
    <DashboardLayout
      rooms={[]}
      recentItems={recentGroups}
      recentItemsLabel="Recent Groups"
      title="Group Detail"
      description="Review the full context for one interview group."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          <button
            onClick={handleBack}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to Groups
          </button>

          {isLoadingGroup ? <GroupDetailLoadingState /> : null}

          {!isLoadingGroup && groupErrorState !== null ? (
            <GroupDetailErrorState
              title={groupErrorState.title}
              description={groupErrorState.description}
              onBack={handleBack}
              onRetry={handleRetry}
            />
          ) : null}

          {!isLoadingGroup && groupErrorState === null && group !== null ? (
            <GroupDetailPanel group={group} />
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
