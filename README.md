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
├── excel-remapper.js       # Core remapping functionality
├── advanced-remapper.js    # Config-based extension
├── demo-remapper.js        # Demo implementation
├── source-data.csv         # Example input data
├── template.csv            # Output template
├── updated-mapping-config.json # Mapping configuration
└── package.json            # Dependencies
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

## Getting Started

### Installation

```bash
npm install
```

### Running the Demo

```bash
node demo-remapper.js
```

### Custom Usage

```javascript
const { remapWithConfig } = require('./advanced-remapper');

// Define your file paths
const templateFile = 'your-template.csv';
const inputFile = 'your-data.csv';
const configFile = 'your-config.json';
const outputFile = 'your-output.csv';

// Run the remapping
const result = remapWithConfig(templateFile, inputFile, configFile, outputFile);
console.log(`Processed ${result.stats.totalRows} rows of data`);
```

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

## Dependencies

- [PapaParse](https://www.papaparse.com/) - For CSV parsing
- [SheetJS](https://sheetjs.com/) - For Excel file manipulation

## License

ISC