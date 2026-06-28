from __future__ import annotations

import os
from typing import Any

import requests
from dotenv import load_dotenv

from .auth import sign, timestamp
from .exceptions import ShopeeAPIError, ShopeeAuthError, ShopeeRateLimitError

load_dotenv()

_DEFAULTS = {
    "base_url": os.getenv("SHOPEE_API_BASE_URL", "https://partner.shopeemobile.com"),
    "partner_id": int(os.getenv("SHOPEE_PARTNER_ID", "0")),
    "partner_key": os.getenv("SHOPEE_PARTNER_KEY", ""),
    "shop_id": int(os.getenv("SHOPEE_SHOP_ID", "0")),
    "access_token": os.getenv("SHOPEE_ACCESS_TOKEN", ""),
}


class BaseAPI:
    def __init__(self, client: "ShopeeClient") -> None:
        self._client = client

    def _get(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        return self._client._request("GET", path, params=params)

    def _post(self, path: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
        return self._client._request("POST", path, body=body)


class ShopeeClient:
    def __init__(
        self,
        partner_id: int | None = None,
        partner_key: str | None = None,
        shop_id: int | None = None,
        access_token: str | None = None,
        base_url: str | None = None,
    ) -> None:
        self.partner_id = partner_id or _DEFAULTS["partner_id"]
        self.partner_key = partner_key or _DEFAULTS["partner_key"]
        self.shop_id = shop_id or _DEFAULTS["shop_id"]
        self.access_token = access_token or _DEFAULTS["access_token"]
        self.base_url = base_url or _DEFAULTS["base_url"]
        self._session = requests.Session()
        self._session.headers.update({"Content-Type": "application/json"})

        from .product import ProductAPI
        from .order import OrderAPI
        from .shop import ShopAPI
        from .logistics import LogisticsAPI

        self.product = ProductAPI(self)
        self.order = OrderAPI(self)
        self.shop = ShopAPI(self)
        self.logistics = LogisticsAPI(self)

    def _request(self, method: str, path: str, params: dict[str, Any] | None = None, body: dict[str, Any] | None = None) -> dict[str, Any]:
        ts = timestamp()
        sig = sign(self.partner_id, path, ts, self.partner_key, self.access_token, self.shop_id)

        base_params: dict[str, Any] = {
            "partner_id": self.partner_id,
            "timestamp": ts,
            "access_token": self.access_token,
            "shop_id": self.shop_id,
            "sign": sig,
        }
        if params:
            base_params.update(params)

        url = self.base_url + path
        response = self._session.request(method, url, params=base_params, json=body, timeout=30)

        if response.status_code == 429:
            raise ShopeeRateLimitError("Rate limit exceeded")
        if response.status_code == 403:
            raise ShopeeAuthError("Authentication failed", request_id=response.headers.get("request-id"))

        data: dict[str, Any] = response.json()
        error = data.get("error", "")
        if error:
            raise ShopeeAPIError(data.get("message", error), error_code=error, request_id=data.get("request_id"))

        return data
