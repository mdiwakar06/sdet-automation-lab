"""
Core test data generator with built-in templates and custom field support.
"""

from faker import Faker
from typing import Any, Callable
from datetime import datetime, timedelta
import random
import uuid


class TestDataGenerator:
    """
    Generate realistic test data using predefined templates or custom schemas.
    
    Example:
        gen = TestDataGenerator(locale='en_US', seed=42)
        users = gen.generate('user', count=5)
        
        # Or with custom schema
        custom_data = gen.generate_from_schema({
            'id': 'uuid',
            'email': 'email',
            'score': {'type': 'integer', 'min': 0, 'max': 100}
        }, count=10)
    """
    
    # Built-in templates for common test data scenarios
    TEMPLATES = {
        'user': {
            'id': 'uuid',
            'first_name': 'first_name',
            'last_name': 'last_name',
            'email': 'email',
            'phone': 'phone',
            'created_at': 'datetime',
        },
        'address': {
            'street': 'street_address',
            'city': 'city',
            'state': 'state',
            'zip_code': 'zipcode',
            'country': 'country',
        },
        'payment': {
            'card_number': 'credit_card_number',
            'card_type': 'credit_card_provider',
            'expiry': 'credit_card_expire',
            'cvv': 'credit_card_security_code',
        },
        'product': {
            'id': 'uuid',
            'name': 'word',
            'description': 'sentence',
            'price': {'type': 'decimal', 'min': 1, 'max': 1000, 'precision': 2},
            'sku': 'ean13',
            'in_stock': 'boolean',
        },
        'order': {
            'order_id': 'uuid',
            'customer_email': 'email',
            'total': {'type': 'decimal', 'min': 10, 'max': 5000, 'precision': 2},
            'status': {'type': 'choice', 'values': ['pending', 'processing', 'shipped', 'delivered', 'cancelled']},
            'created_at': 'datetime',
        },
        'api_response': {
            'request_id': 'uuid',
            'timestamp': 'iso8601',
            'status_code': {'type': 'choice', 'values': [200, 201, 400, 404, 500]},
            'latency_ms': {'type': 'integer', 'min': 10, 'max': 2000},
        },
        'login': {
            'username': 'user_name',
            'password': 'password',
            'email': 'email',
        },
        'employee': {
            'employee_id': {'type': 'pattern', 'pattern': 'EMP-####'},
            'first_name': 'first_name',
            'last_name': 'last_name',
            'email': 'company_email',
            'department': {'type': 'choice', 'values': ['Engineering', 'QA', 'Product', 'Design', 'HR', 'Finance']},
            'hire_date': 'past_date',
            'salary': {'type': 'decimal', 'min': 50000, 'max': 200000, 'precision': 2},
        },
    }
    
    def __init__(self, locale: str = 'en_US', seed: int | None = None):
        """
        Initialize the generator.
        
        Args:
            locale: Faker locale for localized data (e.g., 'en_US', 'en_GB', 'de_DE')
            seed: Random seed for reproducible data generation
        """
        self.fake = Faker(locale)
        if seed is not None:
            Faker.seed(seed)
            random.seed(seed)
        
        # Map field types to generator functions
        self._type_map: dict[str, Callable] = {
            # Identity
            'uuid': lambda: str(uuid.uuid4()),
            'first_name': self.fake.first_name,
            'last_name': self.fake.last_name,
            'name': self.fake.name,
            'user_name': self.fake.user_name,
            'password': lambda: self.fake.password(length=12, special_chars=True),
            
            # Contact
            'email': self.fake.email,
            'company_email': self.fake.company_email,
            'phone': self.fake.phone_number,
            
            # Address
            'street_address': self.fake.street_address,
            'city': self.fake.city,
            'state': self.fake.state,
            'zipcode': self.fake.zipcode,
            'country': self.fake.country,
            'address': self.fake.address,
            
            # Payment
            'credit_card_number': self.fake.credit_card_number,
            'credit_card_provider': self.fake.credit_card_provider,
            'credit_card_expire': self.fake.credit_card_expire,
            'credit_card_security_code': self.fake.credit_card_security_code,
            
            # Date/Time
            'datetime': lambda: self.fake.date_time_this_year().isoformat(),
            'iso8601': lambda: datetime.utcnow().isoformat() + 'Z',
            'date': lambda: self.fake.date_this_year().isoformat(),
            'past_date': lambda: self.fake.past_date().isoformat(),
            'future_date': lambda: self.fake.future_date().isoformat(),
            'timestamp': lambda: int(datetime.utcnow().timestamp()),
            
            # Text
            'word': self.fake.word,
            'sentence': self.fake.sentence,
            'paragraph': self.fake.paragraph,
            'text': lambda: self.fake.text(max_nb_chars=200),
            
            # Numbers
            'integer': lambda: random.randint(1, 1000),
            'boolean': self.fake.boolean,
            
            # Identifiers
            'ean13': self.fake.ean13,
            'isbn13': self.fake.isbn13,
            
            # Network
            'ipv4': self.fake.ipv4,
            'ipv6': self.fake.ipv6,
            'url': self.fake.url,
            'domain': self.fake.domain_name,
            'mac_address': self.fake.mac_address,
            
            # Company
            'company': self.fake.company,
            'job_title': self.fake.job,
        }
    
    def _generate_field(self, field_spec: str | dict) -> Any:
        """Generate a single field value based on its specification."""
        if isinstance(field_spec, str):
            if field_spec in self._type_map:
                return self._type_map[field_spec]()
            raise ValueError(f"Unknown field type: {field_spec}")
        
        if isinstance(field_spec, dict):
            field_type = field_spec.get('type')
            
            if field_type == 'integer':
                min_val = field_spec.get('min', 0)
                max_val = field_spec.get('max', 100)
                return random.randint(min_val, max_val)
            
            elif field_type == 'decimal':
                min_val = field_spec.get('min', 0)
                max_val = field_spec.get('max', 100)
                precision = field_spec.get('precision', 2)
                value = random.uniform(min_val, max_val)
                return round(value, precision)
            
            elif field_type == 'choice':
                values = field_spec.get('values', [])
                return random.choice(values) if values else None
            
            elif field_type == 'pattern':
                pattern = field_spec.get('pattern', '')
                return self.fake.bothify(pattern)
            
            elif field_type == 'list':
                item_spec = field_spec.get('item')
                count = field_spec.get('count', 3)
                return [self._generate_field(item_spec) for _ in range(count)]
            
            else:
                raise ValueError(f"Unknown field type: {field_type}")
        
        raise ValueError(f"Invalid field specification: {field_spec}")
    
    def generate_from_schema(self, schema: dict, count: int = 1) -> list[dict]:
        """
        Generate data from a custom schema.
        
        Args:
            schema: Dictionary mapping field names to field types/specs
            count: Number of records to generate
            
        Returns:
            List of generated records
        """
        records = []
        for _ in range(count):
            record = {}
            for field_name, field_spec in schema.items():
                record[field_name] = self._generate_field(field_spec)
            records.append(record)
        return records
    
    def generate(self, template_name: str, count: int = 1) -> list[dict]:
        """
        Generate data using a built-in template.
        
        Args:
            template_name: Name of the template ('user', 'address', 'payment', etc.)
            count: Number of records to generate
            
        Returns:
            List of generated records
        """
        if template_name not in self.TEMPLATES:
            available = ', '.join(self.TEMPLATES.keys())
            raise ValueError(f"Unknown template: {template_name}. Available: {available}")
        
        return self.generate_from_schema(self.TEMPLATES[template_name], count)
    
    def list_templates(self) -> list[str]:
        """Return list of available template names."""
        return list(self.TEMPLATES.keys())
    
    def list_field_types(self) -> list[str]:
        """Return list of available field types."""
        return list(self._type_map.keys())
    
    def get_template_schema(self, template_name: str) -> dict:
        """Return the schema for a specific template."""
        if template_name not in self.TEMPLATES:
            raise ValueError(f"Unknown template: {template_name}")
        return self.TEMPLATES[template_name].copy()
