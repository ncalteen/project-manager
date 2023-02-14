import * as core from '@actions/core'
import {getOctokit} from '@actions/github'
import {graphql} from '@octokit/graphql'

// The types of nodes that can be queried
enum TYPES {
  ISSUE,
  PROJECT,
  PULL_REQUEST,
  USER
}

const octokit = getOctokit(process.env.GITHUB_TOKEN!)

const client = graphql.defaults({
  headers: {
    authorization: `token ${process.env.GITHUB_TOKEN}`
  }
})

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

  switch (type) {
    case TYPES.PROJECT:
      // Get the ProjectV2 ID from the GraphQL API
      response = await client({
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
        id
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
    default:
      throw new Error('Invalid type')
  }
}

export {getNodeId, TYPES}
