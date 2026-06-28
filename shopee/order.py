from __future__ import annotations

from typing import Any

from .base import BaseAPI

_ORDER_LIST = "/api/v2/order/get_order_list"
_ORDER_DETAIL = "/api/v2/order/get_order_detail"
_HANDLE_BUYER_CANCEL = "/api/v2/order/handle_buyer_cancellation"
_SET_NOTE = "/api/v2/order/set_note"


class OrderAPI(BaseAPI):
    def get_order_list(self, time_from: int, time_to: int, order_status: str = "READY_TO_SHIP", page_size: int = 20, cursor: str = "") -> dict[str, Any]:
        params: dict[str, Any] = {
            "time_range_field": "create_time",
            "time_from": time_from,
            "time_to": time_to,
            "page_size": page_size,
            "order_status": order_status,
        }
        if cursor:
            params["cursor"] = cursor
        return self._get(_ORDER_LIST, params)

    def get_order_detail(self, order_sn: str, response_optional_fields: str = "buyer_user_id,item_list") -> dict[str, Any]:
        return self._get(_ORDER_DETAIL, {"order_sn_list": order_sn, "response_optional_fields": response_optional_fields})

    def handle_buyer_cancellation(self, order_sn: str, operation: str) -> dict[str, Any]:
        return self._post(_HANDLE_BUYER_CANCEL, {"order_sn": order_sn, "operation": operation})

    def set_note(self, order_sn: str, note: str) -> dict[str, Any]:
        return self._post(_SET_NOTE, {"order_sn": order_sn, "note": note})
