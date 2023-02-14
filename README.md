# Project Management Action

This action helps manage personal task projects in GitHub. It accomplishes the
following:

- Any time a draft issue is created, convert it to an issue.
- Any time a draft issue is created, assign it to your GitHub.com user account.
- Any time an issue is created in the repository, add it to the Inbox column of
  the project.

**Note:** Currently this action only supports projects owned by a repository.
User and organization projects are not currently supported.

## Inputs

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
uses: ncalteen/project-management-action@v0.1
with:
  projectId: 5
  owner: ncalteen
  repository: TODO
  username: ncalteen
```
