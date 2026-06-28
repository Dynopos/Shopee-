class ShopeeError(Exception):
    """Base exception for all Shopee API errors."""

    def __init__(self, message: str, error_code: str | None = None, request_id: str | None = None):
        super().__init__(message)
        self.error_code = error_code
        self.request_id = request_id


class ShopeeAuthError(ShopeeError):
    """Raised for authentication / signature failures."""


class ShopeeAPIError(ShopeeError):
    """Raised when the API returns a non-zero error field."""


class ShopeeRateLimitError(ShopeeError):
    """Raised when the API returns HTTP 429."""
