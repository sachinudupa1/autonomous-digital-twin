// useAuth hook
//
// Re-exports useAuth from AuthContext for convenient component imports.
// Components should import from here rather than directly from AuthContext.
//
// INTEGRATION POINT: When AuthContext is fully wired to Firebase Auth or the
// backend session, this hook will automatically reflect live auth state.

export { useAuth } from '../context/AuthContext';
