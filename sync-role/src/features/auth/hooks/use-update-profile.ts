import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile, type Profile, type ProfileUpdate } from '../api/profiles'

const PROFILE_QUERY_KEY = ['profile'] as const

/**
 * TanStack Query mutation for PATCH /api/v1/profiles/me.
 *
 * On success:
 *  - Invalidates the profile query so the sidebar/profile page re-fetches
 *  - Invalidates the overview stats query for dashboard updates
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<Profile, Error, ProfileUpdate>({
    mutationFn: updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['overview', 'stats'] })
    },
  })
}
