import { ActionDefinition } from "@gesslar/bedoc/dist/types/core/ActionManager";
import ParseManager from "@gesslar/bedoc/dist/types/core/action/ParseManager";
import Logger from "@gesslar/bedoc/dist/types/core/Logger";
import { Parser } from "./parser";
import * as lpc from "@lpc-lang/core";

let logger: Logger | undefined;
let parser: Parser | undefined;

interface Signature {
    name: string,
    access?: string,
    type?: string,
    modifiers?: string[],
    parameters?: string[],
    [tag: string]: any
}

interface SuccessResult {
    status: "success",
    result: Signature[]
}
interface ErrorResult {
    status: "error",
    error: Error    
}

type Result = SuccessResult | ErrorResult;

export const actions: ActionDefinition[] = [
    {
        meta: {
            action: "parse",
            language: "lpc"
        },

        run: runLpcParser as any,
        setup: setupLpcParser as any
    }, 
    {
        meta: {
            action: "print",
            format: "markdown"
        },
        run: mockPrinter as any
    }
];

async function mockPrinter(params: { fileName: string; content: string }): Promise<any> {
    return { status: "success", content: "" };
}

function setupLpcParser(params: { parent: ParseManager; log: Logger }): void {        
    logger = params.log;    
}

async function runLpcParser(params: { fileName: string; content: string }): Promise<Result> {
    if (!parser) {
        parser = new Parser(params.fileName);
        logger?.info("Parser initialized");

        
    }

    const sourceFile = parser.parse(params.fileName);  
    if (!sourceFile) {
        return { 
            status: "error",
            error: new Error(`Failed to parse ${params.fileName}`)
        }
    }

    const result: Signature[] = [];
    const funcs = sourceFile.statements.filter(s => s.kind === lpc.SyntaxKind.FunctionDeclaration) as lpc.FunctionDeclaration[];
    funcs.forEach(f => {        
        const sig: Signature = {
            name: f.name?.text || "",
            modifiers: f.modifiers?.map(m => m.getText()) || [],
            parameters: f.parameters?.map(p => p.getText()) || [],
            type: f.type?.getText() || "",
        };
        
        lpc.getJSDocTags(f)?.forEach(tag => {            
            sig[tag.tagName.text] = tag.comment || "";
        });

        result.push(sig);
    });

    return { 
        status: "success",
        result
    }
}

export const contracts = [
  `
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
`,
  // Make the printer contract the same as the parser contract.
  `
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
`,
]