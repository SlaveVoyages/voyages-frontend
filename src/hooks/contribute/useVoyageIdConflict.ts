import { useEffect, useState } from 'react';

import { findVoyageIdConflict } from '@/utils/contribute/voyageIdConflict';

/**
 * Checks, shortly after it stops changing, whether the Voyage ID given to a new
 * voyage is already taken. Returns the reason, or undefined.
 */
export const useVoyageIdConflict = (
  voyageId: string | undefined,
  contributionId: string | undefined,
  enabled: boolean,
) => {
  const [conflict, setConflict] = useState<string | undefined>();

  useEffect(() => {
    setConflict(undefined);
    const id = voyageId?.trim();
    if (!enabled || !id || !contributionId) return;
    let current = true;
    const timer = setTimeout(async () => {
      const reason = await findVoyageIdConflict(id, contributionId);
      if (current) setConflict(reason);
    }, 500);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [voyageId, contributionId, enabled]);

  return conflict;
};
