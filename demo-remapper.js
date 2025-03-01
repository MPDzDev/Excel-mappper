/**
 * Simple Demo script for the Excel/CSV Data Remapper
 * 
 * This script demonstrates how to use the remapper with a limited set of records.
 */
const { remapWithConfig } = require('./advanced-remapper');
const fs = require('fs');
const Papa = require('papaparse');

// Define file paths
const TEMPLATE_FILE = 'template.csv';
const INPUT_FILE = 'source-data.csv';
const CONFIG_FILE = 'mapping-config.json';
const OUTPUT_FILE = 'remapped-output.csv';

console.log('Starting remapping demo...');
console.log(`Template: ${TEMPLATE_FILE}`);
console.log(`Input data: ${INPUT_FILE} (limited to 10 records)`);
console.log(`Configuration: ${CONFIG_FILE}`);
console.log(`Output: ${OUTPUT_FILE}`);

// Function to read and limit input data
function readLimitedInputData(filePath, limit = 10) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const parseResult = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';'
  });
  
  // Return only the first 'limit' rows
  return parseResult.data.slice(0, limit);
}

try {
  // Read limited input data
  const sourceData = readLimitedInputData(INPUT_FILE, 10);
  console.log(`\nReading first ${sourceData.length} records from source data...`);
  
  // Run the remapping with the limited data
  const result = remapWithConfig(TEMPLATE_FILE, INPUT_FILE, CONFIG_FILE, OUTPUT_FILE);
  
  console.log('\nRemapping successful!');
  console.log(`Processed ${result.stats.totalRows} rows of data`);
  console.log(`Errors: ${result.stats.errorRows}`);
  console.log(`Warnings: ${result.stats.warnings}`);
  console.log(`\nOutput file saved to: ${OUTPUT_FILE}`);
  
  // Show the mapping being used
  console.log('\n===== Field Mappings =====');
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  Object.entries(config.fieldMappings).forEach(([targetField, mapping]) => {
    console.log(`${targetField} ← ${mapping}`);
  });
  
  // Helper function to trim long values for display
  function trimValue(value, maxLength = 15) {
    value = String(value || '');
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength - 3) + '...';
  }

  // Display source data for the first 3 records with column separators
  console.log('\n===== Source Data (First 3 Records) =====');
  if (sourceData.length > 0) {
    const sourceHeaders = Object.keys(sourceData[0]);
    
    // Print headers with separators
    let headerRow = '';
    sourceHeaders.forEach(header => {
      headerRow += trimValue(header).padEnd(15) + ' | ';
    });
    console.log(headerRow);
    console.log('-'.repeat(headerRow.length));
    
    // Print first 3 rows of source data with separators
    for (let i = 0; i < Math.min(3, sourceData.length); i++) {
      let formattedRow = '';
      sourceHeaders.forEach(header => {
        formattedRow += trimValue(sourceData[i][header]).padEnd(15) + ' | ';
      });
      console.log(formattedRow);
    }
  }
  
  // Display transformed data with column separators
  console.log('\n===== Transformed Data (First 3 Records) =====');
  
  // Print headers with separators
  let headerRow = '';
  result.headers.forEach(header => {
    headerRow += trimValue(header).padEnd(15) + ' | ';
  });
  console.log(headerRow);
  console.log('-'.repeat(headerRow.length));
  
  // Print first 3 rows of transformed data with separators
  for (let i = 0; i < Math.min(3, result.data.length); i++) {
    let formattedRow = '';
    result.data[i].forEach(cell => {
      formattedRow += trimValue(cell).padEnd(15) + ' | ';
    });
    console.log(formattedRow);
  }
  
  console.log('\nDemo completed successfully!');
  
} catch (error) {
  console.error('\nError during remapping demo:', error.message);
  process.exit(1);
}