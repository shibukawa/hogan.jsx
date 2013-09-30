//import "console.jsx";

native class HoganJavaScriptHelper
{
    static function generateTemplateFunc(body : string) : (variant[], Map.<Hogan.Template>, string) -> string;
    static function generatePartialFunc(body : string) : (variant, Map.<Hogan.Template>, Hogan.Template, string) -> void;
} = '''
{
    generateTemplateFunc : function (body) { return new Function('c', 'p', 'i', body); },
    generatePartialFunc : function (body) { return new Function('c', 'p', 't', 'i', body); }
}
''';

class Hogan
{
    class Options
    {
        class CustomTag
        {
            var o : string;
            var c : string;

            function constructor (o : string, c : string)
            {
                this.o = o;
                this.c = c;
            }
        }

        var asString : boolean;
        var sectionTags : Hogan.Options.CustomTag[];
        var delimiters : string;
        var disableLambda : boolean;
        var modelGet : boolean;

        function constructor (options : variant = null)
        {
            // default value;
            this.asString = false;
            this.modelGet = false;
            this.sectionTags = [] : Hogan.Options.CustomTag[];
            if (options)
            {
                this.asString = options['asString'] as boolean;
                this.modelGet = options['modelGet'] as boolean;
                if (options['sectionTags'])
                {
                    this.sectionTags = options['sectionTags'] as Hogan.Options.CustomTag[];
                }
                if (options['delimiters'])
                {
                    this.delimiters = options['delimiters'] as string;
                }
            }
        }
    }

    class CodeObj
    {
        var partials : Map.<Hogan.CodeObj>;
        var code : string;
        var subs : Map.<string>;
        var prefix : string;
        var inPartial : boolean;
        var name : string;
        var rawJSX: boolean;

        function constructor ()
        {
            this.partials = {} : Map.<Hogan.CodeObj>;
            this.code = '';
            this.subs = {} : Map.<string>;
        }

        function constructor(codeObj : Hogan.CodeObj)
        {
            this.partials = codeObj.partials;
            this.code = '';
            this.name = codeObj.name;
            this.subs = {} : Map.<string>;
        }

        function constructor(codeObj : Hogan.CodeObj, node : Hogan.Token)
        {
            this.partials = codeObj.partials;
            this.subs = {} : Map.<string>;
            this.code = '';
            this.prefix = node.n;
        }

        // for partial
        function constructor (node : Hogan.Token)
        {
            this.name = node.n;
            this.partials = {} : Map.<Hogan.CodeObj>;
        }
    }

    class Token
    {
        var tag : string;
        var text : string;
        var indent : string;
        var n : string;
        var otag : string;
        var ctag : string;
        var i : int;
        var end : int;
        var last : boolean;
        var nodes : Hogan.Token[];

        function constructor (tag : string, text : string = '')
        {
            this.tag = tag;
            this.text = text;
            this.last = false;
        }

        function constructor (tag : string, n : string, otag : string, ctag : string, i : int)
        {
            this.tag = tag;
            this.n = n;
            this.otag = otag;
            this.ctag = ctag;
            this.i = i;
            this.last = false;
        }
    }

    // Setup regex  assignments
    // remove whitespace according to Mustache spec
    static const rIsWhitespace = /\S/;
    static const rQuot = /\"/g;
    static const rNewline = /\n/g;
    static const rCr = /\r/g;
    static const rSlash = /\\/g;

    static const tags = {
        '#': 1, '^': 2, '<': 3, '$': 4,
        '/': 5, '!': 6, '>': 7, '=': 8, '_v': 9,
        '{': 10, '&': 11, '_t': 12
    } : Map.<int>;

