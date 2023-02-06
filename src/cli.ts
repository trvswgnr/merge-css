#!/usr/bin/env node
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { combineUniqueCss, type Options } from './combine-unique-css';

main().then(() => {
    console.log('Successfully combined CSS');
}).catch(e => {
    console.error(e);
    process.exit(1);
});

export default async function main() {
    try {
        const args = process.argv.slice(2);
        const options = parseCliArgs(args);
        const css = await combineUniqueCss(options);

        // write the CSS to a file, or the console if no output file is specified
        if (options.output) {
            writeFileSync(options.output, css);
            console.log(`Successfully combined CSS into ${options.output}`);
        } else {
            console.log(css);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

/** Options for use from the command line. */
type CliOptions = Options & { output?: string };

/**
 * Parse the command line arguments and return an object with the arguments.
 * @param args The command line arguments, starting with the first argument after the script name.
 * @returns An object from the parsed arguments.
 */
export function parseCliArgs(args: string[]): CliOptions {
    if (args.length < 2) {
        showHelp();
        process.exit(1);
    }

    if (args[0] === '-h' || args[0] === '--help') {
        showHelp();
        process.exit(0);
    }

    const file1 = args[0];
    const file2 = args[1];
    let output = '';
    let parent = '';

    for (let i = 2; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-o' || arg === '--output') {
            output = args[++i];
        } else if (arg === '-p' || arg === '--parent') {
            parent = args[++i];
        } else {
            console.error(`Error: Unrecognized argument ${arg}`);
            process.exit(1);
        }
    }

    const files = [file1, file2, output];
    files.forEach((file, i) => {
        if (file && !file.endsWith('.css')) {
            files[i] = file + '.css';
        }

        // make sure the file exists, unless it's the output file
        if (i < 2 && !existsSync(files[i])) {
            console.error(`Error: File ${files[i]} does not exist.`);
            process.exit(1);
        }
    });

    const css1 = readFileSync(file1, 'utf8');
    const css2 = readFileSync(file2, 'utf8');

    const options: CliOptions = {
        css1,
        css2,
    };

    if (output) {
        options.output = output;
    }

    if (parent) {
        options.parent = parent;
    }

    return options;
}

function showHelp() {
    let help = `
        > Usage:
        >   combine-unique-css <file1> <file2> [options]
        >
        > Options:
        >   -o, --output <file>        The output file to write the combined CSS to.
        >   -p, --parent <selector>    The parent selector to wrap the combined CSS in.
        >   -h, --help                 Show this help message.
    `;

    help = help.trim().split('\n').map((line) => line.trim().replace(/^>\s?/, '')).join('\n');
    console.info(help);
}
