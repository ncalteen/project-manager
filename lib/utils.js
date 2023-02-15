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
exports.TYPES = exports.getNodeId = void 0;
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const graphql_1 = require("@octokit/graphql");
// The types of nodes that can be queried
var TYPES;
(function (TYPES) {
    TYPES[TYPES["ISSUE"] = 0] = "ISSUE";
    TYPES[TYPES["PROJECT"] = 1] = "PROJECT";
    TYPES[TYPES["PULL_REQUEST"] = 2] = "PULL_REQUEST";
    TYPES[TYPES["USER"] = 3] = "USER";
})(TYPES || (TYPES = {}));
exports.TYPES = TYPES;
const octokit = (0, github_1.getOctokit)(process.env.GITHUB_TOKEN);
const client = graphql_1.graphql.defaults({
    headers: {
        authorization: `token ${process.env.GITHUB_TOKEN}`
    }
});
/** Get the global ID of a node via REST
 * @param {TYPES} type - The type of the node
 * @param {string} id - The ID of the node
 */
function getNodeId(type, owner, repository, id) {
    return __awaiter(this, void 0, void 0, function* () {
        let response;
        switch (type) {
            case TYPES.PROJECT:
                // Get the ProjectV2 ID from the GraphQL API
                response = yield client({
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
                });
                if (response.errors) {
                    core.error(response.errors);
                    throw new Error('Get Project ID Error!');
                }
                return response.user.projectV2.id;
            case TYPES.USER:
                // Get the user's global ID from the REST API
                return (yield octokit.request('GET /users/:id', {
                    id
                })).data.node_id;
            default:
                throw new Error('Invalid type');
        }
    });
}
exports.getNodeId = getNodeId;