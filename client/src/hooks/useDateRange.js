import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  parseUrlRange,
  serializeUrlRange,
  resolveRange,
  getInterval,
  getPreviousRange,
} from '../lib/dateRange.js';

export function useDateRange(referenceNow) {
  const [searchParams, setSearchParams] = useSearchParams();

  // If no referenceNow was provided, memoize a stable Date for this component lifecycle
  const stableNow = useMemo(() => referenceNow || new Date(), [referenceNow]);

  // Extract date range specification from URL parameters
  const rangeSpec = useMemo(() => {
    return parseUrlRange(searchParams);
  }, [searchParams]);

  // Extract compare toggle state from URL
  const compare = useMemo(() => {
    return searchParams.get('compare') === 'true';
  }, [searchParams]);

  // Resolve specification into concrete UTC ISO timestamps
  const resolved = useMemo(() => {
    const range = resolveRange(rangeSpec, stableNow);
    const interval = getInterval(range.from, range.to);
    const previous = getPreviousRange(range.from, range.to);
    return {
      from: range.from,
      to: range.to,
      interval,
      prevFrom: previous.from,
      prevTo: previous.to,
    };
  }, [rangeSpec, stableNow]);

  // Update date range in URL parameters
  const setRange = useCallback(
    (newSpec) => {
      const nextParams = new URLSearchParams(serializeUrlRange(newSpec));
      if (compare) {
        nextParams.set('compare', 'true');
      }
      setSearchParams(nextParams, { replace: true });
    },
    [compare, setSearchParams]
  );

  // Toggle compare mode in URL parameters
  const setCompare = useCallback(
    (nextCompare) => {
      const nextParams = new URLSearchParams(serializeUrlRange(rangeSpec));
      if (nextCompare) {
        nextParams.set('compare', 'true');
      } else {
        nextParams.delete('compare');
      }
      setSearchParams(nextParams, { replace: true });
    },
    [rangeSpec, setSearchParams]
  );

  return {
    rangeSpec,
    from: resolved.from,
    to: resolved.to,
    interval: resolved.interval,
    prevFrom: resolved.prevFrom,
    prevTo: resolved.prevTo,
    compare,
    setRange,
    setCompare,
  };
}
