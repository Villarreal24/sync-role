import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile, type Profile, type ProfileUpdate } from '../api/profiles'
import { useAuthStore } from '../store/auth.store'

/**
 * TanStack Query mutation for PATCH /api/v1/profiles/me.
 *
 * On success:
 *  - Updates the auth store with the new displayName / avatarUrl
 *    (so the sidebar avatar updates immediately without a re-fetch).
 *  - Invalidates the overview stats query so any open dashboard
 *    re-fetches with the new profile fields.
 */
export function useUpdateProfile() {
  const setProfile = useAuthStore((s) => s.setProfile)
  const queryClient = useQueryClient()

  return useMutation<Profile, Error, ProfileUpdate>({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      setProfile(data.displayName, data.avatarUrl)
      void queryClient.invalidateQueries({ queryKey: ['overview', 'stats'] })
    },
  })
}
