/**
 * Test script for the Excel/CSV Data Remapper
 * 
 * This script demonstrates how to use the remapper with the sample files.
 */
const { remapWithConfig } = require('./advanced-remapper');

// Define file paths
const TEMPLATE_FILE = 'template.csv';
const INPUT_FILE = 'source-data.csv';
const CONFIG_FILE = 'mapping-config.json';
const OUTPUT_FILE = 'remapped-output.csv';

console.log('Starting remapping test...');
console.log(`Template: ${TEMPLATE_FILE}`);
console.log(`Input data: ${INPUT_FILE}`);
console.log(`Configuration: ${CONFIG_FILE}`);
console.log(`Output: ${OUTPUT_FILE}`);

try {
  // Run the remapping with the configuration file
  const result = remapWithConfig(TEMPLATE_FILE, INPUT_FILE, CONFIG_FILE, OUTPUT_FILE);
  
  console.log('\nRemapping successful!');
  console.log(`Processed ${result.stats.totalRows} rows of data`);
  console.log(`Errors: ${result.stats.errorRows}`);
  console.log(`Warnings: ${result.stats.warnings}`);
  console.log(`\nOutput file saved to: ${OUTPUT_FILE}`);
  
  // Show the first 3 rows of processed data as a preview
  console.log('\nPreview of processed data:');
  console.log('Headers:', result.headers.join(', '));
  console.log('-'.repeat(80));
  
  for (let i = 0; i < Math.min(3, result.data.length); i++) {
    console.log(`Row ${i + 1}:`, result.data[i].join(', '));
  }
  
} catch (error) {
  console.error('\nError during remapping:', error.message);
  process.exit(1);
}