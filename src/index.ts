import * as core from '@actions/core'
import * as github from '@actions/github'
import {IssuesOpenedEvent} from '@octokit/webhooks-types'

import {graphql} from '@octokit/graphql'

import {getNodeId, TYPES} from './utils'

async function run(): Promise<void> {
  let response: any

  try {
    core.info(JSON.stringify(github.context.payload))

    // Get the action inputs
    const projectNumber = core.getInput('projectNumber')
    const owner = core.getInput('owner')
    const repository = core.getInput('repository')
    const username = core.getInput('username')

    // Log inputs
    core.info(`Project: ${projectNumber}`)
    core.info(`Repository: ${owner}/${repository}`)
    core.info(`Username: ${username}`)

    // Get the event context
    const context = github.context
    const eventName = context.eventName
    const eventType = 'opened' //context.eventType
    core.info(`Event: ${eventName}/${eventType}`)

    // Create the GraphQL client
    const client = graphql.defaults({
      headers: {
        authorization: `token ${process.env.GITHUB_TOKEN}`
      }
    })

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

    if (eventName === 'issues' && eventType === 'opened') {
      // New issue created
      const issueNumber = context.issue.number
      const issueId = 'aaaa' //context.issue.node_id

      // Add it to the project
      response = await client({
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
      response = await client({
        query: `
          query ($owner: String!, $projectNumber: Int!) {
            user(login: $owner) {
              projectV2(number: $projectNumber) {
                field(name: "Status") {
                  ... on ProjectV2SingleSelectField {
                    id
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
        projectNumber
      })

      if (response.errors) {
        // Something went wrong...
        core.error(response.errors)
        throw new Error('Get Status Fields Error!')
      }

      // Find the Status column ID
      const fieldId = response.user.projectV2.field.id
      let optionId
      for (const element of response.user.projectV2.field.options) {
        if (element.name.includes('Status')) {
          optionId = element.id
        }
      }
      core.info(`Status Field ID: ${fieldId}`)
      core.info(`Status Option ID: ${optionId}`)

      // Move the item to the Inbox column
      response = client({
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
        throw new Error('Assign Issue to User Error!')
      }
    }
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()
