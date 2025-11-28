import { useAuthStore } from '@/store/authStore';

export function useUserBuildingId() {
  const user = useAuthStore((state) => state.user);

  // ⚠️ HARDCODED FOR DEBUGGING - Use first building ID
  // TODO: Restore proper user building logic after authentication is fixed
  const HARDCODED_BUILDING_ID = 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc';

  // If user is super_admin or doesn't have a specific building, return hardcoded ID
  if (!user || user.role === 'super_admin') {
    return HARDCODED_BUILDING_ID;
  }

  // Fixed: use buildingId (not building_id) to match the type definition
  return user.buildingId || HARDCODED_BUILDING_ID;
}