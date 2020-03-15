declare global {
	interface Navigator {
		webkitGetGamepads: typeof window.navigator.getGamepads;
	}
}

export enum Buttons {
	// XBOX360 wired controller configuration
	/* eslint-disable no-unused-vars */
	A = 0,
	X = 2,
	B = 1,
	Y = 3,
	LB = 4,
	RB = 5,
	LT = 6,
	RT = 7,
	BACK = 8,
	START = 9,
	LHAT = 10,
	RHAT = 11,
	DPAD_UP = 12,
	DPAD_DOWN = 13,
	DPAD_LEFT = 14,
	DPAD_RIGHT = 15
	/* eslint-enable no-unused-vars */
}

export enum Axes {
	/* eslint-disable no-unused-vars */
	LSTICK_H = 0,
	LSTICK_V = 1,
	RSTICK_H = 2,
	RSTICK_V = 3
	/* eslint-enable no-unused-vars */
}

type EnumMap<T extends string | number | symbol, V> = {
	[key in T]: V;
};

type ButtonsMap = EnumMap<Buttons, boolean>;
type AxesMap = EnumMap<Axes, number>;

export interface GamepadType {
	original?: Partial<Gamepad>;
	disabled: boolean;
	down: ButtonsMap;
	justDown: ButtonsMap;
	justUp: ButtonsMap;
	axesPrev: AxesMap;
}

const nullGamepad: GamepadType = {
	original: {
		axes: [],
		buttons: [],
		connected: false,
	},
	disabled: true,
	down: {} as ButtonsMap,
	justDown: {} as ButtonsMap,
	justUp: {} as ButtonsMap,
	axesPrev: {} as AxesMap,
};

export class Gamepads {
	// settings
	/** if `abs(an axis value)` is < `deadZone`, returns 0 instead */
	deadZone = 0.25;
	/** if `abs(1-an axis value)` is < `snapZone`, returns 1 instead */
	snapZone = 0.25;
	/** axis values between `deadZone` and `snapZone` will be run through this function
	*
	* defaults to normalizing between the two thresholds */
	interpolate = (value: number) => {
		const v = Math.max(
			0,
			Math.min(
				1,
				(value - this.deadZone) / (1.0 - this.snapZone - this.deadZone),
			),
		);
		return v;
	};

	// internal vars
	players: {
		[key: number]: GamepadType;
		[key: string]: GamepadType;
	} = {}

	available = false;
	pollEveryFrame = false;
	connected = false;

	/**
	* initialize gamepads
	*/
	constructor() {
		// @ts-ignore
		if (navigator.getGamepads) {
			this.available = true;
		} else if (navigator.webkitGetGamepads) {
			navigator.getGamepads = navigator.webkitGetGamepads;
			this.available = true;
		}

		if (this.available) {
			console.log('Gamepad API available');
			if (navigator.userAgent.includes('Firefox')) {
				// listen to connection events for firefox
				window.addEventListener(
					'gamepadconnected',
					this.pollconnections.bind(this),
				);
				window.addEventListener(
					'gamepaddisconnected',
					this.pollconnections.bind(this),
				);
			} else {
				this.pollEveryFrame = true;
			}
		} else {
			console.error('Gamepad API not available');
		}
	}

	/**
	* update gamepads (clears arrays, polls connections, etc.)
	*/
	pollconnections = () => {
		this.connected = false;

		// assume existing players' gamepads aren't enabled until they're found
		Object.values(this.players).forEach((player) => {
			player.disabled = true;
		});

		const gps = navigator.getGamepads();
		for (let i = 0; i < gps.length; ++i) {
			const gp = gps[i];
			if (gp) {
				if (gp.connected) {
					if (this.players[gp.index] == null) {
						// new player
						this.players[gp.index] = {
							disabled: false,
							original: gp,
							down: {} as ButtonsMap,
							justDown: {} as ButtonsMap,
							justUp: {} as ButtonsMap,
							axesPrev: {} as AxesMap,
						};
					} else {
						// returning player, just assign the gamepad
						this.players[gp.index].original = gp;
					}
					this.connected = true;
					this.players[gp.index].disabled = false;
				} else {
					delete this.players[gp.index];
				}
			}
		}
	};