    static function scan (text : string, delimiters : string) : Hogan.Token[] {
        var len = text.length;
        var IN_TEXT : int = 0;
        var IN_TAG_TYPE : int = 1;
        var IN_TAG : int = 2;
        var state : int = IN_TEXT;
        var tagType : string = '';
        var buf = '';
        var tokens = [] : Hogan.Token[];
        var seenTag = false;
        var seenTagPosition : int = 0;
        var i = 0;
        var lineStart = 0;
        var otag = '{{';
        var ctag = '}}';

        function addBuf() : void {
            if (buf.length > 0) {
                tokens.push(new Hogan.Token('_t', buf));
                buf = '';
            }
        }

        function lineIsWhitespace() : boolean {
            var isAllWhitespace = true;
            for (var j = lineStart; j < tokens.length; j++) {
                isAllWhitespace =
                    (Hogan.tags[tokens[j].tag] < Hogan.tags['_v']) ||
                    (tokens[j].tag == '_t' && tokens[j].text.match(Hogan.rIsWhitespace) == null);
                if (!isAllWhitespace) {
                    return false;
                }
            }
            return isAllWhitespace;
        }

        function filterLine(haveSeenTag : boolean, noNewLine : boolean) : void {
            addBuf();

            if (haveSeenTag && lineIsWhitespace()) {
                for (var j = lineStart, next; j < tokens.length; j++) {
                    if (tokens[j].text) {
                        if ((next = tokens[j+1]) && next.tag == '>') {
                            // set indent to token value
                            next.indent = tokens[j].text.toString();
                        }
                        tokens.splice(j, 1);
                    }
                }
            } else if (!noNewLine) {
                tokens.push(new Hogan.Token('\n'));
            }

            seenTag = false;
            seenTagPosition = 0;
            lineStart = tokens.length;
        }

        function changeDelimiters(text : string, index : int) : int {
            var close = '=' + ctag;
            var closeIndex = text.indexOf(close, index);
            var delimiters = text.substring(text.indexOf('=', index) + 1, closeIndex).trim().split(' ');

            otag = delimiters[0];
            ctag = delimiters[delimiters.length - 1];

            return closeIndex + close.length - 1;
        }

        if (delimiters) {
            var delimitersWords = delimiters.split(' ');
            otag = delimitersWords[0];
            ctag = delimitersWords[1];
        }

        for (i = 0; i < len; i++) {
            if (state == IN_TEXT) {
                if (Hogan.tagChange(otag, text, i)) {
                    --i;
                    addBuf();
                    state = IN_TAG_TYPE;
                } else {
                    if (text.charAt(i) == '\n') {
                        filterLine(seenTag, false);
                    } else {
                        buf += text.charAt(i);
                    }
                }
            } else if (state == IN_TAG_TYPE) {
                i += otag.length - 1;
                var tagExists = Hogan.tags[text.charAt(i + 1)];
                tagType = tagExists ? text.charAt(i + 1) : '_v';
                if (tagType == '=') {
                    i = changeDelimiters(text, i);
                    state = IN_TEXT;
                } else {
                    if (tagExists) {
                        i++;
                    }
                    state = IN_TAG;
                }
                seenTag = i as boolean;
                seenTagPosition = i;
            } else {
                if (Hogan.tagChange(ctag, text, i)) {
                    tokens.push(new Hogan.Token(tagType, buf.trim(), otag, ctag,
                                 (tagType == '/') ? seenTagPosition - otag.length : i + ctag.length));
                    buf = '';
                    i += ctag.length - 1;
                    state = IN_TEXT;
                    if (tagType == '{') {
                        if (ctag == '}}') {
                            i++;
                        } else {
                            Hogan.cleanTripleStache(tokens[tokens.length - 1]);
                        }
                    }
                } else {
                    buf += text.charAt(i);
                }
            }
        }

        filterLine(seenTag, true);

        return tokens;
    }

    static function cleanTripleStache(token : Hogan.Token) : void {
        if (token.n.slice(-1) == '}') {
            token.n = token.n.slice(0, -1);
        }
    }

    static function tagChange(tag : string, text : string, index : int) : boolean {
        if (text.charAt(index) != tag.charAt(0)) {
            return false;
        }

        for (var i = 1, l = tag.length; i < l; i++) {
            if (text.charAt(index + i) != tag.charAt(i)) {
                return false;
            }
        }

        return true;
    }

    // the tags allowed inside super templates
    static const allowedInSuper = {'_t': true, '\n': true, '$': true, '/': true};

