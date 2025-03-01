/**
 * Config Loader with Function Support and ID Validation
 * 
 * This module extends the remapper by allowing loading of field mappings
 * from a JSON configuration file, including support for functions and ID validation.
 */

const fs = require('fs');
const { remapData, checkForDuplicates } = require('./excel-remapper');

/**
 * Validates that specified ID columns contain unique values
 * 
 * @param {Array} inputRows - Array of data rows to validate
 * @param {Array|string} idColumns - Column name(s) to check for uniqueness
 * @returns {Object} Validation results with any duplicate IDs found
 */
function validateUniqueIds(inputRows, idColumns) {
  console.log('Validating unique IDs...');
  
  // Convert single column to array for consistency
  const columnsToCheck = Array.isArray(idColumns) ? idColumns : [idColumns];
  
  // Track validation results
  const validationResults = {
    isValid: true,
    duplicates: [],
    validationMessages: []
  };
  
  // Check each ID column
  columnsToCheck.forEach(columnName => {
    console.log(`Checking column "${columnName}" for uniqueness...`);
    
    // Store seen values and their row numbers
    const seenValues = {};
    const duplicates = [];
    
    // Check each row
    inputRows.forEach((row, index) => {
      const value = row[columnName];
      
      // Skip undefined or null values
      if (value === undefined || value === null || value === '') {
        return;
      }
      
      // Convert to string for consistency
      const valueStr = String(value);
      
      if (seenValues[valueStr]) {
        // Found a duplicate
        duplicates.push({
          value: valueStr,
          rows: [...seenValues[valueStr], index + 1]  // +1 for human-readable row numbers
        });
        seenValues[valueStr].push(index + 1);
        validationResults.isValid = false;
      } else {
        // First time seeing this value
        seenValues[valueStr] = [index + 1];
      }
    });
    
    // Prepare validation messages
    if (duplicates.length > 0) {
      validationResults.duplicates.push({
        column: columnName,
        duplicateValues: duplicates
      });
      
      // Add messages for each duplicate
      duplicates.forEach(dup => {
        const message = `WARNING: Value "${dup.value}" in column "${columnName}" appears multiple times in rows: ${dup.rows.join(', ')}`;
        console.warn(message);
        validationResults.validationMessages.push(message);
      });
    } else {
      console.log(`✓ Column "${columnName}" contains only unique values.`);
    }
  });
  
  return validationResults;
}

/**
 * Loads a mapping configuration from a JSON file
 * and transforms string function definitions into actual functions
 * 
 * @param {string} configFilePath - Path to the JSON configuration file
 * @returns {Object} Processed configuration object with executable functions
 */
function loadMappingConfig(configFilePath) {
  console.log(`Loading configuration from: ${configFilePath}`);
  
  // Read and parse the configuration file
  const configContent = fs.readFileSync(configFilePath, 'utf8');
  let config;
  
  try {
    config = JSON.parse(configContent);
  } catch (error) {
    throw new Error(`Error parsing configuration file: ${error.message}`);
  }
  
  // Initialize the processed configuration
  const processedConfig = {
    csvOptions: config.csvOptions || {},
    fieldMappings: {},
    idColumns: config.idColumns || [] // New property for ID columns
  };
  
  // Process helper functions first (if any)
  const helperFunctions = {};
  if (config.helperFunctions) {
    for (const [funcName, funcDef] of Object.entries(config.helperFunctions)) {
      try {
        // Convert string function definition to actual function
        helperFunctions[funcName] = eval(`(${funcDef})`);
      } catch (error) {
        console.error(`Error processing helper function '${funcName}':`, error);
        throw new Error(`Invalid helper function definition for '${funcName}'`);
      }
    }
  }
  
  // Make helper functions available in the global scope for the mapping functions
  for (const [funcName, func] of Object.entries(helperFunctions)) {
    global[funcName] = func;
  }
  
  // Process field mappings
  if (config.fieldMappings) {
    for (const [field, mappingDef] of Object.entries(config.fieldMappings)) {
      try {
        // Convert string function definition to actual function
        processedConfig.fieldMappings[field] = eval(`(${mappingDef})`);
      } catch (error) {
        console.error(`Error processing mapping for field '${field}':`, error);
        throw new Error(`Invalid mapping definition for field '${field}'`);
      }
    }
  }
  
  return processedConfig;
}

