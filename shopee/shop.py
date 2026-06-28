from __future__ import annotations

from typing import Any

from .base import BaseAPI

_SHOP_INFO = "/api/v2/shop/get_shop_info"
_PROFILE = "/api/v2/shop/get_profile"
_UPDATE_PROFILE = "/api/v2/shop/update_profile"


class ShopAPI(BaseAPI):
    def get_shop_info(self) -> dict[str, Any]:
        return self._get(_SHOP_INFO)

    def get_profile(self) -> dict[str, Any]:
        return self._get(_PROFILE)

    def update_profile(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._post(_UPDATE_PROFILE, payload)
