# elm-help

Show information about a package, a module, or a function.

# Installation

```
npm install -g elm-help
```

# Usage

```
Provide a package name and I'll tell about that package

Options:
  --package, -p  An Elm package, for example elm-lang/core
  --module, -m   A module inside the package, for example Maybe
  --name, -n     An exposed name, for example withDefault
  --version, -v  A version of a package, for example 1.0.0 or latest
  --style        Enable syntax highlighting            [boolean] [default: true]
  -h, --help     Show help                                             [boolean]
```


## Example

```
$ elm-help --package eeue56/elm-flat-matrix --name power
===============================================
|   Module: Matrix.Extra
===============================================

power : Matrix.Matrix number -> Matrix.Matrix number -> Maybe.Maybe (Matrix.Matrix number)
element-wise power of elements
```

