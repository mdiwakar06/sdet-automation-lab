# Test Data Generator

A command-line tool and Python library for generating realistic test data. Perfect for:
- Populating test databases
- Creating API test payloads
- Generating mock user data
- Load testing with realistic data

## Quick Start

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install
pip install -e .

# Generate 10 users as JSON
testdata generate user -n 10
```

## CLI Usage

```bash
# List available templates
testdata templates

# Generate data using built-in templates
testdata generate user -n 10                         # 10 users as JSON
testdata generate address -n 5 -f csv                # 5 addresses as CSV
testdata generate order -n 20 -f sql --table orders  # SQL INSERT statements

# Custom schema
testdata generate --schema '{"id": "uuid", "email": "email", "score": {"type": "integer", "min": 0, "max": 100}}'

# Output to file
testdata generate user -n 100 -o test_users.json

# Reproducible data with seed
testdata generate user -n 5 --seed 42

# Different locales
testdata generate user -n 5 --locale de_DE
```

## Built-in Templates

| Template | Fields |
|----------|--------|
| `user` | id, first_name, last_name, email, phone, created_at |
| `address` | street, city, state, zip_code, country |
| `payment` | card_number, card_type, expiry, cvv |
| `product` | id, name, description, price, sku, in_stock |
| `order` | order_id, customer_email, total, status, created_at |
| `login` | username, password, email |
| `employee` | employee_id, first_name, last_name, email, department, hire_date, salary |
| `api_response` | request_id, timestamp, status_code, latency_ms |

## Output Formats

- **JSON** (default): Pretty-printed JSON array
- **CSV**: Standard CSV with headers
- **SQL**: INSERT statements (supports MySQL, PostgreSQL dialects)
- **YAML**: YAML format

## Python Library Usage

```python
from testdata_generator import TestDataGenerator

# Initialize with optional seed for reproducibility
gen = TestDataGenerator(locale='en_US', seed=42)

# Generate using built-in templates
users = gen.generate('user', count=10)
addresses = gen.generate('address', count=5)

# Custom schema
custom_data = gen.generate_from_schema({
    'transaction_id': 'uuid',
    'amount': {'type': 'decimal', 'min': 10, 'max': 1000, 'precision': 2},
    'currency': {'type': 'choice', 'values': ['USD', 'EUR', 'GBP']},
    'status': {'type': 'choice', 'values': ['pending', 'completed', 'failed']},
    'timestamp': 'iso8601',
}, count=100)

# Use formatters for output
from testdata_generator import JSONFormatter, CSVFormatter, SQLFormatter

formatter = CSVFormatter()
csv_output = formatter.format(users)

sql_formatter = SQLFormatter(table_name='users', dialect='postgresql')
sql_output = sql_formatter.format(users)
```

## Custom Field Types

| Type | Spec Example | Description |
|------|-------------|-------------|
| `integer` | `{"type": "integer", "min": 0, "max": 100}` | Random integer in range |
| `decimal` | `{"type": "decimal", "min": 0, "max": 100, "precision": 2}` | Random decimal |
| `choice` | `{"type": "choice", "values": ["a", "b", "c"]}` | Random selection |
| `pattern` | `{"type": "pattern", "pattern": "ID-####"}` | Pattern-based (# = digit) |
| `list` | `{"type": "list", "item": "email", "count": 3}` | List of items |

## Available Field Types

**Identity**: uuid, first_name, last_name, name, user_name, password

**Contact**: email, company_email, phone

**Address**: street_address, city, state, zipcode, country, address

**Payment**: credit_card_number, credit_card_provider, credit_card_expire, credit_card_security_code

**Date/Time**: datetime, iso8601, date, past_date, future_date, timestamp

**Text**: word, sentence, paragraph, text

**Network**: ipv4, ipv6, url, domain, mac_address

**Company**: company, job_title
