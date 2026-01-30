#!/usr/bin/env python3
"""
Test Data Generator CLI - Generate realistic test data from the command line.

Usage:
    testdata generate user --count 10 --format json
    testdata generate --schema '{"name": "name", "email": "email"}' -n 5
    testdata templates
    testdata fields
"""

import click
import json
import sys
from pathlib import Path

from .generator import TestDataGenerator
from .formatters import get_formatter


@click.group()
@click.version_option(version='1.0.0', prog_name='testdata')
def cli():
    """
    Test Data Generator - Generate realistic test data for testing.
    
    A practical SDET utility for generating various types of test data
    in multiple output formats.
    
    Examples:
    
        # Generate 10 users as JSON
        testdata generate user -n 10
        
        # Generate 5 addresses as CSV
        testdata generate address -n 5 -f csv
        
        # Generate orders with SQL output for MySQL
        testdata generate order -n 20 -f sql --table orders --dialect mysql
        
        # Custom schema with specific fields
        testdata generate --schema '{"id": "uuid", "score": {"type": "integer", "min": 0, "max": 100}}'
        
        # Reproducible data with seed
        testdata generate user -n 5 --seed 42
    """
    pass


@cli.command()
@click.argument('template', required=False)
@click.option('-n', '--count', default=1, help='Number of records to generate')
@click.option('-f', '--format', 'output_format', default='json', 
              type=click.Choice(['json', 'csv', 'sql', 'yaml']),
              help='Output format')
@click.option('-o', '--output', type=click.Path(), help='Output file (default: stdout)')
@click.option('--schema', help='Custom schema as JSON string')
@click.option('--schema-file', type=click.Path(exists=True), help='Custom schema from JSON file')
@click.option('--seed', type=int, help='Random seed for reproducible data')
@click.option('--locale', default='en_US', help='Locale for generated data (e.g., en_US, de_DE)')
@click.option('--table', default='test_data', help='Table name for SQL output')
@click.option('--dialect', default='standard', 
              type=click.Choice(['standard', 'mysql', 'postgresql']),
              help='SQL dialect')
@click.option('--compact', is_flag=True, help='Compact JSON output (no indentation)')
def generate(template, count, output_format, output, schema, schema_file, 
             seed, locale, table, dialect, compact):
    """
    Generate test data using templates or custom schemas.
    
    TEMPLATE: Built-in template name (user, address, payment, product, order, etc.)
    
    Use --schema or --schema-file for custom data shapes.
    """
    try:
        # Initialize generator
        gen = TestDataGenerator(locale=locale, seed=seed)
        
        # Determine the schema to use
        if schema_file:
            with open(schema_file) as f:
                data_schema = json.load(f)
        elif schema:
            data_schema = json.loads(schema)
        elif template:
            data_schema = gen.get_template_schema(template)
        else:
            click.echo("Error: Provide a template name or --schema/--schema-file", err=True)
            click.echo("\nAvailable templates:", err=True)
            for t in gen.list_templates():
                click.echo(f"  - {t}", err=True)
            sys.exit(1)
        
        # Generate data
        data = gen.generate_from_schema(data_schema, count=count)
        
        # Format output
        formatter_kwargs = {}
        if output_format == 'json':
            formatter_kwargs['indent'] = 0 if compact else 2
            formatter_kwargs['single_object'] = (count == 1)
        elif output_format == 'sql':
            formatter_kwargs['table_name'] = table
            formatter_kwargs['dialect'] = dialect
        
        formatter = get_formatter(output_format, **formatter_kwargs)
        result = formatter.format(data)
        
        # Output
        if output:
            Path(output).write_text(result)
            click.echo(f"Generated {count} record(s) -> {output}", err=True)
        else:
            click.echo(result)
            
    except json.JSONDecodeError as e:
        click.echo(f"Error parsing JSON schema: {e}", err=True)
        sys.exit(1)
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"Unexpected error: {e}", err=True)
        sys.exit(1)


@cli.command()
def templates():
    """List all available data templates."""
    gen = TestDataGenerator()
    
    click.echo("Available Templates:\n")
    for name in gen.list_templates():
        schema = gen.get_template_schema(name)
        fields = ', '.join(schema.keys())
        click.echo(f"  {click.style(name, fg='green', bold=True)}")
        click.echo(f"    Fields: {fields}\n")


@cli.command()
def fields():
    """List all available field types."""
    gen = TestDataGenerator()
    
    field_categories = {
        'Identity': ['uuid', 'first_name', 'last_name', 'name', 'user_name', 'password'],
        'Contact': ['email', 'company_email', 'phone'],
        'Address': ['street_address', 'city', 'state', 'zipcode', 'country', 'address'],
        'Payment': ['credit_card_number', 'credit_card_provider', 'credit_card_expire', 'credit_card_security_code'],
        'Date/Time': ['datetime', 'iso8601', 'date', 'past_date', 'future_date', 'timestamp'],
        'Text': ['word', 'sentence', 'paragraph', 'text'],
        'Numbers': ['integer', 'boolean'],
        'Identifiers': ['ean13', 'isbn13'],
        'Network': ['ipv4', 'ipv6', 'url', 'domain', 'mac_address'],
        'Company': ['company', 'job_title'],
    }
    
    click.echo("Available Field Types:\n")
    for category, types in field_categories.items():
        click.echo(f"  {click.style(category, fg='cyan', bold=True)}")
        click.echo(f"    {', '.join(types)}\n")
    
    click.echo(click.style("Special Field Specs (use in --schema):", fg='yellow', bold=True))
    click.echo("""
    integer:  {"type": "integer", "min": 0, "max": 100}
    decimal:  {"type": "decimal", "min": 0, "max": 100, "precision": 2}
    choice:   {"type": "choice", "values": ["a", "b", "c"]}
    pattern:  {"type": "pattern", "pattern": "ID-####"}
    list:     {"type": "list", "item": "email", "count": 3}
""")


@cli.command()
@click.argument('template')
def schema(template):
    """Show the schema for a specific template."""
    gen = TestDataGenerator()
    
    try:
        template_schema = gen.get_template_schema(template)
        click.echo(json.dumps(template_schema, indent=2))
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('template')
@click.option('-n', '--count', default=3, help='Number of example records')
def example(template, count):
    """Show example output for a template."""
    gen = TestDataGenerator(seed=42)  # Fixed seed for consistent examples
    
    try:
        data = gen.generate(template, count=count)
        click.echo(f"Example {template} data:\n")
        click.echo(json.dumps(data, indent=2))
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


def main():
    """Entry point for the CLI."""
    cli()


if __name__ == '__main__':
    main()
