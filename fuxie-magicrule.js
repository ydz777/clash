// 面板、图标和 Geo 数据使用的 GitHub 下载代理。
const GITHUB_DOWNLOAD_PROXY = 'https://gh-proxy.com'
// Geo 数据下载地址，跟随 MetaCubeX 的最新发布。
const GEO_DATA_RELEASE_URL = `${GITHUB_DOWNLOAD_PROXY}/github.com/MetaCubeX/meta-rules-dat/releases/download/latest`

const baseConfig = {
  // 入站监听
  'mixed-port': 7890,
  'socks-port': 7891,
  port: 7892,
  'bind-address': '*',

  // 局域网访问
  'allow-lan': true,
  'lan-allowed-ips': ['0.0.0.0/0', '::/0'],
  'skip-auth-prefixes': ['127.0.0.1/32'],

  // 通用行为
  mode: 'rule',
  'log-level': 'warning',
  ipv6: false,
  'find-process-mode': 'strict',
  'unified-delay': true,
  'tcp-concurrent': true,

  // 控制接口和面板
  'external-controller': '0.0.0.0:9090',
  secret: '9527',
  'external-ui': 'ui',
  'external-ui-name': 'zashboard',
  'external-ui-url': `${GITHUB_DOWNLOAD_PROXY}/github.com/Zephyruso/zashboard/archive/refs/heads/gh-pages.zip`,

  // Geo 数据按需加载并定期更新。
  'geodata-mode': true,
  'geodata-loader': 'memconservative',
  'geo-auto-update': true,
  'geo-update-interval': 24, // 更新间隔，单位为小时。
  'geox-url': {
    geoip: `${GEO_DATA_RELEASE_URL}/geoip-lite.dat`,
    geosite: `${GEO_DATA_RELEASE_URL}/geosite.dat`,
    mmdb: `${GEO_DATA_RELEASE_URL}/country-lite.mmdb`,
    asn: `${GEO_DATA_RELEASE_URL}/GeoLite2-ASN.mmdb`,
  },

  dns: {
    enable: true,
    ipv6: false,
    listen: '0.0.0.0:7874',
    'use-hosts': false,
    'use-system-hosts': false,
    'prefer-h3': false,
    'respect-rules': false,
    'cache-algorithm': 'arc',

    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',

    // 过滤列表里的域名返回真实 IP。
    'fake-ip-filter-mode': 'blacklist',
    'fake-ip-filter': [
      '+.lan',
      '+.local',
      'time.*.com',
      'ntp.*.com',
      'rule-set:site-private',
      'rule-set:site-cn',
      'rule-set:fakeipfilter_cn',
      'rule-set:fakeipfilter_!cn',
    ],

    // 先用 IP 地址形式的 DNS 解析 DoH 服务器域名。
    'default-nameserver': ['223.5.5.5', '119.29.29.29'],
    nameserver: ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'],
    'proxy-server-nameserver': ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'],
  },

  // TUN 接管系统流量和发往 53 端口的 DNS 请求。
  tun: {
    enable: true,
    stack: 'mixed',
    'auto-route': true,
    'auto-detect-interface': true,
    'strict-route': false,
    'dns-hijack': ['any:53', 'tcp://any:53'],
    mtu: 1460, // 接口允许的最大 IP 包大小，单位为字节。
  },

  // 嗅探用于从连接中还原域名，方便规则命中。
  sniffer: {
    enable: true,
    'parse-pure-ip': true,
    'override-destination': true,
    sniff: {
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, '8080-8880'] },
      QUIC: { ports: [443, 8443] },
    },

    // 小米、蒲公英、Apple 推送这类域名跳过嗅探，避免误判目标。
    'skip-domain': ['+.mi.com', '+.oray.com', '+.push.apple.com'],
    'force-domain': ['+.netflix.com', '+.hbo.com'],
  },

  // 保存面板选择和 Fake-IP 映射，供重启后恢复。
  profile: {
    'store-selected': true,
    'store-fake-ip': true,
  },
}

// 按节点名匹配地区，正则忽略大小写。美国节点的 US 缩写只匹配独立单词。
const REGION_GROUPS = [
  { name: '美国节点', icon: 'US', filter: '(?i)(🇺🇸|美|USA|\\bUS\\b|united[-\\s]?states)' },
  { name: '日本节点', icon: 'JP', filter: '(?i)(🇯🇵|日|jp|japan)' },

  // { name: '香港节点', icon: 'HK', filter: '(?i)(🇭🇰|港|hk|hongkong|hong kong)' },
  // { name: '新加坡节点', icon: 'SG', filter: '(?i)(🇸🇬|新|sg|singapore)' },
  // { name: '台湾节点', icon: 'TW', filter: '(?i)(🇹🇼|台|tw|taiwan|tai wan)' },
]

