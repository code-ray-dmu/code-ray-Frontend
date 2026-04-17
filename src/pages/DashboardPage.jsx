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
    return '세션이 만료되었습니다. 다시 로그인한 뒤 시도해 주세요.';
  }

  if (errorCode === 'FORBIDDEN_RESOURCE_ACCESS') {
    return '이 그룹 목록에 접근할 권한이 없습니다.';
  }

  if (error?.response === undefined) {
    return '서버에 연결할 수 없습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.';
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return '그룹 목록을 불러오지 못했습니다. 다시 시도해 주세요.';
}

function WorkflowShortcutCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">빠른 시작 안내</h3>
          <p className="mt-1 text-sm text-slate-500">
            그룹을 만든 뒤 지원자를 추가하고, 각 지원자별로 생성된 질문을 확인하는
            흐름으로 진행하면 됩니다.
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          기본 흐름
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          onClick={openCreateRoomModal}
          className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-600"
        >
          그룹 만들기
        </button>

        <Link
          to="/workflow"
          className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          워크플로우 가이드 보기
        </Link>
      </div>

      <ol className="mt-5 space-y-3 text-sm text-slate-600">
        <li className="rounded-xl bg-slate-50 px-4 py-3">1. 팀 정보에 맞는 그룹을 만듭니다.</li>
        <li className="rounded-xl bg-slate-50 px-4 py-3">2. 그룹 상세에서 지원자를 추가합니다.</li>
        <li className="rounded-xl bg-slate-50 px-4 py-3">3. 분석을 시작하고 결과를 확인합니다.</li>
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
    name: group.name ?? '이름 없는 그룹',
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
        ? `"${createdGroupName}" 그룹이 생성되었습니다.`
        : '그룹이 생성되었습니다.',
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
        groupSummary: group,
      },
    });
  }

  return (
    <DashboardLayout
      rooms={[]}
      recentItems={recentGroups}
      recentItemsLabel="최근 그룹"
      title="그룹"
      description="내 계정에 속한 면접 그룹을 확인하고 관리할 수 있습니다."
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
            <h3 className="mb-4 text-lg font-semibold text-slate-900">목록 현황</h3>

            <dl className="space-y-4 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  현재 페이지
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{groupListMeta.page}</dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  페이지당 개수
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{groupListMeta.size}</dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  전체 그룹 수
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
