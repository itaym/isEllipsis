# isEllipsis
Find out if an HTML tag or an Input tag currently display ellipsis.

## Usage
- import { isEllipsis } from "isellipsis";
- let value = isEllipsis(HTMLElement, usePlaceholder);
##### Variables
- value : Zero or greater indicating an ellipsis is shown.
  If an error occurred isEllipsis returns 0.
- HTMLElement : Any HTML element such as DIV or Input etc.
- usePlaceholder : Indicates whenever to use the placeholder (default is true). 

#### Overall
The isEllipsis returns a greater from zero number only if the HTMLElement is set up for ellipsis and the content overflows the element content area.
So, if the returned value is greater from zero the HTMLElement displays ellipsis (...).

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

let someInfo = document.getElementById("some-info");
if (isEllipsis(someInfo)) {
    console.log("ellipsis is visible");
}
 ```