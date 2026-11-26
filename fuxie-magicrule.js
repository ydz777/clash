// 面板、图标和 Geo 数据使用的 GitHub 下载代理。
const GITHUB_DOWNLOAD_PROXY = 'https://gh-proxy.com'
// Geo 数据下载地址，跟随 MetaCubeX 的最新发布。
const GEO_DATA_RELEASE_URL = `${GITHUB_DOWNLOAD_PROXY}/github.com/MetaCubeX/meta-rules-dat/releases/download/latest`
// 测速探测地址，返回 204 即可判断连通和延迟。
const URL_TEST = 'https://www.gstatic.com/generate_204'

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
    'fake-ip-filter': ['+.lan', '+.local', 'time.*.com', 'ntp.*.com', 'rule-set:site-private', 'rule-set:site-cn', 'rule-set:fakeipfilter_cn', 'rule-set:fakeipfilter_!cn'],

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

// 按节点名匹配地区，正则忽略大小写。US 前后可以是下划线、连字符或数字，避免把 AUS、USB 收进来。
const REGION_GROUPS = [
  { name: '美国节点', icon: 'US', filter: '(?i)(🇺🇸|美|USA|(^|[^A-Za-z])US([^A-Za-z]|$)|united[-\\s]?states)' },
  { name: '日本节点', icon: 'JP', filter: '(?i)(🇯🇵|日|jp|japan)' },

  // { name: '香港节点', icon: 'HK', filter: '(?i)(🇭🇰|港|hk|hongkong|hong kong)' },
  // { name: '新加坡节点', icon: 'SG', filter: '(?i)(🇸🇬|新|sg|singapore)' },
  // { name: '台湾节点', icon: 'TW', filter: '(?i)(🇹🇼|台|tw|taiwan|tai wan)' },
]

const REGION_GROUP_NAMES = REGION_GROUPS.map(({ name }) => name)

// 手动选择独立保留，业务组可以跳过节点选择，固定使用手动出口。
const MANUAL_SELECTION_PROXIES = [...REGION_GROUP_NAMES, '本地直连']
const EXTRA_SERVICE_PROXIES = ['手动选择', ...REGION_GROUP_NAMES]
const OPENAI_AND_CLAUDE_PROXIES = ['节点选择', '手动选择', ...MANUAL_SELECTION_PROXIES]

// 保留参考配置的候选顺序，在业务组末尾补上手动和地区出口。
const PROXY_FIRST_PROXIES = ['节点选择', '自动选择', 'DIRECT', 'REJECT']
const DIRECT_FIRST_PROXIES = ['DIRECT', '节点选择', '自动选择', 'REJECT']
const SERVICE_PROXIES = [...PROXY_FIRST_PROXIES, ...EXTRA_SERVICE_PROXIES]
const DIRECT_SERVICE_PROXIES = [...DIRECT_FIRST_PROXIES, ...EXTRA_SERVICE_PROXIES]

const ICON_BASE_URL = `${GITHUB_DOWNLOAD_PROXY}/https://raw.githubusercontent.com/Orz-3/mini/master/Color`
const getIconUrl = (iconName) => `${ICON_BASE_URL}/${iconName}.png`
const getReferenceIcon = (name) => `https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/${name}.png`

