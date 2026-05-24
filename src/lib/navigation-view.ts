type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined> | undefined>
  | undefined;

export async function resolveView(
  searchParams: SearchParamsInput,
  allowedViews: readonly string[],
  defaultView = "overview",
) {
  const params = (await searchParams) ?? {};
  const rawView = params.view;
  const view = Array.isArray(rawView) ? rawView[0] : rawView;

  if (view && allowedViews.includes(view)) {
    return view;
  }

  return defaultView;
}

export function normalizeSectionKey(value: string | undefined | null, fallback: string) {
  return value?.trim() || fallback;
}
