# raw-json

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
