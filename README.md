# **git-tag-remover**

**Have you ever wanted to clean up the mess of Git tags in a project that's grown chaotic over the years?**  
Maybe you've inherited a repository with hundreds—or even thousands—of outdated tags cluttering your `git tag` list. Deleting them one by one is tedious and error-prone.

**Here's your solution:** `git-tag-remover`!  
An **interactive** CLI tool to help you remove Git tags effortlessly. Whether it's a specific group of tags (like `beta` tags) or all tags altogether, `git-tag-remover` makes the process fast and user-friendly.

---

## **Why Use git-tag-remover?**

Git tags are an essential part of version control—they let you mark specific commits with meaningful names. But over time, tags can pile up, leaving your repository cluttered and hard to manage.

`git-tag-remover` solves this problem by providing:

- **Interactive Workflows**: Intuitive prompts guide you through tag removal step by step.
- **Grouping of Beta Tags**: Automatically groups related beta tags (e.g., for branches) so you can clean up specific groups with ease.
- **Effortless Cleanup**: No need for manual commands—just select what you want to delete, and let the tool handle the rest.

---

## **Key Features**

- **🚀 Interactive and Intuitive**: No need to remember complex commands. Follow the interactive prompts to see groups of tags, select what you want, and confirm your choices.
- **📊 Smart Grouping**: Tags containing the word `beta` are automatically grouped by branch, making it easier to manage related tags.
- **💡 Flexible Options**:
  - Delete all beta tags at once, or pick specific groups for deletion.
  - Use the `-y` flag to skip confirmation prompts for faster, non-interactive operation.
- **🧹 Clean Repositories**: Keep your Git repository organized by quickly removing outdated, irrelevant, or temporary tags.

---

## **Installation**

Install `git-tag-remover` globally using npm:

```bash
npm install -g git-tag-remover
```
