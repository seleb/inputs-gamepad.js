declare global {
    interface Navigator {
        webkitGetGamepads: typeof window.navigator.getGamepads;
    }
}
export declare enum Buttons {
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
}
export declare enum Axes {
    LSTICK_H = 0,
    LSTICK_V = 1,
    RSTICK_H = 2,
    RSTICK_V = 3
}
declare type EnumMap<T extends string | number | symbol, V> = {
    [key in T]: V;
};
declare type ButtonsMap = EnumMap<Buttons, boolean>;
declare type AxesMap = EnumMap<Axes, number>;
export interface GamepadType {
    original?: Partial<Gamepad>;
    disabled: boolean;
    down: ButtonsMap;
    justDown: ButtonsMap;
    justUp: ButtonsMap;
    axesPrev: AxesMap;
}
export declare class Gamepads {
    /** if `abs(an axis value)` is < `deadZone`, returns 0 instead */
    deadZone: number;
    /** if `abs(1-an axis value)` is < `snapZone`, returns 1 instead */
    snapZone: number;
    /** axis values between `deadZone` and `snapZone` will be run through this function
    *
    * defaults to normalizing between the two thresholds */
    interpolate: (value: number) => number;
    players: GamepadType[];
    available: boolean;
    pollEveryFrame: boolean;
    connected: boolean;
    /**
    * initialize gamepads
    */
    constructor();
    /**
    * update gamepads (clears arrays, polls connections, etc.)
    */
    pollconnections: () => void;
    /**
    * update gamepads (clears arrays, polls connections, etc.)
    */
    update: () => void;
    /**
    * @returns `player`'s gamepad
    *
    * if one doesn't exist, returns an object with gamepad properties reflecting a null state
    */
    getPlayer: (player: number) => GamepadType;
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
    getAxes: (offset?: number, length?: number, player?: number, prev?: boolean) => number[];
    /**
   * @returns equivalent to `getAxes(axis, 1, player, prev)[0]`
   */
    getAxis: (axis: Axes, player?: number, prev?: boolean) => number;
    /**
    * @returns `true` if `axis` is past `threshold` in `direction`
    * @param {Number} axis axis index
    * @param {Number} threshold threshold (-1 to 1)
    * @param {Number} direction direction (-1|1) (if `undefined`, assumes the sign of `theshold` is the direction (e.g. if `theshold` is -0.5, it will check if the axis is < -0.5))
    * @param {Number} player player index (`undefined` for "any")
    * @param {boolean} prev if `true` uses axis values from previous update
    */
    axisPast: (axis: Axes, threshold: number, direction: 1 | -1, player?: number, prev?: boolean) => boolean;
    /**
    * @returns `true` if `axis` is past `threshold` in `direction` and WAS NOT in previous update
    * @param {Number} axis axis index
    * @param {Number} threshold threshold (-1 to 1)
    * @param {Number} direction direction (-1|1) (if `undefined`, assumes the sign of `theshold` is the direction (e.g. if `theshold` is -0.5, it will check if the axis is < -0.5))
    * @param {Number} player player index (`undefined` for "any")
    */
    axisJustPast: (axis: Axes, threshold: number, direction: 1 | -1, player?: number) => boolean;
    /**
    * @returns `[x,y]` representing the dpad for `player`
    * @param {Number} player player index (`undefined` for "sum of all")
    */
    getDpad: (player?: number) => number[];
    /**
    * @returns `true` if `player`'s `btn` is currently down
    * @param {Number} btn button index
    * @param {Number} player player index (`undefined` for "any")
    */
    isDown: (btn: Buttons, player?: number) => boolean;
    /**
    * @returns equivalent to `!isDown(btn, player)`
    * @param {Number} btn button index
    * @param {Number} player player index (`undefined` for "any")
    */
    isUp: (btn: Buttons, player?: number) => boolean;
    /**
    * @returns `true` if `player`'s `btn` is currently down and WAS NOT in previous update
    * @param {Number} btn button index
    * @param {Number} player player index (`undefined` for "any")
    */
    isJustDown: (btn: Buttons, player?: number) => boolean;
    /**
    * @returns `true` if `player`'s `btn` is currently NOT down and WAS down in previous update
    * @param {Number} btn button index
    * @param {Number} player player index (`undefined` for "any")
    */
    isJustUp: (btn: Buttons, player?: number) => boolean;
}
export {};
