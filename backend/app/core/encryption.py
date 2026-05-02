"""Fernet-based encryption helpers for sensitive fields (e.g. bank account numbers).

If the key is falsy (dev mode / not configured), the value is returned unchanged
so the rest of the code never has to branch on key presence.
"""
from cryptography.fernet import Fernet


def encrypt_bank(value: str, key: str) -> str:
    """Encrypt *value* with *key* and return a base64-encoded ciphertext string.

    If *key* is falsy, return *value* unchanged (dev/test mode).
    """
    if not key:
        return value
    f = Fernet(key.encode())
    return f.encrypt(value.encode()).decode()


def decrypt_bank(ciphertext: str, key: str) -> str:
    """Decrypt *ciphertext* with *key* and return the plaintext string.

    If *key* is falsy, return *ciphertext* unchanged (dev/test mode).
    """
    if not key:
        return ciphertext
    f = Fernet(key.encode())
    return f.decrypt(ciphertext.encode()).decode()
