import { ActionDefinition } from "@gesslar/bedoc/dist/types/core/ActionManager";
import ParseManager from "@gesslar/bedoc/dist/types/core/action/ParseManager";
import Logger from "@gesslar/bedoc/dist/types/core/Logger";
import { Parser } from "./parser";
import * as lpc from "@lpc-lang/core";
import { FunctionResult, Param, Signature } from "../types";

let logger: Logger | undefined;
let parser: Parser | undefined;

interface SuccessResult {
    status: "success",
    result: FunctionResult[]
}
interface ErrorResult {
    status: "error",
    error: Error    
}

type Result = SuccessResult | ErrorResult;

export const contract = `ref://./lpc.parser.contract.yaml`;

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

    const sourceFile = parser.getSourceFile(fileName, params.moduleContent);      
    if (!sourceFile) {
        return { 
            status: "error",
            error: new Error(`Failed to parse ${fileName}`)
        }
    }

    const result: FunctionResult[] = [];

    // find all functions in the source file
    const funcs = sourceFile.statements.filter(s => s.kind === lpc.SyntaxKind.FunctionDeclaration) as lpc.FunctionDeclaration[];

    funcs.forEach(f => {                    
        const sig: Signature = {
            name: f.name?.text || "",
            modifiers: f.modifiers?.filter(m => !isAccessModifier(m)).map(m => m.getText(sourceFile)) || [],
            parameters: f.parameters?.map(p => p.getText(sourceFile)) || [],
            type: f.type?.getText(sourceFile) || "",            
            access: ""
        };
        
        // figure out access modifier
        const modifierFlags = lpc.getCombinedModifierFlags(f);
        if (modifierFlags & lpc.ModifierFlags.Public) {
            sig.access = "public";
        } else if (modifierFlags & lpc.ModifierFlags.Protected) {
            sig.access = "protected";
        } else if (modifierFlags & lpc.ModifierFlags.Private) {
            sig.access = "private";
        }
        
        const params = new Map<string, Param>();
        const tags: Partial<FunctionResult> = {
            description: [],
            param: []
        };        

        // parse jsdoc comment and tags
        lpc.getJSDocCommentsAndTags(f)?.forEach(jsDoc => {
            if (lpc.isJSDoc(jsDoc)) {
                tags.description = [jsDoc.comment as string];

                jsDoc.tags?.forEach(tag => { 
                    switch (tag.kind) {                        
                        case lpc.SyntaxKind.JSDocParameterTag:
                            const p = tag as lpc.JSDocParameterTag;
                            const pName = p.name.getText(sourceFile);                            
                            const parsedParam: Param = {
                                type: p.typeExpression?.type?.getText(sourceFile) || "",
                                name: pName,
                                content: typeof p.comment === "string" ? [trimDashFromComment(p.comment)] : [],
                                optional: p.isBracketed,
                                default: p.defaultExpression?.getText(sourceFile) || ""
                            };

                            if (!parsedParam.type) {
                                // try to get type from signature param
                                const sigParam = f.parameters?.find(p => p.name.getText(sourceFile) === pName);
                                parsedParam.type = sigParam?.type?.getText(sourceFile) || "";                                
                            }

                            params.set(pName, parsedParam);                            
                        case lpc.SyntaxKind.JSDocReturnTag:
                            const r = tag as lpc.JSDocReturnTag;
                            tags["return"] = {
                                type: r.typeExpression?.type?.getText(sourceFile) || "",
                                content: [trimDashFromComment(r.comment as string)]
                            };
                            break;            
                        default:
                            const tagName = tag.tagName.getText(sourceFile);
                            if (!tags.tags) {
                                tags.tags = [];
                            }
                            tags.tags.push({
                                name: tagName,
                                content: [tag.comment as string]
                            });
                            break;
                    }
                });
            }            
        });

        tags.return = tags["return"] || { type: f.type?.getText(sourceFile) || "", content: [] };

        // fill in any missing parameters using the params from
        // the function signature
        f.parameters?.forEach(p => {
            const pName = p.name.getText(sourceFile);
            if (!params.has(pName)) {
                params.set(pName, {
                    type: p.type?.getText(sourceFile) || "",
                    name: pName,
                    content: [],
                    optional: false,
                    default: p.initializer?.getText(sourceFile) || ""
                });
            } else {
                // fill in some extras from signature
                const param = params.get(pName)!;
                if (!param.type.length) {
                    param.type = p.type?.getText(sourceFile) || "";                    
                }
                if (!param.default.length) {
                    param.default = p.initializer?.getText(sourceFile) || "";
                }                     
            }            
        });

        tags.param = Array.from(params.values());
        tags.signature = sig;

        result.push(tags as FunctionResult);
    });

    return { 
        status: "success",
        result
    } as any;
}

function isAccessModifier(modifier: lpc.Modifier) {
    switch (modifier.kind) {
        case lpc.SyntaxKind.PublicKeyword:
        case lpc.SyntaxKind.ProtectedKeyword:
        case lpc.SyntaxKind.PrivateKeyword:
            return true;
    }

    return false;
}

function trimCharFromStart(str: string, char: string) {
    let i = 0;
    while (str[i] === char) {
        i++;
    }
    return str.slice(i);
}

function trimDashFromComment(comment: string) {
    return trimCharFromStart(comment.trim(),"-").trim();
}

