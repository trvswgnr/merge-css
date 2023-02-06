#!/usr/bin/env node
// @ts-check
import { readFileSync, existsSync } from 'fs';
import * as CombineCss from './combine-unique-css.js';

const args = process.argv.slice(2);
const options = parseCliArgs(args);

CombineCss.combine(options);

/**
 * Parse the command line arguments and return an object with the arguments.
 * @param {string[]} args The command line arguments, starting with the first argument after the script name.
 * @returns {CombineCss.IOptions} An object from the parsed arguments.
 */
function parseCliArgs(args) {
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
        switch (arg) {
            case '-o' || '--output':
                output = args[i + 1];
                i++;
                break;
            case '-p' || '--parent':
                parent = args[i + 1];
                i++;
                break;
            default:
                console.error(`Error: Unknown argument ${arg}`);
                showHelp();
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

    /** @type {CombineCss.IOptions} */
    const options = {
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
