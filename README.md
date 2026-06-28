# Shopee Integration

A Python toolkit for integrating with the Shopee Open Platform API.

## Features

- Authenticate with Shopee Open API (HMAC-SHA256 signature)
- Manage products (list, create, update)
- Handle orders (fetch, update status)
- Shop and logistics utilities

## Requirements

- Python 3.9+
- `requests`
- `python-dotenv`

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # fill in your credentials
```

## Configuration

| Variable | Description |
|---|---|
| `SHOPEE_PARTNER_ID` | Partner ID from Shopee Open Platform |
| `SHOPEE_PARTNER_KEY` | Partner key (secret) |
| `SHOPEE_SHOP_ID` | Target shop ID |
| `SHOPEE_ACCESS_TOKEN` | OAuth access token |

## Usage

```python
from shopee import ShopeeClient

client = ShopeeClient()

# List products
products = client.product.get_item_list(status="NORMAL")

# Get order details
order = client.order.get_order_detail(order_sn="XXXXXXXXXXXXXXXX")
```

## Project Structure

```
shopee/
  __init__.py       # ShopeeClient entry point
  auth.py           # Signature & authentication helpers
  base.py           # Base API class (request, retry, error handling)
  product.py        # Product API
  order.py          # Order API
  shop.py           # Shop API
  logistics.py      # Logistics API
  models.py         # Dataclass models
  exceptions.py     # Custom exceptions
tests/
  test_auth.py
  test_product.py
  test_order.py
```

## License

MIT
