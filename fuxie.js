// 📋 基础配置
const baseConfig = {
  mode: 'rule',
  ipv6: true,
  port: 7890,
  'mixed-port': 7891,
  'allow-lan': true,
  'log-level': 'info',
  'find-process-mode': 'strict', // 控制是否让Clash去匹配进程  always开启，强制匹配所有进程  strict默认，由Clash判断是否开启  off不匹配进程，推荐在路由器上使用此模式

  // 🎛️ 外部控制器配置
  'external-controller': '0.0.0.0:9090',
  secret: '123456',
  'external-ui': 'ui',
  'external-ui-name': 'zashboard',
  'external-ui-url': 'https://gh-proxy.com/github.com/Zephyruso/zashboard/archive/refs/heads/gh-pages.zip',

  // 🌐 DNS 配置
  dns: {
    enable: true,
    listen: '0.0.0.0:7874',
    ipv6: true,
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    // 用来解析没有匹配到任何「域名规则」的域名，通常是国外域名，建议使用国外 DoH 防止污染。但这个解析结果并不会用来发起连接，所以为了追求速度不使用 DoH 或直接使用国内 DNS 也行。
    nameserver: ['223.5.5.5', '119.29.29.29', 'https://dns.cloudflare.com/dns-query', 'https://dns.google/dns-query'],
    // 用来解析「DNS 服务器域名」的 DNS，需要直接使用 IP
    'default-nameserver': ['119.29.29.29', '223.5.5.5'],
    'fake-ip-filter': [
      // 国内域名
      'geosite:cn',
      'geosite:connectivity-check',
      'geosite:private',
    ],
    // 用来解析「代理服务器域名」，防止 nameserver 无法访问导致连不上代理。 比如上个月国外 DoH 大规模被墙，很多 nameserver 设置为国外 DoH，又没有设置 proxy-server-nameserver 的人就连不上代理了（我自己就是）。
    'proxy-server-nameserver': ['223.5.5.5', '119.29.29.29', 'https://dns.cloudflare.com/dns-query', 'https://dns.google/dns-query'],
    // 「直连」域名的解析，这里用了 DoH 来防止劫持。直接用运营商的 DNS 也行，愿意自建 smartdns / adgurad home 等服务效果更好。
    'direct-nameserver': ['https://doh.pub/dns-query', 'https://223.5.5.5/dns-query'],
  },

  // 🔗 Tun 配置
  tun: {
    enable: true,
    stack: 'mixed',
    device: 'utun',
    'endpoint-independent-nat': true,
    'auto-route': true,
    'auto-detect-interface': true,
    'auto-redirect': true,
    'strict-route': true,
  },

  // 💾 配置文件设置
  profile: {
    'store-selected': true,
    'store-fake-ip': true,
  },

  // 🔍 流量嗅探配置
  sniffer: {
    enable: true,
    'force-dns-mapping': false,
    'parse-pure-ip': false,
    'override-destination': true,
    sniff: {
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, 8080, 8081, 8090] },
      QUIC: { ports: [443, 8443] },
    },
    'skip-src-address': ['127.0.0.0/8', '192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12'],
    'force-domain': ['+.netflix.com', '+.hbo.com'],
    'skip-domain': ['Mijia Cloud', '+.oray.com'],
  },

  'geo-auto-update': true,
  'geo-update-interval': 24,
  'geodata-mode': true,
  'unified-delay': true, // 开启统一延迟时，会计算 RTT，以消除连接握手等带来的不同类型节点的延迟差异，（不使用统一延迟检测，有些节点前戏太慢了）
  'tcp-concurrent': true, // TCP并发 如果解析出多个ip，同时对所有ip进行连接，返回延迟最低的地址

  // 🗺️ 地理位置数据配置
  geox: {
    geoip: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat',
    geosite: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat',
    mmdb: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb',
    asn: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb',
  },
}

// 🎛️ 延迟测试代理组基础配置模板
const urlTestTemplate = {
  interval: 300, // 延迟测试间隔（秒）
  timeout: 3000, // 超时时间（毫秒）
  url: 'http://www.gstatic.com/generate_204', // 测试 URL
  lazy: true, // 懒加载模式
  'max-failed-times': 3, // 最大失败次数
  hidden: false, // 是否隐藏
}

// 🧠 智能代理组基础配置模板
const smartTemplate = {
  type: 'smart',
  'include-all': true,
  uselightgbm: true, // 使用轻量级GBM算法
  collectdata: true, // 收集延迟数据
  interval: 300, // 延迟测试间隔（秒）
}

const baseProxies = ['智能优选', '延迟选优', '本地直连']

// 🎨 图标基础 URL
const iconsBaseUrl = 'https://raw.githubusercontent.com/Orz-3/mini/master/Color'

