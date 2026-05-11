import { useMemo } from 'react';
import db from '../lib/store';

/**
 * Hook to load and cache all master datasets
 * Returns instantly from localStorage (no network delay)
 */
export function useMasterData() {
  const data = useMemo(() => {
    const medicines = db.select('medicines', { sortBy: 'name' }).data;
    const symptoms = db.select('symptoms', { sortBy: 'name' }).data;
    const diagnoses = db.select('diagnoses', { sortBy: 'code' }).data;
    const labTests = db.select('lab_tests', { sortBy: 'name' }).data;

    return { medicines, symptoms, diagnoses, labTests };
  }, []);

  return data;
}

export default useMasterData;
