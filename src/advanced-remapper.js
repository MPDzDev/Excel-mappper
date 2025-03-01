/**
 * Config Loader with Function Support
 * 
 * This module extends the remapper by allowing loading of field mappings
 * from a JSON configuration file, including support for functions.
 */

const fs = require('fs');
const { remapData, checkForDuplicates } = require('./excel-remapper');

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
    fieldMappings: {}
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
 * Main function to remap data using a configuration file
 * 
 * @param {string} templateFilePath - Path to the template file
 * @param {string} inputFilePath - Path to the input data file
 * @param {string} configFilePath - Path to the configuration file
 * @param {string} outputFilePath - Path where output should be saved
 * @returns {Object} Result of the remapping operation
 */
function remapWithConfig(templateFilePath, inputFilePath, configFilePath, outputFilePath) {
  // Load and process the configuration
  const config = loadMappingConfig(configFilePath);
  
  // Perform the remapping
  return remapData(templateFilePath, inputFilePath, config, outputFilePath);
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
    console.log(`Remapping completed successfully. Processed ${result.stats.totalRows} rows.`);
  } catch (error) {
    console.error('Error during remapping:', error.message);
    process.exit(1);
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  runFromCommandLine();
}

// Export the functions - Make sure this is clearly defined
module.exports = {
  loadMappingConfig,
  remapWithConfig
};