import { execSync } from 'child_process'
import dns from 'dns'
import url from 'url'

function getProxy(): string | undefined {
  if (process.env.https_proxy) {
    return process.env.https_proxy
  }

  try {
    const httpsProxy = execSync('npm config get https-proxy')
      .toString()
      .trim()
    return httpsProxy !== 'null' ? httpsProxy : undefined
  } catch (e) {
    return
  }
}
export default function checkIfOnline(useYarn: boolean): Promise<boolean> {
  if (!useYarn) {
    return Promise.resolve(true)
  }

  return new Promise(resolve => {
    dns.lookup('registry.yarnpkg.com', err => {
      if (!err) return resolve(true)

      const proxy = getProxy()
      if (!proxy) return resolve(false)
      const { hostname } = url.parse(proxy)
      if (!hostname) return resolve(false)
      dns.lookup(hostname, proxyErr => {
        resolve(proxyErr == null)
      })
    })
  })
}
