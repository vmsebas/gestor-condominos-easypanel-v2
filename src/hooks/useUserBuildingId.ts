import { useAuthStore } from '@/store/authStore';

export function useUserBuildingId() {
  const user = useAuthStore((state) => state.user);

  // ⚠️ HARDCODED FOR DEBUGGING - Use first building ID
  // TODO: Restore proper user building logic after authentication is fixed
  const HARDCODED_BUILDING_ID = '9cf64a8a-8570-4f16-94a5-dd48c694324c';

  // If user is super_admin or doesn't have a specific building, return hardcoded ID
  if (!user || user.role === 'super_admin') {
    return HARDCODED_BUILDING_ID;
  }

  // Fixed: use buildingId (not building_id) to match the type definition
  return user.buildingId || HARDCODED_BUILDING_ID;
}