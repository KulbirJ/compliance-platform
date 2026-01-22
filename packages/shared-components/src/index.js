// Main export file for shared components

// Assessment Components
export { default as ControlAssessmentModal, STATUS_OPTIONS } from './components/assessments/ControlAssessmentModal';

// Common Components
export { default as StatsCard } from './components/common/StatsCard';
export { default as StatusChip } from './components/common/StatusChip';

// Hooks
export { useApi, useDebounce, useLocalStorage, usePagination } from './hooks/common';
export { useAssessments } from './hooks/useAssessments';
export { useThreats } from './hooks/useThreats';
export { useEvidence } from './hooks/useEvidence';

// Utilities
export * from './utils/formatters';
export * from './utils/validators';
export * from './utils/constants';

// API Adapters
export { createApiAdapter } from './api/adapterFactory';
export { RestApiAdapter } from './api/restAdapter';
export { SharePointApiAdapter } from './api/sharepointAdapter';
