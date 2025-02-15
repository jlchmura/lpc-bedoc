import { ActionDefinition } from "@gesslar/bedoc/dist/types/core/ActionManager";
import { FunctionResult } from "../types";

const FENCED_LANG = "c";

export const action: ActionDefinition = {
    meta: {
        action: "print",
        format: "markdown"
    },
    setup: ()=>{},
    run: run as any
}

async function run(params: { file: any, moduleContent: FunctionResult[] }): Promise<any> {
    const fileName = params.file.module;
    const writer = new MarkdownWriter("\n", 80);
    const functions = params.moduleContent;
    
    if (!functions || !functions.length) {
        return {
            status: "error",
            message: "No functions found"
        }
    }

    writer.writeHeader(1, fileName);

    // write toc
    const toc = functions.map(f => `[${f.signature.name}](#${headerToAnchor(f.signature.name)})`);
    writer.writeListItems(toc);
    writer.writeNewLine();

    functions.forEach((f,fIdx) => {
        (fIdx > 0) && writer.writeHorizontalRule();        

        writer.writeHeader(2, f.signature.name);        

        // signature
        const signatureParts = [
            f.signature.access,
            f.signature.modifiers?.join(" "),            
            f.signature.type,                      
            `${f.signature.name}(${f.signature.parameters?.join(", ")})`,            
        ];
        writer.writeFencedCode(signatureParts.filter(p=>!!p).join(" "), FENCED_LANG);
        writer.writeNewLine();

        // description
        writer.writeText(f.description.map(d=>d?.trim()).join(" ").replace(/\n/g, " "));
        writer.writeNewLine();

        // params
        if (f.param?.length) {
            writer.writeHeader(4, "Parameters");
                
            const hasDefaults = f.param.some(p => p.default);            
            const headerParts = ["Type", "Name", "Description"];            
            hasDefaults && headerParts.splice(2, 0, "Default");
            
            writer.writeTableHeader(headerParts);
            
            f.param.forEach(p => {
                // format param name
                const nameParts = [];                
                nameParts.push(p.name);                
                p.optional && nameParts.push("_(optional)_");                
                
                const paramParts = [`\`${p.type}\``, nameParts.join(" "), stripNewLines(p.content.join(" "))];
                // if there is a default, insert it as the 3rd column                
                hasDefaults && paramParts.splice(2, 0, p.default);                

                writer.writeTableRow(paramParts);
            });
            writer.writeNewLine();
        }

        // returns
        if (f.return) {
            writer.writeHeader(4, "Returns");
            if (f.return.type) {
                writer.writeCode(f.return.type);
                writer.write(" - ");
            }
            
            writer.writeText(stripNewLines(f.return.content.join(" ")));
            writer.writeNewLine();
        }      
        
        if (f.tags?.length) {
            f.tags.forEach(tag => {
                // capitalize first letter
                writer.writeHeader(4, tag.name.charAt(0).toUpperCase() + tag.name.slice(1));

                if (tag.name==="example") {
                    writer.writeFencedCode(tag.content.join(" "), FENCED_LANG);
                } else {
                    writer.writeText(stripNewLines(tag.content.join(" ")));
                }

                writer.writeNewLine();
            });
        }
    });

    return {
        status: "success",
        message: "File printed successfully",
        destFile: `${fileName}.md`,
        destContent: writer.getText(),
    }
}


class MarkdownWriter {
    private output: string;

    constructor(private newLine: string, private columns: number = 80) {
        this.output = "";
    }

    public getText() {
        return this.output;
    }
    
    public write(s: string | undefined) {
        if (s && s.length) {
            this.output += s;
        }
    }

    public writeText(s: string, indent: number = 0) {
        // split into lines, trim each, then re-join with a space
        // then re-break into lines that are no more than columns wide
        const lines = s.split("\n").map(l=>l?.trim()).join(" ").split("\n");
        const colLimit = this.columns - indent * 4;
        const indentStr = " ".repeat(indent * 4);
        lines.forEach(l => {
            while (l.length > colLimit) {
                const idx = l.lastIndexOf(" ", colLimit);
                this.write(indentStr + l.substring(0, idx));                
                this.writeNewLine();
                l = l.substring(idx)?.trim();
            }
            this.write(indentStr + l);
            this.writeNewLine();
        });
    }

    public writeParts(parts: (string|undefined)[], separator: string = " ", indent: number = 0) {
        this.writeText(parts.filter(p=>!!p).join(separator), indent);
    }

    public writeHeader(level: number, s: string) {
        this.write(`${"#".repeat(level)} ${s}\n\n`);
    }

    public writeItalic(s: string) {
        this.write(`*${s}*`);
    }

    public writeBold(s: string) {
        this.write(`**${s}**`);
    }

    public writeCode(s: string) {
        this.write(`\`${s}\``);
    }

    public writeFencedCode(s: string, lang?: string) {
        this.write("```" + (lang || "") + "\n" + s + "\n```\n");        
    }

    public writeNewLine() {
        this.write(this.newLine);
    }

    public writeHorizontalRule() {
        this.write("---\n");
    }

    public writeTableHeader(headers: string[]) {
        this.write("|");
        headers.forEach(h => {
            this.write(` ${h} |`);
        });
        this.writeNewLine();
        this.write("|");
        headers.forEach(h => {
            this.write(" --- |");
        });
        this.writeNewLine();
    }

    public writeTableRow(cells: string[]) {
        this.write("|");
        cells.forEach(c => {
            this.write(` ${escapePipes(c)} |`);
        });
        this.writeNewLine();
    }

    public writeLink(text: string, url: string) {
        this.write(`[${text}](${url})`);
    }

    public writeListItems(items: string[]) {    
        items.forEach(i => {
            this.write(`- ${i}\n`);
        });
    }
}

const stripNewLines = (s: string) => s.replace(/\n/g, " ");

function headerToAnchor(header: string) {
    return header.toLowerCase().replace(/[^a-z0-9_]/g, "-");
}

function escapePipes(s: string) {
    if (!s || s.length === 0) return s;
    return s.replace(/\|/g, "\\|");
}