	/**
	* update gamepads (clears arrays, polls connections, etc.)
	*/
	update = () => {
		// store the previous axis values
		// has to be done before pollConnections since that will get the new axis values
		Object.keys(this.players).forEach((i) => {
			const p = this.getPlayer(i);
			if (p?.original?.axes) {
				p.axesPrev = p.original.axes.slice() as unknown as AxesMap;
			}
		});

		// poll connections and update gamepad states every frame because chrome's a lazy bum
		if (this.pollEveryFrame) {
			this.pollconnections();
		}

		Object.keys(this.players).forEach((i) => {
			const p = this.getPlayer(i);
			if (p?.original?.buttons) {
				for (let j: Buttons = 0; j < p.original.buttons.length; ++j) {
					if (p.original.buttons[j].pressed) {
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
		});
	};

	/**
	* @returns `player`'s gamepad
	*
	* if one doesn't exist, returns an object with gamepad properties reflecting a null state
	*/
	getPlayer = (player: number | string): GamepadType => {
		if (
			this.players[player]?.original?.connected
			&& !this.players[player]?.disabled
		) {
			return this.players[player];
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
	getAxes = (offset = 0, length = 2, player?: number | string, prev = false) => {
		const axes: number[] = [];
		for (let i = 0; i < length; ++i) {
			axes[i] = 0;
		}
		if (player === undefined) {
			Object.keys(this.players).forEach((i) => {
				const a = this.getAxes(offset, length, i, prev);
				for (let j = 0; j < a.length; ++j) {
					axes[j] += a[j];
				}
			});
		} else {
			const p = this.getPlayer(player);
			if (p?.original) {
				const axesSource = prev ? p.axesPrev : p.original.axes as unknown as AxesMap;
				const a = Object.values(axesSource).slice(offset, offset + length);
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
		}
		return axes;
	};

	/**
   * @returns equivalent to `getAxes(axis, 1, player, prev)[0]`
   */
	getAxis = (axis: Axes, player?: number | string, prev?: boolean) => this.getAxes(axis, 1, player, prev)[0];

	/**
	* @returns `true` if `axis` is past `threshold` in `direction`
	* @param {Number} axis axis index
	* @param {Number} threshold threshold (-1 to 1)
	* @param {Number} direction direction (-1|1) (if `undefined`, assumes the sign of `theshold` is the direction (e.g. if `theshold` is -0.5, it will check if the axis is < -0.5))
	* @param {Number} player player index (`undefined` for "any")
	* @param {boolean} prev if `true` uses axis values from previous update
	*/
	axisPast = (
		axis: Axes,
		threshold: number,
		direction: -1 | 1,
		player?: number | string,
		prev?: boolean,
	) => {
		if (!threshold) {
			throw new Error('must specify a non-zero threshold');
		}

		if (!direction) {
			direction = threshold > 0 ? 1 : -1;
		}

		const a = this.getAxis(axis, player, prev);
		return direction < 0 ? a < threshold : a > threshold;
	};

	/**
	* @returns `true` if `axis` is past `threshold` in `direction` and WAS NOT in previous update
	* @param {Number} axis axis index
	* @param {Number} threshold threshold (-1 to 1)
	* @param {Number} direction direction (-1|1) (if `undefined`, assumes the sign of `theshold` is the direction (e.g. if `theshold` is -0.5, it will check if the axis is < -0.5))
	* @param {Number} player player index (`undefined` for "any")
	*/
	axisJustPast = (
		axis: Axes,
		threshold: number,
		direction: -1 | 1,
		player?: number | string,
	) => this.axisPast(axis, threshold, direction, player, false)
		&& !this.axisPast(axis, threshold, direction, player, true);

	/**
	* @returns `[x,y]` representing the dpad for `player`
	* @param {Number} player player index (`undefined` for "sum of all")
	*/
	getDpad = (player?: number | string) => {
		let x = 0;
		let y = 0;
		if (player === undefined) {
			Object.keys(this.players).forEach(i => {
				const [ix, iy] = this.getDpad(i);
				x += ix;
				y += iy;
			});
		} else {
			if (this.isDown(Buttons.DPAD_RIGHT, player)) {
				x += 1;
			}
			if (this.isDown(Buttons.DPAD_LEFT, player)) {
				x -= 1;
			}
			if (this.isDown(Buttons.DPAD_UP, player)) {
				y += 1;
			}
			if (this.isDown(Buttons.DPAD_DOWN, player)) {
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
	isDown = (btn: Buttons, player?: number | string): boolean => {
		if (btn === undefined) {
			throw new Error('must specify a button');
		}
		if (player === undefined) {
			return Object.keys(this.players).some((i) => this.isDown(btn, i));
		}
		return this.getPlayer(player).down[btn];
	};

	/**
	* @returns equivalent to `!isDown(btn, player)`
	* @param {Number} btn button index
	* @param {Number} player player index (`undefined` for "any")
	*/
	isUp = (btn: Buttons, player?: number | string) => !this.isDown(btn, player);

	/**
	* @returns `true` if `player`'s `btn` is currently down and WAS NOT in previous update
	* @param {Number} btn button index
	* @param {Number} player player index (`undefined` for "any")
	*/
	isJustDown = (btn: Buttons, player?: number | string): boolean => {
		if (btn === undefined) {
			throw new Error('must specify a button');
		}
		if (player === undefined) {
			return Object.keys(this.players).some((i) => this.isJustDown(btn, i));
		}
		return this.getPlayer(player).justDown[btn];
	};

	/**
	* @returns `true` if `player`'s `btn` is currently NOT down and WAS down in previous update
	* @param {Number} btn button index
	* @param {Number} player player index (`undefined` for "any")
	*/
	isJustUp = (btn: Buttons, player?: number | string): boolean => {
		if (btn === undefined) {
			throw new Error('must specify a button');
		}
		if (player === undefined) {
			return Object.keys(this.players).some((i) => this.isJustUp(btn, i));
		}
		return this.getPlayer(player).justUp[btn];
	};
}
