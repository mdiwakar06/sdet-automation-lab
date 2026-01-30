"""
Output formatters for test data in various formats.
"""

import json
import csv
import io
from typing import Any
from abc import ABC, abstractmethod


class BaseFormatter(ABC):
    """Base class for all formatters."""
    
    @abstractmethod
    def format(self, data: list[dict]) -> str:
        """Format the data into a string representation."""
        pass
    
    @abstractmethod
    def extension(self) -> str:
        """Return the file extension for this format."""
        pass


class JSONFormatter(BaseFormatter):
    """Format data as JSON."""
    
    def __init__(self, indent: int = 2, single_object: bool = False):
        """
        Args:
            indent: JSON indentation level
            single_object: If True and data has 1 item, output object instead of array
        """
        self.indent = indent
        self.single_object = single_object
    
    def format(self, data: list[dict]) -> str:
        if self.single_object and len(data) == 1:
            return json.dumps(data[0], indent=self.indent, default=str)
        return json.dumps(data, indent=self.indent, default=str)
    
    def extension(self) -> str:
        return '.json'


class CSVFormatter(BaseFormatter):
    """Format data as CSV."""
    
    def __init__(self, delimiter: str = ',', include_header: bool = True):
        self.delimiter = delimiter
        self.include_header = include_header
    
    def format(self, data: list[dict]) -> str:
        if not data:
            return ''
        
        output = io.StringIO()
        fieldnames = list(data[0].keys())
        writer = csv.DictWriter(
            output, 
            fieldnames=fieldnames, 
            delimiter=self.delimiter,
            quoting=csv.QUOTE_MINIMAL
        )
        
        if self.include_header:
            writer.writeheader()
        
        for row in data:
            # Flatten any nested structures for CSV
            flat_row = {k: self._flatten_value(v) for k, v in row.items()}
            writer.writerow(flat_row)
        
        return output.getvalue().strip()
    
    def _flatten_value(self, value: Any) -> str:
        """Convert complex values to strings for CSV output."""
        if isinstance(value, (list, dict)):
            return json.dumps(value)
        return value
    
    def extension(self) -> str:
        return '.csv'


class SQLFormatter(BaseFormatter):
    """Format data as SQL INSERT statements."""
    
    def __init__(self, table_name: str = 'test_data', dialect: str = 'standard'):
        """
        Args:
            table_name: Name of the table for INSERT statements
            dialect: SQL dialect ('standard', 'mysql', 'postgresql')
        """
        self.table_name = table_name
        self.dialect = dialect
    
    def format(self, data: list[dict]) -> str:
        if not data:
            return ''
        
        statements = []
        columns = list(data[0].keys())
        column_list = ', '.join(self._quote_identifier(c) for c in columns)
        
        for row in data:
            values = [self._format_value(row.get(c)) for c in columns]
            value_list = ', '.join(values)
            stmt = f"INSERT INTO {self._quote_identifier(self.table_name)} ({column_list}) VALUES ({value_list});"
            statements.append(stmt)
        
        return '\n'.join(statements)
    
    def _quote_identifier(self, identifier: str) -> str:
        """Quote an identifier based on dialect."""
        if self.dialect == 'mysql':
            return f'`{identifier}`'
        elif self.dialect == 'postgresql':
            return f'"{identifier}"'
        return identifier
    
    def _format_value(self, value: Any) -> str:
        """Format a value for SQL insertion."""
        if value is None:
            return 'NULL'
        if isinstance(value, bool):
            return 'TRUE' if value else 'FALSE'
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, (list, dict)):
            # JSON for complex types
            return f"'{json.dumps(value)}'"
        # String - escape single quotes
        escaped = str(value).replace("'", "''")
        return f"'{escaped}'"
    
    def extension(self) -> str:
        return '.sql'


class YAMLFormatter(BaseFormatter):
    """Format data as YAML."""
    
    def format(self, data: list[dict]) -> str:
        try:
            import yaml
            return yaml.dump(data, default_flow_style=False, allow_unicode=True, sort_keys=False)
        except ImportError:
            raise ImportError("PyYAML is required for YAML output. Install with: pip install pyyaml")
    
    def extension(self) -> str:
        return '.yaml'


def get_formatter(format_name: str, **kwargs) -> BaseFormatter:
    """
    Factory function to get a formatter by name.
    
    Args:
        format_name: One of 'json', 'csv', 'sql', 'yaml'
        **kwargs: Additional arguments passed to the formatter
        
    Returns:
        Appropriate formatter instance
    """
    formatters = {
        'json': JSONFormatter,
        'csv': CSVFormatter,
        'sql': SQLFormatter,
        'yaml': YAMLFormatter,
    }
    
    if format_name not in formatters:
        available = ', '.join(formatters.keys())
        raise ValueError(f"Unknown format: {format_name}. Available: {available}")
    
    return formatters[format_name](**kwargs)
