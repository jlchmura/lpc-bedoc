export interface Signature {
    name: string,
    access?: string,
    type?: string,
    modifiers?: string[],
    parameters?: string[],    
}

export interface Node {
    content: string[];
}

export interface TypedNode extends Node {
    type: string,
}

export interface NamedNode extends Node {
    name: string;
}

export interface Param extends TypedNode {    
    name: string,    
    optional: boolean,
    default: string
}

export interface FunctionResult {
    // [tag: string]: any;
    description: string[];
    signature: Signature;
    param: Param[];
    return: TypedNode;
    tags?: NamedNode[];
}
