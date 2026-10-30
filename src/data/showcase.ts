import shiyeImage from '../assets/xhs-workbench/workspace-desktop.png';
import liveImage from '../assets/live-capture/native-overview.png';
import safeKeysIcon from '../assets/safekeys/app-icon.png';

/** Project records are based on the author's existing articles or local project materials. */
export const projects = [
  {
    id: 'safekeys', articleSlug: null, title: 'SafeKeys', titleEn: 'SafeKeys',
    subtitle: '擦键盘时，暂时锁住输入', subtitleEn: 'A temporary keyboard lock for cleaning',
    summary: '一个 macOS 键盘清洁工具：临时拦截按键，保留鼠标和触控板操作。',
    summaryEn: 'A macOS utility that temporarily blocks keyboard input while leaving the mouse and trackpad available.',
    status: '项目记录', statusEn: 'Project notes', date: '2026-10-30',
    image: safeKeysIcon, imageAlt: 'SafeKeys 应用图标：带锁的键帽', imageAltEn: 'SafeKeys app icon showing a locked keycap',
    iconArt: { eyebrow: 'macOS 13+', tagline: '清洁键盘时，暂时锁定输入。', taglineEn: 'Pause keyboard input while cleaning.', footer: 'Swift · SwiftUI · CGEventTap' },
    problem: '清洁 Mac 键盘时，擦拭动作可能触发按键和快捷键。SafeKeys 希望在清洁期间暂停键盘输入，同时留出方便恢复的操作通道。',
    capabilities: [
      '锁定期间拦截键盘事件，鼠标和触控板仍可使用。',
      '提供 30 秒、60 秒、90 秒、2 分钟及不限时选项，均受 10 分钟上限约束。',
      '支持按住按钮、键盘口令和倒计时等解锁方式。',
    ],
    detailSections: [
      {
        title: '使用方式', titleEn: 'How to use it',
        paragraphs: [
          '选择自动解锁时长和口令，点击“锁定键盘”后，浮层会显示剩余时间和解锁提示。',
          '清洁结束后，可以按住解锁按钮 0.8 秒、按照提示输入口令，或等待倒计时结束。',
        ],
      },
      {
        title: '实现与恢复设计', titleEn: 'Implementation and recovery',
        paragraphs: [
          '项目使用 Swift 和 SwiftUI，锁定时通过 CGEventTap 处理键盘事件；解锁时释放事件通道。',
          '独立看门狗监测主线程心跳；系统睡眠、锁屏、用户切换或权限被撤销时，程序也会尝试解除锁定。',
        ],
      },
    ],
    limitations: '需要辅助功能权限；Touch ID 与电源键不在拦截范围内。当前项目采用本地签名，尚未公证。',
    keywords: ['SafeKeys', 'macOS', 'Swift', 'SwiftUI', 'CGEventTap', '键盘清洁', '辅助功能'],
    repository: 'https://github.com/Nothings2Seeyeyeye/SafeKeys', repositoryLabel: '项目仓库', repositoryLabelEn: 'Project repository',
  },
  {
    id: 'shiye', articleSlug: 'xhs-local-knowledge-workbench', title: '拾页', titleEn: 'Shiye',
    subtitle: '把收藏夹从终点变成起点', subtitleEn: 'Turning a collection into a starting point',
    summary: '把有权访问的图文和视频保存到本地，通过按需 OCR、搜索和 AI 对话重新使用素材。',
    summaryEn: 'A local library for organizing material the user can access, with search, on-demand OCR, and AI conversations.',
    status: '原型记录', statusEn: 'Prototype notes', date: '2026-09-03',
    image: shiyeImage, imageAlt: '拾页桌面端素材库，左侧是文件夹与功能入口，右侧是素材卡片', imageAltEn: 'Shiye desktop library with folders and tools on the left and collection cards on the right',
    problem: '收藏夹里的内容很容易堆积；当需要比较和使用时，逐篇翻找、复制和上传会打断思考。拾页尝试把素材带回本地，接入整理与对话的过程。',
    capabilities: ['按链接、作者或收藏页采集有权访问的素材。', '按需识别图片文字，用文件夹、标签和搜索整理。', '选择多份素材与 AI 对话，并保留来源以便核对。'],
    limitations: '文章记录的是一个基础原型：系统分享入口、视频语音转写与全库语义检索当时仍待完善。',
    repository: 'https://github.com/Nothings2Seeyeyeye/XHS-Info-collector', repositoryLabel: '采集底座', repositoryLabelEn: 'Collector source',
  },
  {
    id: 'live-capture', articleSlug: 'live-capture', title: 'Live Capture', titleEn: 'Live Capture',
    subtitle: '为长时间直播录制做一个管理器', subtitleEn: 'A manager for long-running stream recordings',
    summary: '用 macOS 界面管理本机 ffmpeg 进程，查看多场直播的录制状态。',
    summaryEn: 'A macOS interface for managing local ffmpeg processes and monitoring multiple livestream recordings.',
    status: '实践记录', statusEn: 'Project notes', date: '2026-04-20',
    image: liveImage, imageAlt: 'Live Capture 任务列表，新建录制与按 PID 接管外部 ffmpeg 进程', imageAltEn: 'Live Capture task list with controls to start a recording or attach to an ffmpeg process by PID',
    problem: '活动直播可能多场并行、持续数小时。单靠多个终端窗口，难以确认文件是否还在增长、进程是否退出，也不方便安全收尾。',
    capabilities: ['创建并监控多个 ffmpeg 录制任务。', '显示进程、文件大小、时长、速度与日志。', '接管已有进程，并区分暂停、正常结束与强制结束。'],
    limitations: '获取直播地址仍是单独的投屏步骤；这个工具负责后续的本机录制管理。',
    repository: 'https://github.com/Fang-zhixian/live-capture', repositoryLabel: '项目仓库', repositoryLabelEn: 'Project repository',
  },
] as const;

