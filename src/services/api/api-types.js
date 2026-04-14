export function getApiErrorCode(error) {
  return error?.response?.data?.error?.code ?? null;
}
