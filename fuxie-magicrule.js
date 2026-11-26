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
      'rule-set:private_domain',
      'rule-set:cn_domain',
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

  createSelectGroup({ name: 'OpenAI', icon: 'ASN' }),
  createSelectGroup({ name: 'Claude', icon: 'ASN' }),
  createSelectGroup({ name: 'AI', icon: 'ASN' }),
  createSelectGroup({ name: 'youtube', icon: 'YouTube' }),
  createSelectGroup({ name: 'google', icon: 'Google' }),
  createSelectGroup({ name: 'GitHub', icon: 'github' }),
  createSelectGroup({ name: 'Microsoft', icon: 'Microsoft', proxies: DIRECT_FIRST_PROXIES }),
  createSelectGroup({ name: 'Apple', icon: 'Apple', proxies: DIRECT_FIRST_PROXIES }),
  createSelectGroup({ name: 'Telegram', icon: 'Telegram' }),

  createSelectGroup({ name: '本地直连', icon: 'China', proxies: ['DIRECT'], includeAll: false }),
  ...REGION_GROUPS.map(createSpeedTestGroup),
  createSelectGroup({ name: '漏网之鱼', icon: 'Final', proxies: ['节点选择', '本地直连'], includeAll: false }),
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
const createIpProvider = (name, geoDirectory = 'geo') =>
  createRuleProvider(`${META_RULE_BASE_URL}/${geoDirectory}/geoip/${name}.mrs`, 'ipcidr')

const builtInRuleProviders = {
  private_domain: createDomainProvider('private'),
  openai_domain: createDomainProvider('openai'),
  anthropic_domain: createDomainProvider('anthropic'),
  ai_domain: createDomainProvider('category-ai-!cn'),
  youtube_domain: createDomainProvider('youtube'),
  google_domain: createDomainProvider('google'),
  github_domain: createDomainProvider('github'),
  microsoftcn_domain: createDomainProvider('microsoft@cn'),
  microsoft_domain: createDomainProvider('microsoft'),
  applecn_domain: createDomainProvider('apple@cn'),
  apple_domain: createDomainProvider('apple'),
  telegram_domain: createDomainProvider('telegram'),
  'cn!_domain': createDomainProvider('geolocation-!cn'),

  private_ip: createIpProvider('private'),
  google_ip: createIpProvider('google'),
  apple_ip: createIpProvider('apple', 'geo-lite'), // Apple IP 规则使用精简数据集。
  telegram_ip: createIpProvider('telegram'),
  cn_ip: createIpProvider('cn'),

  // 这三份规则集仅供 DNS 的 fake-IP 过滤使用。
  cn_domain: createRuleProvider(`${GITHUB_DOWNLOAD_PROXY}/${META_RULE_BASE_URL}/geo/geosite/cn.mrs`, 'domain'),
  fakeipfilter_cn: createRuleProvider(`${FAKE_IP_FILTER_BASE_URL}/fakeipfilter-cn.list`, 'domain', 'text'),
  'fakeipfilter_!cn': createRuleProvider(`${FAKE_IP_FILTER_BASE_URL}/fakeipfilter-!cn.list`, 'domain', 'text'),
}

// 规则从上往下匹配，具体业务规则放在境内外兜底规则之前。
const proxyRules = [
  'RULE-SET,private_ip,本地直连,no-resolve',
  'RULE-SET,private_domain,本地直连',

  // OpenAI、Claude 可以独立选节点，其余命中 AI 规则的域名走公共组。
  'RULE-SET,openai_domain,OpenAI',
  'RULE-SET,anthropic_domain,Claude',
  'RULE-SET,ai_domain,AI',

  'RULE-SET,youtube_domain,youtube',
  'RULE-SET,google_domain,google',
  'RULE-SET,github_domain,GitHub',

  // 微软和 Apple 的国内域名先直连，再匹配各自的完整规则集。
  'RULE-SET,microsoftcn_domain,本地直连',
  'RULE-SET,microsoft_domain,Microsoft',
  'RULE-SET,applecn_domain,本地直连',
  'RULE-SET,apple_domain,Apple',

  'RULE-SET,telegram_domain,Telegram',

  // 已收录的境外域名直接交给「节点选择」，其余流量再按目标 IP 匹配。
  'RULE-SET,cn!_domain,节点选择',

  'RULE-SET,google_ip,google',
  'RULE-SET,apple_ip,Apple',
  'RULE-SET,telegram_ip,Telegram',
  'RULE-SET,cn_ip,本地直连',

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
