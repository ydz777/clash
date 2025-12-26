// 基础运行配置
const baseConfig = {
  // 端口设置
  'mixed-port': 7890, // 混合端口(HTTP+SOCKS)
  'socks-port': 7891, // SOCKS5 端口
  port: 7892, // HTTP 代理端口
  'bind-address': '*', // 监听地址(*) 表示所有网卡

  // 局域网访问
  'allow-lan': true, // 允许局域网访问
  'lan-allowed-ips': ['0.0.0.0/0', '::/0'], // 局域网允许访问的网段
  'skip-auth-prefixes': ['127.0.0.1/32'], // 跳过鉴权的来源网段

  // 通用设置
  mode: 'rule', // 规则模式
  'log-level': 'info', // 日志等级
  ipv6: false, // 是否启用 IPv6

  // 行为控制
  'find-process-mode': 'strict', // 进程匹配模式: strict 更准确
  'unified-delay': true, // 统一延迟: 展示同一延迟
  'tcp-concurrent': true, // TCP 并发拨号

  // 外部控制
  'external-controller': '0.0.0.0:9090', // 外部控制接口
  secret: '9527', // 外部控制密钥
  'external-ui': 'ui', // 外部面板目录
  'external-ui-name': 'zashboard', // 面板名称
  'external-ui-url': 'https://gh-proxy.com/github.com/Zephyruso/zashboard/archive/refs/heads/gh-pages.zip', // 面板下载地址

  // Geo 数据
  'geodata-mode': true, // 使用 geodata.dat
  'geo-auto-update': true, // 自动更新 Geo 数据
  'geo-update-interval': 24, // 更新间隔(小时)
  'geox-url': {
    geosite: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat', // 域名库
    geoip: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat', // IP 数据库
    mmdb: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb', // 国家库
    asn: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb', // ASN 库
  },

  // DNS 配置
  dns: {
    enable: true, // 启用内置 DNS
    ipv6: false, // DNS 是否启用 IPv6
    listen: '0.0.0.0:7874', // DNS 监听地址
    'use-hosts': false,
    'use-system-hosts': false,
    'prefer-h3': false,
    'respect-rules': true,
    'cache-algorithm': 'arc',
    'enhanced-mode': 'fake-ip', // 增强模式: fake-ip
    'fake-ip-range': '198.18.0.1/16', // fake-ip 网段
    'fake-ip-filter': ['+.lan', '+.local', 'time.*.com', 'ntp.*.com', 'geosite:cn', 'geosite:private', 'geosite:connectivity-check'], // 不使用 fake-ip
    'default-nameserver': ['tls://223.5.5.5:853', 'tls://119.29.29.29:853'], // 用于解析 nameserver，fallback 以及其他 DNS 服务器配置的，DNS 服务域名
    nameserver: ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'], // 默认上游 DNS
    // 'direct-nameserver': ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'], // 直连用的 DoH
    'proxy-server-nameserver': ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'], // 代理用的上游 DNS
    // 'nameserver-policy': {
    //   'geosite:geolocation-!cn': ['https://dns.cloudflare.com/dns-query', 'https://dns.google/dns-query'], // 指定域名策略
    //   'geosite:cn,private': ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'], // 指定域名策略
    // },
  },

  // Tun 内核
  tun: {
    enable: true, // 启用 Tun
    stack: 'mixed', // 内核栈: 混合
    'auto-route': true, // 自动路由
    'auto-detect-interface': true, // 自动识别出口
    'dns-hijack': ['any:53'], // 劫持 DNS 53 端口
    'endpoint-independent-nat': true, // 独立 NAT
    mtu: 1460, // 最大传输单元
  },

  // 流量嗅探
  sniffer: {
    enable: true, // 启用流量嗅探
    'parse-pure-ip': true, // 解析纯 IP SNI
    'override-destination': true, // 覆盖目标地址
    sniff: {
      TLS: { ports: [443, 8443] }, // TLS 端口
      HTTP: { ports: [80, 8080, 8081, 8090] }, // HTTP 端口
      QUIC: { ports: [443, 8443] }, // QUIC 端口
    },
    'skip-domain': ['+.mi.com', '+.oray.com', '+.push.apple.com'], // 跳过嗅探域名
    'force-domain': ['+.netflix.com', '+.hbo.com'], // 强制嗅探域名
  },

  // 配置存储
  profile: {
    'store-selected': true, // 记住策略选择
    'store-fake-ip': true, // 持久化 fake-ip
  },
}