// 协议测速组按节点名中的协议标记筛选。
const AUTO_PROTOCOL_GROUPS = [
  { name: '自动选择(vless)', filter: '(?i)(vless)', icon: 'Auto' },
  // { name: '自动选择(anytls)', filter: '(?i)(anytls)', icon: 'Auto' },
  // { name: '自动选择(tuic)', filter: '(?i)(tuic)', icon: 'Auto' },
  // { name: '自动选择(hysteria)', filter: '(?i)(hysteria)', icon: 'Auto' },
]

// 选择组按协议、地区的顺序列出可用的测速组。
const SPEED_TEST_GROUP_NAMES = [
  ...AUTO_PROTOCOL_GROUPS.map(({ name }) => name),
  ...REGION_GROUPS.map(({ name }) => name),
]

// 「节点选择」可以引用「手动选择」，反向引用会形成循环。
const MANUAL_SELECTION_PROXIES = [...SPEED_TEST_GROUP_NAMES, '本地直连']
const NODE_SELECTION_PROXIES = ['手动选择', ...MANUAL_SELECTION_PROXIES]

// 面板没有已保存的选择时，业务组使用候选列表的首项。
const DEFAULT_SERVICE_PROXIES = ['节点选择', ...NODE_SELECTION_PROXIES]
const DIRECT_FIRST_PROXIES = [
  '本地直连',
  ...DEFAULT_SERVICE_PROXIES.filter((name) => name !== '本地直连'),
]

const ICON_BASE_URL = `${GITHUB_DOWNLOAD_PROXY}/https://raw.githubusercontent.com/Orz-3/mini/master/Color`
const getIconUrl = (iconName) => `${ICON_BASE_URL}/${iconName}.png`

// 只有测速组发起探测，业务选择组复用测速结果。
const createSpeedTestGroup = ({ name, filter, icon, ...options }) => ({
  url: 'https://www.gstatic.com/generate_204',
  interval: 600, // 两次探测的间隔，单位为秒。
  timeout: 3000, // 单次探测的超时，单位为毫秒。
  lazy: true,
  'max-failed-times': 3,
  type: 'url-test',
  'include-all': true,
  'exclude-type': 'direct',
  name,
  filter,
  icon: getIconUrl(icon),
  ...options,
})

// includeAll 控制是否把订阅节点加入面板的候选列表。
const createSelectGroup = ({ name, icon, proxies = DEFAULT_SERVICE_PROXIES, includeAll = true }) => ({
  type: 'select',
  name,
  proxies,
  icon: getIconUrl(icon),
  'include-all': includeAll,
})

const proxyGroups = [
  createSelectGroup({ name: '节点选择', icon: 'Global', proxies: NODE_SELECTION_PROXIES }),
  createSelectGroup({ name: '手动选择', icon: 'Manual', proxies: MANUAL_SELECTION_PROXIES }),
  ...AUTO_PROTOCOL_GROUPS.map(createSpeedTestGroup),
  ...REGION_GROUPS.map(createSpeedTestGroup),
  createSelectGroup({ name: '本地直连', icon: 'China', proxies: ['DIRECT'], includeAll: false }),

  // 业务组按规则首次引用的顺序排列。
  createSelectGroup({ name: '私有网络', icon: 'China', proxies: DIRECT_FIRST_PROXIES }),
  {
    type: 'select',
    name: '广告拦截',
    proxies: ['REJECT', 'DIRECT'],
    icon: 'https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Advertising.png',
    'include-all': false,
  },
  createSelectGroup({ name: 'AI 服务', icon: 'ASN' }),
  createSelectGroup({ name: 'GitHub', icon: 'github' }),
  createSelectGroup({ name: 'YouTube', icon: 'YouTube' }),
  createSelectGroup({ name: 'Telegram', icon: 'Telegram' }),
  createSelectGroup({ name: 'Google', icon: 'Google' }),
  createSelectGroup({ name: '微软服务', icon: 'Microsoft', proxies: DIRECT_FIRST_PROXIES }),
  createSelectGroup({ name: '苹果服务', icon: 'Apple', proxies: DIRECT_FIRST_PROXIES }),
  createSelectGroup({ name: '国内服务', icon: 'China', proxies: DIRECT_FIRST_PROXIES }),
  createSelectGroup({ name: '非中国', icon: 'Global' }),
  createSelectGroup({ name: '漏网之鱼', icon: 'Final', proxies: ['节点选择', '本地直连'], includeAll: false }),
]

// MetaCubeX 的 meta 分支提供域名和 IP 分流规则。
const META_RULE_BASE_URL = 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo'

// DNS 的 fake-IP 例外清单单独取自 qichiyuhub。
const FAKE_IP_FILTER_BASE_URL = 'https://raw.githubusercontent.com/qichiyuhub/rule/refs/heads/main/rules'

const createRoutingRuleProvider = (name, resourcePath, behavior) => ({
  type: 'http',
  behavior,
  format: 'yaml',
  url: `${META_RULE_BASE_URL}/${resourcePath}.yaml`,
  path: `./ruleset/${name}.yaml`,
  interval: 86400, // Mihomo 以秒为单位，每天更新一次规则集。
  proxy: '节点选择',
})

