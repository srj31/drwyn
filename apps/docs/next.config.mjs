import nextra from 'nextra'

const withNextra = nextra({
  contentDirBasePath: '/',
})

export default withNextra({
  reactStrictMode: true,
  basePath: '/docs',
  assetPrefix: '/docs',
})