// 🚀 主要代理组配置
const mainProxyGroups = [
  {
    ...urlTestTemplate,
    name: '节点选择',
    type: 'select',
    proxies: baseProxies,
    'include-all': true,
    icon: `${iconsBaseUrl}/Global.png`, // 🌐 全局选择
  },

  {
    ...urlTestTemplate,
    name: '手动选择',
    type: 'select',
    proxies: baseProxies,
    'include-all': true,
    icon: `${iconsBaseUrl}/Static.png`, // 🛠️ 手动选择
  },

  {
    ...urlTestTemplate,
    name: '智能优选',
    type: 'smart',
    'include-all': true,
    // 'policy-priority': 'Premium:0.9;SG:1.3',
    uselightgbm: true,
    collectdata: true,
    filter: 'hysteria2',
    strategy: 'sticky-sessions',
    icon: `${iconsBaseUrl}/Speedtest.png`, // 🚀 智能测速
  },
  {
    ...urlTestTemplate,
    name: 'ai',
    type: 'select',
    proxies: ['节点选择', '本地直连'],
    'include-all': true,
    icon: `${iconsBaseUrl}/ASN.png`, // 🤖 AI 机器人
  },
  {
    ...urlTestTemplate,
    name: '延迟选优',
    type: 'url-test',
    tolerance: 100, // 延迟容差
    'include-all': true,
    icon: `${iconsBaseUrl}/Urltest.png`, // ⏱️ 延迟测试
  },
  {
    ...urlTestTemplate,
    name: '本地直连',
    type: 'select',
    proxies: ['DIRECT'],
    'include-all': true,
    icon: `${iconsBaseUrl}/China.png`, // 🇨🇳 直连中国
  },

  {
    ...urlTestTemplate,
    name: '漏网之鱼',
    type: 'select',
    proxies: ['节点选择', '本地直连'],
    'include-all': true,
    icon: `${iconsBaseUrl}/Final.png`, // 兜底流量
  },
]

// 📚 规则提供者配置
const ruleProviders = {
  cn: {
    type: 'http',
    interval: 86400,
    behavior: 'domain',
    format: 'text',
    url: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cn.yaml',
  },
}

// 📋 代理规则配置
const proxyRules = [
  // 🚫 拦截规则 - 最高优先级
  'GEOSITE,category-ads-all,REJECT',

  // 🏠 本地网络规则 - 第二优先级
  'GEOSITE,private,本地直连',

  // 🇨🇳 国内服务直连 - 在代理规则前处理
  'GEOSITE,category-games@cn,本地直连',
  'GEOSITE,microsoft@cn,本地直连',
  'GEOSITE,apple-cn,本地直连',
  'GEOSITE,steam@cn,本地直连',

  // 🤖 AI 服务 - 特殊处理
  'GEOSITE,category-ai-!cn,ai',

  // 🌍 国外服务代理 - 按重要性排序
  'GEOSITE,youtube,节点选择',
  'GEOSITE,google,节点选择',
  'GEOSITE,twitter,节点选择',
  'GEOSITE,github,节点选择',
  'GEOSITE,spotify,节点选择',
  'GEOSITE,onedrive,节点选择',
  'GEOSITE,category-scholar-!cn,节点选择',

  // 🌐 地理位置规则 - 范围较大的规则
  'GEOSITE,geolocation-!cn,节点选择',

  // 🏴 中国网站直连 - 在具体规则后处理
  'GEOSITE,cn,本地直连',

  // 🔗 IP 规则 - 域名规则无法匹配时的备选
  'GEOIP,private,本地直连,no-resolve',
  'GEOIP,CN,本地直连',

  // 🎯 兜底规则 - 必须放在最后
  'MATCH,漏网之鱼',
]

// 🚀 程序主入口函数
function main(config) {
  console.log('🎯 开始处理 Clash 配置...')

  const proxyCount = config?.proxies?.length ?? 0
  const proxyProviderCount = typeof config?.['proxy-providers'] === 'object' ? Object.keys(config['proxy-providers']).length : 0

  console.log(`📊 检测到 ${proxyCount} 个代理节点, ${proxyProviderCount} 个代理提供者`)

  // 验证配置有效性
  if (proxyCount === 0 && proxyProviderCount === 0) {
    console.error('❌ 配置文件中未找到任何代理')
    throw new Error('配置文件中未找到任何代理')
  }

  // 构建最终配置
  const finalConfig = {
    ...baseConfig,
    ...config,
    proxies: config?.proxies || [],
    'proxy-groups': mainProxyGroups,
    'rule-providers': ruleProviders,
    rules: proxyRules,
  }

  console.log('✅ Clash 配置处理完成!')
  return finalConfig
}