const createDomainProvider = (resourceName, name = resourceName) =>
  createRoutingRuleProvider(`site-${name}`, `geosite/${resourceName}`, 'domain')
const createIpProvider = (name) => createRoutingRuleProvider(`ip-${name}`, `geoip/${name}`, 'ipcidr')

const createFakeIpFilterProvider = (name) => ({
  type: 'http',
  behavior: 'domain',
  format: 'text',
  url: `${FAKE_IP_FILTER_BASE_URL}/${name}.list`,
  interval: 86400,
})

const builtInRuleProviders = {
  'site-private': createDomainProvider('private'),
  'ip-private': createIpProvider('private'),
  'site-category-ads-all': createDomainProvider('category-ads-all'),
  'site-openai': createDomainProvider('openai'),
  'site-anthropic': createDomainProvider('anthropic'),
  'site-google-gemini': createDomainProvider('google-gemini'),
  'site-category-ai-not-cn': createDomainProvider('category-ai-!cn', 'category-ai-not-cn'),
  'site-github': createDomainProvider('github'),
  'site-youtube': createDomainProvider('youtube'),
  'site-telegram': createDomainProvider('telegram'),
  'ip-telegram': createIpProvider('telegram'),
  'site-google': createDomainProvider('google'),
  'ip-google': createIpProvider('google'),
  'site-onedrive': createDomainProvider('onedrive'),
  'site-microsoft': createDomainProvider('microsoft'),
  'site-apple': createDomainProvider('apple'),
  'site-cn': createDomainProvider('cn'),
  'ip-cn': createIpProvider('cn'),
  'site-geolocation-not-cn': createDomainProvider('geolocation-!cn', 'geolocation-not-cn'),

  // 这两份额外清单只用于 DNS 的 Fake-IP 过滤。
  fakeipfilter_cn: createFakeIpFilterProvider('fakeipfilter-cn'),
  'fakeipfilter_!cn': createFakeIpFilterProvider('fakeipfilter-!cn'),
}

// Mihomo 从上往下匹配规则，命中后使用对应分流组。
const proxyRules = [
  'RULE-SET,site-private,私有网络',
  'RULE-SET,ip-private,私有网络,no-resolve',
  'RULE-SET,site-category-ads-all,广告拦截',
  'RULE-SET,site-openai,AI 服务',
  'RULE-SET,site-anthropic,AI 服务',
  'RULE-SET,site-google-gemini,AI 服务',
  'RULE-SET,site-category-ai-not-cn,AI 服务',
  'RULE-SET,site-github,GitHub',
  'RULE-SET,site-youtube,YouTube',
  'RULE-SET,site-telegram,Telegram',
  'RULE-SET,ip-telegram,Telegram,no-resolve',
  'RULE-SET,site-google,Google',
  'RULE-SET,ip-google,Google,no-resolve',
  'RULE-SET,site-onedrive,微软服务',
  'RULE-SET,site-microsoft,微软服务',
  'RULE-SET,site-apple,苹果服务',
  'RULE-SET,site-cn,国内服务',
  'RULE-SET,ip-cn,国内服务,no-resolve',
  'RULE-SET,site-geolocation-not-cn,非中国',
  'MATCH,漏网之鱼',
]

// 客户端调用这个入口合并订阅和覆写配置。
function main(config) {
  console.log('🚀 开始生成 Clash 配置')

  // 订阅可以直接提供节点，也可以用代理提供者在运行时加载节点。
  const proxies = Array.isArray(config?.proxies) ? config.proxies : []
  const proxyProviders = config?.['proxy-providers']
  let proxyProviderCount = 0
  if (proxyProviders && typeof proxyProviders === 'object') {
    proxyProviderCount = Object.keys(proxyProviders).length
  }

  console.log(`📦 输入配置: ${proxies.length} 个代理节点 / ${proxyProviderCount} 个代理提供者`)

  if (proxies.length === 0 && proxyProviderCount === 0) {
    console.error('⛔ 未找到代理节点或代理提供者，无法生成配置')
    throw new Error('配置文件中未找到任何代理')
  }

  console.log('🧩 合并内置代理组、规则和基础配置')

  // 内置规则集固定顺序，同名订阅规则集由脚本配置覆盖。
  const subscriptionRuleProviders = { ...config['rule-providers'] }
  for (const name of Object.keys(builtInRuleProviders)) {
    delete subscriptionRuleProviders[name]
  }

  const finalConfig = {
    ...config,
    ...baseConfig,

    // 这几个模块整体使用模板，每次生成都单独复制它们的顶层字段。
    dns: { ...baseConfig.dns },
    tun: { ...baseConfig.tun },
    sniffer: { ...baseConfig.sniffer },
    profile: { ...baseConfig.profile },

    proxies,
    'proxy-groups': proxyGroups,

    'rule-providers': {
      ...builtInRuleProviders,
      ...subscriptionRuleProviders,
    },
    rules: proxyRules,
  }

  console.log(`✅ 配置生成完成: ${proxyGroups.length} 个代理组 / ${proxyRules.length} 条规则`)
  return finalConfig
}