    static function buildTree(tokens : Hogan.Token[], stack : Hogan.Token[], customTags : Hogan.Options.CustomTag[]) : Hogan.Token[] {
        var instructions = [] : Hogan.Token[];
        var opener : Hogan.Token = null;
        var tail = stack[stack.length - 1];
        var token : Hogan.Token = null;

        while (tokens.length > 0) {
            token = tokens.shift();

            if (tail && tail.tag == '<' && !(token.tag in Hogan.allowedInSuper)) {
                throw new Error('Illegal content in < super tag.');
            }

            if ((Hogan.tags[token.tag] && Hogan.tags[token.tag] <= Hogan.tags['$']) || Hogan.isOpener(token, customTags)) {
                stack.push(token);
                token.nodes = Hogan.buildTree(tokens, stack, customTags);
            } else if (token.tag == '/') {
                if (stack.length == 0) {
                    throw new Error('Closing tag without opener: /' + token.n);
                }
                opener = stack.pop();
                if (token.n != opener.n && !Hogan.isCloser(token.n, opener.n, customTags)) {
                    throw new Error('Nesting error: ' + opener.n + ' vs. ' + token.n);
                }
                opener.end = token.i;
                return instructions;
            } else if (token.tag == '\n') {
                token.last = (tokens.length == 0) || (tokens[0].tag == '\n');
            }

            instructions.push(token);
        }

        if (stack.length > 0) {
            throw new Error('missing closing tag: ' + stack.pop().n);
        }

        return instructions;
    }

    static function isOpener(token : Hogan.Token, tags : Hogan.Options.CustomTag[]) : boolean {
        for (var i = 0, l = tags.length; i < l; i++) {
            if (tags[i].o == token.n) {
                token.tag = '#';
                return true;
            }
        }
        return false;
    }

    static function isCloser(close : string, open : string, tags : Hogan.Options.CustomTag[]) : boolean {
        for (var i = 0, l = tags.length; i < l; i++) {
            if (tags[i].c == close && tags[i].o == open) {
                return true;
            }
        }
        return false;
    }

    static function stringifySubstitutions(obj : Map.<string>) : string {
        var items = [] : string[];
        for (var key in obj) {
            items.push('"' + Hogan.esc(key) + '": function(c,p,t,i) {' + obj[key] + '}');
        }
        return "{ " + items.join(",") + " }";
    }

    static function stringifyPartials(codeObj : Hogan.CodeObj) : string {
        var partials = [] : string[];
        for (var key in codeObj.partials) {
            partials.push('"' + Hogan.esc(key) + '":{name:"' + Hogan.esc(codeObj.partials[key].name) + '", ' + Hogan.stringifyPartials(codeObj.partials[key]) + "}");
        }
        return "new Hogan.Template({" + partials.join(",") + "}, " + Hogan.stringifySubstitutions(codeObj.subs) + ")";
    }

    static function stringify (codeObj : Hogan.CodeObj, text : string, options : variant) : string {
        var src = ["  override function r (c:variant,p:Map.<Hogan.Template>,i:int):string {",
                   "    " + Hogan.wrapMain(codeObj.code), "  }\n",
                   "  override function getPartials() : Map<Hogan.Template> {",
                   "    return " + Hogan.stringifyPartials(codeObj) +  ";\n  }\n"
        ];
        return src.join('\n');
    }

    static var serialNo = 0;

    static function generateJSX (tree : Hogan.Token[], text : string, options : Hogan.Options) : string {
        Hogan.serialNo = 0;
        var context = new Hogan.CodeObj();
        context.rawJSX = false;
        Hogan.walk(tree, context);

        var src = [
            'import "hogan/template.jsx";',
            'class GeneratedTemplate extends Hogan.Template {',
            Hogan.stringify(context, text, options),
            '}'
        ];
        return src.join('\n');
    }

    static function generate (tree : Hogan.Token[], text : string, options : Hogan.Options) : Hogan.Template {
        Hogan.serialNo = 0;
        var context = new Hogan.CodeObj();
        context.rawJSX = true;
        Hogan.walk(tree, context);
        return Hogan.makeTemplate(context, text, options);
    }

    static function makeTemplate (codeObj : Hogan.CodeObj, text : string, options : Hogan.Options) : Hogan.Template {
        var template = Hogan.makePartials(codeObj);
        var code = HoganJavaScriptHelper.generateTemplateFunc(Hogan.wrapMainJSX(codeObj.code));
        //console.log(Hogan.wrapMainJSX(codeObj.code));
        return new Hogan.GeneratedTemplate(code, template, text, options);
    }

