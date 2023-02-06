# Combine Unique CSS

Combine two CSS files, keeping only the unique rules from each.

## Installation

1. Clone the repository and `cd` into it.
2. Run `npm install` to install the dependencies.
3. Run `npm link` to make the `combine-unique-css` command available globally.
5. Run `combine-unique-css <file1> <file2> [-o <output>] [-p [parentSelector]]` to combine the CSS files.

## Usage

```bash
combine-unique-css <file1> <file2> > <output>
```

`combine-unique-css` takes two CSS files as arguments and outputs the combined CSS to the console. If you want to save the output to a file, use the optional `-o` flag or redirect the output to a file.
