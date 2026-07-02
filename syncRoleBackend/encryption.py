"""pgcrypto helpers for encrypting provider API keys (deferred capability).

Uses PostgreSQL pgp_sym_encrypt/pgp_sym_decrypt via raw SQL.
Provider config (api_key storage) is deferred — this module is a placeholder.
"""

from syncRoleBackend.config import settings
from syncRoleBackend.database import get_supabase


def encrypt_value(plaintext: str) -> str:
    """Encrypt a value using pgp_sym_encrypt with SUPABASE_ENCRYPTION_KEY."""
    sb = get_supabase("service_role")
    result = sb.rpc("pgp_sym_encrypt", {
        "text": plaintext,
        "key": settings.supabase_encryption_key,
    }).execute()
    return result.data


def decrypt_value(ciphertext: str) -> str:
    """Decrypt a value using pgp_sym_decrypt with SUPABASE_ENCRYPTION_KEY."""
    sb = get_supabase("service_role")
    result = sb.rpc("pgp_sym_decrypt", {
        "text": ciphertext,
        "key": settings.supabase_encryption_key,
    }).execute()
    return result.data