    static function makePartials (codeObj : Hogan.CodeObj) : Hogan.Template {
        var template = new Hogan.Template(codeObj);
        for (var key in codeObj.partials) {
            if (codeObj.partials.hasOwnProperty(key))
            {
                template.partials[key] = Hogan.makePartials(codeObj.partials[key]);
            }
        }
        for (var key in codeObj.subs) {
            if (codeObj.subs.hasOwnProperty(key))
            {
                template.subs[key] = HoganJavaScriptHelper.generatePartialFunc(Hogan.wrapMain(codeObj.subs[key]));
            }
        }
        return template;
    }

    static function wrapMain (code : string) : string {
        return 'var t=this;t.b(i=i||"");' + code + 'return t.fl();';
    }

    static function wrapMainJSX (code : string) : string {
        return 'var t=this;t.b$S(i=i||"");' + code + 'return t.fl$();';
    }

    static function esc(s : string) : string {
        return s.replace(Hogan.rSlash, '\\\\')
                .replace(Hogan.rQuot, '\\\"')
                .replace(Hogan.rNewline, '\\n')
                .replace(Hogan.rCr, '\\r');
    }

    static function chooseMethod(s : string) : string {
        return (~s.indexOf('.')) ? 'd' : 'f';
    }

    static function chooseMethodJSX(s : string) : string {
        return ((~s.indexOf('.')) ? 'd' : 'f') + "$SAXHLHogan$x2ETemplate$B";
    }

    static function createPartial(node : Hogan.Token, context : Hogan.CodeObj) : string {
        var prefix = "<" + (context.prefix ? context.prefix : "");
        var sym = prefix + node.n + Hogan.serialNo++ as string;
        var partial = new Hogan.CodeObj(node);
        partial.rawJSX = context.rawJSX;
        context.partials[sym] = partial;
        if (context.rawJSX)
        {
            context.code += 't.b$S(t.rp$SAXHLHogan$x2ETemplate$S("' +  Hogan.esc(sym) + '",c,p,"' + (node.indent ? node.indent : '') + '"));';
        }
        else
        {
            context.code += 't.b(t.rp("' +  Hogan.esc(sym) + '",c,p,"' + (node.indent ? node.indent : '') + '"));';
        }
        return sym;
    }

    static const codegen = {
        '#': function(node : Hogan.Token, context : Hogan.CodeObj) : void {
            if (context.rawJSX)
            {
                context.code += 'if(t.s$XAXHLHogan$x2ETemplate$IIIS(t.' + Hogan.chooseMethodJSX(node.n) + '("' + Hogan.esc(node.n) + '",c,p,1),' +
                                'c,p,0,' + node.i + ',' + node.end + ',"' + node.otag + " " + node.ctag + '")){' +
                                't.rs$AXHLHogan$x2ETemplate$F$XHLHogan$x2ETemplate$LHogan$x2ETemplate$V$(c,p,' + 'function(c,p,t){';
                Hogan.walk(node.nodes, context);
                context.code += '});c.pop();}';
            }
            else
            {
                context.code += 'if(t.s(t.' + Hogan.chooseMethod(node.n) + '("' + Hogan.esc(node.n) + '",c,p,1),' +
                                'c,p,0,' + node.i + ',' + node.end + ',"' + node.otag + " " + node.ctag + '")){' +
                                't.rs(c,p,' + 'function(c,p,t){';
                Hogan.walk(node.nodes, context);
                context.code += '});c.pop();}';
            }
        },

        '^': function(node : Hogan.Token, context : Hogan.CodeObj) : void {
            if (context.rawJSX)
            {
                context.code += 'if(!t.s$XAXHLHogan$x2ETemplate$IIIS(t.' + Hogan.chooseMethodJSX(node.n) + '("' + Hogan.esc(node.n) + '",c,p,1),c,p,1,0,0,"")){';
            }
            else
            {
                context.code += 'if(!t.s$XAXHLHogan$x2ETemplate$IIIS(t.' + Hogan.chooseMethod(node.n) + '("' + Hogan.esc(node.n) + '",c,p,1),c,p,1,0,0,"")){';
            }
            Hogan.walk(node.nodes, context);
            context.code += '};';
        },

        '>': function (node : Hogan.Token, context : Hogan.CodeObj) : void {
            Hogan.createPartial(node, context);
        },

        '<': function (node : Hogan.Token, context : Hogan.CodeObj) : void {
            var ctx = new Hogan.CodeObj();
            ctx.inPartial = true;
            Hogan.walk(node.nodes, ctx);
            var template = context.partials[Hogan.createPartial(node, context)];
            template.subs = ctx.subs;
            template.partials = ctx.partials;
        },

        '$': function(node : Hogan.Token, context : Hogan.CodeObj) : void {
            var ctx = new Hogan.CodeObj(context, node);
            Hogan.walk(node.nodes, ctx);
            context.subs[node.n] = ctx.code;
            if (!context.inPartial) {
                if (context.rawJSX)
                {
                    context.code += 't.sub$SXHLHogan$x2ETemplate$S("' + Hogan.esc(node.n) + '",c,p,i);';
                }
                else
                {
                    context.code += 't.sub("' + Hogan.esc(node.n) + '",c,p,i);';
                }
            }
        },

        '\n': function(node : Hogan.Token, context : Hogan.CodeObj) : void {
            context.code += Hogan.write('"\\n"' + (node.last ? '' : ' + i'), context);
        },

        '_v': function(node : Hogan.Token, context : Hogan.CodeObj) : void {
            if (context.rawJSX)
            {
                context.code += 't.b$S(t.v$S(t.' + Hogan.chooseMethodJSX(node.n) + '("' + Hogan.esc(node.n) + '",c,p,0)));';
            }
            else
            {
                context.code += 't.b(t.v(t.' + Hogan.chooseMethod(node.n) + '("' + Hogan.esc(node.n) + '",c,p,0)));';
            }
        },

        '_t': function(node : Hogan.Token, context : Hogan.CodeObj) : void {
            context.code += Hogan.write('"' + Hogan.esc(node.text) + '"', context);
        },

        '{': function (node : Hogan.Token, context : Hogan.CodeObj) : void {
            Hogan.tripleStache(node, context);
        },

        '&': function (node : Hogan.Token, context : Hogan.CodeObj) : void {
            Hogan.tripleStache(node, context);
        }
    } : Map.<(Hogan.Token, Hogan.CodeObj) -> void>;

