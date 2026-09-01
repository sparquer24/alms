import { ApplicationData } from '../types';

type SetState = (fn: (state: ApplicationStore) => Partial<ApplicationStore>) => void;

interface ApplicationStore {
  applications: ApplicationData[];
  setApplications: (applications: ApplicationData[]) => void;
  clearApplications: () => void;
}

export const useApplicationStore = ((initialState: Pick<ApplicationStore, 'applications'> = { applications: [] }) => {
  let state: ApplicationStore = {
    applications: initialState.applications,
    setApplications: () => { },
    clearApplications: () => { },
  };
  const listeners = new Set<(state: ApplicationStore) => void>();

  const setState = (fn: (state: ApplicationStore) => Partial<ApplicationStore>) => {
    state = { ...state, ...fn(state) };
    listeners.forEach(listener => listener(state));
  };

  return {
    getState: () => state,
    setState,
    subscribe: (listener: (state: ApplicationStore) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    applications: state.applications,
    setApplications: (applications: ApplicationData[]) =>
      setState(state => ({ ...state, applications })),
    clearApplications: () =>
      setState(state => ({ ...state, applications: [] })),
  };
})();
