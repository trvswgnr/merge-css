# Merge CSS

Combine two CSS files, removing duplicate selectors and properties.

## Installation

1. Clone the repository and `cd` into it.
2. Run `npm install` to install the dependencies.
3. Run `npm link` to make the `merge-css` command available globally.
5. Run `merge-css <file1> <file2> [-o <output>] [-p [parentSelector]]` to combine the CSS files.

## Usage

```bash
merge-css <file1> <file2> > <output>
```

`merge-css` takes two CSS files as arguments and outputs the combined CSS to the console. If you want to save the output to a file, use the optional `-o` flag or redirect the output to a file.
