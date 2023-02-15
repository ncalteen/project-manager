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
const utils_1 = require("./utils");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let response;
        try {
            // Get the action inputs
            const projectNumber = parseInt(core.getInput('projectNumber'));
            const owner = core.getInput('owner');
            const repository = core.getInput('repository');
            const username = core.getInput('username');
            // Log inputs
            core.info(`Project: ${projectNumber}`);
            core.info(`Repository: ${owner}/${repository}`);
            core.info(`Username: ${username}`);
            // Get the event context
            const context = github.context;
            // Create the Octokit client
            const octokit = github.getOctokit(core.getInput('token'));
            // Get the project's global ID
            const projectId = yield (0, utils_1.getNodeId)(utils_1.TYPES.PROJECT, owner, repository, projectNumber, projectNumber);
            core.info(`Project ID: ${projectId}`);
            // Get the user's global ID
            const userId = yield (0, utils_1.getNodeId)(utils_1.TYPES.USER, owner, repository, projectNumber, username);
            core.info(`User ID: ${userId}`);
            // New issue created
            const issueNumber = context.issue.number;
            // Get the issue's global ID
            const issueId = yield (0, utils_1.getNodeId)(utils_1.TYPES.ISSUE, owner, repository, projectNumber, issueNumber);
            core.info(`Issue ID: ${issueId}`);
            // Add it to the project
            response = yield octokit.graphql({
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
            const fieldId = yield (0, utils_1.getNodeId)(utils_1.TYPES.FIELD, owner, repository, projectNumber, projectNumber);
            const optionId = yield (0, utils_1.getNodeId)(utils_1.TYPES.OPTION, owner, repository, projectNumber, 'Inbox');
            core.info(`Status Field ID: ${fieldId}`);
            core.info(`Status Option ID: ${optionId}`);
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
            });
            if (response.errors) {
                // Something went wrong...
                core.error(response.errors);
                throw new Error('Move Issue To Inbox Error!');
            }
            // Assign the issue to the user
            response = yield octokit.graphql({
                query: `
        mutation ($issueId: ID!, $userId: ID!) {
          addAssigneesToAssignable(input: {assignableId: $issueId, assigneeIds: [$userId]}) {
            assignable {
              ... on Issue {
                number
              }
            }
          }
        }
      `,
                issueId,
                userId
            });
            if (response.errors) {
                // Something went wrong...
                core.error(response.errors);
                throw new Error('Assign Issue to User Error!');
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
