import "test-case.jsx";
import "console.jsx";
import "hogan.jsx";
import "js.jsx";
import "js/nodejs.jsx";

class _Test extends TestCase
{
    function runtest (basename : string) : void
    {
        var jsonsrc = node.fs.readFileSync(node.path.join('test/spec/specs', basename + ".json"), 'utf8');
        var json = JSON.parse(jsonsrc);
        var tests = json['tests'] as variant[];
        for (var i = 0; i < tests.length; i++)
        {
            var test = tests[i];
            var src = test['template'] as string;
            var data = test['data'];

            var template = Hogan.compile(src);

            var partials = {} : Map.<Hogan.Template>;
            var partialKeys = [] : string[];
            if (test['partials'])
            {
                var partialSources = test['partials'] as Map.<string>;
                for (var key in partialSources)
                {
                    if (partialSources.hasOwnProperty(key))
                    {
                        partials[key] = Hogan.compile(partialSources[key]);
                        partialKeys.push(key);
                    }
                }
            }

            console.log((i + 1) as int + ":", test['name']);
            //console.log('   template:', src);
            //console.log('   data:', JSON.stringify(data));

            if (partialKeys.length > 0)
            {
                //console.log('   partial keys:', partialKeys.join(', '));
                //console.log(partials);
                this.expect(template.render(data, partials)).toBe(test['expected']);
            }
            else
            {
                this.expect(template.render(data)).toBe(test['expected']);
            }
        }
    }

    function test_delimiters () : void
    {
        this.runtest('delimiters');
    }

    function test_comments () : void
    {
        this.runtest('comments');
    }

    function test_interpolation () : void
    {
        this.runtest('interpolation');
    }

    function test_inverted () : void
    {
        this.runtest('inverted');
    }

    function test_partials () : void
    {
        this.runtest('partials');
    }

    function test_sections () : void
    {
        this.runtest('sections');
    }
}
