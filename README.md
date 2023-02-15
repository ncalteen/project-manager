# Project Management Action

This action helps manage personal task projects in GitHub. Any time an issue is
created:

- Add it to the "Inbox" column of the project
- Assign it to the user

## Inputs

### `token`

**Required** (String) The GitHub token to use for authentication.

_Example:_ `${{ secrets.GITHUB_TOKEN }}`

### `projectId`

**Required** (Number) The ID of the project to manage.

_Example:_ `5`

### `owner`

**Required** (String) The owner of the repository where the project is located.

_Example:_ `ncalteen`

### `repository`

**Required** (String) The name of the repository where the project is located.

_Example:_ `TODO`

### `username`

**Required** (String) The username to assign issues to.

_Example:_ `ncalteen`

## Outputs

None

## Example usage

```yaml
name: Auto Assign Issues to @ncalteen

# Run whenever a new issue is opened in this repo
on:
  issues:
    types: [opened]

jobs:
  # Assign the issue to @ncalteen
  auto_assign:
    runs-on: ubuntu-latest
    steps:
      - name: Assign to @ncalteen
        uses: ncalteen/project-management-action@v0.1
        with:
          projectNumber: 5
          owner: ncalteen
          repository: TODO
          username: ncalteen
```
