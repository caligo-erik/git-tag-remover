#!/usr/bin/env node

const { program } = require('commander');
const { execSync } = require('child_process');
const inquirer = require('inquirer');
const semver = require('semver');
const version = require('./version'); // Ensure this file exists or define a fallback version

// Initialize `createPromptModule`
const prompt = inquirer.createPromptModule();

// Fetch all Git tags
function getTags(filter) {
  try {
    const tags = execSync('git tag -l', { encoding: 'utf-8' }).split('\n').filter(Boolean);
    return filter ? tags.filter((tag) => tag.includes(filter)) : tags;
  } catch (error) {
    console.error('❌ Error fetching tags:', error.message);
    process.exit(1);
  }
}

// Validate and filter version tags
function getVersionTags(tags) {
  return tags.filter((tag) => semver.valid(tag.replace(/^v/, '')));
}

// Delete a tag with timeout and retry mechanism
async function deleteTagWithTimeout(tag, timeout = 5000) {
  const executeWithTimeout = (command, timeout) => {
    return Promise.race([
      new Promise((resolve, reject) => {
        try {
          const result = execSync(command, { encoding: 'utf-8' });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), timeout)),
    ]);
  };

  while (true) {
    try {
      // Step 1: Delete the remote tag
      console.log(`🛠️  Deleting remote tag: ${tag}...`);
      await executeWithTimeout(`git push origin :refs/tags/${tag}`, timeout);
      console.log(`✅ Successfully deleted remote tag: ${tag}`);

      // Step 2: Delete the local tag
      console.log(`🛠️  Deleting local tag: ${tag}...`);
      await executeWithTimeout(`git tag -d ${tag}`, timeout);
      console.log(`✅ Successfully deleted local tag: ${tag}`);

      return; // Exit loop on success
    } catch (error) {
      console.error(`❌ Failed to delete tag: ${tag} - ${error.message}`);

      // Prompt user to retry or abort
      const { retry } = await prompt([
        {
          type: 'list',
          name: 'retry',
          message: `The operation for tag "${tag}" failed. What do you want to do?`,
          choices: [
            { name: 'Retry', value: 'retry' },
            { name: 'Abort', value: 'abort' },
          ],
        },
      ]);

      if (retry === 'abort') {
        console.log('\nOperation aborted by the user.');
        process.exit(1);
      }
    }
  }
}

// Delete selected tags
async function deleteTags(tags) {
  for (const tag of tags) {
    await deleteTagWithTimeout(tag);
  }
}

// Confirm and delete tags
async function confirmAndDelete(tags, autoConfirm) {
  if (!autoConfirm) {
    // Interactive confirmation prompt with "Yes" and "No" options
    const { confirm } = await prompt([
      {
        type: 'list',
        name: 'confirm',
        message: `Are you sure you want to delete the following tags?\n\n${tags.join('\n')}\n`,
        choices: [
          { name: 'Yes', value: true },
          { name: 'No', value: false },
        ],
      },
    ]);

    if (!confirm) {
      console.log('\nOperation canceled.');
      return;
    }
  }

  // Proceed to delete the tags
  await deleteTags(tags);
}

// Handle the --release option
async function handleReleaseOption(autoConfirm) {
  const tags = getTags();
  const versionTags = getVersionTags(tags);

  if (versionTags.length === 0) {
    console.log('No valid version tags found.');
    return;
  }

  while (true) {
    console.log("\nWe've found the following version tags. Which ones would you like to delete?");
    const choices = [
      { name: 'All version tags', value: 'all' },
      { name: 'Everything before a version...', value: 'before' },
      ...versionTags.map((tag) => ({
        name: tag,
        value: tag,
      })),
      { name: 'Exit', value: 'exit' },
    ];

    const { selectedOption } = await prompt([
      {
        type: 'list',
        name: 'selectedOption',
        message: 'Choose an option:',
        choices,
      },
    ]);

    if (selectedOption === 'exit') {
      console.log('\nExiting without making any changes.');
      return;
    }

    if (selectedOption === 'all') {
      console.log('\nDeleting all version tags...');
      await confirmAndDelete(versionTags, autoConfirm);
      return;
    }

    if (selectedOption === 'before') {
      const { cutoffVersion } = await prompt([
        {
          type: 'list',
          name: 'cutoffVersion',
          message: 'Select the cutoff version (all tags before this will be deleted):',
          choices: versionTags.map((tag) => ({ name: tag, value: tag })),
        },
      ]);

      const filteredTags = versionTags.filter((tag) => semver.lt(tag.replace(/^v/, ''), cutoffVersion.replace(/^v/, '')));

      if (filteredTags.length === 0) {
        console.log(`\nNo tags found before version ${cutoffVersion}.`);
        continue;
      }

      console.log(`\nThe following tags will be deleted (before version ${cutoffVersion}):`);
      console.log(filteredTags.join('\n'));

      await confirmAndDelete(filteredTags, autoConfirm);
      return;
    }

    // If a specific tag is selected
    console.log(`\nSelected tag: ${selectedOption}`);
    await confirmAndDelete([selectedOption], autoConfirm);
    return;
  }
}

// Configure CLI
program
  .name('git-tag-remover')
  .description('A CLI tool to remove git tags based on filters')
  .version(version)
  .option('-b, --beta', 'Find and remove beta tags grouped by branch')
  .option('-r, --release', 'Find and remove release tags grouped by version')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (options) => {
    if (options.beta) {
      await handleBetaOption(options.yes);
    } else if (options.release) {
      await handleReleaseOption(options.yes);
    } else {
      console.error('❌ Error: You must specify an option, e.g., --beta or --release.');
      program.help();
    }
  });

// Parse arguments
program.parse(process.argv);
