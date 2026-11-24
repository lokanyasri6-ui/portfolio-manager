import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { errMsg, firstArray } from '../api';
import { normInv, totalsOf, withAllocation } from '../utils/format';

const Ctx = createContext(null);
export const useData = () => useContext(Ctx);

/** Shared, real investments list (GET /api/investments/) used by the ticker and as fallback source. */
export function DataProvider({ children }) {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/investments/');
      setRaw(firstArray(data));
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => {
    const investments = withAllocation(raw.map(normInv));
    return { investments, totals: totalsOf(investments), loading, error, reload };
  }, [raw, loading, error, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
