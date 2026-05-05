const URL_TEST = 'https://www.gstatic.com/generate_204'
const ICON_BASE_URL = 'https://raw.githubusercontent.com/Orz-3/mini/master/Color'
const IOS_RULE_SCRIPT_BASE_URL = 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash'

// 默认候选里的地区顺序，和面板展示顺序可以不同。
const REGION_PROXY_ORDER = ['香港节点', '台湾节点', '日本节点', '新加坡节点', '美国节点']

// 地区智能组的展示顺序和筛选规则。
const REGION_GROUPS = [
  { name: '美国节点', icon: 'US', filter: '(?i)(🇺🇸|美|us|unitedstates|united states)' },
  { name: '香港节点', icon: 'HK', filter: '(?i)(🇭🇰|港|hk|hongkong|hong kong)' },
  { name: '日本节点', icon: 'JP', filter: '(?i)(🇯🇵|日|jp|japan)' },
  { name: '新加坡节点', icon: 'SG', filter: '(?i)(🇸🇬|新|sg|singapore)' },
  { name: '台湾节点', icon: 'TW', filter: '(?i)(🇹🇼|台|tw|taiwan|tai wan)' },
]

// 按协议拆智能优选，方便排查某类协议的节点质量。
const SMART_PROTOCOL_GROUPS = [
  { name: '智能优选(vless)', filter: '(?i)(vless)', icon: 'Auto' },
  { name: '智能优选(anytls)', filter: '(?i)(anytls)', icon: 'Auto' },
  { name: '智能优选(tuic)', filter: '(?i)(tuic)', icon: 'Auto' },
  { name: '智能优选(hysteria)', filter: '(?i)(hysteria)', icon: 'Auto' },
]

// 默认策略先走智能协议组，再给手动和地区组兜底。
const SMART_GROUP_NAMES = SMART_PROTOCOL_GROUPS.map(({ name }) => name)
const DEFAULT_STRATEGY_PROXIES = [...SMART_GROUP_NAMES, '手动选择', ...REGION_PROXY_ORDER, '本地直连']

// ios_rule_script 的 .list 是 classical 文本规则，rule-provider 需要显式标记 format。
const RULE_PROVIDER_OPTIONS = {
  type: 'http',
  behavior: 'classical',
  format: 'text',
  interval: 86400,
  proxy: '节点选择',
}

// 规则集顺序和最终 rules 命中顺序保持一致，方便排查命中关系。
const RULE_PROVIDER_SOURCES = [
  { name: 'lan', source: 'Lan' },

  { name: 'openAI', source: 'OpenAI' },
  { name: 'claude', source: 'Claude' },
  { name: 'gemini', source: 'Gemini' },
  { name: 'copilot', source: 'Copilot' },

  { name: 'telegram', source: 'Telegram' },
  { name: 'youTube', source: 'YouTube' },
  { name: 'google', source: 'Google' },
  { name: 'twitter', source: 'Twitter' },
  { name: 'gitHub', source: 'GitHub' },
  { name: 'spotify', source: 'Spotify' },
  { name: 'oneDrive', source: 'OneDrive' },
  { name: 'globalScholar', source: 'GlobalScholar' },

  { name: 'apple', source: 'Apple' },
  { name: 'steamCN', source: 'SteamCN' },
  { name: 'microsoft', source: 'Microsoft' },
  { name: 'chinaMax', source: 'ChinaMax', file: 'ChinaMax_Classical.yaml', format: 'yaml' },

  { name: 'proxyLite', source: 'ProxyLite' },
]

const SERVICE_RULE_SETS = [
  { name: 'lan', target: '本地直连' },

  { name: 'openAI', target: 'AI' },
  { name: 'claude', target: 'AI' },
  { name: 'gemini', target: 'AI' },
  { name: 'copilot', target: 'AI' },

  { name: 'telegram', target: 'Telegram' },
  { name: 'youTube', target: '节点选择' },
  { name: 'google', target: 'Google' },
  { name: 'twitter', target: '节点选择' },
  { name: 'gitHub', target: '节点选择' },
  { name: 'spotify', target: '节点选择' },
  { name: 'oneDrive', target: '节点选择' },
  { name: 'globalScholar', target: '节点选择' },

  { name: 'apple', target: '本地直连' },
  { name: 'steamCN', target: '本地直连' },
  { name: 'microsoft', target: '本地直连' },
  { name: 'chinaMax', target: '本地直连' },

  { name: 'proxyLite', target: '节点选择' },
]

// Orz-3/mini 的 Color 图标文件名和策略组 icon 字段保持一致。
const getIcon = (name) => `${ICON_BASE_URL}/${name}.png`

const createRuleProvider = ({ name, source, file = `${source}.list`, format = RULE_PROVIDER_OPTIONS.format }) => ({
  ...RULE_PROVIDER_OPTIONS,
  format,
  url: `${IOS_RULE_SCRIPT_BASE_URL}/${source}/${file}`,
  path: `./ruleset/ios_rule_script/${name}.${file.split('.').pop()}`,
})

const createRuleSetRule = ({ name, target, noResolve }) => `RULE-SET,${name},${target}${noResolve ? ',no-resolve' : ''}`

const ruleProviders = Object.fromEntries(RULE_PROVIDER_SOURCES.map((source) => [source.name, createRuleProvider(source)]))