// 只有测速组发起探测，业务选择组复用测速结果。
const createSpeedTestGroup = ({ name, filter, icon, ...options }) => ({
  url: URL_TEST,
  interval: 600,
  timeout: 3000,
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
const createSelectGroup = ({ name, icon, proxies = SERVICE_PROXIES, includeAll = true }) => ({ type: 'select', name, icon, proxies, 'include-all': includeAll })

const proxyGroups = [
  createSelectGroup({ name: '节点选择', icon: getReferenceIcon('Proxy'), proxies: ['自动选择', ...EXTRA_SERVICE_PROXIES, 'DIRECT'] }),
  createSelectGroup({ name: '手动选择', icon: getIconUrl('Manual'), proxies: MANUAL_SELECTION_PROXIES }),
  { name: '自动选择', type: 'url-test', 'include-all': true, url: URL_TEST, interval: 300, icon: getReferenceIcon('Auto') },
  ...REGION_GROUPS.map(createSpeedTestGroup),
  createSelectGroup({ name: '私有网络', icon: getReferenceIcon('WiFi'), proxies: DIRECT_FIRST_PROXIES }),
  createSelectGroup({ name: '广告拦截', icon: getReferenceIcon('Advertising'), proxies: ['REJECT', 'DIRECT'] }),
  createSelectGroup({ name: 'AI 服务', icon: getReferenceIcon('AI') }),
  createSelectGroup({ name: 'OpenAI', icon: getIconUrl('ASN'), proxies: OPENAI_AND_CLAUDE_PROXIES }),
  createSelectGroup({ name: 'Claude', icon: getIconUrl('ASN'), proxies: OPENAI_AND_CLAUDE_PROXIES }),
  createSelectGroup({ name: 'GitHub', icon: getReferenceIcon('GitHub') }),
  createSelectGroup({ name: 'YouTube', icon: getReferenceIcon('YouTube') }),
  createSelectGroup({ name: 'Telegram', icon: getReferenceIcon('Telegram') }),
  createSelectGroup({ name: 'Google', icon: getReferenceIcon('Google_Search') }),
  createSelectGroup({ name: '微软服务', icon: getReferenceIcon('Microsoft'), proxies: DIRECT_SERVICE_PROXIES }),
  createSelectGroup({ name: '苹果服务', icon: getReferenceIcon('Apple'), proxies: DIRECT_SERVICE_PROXIES }),
  createSelectGroup({ name: '国内服务', icon: getReferenceIcon('China'), proxies: DIRECT_FIRST_PROXIES }),
  createSelectGroup({ name: '非中国', icon: getReferenceIcon('Global'), proxies: PROXY_FIRST_PROXIES }),
  createSelectGroup({ name: '本地直连', icon: getIconUrl('China'), proxies: ['DIRECT'], includeAll: false }),
  createSelectGroup({ name: '漏网之鱼', icon: getReferenceIcon('Final'), proxies: PROXY_FIRST_PROXIES }),
]

// MetaCubeX 的 meta 分支提供域名和 IP 分流规则。
const META_RULE_BASE_URL = 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta'

// DNS 的 fake-IP 例外清单单独取自 qichiyuhub。
const FAKE_IP_FILTER_BASE_URL = 'https://raw.githubusercontent.com/qichiyuhub/rule/refs/heads/main/rules'

const createRuleProvider = (url, behavior, format = 'mrs') => ({
  type: 'http',
  interval: 86400, // Mihomo 以秒为单位，每天更新一次规则集。
  behavior,
  format,
  url,
})

const createDomainProvider = (name) => createRuleProvider(`${META_RULE_BASE_URL}/geo/geosite/${name}.mrs`, 'domain')
const createIpProvider = (name, geoDirectory = 'geo') => createRuleProvider(`${META_RULE_BASE_URL}/${geoDirectory}/geoip/${name}.mrs`, 'ipcidr')

const builtInRuleProviders = {
  'site-private': createDomainProvider('private'),
  'site-category-ads-all': createDomainProvider('category-ads-all'),
  'site-openai': createDomainProvider('openai'),
  'site-anthropic': createDomainProvider('anthropic'),
  'site-google-gemini': createDomainProvider('google-gemini'),
  'site-category-ai-not-cn': createDomainProvider('category-ai-!cn'),
  'site-youtube': createDomainProvider('youtube'),
  'site-google': createDomainProvider('google'),
  'site-github': createDomainProvider('github'),
  'site-onedrive': createDomainProvider('onedrive'),
  'site-microsoft-cn': createDomainProvider('microsoft@cn'),
  'site-microsoft': createDomainProvider('microsoft'),
  'site-apple-cn': createDomainProvider('apple@cn'),
  'site-apple': createDomainProvider('apple'),
  'site-telegram': createDomainProvider('telegram'),
  'site-geolocation-not-cn': createDomainProvider('geolocation-!cn'),

  'ip-private': createIpProvider('private'),
  'ip-google': createIpProvider('google'),
  'ip-apple': createIpProvider('apple', 'geo-lite'), // Apple IP 规则使用精简数据集。
  'ip-telegram': createIpProvider('telegram'),
  'ip-cn': createIpProvider('cn'),

  // 中国域名规则同时用于直连分流和 DNS 的 Fake-IP 过滤。
  'site-cn': createRuleProvider(`${GITHUB_DOWNLOAD_PROXY}/${META_RULE_BASE_URL}/geo/geosite/cn.mrs`, 'domain'),
  // 以下两份规则集仅供 DNS 的 Fake-IP 过滤使用。
  fakeipfilter_cn: createRuleProvider(`${FAKE_IP_FILTER_BASE_URL}/fakeipfilter-cn.list`, 'domain', 'text'),
  'fakeipfilter_!cn': createRuleProvider(`${FAKE_IP_FILTER_BASE_URL}/fakeipfilter-!cn.list`, 'domain', 'text'),
}

// 沿用参考配置的顺序，额外规则放在会覆盖它们的通用规则之前。
const proxyRules = [
  'RULE-SET,site-private,私有网络',
  'RULE-SET,ip-private,私有网络,no-resolve',
  'RULE-SET,site-category-ads-all,广告拦截',

  // OpenAI、Claude 保留独立出口，Gemini 和其他 AI 服务走公共组。
  'RULE-SET,site-openai,OpenAI',
  'RULE-SET,site-anthropic,Claude',
  'RULE-SET,site-google-gemini,AI 服务',
  'RULE-SET,site-category-ai-not-cn,AI 服务',
  'RULE-SET,site-github,GitHub',
  'RULE-SET,site-youtube,YouTube',
  'RULE-SET,site-telegram,Telegram',
  'RULE-SET,ip-telegram,Telegram,no-resolve',
  'RULE-SET,site-google,Google',
  'RULE-SET,ip-google,Google,no-resolve',

  // 微软和 Apple 的国内域名先直连，再匹配各自的完整规则集。
  'RULE-SET,site-microsoft-cn,本地直连',
  'RULE-SET,site-onedrive,微软服务',
  'RULE-SET,site-microsoft,微软服务',
  'RULE-SET,site-apple-cn,本地直连',
  'RULE-SET,site-apple,苹果服务',
  'RULE-SET,ip-apple,苹果服务,no-resolve',

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

    // 同名规则集以脚本为准，其余订阅规则集继续保留。
    'rule-providers': {
      ...config['rule-providers'],
      ...builtInRuleProviders,
    },
    rules: proxyRules,
  }

  console.log(`✅ 配置生成完成: ${proxyGroups.length} 个代理组 / ${proxyRules.length} 条规则`)
  return finalConfig
}
