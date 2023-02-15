import * as core from '@actions/core'
import * as github from '@actions/github'

// The types of nodes that can be queried
enum TYPES {
  FIELD,
  ISSUE,
  OPTION,
  PROJECT,
  USER
}

const octokit = github.getOctokit(core.getInput('token'))

/** Get the global ID of a node via REST
 * @param {TYPES} type - The type of the node
 * @param {string} id - The ID of the node
 */
async function getNodeId(
  type: TYPES,
  owner: string,
  repository: string,
  id: number | string
): Promise<string> {
  let response: any
  let projectNumber: number

  core.info(`Getting global ID for ${type} with ID ${id}`)
  core.info(`Type of ID: ${typeof id}`)

  switch (type) {
    case TYPES.PROJECT:
      // Get the right type of ID for the GraphQL API
      if (typeof id === 'string') {
        projectNumber = parseInt(id)
      } else {
        projectNumber = id
      }

      // Get the ProjectV2 ID from the GraphQL API
      response = await octokit.graphql({
        query: `
          query ($owner: String!, $id: Int!) {
            user(login: $owner) {
              projectV2(number: $id) {
                id
              }
            }
          }
        `,
        owner,
        id: projectNumber
      })

      if (response.errors) {
        core.error(response.errors)
        throw new Error('Get Project ID Error!')
      }

      return response.user.projectV2.id
    case TYPES.USER:
      // Get the user's global ID from the REST API
      return (
        await octokit.request('GET /users/:id', {
          id
        })
      ).data.node_id
    case TYPES.ISSUE:
      // Get the issue's global ID from the REST API
      return (
        await octokit.request('GET /repos/:owner/:repo/issues/:id', {
          owner,
          repo: repository,
          id
        })
      ).data.node_id
    case TYPES.FIELD:
      // Get the right type of ID for the GraphQL API
      if (typeof id === 'string') {
        projectNumber = parseInt(id)
      } else {
        projectNumber = id
      }

      // Get the field's global ID from the GraphQL API
      response = await octokit.graphql({
        query: `
          query ($owner: String!, $projectNumber: Int!) {
            user(login: $owner) {
              projectV2(number: $projectNumber) {
                field(name: "Status") {
                  ... on ProjectV2SingleSelectField {
                    id
                  }
                }
              }
            }
          }
        `,
        owner,
        projectNumber: id
      })

      if (response.errors) {
        core.error(response.errors)
        throw new Error('Get Field ID Error!')
      }

      return response.user.projectV2.field.id
    case TYPES.OPTION:
      // Get the options's global ID from the GraphQL API
      response = await octokit.graphql({
        query: `
          query ($owner: String!, $projectNumber: Int!) {
            user(login: $owner) {
              projectV2(number: $projectNumber) {
                field(name: "Status") {
                  ... on ProjectV2SingleSelectField {
                    options {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        `,
        owner,
        projectNumber: id
      })

      if (response.errors) {
        core.error(response.errors)
        throw new Error('Get Option ID Error!')
      }

      for (const element of response.user.projectV2.field.options) {
        if (element.name.includes(id)) {
          return element.id
        }
      }

      throw new Error('No Option ID Found!')
    default:
      throw new Error('Invalid type')
  }
}

export {getNodeId, TYPES}
