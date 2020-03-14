var inputGamepads = (function (exports) {
	'use strict';

	(function (Buttons) {
	    // XBOX360 wired controller configuration
	    /* eslint-disable no-unused-vars */
	    Buttons[Buttons["A"] = 0] = "A";
	    Buttons[Buttons["X"] = 2] = "X";
	    Buttons[Buttons["B"] = 1] = "B";
	    Buttons[Buttons["Y"] = 3] = "Y";
	    Buttons[Buttons["LB"] = 4] = "LB";
	    Buttons[Buttons["RB"] = 5] = "RB";
	    Buttons[Buttons["LT"] = 6] = "LT";
	    Buttons[Buttons["RT"] = 7] = "RT";
	    Buttons[Buttons["BACK"] = 8] = "BACK";
	    Buttons[Buttons["START"] = 9] = "START";
	    Buttons[Buttons["LHAT"] = 10] = "LHAT";
	    Buttons[Buttons["RHAT"] = 11] = "RHAT";
	    Buttons[Buttons["DPAD_UP"] = 12] = "DPAD_UP";
	    Buttons[Buttons["DPAD_DOWN"] = 13] = "DPAD_DOWN";
	    Buttons[Buttons["DPAD_LEFT"] = 14] = "DPAD_LEFT";
	    Buttons[Buttons["DPAD_RIGHT"] = 15] = "DPAD_RIGHT";
	    /* eslint-enable no-unused-vars */
	})(exports.Buttons || (exports.Buttons = {}));
	(function (Axes) {
	    /* eslint-disable no-unused-vars */
	    Axes[Axes["LSTICK_H"] = 0] = "LSTICK_H";
	    Axes[Axes["LSTICK_V"] = 1] = "LSTICK_V";
	    Axes[Axes["RSTICK_H"] = 2] = "RSTICK_H";
	    Axes[Axes["RSTICK_V"] = 3] = "RSTICK_V";
	    /* eslint-enable no-unused-vars */
	})(exports.Axes || (exports.Axes = {}));
	var nullGamepad = {
	    original: {
	        axes: [],
	        buttons: [],
	        connected: false,
	    },
	    disabled: true,
	    down: {},
	    justDown: {},
	    justUp: {},
	    axesPrev: {},
	};
	var Gamepads = /** @class */ (function () {
	    /**
	    * initialize gamepads
	    */
	    function Gamepads() {
	        var _this = this;
	        // settings
	        /** if `abs(an axis value)` is < `deadZone`, returns 0 instead */
	        this.deadZone = 0.25;
	        /** if `abs(1-an axis value)` is < `snapZone`, returns 1 instead */
	        this.snapZone = 0.25;
	        /** axis values between `deadZone` and `snapZone` will be run through this function
	        *
	        * defaults to normalizing between the two thresholds */
	        this.interpolate = function (value) {
	            var v = Math.max(0, Math.min(1, (value - _this.deadZone) / (1.0 - _this.snapZone - _this.deadZone)));
	            return v;
	        };
	        // internal vars
	        this.players = [];
	        this.available = false;
	        this.pollEveryFrame = false;
	        this.connected = false;
	        /**
	        * update gamepads (clears arrays, polls connections, etc.)
	        */
	        this.pollconnections = function () {
	            _this.connected = false;
	            // assume existing players' gamepads aren't enabled until they're found
	            for (var i = 0; i < _this.players.length; ++i) {
	                if (_this.players[i]) {
	                    _this.players[i].disabled = true;
	                }
	            }
	            var gps = navigator.getGamepads();
	            for (var i = 0; i < gps.length; ++i) {
	                var gp = gps[i];
	                if (gp) {
	                    if (gp.connected) {
	                        if (_this.players[gp.index] == null) {
	                            // new player
	                            _this.players[gp.index] = {
	                                disabled: false,
	                                original: gp,
	                                down: {},
	                                justDown: {},
	                                justUp: {},
	                                axesPrev: {},
	                            };
	                        }
	                        else {
	                            // returning player, just assign the gamepad
	                            _this.players[gp.index].original = gp;
	                        }
	                        _this.connected = true;
	                        _this.players[gp.index].disabled = false;
	                    }
	                    else {
	                        _this.players[gp.index] = null;
	                    }
	                }
	            }
	        };
	        /**
	        * update gamepads (clears arrays, polls connections, etc.)
	        */
	        this.update = function () {
	            // store the previous axis values
	            // has to be done before pollConnections since that will get the new axis values
	            for (var i = 0; i < _this.players.length; ++i) {
	                var p = _this.getPlayer(i);
	                p.axesPrev = p.original.axes.slice();
	            }
	            // poll connections and update gamepad states every frame because chrome's a lazy bum
	            if (_this.pollEveryFrame) {
	                _this.pollconnections();
	            }
	            for (var i = 0; i < _this.players.length; ++i) {
	                var p = _this.getPlayer(i);
	                if (p && p != null) {
	                    for (var j = 0; j < p.original.buttons.length; ++j) {
	                        if (p.original.buttons[j].pressed) {
	                            p.justDown[j] = !(p.down[j] === true);
	                            p.down[j] = true;
	                            p.justUp[j] = false;
	                        }
	                        else {
	                            p.justUp[j] = p.down[j] === true;
	                            p.down[j] = false;
	                            p.justDown[j] = false;
	                        }
	                    }
	                }
	            }
	        };
	        /**
	        * @returns `player`'s gamepad
	        *
	        * if one doesn't exist, returns an object with gamepad properties reflecting a null state
	        */
	        this.getPlayer = function (player) {
	            if (_this.players[player]
	                && _this.players[player].original.connected
	                && !_this.players[player].disabled) {
	                return _this.players[player];
	            }
	            return nullGamepad;
	        };
	        /**
	        * @returns an array representing `length` axes for `player` at `offset`
	        *
	        * if `abs(an axis value)` is < `deadZone`, returns 0 instead
	        * if `abs(1-an axis value)` is < `snapZone`, returns 1/-1 instead
	        * otherwise, returns the axis value normalized between `deadZone` and `(1-snapZone)`
	        * @param {Number} offset axis index
	        * @param {Number} length number of axes to return
	        * @param {Number} player player index (`undefined` for "sum of all")
	        * @param {boolean} prev if `true` uses axis values from previous update
	        */
	        this.getAxes = function (offset, length, player, prev) {
	            if (offset === void 0) { offset = 0; }
	            if (length === void 0) { length = 2; }
	            if (prev === void 0) { prev = false; }
	            var axes = [];
	            for (var i = 0; i < length; ++i) {
	                axes[i] = 0;
	            }
	            if (player === undefined) {
	                for (var i = 0; i < _this.players.length; ++i) {
	                    var a = _this.getAxes(offset, length, i, prev);
	                    for (var j = 0; j < a.length; ++j) {
	                        axes[j] += a[j];
	                    }
	                }
	            }
	            else {
	                var p = _this.getPlayer(player);
	                var a = prev ? p.axesPrev : p.original.axes;
	                a = Object.values(a).slice(offset, offset + length);
	                for (var i = 0; i < a.length; ++i) {
	                    if (Math.abs(a[i]) < _this.deadZone) {
	                        axes[i] += 0;
	                    }
	                    else if (Math.abs(1.0 - a[i]) < _this.snapZone) {
	                        axes[i] += 1;
	                    }
	                    else if (Math.abs(-1.0 - a[i]) < _this.snapZone) {
	                        axes[i] -= 1;
	                    }
	                    else {
	                        axes[i] += Math.sign(a[i]) * _this.interpolate(Math.abs(a[i]));
	                    }
	                }
	            }
	            return axes;
	        };
	        /**
	       * @returns equivalent to `getAxes(axis, 1, player, prev)[0]`
	       */
	        this.getAxis = function (axis, player, prev) { return _this.getAxes(axis, 1, player, prev)[0]; };
	        /**
	        * @returns `true` if `axis` is past `threshold` in `direction`
	        * @param {Number} axis axis index
	        * @param {Number} threshold threshold (-1 to 1)
	        * @param {Number} direction direction (-1|1) (if `undefined`, assumes the sign of `theshold` is the direction (e.g. if `theshold` is -0.5, it will check if the axis is < -0.5))
	        * @param {Number} player player index (`undefined` for "any")
	        * @param {boolean} prev if `true` uses axis values from previous update
	        */
	        this.axisPast = function (axis, threshold, direction, player, prev) {
	            if (!threshold) {
	                throw new Error('must specify a non-zero threshold');
	            }
	            if (!direction) {
	                direction = threshold > 0 ? 1 : -1;
	            }
	            var a = _this.getAxis(axis, player, prev);
	            return direction < 0 ? a < threshold : a > threshold;
	        };
	        /**
	        * @returns `true` if `axis` is past `threshold` in `direction` and WAS NOT in previous update
	        * @param {Number} axis axis index
	        * @param {Number} threshold threshold (-1 to 1)
	        * @param {Number} direction direction (-1|1) (if `undefined`, assumes the sign of `theshold` is the direction (e.g. if `theshold` is -0.5, it will check if the axis is < -0.5))
	        * @param {Number} player player index (`undefined` for "any")
	        */
	        this.axisJustPast = function (axis, threshold, direction, player) { return _this.axisPast(axis, threshold, direction, player, false)
	            && !_this.axisPast(axis, threshold, direction, player, true); };
	        /**
	        * @returns `[x,y]` representing the dpad for `player`
	        * @param {Number} player player index (`undefined` for "sum of all")
	        */
	        this.getDpad = function (player) {
	            var x = 0;
	            var y = 0;
	            if (player === undefined) {
	                for (var i = 0; i < _this.players.length; ++i) {
	                    var _a = _this.getDpad(i), ix = _a[0], iy = _a[1];
	                    x += ix;
	                    y += iy;
	                }
	            }
	            else {
	                if (_this.isDown(exports.Buttons.DPAD_RIGHT, player)) {
	                    x += 1;
	                }
	                if (_this.isDown(exports.Buttons.DPAD_LEFT, player)) {
	                    x -= 1;
	                }
	                if (_this.isDown(exports.Buttons.DPAD_UP, player)) {
	                    y += 1;
	                }
	                if (_this.isDown(exports.Buttons.DPAD_DOWN, player)) {
	                    y -= 1;
	                }
	            }
	            return [x, y];
	        };
	        /**
	        * @returns `true` if `player`'s `btn` is currently down
	        * @param {Number} btn button index
	        * @param {Number} player player index (`undefined` for "any")
	        */
	        this.isDown = function (btn, player) {
	            if (btn === undefined) {
	                throw new Error('must specify a button');
	            }
	            if (player === undefined) {
	                for (var i = 0; i < _this.players.length; ++i) {
	                    if (_this.isDown(btn, i)) {
	                        return true;
	                    }
	                }
	                return false;
	            }
	            return _this.getPlayer(player).down[btn] === true;
	        };
	        /**
	        * @returns equivalent to `!isDown(btn, player)`
	        * @param {Number} btn button index
	        * @param {Number} player player index (`undefined` for "any")
	        */
	        this.isUp = function (btn, player) { return !_this.isDown(btn, player); };
	        /**
	        * @returns `true` if `player`'s `btn` is currently down and WAS NOT in previous update
	        * @param {Number} btn button index
	        * @param {Number} player player index (`undefined` for "any")
	        */
	        this.isJustDown = function (btn, player) {
	            if (btn === undefined) {
	                throw new Error('must specify a button');
	            }
	            if (player === undefined) {
	                for (var i = 0; i < _this.players.length; ++i) {
	                    if (_this.isJustDown(btn, i)) {
	                        return true;
	                    }
	                }
	                return false;
	            }
	            return _this.getPlayer(player).justDown[btn] === true;
	        };
	        /**
	        * @returns `true` if `player`'s `btn` is currently NOT down and WAS down in previous update
	        * @param {Number} btn button index
	        * @param {Number} player player index (`undefined` for "any")
	        */
	        this.isJustUp = function (btn, player) {
	            if (btn === undefined) {
	                throw new Error('must specify a button');
	            }
	            if (player === undefined) {
	                for (var i = 0; i < _this.players.length; ++i) {
	                    if (_this.isJustUp(btn, i)) {
	                        return true;
	                    }
	                }
	                return false;
	            }
	            return _this.getPlayer(player).justUp[btn] === true;
	        };
	        if (navigator.getGamepads) {
	            this.available = true;
	        }
	        else if (navigator.webkitGetGamepads) {
	            navigator.getGamepads = navigator.webkitGetGamepads;
	            this.available = true;
	        }
	        if (this.available) {
	            console.log('Gamepad API available');
	            if (navigator.userAgent.includes('Firefox')) {
	                // listen to connection events for firefox
	                window.addEventListener('gamepadconnected', this.pollconnections.bind(this));
	                window.addEventListener('gamepaddisconnected', this.pollconnections.bind(this));
	            }
	            else {
	                this.pollEveryFrame = true;
	            }
	        }
	        else {
	            console.error('Gamepad API not available');
	        }
	    }
	    return Gamepads;
	}());

	exports.Gamepads = Gamepads;

	return exports;

}({}));
