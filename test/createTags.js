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

// Generate random starting version for release tags
function generateStartingVersion() {
  const major = Math.floor(Math.random() * 5) + 1; // Random between 1 and 5
  const minor = Math.floor(Math.random() * 5); // Random between 0 and 4
  const patch = Math.floor(Math.random() * 10); // Random between 0 and 9
  return { major, minor, patch };
}

// Increment the release version based on the specified rules
function incrementReleaseVersion(currentVersion, count) {
  let { major, minor, patch } = currentVersion;

  for (let i = 0; i < count; i++) {
    patch += 1;
    if (patch >= 10) {
      patch = 0;
      minor += 1;

      if (minor >= 5) {
        minor = 0;
        major += 1;
      }
    }
  }

  return { major, minor, patch };
}

// Create release tags
async function createReleaseTags(tagCount) {
  console.log('\n🛠️  Creating release tags for testing...');

  try {
    let currentVersion = generateStartingVersion();
    const tags = [];

    // Generate tags based on the release versioning logic
    for (let i = 0; i < tagCount; i++) {
      const version = `v${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}`;
      execSync(`git tag ${version}`);
      console.log(`✅ Created release tag: ${version}`);
      tags.push(version);

      // Increment version for the next tag
      currentVersion = incrementReleaseVersion(currentVersion, 1);
    }

    console.log('\n🏁 All release tags created successfully.');
    console.log('\nGenerated tags:');
    tags.forEach((tag) => console.log(`- ${tag}`));
  } catch (error) {
    console.error('❌ Error creating release tags:', error.message);
    process.exit(1);
  }
}

// Create beta tags
async function createBetaTags(branchCount, maxBetaVersions) {
  console.log('\n🛠️  Creating beta tags for testing...');

  try {
    const startingVersion = generateStartingVersion(); // Beta tags stay on the same version
    const version = `${startingVersion.major}.${startingVersion.minor}.${startingVersion.patch}`;
    const branches = [];

    for (let i = 0; i < branchCount; i++) {
      const branchName = generateBranchName();
      branches.push(branchName);

      const betaCount = Math.max(2, Math.floor(Math.random() * (maxBetaVersions - 1)) + 2); // Random between 2 and maxBetaVersions

      for (let betaVersion = 0; betaVersion < betaCount; betaVersion++) {
        const tag = `${version}-beta-${branchName}.${betaVersion}`;
        execSync(`git tag ${tag}`);
        console.log(`✅ Created beta tag: ${tag}`);
      }
    }

    console.log('\n🏁 All beta tags created successfully.');
    console.log('\nGenerated branches and versions:');
    branches.forEach((branch) => {
      console.log(`- ${branch}: ${version}`);
    });
  } catch (error) {
    console.error('❌ Error creating beta tags:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log('⚙️  Initializing test tag creation...');

  try {
    // Ensure we're in a Git repository
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });

    // Prompt user for tag type
    const { tagType } = await prompt([
      {
        type: 'list',
        name: 'tagType',
        message: 'What type of tags do you want to create?',
        choices: [
          { name: 'Release tags (e.g., v1.2.3)', value: 'release' },
          { name: 'Beta tags (e.g., 1.2.3-beta-branch.0)', value: 'beta' },
        ],
      },
    ]);

    if (tagType === 'release') {
      // Prompt user for the number of release tags
      const { tagCount } = await prompt([
        {
          type: 'number',
          name: 'tagCount',
          message: 'How many release tags do you want to create?',
          default: 20,
          validate: (input) => (input > 0 ? true : 'Please enter a number greater than 0'),
        },
      ]);

      // Create release tags
      await createReleaseTags(tagCount);
    } else if (tagType === 'beta') {
      // Prompt user for beta tag configuration
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

      // Create beta tags
      await createBetaTags(answers.branchCount, answers.maxBetaVersions);
    }
  } catch (error) {
    console.error('❌ Error: Not a Git repository. Please run this script inside a Git repository.');
    process.exit(1);
  }
}

main();
