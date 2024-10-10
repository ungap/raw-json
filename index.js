let { parse, stringify, rawJSON, isRawJSON } = JSON;

if (!rawJSON) {
  // isRawJSON
  const { freeze, setPrototypeOf } = Object;
  class RawJSON {
    static isRawJSON(o) {
      return typeof o === 'object' && !!o && #rawJSON in o;
    }
    #rawJSON = true;
    constructor(rawJSON) {
      this.rawJSON = rawJSON;
      freeze(setPrototypeOf(this, null));
    }
  }
  ({ isRawJSON } = RawJSON);

  // rawJSON
  rawJSON = value => {
    const type = typeof value;
    switch (type) {
      case 'object':
        if (value) break;
      case 'bigint':
      case 'boolean':
      case 'number':
        value = String(value);
      case 'string':
        parse(value);
        return new RawJSON(value);
    }
    throw new TypeError('Unexpected ' + type);
  };

  // parse
  const p = parse;
  const context = source => ({ source });
  parse = (text, reviver) => {
    if (!reviver) return p(text);
    const contexts = new Map;
    const strings = [];
    return p(
      text
      // drop strings from the JSON
      .replace(
        /"(?:(?=(\\?))\1.)*?"/g,
        $ => {
          contexts.set(p($), context($));
          return `s${strings.push($) - 1}`;
        }
      )
      // grab all other primitives
      .replace(
        /(?<!s)\b([0-9eE.-]+|true|false|null)\b/g,
        $ => {
          contexts.set(p($), context($));
          return $;
        }
      )
      // put back strings
      .replace(/s(\d+)/g, (_, index) => strings[index]),
      // invoke the reviver with all the things it needs
      function (key, value) {
        const args = [key, value];
        const context = contexts.get(value);
        if (context) args.push(context);
        return reviver.apply(this, args);
      }
    );
  };

  // stringify
  const { isArray } = Array;
  const noop = (_, value) => value;
  const fix = (replacer, raws) => {
    let id = 0;
    const suffix = Math.random();
    const $ = isArray(replacer) ?
      (k, v) => (k === '' || replacer.includes(k) ? v : void 0) :
      (replacer || noop);
    return function (key, value) {
      value = $.call(this, key, value);
      if (isRawJSON(value)) {
        const { rawJSON } = value;
        value = `${++id}.${suffix}`;
        raws.set(value, rawJSON);
      }
      return value;
    };
  };
  const s = stringify;
  stringify = (value, replacer, space) => {
    const raws = new Map;
    return s(value, fix(replacer, raws), space).replace(
      new RegExp(`"(${[...raws.keys()].join('|')})"`, 'g'),
      (_, key) => raws.get(key)
    );
  };
}

export const reviver = (_, value, context) => (
  context && typeof value === 'number' && String(value) !== context.source ?
    BigInt(context.source) : value
);

export { parse, stringify, rawJSON, isRawJSON };
