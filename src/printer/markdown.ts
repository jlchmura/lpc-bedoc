import { ActionDefinition } from "@gesslar/bedoc/dist/types/core/ActionManager";

export const action: ActionDefinition = {
    meta: {
        action: "print",
        format: "markdown"
    },
    setup: ()=>{},
    run: run as any
}

async function run(params: { file: any, moduleContent: string[] }): Promise<any> {
    const fileName = params.file.module;

    return {
        status: "success",
        message: "File printed successfully",
        destFile: `${fileName}.md`,
        destContent: "Markdown for " + fileName,
    }
}
