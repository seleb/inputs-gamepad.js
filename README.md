# inputs-gamepad.js

Wrapper for HTML5 Gamepad API. Not event-based.

Developed and tested with an xbox360 wired controller on Chrome and Firefox.

## How To

### Browser

1. include `./dist/index.iife.js` in HTML

```html
<script src="vendor/input-gamepads.js/dist/index.iife.js"></script>
```

2. reference global

```js
const Gamepads = window.inputGamepads.Gamepads;
const Buttons = window.inputGamepads.Buttons;
const Axes = window.inputGamepads.Axes;
```

### Node

1. install

```sh
npm install input-gamepads.js --save
```

2. import

```js
const { Gamepads, Buttons, Axes } = require("input-gamepads.js");
```

```js
import { Gamepads, Buttons, Axes } from 'input-gamepads.js';
```

### Use

Loop:

```js
// initialization
const gamepads = new Gamepads();

// main loop
function main(){
  // get inputs
  var button_is_currently_up = gamepads.isUp(Buttons.A);
  var button_is_currently_down = gamepads.isDown(Buttons.X);
  var button_is_currently_up_but_wasnt_last_frame = gamepads.isJustUp(Buttons.B);
  var button_is_currently_down_but_wasnt_last_frame = gamepads.isJustDown(Buttons.Y);
  var axis_value = gamepads.getAxis(Axes.LSTICK_H);
  var axis_crossed_threshold_like_button = gamepads.axisPast(Axes.LSTICK_H, 0.5, 1);
  var the_first_four_axis_values_as_a_4d_vector = gamepads.getAxes(0,4);
  var dpad_as_a_2d_vector = gamepads.getDpad();
  
  // do your code
  
  // update gamepads (clears arrays, polls connections, etc.)
  gamepads.update();
}
```

All input functions take `player` as an optional final argument. If `player` isn't provided, all controllers will contribute (i.e. a button will be considered down if any controller has them down, an axis will be considered as the sum of the axis on each controller).