/**
 * Main function to remap data using a configuration file with ID validation
 * 
 * @param {string} templateFilePath - Path to the template file
 * @param {string} inputFilePath - Path to the input data file
 * @param {string} configFilePath - Path to the configuration file
 * @param {string} outputFilePath - Path where output should be saved
 * @returns {Object} Result of the remapping operation with validation results
 */
function remapWithConfig(templateFilePath, inputFilePath, configFilePath, outputFilePath) {
  // Load and process the configuration
  const config = loadMappingConfig(configFilePath);
  
  // Read input data to perform ID validation
  const fs = require('fs');
  const Papa = require('papaparse');
  const inputData = fs.readFileSync(inputFilePath, 'utf8');
  const parsedData = Papa.parse(inputData, {
    header: true,
    delimiter: config.csvOptions.delimiter || ',',
    skipEmptyLines: true
  });
  
  let validationResults = { isValid: true, validationMessages: [] };
  
  // Perform ID validation if idColumns are specified
  if (config.idColumns && config.idColumns.length > 0) {
    validationResults = validateUniqueIds(parsedData.data, config.idColumns);
    
    // Log validation results
    if (!validationResults.isValid) {
      console.warn(`\n⚠️ ID validation failed with ${validationResults.validationMessages.length} warnings`);
      validationResults.validationMessages.forEach(msg => console.warn(`  ${msg}`));
    } else {
      console.log('✓ All ID columns contain unique values.');
    }
  }
  
  // Perform the remapping
  const remapResult = remapData(templateFilePath, inputFilePath, config, outputFilePath);
  
  // Update the stats with validation warnings
  if (validationResults.validationMessages && validationResults.validationMessages.length > 0) {
    remapResult.stats.validationWarnings = validationResults.validationMessages.length;
    remapResult.stats.warnings += validationResults.validationMessages.length;
  }
  
  // Add validation results to the returned object
  return {
    ...remapResult,
    validation: validationResults
  };
}

// Simple command-line interface
function runFromCommandLine() {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.log('Usage: node advanced-remapper.js <template-file> <input-file> <config-file> <output-file>');
    process.exit(1);
  }
  
  const [templateFile, inputFile, configFile, outputFile] = args;
  
  try {
    const result = remapWithConfig(templateFile, inputFile, configFile, outputFile);
    
    // Prepare detailed summary
    console.log(`\n===== Remapping Summary =====`);
    console.log(`✅ Remapping completed successfully!`);
    console.log(`Processed ${result.stats.totalRows} rows of data`);
    console.log(`Processing errors: ${result.stats.errorRows}`);
    
    // Show detailed warnings breakdown
    const validationWarnings = result.stats.validationWarnings || 0;
    const otherWarnings = (result.stats.warnings || 0) - validationWarnings;
    
    console.log(`Total warnings: ${result.stats.warnings || 0}`);
    if (validationWarnings > 0) {
      console.log(`  - ID validation warnings: ${validationWarnings}`);
    }
    if (otherWarnings > 0) {
      console.log(`  - Other warnings: ${otherWarnings}`);
    }
    
    console.log(`Output file saved to: ${outputFile}`);
    
    // Report validation results in more detail if there are issues
    if (!result.validation.isValid) {
      console.warn(`\n===== ID Validation Issues =====`);
      result.validation.duplicates.forEach(dupInfo => {
        console.warn(`⚠️ Found duplicate values in column "${dupInfo.column}":`);
        dupInfo.duplicateValues.forEach((dup, idx) => {
          console.warn(`  ${idx+1}. Value "${dup.value}" appears in rows: ${dup.rows.join(', ')}`);
        });
      });
      console.warn(`\nNote: These ID validation warnings are included in the total warnings count.`);
    }
  } catch (error) {
    console.error('Error during remapping:', error.message);
    process.exit(1);
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  runFromCommandLine();
}

// Export the functions
module.exports = {
  loadMappingConfig,
  remapWithConfig,
  validateUniqueIds
};