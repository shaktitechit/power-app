import { useEffect, type Dispatch, type SetStateAction } from "react";

import type { NestedDatasetSpec } from "./audit-snapshot-nested-sidebar";

/** Keep active sidebar key valid when merged dataset list changes. */
export function useSyncNestedDatasetKey(
  nestedDatasets: NestedDatasetSpec[],
  setActiveNestedKey: Dispatch<SetStateAction<string>>,
): void {
  useEffect(() => {
    if (!nestedDatasets.length) {
      setActiveNestedKey("");
      return;
    }
    setActiveNestedKey((prev) =>
      nestedDatasets.some((t) => t.key === prev)
        ? prev
        : nestedDatasets[0].key,
    );
  }, [nestedDatasets, setActiveNestedKey]);
}