    static function tripleStache(node : Hogan.Token, context : Hogan.CodeObj) : void {
        if (context.rawJSX)
        {
            context.code += 't.b$S(t.t$S(t.' + Hogan.chooseMethodJSX(node.n) + '("' + Hogan.esc(node.n) + '",c,p,0)));';
        }
        else
        {
            context.code += 't.b(t.t(t.' + Hogan.chooseMethod(node.n) + '("' + Hogan.esc(node.n) + '",c,p,0)));';
        }
    }

    static function write(s : string, context : Hogan.CodeObj) : string {
        if (context.rawJSX)
        {
            return 't.b$S(' + s + ');';
        }
        else
        {
            return 't.b(' + s + ');';
        }
    }

    static function walk (nodelist : Hogan.Token[], context : Hogan.CodeObj) : Hogan.CodeObj {
        var func;
        for (var i = 0, l = nodelist.length; i < l; i++) {
            func = Hogan.codegen[nodelist[i].tag];
            if (func)
            {
                func(nodelist[i], context);
            }
        }
        return context;
    }

    static function parse (tokens : Hogan.Token[], options : Hogan.Options) : Hogan.Token[] {
        return Hogan.buildTree(tokens, [] : Hogan.Token[], options.sectionTags);
    }

    static function parse (tokens : Hogan.Token[], options : variant) : Hogan.Token[] {
        var optionObj = new Hogan.Options(options);
        return Hogan.buildTree(tokens, [] : Hogan.Token[], optionObj.sectionTags);
    }

    static function parse (tokens : Hogan.Token[]) : Hogan.Token[] {
        return Hogan.buildTree(tokens, [] : Hogan.Token[], [] : Hogan.Options.CustomTag[]);
    }

    static function compileToJSX (text : string, options : Hogan.Options = new Hogan.Options()) : string {
        return Hogan.generateJSX(Hogan.parse(Hogan.scan(text, options.delimiters), options), text, options);
    }

    static function compileToJSX (text : string, options : variant) : string {
        return Hogan.compileToJSX(text, new Hogan.Options(options));
    }

    static function compile (text : string, options : Hogan.Options = new Hogan.Options()) : Hogan.Template {
        return Hogan.generate(Hogan.parse(Hogan.scan(text, options.delimiters), options), text, options);
    }

