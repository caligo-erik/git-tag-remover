#!/usr/bin/env node

const { program } = require('commander');
const { execSync } = require('child_process');
const inquirer = require('inquirer');
const version = require('./version'); // Ensure this file exists or define a fallback version

// Initialize `createPromptModule`
const prompt = inquirer.createPromptModule();

// Fetch all tags matching a filter
function getTags(filter) {
  try {
    const tags = execSync('git tag -l', { encoding: 'utf-8' }).split('\n').filter(Boolean);
    return filter ? tags.filter((tag) => tag.includes(filter)) : tags;
  } catch (error) {
    console.error('❌ Error fetching tags:', error.message);
    process.exit(1);
  }
}

// Group beta tags by branch or version
function groupBetaTags(tags) {
  const groups = {};

  tags.forEach((tag) => {
    const match = tag.match(/beta-([a-zA-Z0-9-]+)\.\d+/); // Extract branch name
    if (match) {
      const groupName = match[1];
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(tag);
    }
  });

  // Sort each group's tags
  Object.keys(groups).forEach((key) => {
    groups[key].sort((a, b) => {
      const aVersion = parseInt(a.match(/\.(\d+)$/)[1], 10);
      const bVersion = parseInt(b.match(/\.(\d+)$/)[1], 10);
      return aVersion - bVersion;
    });
  });

  return groups;
}

// Delete selected tags
function deleteTags(tags) {
  tags.forEach((tag) => {
    try {
      execSync(`git tag -d ${tag}`);
      execSync(`git push origin :refs/tags/${tag}`);
      console.log(`✅ Deleted tag: ${tag}`);
    } catch (error) {
      console.error(`❌ Failed to delete tag: ${tag} - ${error.message}`);
    }
  });
}

// Handle the --beta option
async function handleBetaOption(autoConfirm) {
  const tags = getTags('beta');
  const groups = groupBetaTags(tags);

  if (Object.keys(groups).length === 0) {
    console.log('No beta tags found.');
    return;
  }

  while (true) {
    console.log('\nFound the following beta groups:');
    const choices = [
      ...Object.keys(groups).map((group) => ({
        name: `${group}:\n  - ${groups[group].join('\n  - ')}`,
        value: group,
      })),
      { name: 'All beta tags', value: 'all' },
      { name: 'Exit', value: 'exit' },
    ];

    const { selectedGroup } = await prompt([
      {
        type: 'list',
        name: 'selectedGroup',
        message: 'Which group of beta tags do you want to delete?',
        choices,
      },
    ]);

    if (selectedGroup === 'exit') {
      console.log('\nExiting without making any changes.');
      return;
    }

    let selectedTags;
    if (selectedGroup === 'all') {
      selectedTags = tags; // Select all beta tags
    } else {
      selectedTags = groups[selectedGroup];
    }

    if (autoConfirm) {
      console.log('\nDeleting selected tags...');
      deleteTags(selectedTags);
      return;
    }

    // Confirmation prompt for deletion
    while (true) {
      console.log('\nThe following tags will be deleted:');
      console.log(selectedTags.join('\n'));

      const { confirm } = await prompt([
        {
          type: 'list',
          name: 'confirm',
          message: 'Are you sure you want to delete these tags?',
          choices: [
            { name: 'Yes', value: 'yes' },
            { name: 'Back', value: 'back' },
          ],
        },
      ]);

      if (confirm === 'yes') {
        console.log('\nDeleting selected tags...');
        deleteTags(selectedTags);
        return;
      } else if (confirm === 'back') {
        console.log('\nGoing back to group selection.');
        break; // Return to group selection prompt
      }
    }
  }
}

// Configure CLI
program
  .name('git-tag-remover')
  .description('A CLI tool to remove git tags based on filters')
  .version(version)
  .option('-b, --beta', 'Find and remove beta tags grouped by branch')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (options) => {
    if (options.beta) {
      await handleBetaOption(options.yes);
    } else {
      console.error('❌ Error: You must specify an option, e.g., --beta.');
      program.help();
    }
  });

// Parse arguments
program.parse(process.argv);
