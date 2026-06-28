from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Item:
    item_id: int
    item_name: str
    price: float
    stock: int
    status: str
    image_url: str = ""
    item_sku: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Item":
        return cls(
            item_id=data["item_id"],
            item_name=data["item_name"],
            price=data.get("price", 0.0),
            stock=data.get("stock", 0),
            status=data.get("item_status", ""),
            image_url=data.get("image", {}).get("image_url_list", [""])[0],
            item_sku=data.get("item_sku", ""),
        )


@dataclass
class Order:
    order_sn: str
    order_status: str
    total_amount: float
    buyer_user_id: int = 0
    create_time: int = 0
    items: list[dict[str, Any]] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Order":
        return cls(
            order_sn=data["order_sn"],
            order_status=data.get("order_status", ""),
            total_amount=data.get("total_amount", 0.0),
            buyer_user_id=data.get("buyer_user_id", 0),
            create_time=data.get("create_time", 0),
            items=data.get("item_list", []),
        )
