import { useSyncExternalStore } from 'react';

interface State {
    formData: any;
}

// Simple module-level state to mimic a tiny global store. This avoids requiring
// zustand during refactors and keeps a consistent API: useFreshFormStore() returns
// { formData, setField, reset }.
let _state: State = { formData: {} };
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

const setField = (k: string, v: any) => {
    _state = { formData: { ...(_state.formData || {}), [k]: v } };
    notify();
};

const reset = () => {
    _state = { formData: {} };
    notify();
};

const getSnapshot = () => _state;

export const useFreshFormStore = () => {
    const snapshot = useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        getSnapshot,
        getSnapshot
    );

    return {
        formData: snapshot.formData,
        setField,
        reset
    };
};

export default useFreshFormStore;
