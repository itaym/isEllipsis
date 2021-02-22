# isEllipsis
![Coverage Status](https://img.shields.io/badge/coverage-100%25-green) ![License](https://img.shields.io/badge/license-MIT-blue)
[![Rate on Openbase](https://badges.openbase.com/js/rating/isellipsis.svg)](https://openbase.com/js/isellipsis?utm_source=embedded&utm_medium=badge&utm_campaign=rate-badge)

------------
Find out if an HTML tag or an Input tag currently display ellipsis.

## Usage
- import { isEllipsis } from "isellipsis";
- let value = isEllipsis(HTMLElement, usePlaceholder, returnType);
##### Variables
- value : According the return type:
  - Number: Greater from zero indicates an ellipsis is shown. (NaN indiates error).
  - Boolean: true indicates an ellipsis is shown.
- HTMLElement : Any HTML element such as DIV or Input etc.
- usePlaceholder : (Optional) Indicates whenever to use the placeholder (default is true).
- returnType: (Optional) Detarmine the type of the return. It can be Number or Boolean constructors (default is Number).

#### Overall
The isEllipsis returns a zero or greater number or true (acoriding to the returnType) only if the HTMLElement is set up for ellipsis and the content overflows the element content area.
So, if the returned value is zero or greater or true the HTMLElement displays ellipsis (...).

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
## Importent Note and explanation
For the `isEllipsis` to work correctly. You must set your element `width` to an `integer` and `box-sizing` to  `border-box`. Otherwise there is a margin of error of 1 pixel!!! This due the fact that an `element` properties that `isEllipsis` relays upon such as `clientWidth`, `scrollWidth` and `offsetWidth` are integers. Even if the rendered width of the element is something like `120.8px` (which happens a lot), the `browser` rounds those numbers and `isEllipsis` has no way knowing it.
If the content of the `element` **overflows** by more the correct answer will be returned for sure. As I tested it a lot, if you do like mentioned above, it will work 100% correctly.

## Have a good productive day :)

If you like this package please consider donation <a href="https://paypal.me/ItayMerchav?locale.x=en_US" target="_blank">Click Here</a>

---
- **[MIT license](http://opensource.org/licenses/mit-license.php)**
- Copyright 2015 © <a href="http://fvcproductions.com" target="_blank">FVCproductions</a>.