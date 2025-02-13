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

interface Param {
    type: string,
    name: string,
    content: string[]
}

export const action: ActionDefinition = {
    meta: {
        action: "parse",
        language: "lpc"
    },

    run: runLpcParser as any,
    setup: setupLpcParser as any
};

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

    // find all functions in the source file
    const funcs = sourceFile.statements.filter(s => s.kind === lpc.SyntaxKind.FunctionDeclaration) as lpc.FunctionDeclaration[];

    funcs.forEach(f => {        
        const sig: Signature = {
            name: f.name?.text || "",
            modifiers: f.modifiers?.map(m => m.getText(sourceFile)) || [],
            parameters: f.parameters?.map(p => p.getText(sourceFile)) || [],
            type: f.type?.getText(sourceFile) || "",            
            access: ""
        };
                
        const params = new Map<string, Param>();
        const tags: any = {
            description: [],
            param: []
        };        
        lpc.getJSDocCommentsAndTags(f)?.forEach(jsDoc => {
            if (lpc.isJSDoc(jsDoc)) {
                tags.description = [jsDoc.comment];

                jsDoc.tags?.forEach(tag => { 
                    switch (tag.kind) {                        
                        case lpc.SyntaxKind.JSDocParameterTag:
                            const p = tag as lpc.JSDocParameterTag;
                            const pName = p.name.getText(sourceFile);
                            params.set(pName, {
                                type: p.typeExpression?.getText(sourceFile) || "",
                                name: pName,
                                content: typeof p.comment === "string" ? [p.comment] : []
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

        tags.return = tags["return"] || { type: "", content: [] };

        // fill in any missing parameters using the params from
        // the function signature
        f.parameters?.forEach(p => {
            const pName = p.name.getText(sourceFile);
            if (!params.has(pName)) {
                params.set(pName, {
                    type: p.type?.getText(sourceFile) || "",
                    name: pName,
                    content: []
                });
            }
        });

        tags.param = Array.from(params.values());
        
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

