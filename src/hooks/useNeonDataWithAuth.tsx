import { useUserBuildingId } from './useUserBuildingId';
import { 
  useMembers as useNeonMembers,
  useConvocatorias as useNeonConvocatorias,
  useActas as useNeonActas,
  useTransactions as useNeonTransactions,
  useFinancialSummary as useNeonFinancialSummary,
  useLetters as useNeonLetters
} from './useNeonData';

// Wrapper hooks that automatically use the user's buildingId

export function useMembers() {
  const buildingId = useUserBuildingId();
  return useNeonMembers(buildingId || undefined);
}

export function useConvocatorias() {
  const buildingId = useUserBuildingId();
  return useNeonConvocatorias(buildingId || undefined);
}

export function useActas() {
  const buildingId = useUserBuildingId();
  return useNeonActas(buildingId || undefined);
}

export function useTransactions() {
  const buildingId = useUserBuildingId();
  return useNeonTransactions(buildingId || undefined);
}

export function useFinancialSummary() {
  const buildingId = useUserBuildingId();
  // Don't make the call if we don't have a buildingId
  return useNeonFinancialSummary(buildingId || '');
}

export function useLetters() {
  const buildingId = useUserBuildingId();
  return useNeonLetters(buildingId || undefined);
}

// Re-export other hooks that don't need buildingId
export { 
  useBuildings,
  // Comentados temporalmente - no existen en useNeonData
  // useCreateBuilding,
  // useUpdateBuilding,
  // useDeleteBuilding,
  // useCreateMember,
  // useUpdateMember,
  // useDeleteMember,
  // useCreateTransaction,
  // useUpdateTransaction,
  // useDeleteTransaction,
  // useCreateConvocatoria,
  // useUpdateConvocatoria,
  // useDeleteConvocatoria,
  // useCreateMinute,
  // useUpdateMinute,
  // useDeleteMinute,
  // useDashboardStats,
  // useMaintenanceTasks,
  // useCreateMaintenanceTask,
  // useMaintenanceProviders,
  // useMaintenanceAlerts
} from './useNeonData';