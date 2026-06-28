from shopee.auth import sign


def test_sign_shop_level():
    sig = sign(partner_id=1234, path="/api/v2/product/get_item_list", ts=1700000000, partner_key="secret", access_token="token", shop_id=5678)
    assert isinstance(sig, str)
    assert len(sig) == 64  # SHA-256 hex digest


def test_sign_no_shop():
    sig = sign(partner_id=1234, path="/api/v2/auth/token/get", ts=1700000000, partner_key="secret")
    assert len(sig) == 64


def test_sign_deterministic():
    args = dict(partner_id=1, path="/test", ts=100, partner_key="key", access_token="tok", shop_id=2)
    assert sign(**args) == sign(**args)
