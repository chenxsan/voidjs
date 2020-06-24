module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-class-properties',
  ],
  overrides: [
    {
      test: [
        './packages/htmlgaga/src/Client',
        './packages/htmlgaga/src/devTemplate',
      ],
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              ie: '11',
            },
          },
        ],
        '@babel/preset-typescript',
      ],
    },
  ],
}
