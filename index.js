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
  parse = (text, reviver) => {
    if (!reviver) return p(text);
    const context = new Map;
    const strings = [];
    return p(
      text
      // drop strings from the JSON
      .replace(
        /"(?:(?=(\\?))\1.)*?"/g,
        $ => {
          context.set(p($), { source: $.slice(1, -1) });
          return `"${strings.push($) - 1}"`;
        }
      )
      // grab all other primitives
      .replace(
        /(")?\b(true|false|null|-?\d+(?:\.\d+)?)\b/g,
        ($, quote, source) => {
          if (!quote) context.set(p(source), { source });
          return $;
        }
      )
      // put back strings
      .replace(/"(\d+)"/g, (_, index) => strings[index]),
      // invoke the reviver with all the things it needs
      function (key, value) {
        const args = [key, value];
        const extra = context.get(value);
        if (extra) args.push(extra);
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
    const result = s(value, fix(replacer, raws), space);
    const re = new RegExp(`"(${[...raws.keys()].join('|')})"`, 'g');
    const place = (_, key) => raws.get(key);
    return result.replace(re, place);
  };
}

export const reviver = (_, value, context) => (
  context && typeof value === 'number' && String(value) !== context.source ?
    BigInt(context.source) : value
);

export { parse, stringify, rawJSON, isRawJSON };
