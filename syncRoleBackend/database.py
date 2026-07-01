from supabase import Client, create_client

from syncRoleBackend.config import settings

_clients: dict[str, Client] = {}


def get_supabase(apikey: str | None = None) -> Client:
    """Get a supabase client.

    - None / 'anon' → cached anon client (apikey header = anon key, no user JWT)
    - 'service_role' → cached service_role client (bypasses RLS)
    - user JWT string → FRESH client with anon key + user JWT in Authorization header for RLS
      (NOT cached — each user needs their own auth header)
    """
    # User JWT — never cache, we set per-user Authorization header
    if apikey and apikey not in ("anon", "service_role", None):
        client = create_client(settings.supabase_url, settings.supabase_anon_key)
        client.postgrest.auth(apikey)
        return client

    cache_key = apikey or "anon"
    if cache_key not in _clients:
        key = (
            settings.supabase_service_role_key
            if apikey == "service_role"
            else settings.supabase_anon_key
        )
        _clients[cache_key] = create_client(settings.supabase_url, key)
    return _clients[cache_key]
