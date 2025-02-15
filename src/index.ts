import * as lpc from "./parser";
import * as markdown from "./printer/markdown";

export const actions = [
    lpc.action,
    markdown.action,    
]

const contractParser = `
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
              optional: 
                dataType: boolean
              default:
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
          tags:
            dataType: object[]
            contains:
              name:
                dataType: string
              content:
                dataType: string[]
`;
const contractPrinter = `
---
accepts:
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
              optional: 
                dataType: boolean
              default:
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
          tags:
            dataType: object[]
            contains:
              name:
                dataType: string
              content:
                dataType: string[]
`;

export const contracts = [contractParser, contractPrinter];