    static function compile (text : string, options : variant) : Hogan.Template {
        return Hogan.compile(text, new Hogan.Options(options));
    }

    class GeneratedTemplate extends Hogan.Template
    {
        var code : (variant[], Map.<Hogan.Template>, string) -> string;

        function constructor(code : (variant[], Map.<Hogan.Template>, string) -> string, instance : Hogan.Template, text : string, options : Hogan.Options)
        {
            this.code = code;
            this.partials = instance.partials;
        }

        override function r (context : variant[], partials : Map.<Hogan.Template>, indent : string) : string
        {
            return this.code(context, partials, indent);
        }
    }

    class Template
    {
        var options : Hogan.Options;
        var text : string;
        var subs : Map.<(variant, Map.<Hogan.Template>, Hogan.Template, string) -> void>;
        var partials : Map.<Hogan.Template>;
        var buf : string[];
        var activeSub : Nullable.<string>;
        var name : string;
        var stackSubs : Map.<(variant, Map.<Hogan.Template>, Hogan.Template, string) -> void>;
        var stackPartials : Map.<Hogan.Template>;
        var stackTexts : string[];
        var stackTextIndex : Map.<Hogan.Template>[];
        var subsText : Map.<string>;

        function constructor (text : string = '', options : Hogan.Options = null) {
            this.options = (options ? options : new Hogan.Options());
            this.text = text;
            this.partials = this.getPartials();
            this.subs = this.getSubs();
            this.stackPartials = {} : Map.<Hogan.Template>;
            this.stackTexts = [] : string[];
            this.stackTextIndex  = [] : Map.<Hogan.Template>[];
            this.ib();
        }

        function constructor(instance : Hogan.Template, subs : Map.<(variant, Map.<Hogan.Template>, Hogan.Template, string) -> void>, partials : Map.<Hogan.Template>, stackSubs : Map.<(variant, Map.<Hogan.Template>, Hogan.Template, string) -> void>, stackPartials : Map.<Hogan.Template>, childText : string)
        {
            this.stackSubs = (stackSubs) ? (stackSubs) : ({} : Map.<(variant, Map.<Hogan.Template>, Hogan.Template, string) -> void>);
            this.subs = instance.subs;
            this.subsText = {} : Map.<string>;  //hehe. substext.
            this.ib();

            for (var key in subs) {
                if (!stackSubs[key]) stackSubs[key] = subs[key];
                this.subsText[key] = childText;
            }
            for (var key in stackSubs) {
                this.subs[key] = stackSubs[key];
            }

            this.stackPartials = stackPartials;
            for (var key in partials) {
                if (!this.stackPartials[key]) this.stackPartials[key] = partials[key];
            }
            for (var key in stackPartials) {
                this.partials[key] = stackPartials[key];
            }
            this.stackTexts = [] : string[];
            this.stackTextIndex  = [] : Map.<Hogan.Template>[];
        }

        function constructor (partials : Map.<Hogan.Template>, subs : Map.<(variant, Map.<Hogan.Template>, Hogan.Template, string) -> void>)
        {
            this.partials = partials;
            this.subs = subs;
        }

        // for partial
        function constructor (codeObj : Hogan.CodeObj)
        {
            this.name = codeObj.name;
            this.partials = {} : Map.<Hogan.Template>;
            //this.subs = {} : Map.<(variant, Map.<Hogan.Template>, Hogan.Template, string) -> void>;
        }

        // render: replaced by generated code.
        function r (context : variant[], partials : Map.<Hogan.Template>, indent : string) : string
        {
            return '';
        }

        function getPartials () : Map.<Hogan.Template> {
            return {} : Map.<Hogan.Template>;
        }

        function getSubs () : Map.<(variant, Map.<Hogan.Template>, Hogan.Template, string) -> void>
        {
            return {} : Map.<(variant, Map.<Hogan.Template>, Hogan.Template, string) -> void>;
        }

        // triple stache
        function v (str : string) : string {
            return Hogan.Template.hoganEscape(str);
        }

        function t (str : string) : string {
            return Hogan.Template.coerceToString(str);
        }

        function render(context : variant, partials : Map.<Hogan.Template> = {} : Map.<Hogan.Template>, indent : string = '') : string {
            return this.ri([context], partials, indent);
        }

        // render internal -- a hook for overrides that catches partials too
        function ri (context : variant[], partials : Map.<Hogan.Template>, indent : string) : string {
            return this.r(context, partials, indent);
        }

