import * as JSON from './index.js';

const array = [];

const value = {
  bigint: JSON.rawJSON(12345678901234567890n),
  boolean: JSON.rawJSON(true),
  number: JSON.rawJSON(1.23),
  string: JSON.rawJSON(JSON.stringify('Hello 1"there"2')),
  null: JSON.rawJSON(null),
  array,
};

for (const [k, { rawJSON }] of Object.entries(value)) {
  if (k !== 'array') array.push(JSON.rawJSON(rawJSON));
}

const json = JSON.stringify(value, null, '  ');
const result = JSON.parse(json, JSON.reviver);

for (const [k, { rawJSON }] of Object.entries(value)) {
  if (k !== 'array') {
    const v = k === 'string' ? JSON.stringify(result[k]) : String(result[k]);
    console.assert(v === rawJSON, k);
    console.assert(result[k] === JSON.parse(rawJSON, JSON.reviver), k);
  }
}

try {
  JSON.rawJSON({});
  console.assert(false, 'no {} allowed');
}
catch (_) {}

console.log('w/out reviver:', JSON.parse(JSON.stringify(value, ['bigint'])));
console.log('with reviver:', JSON.parse(JSON.stringify(value, ['bigint']), JSON.reviver));

// const s = JSON.rawJSON(JSON.stringify('Hello "there"!'));
// JSON.parse(JSON.stringify({ s }), (key, value, context) => { console.log({ key, value, context }); return value });
