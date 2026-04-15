import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { GroupListSection } from '../components/groups/group-list-section.jsx';
import { GroupPagination } from '../components/groups/group-pagination.jsx';
import DashboardLayout from '../components/layout/DashboardLayout';
import { getApiErrorCode } from '../services/api/api-types.js';
import {
  createGroupListSearchParams,
  getGroups,
  normalizeGroupListParams,
} from '../services/groups/group-api.js';
import {
  DEFAULT_GROUP_LIST_PAGE,
  DEFAULT_GROUP_LIST_SIZE,
} from '../services/groups/group-types.js';
import { openCreateRoomModal } from '../utils/createRoomModal';

function getGroupListErrorMessage(error) {
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'UNAUTHORIZED' || errorCode === 'AUTH_TOKEN_EXPIRED') {
    return 'Your session is no longer valid. Please sign in again and retry.';
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return 'You do not have permission to access this group list.';
  }

  if (error?.response === undefined) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Group list request failed. Please try again.';
}

function WorkflowShortcutCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Workflow Shortcut</h3>
          <p className="mt-1 text-sm text-slate-500">
            Start in groups, add applicants inside each group, then review generated questions per
            applicant.
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          Main Flow
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          onClick={openCreateRoomModal}
          className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-600"
        >
          Create Group
        </button>

        <Link
          to="/workflow"
          className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Open Workflow Guide
        </Link>
      </div>

      <ol className="mt-5 space-y-3 text-sm text-slate-600">
        <li className="rounded-xl bg-slate-50 px-4 py-3">1. Create a group with team context.</li>
        <li className="rounded-xl bg-slate-50 px-4 py-3">2. Add applicants in the group detail page.</li>
        <li className="rounded-xl bg-slate-50 px-4 py-3">3. Start analysis and review applicant details.</li>
      </ol>
    </div>
  );
}

export function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [groupListMeta, setGroupListMeta] = useState({
    page: DEFAULT_GROUP_LIST_PAGE,
    size: DEFAULT_GROUP_LIST_SIZE,
    total: 0,
    requestId: null,
  });
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupListErrorMessage, setGroupListErrorMessage] = useState(null);
  const [groupCreationSuccessMessage, setGroupCreationSuccessMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const normalizedParams = normalizeGroupListParams({
    page: searchParams.get('page'),
    size: searchParams.get('size'),
    sort: searchParams.get('sort'),
    order: searchParams.get('order'),
  });
  const normalizedSearchParams = createGroupListSearchParams(normalizedParams);
  const currentSearchParamsString = searchParams.toString();
  const normalizedSearchParamsString = normalizedSearchParams.toString();
  const isSearchParamsNormalized = currentSearchParamsString === normalizedSearchParamsString;
  const currentPage = normalizedParams.page;
  const currentSize = normalizedParams.size;
  const currentSort = normalizedParams.sort;
  const currentOrder = normalizedParams.order;
  const recentGroups = groups.map((group) => ({
    id: group.id,
    name: group.name ?? 'Untitled Group',
    href: typeof group.id === 'string' ? `/groups/${group.id}` : '/dashboard',
  }));

  useEffect(() => {
    if (isSearchParamsNormalized) {
      return;
    }

    setSearchParams(new URLSearchParams(normalizedSearchParamsString), {
      replace: true,
    });
  }, [isSearchParamsNormalized, normalizedSearchParamsString, setSearchParams]);

  useEffect(() => {
    if (!isSearchParamsNormalized) {
      return;
    }

    let isMounted = true;

    async function loadGroups() {
      setIsLoadingGroups(true);
      setGroupListErrorMessage(null);
      setGroupListMeta((previousMeta) => ({
        ...previousMeta,
        page: currentPage,
        size: currentSize,
      }));

      try {
        const response = await getGroups({
          page: currentPage,
          size: currentSize,
          sort: currentSort,
          order: currentOrder,
        });

        if (!isMounted) {
          return;
        }

        setGroups(response.groups);
        setGroupListMeta(response.meta);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setGroups([]);
        setGroupListMeta((previousMeta) => ({
          ...previousMeta,
          page: currentPage,
          size: currentSize,
          total: 0,
        }));
        setGroupListErrorMessage(getGroupListErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsLoadingGroups(false);
        }
      }
    }

    void loadGroups();

    return () => {
      isMounted = false;
    };
  }, [currentOrder, currentPage, currentSize, currentSort, isSearchParamsNormalized, retryCount]);

  useEffect(() => {
    const refreshGroupsAt = location.state?.refreshGroupsAt;
    const createdGroupName = location.state?.createdGroupName;

    if (typeof refreshGroupsAt !== 'number') {
      return;
    }

    setGroupCreationSuccessMessage(
      typeof createdGroupName === 'string' && createdGroupName.length > 0
        ? `Group "${createdGroupName}" was created successfully.`
        : 'Group was created successfully.',
    );
    setRetryCount((previousRetryCount) => previousRetryCount + 1);
  }, [location.state]);

  function updateSearchParams(nextParams) {
    setSearchParams(createGroupListSearchParams(nextParams));
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage === normalizedParams.page) {
      return;
    }

    updateSearchParams({
      ...normalizedParams,
      page: nextPage,
    });
  }

  function handlePageSizeChange(event) {
    const nextSize = Number(event.target.value);

    updateSearchParams({
      ...normalizedParams,
      page: DEFAULT_GROUP_LIST_PAGE,
      size: nextSize,
    });
  }

  function handleRetry() {
    setRetryCount((previousRetryCount) => previousRetryCount + 1);
  }

  function handleSelectGroup(group) {
    if (typeof group?.id !== 'string' || group.id.length === 0) {
      return;
    }

    navigate(`/groups/${group.id}`, {
      state: {
        from: `${location.pathname}${location.search}`,
      },
    });
  }

  return (
    <DashboardLayout
      rooms={[]}
      recentItems={recentGroups}
      recentItemsLabel="Recent Groups"
      title="Groups"
      description="Browse and paginate the interview groups owned by your account."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          {groupCreationSuccessMessage.length > 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
              {groupCreationSuccessMessage}
            </div>
          ) : null}

          <GroupListSection
            groups={groups}
            isLoading={isLoadingGroups}
            errorMessage={groupListErrorMessage}
            onRetry={handleRetry}
            onSelectGroup={handleSelectGroup}
            totalGroups={groupListMeta.total}
          />

          <GroupPagination
            page={groupListMeta.page}
            size={groupListMeta.size}
            total={groupListMeta.total}
            isDisabled={isLoadingGroups}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </section>

        <aside className="space-y-6">
          <WorkflowShortcutCard />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">List State</h3>

            <dl className="space-y-4 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Current Page
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{groupListMeta.page}</dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Page Size
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{groupListMeta.size}</dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total Groups
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{groupListMeta.total}</dd>
              </div>
            </dl>
          </div>

        </aside>
      </div>
    </DashboardLayout>
  );
}