const urlTestUrl = 'https://www.gstatic.com/generate_204' // 测速 URL
const baseProxies = ['香港节点', '台湾节点', '日本节点', '新加坡节点', '美国节点'] // 区域节点子组
const iconsBaseUrl = 'https://raw.githubusercontent.com/Orz-3/mini/master/Color' // 图标基础地址
const getIconPath = (iconName) => `${iconsBaseUrl}/${iconName}.png` // 图标拼接器
const defaultStrategyProxies = ['智能优选(tuic)', '智能优选(hysteria)', '智能优选(anytls)', '手动选择', ...baseProxies, '本地直连'] // 默认候选策略

// 模板配置
const urlTestTemplate = {
  url: urlTestUrl, // 测速 URL
  interval: 600, // 延迟测试间隔(秒)
  timeout: 3000, // 测速超时(ms)
  lazy: true, // 懒触发
  'max-failed-times': 3, // 最大失败次数
  hidden: false, // 是否在面板隐藏
}

const smartTemplate = {
  type: 'smart', // 智能分流组
  'include-all': true, // 包含全部节点
  strategy: 'sticky-sessions', // 会话粘性 sticky-sessions round-robin
  interval: 600, // 评估间隔(秒)
  uselightgbm: true, // 启用轻量 GBM 评估
  collectdata: false, // 采集统计数据
  url: urlTestUrl, // 测速 URL
}

// 构建智能协议组配置
const smartProtocolConfigs = [
  { name: '智能优选(tuic)', filter: '(?i)(tuic)', icon: 'Speedtest' },
  { name: '智能优选(hysteria)', filter: '(?i)(hysteria)', icon: 'Speedtest' },
  { name: '智能优选(anytls)', filter: '(?i)(anytls)', icon: 'Speedtest' },
  { name: '智能优选(vless)', filter: '(?i)(vless)', icon: 'Speedtest' },
]

// 构建区域智能组配置
const regionSmartConfigs = [
  { name: '香港节点', icon: 'HK', filter: '(?i)(🇭🇰|港|hk|hongkong|hong kong)' },
  { name: '台湾节点', icon: 'TW', filter: '(?i)(🇹🇼|台|tw|taiwan|tai wan)' },
  { name: '日本节点', icon: 'JP', filter: '(?i)(🇯🇵|日|jp|japan)' },
  { name: '新加坡节点', icon: 'SG', filter: '(?i)(🇸🇬|新|sg|singapore)' },
  { name: '美国节点', icon: 'US', filter: '(?i)(🇺🇸|美|us|unitedstates|united states)' },
]

// 构建智能组
const createSmartGroup = ({ name, filter, icon, ...rest }) => ({
  ...urlTestTemplate,
  ...smartTemplate,
  name,
  filter,
  icon: getIconPath(icon),
  ...rest,
})

// 构建选择组
const createSelectGroup = ({ name, proxies = defaultStrategyProxies, icon, includeAll = true }) => {
  const selectGroup = {
    ...urlTestTemplate,
    type: 'select',
    name,
    proxies,
    icon: getIconPath(icon),
  }
  if (typeof includeAll === 'boolean') selectGroup['include-all'] = includeAll
  return selectGroup
}

const smartProtocolGroups = smartProtocolConfigs.map(createSmartGroup) // 智能协议组
const regionSmartGroups = regionSmartConfigs.map(createSmartGroup) // 区域智能组