        // ensurePartial
        function ep (symbol : string, partials : Map.<Hogan.Template>) : Hogan.Template {
            var partial = this.partials[symbol];
            var template = partials[partial.name];
            /*if (partial.instance && partial.base == template) {
                return partial.instance;
            }*/
            if (!template)
            {
                return null;
            }
            if (partial.subs) {
                // Make sure we consider parent template now
                var index = this.stackTextIndex.indexOf(partials);
                var childText : string;
                if (this.activeSub == null) {
                    // Store parent template text in partials.stackText to perform substitutions in child templates correctly
                    if (index == -1)
                    {
                        index = this.stackTextIndex.length;
                        this.stackTextIndex.push(partials);
                    }
                    this.stackTexts[index] = this.text;
                    childText = this.text;
                }
                else
                {
                    childText = (index == -1) ? this.text : this.stackTexts[index];
                }
                var template = Hogan.Template.createSpecializedPartial(template, partial.subs, partial.partials,
                    this.stackSubs, this.stackPartials, childText);
            }
            //this.partials[symbol] = template;

            return template;
        }

        // tries to find a partial in the current scope and render it
        function rp (symbol : string, context : variant[], partials : Map.<Hogan.Template>, indent : string) : string {
            var partial = this.ep(symbol, partials);
            if (!partial) {
                return '';
            }

            return partial.ri(context, partials, indent);
        }

        // render a section
        function rs (context : variant[], partials : Map.<Hogan.Template>, section : (variant, Map.<Hogan.Template>, Hogan.Template)->void) : void {
            var tail = context[context.length - 1];

            if (!Hogan.Template.isArray(tail)) {
                //console.log("context", context, section);
                section(context, partials, this);
                return;
            }
            
            var tailarray = tail as variant[];

            for (var i = 0; i < tailarray.length; i++) {
                context.push(tailarray[i]);
                //console.log("context", context, section);
                section(context, partials, this);
                context.pop();
            }
        }

        // maybe start a section
        function s(val : variant, ctx : variant[], partials : Map.<Hogan.Template>, inverted : int, start : int, end : int, tags : string) : boolean {
            var pass : boolean;

            if (Hogan.Template.isArray(val) && val['length'] == 0) {
                return false;
            }

            if (typeof val == 'function') {
                var func = val as (Hogan.Template, variant) -> variant;
                val = this.ms(func, ctx, partials, inverted, start, end, tags);
            }

            pass = val as boolean;
            if (!inverted && pass && ctx) {
                ctx.push((typeof val == 'object') ? val : ctx[ctx.length - 1]);
            }

            return pass;
        }

        // find values with dotted names
        function d (key : string, ctx : variant[], partials : Map.<Hogan.Template>, returnFound : boolean) : variant {
            var found;
            var names = key.split('.');
            var val : variant = this.f(names[0], ctx, partials, returnFound);
            var doModelGet = this.options.modelGet;
            var cx : variant = null;

            if (key == '.' && Hogan.Template.isArray(ctx[ctx.length - 2])) {
                val = ctx[ctx.length - 1];
            } else {
                for (var i = 1; i < names.length; i++) {
                    found = Hogan.Template.findInScope(names[i], val, doModelGet);
                    if (found != null) {
                        cx = val;
                        val = found;
                    } else {
                        val = '';
                    }
                }
            }

            if (returnFound && !val) {
                return false;
            }

            if (!returnFound && typeof val == 'function') {
                ctx.push(cx);
                val = this.mv(val as (Hogan.Template, variant) -> variant, ctx, partials);
                ctx.pop();
            }

            return val;
        }

        // find values with normal names
        function f (key : string, ctx : variant[], partials : Map.<Hogan.Template>, returnFound : boolean) : variant {
            var val : variant = false;
            var v : variant = null;
            var found = false;
            var doModelGet = this.options.modelGet;

            for (var i = ctx.length - 1; i >= 0; i--) {
                v = ctx[i];
                val = Hogan.Template.findInScope(key, v, doModelGet);
                if (val != null) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                if (returnFound)
                    return false;
                else
                    return "";
            }

            if (!returnFound && typeof val == 'function') {
                val = this.mv(val as (Hogan.Template, variant) -> variant, ctx, partials);
            }

            return val;
        }

