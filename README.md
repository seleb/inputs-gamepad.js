# inputs-gamepad.js
Wrapper for HTML5 Gamepad API. Not event-based.

Developed and tested with an xbox360 wired controller on Chrome and Firefox.

## How To
### Browser
```HTML
<script src="input-gamepads.js"></script>
```
### Node
```
npm install input-gamepads.js --save
```
```JS
const gamepads = require("input-gamepads.js");
```

### Use

Loop:
```JS
// initialization
gamepads.init();

// main loop
function main(){
  // get inputs
  var button_is_currently_up = gamepads.isUp(gamepads.A);
  var button_is_currently_down = gamepads.isDown(gamepads.X);
  var button_is_currently_up_but_wasnt_last_frame = gamepads.isJustUp(gamepads.B);
  var button_is_currently_down_but_wasnt_last_frame = gamepads.isJustDown(gamepads.Y);
  var axis_value = gamepads.getAxis(gamepads.LSTICK_H);
  var axis_crossed_threshold_like_button = gamepads.axisPast(gamepads.LSTICK_H, 0.5, 1);
  var the_first_four_axis_values_as_a_4d_vector = gamepads.getAxes(0,4);
  var dpad_as_a_2d_vector = gamepads.getDpad();
  
  // do your code
  
  // update gamepads (clears arrays, polls connections, etc.)
  gamepads.update();
}
```

All input functions take `player` as an optional final argument. If `player` isn't provided, all controllers will contribute (i.e. a button will be considered down if any controller has them down, an axis will be considered as the sum of the axis on each controller).
