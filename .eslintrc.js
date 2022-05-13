exports = module.exports = {
	env: {
		browser: true,
		es6: true,
	},
	globals: {
		Atomics: 'readonly',
		SharedArrayBuffer: 'readonly',
	},
	parser: '@typescript-eslint/parser',
	overrides: [
		{
			files: ['*.ts', '*.tsx'],
			extends: [
				'plugin:@typescript-eslint/recommended',
				'plugin:@typescript-eslint/recommended-requiring-type-checking',
			],
			parserOptions: {
				project: ['tsconfig.json'],
			},
		},
	],
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
		allowImportExportEverywhere: true,

		// Tell eslint to expect JSX in the project
		ecmaFeatures: {
			jsx: true,
		},
	},
	extends: ['eslint:recommended'],
	plugins: [
		'react', // jsx lint rules come from here,
		'react-hooks',
		'@typescript-eslint',
		'unused-imports',
	],
	rules: {
		'@typescript-eslint/indent': 'off',
		'linebreak-style': ['error', 'unix'],
		quotes: ['error', 'single', { avoidEscape: true }],
		semi: ['error', 'always'],
		curly: 'error',
		'key-spacing': ['error', { mode: 'strict' }],
		'keyword-spacing': ['error', { before: true, after: true }],
		'no-trailing-spaces': 2,
		'no-unused-vars': 'off',
		'space-infix-ops': ['error'],
		'unused-imports/no-unused-imports': 'error',
		'@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
		'react/jsx-uses-vars': 1, // eslint doesn't count JSX usage as import usage by default, this fixes that
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': [
			'error',
			{
				additionalHooks: 'use.*?Effect',
			},
		],
	},
	/*
		We don't use jest, but the preact eslint plugin includes it.
		This is necessary to prevent it from throwing meaningless errors.
		https://github.com/preactjs/eslint-config-preact/issues/19#issuecomment-997924892
	*/
	settings: {
		jest: { version: 27 },
	},
};
