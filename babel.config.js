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
    '@babel/preset-react', // we have tsx
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-class-properties',
  ],
  overrides: [
    {
      test: ['./packages/voidjs/src/Client'],
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
