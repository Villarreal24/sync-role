"""Auth shared utilities."""

import re

from syncRoleBackend.config import settings

# Extract project ref from supabase_url for cookie name
# e.g. https://abc123.supabase.co → abc123
_PROJECT_REF_MATCH = re.search(
    r"https://([^.]+)\.supabase\.co",
    settings.supabase_url,
)
_PROJECT_REF = _PROJECT_REF_MATCH.group(1) if _PROJECT_REF_MATCH else ""


def get_session_cookie_name() -> str:
    """Build the Supabase session cookie name from the project ref."""
    return f"sb-{_PROJECT_REF}-auth-token"
