from supabase import Client, create_client

from syncRoleBackend.config import settings

_clients: dict[str, Client] = {}


def get_supabase(apikey: str | None = None) -> Client:
    """Get a supabase client with the given apikey.

    - None → returns anon client (default for user operations, RLS enforced)
    - 'service_role' → returns service_role client (bypasses RLS, for scrape/admin)
    - user JWT string → returns anon client with user's JWT as apikey (RLS enforced)
    """
    cache_key = apikey or "anon"
    if cache_key not in _clients:
        if apikey == "service_role":
            key = settings.supabase_service_role_key
        elif apikey:
            key = apikey  # user JWT
        else:
            key = settings.supabase_anon_key
        _clients[cache_key] = create_client(settings.supabase_url, key)
    return _clients[cache_key]
