import * as JSON from '../index.js';

console.assert(JSON.stringify({a:""}) === '{"a":""}');

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

console.assert(JSON.stringify({ a: 1, b: 2 }, {
  apply() {
    console.log('APPLY');
  },
  call() {
    console.log('CALL');
  }
}) === '{"a":1,"b":2}');

console.assert(JSON.stringify({ a: 1, b: 2 }, null) === '{"a":1,"b":2}');

console.assert(JSON.stringify({ a: 1, b: 2 }, (_, v) => v) === '{"a":1,"b":2}');

// issue #3 covered
console.log(
  JSON.parse('{"a":9007199254740993,"b":9007199254740992}', JSON.reviver),
  '{ a: 9007199254740993n, b: 9007199254740992 }'
);

console.log(
  JSON.parse('{"a":9007199254740992,"b":9007199254740993}', JSON.reviver),
  '{ a: 9007199254740992, b: 9007199254740993n }'
);

// const s = JSON.rawJSON(JSON.stringify('Hello "there"!'));
// JSON.parse(JSON.stringify({ s }), (key, value, context) => { console.log({ key, value, context }); return value });

JSON.parse('{}', (k,v,c) => console.assert(typeof c === 'object'));
