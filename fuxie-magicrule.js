// Mihomo 的监听、DNS 和流量接管设置。
const baseConfig = {
  // 端口设置
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
  'log-level': 'info',
  ipv6: false,
  'find-process-mode': 'strict',
  'unified-delay': true,
  'tcp-concurrent': true,

  // 外部控制面板
  'external-controller': '0.0.0.0:9090',
  secret: '9527',
  'external-ui': 'ui',
  'external-ui-name': 'zashboard',
  'external-ui-url': 'https://gh-proxy.com/github.com/Zephyruso/zashboard/archive/refs/heads/gh-pages.zip',

  'geo-auto-update': false,

  // DNS 使用 fake-ip 模式，国内 DoH 负责默认解析和代理服务器解析。
  dns: {
    enable: true,
    ipv6: false,
    listen: '0.0.0.0:7874',
    'use-hosts': false,
    'use-system-hosts': false,
    'prefer-h3': true,
    'respect-rules': false,
    'cache-algorithm': 'arc',
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',

    // 命中过滤条件的域名返回真实 IP，避免干扰局域网访问和连通性检测。
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

    'default-nameserver': ['223.5.5.5', '119.29.29.29'],
    nameserver: ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'],
    'proxy-server-nameserver': ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'],
  },

  // Tun 接管系统流量，自动路由并劫持 53 端口 DNS。
  tun: {
    enable: true,
    stack: 'mixed',
    'auto-route': true,
    'auto-detect-interface': true,
    'strict-route': false,
    'dns-hijack': ['any:53', 'tcp://any:53'],
    mtu: 1460,
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

  // 记住面板选择和 fake-ip 映射，重启后体验更稳定。
  profile: {
    'store-selected': true,
    'store-fake-ip': true,
  },
}

// 地区测速组按节点名筛选，数组顺序也是面板中的显示顺序。
const REGION_GROUPS = [
  { name: '美国节点', icon: 'US', filter: '(?i)(🇺🇸|美|USA|\\bUS\\b|united[-\\s]?states)' },
  { name: '香港节点', icon: 'HK', filter: '(?i)(🇭🇰|港|hk|hongkong|hong kong)' },
  { name: '日本节点', icon: 'JP', filter: '(?i)(🇯🇵|日|jp|japan)' },
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

// 业务组默认跟随「节点选择」，也可以单独指定出口。
const DEFAULT_STRATEGY_PROXIES = ['节点选择', '手动选择', ...SPEED_TEST_GROUP_NAMES, '本地直连']

const ICON_BASE_URL = 'https://gh-proxy.com/https://raw.githubusercontent.com/Orz-3/mini/master/Color'
const getIconUrl = (name) => `${ICON_BASE_URL}/${name}.png`

// 只有测速组发起探测，业务选择组复用测速结果。
const createAutoTestGroup = ({ name, filter, icon, ...options }) => ({
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

// 「本地直连」和「漏网之鱼」关闭节点自动纳入，只接受指定的选项。
const createSelectGroup = ({ name, icon, proxies = DEFAULT_STRATEGY_PROXIES, includeAll = true }) => ({
  type: 'select',
  name,
  proxies,
  icon: getIconUrl(icon),
  'include-all': includeAll,
})

const proxyGroups = [
  createSelectGroup({
    name: '节点选择',
    icon: 'Global',
    proxies: ['手动选择', ...SPEED_TEST_GROUP_NAMES, '本地直连'],
  }),
  createSelectGroup({
    name: '手动选择',
    icon: 'Manual',
    proxies: [...SPEED_TEST_GROUP_NAMES, '本地直连'],
  }),

  ...AUTO_PROTOCOL_GROUPS.map(createAutoTestGroup),

  createSelectGroup({ name: 'OpenAI', icon: 'ASN' }),
  createSelectGroup({ name: 'Claude', icon: 'ASN' }),
  createSelectGroup({ name: 'AI', icon: 'ASN' }),
  createSelectGroup({ name: 'youtube', icon: 'YouTube' }),
  createSelectGroup({ name: 'google', icon: 'Google' }),
  createSelectGroup({ name: 'GitHub', icon: 'github' }),
  createSelectGroup({ name: 'Microsoft', icon: 'Microsoft' }),
  createSelectGroup({
    name: 'Apple',
    icon: 'Apple',
    proxies: ['本地直连', '节点选择', '手动选择', ...SPEED_TEST_GROUP_NAMES],
  }),
  createSelectGroup({ name: 'Telegram', icon: 'Telegram' }),

  createSelectGroup({ name: '本地直连', icon: 'China', proxies: ['DIRECT'], includeAll: false }),
  ...REGION_GROUPS.map(createAutoTestGroup),
  createSelectGroup({ name: '漏网之鱼', icon: 'Final', proxies: ['节点选择', '本地直连'], includeAll: false }),
]

// MetaCubeX 的 meta 分支提供域名和 IP 分流规则。
const META_RULE_BASE_URL = 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta'
// DNS 的 fake-IP 例外清单单独取自 qichiyuhub。
const FAKE_IP_RULE_BASE_URL = 'https://raw.githubusercontent.com/qichiyuhub/rule/refs/heads/main/rules'

const createRuleProvider = (url, behavior, format = 'mrs') => ({
  type: 'http',
  interval: 86400, // Mihomo 以秒为单位，每天更新一次规则集。
  behavior,
  format,
  url,
})

const createDomainProvider = (name) => createRuleProvider(`${META_RULE_BASE_URL}/geo/geosite/${name}.mrs`, 'domain')
const createIpProvider = (name, directory = 'geo') => createRuleProvider(`${META_RULE_BASE_URL}/${directory}/geoip/${name}.mrs`, 'ipcidr')

const ruleProviders = {
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
  apple_ip: createIpProvider('apple', 'geo-lite'),
  telegram_ip: createIpProvider('telegram'),
  cn_ip: createIpProvider('cn'),

  // 这三份规则集仅供 DNS 的 fake-IP 过滤使用。
  cn_domain: createDomainProvider('cn'),
  fakeipfilter_cn: createRuleProvider(`${FAKE_IP_RULE_BASE_URL}/fakeipfilter-cn.list`, 'domain', 'text'),
  'fakeipfilter_!cn': createRuleProvider(`${FAKE_IP_RULE_BASE_URL}/fakeipfilter-!cn.list`, 'domain', 'text'),
}

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

  // 已收录的境外域名走「节点选择」，其余流量继续按目标 IP 匹配。
  'RULE-SET,cn!_domain,节点选择',
  'RULE-SET,google_ip,google',
  'RULE-SET,apple_ip,Apple',
  'RULE-SET,telegram_ip,Telegram',
  'RULE-SET,cn_ip,本地直连',
  'MATCH,漏网之鱼',
]

// 合并订阅和脚本配置，生成 Mihomo 配置。
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

    // 同名设置以脚本为准，保留订阅中其余的子项。
    dns: { ...config.dns, ...baseConfig.dns },
    tun: { ...config.tun, ...baseConfig.tun },
    sniffer: { ...config.sniffer, ...baseConfig.sniffer },
    profile: { ...config.profile, ...baseConfig.profile },

    proxies,
    'proxy-groups': proxyGroups,
    'rule-providers': {
      ...config['rule-providers'],
      ...ruleProviders,
    },
    rules: proxyRules,
  }

  // 规则集负责更新，清掉输入订阅可能带入的 Geo 数据下载设置。
  delete finalConfig['geodata-mode']
  delete finalConfig['geo-update-interval']
  delete finalConfig['geox-url']

  console.log(`✅ 配置生成完成: ${proxyGroups.length} 个代理组 / ${proxyRules.length} 条规则`)
  return finalConfig
}
