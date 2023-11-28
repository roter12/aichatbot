import { execute_mongo_post } from "@/pages/api/[collection]";
import { COLLECTION } from "./query_api_method";

export default async function log_error(error: any) {
    const message = error instanceof Error ? error.message : error.toString();
    console.log(message);
    const location = get_caller_location();
    await execute_mongo_post(COLLECTION.ERROR, [{ message, location }])
}

function get_caller_location(): string {
    // Create a new Error object to access the call stack
    const err = new Error();

    // Capture the stack trace and split it into lines
    const stackLines = err?.stack?.split('\n') as string[];

    // The first line is the Error message, the second line is this function's call,
    // The third line is the immediate caller,
    // The fourth line will be the caller's caller location (the one we are interested in)
    if (stackLines.length < 4) {
        console.log("Stack trace not deep enough.");
        return "Stack trace not deep enough."
    }

    // Extract the caller's caller location using a regular expression
    const callerLine = stackLines[3];
    const match = callerLine.match(/at (\S+) \((.+):(\d+):(\d+)\)|at (.+):(\d+):(\d+)/);

    if (match) {
        // Matched with a function name and file location
        const functionName = match[1] || 'anonymous function';
        const filePath = match[2] || match[5];
        const lineNumber = match[3] || match[6];
        return `${functionName} in ${filePath}, line: ${lineNumber}`
    } else {
        return "Could not parse stack trace."
    }
}
