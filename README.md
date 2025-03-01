# Excel/CSV Data Remapper

A flexible and powerful tool for mapping data from one format to another using configurable transformation rules.

## Overview

This project provides a framework for converting data between different formats (Excel/CSV) using template-based mapping. It's designed to be flexible, allowing for complex transformations through custom mapping functions defined in a configuration file.

## Key Features

- 📊 Support for both CSV and Excel files
- 🔄 Template-based transformation
- 🛠️ Configurable mapping functions
- 📝 Custom field processing with helper functions
- 📈 Detailed statistics and error handling

## Project Structure

```
├── src/                      # Source code
│   ├── excel-remapper.js     # Core functionality
│   ├── advanced-remapper.js  # Config-based extension
│
├── examples/                 # Example implementations
│   ├── demo-remapper.js      # Simple demo script
│   ├── test-remapper.js      # Test implementation
│
├── config/                   # Configuration files
│   ├── mapping-config.json   # Example mapping configuration
│
├── data/                     # Data files
│   ├── input/                # Input data
│   │   ├── source-data.csv   # Example input data
│   ├── templates/            # Template files
│   │   ├── template.csv      # Output template
│   ├── output/               # Generated output
│       ├── output.csv        # Sample output
│       ├── remapped-output.csv # Generated output from examples
│
├── data-remapper.js          # Main entry point script
├── package.json              # Project metadata and dependencies
└── README.md                 # Project documentation
```

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/excel-mapper.git
cd excel-mapper

# Install dependencies
npm install
```

## Quick Start

The easiest way to use the remapper is through the main entry point script:

```bash
# Basic usage
node data-remapper.js <template-file> <input-file> <config-file> [output-file]

# Example with the included sample files
node data-remapper.js template.csv source-data.csv mapping-config.json my-output.csv
```

You can also use the npm scripts:

```bash
# Run the main remapper
npm run remap template.csv source-data.csv mapping-config.json my-output.csv

# Run the demo script
npm run demo

# Run the test script
npm run test
```

## How It Works

1. **Template Definition**: Create a template file that defines the structure of your desired output
2. **Data Source**: Prepare your source data in CSV or Excel format
3. **Mapping Configuration**: Define how fields from the source map to the template
4. **Processing**: Run the remapper to transform the data according to your configuration
5. **Output**: Get your transformed data in CSV or Excel format

## Configuration Format

The mapping configuration is a JSON file with the following structure:

```json
{
  "csvOptions": {
    "delimiter": ";",
    "quoteChar": "\"",
    "header": true,
    "skipEmptyLines": true
  },
  "fieldMappings": {
    "TargetField1": "row => row['source_field']",
    "TargetField2": "row => `${row['first_name']} ${row['last_name']}`"
  },
  "helperFunctions": {
    "formatDate": "function(date) { return date ? new Date(date).toISOString().split('T')[0] : ''; }"
  }
}
```

## Organizing Your Files

The remapper automatically looks for files in specific folders:

- **Templates**: Place your template files in `data/templates/`
- **Input Data**: Place your input data files in `data/input/`
- **Configurations**: Place your mapping configurations in `config/`
- **Output**: Generated output will be saved to `data/output/`

## Example Transformation

### Source Data (CSV)

```
id;first_name;last_name;email;notes;active;orders;signup_date
"001";"John";"Doe";"john.doe@example.com";"Regular customer";1;12;2023-01-15
```

### Mapping Configuration

```json
{
  "fieldMappings": {
    "CustomerID": "row => row['id']",
    "FullName": "row => `${row['first_name']} ${row['last_name']}`",
    "Status": "row => row['active'] === '1' ? 'Active' : 'Inactive'"
  }
}
```

### Transformed Output

```
CustomerID;FullName;Status
001;John Doe;Active
```

## Advanced Usage

- **Custom Transformations**: Write complex mapping functions for fields that need special processing
- **Data Validation**: Add validation within mapping functions to ensure data quality
- **Multi-File Processing**: Process multiple files in batch using the API

## Running from Command Line

You can run the remapper directly from the command line:

```bash
# Make the script executable (Unix-based systems)
chmod +x data-remapper.js

# Run the remapper
./data-remapper.js template.csv source-data.csv mapping-config.json output.csv
```

## Dependencies

- [PapaParse](https://www.papaparse.com/) - For CSV parsing
- [SheetJS](https://sheetjs.com/) - For Excel file manipulation

## License

ISC