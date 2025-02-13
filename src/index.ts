import * as lpc from "./parser";
import * as markdown from "./printer/markdown";

export const actions = [
    lpc.action,
    markdown.action,    
]

const contract = `
---
provides:
  root:
    dataType: object
    contains:
      functions:
        dataType: object[]
        contains:
          name:
            dataType: string
          description:
            dataType: string[]
          param:
            dataType: object[]
            contains:
              type:
                dataType: string
              name:
                dataType: string
              content:
                dataType: string[]
          return:
            dataType: object
            contains:
              type:
                dataType: string
              content:
                dataType: string[]
          example:
            dataType: string[]
`;

export const contracts = [contract, contract];