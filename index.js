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

  const { apply } = Reflect;

  // parse
  const p = parse;
  parse = (text, reviver) => {
    if (typeof reviver === 'function') {
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
        return apply($, this, ctx ? [key, value, ctx] : [key, value]);
      };
    }
    return p(text, reviver);
  };

  // stringify
  const { isArray } = Array;
  const noop = (_, value) => value;
  const fix = (r, raws) => {
    let id = 0;
    const suffix = `${Math.random()}00`.slice(2);
    const $ = typeof r === 'function' ? r :
      (r && isArray(r) ? (k, v) => (!k || r.includes(k) ? v : void 0) : noop);
    return function (key, value) {
      value = apply($, this, [key, value]);
      if (isRawJSON(value)) {
        const { rawJSON } = value;
        raws.set(value = `'${++id}'${suffix}`, rawJSON);
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
