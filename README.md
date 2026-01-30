# SDET Automation Lab

A hands-on repository documenting practical SDET automation experiments, patterns, and lessons learned through real-world practice.

## Projects

| Project | Language | Description |
|---------|----------|-------------|
| [testdata-generator-python](./testdata-generator-python) | Python | CLI tool for generating realistic test data (users, addresses, payments, etc.) in JSON, CSV, SQL formats |

## Repository Structure

```
sdet-automation-lab/
├── testdata-generator-python/   # Test data generation tool
│   ├── testdata_generator/      # Python package
│   ├── setup.py
│   └── README.md
└── README.md                    # This file
```

## Roadmap

Future tools and experiments planned:

- [ ] API Health Checker - Pre-test environment validator
- [ ] Flaky Test Analyzer - Identify inconsistent tests from JUnit/pytest reports
- [ ] Test Environment Manager - Docker-based test environment orchestration
- [ ] API Contract Validator - Schema validation for REST APIs

## Contributing

This is a learning repository. Feel free to:
- Open issues for bugs or suggestions
- Submit PRs with improvements
- Share your own SDET patterns and experiments

## License

MIT License - feel free to use and modify for your own testing needs.
