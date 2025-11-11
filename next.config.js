module.exports = {
  async redirects() {
    return [
      {
        source: '/research/climate-risk',
        destination: '/',
        permanent: false,
      },
    ]
  },
}
