const nullGamepad = {
	connected: false,
	disabled: true,
	down: [],
	justDown: [],
	justUp: [],
	axes: [],
	axesPrev: [],
	buttons: [],
};

const gamepads = {
	// XBOX360 wired controller configuration
	// buttons
	A: 0,
	X: 2,
	B: 1,
	Y: 3,
	LB: 4,
	RB: 5,
	LT: 6,
	RT: 7,
	BACK: 8,
	START: 9,
	LHAT: 10,
	RHAT: 11,
	DPAD_UP: 12,
	DPAD_DOWN: 13,
	DPAD_LEFT: 14,
	DPAD_RIGHT: 15,

	// axes
	LSTICK_H: 0,
	LSTICK_V: 1,
	RSTICK_H: 2,
	RSTICK_V: 3,

	// settings
	/** if `abs(an axis value)` is < `deadZone`, returns 0 instead */
	deadZone: 0.25, // 
	/** if `abs(1-an axis value)` is < `snapZone`, returns 1 instead */
	snapZone: 0.25,
	/** axis values between `deadZone` and `snapZone` will be run through this function
	 *
	 * defaults to normalizing between the two thresholds */
	interpolate: function(value) {
		const v = Math.max(0, Math.min(1, (value - this.deadZone) / (1.0 - this.snapZone - this.deadZone)));
		return v;
	},

	// internal vars
	players: [],

	available: false,
	pollEveryFrame: false,
	connected: false,

	/**
	 * initialize gamepads
	 * (only call once per session)
	 */
	init: function () {
		if (navigator.getGamepads) {
			this.available = true;
		} else if (navigator.webkitGetGamepads) {
			navigator.getGamepads = navigator.webkitGetGamepads;
			this.available = true;
		}

		if (this.available) {
			console.log("Gamepad API available");
			if (navigator.userAgent.includes('Firefox')) {
				// listen to connection events for firefox
				window.addEventListener("gamepadconnected", this.pollconnections.bind(this));
				window.addEventListener("gamepaddisconnected", this.pollconnections.bind(this));
			} else {
				this.pollEveryFrame = true;
			}
		} else {
			console.error("Gamepad API not available");
		}
	},

	/**
	 * update gamepads (clears arrays, polls connections, etc.)
	 */
	pollconnections: function () {
		this.connected = false;

		// assume existing players' gamepads aren't enabled until they're found
		for (let i = 0; i < this.players.length; ++i) {
			if (this.players[i]) {
				this.players[i].disabled = true;
			}
		}

		const gps = navigator.getGamepads();
		for (let i = 0; i < gps.length; ++i) {
			const gp = gps[i];
			if (gp) {
				if (gp.connected) {
					if (this.players[gp.index] == null) {
						// new player
						gp.down = [];
						gp.justDown = [];
						gp.justUp = [];
						gp.axesPrev = [];
						this.players[gp.index] = gp;
					} else {
						// returning player, copy old button states before replacing
						gp.down = this.players[gp.index].down;
						gp.justDown = this.players[gp.index].justDown;
						gp.justUp = this.players[gp.index].justUp;
						gp.axesPrev = this.players[gp.index].axesPrev;
						this.players[gp.index] = gp;
					}
					this.connected = true;
					this.players[gp.index].disabled = false;
				} else {
					this.players[gp.index] = null;
				}
			}
		}
	},

	/**
	 * update gamepads (clears arrays, polls connections, etc.)
	 */
	update: function () {
		// store the previous axis values
		// has to be done before pollConnections since that will get the new axis values
		for (let i = 0; i < this.players.length; ++i) {
			const p = this.getPlayer(i);
			p.axesPrev = p.axes.slice();
		}

		// poll connections and update gamepad states every frame because chrome's a lazy bum
		if (this.pollEveryFrame) {
			this.pollconnections();
		}

		for (let i = 0; i < this.players.length; ++i) {
			const p = this.getPlayer(i);
			if (p && p != null) {
				for (let j = 0; j < p.buttons.length; ++j) {
					if (p.buttons[j].pressed) {
						p.justDown[j] = !(p.down[j] === true);
						p.down[j] = true;
						p.justUp[j] = false;
					} else {
						p.justUp[j] = p.down[j] === true;
						p.down[j] = false;
						p.justDown[j] = false;
					}
				}
			}

		}
	},

	/**
	 * @returns `player`'s gamepad
	 * 
	 * if one doesn't exist, returns an object with gamepad properties reflecting a null state
	 */
	getPlayer: function (player) {
		if (this.players[player] && this.players[player].connected && !this.players[player].disabled) {
			return this.players[player];
		} else {
			return nullGamepad;
		}
	},

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
	getAxes: function (
		offset = 0,
		length = 2,
		player,
		prev = false
	) {
		const axes = [];
		for (let i = 0; i < length; ++i) {
			axes[i] = 0;
		}
		if (player === undefined) {
			for (let i = 0; i < this.players.length; ++i) {
				const a = this.getAxes(offset, length, i, prev);
				for (let j = 0; j < a.length; ++j) {
					axes[j] += a[j];
				}
			}
		} else {
			const p = this.getPlayer(player);
			let a = prev ? p.axesPrev : p.axes;
			a = a.slice(offset, offset + length);
			for (let i = 0; i < a.length; ++i) {
				if (Math.abs(a[i]) < this.deadZone) {
					axes[i] += 0;
				} else if (Math.abs(1.0 - a[i]) < this.snapZone) {
					axes[i] += 1;
				} else if (Math.abs(-1.0 - a[i]) < this.snapZone) {
					axes[i] -= 1;
				} else {
					axes[i] += Math.sign(a[i]) * this.interpolate(Math.abs(a[i]));
				}
			}
		}
		return axes;
	},

	/**
	 * @returns equivalent to `getAxes(axis, 1, player, prev)[0]`
	 */
	getAxis: function (axis, player, prev) {
		return this.getAxes(axis, 1, player, prev)[0];
	},

	/**
	 * @returns `true` if `axis` is past `threshold` in `direction`
	 * @param {Number} axis axis index
	 * @param {Number} threshold threshold (-1 to 1)
	 * @param {Number} direction direction (-1|1) (if `undefined`, assumes the sign of `theshold` is the direction (e.g. if `theshold` is -0.5, it will check if the axis is < -0.5))
	 * @param {Number} player player index (`undefined` for "any")
	 * @param {boolean} prev if `true` uses axis values from previous update
	 */
	axisPast: function (axis, threshold, direction, player, prev) {
		if (!threshold) {
			throw new Error('must specify a non-zero threshold');
		}

		if (!direction) {
			direction = Math.sign(threshold);
		}

		const a = this.getAxis(axis, player, prev);
		return direction < 0 ? a < threshold : a > threshold;
	},

	/**
	 * @returns `true` if `axis` is past `threshold` in `direction` and WAS NOT in previous update
	 * @param {Number} axis axis index
	 * @param {Number} threshold threshold (-1 to 1)
	 * @param {Number} direction direction (-1|1) (if `undefined`, assumes the sign of `theshold` is the direction (e.g. if `theshold` is -0.5, it will check if the axis is < -0.5))
	 * @param {Number} player player index (`undefined` for "any")
	 */
	axisJustPast: function (axis, threshold, direction, player) {
		return this.axisPast(axis, threshold, direction, player, false) && !this.axisPast(axis, threshold, direction, player, true);
	},

	/**
	 * @returns `[x,y]` representing the dpad for `player`
	 * @param {Number} player player index (`undefined` for "sum of all")
	 */
	getDpad: function (player) {
		let x = 0;
		let y = 0;
		if (player === undefined) {
			for (let i = 0; i < this.players.length; ++i) {
				const [ix, iy] = this.getDpad(i);
				x += ix;
				y += iy;
			}
		} else {
			if (this.isDown(this.DPAD_RIGHT, player)) {
				x += 1;
			}
			if (this.isDown(this.DPAD_LEFT, player)) {
				x -= 1;
			}
			if (this.isDown(this.DPAD_UP, player)) {
				y += 1;
			}
			if (this.isDown(this.DPAD_DOWN, player)) {
				y -= 1;
			}
		}
		return [x, y];
	},

	/**
	 * @returns `true` if `player`'s `btn` is currently down
	 * @param {Number} btn button index
	 * @param {Number} player player index (`undefined` for "any")
	 */
	isDown: function (btn, player) {
		if (btn === undefined) {
			throw new Error('must specify a button');
		}
		if (player === undefined) {
			for (let i = 0; i < this.players.length; ++i) {
				if (this.isDown(btn, i)) {
					return true;
				}
			}
			return false;
		} else {
			return this.getPlayer(player).down[btn] === true;
		}
	},

	/**
	 * @returns equivalent to `!isDown(btn, player)`
	 * @param {Number} btn button index
	 * @param {Number} player player index (`undefined` for "any")
	 */
	isUp: function (btn, player) {
		return !this.isDown(btn, player);
	},

	/**
	 * @returns `true` if `player`'s `btn` is currently down and WAS NOT in previous update
	 * @param {Number} btn button index
	 * @param {Number} player player index (`undefined` for "any")
	 */
	isJustDown: function (btn, player) {
		if (btn === undefined) {
			throw new Error('must specify a button');
		}
		if (player === undefined) {
			for (var i = 0; i < this.players.length; ++i) {
				if (this.isJustDown(btn, i)) {
					return true;
				}
			}
			return false;
		} else {
			return this.getPlayer(player).justDown[btn] === true;
		}
	},

	/**
	 * @returns `true` if `player`'s `btn` is currently NOT down and WAS down in previous update
	 * @param {Number} btn button index
	 * @param {Number} player player index (`undefined` for "any")
	 */
	isJustUp: function (btn, player) {
		if (btn === undefined) {
			throw new Error('must specify a button');
		}
		if (player === undefined) {
			for (let i = 0; i < this.players.length; ++i) {
				if (this.isJustUp(btn, i)) {
					return true;
				}
			}
			return false;
		}
		return this.getPlayer(player).justUp[btn] === true;
	}
};

export default gamepads;
