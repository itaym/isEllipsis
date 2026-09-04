# isEllipsis
![Coverage Status](https://img.shields.io/badge/coverage-100%25-green) ![License](https://img.shields.io/badge/license-MIT-blue)
[![Rate on Openbase](https://badges.openbase.com/js/rating/isellipsis.svg)](https://openbase.com/js/isellipsis?utm_source=embedded&utm_medium=badge&utm_campaign=rate-badge)

------------
Find out if an HTML tag or an Input tag currently display ellipsis.

## Usage
```js
import { isEllipsis } from "isellipsis";
const value = isEllipsis(element, usePlaceholder, returnType);
```
##### Arguments
- `element` : any HTML element - a `DIV`, `SPAN`, `INPUT`, `TEXTAREA`, etc.
- `usePlaceholder` : *(optional, inputs only, default `true`)* measure the placeholder when the field is empty.
- `returnType` : *(optional, default `Number`)* the `Number` or `Boolean` constructor.

##### Return value
- `Number` : the overflow in CSS pixels - a value `> 0` means an ellipsis is shown; `NaN` on error.
- `Boolean` : `true` when an ellipsis is shown (overflow greater than ~0.5px).

#### Overall
`isEllipsis` reports whether the element is **currently** truncating its text with an ellipsis (`…`). It returns a positive number / `true` only when all of the following hold:
- `text-overflow` is `ellipsis` (the default `clip` cuts text with no `…`);
- there is a clipping context - `overflow` is not `visible` (inputs clip their own text regardless);
- the text actually overflows the content box, **or** `-webkit-line-clamp` is set and the content exceeds it.

Measurement is done without cloning the element or mutating the DOM: non-input elements are measured with a `Range`, inputs with canvas text metrics. Both give sub-pixel-accurate results, so there is no longer any need to use integer widths or `box-sizing: border-box`.

#### Example
```
<style>
    INPUT {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 200px;
    }
</style>
<input id="some-info" type="text" placeholder="This is a long placeholder with ellipsis" />
<script>
    let someInfo = document.getElementById("some-info");
    if (isEllipsis(someInfo) > 0) {
        console.log("ellipsis is visible");
    }
    // or ...
    if (isEllipsis(someInfo, true, Boolean)) {
        console.log("ellipsis is visible");
    }
</script>    
 ```
## Note
The measurement relies on the correct font being loaded. If you call `isEllipsis`
immediately after page load, `await document.fonts.ready` first, otherwise the
width may be computed against a fallback font.

Canvas text metrics model glyph advance widths, not full text shaping, so for
inputs the result can be off by a fraction of a pixel with unusual
`font-feature-settings` or heavy ligatures - hence the ~0.5px tolerance on the
boolean result.

## Have a good productive day :)

If you like this package please consider donation <a href="https://paypal.me/ItayMerchav?locale.x=en_US" target="_blank">Click Here</a>

---
- **[MIT license](http://opensource.org/licenses/mit-license.php)**
- Copyright © 2020 Itay Merchav