// 代理组
const mainProxyGroups = [
  // 总入口: 统一选择策略
  createSelectGroup({ name: '节点选择', icon: 'Global', includeAll: false }),
  // 纯手动选择
  createSelectGroup({ name: '手动选择', icon: 'Static', proxies: defaultStrategyProxies.filter((i) => i !== '手动选择') }),
  ...smartProtocolGroups,
  createSelectGroup({ name: 'AI', icon: 'ASN' }),
  createSelectGroup({ name: 'google', icon: 'Google' }),
  createSelectGroup({ name: '本地直连', icon: 'China', proxies: ['DIRECT'] }),
  // createSelectGroup({ name: '广告拦截', icon: 'China', proxies: ['REJECT', 'DIRECT'] }),
  ...regionSmartGroups,
  createSelectGroup({ name: '漏网之鱼', icon: 'Final', proxies: ['节点选择', '本地直连'] }),
]

// 规则提供者
const ruleProviders = {
  // 中国域名集
  cn: {
    type: 'http',
    behavior: 'domain',
    format: 'text',
    url: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cn.yaml',
    interval: 86400,
  },
}

// 规则（优化排序）
const proxyRules = [
  // 🛑 广告拦截
  // 'GEOSITE,category-ads-all,广告拦截', // 广告域名 → 拦截

  // 🏠 私有网络直连
  'GEOSITE,private,本地直连', // 私有域 → 直连

  // 🇨🇳 国内直连（按细分优先）
  'GEOSITE,category-games@cn,本地直连', // 国内游戏 → 直连
  'GEOSITE,microsoft@cn,本地直连', // 微软国内 → 直连
  'GEOSITE,apple-cn,本地直连', // 苹果中国 → 直连
  'GEOSITE,steam@cn,本地直连', // Steam 国内 → 直连

  // 🀄️ 常规中国域名直连
  'GEOSITE,geolocation-cn,本地直连', // 国内服务的中国域名 → 直连
  'GEOSITE,tld-cn,本地直连', // 中国域名 → 直连
  'GEOSITE,cn,本地直连', // 中国域名 → 直连

  // ⚠️ 特殊情况：国外服务的中国域名
  'GEOSITE,geolocation-!cn@cn,本地直连', // 国外服务的中国域名 → 直连
  'GEOSITE,geolocation-cn@!cn,节点选择', // 国内服务的域名（非CN） → 代理

  // 🌏 特殊海外策略（单独分组）
  'GEOSITE,category-ai-!cn,AI', // 海外 AI → AI 组
  'GEOSITE,youtube,节点选择', // YouTube → 节点
  'GEOSITE,google,google', // Google → google 组
  'GEOSITE,twitter,节点选择', // X/Twitter → 节点
  'GEOSITE,github,节点选择', // GitHub → 节点
  'GEOSITE,spotify,节点选择', // Spotify → 节点
  'GEOSITE,onedrive,节点选择', // OneDrive → 节点
  'GEOSITE,category-scholar-!cn,节点选择', // 海外学术 → 节点

  // 🌍 泛海外流量
  'GEOSITE,geolocation-!cn,节点选择', // 海外常用 → 节点

  // IP 规则
  'GEOIP,private,本地直连', // 私有网段 → 直连
  'GEOIP,CN,本地直连', // 中国 IP → 直连

  // 🐟 兜底
  'MATCH,漏网之鱼', // 兜底规则
]

// 主入口: 合并外部配置与内置模板并校验
function main(config) {
  console.log('🎯 开始处理 Clash 配置...')
  // 统计基础信息
  const proxies = Array.isArray(config?.proxies) ? config.proxies : []
  const proxyProviders = config?.['proxy-providers']
  const proxyCount = proxies.length // 节点数量
  const proxyProviderCount = proxyProviders && typeof proxyProviders === 'object' ? Object.keys(proxyProviders).length : 0 // 提供者数量
  console.log(`📊 检测到 ${proxyCount} 个代理节点, ${proxyProviderCount} 个代理提供者`)

  if (proxyCount === 0 && proxyProviderCount === 0) {
    console.error('❌ 配置文件中未找到任何代理')
    throw new Error('配置文件中未找到任何代理')
  }

  console.log('🔧 使用预设模板合并配置...')
  // 组装最终配置
  const finalConfig = {
    ...baseConfig,
    ...config,
    proxies,
    'proxy-groups': mainProxyGroups,
    'rule-providers': ruleProviders,
    rules: proxyRules, // 规则列表(顺序匹配)
  }

  console.log('✅ Clash 配置处理完成!')

  return finalConfig // 返回最终配置
}
