import hashlib
import hmac
import time


def timestamp() -> int:
    return int(time.time())


def sign(partner_id: int, path: str, ts: int, partner_key: str, access_token: str = "", shop_id: int = 0) -> str:
    """Compute the HMAC-SHA256 signature required by Shopee Open API v2."""
    if shop_id:
        base = f"{partner_id}{path}{ts}{access_token}{shop_id}"
    else:
        base = f"{partner_id}{path}{ts}"
    return hmac.new(partner_key.encode(), base.encode(), hashlib.sha256).hexdigest()
