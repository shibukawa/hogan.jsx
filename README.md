hogan.jsx
===========================================

Synopsis
---------------

This is a [JSX](http://jsx.github.io/) version of JavaScript templating library [Hogan](http://twitter.github.io/hogan.js/).
Original Hogan and this Hogan.jsx implement [Mustache](http://mustache.github.io/) template syntax.
You can read detail syntax at [here](http://mustache.github.io/mustache.5.html).

This project is aming following features:

* Genrerate JS Function object
* Genrerate JSX script from Mustache formating templates (not tested yet).

Code Example
---------------

```js
import "console.jsx";
import "hogan.jsx";

class _Main {
    static function main (argv : string[]) : void
    {
        var data = {
            weather: "a sunny day!",
        } : variant;

        var template = Hogan.compile("Today's weather is {{weather}}");
        var output = template.render(data);
        // prints "Today's wheather is a sunny day!"
        console.log(output);
    }
}
```

Installation
---------------

```sh
$ npm install hogan.jsx
```

API Reference
------------------

* `static Hogan.compile(src : string) : Template`

  Generate Template object.   

* `static Hogan.compileToJSX(src : string) : string`

  Generate Template instance source code in JSX.

* `Template.render(context : variant) : string`

  Generate converted text.

Development
-------------

## Repository

* Repository: git://github.com/shibukawa/hogan.jsx.git
* Issues: https://github.com/shibukawa/hogan.jsx.git/issues

## Run Test

```sh
$ grunt test
```

## Build

```sh
# Generate API reference
$ grunt doc

# Build application or library for JS project
$ grunt build
```

Author
---------

* Yoshiki Shibukawa / yoshiki@shibu.jp

License
------------

MIT

Complete license is written in `LICENSE.md`.

Original License
----------------

Copyright 2011 Twitter, Inc.

Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
