import * as lpc from "./parser";
import * as markdown from "./printer/markdown";

export const actions = [
    lpc.action,
    markdown.action,
]

const contractParser = `
provides:
  type: object
  properties:
    functions:
      type: array
      items:
        type: object
        properties:
          name:
            type: string
          description:
            type: array
            items:
              type: string
          param:
            type: array
            items:
              type: object
              properties:
                type:
                  type: string
                name:
                  type: string
                optional:
                  type: boolean
                default:
                  type: string
                content:
                  type: array
                  items:
                    type: string
          return:
            type: object
            properties:
              type:
                type: string
              content:
                type: array
                items:
                  type: string
          tags:
            type: array
            items:
              type: object
              properties:
                name:
                  type: string
                content:
                  type: array
                  items:
                    type: string
`;
const contractPrinter = `
accepts:
  type: object
  required:
    - functions
  properties:
    functions:
      type: array
      items:
        type: object
        required:
          - name
        properties:
          name:
            type: string
          description:
            type: array
            items:
              type: string
          param:
            type: array
            items:
              type: object
              required:
                - name
                - type
              properties:
                type:
                  type: string
                name:
                  type: string
                optional:
                  type: boolean
                default:
                  type: string
                content:
                  type: array
                  items:
                    type: string
          return:
            type: object
            required:
              - type
            properties:
              type:
                type: string
              content:
                type: array
                items:
                  type: string
          tags:
            type: array
            items:
              type: object
              required:
                - name
              properties:
                name:
                  type: string
                content:
                  type: array
                  items:
                    type: string
`;

export const contracts = [contractParser, contractPrinter];
