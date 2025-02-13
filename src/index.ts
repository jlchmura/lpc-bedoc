import { printerAction } from "./parser";

export const actions = [
    printerAction,
    {
        meta: {
            action: "print",
            format: "markdown"
        },
        run: mockPrinter as any
    }
]

async function mockPrinter(params: { fileName: string; content: string }): Promise<any> {
    return { status: "success", content: "" };
}

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