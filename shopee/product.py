from __future__ import annotations

from typing import Any

from .base import BaseAPI

_ITEM_LIST = "/api/v2/product/get_item_list"
_ITEM_BASE_INFO = "/api/v2/product/get_item_base_info"
_ADD_ITEM = "/api/v2/product/add_item"
_UPDATE_ITEM = "/api/v2/product/update_item"
_DELETE_ITEM = "/api/v2/product/delete_item"


class ProductAPI(BaseAPI):
    def get_item_list(self, offset: int = 0, page_size: int = 50, status: str = "NORMAL") -> dict[str, Any]:
        return self._get(_ITEM_LIST, {"offset": offset, "page_size": page_size, "item_status": status})

    def get_item_base_info(self, item_id_list: list[int]) -> dict[str, Any]:
        return self._get(_ITEM_BASE_INFO, {"item_id_list": ",".join(str(i) for i in item_id_list)})

    def add_item(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._post(_ADD_ITEM, payload)

    def update_item(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._post(_UPDATE_ITEM, payload)

    def delete_item(self, item_id: int) -> dict[str, Any]:
        return self._post(_DELETE_ITEM, {"item_id": item_id})
