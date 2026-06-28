from __future__ import annotations

from typing import Any

from .base import BaseAPI

_CHANNEL_LIST = "/api/v2/logistics/get_channel_list"
_SHIP_ORDER = "/api/v2/logistics/ship_order"
_TRACKING_INFO = "/api/v2/logistics/get_tracking_info"


class LogisticsAPI(BaseAPI):
    def get_channel_list(self) -> dict[str, Any]:
        return self._get(_CHANNEL_LIST)

    def ship_order(self, order_sn: str, pickup: dict[str, Any] | None = None, dropoff: dict[str, Any] | None = None) -> dict[str, Any]:
        body: dict[str, Any] = {"order_sn": order_sn}
        if pickup:
            body["pickup"] = pickup
        if dropoff:
            body["dropoff"] = dropoff
        return self._post(_SHIP_ORDER, body)

    def get_tracking_info(self, order_sn: str, package_number: str = "") -> dict[str, Any]:
        params: dict[str, Any] = {"order_sn": order_sn}
        if package_number:
            params["package_number"] = package_number
        return self._get(_TRACKING_INFO, params)
