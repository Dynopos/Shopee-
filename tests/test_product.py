import responses as resp_mock
import pytest
from shopee import ShopeeClient


@pytest.fixture
def client():
    return ShopeeClient(partner_id=1, partner_key="key", shop_id=2, access_token="tok", base_url="https://partner.shopeemobile.com")


@resp_mock.activate
def test_get_item_list(client):
    resp_mock.add(
        resp_mock.GET,
        "https://partner.shopeemobile.com/api/v2/product/get_item_list",
        json={"item": [{"item_id": 1}], "total_count": 1, "has_next_page": False},
        status=200,
    )
    result = client.product.get_item_list()
    assert result["total_count"] == 1


@resp_mock.activate
def test_get_item_list_api_error(client):
    from shopee.exceptions import ShopeeAPIError
    resp_mock.add(
        resp_mock.GET,
        "https://partner.shopeemobile.com/api/v2/product/get_item_list",
        json={"error": "error_auth", "message": "Invalid signature", "request_id": "req123"},
        status=200,
    )
    with pytest.raises(ShopeeAPIError) as exc_info:
        client.product.get_item_list()
    assert exc_info.value.error_code == "error_auth"