        // higher order templates
        function ls (func : (Hogan.Template, variant, string) -> string, cx : variant, partials : Map.<Hogan.Template>, text : string, tags : string) : boolean {
            var oldTags = this.options.delimiters;

            this.options.delimiters = tags;
            this.b(this.ct(Hogan.Template.coerceToString(func(this, cx, text)), cx, partials));
            this.options.delimiters = oldTags;

            return false;
        }

        // compile text
        function ct (text : string, cx : variant, partials : Map.<Hogan.Template>) : string {
            if (this.options.disableLambda)
            {
                throw new Error('Lambda features disabled.');
            }
            // return this.c.compile(text, this.options).render(cx, partials);
            return text;
        }

        // template result buffering
        function b (s : string) : void {
            this.buf.push(s);
        }

        function fl () : string {
            var r = this.buf.join('');
            this.buf = [];
            return r;
        }

        // init the buffer
        function ib () : void {
            this.buf = [] : string[];
        }

        // method replace section
        function ms (func : (Hogan.Template, variant) -> variant, ctx : variant[], partials : Map.<Hogan.Template>, inverted : int, start : int, end : int, tags : string) : boolean {
            var textSource : string;
            var cx = ctx[ctx.length - 1];
            var result = func(this, cx);

            if (typeof result == 'function') {
                if (inverted) {
                    return true;
                } else {
                    textSource = (this.activeSub && this.subsText[this.activeSub]) ? this.subsText[this.activeSub] : this.text;
                    var func2 = result as (Hogan.Template, variant, string) -> string;
                    return this.ls(func2, cx, partials, textSource.substring(start, end), tags);
                }
            }

            return result as boolean;
        }

        // method replace variable
        function mv (func : (Hogan.Template, variant) -> variant, ctx : variant[], partials : Map.<Hogan.Template>) : string {
            var cx = ctx[ctx.length - 1];
            var result = func(this, cx);

            if (typeof result == 'function') {
                var resultfunc = result as (Hogan.Template, variant) -> variant;
                return this.ct(Hogan.Template.coerceToString(resultfunc(this, cx)), cx, partials);
            }

            return result as string;
        }

        function sub (name : string , context : variant, partials : Map.<Hogan.Template>, indent : string) : void {
            var f = this.subs[name];
            if (f) {
                this.activeSub = name;
                f(context, partials, this, indent);
                this.activeSub = null;
            }
        }

        //Find a key in an object
        static function findInScope(key : string , scope : variant, doModelGet : boolean) : variant {
            var val : variant = null;
            if (scope && typeof scope == 'object') {
                if (scope[key] != null) {
                    val = scope[key];

                    // try lookup with get for backbone or similar model data
                } else if (doModelGet && scope['get'] && typeof scope['get'] == 'function') {
                    var getfunc = scope['get'] as (string) -> variant;
                    val = getfunc(key);
                }
            }
            return val;
        }

        static function createSpecializedPartial(instance : Hogan.Template, subs : Map.<(variant, Map.<Hogan.Template>, Hogan.Template, string) -> void>, partials : Map.<Hogan.Template>, stackSubs : Map.<(variant, Map.<Hogan.Template>, Hogan.Template, string) -> void>, stackPartials : Map.<Hogan.Template>, childText : string) : Hogan.Template {
            return new Hogan.Template(instance, subs, partials, stackSubs, stackPartials, childText);
        }

        static const rAmp = /&/g;
        static const rLt = /</g;
        static const rGt = />/g;
        static const rApos = /\'/g;
        static const rQuot = /\"/g;
        static const hChars = /[&<>\"\']/;

        static function coerceToString(val : variant) : string {
            return ((!val) ? '' : val as string);
        }

        static function hoganEscape(str : string) : string {
            str = Hogan.Template.coerceToString(str);
            return Hogan.Template.hChars.test(str) ?
            str
                .replace(Hogan.Template.rAmp, '&amp;')
                .replace(Hogan.Template.rLt, '&lt;')
                .replace(Hogan.Template.rGt, '&gt;')
                .replace(Hogan.Template.rApos, '&#39;')
                .replace(Hogan.Template.rQuot, '&quot;') :
            str;
        }

        static function isArray (a : variant) : boolean {
            return (a instanceof Array.<variant>);
        }
    }
}