// 基础运行配置：端口、局域网访问、控制面板、Geo 数据、DNS、Tun 和嗅探。
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

  // Geo 数据自动更新
  'geodata-mode': true,
  'geo-auto-update': true,
  'geo-update-interval': 24,
  'geox-url': {
    geoip: 'https://gh-proxy.com/github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat',
    geosite: 'https://gh-proxy.com/github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat',
    mmdb: 'https://gh-proxy.com/github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb',
    asn: 'https://gh-proxy.com/github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb',
  },

  // DNS 使用 fake-ip 模式，国内 DoH 负责默认解析和代理服务器解析。
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
    // 这些域名不适合 fake-ip，保持真实解析能减少局域网和连通性检测异常。
    'fake-ip-filter': ['+.lan', '+.local', 'time.*.com', 'ntp.*.com', 'geosite:cn', 'geosite:private', 'geosite:connectivity-check'],
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
    'dns-hijack': ['any:53'],
    'endpoint-independent-nat': true,
    mtu: 1460,
  },

  // 嗅探用于从连接中还原域名，方便规则命中。
  sniffer: {
    enable: true,
    'parse-pure-ip': true,
    'override-destination': true,
    sniff: {
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, 8080, 8081, 8090] },
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

// url-test/select 共享的测速配置。
const urlTestOptions = {
  url: URL_TEST,
  interval: 600,
  timeout: 3000,
  lazy: true,
  'max-failed-times': 3,
  hidden: false,
}

// smart 组按协议或地区自动筛选节点，strategy 控制会话粘性。
const smartOptions = {
  type: 'smart',
  'include-all': true,
  strategy: 'sticky-sessions',
  interval: 600,
  uselightgbm: true,
  collectdata: false,
  url: URL_TEST,
}

// 构建智能组：协议组和地区组都走同一套模板。
const createSmartGroup = ({ name, filter, icon, ...options }) => ({
  ...urlTestOptions,
  ...smartOptions,
  name,
  filter,
  icon: getIcon(icon),
  ...options,
})

// 构建选择组：默认候选策略由 DEFAULT_STRATEGY_PROXIES 统一维护。
const createSelectGroup = ({ name, icon, proxies = DEFAULT_STRATEGY_PROXIES, includeAll = true }) => ({
  ...urlTestOptions,
  type: 'select',
  name,
  proxies,
  icon: getIcon(icon),
  'include-all': includeAll,
})

// 面板里展示的代理组顺序。
const proxyGroups = [
  createSelectGroup({ name: '节点选择', icon: 'Global', includeAll: false }),
  createSelectGroup({
    name: '手动选择',
    icon: 'Manual',
    proxies: DEFAULT_STRATEGY_PROXIES.filter((name) => name !== '手动选择'),
  }),

  ...SMART_PROTOCOL_GROUPS.map(createSmartGroup),

  createSelectGroup({ name: 'AI', icon: 'ASN' }),
  createSelectGroup({ name: 'Telegram', icon: 'Telegram' }),
  createSelectGroup({ name: 'Google', icon: 'Google' }),

  ...REGION_GROUPS.map(createSmartGroup),

  createSelectGroup({ name: '本地直连', icon: 'China', proxies: ['DIRECT'] }),
  createSelectGroup({ name: '漏网之鱼', icon: 'Final', proxies: ['节点选择', '本地直连'] }),
]

// 域名优先交给 ChinaMax 规则集，这里只兜底纯 IP 流量。
const IP_FALLBACK_RULES = []

// 规则按顺序命中：先处理局域网和明确业务，再用 ChinaMax 兜住国内域名，最后才处理国内 IP 和兜底。
const proxyRules = [
  ...SERVICE_RULE_SETS.map(createRuleSetRule),
  ...IP_FALLBACK_RULES,
  'GEOIP,CN,本地直连,no-resolve',
  'MATCH,漏网之鱼',
]

// proxy-providers 可能不存在，统一在这里做兼容。
const getProxyProviderCount = (proxyProviders) => {
  if (!proxyProviders || typeof proxyProviders !== 'object') return 0
  return Object.keys(proxyProviders).length
}

// 主入口：合并订阅配置和内置模板，返回最终 Clash 配置。
function main(config) {
  console.log('🚀 开始生成 Clash 配置')

  const proxies = Array.isArray(config?.proxies) ? config.proxies : []
  const proxyProviderCount = getProxyProviderCount(config?.['proxy-providers'])
  const mergedRuleProviders = {
    ...(config?.['rule-providers'] || {}),
    ...ruleProviders,
  }

  console.log(`📦 输入配置: ${proxies.length} 个代理节点 / ${proxyProviderCount} 个代理提供者`)

  if (proxies.length === 0 && proxyProviderCount === 0) {
    console.error('⛔ 未找到代理节点或代理提供者，无法生成配置')
    throw new Error('配置文件中未找到任何代理')
  }

  console.log('🧩 合并内置代理组、规则集、规则和基础配置')

  const finalConfig = {
    ...baseConfig,
    ...config,
    proxies,
    'proxy-groups': proxyGroups,
    'rule-providers': mergedRuleProviders,
    rules: proxyRules,
  }

  console.log(finalConfig)

  console.log(`✅ 配置生成完成: ${proxyGroups.length} 个代理组 / ${Object.keys(mergedRuleProviders).length} 个规则集 / ${proxyRules.length} 条规则`)
  return finalConfig
}


main({
  proxies: [
    {
      name: '节点选择',
      type: 'select',
      proxies: ['DIRECT'],
    },
  ],
})
