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
    if (reviver) {
      const $ = reviver;
      const context = new Map;
      // parse all primitives in one go: string | number | boolean | null
      const re = /("(?:(?=(\\?))\2.)*?"\s*:?|[0-9eE.-]+|true|false|null)/g;
      let match;
      while (match = re.exec(text)) {
        const [source] = match;
        if (source.at(-1) !== ':') context.set(p(source), { source });
      }
      reviver = function (key, value) {
        const ctx = context.get(value);
        return $.apply(this, ctx ? [key, value, ctx] : [key, value]);
      };
    }
    return p(text, reviver);
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
