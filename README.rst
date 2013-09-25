Hogan for JSX
=============

This is a `JSX <http://jsx.github.io/>`_ version of JavaScript templating library `Hogan <http://twitter.github.io/hogan.js/>`_.
Original Hogan and this Hogan.jsx implement `Mustache <http://mustache.github.io/>`_ template syntax.
You can read detail syntax at `here <http://mustache.github.io/mustache.5.html>`_.

This project is aming following features:

* Genrerate JS Function object
* Genrerate JSX script from Mustache formating templates (not tested yet).

How to Use
----------

.. code-block:: js

   import "console.jsx";
   import "hogan.jsx";

   class _Main {
       static function main (argv : string[]) : void
       {
           var data = {
               wheather: "a sunny day!",
           } : variant;

           var template = Hogan.compile("Today's wheather is {{wheather}}");
           var output = template.render(data);
           // prints "Today's wheather is a sunny day!"
           console.log(output);
       }
   }


License
-------

This software is provided under MIT License.

Original License
----------------

Copyright 2011 Twitter, Inc.

Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
