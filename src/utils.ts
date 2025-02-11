export function findArgument(argumentName: string, args: readonly string[]): string | undefined {
    const index = args.indexOf(argumentName);
    return index >= 0 && index < args.length - 1
        ? args[index + 1]
        : undefined;
}