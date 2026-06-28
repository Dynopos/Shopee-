import responses as resp_mock
import pytest
from shopee import ShopeeClient


@pytest.fixture
def client():
    return ShopeeClient(partner_id=1, partner_key="key", shop_id=2, access_token="tok", base_url="https://partner.shopeemobile.com")


@resp_mock.activate
def test_get_order_detail(client):
    resp_mock.add(
        resp_mock.GET,
        "https://partner.shopeemobile.com/api/v2/order/get_order_detail",
        json={"response": {"order_list": [{"order_sn": "XYZ", "order_status": "READY_TO_SHIP"}]}},
        status=200,
    )
    result = client.order.get_order_detail("XYZ")
    assert result["response"]["order_list"][0]["order_sn"] == "XYZ"


@resp_mock.activate
def test_set_note(client):
    resp_mock.add(
        resp_mock.POST,
        "https://partner.shopeemobile.com/api/v2/order/set_note",
        json={"request_id": "r1"},
        status=200,
    )
    result = client.order.set_note("XYZ", "Handle with care")
    assert "request_id" in result
