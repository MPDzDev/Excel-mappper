/**
 * Demo script for ID validation in the Enhanced Excel/CSV Data Remapper
 * 
 * This script creates a test file with duplicate IDs to demonstrate validation.
 */
const fs = require('fs');
const Papa = require('papaparse');
const { remapWithConfig, validateUniqueIds } = require('./enhanced-remapper');

// Define file paths
const TEMPLATE_FILE = 'template.csv';
const DUPLICATE_DATA_FILE = 'duplicate-data.csv';
const CONFIG_FILE = 'updated-mapping-config.json';
const OUTPUT_FILE = 'duplicate-output.csv';

console.log('Starting ID validation demo...');

// Create a test file with duplicate IDs
function createTestFileWithDuplicates() {
  console.log(`Creating test file with duplicate IDs: ${DUPLICATE_DATA_FILE}`);
  
  // Sample data with duplicate IDs
  const sampleData = [
    {
      id: "001",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      notes: "Regular customer, no special notes",
      active: "1",
      orders: "12",
      signup_date: "2023-01-15"
    },
    {
      id: "002",
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@example.com",
      notes: "Prefers contact via email, not phone",
      active: "1",
      orders: "8",
      signup_date: "2023-02-28"
    },
    {
      id: "003", 
      first_name: "Robert",
      last_name: "Johnson",
      email: "robert.j@example.com",
      notes: "Important client; requires approval for orders > $500",
      active: "0",
      orders: "3",
      signup_date: "2023-03-10"
    },
    {
      id: "001", // Duplicate ID
      first_name: "John",
      last_name: "Duplicate",
      email: "john.duplicate@example.com",
      notes: "This is a duplicate ID",
      active: "1",
      orders: "5",
      signup_date: "2023-01-20"
    },
    {
      id: "002", // Duplicate ID
      first_name: "Jane",
      last_name: "Duplicate",
      email: "jane.duplicate@example.com",
      notes: "This is another duplicate ID",
      active: "0",
      orders: "2",
      signup_date: "2023-02-15"
    }
  ];
  
  // Convert to CSV
  const csv = Papa.unparse(sampleData, {
    delimiter: ";",
    header: true
  });
  
  // Write to file
  fs.writeFileSync(DUPLICATE_DATA_FILE, csv);
  
  console.log(`Created test file with ${sampleData.length} rows (including duplicates)`);
  return sampleData;
}

// Run the validation demo
function runValidationDemo() {
  // Create test data
  const testData = createTestFileWithDuplicates();
  
  // First, demonstrate direct validation
  console.log('\n===== Direct Validation Demo =====');
  const validationResult = validateUniqueIds(testData, ['id']);
  
  if (!validationResult.isValid) {
    console.log(`Found ${validationResult.validationMessages.length} validation issues:`);
    validationResult.validationMessages.forEach(msg => console.log(`- ${msg}`));
  } else {
    console.log('No duplicate IDs found (this should not happen with our test data)');
  }
  
  // Now, run the full remapping with ID validation
  console.log('\n===== Full Remapping with ID Validation =====');
  try {
    const result = remapWithConfig(TEMPLATE_FILE, DUPLICATE_DATA_FILE, CONFIG_FILE, OUTPUT_FILE);
    
    console.log(`Remapping completed. Processed ${result.stats.totalRows} rows.`);
    
    // Display validation results
    if (!result.validation.isValid) {
      console.log('\nID Validation Results:');
      console.log(`Found ${result.validation.validationMessages.length} validation warnings:`);
      result.validation.validationMessages.forEach(msg => {
        console.log(`  ${msg}`);
      });
    } else {
      console.log('No validation issues found (this should not happen with our test data)');
    }
    
    console.log(`\nOutput saved to: ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error('Error during remapping:', error.message);
  }
}

// Run the demo
runValidationDemo();

// Clean up
console.log('\nDemo completed. Cleaning up...');
if (fs.existsSync(DUPLICATE_DATA_FILE)) {
  // fs.unlinkSync(DUPLICATE_DATA_FILE);
  console.log(`You can inspect the test file at: ${DUPLICATE_DATA_FILE}`);
  console.log(`You can see the output file at: ${OUTPUT_FILE}`);
}