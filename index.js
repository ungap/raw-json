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
        value = [++id, suffix].join(':');
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

export { parse, stringify, rawJSON, isRawJSON };
