import ActionManager, { ActionDefinition } from "@gesslar/bedoc/dist/types/core/ActionManager";
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
    }
];

function setupLpcParser(params: { parent: ActionManager; log: Logger }): void {        
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
