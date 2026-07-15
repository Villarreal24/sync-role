# Proposal: User Profile Extra Info

## Intent

Users of the extension see a popup with minimal UI — no user identity info beyond the auth badge. Adding Phone, LinkedIn, GitHub, and Portfolio to profiles lets the app display who the user is when filling forms or reviewing saved jobs, and prepares the profile for future team features.

## Scope

### In Scope
- Add `phone`, `linkedin_url`, `github_url`, `portfolio_url` columns to `profiles` table
- Update backend Pydantic schemas (`ProfileResponse`, `ProfileUpdateRequest`) and `from_db_row()`
- Update frontend API types (`Profile`, `ProfileUpdate`, `ProfileResponse`, `ProfileUpdateRequest`) and `toProfile()` mapper
- Update frontend `AuthUser` store type and `setProfile()` to include new fields
- Add form inputs to `ProfileForm.tsx` for the 4 new fields
- Add EN/ES copy strings for labels, placeholders, and hints
- Validate URL format (LinkedIn, GitHub, Portfolio) and phone format (basic)

### Out of Scope
- Email field — already in `auth.users`, accessible via JWT (`request.state.user_email`)
- Name field — already exists as `display_name`
- Displaying profile info in the extension popup — extension only shows panel toggle, no user info shown
- Syncing new fields via Google OAuth — Google doesn't provide these fields
- Team/user discovery features — future concern
- Phone number formatting with country codes or validation library

## Capabilities

> This section is the CONTRACT between proposal and specs phases.

### New Capabilities

None — this modifies existing profile behavior. No new spec files needed.

### Modified Capabilities

| Capability | Type | Scope |
|---|---|---|
| Profile Management | Modified | Add optional fields (phone, linkedin_url, github_url, portfolio_url) |

## Approach

1. **Database**: New migration `005_profile_extra_info.sql` — `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS` for 4 columns (all `TEXT NOT NULL DEFAULT ''`). Existing RLS policies cover new columns automatically.
2. **Backend**: Add fields to `ProfileResponse` and `ProfileUpdateRequest` in `schemas.py`. Update `from_db_row()`. Router needs no changes — PATCH handler uses `exclude_unset=True`.
3. **Frontend API**: Add fields to `Profile`, `ProfileUpdate`, `ProfileResponse`, `ProfileUpdateRequest` interfaces. Update `toProfile()` and `updateProfile()` mapper.
4. **Frontend store**: Add fields to `AuthUser` interface and `setProfile()` method. Update cookie setters for new fields.
5. **Frontend form**: Add 4 new `Input` fields to `ProfileForm.tsx` (phone with `type="tel"`, URLs with `type="url"`).
6. **Copy strings**: Add EN/ES labels, placeholders, hints for all 4 fields in `copy.ts`.
7. **Extension**: No changes. The extension popup does not display profile info.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/005_profile_extra_info.sql` | New | Add 4 columns to `profiles` table |
| `syncRoleBackend/profiles/schemas.py` | Modified | Add fields to `ProfileResponse` + `ProfileUpdateRequest` |
| `sync-role/src/features/auth/api/profiles.ts` | Modified | Update `Profile`, `ProfileUpdate`, mappers |
| `sync-role/src/features/auth/store/auth.store.ts` | Modified | Add fields to `AuthUser`, update `setProfile()`, cookie helpers |
| `sync-role/src/features/auth/components/ProfileForm.tsx` | Modified | Add form inputs for phone + URLs |
| `sync-role/src/features/auth/copy.ts` | Modified | Add EN/ES copy for labels, placeholders, hints |
| `docs/SDD.md` | Modified | Document new `profiles` columns |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Phone format inconsistency | Medium | Document as free-text, accept any string. No parsing. |
| Broken URL validation rejecting valid URLs | Low | Use browser-native `type="url"` on frontend; backend stores as plain text |
| Migration conflict with existing data | Low | All columns have `NOT NULL DEFAULT ''` — zero-downtime addition |

## Rollback Plan

1. Revert frontend changes (store, API types, form, copy) to previous commit
2. Backend schema revert to previous commit
3. Database: `ALTER TABLE profiles DROP COLUMN phone, DROP COLUMN linkedin_url, DROP COLUMN github_url, DROP COLUMN portfolio_url;` — safe because columns have no dependent objects

## Dependencies

None — no external packages or API integrations needed.

## Success Criteria

- [ ] User can save Phone, LinkedIn URL, GitHub URL, Portfolio URL in profile form
- [ ] Fields persist across page reload (loaded from API → store → form)
- [ ] Empty fields show as blank in the form (default `''`)
- [ ] Existing profiles get empty defaults for new columns with no errors
- [ ] Backend returns new fields in GET/PATCH `/profiles/me` responses
