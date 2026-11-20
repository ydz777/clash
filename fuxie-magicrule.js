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
      'rule-set:china',
      'rule-set:lan-domain',
      'rule-set:connectivity-check',
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

// 业务选择组的通用出口顺序，「节点选择」排在首位。
const DEFAULT_STRATEGY_PROXIES = [
  '节点选择',
  '手动选择',
  ...AUTO_PROTOCOL_GROUPS.map(({ name }) => name),
  ...REGION_GROUPS.map(({ name }) => name),
  '本地直连',
]

const ICON_BASE_URL = 'https://gh-proxy.com/https://raw.githubusercontent.com/Orz-3/mini/master/Color'
const getIcon = (name) => `${ICON_BASE_URL}/${name}.png`

// 节点测速使用的 HTTP 连通性检测地址。
const URL_TEST = 'https://www.gstatic.com/generate_204'

// 仅在测速组设置探测周期，减少重复测速。
const autoTestOptions = {
  url: URL_TEST,
  interval: 600,
  timeout: 3000,
  lazy: true,
  'max-failed-times': 3,
  type: 'url-test',
  'include-all': true,
  'exclude-type': 'direct',
}

const createAutoTestGroup = ({ name, filter, icon, ...options }) => ({
  ...autoTestOptions,
  name,
  filter,
  icon: getIcon(icon),
  ...options,
})

// 「本地直连」和「漏网之鱼」关闭节点自动纳入，只接受指定的选项。
const createSelectGroup = ({ name, icon, proxies = DEFAULT_STRATEGY_PROXIES, includeAll = true }) => ({
  type: 'select',
  name,
  proxies,
  icon: getIcon(icon),
  'include-all': includeAll,
})

const proxyGroups = [
  createSelectGroup({
    name: '节点选择',
    icon: 'Global',
    proxies: DEFAULT_STRATEGY_PROXIES.filter((name) => name !== '节点选择'),
  }),

  createSelectGroup({
    name: '手动选择',
    icon: 'Manual',
    proxies: DEFAULT_STRATEGY_PROXIES.filter((name) => !['节点选择', '手动选择'].includes(name)),
  }),

  ...AUTO_PROTOCOL_GROUPS.map(createAutoTestGroup),

  createSelectGroup({ name: 'OpenAI', icon: 'ASN' }),
  createSelectGroup({ name: 'Claude', icon: 'ASN' }),
  createSelectGroup({ name: 'Telegram', icon: 'Telegram' }),
  createSelectGroup({ name: 'youtube', icon: 'YouTube' }),
  createSelectGroup({ name: 'google', icon: 'Google' }),
  createSelectGroup({
    name: 'Apple',
    icon: 'Apple',
    proxies: ['本地直连', ...DEFAULT_STRATEGY_PROXIES.filter((name) => name !== '本地直连')],
  }),
  createSelectGroup({ name: '本地直连', icon: 'China', proxies: ['DIRECT'], includeAll: false }),

  ...REGION_GROUPS.map(createAutoTestGroup),

  createSelectGroup({ name: '漏网之鱼', icon: 'Final', proxies: ['节点选择', '本地直连'], includeAll: false }),
]

// 每 86400 秒刷新当前文件。MagicRule 换下载地址时需要更新对应文件名。
const createMagicRuleProvider = (file, behavior = 'classical', host = 'magicrule.pages.dev') => ({
  type: 'http',
  interval: 86400,
  behavior,
  format: behavior === 'classical' ? 'yaml' : 'mrs',
  url: `https://${host}/data/_shared/artifacts/${file}`,
})

const ruleProviders = {
  'lan-domain': createMagicRuleProvider('Lan_domain-mrs_1e7f3014460f64eb.mrs', 'domain'),
  direct: createMagicRuleProvider('Direct_classical_055a900ccd414d6a.yaml'),
  // 完整 YAML 保留主域名匹配，IP-ASN 条目由 Mihomo 使用 ASN 数据库处理。
  openai: createMagicRuleProvider('OpenAI_classical_cda01886e7b2ee62.yaml'),
  anthropic: createMagicRuleProvider('Anthropic_classical_e8dc18b70475045a.yaml'),
  telegram: createMagicRuleProvider('Telegram_classical_ec67e1f0a43104a8.yaml'),
  youtube: createMagicRuleProvider('YouTube_classical_59b6d0fe3b15c19e.yaml'),
  google: createMagicRuleProvider('Google_classical_fe2edb12daf1b32f.yaml'),
  apple: createMagicRuleProvider('Apple_classical_0fa29647e779e764.yaml'),
  twitter: createMagicRuleProvider('Twitter_classical_d405159ccf6c8682.yaml'),
  github: createMagicRuleProvider('GitHub_classical_66f5a463ca33f147.yaml'),
  spotify: createMagicRuleProvider('Spotify_classical_822ce41d873a2ee4.yaml'),
  onedrive: createMagicRuleProvider('OneDrive_classical_b66da0833f479d0f.yaml'),
  'global-scholar': createMagicRuleProvider('GlobalScholar_classical_619cb5c181684903.yaml'),
  global: createMagicRuleProvider('Global_classical_84d7c926159da35f.yaml'),
  'china-game': createMagicRuleProvider('ChinaGame_classical_1f74479d4a303e01.yaml'),
  'steam-cn': createMagicRuleProvider('SteamCN_classical_f12eaf58b7866555.yaml'),
  china: createMagicRuleProvider('China_classical_488d107c687bae96.yaml'),
  'lan-ip': createMagicRuleProvider('Lan_ipcidr-mrs_6d0ea10e6866d187.mrs', 'ipcidr'),
  'china-ip': createMagicRuleProvider('ChinaIPs_ipcidr-mrs_b1f5c4b4a88c72f3.mrs', 'ipcidr'),
  'connectivity-check': createMagicRuleProvider('ConnectivityCheck_classical_5e912f963f815506.yaml', 'classical', 'rule-26r.pages.dev'),
}

// 规则按顺序命中，越具体的规则越靠前。
const proxyRules = [
  'RULE-SET,lan-domain,本地直连',
  'RULE-SET,direct,本地直连',

  // 特殊域名按业务分组，避免全部挤到默认节点选择。
  'RULE-SET,openai,OpenAI,no-resolve',
  'RULE-SET,anthropic,Claude,no-resolve',
  'RULE-SET,telegram,Telegram,no-resolve',
  'RULE-SET,youtube,youtube,no-resolve',
  'RULE-SET,google,google,no-resolve',
  'RULE-SET,apple,Apple,no-resolve',
  'RULE-SET,twitter,节点选择,no-resolve',
  'RULE-SET,github,节点选择',
  'RULE-SET,spotify,节点选择,no-resolve',
  'RULE-SET,onedrive,节点选择',
  'RULE-SET,global-scholar,节点选择',

  'RULE-SET,china-game,本地直连',
  'RULE-SET,steam-cn,本地直连',
  'RULE-SET,global,节点选择,no-resolve',
  'RULE-SET,china,本地直连,no-resolve',

  // 局域网匹配已有目标 IP，中国 IP 兜底允许解析域名后再匹配。
  'RULE-SET,lan-ip,本地直连,no-resolve',
  'RULE-SET,china-ip,本地直连',
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
    dns: {
      ...config.dns,
      ...baseConfig.dns,
    },
    tun: {
      ...config.tun,
      ...baseConfig.tun,
    },
    sniffer: {
      ...config.sniffer,
      ...baseConfig.sniffer,
    },
    profile: {
      ...config.profile,
      ...baseConfig.profile,
    },

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
