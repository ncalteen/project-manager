import * as core from '@actions/core'
import * as github from '@actions/github'

import {getNodeId, TYPES} from './utils'

async function run(): Promise<void> {
  let response: any

  try {
    core.info(JSON.stringify(github.context.payload))

    // Get the action inputs
    const projectNumber = core.getInput('projectNumber').toString()
    const owner = core.getInput('owner')
    const repository = core.getInput('repository')
    const username = core.getInput('username')

    // Log inputs
    core.info(`Project: ${projectNumber}`)
    core.info(`Repository: ${owner}/${repository}`)
    core.info(`Username: ${username}`)

    // Get the event context
    const context = github.context

    // Create the Octokit client
    const octokit = github.getOctokit(core.getInput('token'))

    // Get the project's global ID
    const projectId = await getNodeId(
      TYPES.PROJECT,
      owner,
      repository,
      projectNumber
    )
    core.info(`Project ID: ${projectId}`)

    // Get the user's global ID
    const userId = await getNodeId(TYPES.USER, owner, repository, username)
    core.info(`User ID: ${userId}`)

    // New issue created
    const issueNumber = context.issue.number.toString()

    // Get the issue's global ID
    const issueId = await getNodeId(TYPES.ISSUE, owner, repository, issueNumber)
    core.info(`Issue ID: ${issueId}`)

    // Add it to the project
    response = await octokit.graphql({
      query: `
        mutation ($projectId: ID!, $issueId: ID!) {
          addProjectV2ItemById(input: {projectId: $projectId, contentId: $issueId}) {
            item {
              id
              type
            }
          }
        }
      `,
      projectId,
      issueId
    })

    if (response.errors) {
      core.error(response.errors)
      throw new Error('Add Issue to Project Error!')
    }

    // Adding the issue generates an item ID
    const itemId = response.addProjectV2ItemById.item.id
    core.info(`Item ID: ${itemId}`)

    // Get the Inbox column ID
    // This is an option in the `Status` single-select field option
    const fieldId = await getNodeId(
      TYPES.FIELD,
      owner,
      repository,
      projectNumber
    )
    const optionId = getNodeId(TYPES.OPTION, owner, repository, 'Inbox')
    core.info(`Status Field ID: ${fieldId}`)
    core.info(`Status Option ID: ${optionId}`)

    // Move the item to the Inbox column
    response = octokit.graphql({
      query: `
        mutation ($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
          updateProjectV2ItemFieldValue(input: {
            projectId: $projectId,
            itemId: $itemId,
            fieldId: $fieldId,
            value: {
                singleSelectOptionId: $optionId
            }
          })
          {
            projectV2Item {
              id
            }
          }
        }
      `,
      projectId,
      itemId,
      fieldId,
      optionId
    })

    if (response.errors) {
      // Something went wrong...
      core.error(response.errors)
      throw new Error('Move Issue To Inbox Error!')
    }
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()
