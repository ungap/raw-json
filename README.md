# raw-json

[![Coverage Status](https://coveralls.io/repos/github/ungap/raw-json/badge.svg?branch=main)](https://coveralls.io/github/ungap/raw-json?branch=main)

A [JSON.rawJSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/rawJSON) and [JSON.isRawJSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/isRawJSON) ponyfill (meaning: no global patch applied).

```js
import * as JSON from '@ungap/raw-json';

JSON.stringify({
  a: JSON.rawJSON('12345678901234567890'),
  b: JSON.rawJSON(12345678901234567890n),
  c: JSON.rawJSON('null'),
  d: JSON.rawJSON(null),
  e: JSON.rawJSON(123),
  f: JSON.rawJSON('"hello raw JSON"'),
  g: JSON.rawJSON(true),
  h: JSON.rawJSON(false)
});

JSON.parse(
  JSON.stringify(
    JSON.rawJSON('12345678901234567890')
  ),
  // this is an extra utility to have BigInts back
  JSON.reviver
);

// 12345678901234567890n
```

## About RawJSON

Practically born to solve the fact serialized *BigInts* are broken in current *JS* world, but not necessarily in other programming languages such as *Python*, this *ponyfill* allows its consumers to safely store, or retrieve, also *BigInt* primitives as valid values.

```js
const myBigInt = 12345678901234567890n;

// ⚠️ Uncaught TypeError: Do not know how to serialize a BigInt
JSON.stringify({ myBigInt });

// parsing too big numbers is still allowed by JSON specs
JSON.parse('{"myBigInt":12345678901234567890}');
// ⚠️ but the result is lost or incorrect
{ myBigInt: 12345678901234567000 }
//                           ^^^
```

Enter `JSON.rawJSON`, an utility that accepts only primitives, except *Symbols*, and returns a very special, frozen, `null` prototyped object that contains a `rawJSON` public field.

```js
import * as JSON from 'https://esm.run/@ungap/raw-json';

const myBigInt = 12345678901234567890n;

JSON.isRawJSON(myBigInt);   // false

const asRawJSON = JSON.rawJSON(myBigInt);
// { rawJSON: '12345678901234567890' }

JSON.isRawJSON(asRawJSON);  // true

JSON.stringify({ myBigInt: asRawJSON });
// {"myBigInt":12345678901234567890}
```

At this point the *JSON* string `{"myBigInt":12345678901234567890}` can be posted or parsed back, but to retrieve a *BigInt* back we need to use a *reviver* function.

Differently from the pre-rawJSON era, a *reviver* would receive a `key` and a `value` as arguments, but not the recently introduced `context`.
Such `context` has a `source` value, which points at the original string representation of such `value`, only if the `value` is a primitive *JSON* value, meaning it's not present when such `value` is an *object* or an *array*.

```js
JSON.parse(
  '{"myBigInt":12345678901234567890}',
  (key, value, context) => {
    if (typeof value === 'number') {
      console.log({ value, source: context.source });
      // { value: 12345678901234567000, source: '12345678901234567890' }
      return BigInt(context.source);
    }
    return value;
  }
);

{ myBigInt: 12345678901234567890n }
```

To simplify the repeated *reviver* dance, this module also offers a non standard `JSON.reviver` helper that will recognize *BigInt* and return these when found in the source, keeping all other numbers the same.

## What about core-js or performance?

This module goal is to temporarily enable *rawJSON* until it gets native support and it moves the minimum amount of code to do so to keep it simple, size-friendly, yet still performant.

If you are interested in code-size and performance you can [test yourself](https://ungap.github.io/raw-json/test/) in Safari or Firefox.

On average, this module is ~1.5X faster on simple cases and 3X up to 5X faster on more complex (nested) cases.

Compared to native Chrome/ium implementation, this module is nearly as fast as that one too, specially with complex values (same test page, this time with Chrome/ium).

### Known limitations VS core-js

If you [seppuku arrays or objects](https://github.com/ungap/raw-json/issues/6) while parsing as opposite of operating on these after their values have been resolved there are chances the result might be not desired.

I am thinking if I should fix or care about these kind of edge-cases / footgun but if I need to end up writing a whole JSON parser then this module can *RIP* and you'd be better off with the *core-js* variant.

Use native `JSON.parse` if you need to perform seppuku on parsed objects values while these are being parsed, use this *ponyfill* alternative for every other case.
