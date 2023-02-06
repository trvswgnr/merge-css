#!/usr/bin/env node
import { type Options } from './combine-unique-css';
export default function main(): Promise<void>;
/** Options for use from the command line. */
type CliOptions = Options & {
    output?: string;
};
/**
 * Parse the command line arguments and return an object with the arguments.
 * @param args The command line arguments, starting with the first argument after the script name.
 * @returns An object from the parsed arguments.
 */
export declare function parseCliArgs(args: string[]): CliOptions;
export {};
//# sourceMappingURL=cli.d.ts.map