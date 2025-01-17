#!/usr/bin/env node

const { execSync } = require('child_process');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
const inquirer = require('inquirer');

// Initialize `createPromptModule`
const prompt = inquirer.createPromptModule();

// Generate a unique branch name
function generateBranchName() {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals], // Use color-animal naming style
    separator: '-',
    style: 'lowercase',
  });
}

// Generate random version numbers for major.minor.patch
function generateRandomVersion() {
  const major = Math.floor(Math.random() * 10) + 1; // Random between 1 and 10
  const minor = Math.floor(Math.random() * 10) + 1;
  const patch = Math.floor(Math.random() * 10) + 1;
  return `${major}.${minor}.${patch}`;
}

// Function to create tags
async function createTags(branchCount, maxBetaVersions) {
  console.log('\n🛠️  Creating tags for testing...');

  try {
    const branches = [];

    // Generate branch names and beta tags
    for (let i = 0; i < branchCount; i++) {
      const branchName = generateBranchName();
      const version = generateRandomVersion(); // Unique version for each branch
      branches.push({ branchName, version });

      // Determine the number of beta versions for this branch
      const betaCount = Math.max(2, Math.floor(Math.random() * (maxBetaVersions - 1)) + 2);

      for (let betaVersion = 0; betaVersion < betaCount; betaVersion++) {
        const tag = `${version}-beta-${branchName}.${betaVersion}`;
        execSync(`git tag ${tag}`);
        console.log(`✅ Created tag: ${tag}`);
      }
    }

    console.log('\n🏁 All test tags created successfully.');
    console.log('\nGenerated branches and versions:');
    branches.forEach(({ branchName, version }) => {
      console.log(`- ${branchName}: ${version}`);
    });
  } catch (error) {
    console.error('❌ Error creating tags:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log('⚙️  Initializing test tag creation...');

  try {
    // Ensure we're in a Git repository
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });

    // Prompt user for configuration
    const answers = await prompt([
      {
        type: 'number',
        name: 'branchCount',
        message: 'How many branches (unique names) do you want to create?',
        default: 5,
        validate: (input) => (input > 0 ? true : 'Please enter a number greater than 0'),
      },
      {
        type: 'number',
        name: 'maxBetaVersions',
        message: 'What is the maximum number of beta versions per branch?',
        default: 5,
        validate: (input) => (input >= 2 ? true : 'Please enter a number greater than or equal to 2'),
      },
    ]);

    // Call the function to create tags
    await createTags(answers.branchCount, answers.maxBetaVersions);
  } catch (error) {
    console.error('❌ Error: Not a Git repository. Please run this script inside a Git repository.');
    process.exit(1);
  }
}

main();
