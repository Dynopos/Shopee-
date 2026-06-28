from shopee.models import Item, Order


def test_item_from_dict():
    data = {
        "item_id": 1,
        "item_name": "Test Product",
        "price": 9900.0,
        "stock": 10,
        "item_status": "NORMAL",
        "image": {"image_url_list": ["https://example.com/img.jpg"]},
        "item_sku": "SKU-001",
    }
    item = Item.from_dict(data)
    assert item.item_id == 1
    assert item.item_name == "Test Product"
    assert item.image_url == "https://example.com/img.jpg"


def test_order_from_dict():
    data = {
        "order_sn": "ABC123",
        "order_status": "READY_TO_SHIP",
        "total_amount": 19800.0,
        "buyer_user_id": 42,
        "create_time": 1700000000,
        "item_list": [{"item_id": 1}],
    }
    order = Order.from_dict(data)
    assert order.order_sn == "ABC123"
    assert order.total_amount == 19800.0
    assert len(order.items) == 1
