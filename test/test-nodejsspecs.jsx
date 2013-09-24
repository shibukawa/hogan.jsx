import "test-case.jsx";
import "console.jsx";
import "hogan.jsx";
import "js.jsx";
import "js/nodejs.jsx";

class _Test extends TestCase
{
    function read (filename : string) : string
    {
        return node.fs.readFileSync(node.path.join('test/mustache.js/test/examples', filename), 'utf8');
    }

    function render (basename : string) : string
    {
        var template = Hogan.compile(this.read(basename + '.html'));
        var jscode = this.read(basename + '.js');
        var json = js.eval('(' + jscode + ')');
        console.log(json);
        return template.render(json);
    }

    function render (basename : string, partial : string) : string
    {
        var template = Hogan.compile(this.read(basename + '.html'));
        var partials = {} : Map.<Hogan.Template>;
        partials[partial + '.html'] = Hogan.compile(this.read(partial + '.html'));
        var jscode = this.read(basename + '.js');
        var json = js.eval('(' + jscode + ')');
        console.log(json);
        return template.render(json, partials);
    }

    function result (basename : string) : string
    {
        return this.read(basename + '.txt');
    }

    /*function test_tenthousand() : void
    {
        this.expect(this.render('tenthousand')).toBe(this.result('tenthousand'));
    }*/

    function test_boolean () : void
    {
        this.expect(this.render('boolean')).toBe(this.result('boolean'));
    }

    function test_carriage_return () : void
    {
        this.expect(this.render('carriage_return')).toBe(this.result('carriage_return'));
    }

    function test_comments () : void
    {
        this.expect(this.render('comments')).toBe(this.result('comments'));
    }

    /*function test_complex () : void
    {
        this.expect(this.render('complex')).toBe(this.result('complex'));
    }

    function test_date () : void
    {
        this.expect(this.render('date')).toBe(this.result('date'));
    }

    function test_deep_partial () : void
    {
        this.expect(this.render('deep_partial')).toBe(this.result('deep_partial'));
    }*/

    function test_error_not_found () : void
    {
        this.expect(this.render('error_not_found')).toBe(this.result('error_not_found'));
    }

    function test_escaped () : void
    {
        this.expect(this.render('escaped')).toBe(this.result('escaped'));
    }

    /*function test_hash_instead_of_array () : void
    {
        this.expect(this.render('hash_instead_of_array')).toBe(this.result('hash_instead_of_array'));
    }*/

    function test_inverted () : void
    {
        this.expect(this.render('inverted')).toBe(this.result('inverted'));
    }

    function test_partial () : void
    {
        this.expect(this.render('partial', 'inner_partial')).toBe(this.result('partial'));
    }

    /*function test_recursion_with_same_names () : void
    {
        this.expect(this.render('recursion_with_same_names')).toBe(this.result('recursion_with_same_names'));
    }

    function test_reuse_of_enumerables () : void
    {
        this.expect(this.render('reuse_of_enumerables')).toBe(this.result('reuse_of_enumerables'));
    }

    function test_simple () : void
    {
        this.expect(this.render('simple')).toBe(this.result('simple'));
    }

    function test_dot_notation () : void
    {
        this.expect(this.render('dot_notation')).toBe(this.result('dot_notation'));
    }*/

    function test_twice () : void
    {
        this.expect(this.render('twice')).toBe(this.result('twice'));
    }

    function test_two_in_a_row () : void
    {
        this.expect(this.render('two_in_a_row')).toBe(this.result('two_in_a_row'));
    }

    function test_unescaped () : void
    {
        this.expect(this.render('unescaped')).toBe(this.result('unescaped'));
    }
}
