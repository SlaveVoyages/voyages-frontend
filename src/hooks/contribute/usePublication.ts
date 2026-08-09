import { useCallback, useEffect, useRef, useState } from 'react';

import {
  publish as publishRequest,
  pollPublication,
  PublicationConflict,
  PublicationMode,
  PublicationRejectedError,
  PublicationStatus,
  PublicationValidation,
} from '@/fetch/contributeFetch/publishApi';

const POLL_INTERVAL_MS = 3000;

/**
 * Where a publication run currently stands.
 *
 * Neither `blocked` nor `failed` leaves anything written: the refusal happens
 * before the change set reaches Django, and the run itself is one transaction
 * that rolls back whole. They are separate states because the editor's next
 * move differs — `blocked` means contributions to fix, `failed` means a bug to
 * report, since data problems are caught before publishing starts.
 */
export type PublicationPhase =
  | 'idle'
  | 'starting'
  | 'blocked'
  | 'publishing'
  | 'completed'
  | 'failed';

export interface PublicationTarget {
  id: string | number;
  mode: PublicationMode;
  /** For messages — e.g. the batch title. */
  label?: string;
}

export interface UsePublicationResult {
  phase: PublicationPhase;
  target: PublicationTarget | null;
  /** Live status while publishing, and the final one afterwards. */
  status: PublicationStatus | null;
  /** Set when the server refused: properties two contributions disagree on. */
  conflicts: PublicationConflict[];
  /** Errors when blocked; warnings once published. */
  validation: PublicationValidation[];
  /** Set when the run itself broke, or a request failed. */
  error: string | null;
  publish: (target: PublicationTarget) => Promise<void>;
  /** Re-attach to a run already in flight, e.g. after a reload. */
  resume: (target: PublicationTarget, publicationKey: string) => void;
  reset: () => void;
}

export const usePublication = (options?: {
  onPublished?: (status: PublicationStatus) => void;
}): UsePublicationResult => {
  const [phase, setPhase] = useState<PublicationPhase>('idle');
  const [target, setTarget] = useState<PublicationTarget | null>(null);
  const [status, setStatus] = useState<PublicationStatus | null>(null);
  const [conflicts, setConflicts] = useState<PublicationConflict[]>([]);
  const [validation, setValidation] = useState<PublicationValidation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeKeyRef = useRef<string | null>(null);
  // Callbacks are read through a ref so the polling loop never closes over a
  // stale one, and so changing it doesn't restart the loop.
  const onPublishedRef = useRef(options?.onPublished);
  onPublishedRef.current = options?.onPublished;

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    activeKeyRef.current = null;
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  /**
   * Recursive setTimeout rather than setInterval, so each request waits for the
   * previous response instead of stacking up when the server is slow.
   */
  const startPolling = useCallback(
    (publicationKey: string) => {
      activeKeyRef.current = publicationKey;

      const tick = async () => {
        if (activeKeyRef.current !== publicationKey) {
          return;
        }
        try {
          const next = await pollPublication(publicationKey);
          // Check again: another run may have started while this was in flight.
          if (activeKeyRef.current !== publicationKey) {
            return;
          }
          setStatus(next);

          if (next.status === 'completed') {
            stopPolling();
            setPhase('completed');
            onPublishedRef.current?.(next);
          } else if (next.status === 'failed') {
            stopPolling();
            setError(
              next.error ?? 'The publication failed and was rolled back.',
            );
            setPhase('failed');
          } else {
            pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
          }
        } catch (err) {
          if (activeKeyRef.current !== publicationKey) {
            return;
          }
          stopPolling();
          // The publication may still be running on the server; say so rather
          // than implying it stopped.
          setError(
            err instanceof Error
              ? `Lost contact with the publication: ${err.message}`
              : 'Lost contact with the publication.',
          );
          setPhase('failed');
        }
      };

      // Ask once immediately — a short batch can be finished already.
      void tick();
    },
    [stopPolling],
  );

  const reset = useCallback(() => {
    stopPolling();
    setPhase('idle');
    setTarget(null);
    setStatus(null);
    setConflicts([]);
    setValidation([]);
    setError(null);
  }, [stopPolling]);

  const publish = useCallback(
    async (next: PublicationTarget) => {
      stopPolling();
      setTarget(next);
      setStatus(null);
      setConflicts([]);
      setValidation([]);
      setError(null);
      setPhase('starting');

      try {
        const accepted = await publishRequest(next.id, next.mode);
        // Warnings ride the success path and have nowhere else to surface.
        setValidation(accepted.validation ?? []);

        if (accepted.status === 'completed') {
          setPhase('completed');
          return;
        }
        // `accepted` and `processing` are the same to us: the server keys the
        // task on the target, so a second call joins the run already going.
        setPhase('publishing');
        startPolling(accepted.publication_key);
      } catch (err) {
        if (err instanceof PublicationRejectedError) {
          setConflicts(err.conflicts);
          setValidation(err.validation);
          setError(err.message);
          setPhase('blocked');
          return;
        }
        // Anything thrown by the publish call itself is a refusal, not a failed
        // run: the server never handed the change set to Django. Reported as
        // `blocked` so the wording stays about fixing contributions rather than
        // reporting a bug.
        setError(err instanceof Error ? err.message : 'Could not publish.');
        setPhase('blocked');
      }
    },
    [startPolling, stopPolling],
  );

  const resume = useCallback(
    (next: PublicationTarget, publicationKey: string) => {
      stopPolling();
      setTarget(next);
      setError(null);
      setPhase('publishing');
      startPolling(publicationKey);
    },
    [startPolling, stopPolling],
  );

  return {
    phase,
    target,
    status,
    conflicts,
    validation,
    error,
    publish,
    resume,
    reset,
  };
};
