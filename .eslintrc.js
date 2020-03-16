module.exports = {
	"parser": "@typescript-eslint/parser",
	"extends": [
		"airbnb-base",
		"plugin:@typescript-eslint/recommended"
	],
	"plugins": [
		"@typescript-eslint",
	],
	"env": {
		"browser": true
	},
	"parserOptions": {
		"ecmaVersion": 2017,
		"sourceType": "module",
		"ecmaFeatures": {
			"modules": true
		}
	},
	"rules": {
		"max-len": "off", // just apply common-sense
		"no-param-reassign": "off",

		// prefer named
		"import/prefer-default-export": "off",
		"import/no-default-export": "error",

		// stylistic preferences

		// tabs instead of spaces
		"no-tabs": "off",
		"indent": ["error", "tab"],

		"import/extensions": "off",
		"no-multi-assign": "off",
		"no-plusplus": "off",
		"no-continue": "off",
		"lines-between-class-members": "off"
	}
}