export const notes = [
  {
    id: 'software-endgame', title: '软件的终局会在哪？', titleEn: 'Where Is Software Headed?', date: '2026-10-23', sourceSlug: 'software-endgame-glass-phone',
    summary: '从一块透明玻璃的想象出发，思考逆向、模型能力与云端软件的可能变化。',
    summaryEn: 'A reflection on reverse engineering, AI models, and cloud software, inspired by the idea of a transparent glass device.',
    paragraphs: [
      '小时候科幻片里只有一片透明玻璃的手机，让我想到：如果核心能力不再需要塞进本地设备，终端会变成什么样？',
      '随着模型能力增强和软件逆向门槛降低，一种可能的设想是：更多核心业务和运行逻辑迁往云端，本地设备主要负责交互与呈现。',
      '这是一段随想，而非对未来的结论。完整的思考和背景留在原文中。',
    ],
  },
] as const;

export const knowledge = [
  {
    id: 'ocr-for-collections', title: '按需 OCR：把图片文字带进素材库', titleEn: 'On-Demand OCR for a Collection Library', date: '2026-09-03', sourceSlug: 'xhs-local-knowledge-workbench', topic: 'OCR / 素材整理',
    summary: '先完整保存素材，再对需要深入处理的图片按需识别，兼顾信息完整度与成本。',
    summaryEn: 'Save the original material first, then extract text from selected images when needed to balance completeness and cost.',
    paragraphs: ['图文内容中的关键步骤和清单可能藏在图片里。只保存标题与正文，会让素材看起来完整，却遗漏了可搜索的信息。', '拾页的做法是先保存原始素材，再对用户选中的内容调用兼容 PaddleOCR 的服务；识别结果逐图保存为 Markdown，并汇总到 AI 上下文。'],
    points: ['按需识别，避免为每张图片支付时间和额度成本。', '已经成功识别的图片可以跳过，任务中断后可继续处理。', '保留原图与来源，方便回看和核对识别内容。'],
  },
  {
    id: 'dlna-stream-recording', title: '直播录制：DLNA 获取地址与 ffmpeg 管理', titleEn: 'Livestream Recording with DLNA and ffmpeg', date: '2026-04-20', sourceSlug: 'live-capture', topic: 'DLNA / ffmpeg',
    summary: '手机与电脑处于同一局域网时，可利用投屏流程取得直播流地址，再用 ffmpeg 录制。',
    summaryEn: 'Use a local-network casting workflow to obtain a livestream address, then manage the recording with ffmpeg.',
    paragraphs: ['视频号投屏会通过 DLNA 向局域网里的接收设备发送播放地址。将电脑作为接收设备后，可以取得直播流的 m3u8 地址。', '录制和取地址是两步：地址可能过期，长时间录制仍需要观察进程、文件增长和日志。'],
    points: ['先确认手机和电脑在同一局域网，且组播没有被隔离。', '使用 ffmpeg 拷贝流可避免不必要的重新编码。', '正常停止录制时应让进程完成文件收尾；强制结束可能留下不完整文件。'],
  },
] as const;
