/**
 * Simple Demo script for the Excel/CSV Data Remapper
 * 
 * This script demonstrates how to use the remapper with a limited set of records.
 * Assumes you're running it from the project directory.
 */
const { remapWithConfig } = require('./src/advanced-remapper');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Use current working directory as the project root
const PROJECT_ROOT = process.cwd();

// Define file paths
const TEMPLATE_FILE = path.join(PROJECT_ROOT, 'data', 'templates', 'template.csv');
const INPUT_FILE = path.join(PROJECT_ROOT, 'data', 'input', 'source-data.csv');
const CONFIG_FILE = path.join(PROJECT_ROOT, 'config', 'mapping-config.json');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'data', 'output', 'remapped-output.csv');

console.log('Starting remapping demo...');
console.log(`Project root: ${PROJECT_ROOT}`);
console.log(`Template: ${TEMPLATE_FILE}`);
console.log(`Input data: ${INPUT_FILE}`);
console.log(`Configuration: ${CONFIG_FILE}`);
console.log(`Output: ${OUTPUT_FILE}`);

// Function to read and limit input data
function readLimitedInputData(filePath, limit = 10) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }
  
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
  // Check if the directories exist and create them if needed
  const dirs = [
    path.join(PROJECT_ROOT, 'data', 'templates'),
    path.join(PROJECT_ROOT, 'data', 'input'),
    path.join(PROJECT_ROOT, 'data', 'output'),
    path.join(PROJECT_ROOT, 'config'),
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
  
  // Check for the existence of required files
  const requiredFiles = [
    { path: TEMPLATE_FILE, desc: 'Template file' },
    { path: INPUT_FILE, desc: 'Input data file' },
    { path: CONFIG_FILE, desc: 'Configuration file' }
  ];
  
  // Verify all required files exist
  for (const file of requiredFiles) {
    if (!fs.existsSync(file.path)) {
      console.error(`${file.desc} not found: ${file.path}`);
      console.error('\nPlease make sure all your files are in the correct directories:');
      console.error('- template.csv should be in the data/templates/ directory');
      console.error('- source-data.csv should be in the data/input/ directory');
      console.error('- mapping-config.json should be in the config/ directory');
      process.exit(1);
    }
  }
  
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
  
  console.log('\nDemo completed successfully!');
  
} catch (error) {
  console.error('\nError during remapping demo:', error.message);
  process.exit(1);
}