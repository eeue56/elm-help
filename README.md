# elm-help

Show information about a package, a module, or a function.

# Installation

```
npm install -g elm-help
```

# Usage

```
Provide a package name and I'll tell about that package. By default, looks up
elm-package.json in the current directory

Options:
  --package, -p  An Elm package, for example elm-lang/core
  --module, -m   A module inside the package, for example Maybe
  --name, -n     An exposed name, for example withDefault
  --version, -v  A version of a package, for example 1.0.0 or latest
  --style        Enable syntax highlighting            [boolean] [default: true]
  -h, --help     Show help                                             [boolean]

```


## Example

By default, it will just look up docs from the package in the current directory

```
noah@noah-ThinkPad-T470s:~/dev/elm-html-test$ elm-help --name style
===============================================
|   Module: /home/noah/dev/elm-html-test/src/Test/Html/Selector.elm
===============================================

style : List ( String, String ) -> Selector
Matches elements that have all the given style properties (and possibly others as well).

    import Html
    import Html.Attributes as Attr
    import Test.Html.Query as Query
    import Test exposing (test)
    import Test.Html.Selector exposing (classes)


    import Html
    import Html.Attributes as Attr
    import Test.Html.Query as Query
    import Test exposing (test)
    import Test.Html.Selector exposing (classes)
    test "the Reply button has red text" <|
        \() ->
            Html.div []
                [ Html.button [ Attr.style [ ( "color", "red" ) ] ] [ Html.text "Reply" ] ]
                |> Query.has [ style [ ( "color", "red" ) ] ]
```

You can specify libraries like this:

```
$ elm-help --package eeue56/elm-flat-matrix --name power
===============================================
|   Module: Matrix.Extra
===============================================

power : Matrix.Matrix number -> Matrix.Matrix number -> Maybe.Maybe (Matrix.Matrix number)
element-wise power of elements
```

