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
    
}

interface FunctionResult {
    [tag: string]: any;
    signature: Signature;
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

async function runLpcParser(params: { file: any; moduleContent: string }): Promise<Result> {
    const fileName = params.file.path;
    if (!parser) {
        parser = new Parser(fileName);
        logger?.info("Parser initialized");
    }

    const sourceFile = parser.parse(fileName, params.moduleContent);  
    if (!sourceFile) {
        return { 
            status: "error",
            error: new Error(`Failed to parse ${fileName}`)
        }
    }

    const result: Signature[] = [];
    const funcs = sourceFile.statements.filter(s => s.kind === lpc.SyntaxKind.FunctionDeclaration) as lpc.FunctionDeclaration[];
    funcs.forEach(f => {        
        const sig: Signature = {
            name: f.name?.text || "",
            modifiers: f.modifiers?.map(m => m.getText(sourceFile)) || [],
            parameters: f.parameters?.map(p => p.getText(sourceFile)) || [],
            type: f.type?.getText(sourceFile) || "",            
            access: ""
        };
        
        const tags: any = {
            description: [],
            param: []
        };        
        lpc.getJSDocCommentsAndTags(f)?.forEach(jsDoc => {
            if (lpc.isJSDoc(jsDoc)) {
                tags.description = [jsDoc.comment];
                jsDoc.tags?.forEach(tag => { 
                    switch (tag.kind) {
                        // case lpc.SyntaxKind.JSDoc:                    
                        //     tags.description = [(tag as lpc.JSDoc).comment];
                        //     break;
                        case lpc.SyntaxKind.JSDocParameterTag:
                            const p = tag as lpc.JSDocParameterTag;
                            tags.param.push({
                                type: p.typeExpression?.getText(sourceFile) || "",
                                name: p.name.getText(sourceFile),
                                content: [p.comment]
                            });
                        case lpc.SyntaxKind.JSDocReturnTag:
                            const r = tag as lpc.JSDocReturnTag;
                            tags["return"] = {
                                type: r.typeExpression?.getText(sourceFile) || "",
                                content: [r.comment]
                            };
                            break;            
                    }
                });
            }            
        });
        
        result.push({
            ...tags,
            signature: sig
        } satisfies FunctionResult);
    });

    return { 
        status: "success",
        result
    } as any;
}

const contract =   `
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

export const contracts = [contract,contract];