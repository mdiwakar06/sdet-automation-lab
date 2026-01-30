"""
Test Data Generator - A practical SDET utility for generating realistic test data.

Usage:
    from testdata_generator import TestDataGenerator
    
    gen = TestDataGenerator()
    users = gen.generate('user', count=10)
"""

from .generator import TestDataGenerator
from .formatters import JSONFormatter, CSVFormatter, SQLFormatter

__version__ = "1.0.0"
__all__ = ["TestDataGenerator", "JSONFormatter", "CSVFormatter", "SQLFormatter"]
