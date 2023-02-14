"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const graphql_1 = require("@octokit/graphql");
const utils_1 = require("./utils");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let response;
        try {
            core.info(JSON.stringify(github.context.payload));
            // Get the action inputs
            const projectNumber = core.getInput('projectNumber');
            const owner = core.getInput('owner');
            const repository = core.getInput('repository');
            const username = core.getInput('username');
            // Log inputs
            core.info(`Project: ${projectNumber}`);
            core.info(`Repository: ${owner}/${repository}`);
            core.info(`Username: ${username}`);
            // Get the event context
            const context = github.context;
            const eventName = context.eventName;
            const eventType = 'opened'; //context.eventType
            core.info(`Event: ${eventName}/${eventType}`);
            // Create the GraphQL client
            const client = graphql_1.graphql.defaults({
                headers: {
                    authorization: `token ${process.env.GITHUB_TOKEN}`
                }
            });
            // Get the project's global ID
            const projectId = yield (0, utils_1.getNodeId)(utils_1.TYPES.PROJECT, owner, repository, projectNumber);
            core.info(`Project ID: ${projectId}`);
            // Get the user's global ID
            const userId = yield (0, utils_1.getNodeId)(utils_1.TYPES.USER, owner, repository, username);
            core.info(`User ID: ${userId}`);
            if (eventName === 'issues' && eventType === 'opened') {
                // New issue created
                const issueNumber = context.issue.number;
                const issueId = 'aaaa'; //context.issue.node_id
                // Add it to the project
                response = yield client({
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
                });
                if (response.errors) {
                    core.error(response.errors);
                    throw new Error('Add Issue to Project Error!');
                }
                // Adding the issue generates an item ID
                const itemId = response.addProjectV2ItemById.item.id;
                core.info(`Item ID: ${itemId}`);
                // Get the Inbox column ID
                // This is an option in the `Status` single-select field option
                response = yield client({
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
                });
                if (response.errors) {
                    // Something went wrong...
                    core.error(response.errors);
                    throw new Error('Get Status Fields Error!');
                }
                // Find the Status column ID
                const fieldId = response.user.projectV2.field.id;
                let optionId;
                for (const element of response.user.projectV2.field.options) {
                    if (element.name.includes('Status')) {
                        optionId = element.id;
                    }
                }
                core.info(`Status Field ID: ${fieldId}`);
                core.info(`Status Option ID: ${optionId}`);
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
                });
                if (response.errors) {
                    // Something went wrong...
                    core.error(response.errors);
                    throw new Error('Assign Issue to User Error!');
                }
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
