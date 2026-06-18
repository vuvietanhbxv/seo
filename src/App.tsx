import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, FormEvent } from 'react'
import * as XLSX from 'xlsx'
import './App.css'

type View = 'overview' | 'projects' | 'entities' | 'backlinks' | 'keywords' | 'articles' | 'tasks' | 'knowledge' | 'social' | 'tools' | 'tool-article-writer' | 'tool-article-settings' | 'finance' | 'people' | 'progress' | 'system'
type ProjectStatus = 'Đang SEO' | 'Tạm dừng' | 'Hoàn thành'
type TaskStatus = 'Cần làm' | 'Chờ nhận' | 'Đang làm' | 'Cần chỉnh sửa' | 'Chờ duyệt' | 'Từ chối' | 'Hoàn thành' | 'Đã hủy'
type TransactionType = 'Thu' | 'Chi'
type Role = 'Quản trị viên' | 'Trưởng nhóm SEO' | 'Nội dung' | 'Tài chính' | 'Chỉ xem'
type SearchIntent = 'Informational' | 'Commercial' | 'Transactional' | 'Navigational'
type KeywordType = 'A' | 'B' | 'C'
type KeywordIndexStatus = 'Chua check' | 'Noindex' | 'Index'
type SalaryType = 'Lương theo giờ' | 'Lương theo tháng' | 'Lương theo task'
type TaskSalaryModule = 'Bài viết' | 'Backlink' | 'SEO Entity'
type TaskSalarySettings = Record<TaskSalaryModule, number>
type ExpenseScope = 'Chi chung dự án' | 'Chi riêng dự án'
type AnalyticsGranularity = 'day' | 'week' | 'month' | 'year'
type PermissionAction = 'view' | 'edit'
type FinanceFilter = 'all' | 'general' | 'project'
type EntityTab = 'overview' | 'profile' | 'platforms' | 'links' | 'checklist' | 'schema' | 'check' | 'reports'
type BacklinkTab = 'overview' | 'sources' | 'links' | 'plans' | 'anchors' | 'check' | 'costs' | 'reports'
type KnowledgeTab = 'all' | 'web-log' | 'issues' | 'guides' | 'sops' | 'technical' | 'files' | 'archive'
type SocialTab = 'overview' | 'channels' | 'campaigns' | 'posts' | 'calendar' | 'approvals' | 'media' | 'templates' | 'reports'
type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'zalo' | 'pinterest' | 'x' | 'linkedin' | 'threads' | 'shopee_feed' | 'other'
type SocialChannelType = 'fanpage' | 'profile' | 'group' | 'channel' | 'oa' | 'board' | 'shop_feed' | 'other'
type SocialChannelStatus = 'active' | 'paused' | 'login_error' | 'lost_permission' | 'archived'
type SocialCampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
type SocialPostType = 'text' | 'image' | 'video' | 'reel' | 'short' | 'story' | 'album' | 'livestream' | 'carousel' | 'other'
type SocialContentStatus = 'draft' | 'writing' | 'ready_for_design' | 'waiting_approval' | 'revision_required' | 'approved' | 'archived'
type SocialMediaStatus = 'missing' | 'designing' | 'uploaded' | 'revision_required' | 'approved' | 'used'
type SocialPublishStatus = 'not_scheduled' | 'scheduled' | 'published' | 'failed' | 'cancelled' | 'overdue'
type SocialPriority = 'low' | 'normal' | 'high' | 'urgent'
type SocialApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision_required'
type SocialTemplateType = 'caption' | 'hashtag' | 'cta' | 'script' | 'comment_reply'
type EntityType = 'Brand' | 'Company' | 'Local Business' | 'Person' | 'Product' | 'Service' | 'Website'
type EntityStatus = 'Đang dùng' | 'Tạm dừng' | 'Hoàn thành'
type EntityPlatformGroup =
  | 'Profile Link'
  | 'Web 2.0'
  | 'Article Submission'
  | 'Social Bookmark / Bookmark'
  | 'Forum Post'
  | 'URL Shortener'
  | 'Business Listing'
  | 'Comment'
  | 'Image Submission'
  | 'Other'
  | 'Web 2.0 Article Submission'
  | 'Web 2.0 Social Bookmark / Web 2.0 Bookmark'
type EntityLinkType = 'Dofollow' | 'Nofollow' | 'Redirect' | 'Mention'
type EntityPlatformStatus = 'Dùng được' | 'Lỗi' | 'Khó đăng ký' | 'Không cho đặt link' | 'Ngừng dùng'
type EntityDeploymentStatus = 'Chưa làm' | 'Đang làm' | 'Chờ xác minh' | 'Chờ duyệt' | 'Đã live' | 'Lỗi' | 'Không phù hợp'
type EntityLiveStatus = 'Chưa check' | 'Live' | 'Redirect' | '404' | '403' | 'Mất link' | 'Không tìm thấy URL đích'
type EntityIndexStatus = 'Chưa check' | 'Đã index' | 'Chưa index' | 'Không thể check'
type EntityNapStatus = 'Chưa check' | 'Đúng' | 'Sai tên' | 'Sai SĐT' | 'Sai địa chỉ' | 'Thiếu thông tin'
type BacklinkSourceType = 'Guest Post' | 'Báo' | 'Forum' | 'Blog' | 'Web 2.0' | 'PBN' | 'Social' | 'Directory' | 'Comment'
type BacklinkType = 'Guest Post' | 'Báo chí' | 'Forum' | 'Web 2.0' | 'Entity' | 'Social' | 'PBN' | 'Directory' | 'Comment' | 'Profile' | 'Image link' | 'Redirect link'
type BacklinkLinkType = 'Dofollow' | 'Nofollow' | 'Sponsored' | 'UGC' | 'Redirect'
type BacklinkAnchorType = 'Brand anchor' | 'Exact match' | 'Partial match' | 'Naked URL' | 'Generic' | 'Long-tail' | 'Image anchor' | 'Compound anchor'
type BacklinkPosition = 'Trong bài viết' | 'Sidebar' | 'Footer' | 'Profile' | 'Comment' | 'Bio'
type BacklinkDeploymentStatus = 'Chưa làm' | 'Đang làm' | 'Chờ đăng' | 'Đã đăng' | 'Lỗi' | 'Hủy'
type BacklinkApprovalStatus = 'Chờ duyệt' | 'Đã duyệt' | 'Cần sửa' | 'Từ chối'
type BacklinkLinkStatus = 'Chưa check' | 'Live' | 'Mất link' | 'Sai URL đích' | 'Sai anchor' | '404' | '403' | 'Redirect'
type BacklinkIndexStatus = 'Chưa check' | 'Đã index' | 'Chưa index' | 'Không thể check'
type BacklinkPaymentStatus = 'Chưa thanh toán' | 'Đã thanh toán' | 'Hoàn tiền' | 'Miễn phí'
type BacklinkSourceStatus = 'Đang dùng' | 'Tạm dừng' | 'Blacklist' | 'Cần kiểm tra lại'
type BacklinkPlanStatus = 'Chưa làm' | 'Đang làm' | 'Hoàn thành' | 'Hoãn'
type BacklinkCostType = 'Mua bài' | 'Thuê viết bài' | 'Phí duy trì' | 'Phí index'
type InternalNoteType =
  | 'Chỉnh sửa giao diện'
  | 'Chỉnh sửa nội dung'
  | 'Chỉnh sửa SEO'
  | 'Chỉnh sửa code'
  | 'Chỉnh sửa database'
  | 'Lỗi website'
  | 'Hướng dẫn thao tác'
  | 'Quy trình nội bộ'
  | 'Cấu hình hệ thống'
  | 'Ý tưởng nâng cấp'
type InternalNoteStatus = 'Nháp' | 'Chờ duyệt' | 'Đã duyệt' | 'Đang xử lý' | 'Hoàn thành' | 'Cần kiểm tra lại' | 'Lưu trữ' | 'Hủy'
type InternalNotePriority = 'Thấp' | 'Trung bình' | 'Cao' | 'Khẩn cấp'
type InternalNoteVisibility = 'Nội bộ' | 'Riêng tư' | 'Cho khách xem'
type ArticleType =
  | 'Informational Content'
  | 'Commercial Investigation / Review Content'
  | 'Transactional Content'
  | 'Category Hub'
type ArticleDraftStatus = 'Chua viet' | 'Ban nhap AI' | 'Cho duyet' | 'Da duyet' | 'Can chinh sua'
type QuickKeywordIssue = {
  line: number
  text: string
}

type AnalyticsSettings = {
  propertyId: string
  measurementId: string
  apiEndpoint: string
  accessToken: string
  lastSyncAt?: string
}

type SearchConsoleSettings = {
  siteUrl: string
  apiEndpoint: string
  lastConnectedAt?: string
  lastCheckAt?: string
}

type WordPressSettings = {
  siteUrl: string
  connectorEndpoint: string
  apiKey: string
  lastConnectedAt?: string
  lastSyncAt?: string
}

type GoogleOAuthStatus = {
  configured: boolean
  connected: boolean
  connectedAt: string
  scope: string
}

type ArticleToolImage = {
  index?: number
  prompt: string
  filePath: string
  fileUrl: string
  relativePath: string
  mimeType: string
  imageProvider?: ArticleImageProvider
}

type ArticleToolImageError = {
  index?: number
  prompt: string
  message: string
  imageProvider?: ArticleImageProvider
}

type ArticleToolResult = {
  runId: string
  topic: string
  presentationStyle: ArticlePresentationStyle
  imageProvider?: ArticleImageProvider
  html: string
  previewHtml: string
  htmlPath: string
  htmlUrl: string
  sourcePath: string
  sourceUrl: string
  outputDir: string
  images: ArticleToolImage[]
  imageErrors: ArticleToolImageError[]
  generatedAt: string
}

type ArticleToolHistoryItem = {
  runId: string
  topic: string
  presentationStyle: ArticlePresentationStyle
  imageProvider?: ArticleImageProvider
  htmlUrl: string
  sourceUrl: string
  outputDir: string
  images: ArticleToolImage[]
  imageErrors: ArticleToolImageError[]
  generatedAt: string
  updatedAt?: string
}

type ArticleStandaloneImageResult = {
  runId: string
  image: ArticleToolImage & {
    generatedAt?: string
  }
}

type ArticleToolLogDetail = {
  provider: string
  ok: boolean
  message: string
}

type ArticleToolLog = {
  id: string
  at: string
  action: string
  status: 'success' | 'error' | 'info'
  message: string
  details: ArticleToolLogDetail[]
}

type ArticleImageProvider = 'google-ai' | 'vertex-ai'
type ArticleToolTestProvider = 'claude' | 'gemini' | 'vertex'
type ArticlePresentationStyle = 'professional' | 'raw' | 'wordpress'

type ArticleToolConfigStatus = {
  articleComposerConfigured: boolean
  claudeConfigured: boolean
  geminiConfigured: boolean
  vertexConfigured: boolean
  imageProvider: ArticleImageProvider
  claudeGatewayBaseUrl: string
  claudeGatewayAuthHeader: string
  claudeModel: string
  geminiImageModel: string
  geminiApiBaseUrl: string
  vertexProjectId: string
  vertexRegion: string
  vertexImageModel: string
  outputDir: string
  updatedAt: string
  storedClaudeConfigured: boolean
  storedGeminiConfigured: boolean
  storedVertexCredentialsConfigured: boolean
  envClaudeConfigured: boolean
  envGeminiConfigured: boolean
  envVertexCredentialsConfigured: boolean
  logs: ArticleToolLog[]
}

type WordPressContentItem = {
  id?: number
  type?: string
  title?: string
  url?: string
  path?: string
  slug?: string
  seo?: {
    rankMathFocusKeyword?: string
    yoastFocusKeyword?: string
  }
}

type SearchConsoleInspectionResult = {
  inspectionResult?: {
    inspectionResultLink?: string
    indexStatusResult?: {
      verdict?: string
      coverageState?: string
      lastCrawlTime?: string
    }
  }
}

type AnalyticsPoint = {
  id: string
  projectId: string
  granularity: AnalyticsGranularity
  label: string
  date: string
  activeUsers: number
  sessions: number
  pageViews: number
  engagementRate: number
}

type Project = {
  id: string
  name: string
  client: string
  website: string
  startDate: string
  endDate: string
  budget: number
  status: ProjectStatus
  ownerId: string
  deletedAt?: string
  analytics?: AnalyticsSettings
  searchConsole?: SearchConsoleSettings
  wordpress?: WordPressSettings
}

type Keyword = {
  id: string
  projectId: string
  parentId?: string
  keywordType?: KeywordType
  term: string
  landingUrl: string
  searchVolume: number
  keywordDifficulty: number
  searchIntent: SearchIntent
  position: number
  impressions: number
  clicks: number
  organicTraffic: number
  ctr: number
  articleType?: ArticleType
  articleTitle?: string
  articleMetaDescription?: string
  articleContent?: string
  articleStatus?: ArticleDraftStatus
  articleUpdatedAt?: string
  articleSource?: string
  articleAssigneeId?: string
  articleUrl?: string
  articleTaskId?: string
  articleImported?: boolean
  indexStatus?: KeywordIndexStatus
  indexCheckedAt?: string
  indexCoverageState?: string
  indexLastCrawlAt?: string
  indexInspectionLink?: string
}

type Task = {
  id: string
  projectId: string
  title: string
  assigneeId: string
  dueDate: string
  deadlineAt?: string
  assignedAt?: string
  acceptedAt?: string
  completedAt?: string
  approvedAt?: string
  rejectionReason?: string
  revisionNote?: string
  estimatedHours?: number
  taskSalary?: number
  salaryModule?: TaskSalaryModule
  payrollSettlementId?: string
  payrollSettledAt?: string
  deadlineReminderAt?: string
  overdueEscalatedAt?: string
  cancelledAt?: string
  status: TaskStatus
}

type Transaction = {
  id: string
  projectId: string
  type: TransactionType
  scope?: ExpenseScope
  spenderId?: string
  label: string
  amount: number
  date: string
  settlementDate?: string
  payrollSettlementId?: string
}

type PayrollSettlement = {
  id: string
  userId: string
  salaryType: SalaryType
  period: string
  amount: number
  taskIds: string[]
  transactionId: string
  settledAt: string
  createdBy: string
  note?: string
}

type SeoEntity = {
  id: string
  projectId: string
  name: string
  officialName: string
  alternativeNames: string
  entityType: EntityType
  website: string
  logoUrl: string
  coverUrl: string
  shortDescription: string
  shortDescriptionHtml?: string
  longDescription: string
  longDescriptionHtml?: string
  anchorText?: string
  anchorTextHtml?: string
  industry: string
  countryLanguage: string
  phone: string
  email: string
  address: string
  mapsUrl: string
  status: EntityStatus
  googleAccountEmail?: string
  googleAccountPassword?: string
  googleAccountPhone?: string
  googleBackupAccount?: string
  googleTwoFactorCode?: string
  defaultAccountId?: string
  defaultAccountPassword?: string
  defaultAccountEmail?: string
}

type SeoEntityPlatform = {
  id: string
  name: string
  domain: string
  description: string
  group: EntityPlatformGroup
  defaultLinkType: EntityLinkType
  backlinkType: string
  category: string
  niche: string
  domainAuthority: number
  status: EntityPlatformStatus
  guideFileName: string
  guideUrl: string
}

type EntityGuideScanRecord = {
  fileName: string
  exists: boolean
  checkedAt: string
  url?: string
}

type SeoEntityLink = {
  id: string
  projectId: string
  entityId: string
  platformId: string
  loginWithGoogle?: boolean
  useDefaultEntityAccount?: boolean
  loginAccount?: string
  loginPassword?: string
  loginEmail?: string
  accountUsed: string
  liveUrl: string
  targetUrl: string
  anchorText: string
  displayName: string
  usedDescription: string
  assigneeId: string
  deployedDate: string
  deploymentStatus: EntityDeploymentStatus
  linkStatus: EntityLiveStatus
  indexStatus: EntityIndexStatus
  napStatus: EntityNapStatus
  httpStatus?: number
  lastCheckedAt?: string
  taskId?: string
  notes: string
}

type EntityLinkCredential = {
  loginWithGoogle: boolean
  useDefaultEntityAccount: boolean
  loginAccount: string
  loginPassword: string
  loginEmail: string
  accountUsed: string
}

type SeoEntityChecklistItem = {
  id: string
  projectId: string
  entityId: string
  label: string
  done: boolean
  updatedAt?: string
}

type SeoEntitySchema = {
  id: string
  projectId: string
  entityId: string
  schemaType: EntityType
  jsonLd: string
  updatedAt: string
}

type SeoBacklinkSource = {
  id: string
  name: string
  domain: string
  contactUrl: string
  sourceType: BacklinkSourceType
  topic: string
  country: string
  language: string
  da: number
  dr: number
  ur: number
  estimatedTraffic: number
  spamScore: number
  defaultLinkType: BacklinkLinkType
  price: number
  currency: string
  linkDuration: string
  allowEdit: boolean
  allowAnchorChange: boolean
  status: BacklinkSourceStatus
  note: string
}

type SeoBacklink = {
  id: string
  projectId: string
  sourceId: string
  sourceUrl: string
  sourceDomain: string
  targetUrl: string
  anchorText: string
  anchorType: BacklinkAnchorType
  linkType: BacklinkLinkType
  backlinkType: BacklinkType
  linkPosition: BacklinkPosition
  assigneeId: string
  placedAt: string
  expiredAt: string
  cost: number
  currency: string
  deploymentStatus: BacklinkDeploymentStatus
  approvalStatus: BacklinkApprovalStatus
  linkStatus: BacklinkLinkStatus
  indexStatus: BacklinkIndexStatus
  paymentStatus: BacklinkPaymentStatus
  backlinkScore: number
  lastCheckedAt?: string
  note: string
}

type SeoBacklinkPlan = {
  id: string
  projectId: string
  targetUrl: string
  targetKeyword: string
  backlinkType: BacklinkType
  plannedAnchor: string
  plannedQuantity: number
  plannedDate: string
  assigneeId: string
  taskId?: string
  status: BacklinkPlanStatus
  note: string
}

type SeoBacklinkCost = {
  id: string
  projectId: string
  backlinkId: string
  sourceId: string
  costType: BacklinkCostType
  amount: number
  currency: string
  paidBy: string
  paidAt: string
  paymentStatus: BacklinkPaymentStatus
  invoiceUrl: string
  note: string
}

type SocialChannel = {
  id: string
  projectId: string
  name: string
  platform: SocialPlatform
  channelType: SocialChannelType
  publicUrl: string
  ownerUserId: string
  contentCategory: string
  status: SocialChannelStatus
  note: string
  createdAt: string
  updatedAt: string
}

type SocialCampaign = {
  id: string
  projectId: string
  name: string
  goal: string
  description: string
  platforms: SocialPlatform[]
  startDate: string
  endDate: string
  budget: number
  currency: string
  plannedPosts: number
  ownerUserId: string
  status: SocialCampaignStatus
  note: string
  createdAt: string
  updatedAt: string
}

type SocialPost = {
  id: string
  projectId: string
  campaignId: string
  channelId: string
  title: string
  platform: SocialPlatform
  postType: SocialPostType
  topic: string
  caption: string
  hashtags: string
  cta: string
  attachedLink: string
  scheduledAt: string
  publishedAt: string
  publishedUrl: string
  writerId: string
  designerId: string
  approverId: string
  contentStatus: SocialContentStatus
  mediaStatus: SocialMediaStatus
  publishStatus: SocialPublishStatus
  priority: SocialPriority
  note: string
  createdAt: string
  updatedAt: string
}

type SocialPostMedia = {
  id: string
  postId: string
  fileName: string
  fileUrl: string
  fileType: 'image' | 'video' | 'document' | 'design'
  uploadedBy: string
  status: SocialMediaStatus
  note: string
  createdAt: string
  updatedAt: string
}

type SocialPostApproval = {
  id: string
  postId: string
  approverId: string
  status: SocialApprovalStatus
  feedback: string
  approvedAt: string
  createdAt: string
  updatedAt: string
}

type SocialPostComment = {
  id: string
  postId: string
  content: string
  createdBy: string
  createdAt: string
}

type SocialPostMetric = {
  id: string
  postId: string
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  linkClicks: number
  inboxCount: number
  ordersCount: number
  adSpend: number
  revenue: number
  metricDate: string
  collectedBy: string
  createdAt: string
  updatedAt: string
}

type SocialContentTemplate = {
  id: string
  projectId: string
  name: string
  templateType: SocialTemplateType
  platform: SocialPlatform | ''
  captionTemplate: string
  hashtagTemplate: string
  ctaTemplate: string
  note: string
  createdBy: string
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

type InternalNote = {
  id: string
  guideCode: string
  projectId: string
  website: string
  title: string
  noteType: InternalNoteType
  category: string
  relatedUrl: string
  affectedArea: string
  problemDescription: string
  content: string
  reason: string
  priority: InternalNotePriority
  status: InternalNoteStatus
  visibility: InternalNoteVisibility
  requestedBy: string
  assignedTo: string
  createdBy: string
  approvedBy?: string
  approvedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  tags: string[]
  extraNote: string
  version: number
  archivedAt?: string
  deletedAt?: string
}

type InternalNoteTag = {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

type InternalNoteFile = {
  id: string
  noteId: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  uploadedBy: string
  createdAt: string
}

type InternalNoteVersion = {
  id: string
  noteId: string
  versionNumber: number
  title: string
  content: string
  changedBy: string
  changeNote: string
  createdAt: string
}

type InternalNoteComment = {
  id: string
  noteId: string
  parentId?: string
  content: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

type User = {
  id: string
  name: string
  email: string
  password?: string
  role: Role
  active: boolean
  permissions: string[]
  salaryType?: SalaryType
  salaryAmount?: number
  checkedInAt?: string
  totalWorkedMs?: number
}

type ActivityLog = {
  id: string
  actorId: string
  actorName: string
  action: string
  target: string
  at: string
}

type NotificationItem = {
  id: string
  recipientId: string
  title: string
  message: string
  projectId?: string
  taskId?: string
  linkView?: View
  createdAt: string
  readAt?: string
}

type AppData = {
  projects: Project[]
  keywords: Keyword[]
  tasks: Task[]
  transactions: Transaction[]
  users: User[]
  payrollSettlements?: PayrollSettlement[]
  seoEntities?: SeoEntity[]
  seoEntityPlatforms?: SeoEntityPlatform[]
  seoEntityLinks?: SeoEntityLink[]
  seoEntityChecklist?: SeoEntityChecklistItem[]
  seoEntitySchemas?: SeoEntitySchema[]
  seoBacklinkSources?: SeoBacklinkSource[]
  seoBacklinks?: SeoBacklink[]
  seoBacklinkPlans?: SeoBacklinkPlan[]
  seoBacklinkCosts?: SeoBacklinkCost[]
  taskSalarySettings?: TaskSalarySettings
  internalNotes?: InternalNote[]
  internalNoteTags?: InternalNoteTag[]
  internalNoteFiles?: InternalNoteFile[]
  internalNoteVersions?: InternalNoteVersion[]
  internalNoteComments?: InternalNoteComment[]
  socialChannels?: SocialChannel[]
  socialCampaigns?: SocialCampaign[]
  socialPosts?: SocialPost[]
  socialPostMedia?: SocialPostMedia[]
  socialPostApprovals?: SocialPostApproval[]
  socialPostComments?: SocialPostComment[]
  socialPostMetrics?: SocialPostMetric[]
  socialContentTemplates?: SocialContentTemplate[]
  analyticsReports?: AnalyticsPoint[]
  notifications?: NotificationItem[]
  activityLogs?: ActivityLog[]
  entityGuideScanHistory?: EntityGuideScanRecord[]
}

const storageKey = 'seo-demo-data-v5'
const entityCredentialKey = 'seo-demo-entity-link-credentials'
const appZoomKey = 'seo-ops-ui-zoom'
const defaultAppZoom = 0.8
const activeProjectStorageKey = (userId: string) => `seo-ops-active-project-${userId}`
const clampAppZoom = (value: number) => Math.min(1.2, Math.max(0.7, Number(value.toFixed(2))))
const appVersion = '1.0.0'
const appTimeZone = 'Asia/Bangkok'
const permissions = ['Dự án', 'Ghi chú', 'Tài chính', 'Nhân sự', 'Tiến độ', 'Hệ thống']
const toolPermissionName = 'Công cụ'
if (!permissions.includes(toolPermissionName)) permissions.push(toolPermissionName)
const socialPermissionName = 'Social Planner'
if (!permissions.includes(socialPermissionName)) permissions.push(socialPermissionName)
const permissionActions: { value: PermissionAction; label: string }[] = [
  { value: 'view', label: 'Xem' },
  { value: 'edit', label: 'Chỉnh sửa' },
]
const keywordTypeLabels: Record<KeywordType, string> = {
  A: 'A. Short-tail Keywords',
  B: 'B. Mid-tail Keywords',
  C: 'C. Long-tail Keywords',
}
const articleTypes: ArticleType[] = [
  'Informational Content',
  'Commercial Investigation / Review Content',
  'Transactional Content',
  'Category Hub',
]
const salaryTypes: SalaryType[] = ['Lương theo giờ', 'Lương theo tháng', 'Lương theo task']
const taskSalaryModules: TaskSalaryModule[] = ['Bài viết', 'Backlink', 'SEO Entity']
const defaultTaskSalarySettings: TaskSalarySettings = {
  'Bài viết': 0,
  Backlink: 0,
  'SEO Entity': 0,
}
const editableTaskStatuses: TaskStatus[] = ['Chờ nhận', 'Đang làm', 'Cần chỉnh sửa', 'Chờ duyệt', 'Từ chối', 'Hoàn thành', 'Đã hủy']
const entityTabs: { id: EntityTab; label: string }[] = [
  { id: 'overview', label: 'Tổng quan Entity' },
  { id: 'profile', label: 'Hồ sơ Entity' },
  { id: 'platforms', label: 'Nền tảng Entity' },
  { id: 'links', label: 'Link Entity' },
  { id: 'checklist', label: 'Checklist Entity' },
  { id: 'schema', label: 'Schema Entity' },
  { id: 'check', label: 'Check Entity' },
  { id: 'reports', label: 'Báo cáo Entity' },
]
const backlinkTabs: { id: BacklinkTab; label: string }[] = [
  { id: 'overview', label: 'Tổng quan Backlink' },
  { id: 'sources', label: 'Kho nguồn Backlink' },
  { id: 'links', label: 'Backlink đã triển khai' },
  { id: 'plans', label: 'Kế hoạch đi link' },
  { id: 'anchors', label: 'Anchor Text' },
  { id: 'check', label: 'Check Backlink' },
  { id: 'costs', label: 'Chi phí Backlink' },
  { id: 'reports', label: 'Báo cáo Backlink' },
]
const knowledgeTabs: { id: KnowledgeTab; label: string }[] = [
  { id: 'all', label: 'Tất cả ghi chú' },
  { id: 'web-log', label: 'Nhật ký chỉnh sửa Web' },
  { id: 'issues', label: 'Lỗi & cách xử lý' },
  { id: 'guides', label: 'Hướng dẫn nội bộ' },
  { id: 'sops', label: 'Quy trình thao tác' },
  { id: 'technical', label: 'Tài liệu kỹ thuật' },
  { id: 'files', label: 'File đính kèm' },
  { id: 'archive', label: 'Thùng rác / lưu trữ' },
]
const socialTabs: { id: SocialTab; label: string }[] = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'channels', label: 'Kênh mạng xã hội' },
  { id: 'campaigns', label: 'Chiến dịch Social' },
  { id: 'posts', label: 'Kế hoạch & bài viết' },
  { id: 'calendar', label: 'Lịch đăng bài' },
  { id: 'approvals', label: 'Duyệt nội dung' },
  { id: 'media', label: 'Kho media' },
  { id: 'templates', label: 'Mẫu nội dung' },
  { id: 'reports', label: 'Báo cáo Social' },
]
const socialPlatforms: SocialPlatform[] = ['facebook', 'instagram', 'tiktok', 'youtube', 'zalo', 'pinterest', 'x', 'linkedin', 'threads', 'shopee_feed', 'other']
const socialChannelTypes: SocialChannelType[] = ['fanpage', 'profile', 'group', 'channel', 'oa', 'board', 'shop_feed', 'other']
const socialChannelStatuses: SocialChannelStatus[] = ['active', 'paused', 'login_error', 'lost_permission', 'archived']
const socialCampaignStatuses: SocialCampaignStatus[] = ['draft', 'active', 'paused', 'completed', 'cancelled']
const socialPostTypes: SocialPostType[] = ['text', 'image', 'video', 'reel', 'short', 'story', 'album', 'livestream', 'carousel', 'other']
const socialContentStatuses: SocialContentStatus[] = ['draft', 'writing', 'ready_for_design', 'waiting_approval', 'revision_required', 'approved', 'archived']
const socialMediaStatuses: SocialMediaStatus[] = ['missing', 'designing', 'uploaded', 'revision_required', 'approved', 'used']
const socialPublishStatuses: SocialPublishStatus[] = ['not_scheduled', 'scheduled', 'published', 'failed', 'cancelled', 'overdue']
const socialPriorities: SocialPriority[] = ['low', 'normal', 'high', 'urgent']
const socialTemplateTypes: SocialTemplateType[] = ['caption', 'hashtag', 'cta', 'script', 'comment_reply']
const internalNoteTypes: InternalNoteType[] = [
  'Chỉnh sửa giao diện',
  'Chỉnh sửa nội dung',
  'Chỉnh sửa SEO',
  'Chỉnh sửa code',
  'Chỉnh sửa database',
  'Lỗi website',
  'Hướng dẫn thao tác',
  'Quy trình nội bộ',
  'Cấu hình hệ thống',
  'Ý tưởng nâng cấp',
]
const internalNoteStatuses: InternalNoteStatus[] = ['Nháp', 'Chờ duyệt', 'Đã duyệt', 'Đang xử lý', 'Hoàn thành', 'Cần kiểm tra lại', 'Lưu trữ', 'Hủy']
const internalNotePriorities: InternalNotePriority[] = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp']
const internalNoteVisibilityOptions: InternalNoteVisibility[] = ['Nội bộ', 'Riêng tư', 'Cho khách xem']
const internalNoteCategories = ['SEO', 'Dev', 'Content', 'Admin', 'CSKH', 'Thiết kế', 'Vận hành', 'Kỹ thuật']
const suggestedInternalTags = [
  'homepage',
  'product-page',
  'blog',
  'checkout',
  'admin',
  'title',
  'meta',
  'schema',
  'backlink',
  'entity',
  'index',
  'sitemap',
  'frontend',
  'backend',
  'database',
  'API',
  'deploy',
  'tracking',
  'backup',
]
const htmlGuideFileType = 'Hướng dẫn HTML'
const htmlGuideMaxBytes = 2 * 1024 * 1024
const entityTypes: EntityType[] = ['Brand', 'Company', 'Local Business', 'Person', 'Product', 'Service', 'Website']
const entityStatuses: EntityStatus[] = ['Đang dùng', 'Tạm dừng', 'Hoàn thành']
const entityPlatformGroups: EntityPlatformGroup[] = [
  'Profile Link',
  'Web 2.0',
  'Article Submission',
  'Social Bookmark / Bookmark',
  'Forum Post',
  'URL Shortener',
  'Business Listing',
  'Comment',
  'Image Submission',
  'Other',
  'Web 2.0 Article Submission',
  'Web 2.0 Social Bookmark / Web 2.0 Bookmark',
]
const entityPlatformGroupDescriptions: Record<EntityPlatformGroup, string> = {
  'Profile Link': 'Tạo tài khoản trên diễn đàn hoặc website và đặt liên kết về website chính trong hồ sơ người dùng.',
  'Web 2.0': 'Xây dựng blog hoặc website phụ trên nền tảng miễn phí như WordPress, Blogger hoặc Tumblr để trỏ link về website chính.',
  'Article Submission': 'Đăng bài viết có chứa liên kết lên thư mục bài viết hoặc website cho phép đóng góp nội dung.',
  'Social Bookmark / Bookmark': 'Lưu trữ và chia sẻ liên kết website trên mạng xã hội chuyên đánh dấu trang như Reddit, Pinterest hoặc Digg.',
  'Forum Post': 'Đăng bài viết hoặc tạo chủ đề thảo luận trên diễn đàn có chứa liên kết.',
  'URL Shortener': 'Sử dụng dịch vụ rút gọn liên kết như Bitly hoặc TinyURL để tạo liên kết chuyển hướng.',
  'Business Listing': 'Đăng ký tên, địa chỉ, số điện thoại và website doanh nghiệp trên danh bạ địa phương hoặc bản đồ.',
  Comment: 'Để lại bình luận trên blog hoặc diễn đàn và chèn liên kết ở tên người bình luận hoặc nội dung.',
  'Image Submission': 'Đăng hình ảnh lên nền tảng chia sẻ ảnh như Flickr, Imgur hoặc Pinterest kèm liên kết trong mô tả.',
  Other: 'Các hình thức liên kết hỗn hợp hoặc chưa thuộc nhóm cơ bản.',
  'Web 2.0 Article Submission': 'Viết và đăng tải bài viết trực tiếp lên hệ thống blog Web 2.0.',
  'Web 2.0 Social Bookmark / Web 2.0 Bookmark': 'Sử dụng nền tảng Web 2.0 để đánh dấu và chia sẻ trang.',
}
const entityPlatformGroupTooltipText = entityPlatformGroups
  .map((group) => `${group}: ${entityPlatformGroupDescriptions[group]}`)
  .join('\n\n')
const entityLinkTypes: EntityLinkType[] = ['Dofollow', 'Nofollow', 'Redirect', 'Mention']
const entityPlatformStatuses: EntityPlatformStatus[] = ['Dùng được', 'Lỗi', 'Khó đăng ký', 'Không cho đặt link', 'Ngừng dùng']
const entityLiveStatuses: EntityLiveStatus[] = ['Chưa check', 'Live', 'Redirect', '404', '403', 'Mất link', 'Không tìm thấy URL đích']
const entityIndexStatuses: EntityIndexStatus[] = ['Chưa check', 'Đã index', 'Chưa index', 'Không thể check']
const entityNapStatuses: EntityNapStatus[] = ['Chưa check', 'Đúng', 'Sai tên', 'Sai SĐT', 'Sai địa chỉ', 'Thiếu thông tin']
const backlinkSourceTypes: BacklinkSourceType[] = ['Guest Post', 'Báo', 'Forum', 'Blog', 'Web 2.0', 'PBN', 'Social', 'Directory', 'Comment']
const backlinkTypes: BacklinkType[] = ['Guest Post', 'Báo chí', 'Forum', 'Web 2.0', 'Entity', 'Social', 'PBN', 'Directory', 'Comment', 'Profile', 'Image link', 'Redirect link']
const backlinkLinkTypes: BacklinkLinkType[] = ['Dofollow', 'Nofollow', 'Sponsored', 'UGC', 'Redirect']
const backlinkAnchorTypes: BacklinkAnchorType[] = ['Brand anchor', 'Exact match', 'Partial match', 'Naked URL', 'Generic', 'Long-tail', 'Image anchor', 'Compound anchor']
const backlinkPositions: BacklinkPosition[] = ['Trong bài viết', 'Sidebar', 'Footer', 'Profile', 'Comment', 'Bio']
const backlinkDeploymentStatuses: BacklinkDeploymentStatus[] = ['Chưa làm', 'Đang làm', 'Chờ đăng', 'Đã đăng', 'Lỗi', 'Hủy']
const backlinkApprovalStatuses: BacklinkApprovalStatus[] = ['Chờ duyệt', 'Đã duyệt', 'Cần sửa', 'Từ chối']
const backlinkLinkStatuses: BacklinkLinkStatus[] = ['Chưa check', 'Live', 'Mất link', 'Sai URL đích', 'Sai anchor', '404', '403', 'Redirect']
const backlinkIndexStatuses: BacklinkIndexStatus[] = ['Chưa check', 'Đã index', 'Chưa index', 'Không thể check']
const backlinkPaymentStatuses: BacklinkPaymentStatus[] = ['Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền', 'Miễn phí']
const backlinkSourceStatuses: BacklinkSourceStatus[] = ['Đang dùng', 'Tạm dừng', 'Blacklist', 'Cần kiểm tra lại']
const backlinkPlanStatuses: BacklinkPlanStatus[] = ['Chưa làm', 'Đang làm', 'Hoàn thành', 'Hoãn']
const backlinkCostTypes: BacklinkCostType[] = ['Mua bài', 'Thuê viết bài', 'Phí duy trì', 'Phí index']
const entityChecklistTemplates = [
  'Chuẩn hóa tên entity',
  'Chuẩn hóa mô tả',
  'Chuẩn hóa NAP',
  'Upload logo',
  'Tạo social chính',
  'Tạo profile phụ',
  'Tạo web 2.0',
  'Tạo citation',
  'Thêm schema',
  'Check link sống',
  'Check index',
  'Xuất báo cáo',
]
const analyticsGranularityLabels: Record<AnalyticsGranularity, string> = {
  day: 'Ngày',
  week: 'Tuần',
  month: 'Tháng',
  year: 'Năm',
}

const emptyAnalyticsSettings: AnalyticsSettings = {
  propertyId: '',
  measurementId: '',
  apiEndpoint: '',
  accessToken: '',
}

const emptySearchConsoleSettings: SearchConsoleSettings = {
  siteUrl: '',
  apiEndpoint: '/api/search-console/inspect',
}

const emptyWordPressSettings: WordPressSettings = {
  siteUrl: '',
  connectorEndpoint: '',
  apiKey: '',
}

const emptyGoogleOAuthStatus: GoogleOAuthStatus = {
  configured: false,
  connected: false,
  connectedAt: '',
  scope: '',
}

const initialData: AppData = {
  taskSalarySettings: defaultTaskSalarySettings,
  payrollSettlements: [],
  entityGuideScanHistory: [],
  users: [
    {
      id: 'u1',
      name: 'Nguyễn Minh Anh',
      email: 'anh@agency.vn',
      password: '123456',
      role: 'Quản trị viên',
      active: true,
      permissions,
      salaryType: 'Lương theo tháng',
      salaryAmount: 25000000,
    },
    {
      id: 'u2',
      name: 'Trần Bảo Long',
      email: 'long@agency.vn',
      password: '123456',
      role: 'Trưởng nhóm SEO',
      active: true,
      permissions: ['Dự án', 'Tiến độ'],
      salaryType: 'Lương theo tháng',
      salaryAmount: 18000000,
    },
    {
      id: 'u3',
      name: 'Lê Hoài Nam',
      email: 'nam@agency.vn',
      password: '123456',
      role: 'Nội dung',
      active: true,
      permissions: ['Dự án'],
      salaryType: 'Lương theo task',
      salaryAmount: 350000,
    },
    {
      id: 'u4',
      name: 'Phạm Thu Hà',
      email: 'ha@agency.vn',
      password: '123456',
      role: 'Tài chính',
      active: true,
      permissions: ['Tài chính'],
      salaryType: 'Lương theo giờ',
      salaryAmount: 150000,
    },
  ],
  projects: [
    {
      id: 'p1',
      name: 'SEO Website Nội Thất',
      client: 'An Gia Decor',
      website: 'angia-decor.vn',
      startDate: '2026-05-01',
      endDate: '2026-09-30',
      budget: 180000000,
      status: 'Đang SEO',
      ownerId: 'u2',
    },
    {
      id: 'p2',
      name: 'SEO Nha Khoa Local',
      client: 'SmileCare',
      website: 'smilecare.vn',
      startDate: '2026-04-10',
      endDate: '2026-08-10',
      budget: 96000000,
      status: 'Đang SEO',
      ownerId: 'u1',
    },
  ],
  keywords: [
    {
      id: 'k1',
      projectId: 'p1',
      keywordType: 'A',
      term: 'thiết kế nội thất chung cư',
      landingUrl: '/thiet-ke-noi-that-chung-cu',
      searchVolume: 3200,
      keywordDifficulty: 42,
      searchIntent: 'Commercial',
      position: 18,
      impressions: 12800,
      clicks: 420,
      organicTraffic: 390,
      ctr: 3.28,
      articleType: 'Commercial Investigation / Review Content',
      articleTitle: 'Thiết kế nội thất chung cư trọn gói',
      articleAssigneeId: 'u3',
      articleUrl: '',
    },
    {
      id: 'k2',
      projectId: 'p1',
      parentId: 'k1',
      keywordType: 'B',
      term: 'báo giá thi công nội thất',
      landingUrl: '/bao-gia-thi-cong-noi-that',
      searchVolume: 1900,
      keywordDifficulty: 36,
      searchIntent: 'Transactional',
      position: 11,
      impressions: 7600,
      clicks: 330,
      organicTraffic: 304,
      ctr: 4.34,
      articleType: 'Transactional Content',
      articleTitle: 'Báo giá thi công nội thất mới nhất',
      articleAssigneeId: 'u3',
      articleUrl: '',
    },
    {
      id: 'k3',
      projectId: 'p2',
      keywordType: 'A',
      term: 'nha khoa quận 1',
      landingUrl: '/nha-khoa-quan-1',
      searchVolume: 880,
      keywordDifficulty: 24,
      searchIntent: 'Navigational',
      position: 7,
      impressions: 3300,
      clicks: 210,
      organicTraffic: 198,
      ctr: 6.36,
      articleType: 'Category Hub',
      articleTitle: 'Nha khoa quận 1 uy tín',
      articleAssigneeId: 'u2',
      articleUrl: '',
    },
  ],
  tasks: [
    {
      id: 't1',
      projectId: 'p1',
      title: 'Audit technical SEO và Core Web Vitals',
      assigneeId: 'u2',
      dueDate: '2026-05-18',
      status: 'Hoàn thành',
    },
    {
      id: 't2',
      projectId: 'p1',
      title: 'Lên outline 12 bài content chuyên mục',
      assigneeId: 'u3',
      dueDate: '2026-05-24',
      status: 'Đang làm',
    },
    {
      id: 't3',
      projectId: 'p2',
      title: 'Tối ưu Google Business Profile',
      assigneeId: 'u2',
      dueDate: '2026-05-22',
      status: 'Đang làm',
    },
    {
      id: 't4',
      projectId: 'p2',
      title: 'Viết landing page dịch vụ niềng răng',
      assigneeId: 'u3',
      dueDate: '2026-05-28',
      status: 'Cần làm',
    },
  ],
  transactions: [
    {
      id: 'm1',
      projectId: 'p1',
      type: 'Chi',
      scope: 'Chi riêng dự án',
      spenderId: 'u4',
      label: 'Tạm ứng hợp đồng tháng 5',
      amount: 45000000,
      date: '2026-05-03',
      settlementDate: '2026-05-10',
    },
    {
      id: 'm2',
      projectId: 'p1',
      type: 'Chi',
      scope: 'Chi riêng dự án',
      spenderId: 'u4',
      label: 'Chi phí content và backlink',
      amount: 12000000,
      date: '2026-05-09',
      settlementDate: '2026-05-15',
    },
    {
      id: 'm3',
      projectId: 'p2',
      type: 'Chi',
      scope: 'Chi riêng dự án',
      spenderId: 'u4',
      label: 'Thanh toán gói local SEO',
      amount: 28000000,
      date: '2026-05-05',
      settlementDate: '2026-05-12',
    },
    {
      id: 'm4',
      projectId: 'p2',
      type: 'Chi',
      scope: 'Chi riêng dự án',
      spenderId: 'u4',
      label: 'Chi phí citation và media',
      amount: 6400000,
      date: '2026-05-12',
      settlementDate: '',
    },
  ],
  seoEntities: [
    {
      id: 'entity-p1',
      projectId: 'p1',
      name: 'An Gia Decor',
      officialName: 'Công ty Nội thất An Gia Decor',
      alternativeNames: 'An Gia, An Gia Interior',
      entityType: 'Local Business',
      website: 'https://angia-decor.vn',
      logoUrl: '',
      coverUrl: '',
      shortDescription: 'Đơn vị thiết kế và thi công nội thất căn hộ, nhà phố, văn phòng.',
      longDescription: 'An Gia Decor cung cấp dịch vụ thiết kế, thi công nội thất trọn gói với quy trình tư vấn, khảo sát, thiết kế 3D và hoàn thiện công trình.',
      industry: 'Thiết kế nội thất',
      countryLanguage: 'Việt Nam / Tiếng Việt',
      phone: '0900000000',
      email: 'contact@angia-decor.vn',
      address: 'Hà Nội, Việt Nam',
      mapsUrl: '',
      status: 'Đang dùng',
      googleAccountEmail: '',
      googleAccountPassword: '',
      googleAccountPhone: '',
      googleBackupAccount: '',
      googleTwoFactorCode: '',
      defaultAccountId: '',
      defaultAccountPassword: '',
      defaultAccountEmail: '',
    },
  ],
  seoEntityPlatforms: [
    {
      id: 'ep-facebook',
      name: 'Facebook',
      domain: 'facebook.com',
      description: '',
      group: 'Social Bookmark / Bookmark',
      defaultLinkType: 'Nofollow',
      backlinkType: '',
      category: '',
      niche: '',
      domainAuthority: 96,
      status: 'Dùng được',
      guideFileName: '',
      guideUrl: '',
    },
    {
      id: 'ep-medium',
      name: 'Medium',
      domain: 'medium.com',
      description: '',
      group: 'Web 2.0 Article Submission',
      defaultLinkType: 'Nofollow',
      backlinkType: '',
      category: '',
      niche: '',
      domainAuthority: 95,
      status: 'Dùng được',
      guideFileName: '',
      guideUrl: '',
    },
  ],
  seoEntityLinks: [
    {
      id: 'el-1',
      projectId: 'p1',
      entityId: 'entity-p1',
      platformId: 'ep-facebook',
      loginWithGoogle: false,
      loginAccount: 'facebook/an-gia-decor',
      loginPassword: '',
      accountUsed: 'facebook/an-gia-decor',
      liveUrl: 'https://facebook.com/angiadecor',
      targetUrl: 'https://angia-decor.vn',
      anchorText: 'An Gia Decor',
      displayName: 'An Gia Decor',
      usedDescription: 'Thiết kế và thi công nội thất trọn gói.',
      assigneeId: 'u2',
      deployedDate: '2026-05-12',
      deploymentStatus: 'Đã live',
      linkStatus: 'Live',
      indexStatus: 'Chưa check',
      napStatus: 'Đúng',
      httpStatus: 200,
      lastCheckedAt: '',
      taskId: '',
      notes: '',
    },
  ],
  seoEntityChecklist: [],
  seoEntitySchemas: [],
  seoBacklinkSources: [
    {
      id: 'bs-1',
      name: 'Guest Post Nội thất 24h',
      domain: 'noithat24h.vn',
      contactUrl: 'https://noithat24h.vn/lien-he',
      sourceType: 'Guest Post',
      topic: 'Nội thất',
      country: 'Việt Nam',
      language: 'Tiếng Việt',
      da: 28,
      dr: 36,
      ur: 18,
      estimatedTraffic: 12000,
      spamScore: 4,
      defaultLinkType: 'Dofollow',
      price: 2500000,
      currency: 'VND',
      linkDuration: 'Vĩnh viễn',
      allowEdit: true,
      allowAnchorChange: true,
      status: 'Đang dùng',
      note: 'Phù hợp bài guest post ngành nội thất.',
    },
  ],
  seoBacklinks: [
    {
      id: 'bl-1',
      projectId: 'p1',
      sourceId: 'bs-1',
      sourceUrl: 'https://noithat24h.vn/thiet-ke-noi-that-chung-cu-dep',
      sourceDomain: 'noithat24h.vn',
      targetUrl: 'https://angia-decor.vn/thiet-ke-noi-that-chung-cu',
      anchorText: 'thiết kế nội thất chung cư',
      anchorType: 'Exact match',
      linkType: 'Dofollow',
      backlinkType: 'Guest Post',
      linkPosition: 'Trong bài viết',
      assigneeId: 'u2',
      placedAt: '2026-05-15',
      expiredAt: '',
      cost: 2500000,
      currency: 'VND',
      deploymentStatus: 'Đã đăng',
      approvalStatus: 'Đã duyệt',
      linkStatus: 'Live',
      indexStatus: 'Đã index',
      paymentStatus: 'Đã thanh toán',
      backlinkScore: 0,
      lastCheckedAt: '',
      note: '',
    },
  ],
  seoBacklinkPlans: [],
  seoBacklinkCosts: [],
  internalNotes: [
    {
      id: 'in-1',
      guideCode: '',
      projectId: 'p1',
      website: 'angia-decor.vn',
      title: 'Sửa banner trang chủ An Gia Decor',
      noteType: 'Chỉnh sửa giao diện',
      category: 'Dev',
      relatedUrl: '/',
      affectedArea: 'Trang chủ',
      problemDescription: 'Banner cũ chưa nhấn mạnh dịch vụ thiết kế nội thất trọn gói và hiển thị chưa tốt trên mobile.',
      content: 'Thay banner mới, đổi CTA, căn lại kích thước ảnh mobile và kiểm tra khoảng cách giữa hero với khối dịch vụ.',
      reason: 'Tăng nhận diện thương hiệu và làm giao diện đúng định vị ngành nội thất.',
      priority: 'Cao',
      status: 'Hoàn thành',
      visibility: 'Nội bộ',
      requestedBy: 'u1',
      assignedTo: 'u2',
      createdBy: 'u2',
      approvedBy: 'u1',
      approvedAt: '2026-05-18T09:00:00+07:00',
      completedAt: '2026-05-18T10:30:00+07:00',
      createdAt: '2026-05-18T08:30:00+07:00',
      updatedAt: '2026-05-18T10:30:00+07:00',
      tags: ['homepage', 'banner', 'frontend'],
      extraNote: 'Đã kiểm tra desktop và mobile.',
      version: 1,
    },
    {
      id: 'in-2',
      guideCode: 'HD-00000IN2',
      projectId: 'p1',
      website: 'angia-decor.vn',
      title: 'Hướng dẫn thêm backlink vào dự án SEO',
      noteType: 'Hướng dẫn thao tác',
      category: 'SEO',
      relatedUrl: '',
      affectedArea: 'Module Backlink',
      problemDescription: '',
      content: '1. Vào Dự án SEO\n2. Chọn module Backlink\n3. Bấm Thêm backlink\n4. Nhập URL nguồn, URL đích, anchor text\n5. Chọn loại link\n6. Bấm lưu\n7. Bấm check link sống\n8. Gửi Leader duyệt',
      reason: 'Chuẩn hóa thao tác nhập backlink cho nhân viên SEO.',
      priority: 'Trung bình',
      status: 'Đã duyệt',
      visibility: 'Nội bộ',
      requestedBy: 'u2',
      assignedTo: 'u3',
      createdBy: 'u2',
      approvedBy: 'u1',
      approvedAt: '2026-05-17T15:00:00+07:00',
      completedAt: '',
      createdAt: '2026-05-17T14:30:00+07:00',
      updatedAt: '2026-05-17T15:00:00+07:00',
      tags: ['backlink', 'hướng-dẫn', 'quy-trình'],
      extraNote: 'Checklist: URL nguồn đúng, URL đích đúng, anchor đúng, Leader đã duyệt.',
      version: 1,
    },
  ],
  internalNoteTags: [
    { id: 'tag-homepage', name: 'homepage', color: '#2563eb', createdAt: '2026-05-17T14:00:00+07:00', updatedAt: '2026-05-17T14:00:00+07:00' },
    { id: 'tag-schema', name: 'schema', color: '#0f766e', createdAt: '2026-05-17T14:00:00+07:00', updatedAt: '2026-05-17T14:00:00+07:00' },
    { id: 'tag-backlink', name: 'backlink', color: '#d97706', createdAt: '2026-05-17T14:00:00+07:00', updatedAt: '2026-05-17T14:00:00+07:00' },
  ],
  internalNoteFiles: [
    {
      id: 'inf-1',
      noteId: 'in-1',
      fileName: 'banner-home-before-after.png',
      fileUrl: 'https://drive.google.com/',
      fileType: 'Ảnh trước/sau',
      fileSize: 0,
      uploadedBy: 'u2',
      createdAt: '2026-05-18T10:35:00+07:00',
    },
  ],
  internalNoteVersions: [
    {
      id: 'inv-1',
      noteId: 'in-2',
      versionNumber: 1,
      title: 'Hướng dẫn thêm backlink vào dự án SEO',
      content: 'Tạo bản hướng dẫn đầu tiên cho nhân viên SEO nhập backlink.',
      changedBy: 'u2',
      changeNote: 'Khởi tạo tài liệu',
      createdAt: '2026-05-17T14:30:00+07:00',
    },
  ],
  internalNoteComments: [
    {
      id: 'inc-1',
      noteId: 'in-1',
      content: 'Sau khi sửa cần kiểm tra lại CLS trên mobile trong lần audit tiếp theo.',
      createdBy: 'u1',
      createdAt: '2026-05-18T11:00:00+07:00',
      updatedAt: '2026-05-18T11:00:00+07:00',
    },
  ],
}

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const pct = (value: number) => `${Math.round(value)}%`
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
const internalGuideCodeFromId = (id: string) => {
  const compactId = id.replace(/[^a-z0-9]/gi, '').toUpperCase()
  return `HD-${compactId.slice(-8).padStart(8, '0')}`
}
const internalGuideCodeOf = (note: InternalNote) =>
  note.guideCode || (note.noteType === 'Hướng dẫn thao tác' ? internalGuideCodeFromId(note.id) : '')
const guideReferenceIsUrl = (value: string) => /^https?:\/\//i.test(value.trim())
const entityGuideFileNameOf = (value: string) => value.trim().split(/[\\/]/).pop()?.trim() ?? ''
const guideReferenceIsEntityHtmlFile = (value: string) => {
  const fileName = entityGuideFileNameOf(value)
  return Boolean(fileName) && /\.html?$/i.test(fileName) && !guideReferenceIsUrl(value)
}
const entityPlatformGuideReferenceOf = (platform?: SeoEntityPlatform) =>
  platform ? entityGuideFileNameOf(platform.guideFileName) || platform.guideUrl.trim() : ''
const entityGuideFileKey = (value: string) => entityGuideFileNameOf(value).toLowerCase()
const mergeEntityGuideScanHistory = (current: EntityGuideScanRecord[], updates: EntityGuideScanRecord[]) => {
  const records = new Map<string, EntityGuideScanRecord>()
  current.forEach((record) => {
    const key = entityGuideFileKey(record.fileName)
    if (key) records.set(key, { ...record, fileName: entityGuideFileNameOf(record.fileName) })
  })
  updates.forEach((record) => {
    const fileName = entityGuideFileNameOf(record.fileName)
    const key = entityGuideFileKey(fileName)
    if (key) records.set(key, { ...record, fileName })
  })
  return Array.from(records.values()).sort((a, b) => a.fileName.localeCompare(b.fileName, 'vi'))
}
const field = (value: string | number | undefined, fallback = 'Chưa cập nhật') =>
  value === undefined || value === '' || value === 0 ? fallback : String(value)
const appNow = () => new Date()
const appNowIso = () => appNow().toISOString()
const appDateParts = (value: Date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: appTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(value).map((part) => [part.type, part.value]),
  ) as Record<string, string>
const defaultTaskDeadlineInput = (assignedAt = appNow()) => {
  const defaultDeadline = new Date(assignedAt.getTime() + 3 * 24 * 60 * 60 * 1000)
  const parts = appDateParts(defaultDeadline)
  return `${parts.year}-${parts.month}-${parts.day}T20:00`
}
const currentPayrollPeriod = () => {
  const parts = appDateParts(appNow())
  return `${parts.year}-${parts.month}`
}
const appDateInput = () => {
  const parts = appDateParts(appNow())
  return `${parts.year}-${parts.month}-${parts.day}`
}
const payrollPeriodOf = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 7)
  const parts = appDateParts(date)
  return `${parts.year}-${parts.month}`
}
const formatPayrollPeriod = (period: string) => {
  if (!/^\d{4}-\d{2}$/.test(period)) return period || 'Chưa chọn kỳ'
  const [year, month] = period.split('-')
  return `${month}/${year}`
}
const taskDueDateFromDeadline = (deadlineAt: string) => deadlineAt.slice(0, 10)
const taskSalarySettingsOf = (settings?: Partial<TaskSalarySettings>): TaskSalarySettings => ({
  ...defaultTaskSalarySettings,
  ...(settings ?? {}),
})
const validTaskSalaryModule = (value: unknown): value is TaskSalaryModule =>
  typeof value === 'string' && taskSalaryModules.includes(value as TaskSalaryModule)
const payableTasksForUser = (tasks: Task[], userId: string, period: string, salaryType: SalaryType) =>
  tasks.filter((task) => {
    if (task.assigneeId !== userId || taskStatusOf(task) !== 'Hoàn thành' || task.payrollSettlementId) return false
    if (salaryType === 'Lương theo task') return payrollPeriodOf(task.approvedAt || task.completedAt || taskDeadline(task)) === period
    return payrollPeriodOf(taskDeadline(task)) === period
  })
const payrollAmountForUser = (user: User, tasks: Task[], period: string) => {
  const salaryType = user.salaryType ?? 'Lương theo tháng'
  if (salaryType === 'Lương theo task') {
    const payableTasks = payableTasksForUser(tasks, user.id, period, salaryType)
    return {
      amount: payableTasks.reduce((sum, task) => sum + (task.taskSalary ?? 0), 0),
      taskIds: payableTasks.map((task) => task.id),
      basis: `${payableTasks.length} task đã duyệt chưa chốt`,
    }
  }
  if (salaryType === 'Lương theo giờ') {
    const totalWorkedMs = (user.totalWorkedMs ?? 0) + (user.checkedInAt ? Math.max(0, appNow().getTime() - new Date(user.checkedInAt).getTime()) : 0)
    const workedHours = totalWorkedMs / 3600000
    return {
      amount: workedHours * (user.salaryAmount ?? 0),
      taskIds: [],
      basis: `${workedHours.toFixed(2)} giờ`,
    }
  }
  const monthlyTasks = tasks.filter((task) =>
    task.assigneeId === user.id &&
    !task.payrollSettlementId &&
    payrollPeriodOf(taskDeadline(task)) === period,
  )
  const doneTasks = monthlyTasks.filter((task) => taskStatusOf(task) === 'Hoàn thành')
  const rate = monthlyTasks.length ? doneTasks.length / monthlyTasks.length : 0
  return {
    amount: (user.salaryAmount ?? 0) * rate,
    taskIds: monthlyTasks.map((task) => task.id),
    basis: monthlyTasks.length ? `${doneTasks.length}/${monthlyTasks.length} task tháng ${formatPayrollPeriod(period)}` : `Không có task tháng ${formatPayrollPeriod(period)}`,
  }
}
const formatDateOnly = (value?: string) => {
  if (!value) return 'Chưa cập nhật'
  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+07:00` : value
  const date = new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: appTimeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa cập nhật'
  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+07:00` : value
  const date = new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: appTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).format(date)
}
const permissionKey = (permission: string, action: PermissionAction) => `${permission}:${action}`
const normalizePermissions = (userPermissions: string[] = []) => {
  const next = new Set<string>()
  userPermissions.forEach((permission) => {
    if (permission.includes(':')) {
      next.add(permission)
      return
    }
    if (permissions.includes(permission)) {
      next.add(permissionKey(permission, 'view'))
      next.add(permissionKey(permission, 'edit'))
    }
  })
  return Array.from(next)
}
const formatPermissionList = (userPermissions: string[] = []) => {
  const normalized = normalizePermissions(userPermissions)
  const labels = permissions
    .map((permission) => {
      const canViewPermission = normalized.includes(permissionKey(permission, 'view'))
      const canEditPermission = normalized.includes(permissionKey(permission, 'edit'))
      if (!canViewPermission && !canEditPermission) return ''
      return `${permission}: ${canEditPermission ? 'Chỉnh sửa' : 'Xem'}`
    })
    .filter(Boolean)
  return labels.join(', ') || 'Chỉ xem Tổng quan'
}
const buildEntityChecklist = (projectId: string, entityId: string) =>
  entityChecklistTemplates.map((label) => ({
    id: uid('ec'),
    projectId,
    entityId,
    label,
    done: false,
    updatedAt: '',
  }))
const entityScoreRank = (score: number) => {
  if (score <= 50) return 'Yếu'
  if (score <= 100) return 'Cần bổ sung'
  if (score <= 200) return 'Trung bình'
  if (score <= 350) return 'Tốt'
  return 'Mạnh'
}
const escapeCsv = (value: string | number | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`
const normalizeImportHeader = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '')
const readImportValue = (row: Record<string, unknown>, keys: string[]) => {
  const normalizedKeys = Object.keys(row).reduce<Record<string, unknown>>((items, key) => {
    items[normalizeImportHeader(key)] = row[key]
    return items
  }, {})
  const value = keys.map(normalizeImportHeader).map((key) => normalizedKeys[key]).find((item) => item !== undefined && item !== null && String(item).trim() !== '')
  return value === undefined || value === null ? '' : String(value).trim()
}
const pickEnum = <T extends string>(value: string, options: T[], fallback: T) =>
  options.find((option) => normalizeImportHeader(option) === normalizeImportHeader(value)) ?? fallback
const legacyEntityPlatformGroups: Record<string, EntityPlatformGroup> = {
  social: 'Social Bookmark / Bookmark',
  socialbookmark: 'Social Bookmark / Bookmark',
  bookmark: 'Social Bookmark / Bookmark',
  profile: 'Profile Link',
  profilelink: 'Profile Link',
  directory: 'Business Listing',
  forum: 'Forum Post',
  forumpost: 'Forum Post',
  blog: 'Article Submission',
  article: 'Article Submission',
  articlesubmission: 'Article Submission',
  guestpost: 'Article Submission',
  web20: 'Web 2.0',
  web2: 'Web 2.0',
  urlshortener: 'URL Shortener',
  businesslisting: 'Business Listing',
  comment: 'Comment',
  imagesubmission: 'Image Submission',
  map: 'Business Listing',
  review: 'Business Listing',
}
const entityPlatformGroupOf = (value: unknown): EntityPlatformGroup => {
  const normalizedValue = normalizeImportHeader(String(value ?? ''))
  return entityPlatformGroups.find((group) => normalizeImportHeader(group) === normalizedValue)
    ?? legacyEntityPlatformGroups[normalizedValue]
    ?? 'Other'
}
const entityDomainAuthorityOf = (value: unknown) => Math.min(100, Math.max(0, Number(value) || 0))
const cleanDomainCandidate = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const fromUrl = trimmed.match(/https?:\/\/(?:www\.)?([^/\s?#)]+)/i)?.[1]
  return (fromUrl ?? trimmed)
    .replace(/^www\./i, '')
    .replace(/^[\s(<]+|[\s)>.,;]+$/g, '')
    .split(/[/?#\s]/)[0]
    .toLowerCase()
}
const domainHasTld = (value: string) => /^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(cleanDomainCandidate(value))
const extractDomainFromText = (value: string) => {
  const fromParentheses = value.match(/\(([a-z0-9.-]+\.[a-z]{2,})(?:\/[^)]*)?\)/i)?.[1]
  if (fromParentheses) return cleanDomainCandidate(fromParentheses)
  const fromUrl = value.match(/https?:\/\/(?:www\.)?([^/\s)]+)/i)?.[1]
  if (fromUrl) return cleanDomainCandidate(fromUrl)
  return ''
}
const entityPlatformDomainOf = (domainValue: string, description: string) => {
  const primaryDomain = cleanDomainCandidate(domainValue)
  if (domainHasTld(primaryDomain)) return primaryDomain
  const descriptionDomain = extractDomainFromText(description)
  return domainHasTld(descriptionDomain) ? descriptionDomain : ''
}
const parseCsvRows = (text: string) => {
  const delimiter = text.includes('\t') ? '\t' : ','
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  const parseLine = (line: string) => {
    const cells: string[] = []
    let current = ''
    let quoted = false
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index]
      if (char === '"' && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else if (char === '"') {
        quoted = !quoted
      } else if (char === delimiter && !quoted) {
        cells.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    cells.push(current.trim())
    return cells
  }
  const [headerLine, ...rowLines] = lines
  const headers = parseLine(headerLine ?? '')
  return rowLines.map((line) => {
    const cells = parseLine(line)
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = cells[index] ?? ''
      return row
    }, {})
  })
}
const googleSheetExportUrl = (url: string) => {
  const match = url.match(/\/spreadsheets\/d\/([^/]+)/)
  if (!match) return url
  const gid = url.match(/[?&#]gid=(\d+)/)?.[1] ?? '0'
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`
}
const mapPlatformImportRow = (row: Record<string, unknown>): SeoEntityPlatform | null => {
  const name = readImportValue(row, ['Tên nền tảng', 'Tên Website', 'Ten nen tang', 'Ten Website', 'tn website', 'tnwebsite', 'name', 'platform', 'website'])
  const description = readImportValue(row, ['Mô tả', 'Mo ta', 'mt', 'description', 'desc'])
  const domain = entityPlatformDomainOf(readImportValue(row, ['Domain', 'Tên miền', 'ten mien', 'domain']), description)
  if (!name || !domain) return null
  const importGroupHint = readImportValue(row, ['Nhóm', 'Nhóm nền tảng', 'group', 'nhom']) || readImportValue(row, ['Loại Backlink', 'Loai Backlink', 'loi backlink', 'loibacklink', 'Backlink Type', 'type'])
  const guideFileName = readImportValue(row, ['Tên File HTML', 'Ten File HTML', 'tn file html', 'tnfilehtml', 'File HTML', 'HTML File', 'guideFileName'])
  return {
    id: uid('ep'),
    name,
    domain,
    description,
    group: entityPlatformGroupOf(importGroupHint),
    defaultLinkType: pickEnum(readImportValue(row, ['Loại link mặc định', 'Link Type', 'defaultLinkType', 'linkType']), entityLinkTypes, 'Nofollow'),
    backlinkType: '',
    category: '',
    niche: '',
    domainAuthority: entityDomainAuthorityOf(readImportValue(row, ['Điểm DA', 'DA Score', 'DA', 'Domain Authority', 'domainAuthority'])),
    status: pickEnum(readImportValue(row, ['Trạng thái', 'status']), entityPlatformStatuses, 'Dùng được'),
    guideFileName,
    guideUrl: readImportValue(row, ['Hướng dẫn', 'Link hướng dẫn', 'guideUrl', 'guide']),
  }
}
const calculateEntityScore = (
  entity: SeoEntity,
  links: SeoEntityLink[],
  platforms: SeoEntityPlatform[],
  checklist: SeoEntityChecklistItem[],
  schema?: SeoEntitySchema,
) => {
  let score = 0
  links.forEach((link) => {
    const platform = platforms.find((item) => item.id === link.platformId)
    if (link.linkStatus === 'Live') score += 2
    if (link.indexStatus === 'Đã index') score += 3
    if (link.deploymentStatus === 'Đã live' && ['Social Bookmark / Bookmark', 'Web 2.0 Social Bookmark / Web 2.0 Bookmark'].includes(platform?.group ?? '')) score += 5
    if (link.deploymentStatus === 'Đã live' && platform?.group === 'Business Listing') score += 4
    if (link.deploymentStatus === 'Đã live' && ['Web 2.0', 'Web 2.0 Article Submission'].includes(platform?.group ?? '')) score += 3
    if (['404', '403', 'Mất link', 'Không tìm thấy URL đích'].includes(link.linkStatus)) score -= 3
    if (link.napStatus !== 'Chưa check' && link.napStatus !== 'Đúng') score -= 5
    if (!link.targetUrl) score -= 2
  })
  if (schema?.jsonLd) score += 15
  if (checklist.find((item) => item.label === 'Chuẩn hóa NAP')?.done || (entity.phone && entity.address && entity.email)) score += 20
  return Math.max(0, score)
}
const backlinkScoreRank = (score: number) => {
  if (score < 20) return 'Yếu'
  if (score <= 40) return 'Trung bình'
  if (score <= 70) return 'Tốt'
  return 'Rất tốt'
}
const backlinkDomain = (url: string) => {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
}
const calculateBacklinkScore = (backlink: SeoBacklink, source?: SeoBacklinkSource) => {
  let score = 0
  if (backlink.linkStatus === 'Live') score += 5
  if (backlink.linkType === 'Dofollow') score += 5
  if (backlink.indexStatus === 'Đã index') score += 5
  if (source?.topic) score += 10
  if ((source?.estimatedTraffic ?? 0) > 0) score += 10
  if (backlink.linkPosition === 'Trong bài viết') score += 8
  if (backlink.anchorText && !['Sai anchor', 'Mất link'].includes(backlink.linkStatus)) score += 5
  if ((source?.spamScore ?? 0) <= 10) score += 5
  if (backlink.indexStatus === 'Không thể check') score -= 10
  if (backlink.linkStatus === 'Mất link') score -= 15
  if (backlink.linkStatus === 'Sai anchor') score -= 5
  if ((source?.spamScore ?? 0) >= 30) score -= 10
  return Math.max(0, Math.min(100, score))
}
const taskStatusOf = (task: Task): TaskStatus => (task.status === 'Cần làm' ? 'Chờ nhận' : task.status)
const taskDeadline = (task: Task) => task.deadlineAt || task.dueDate
const taskDeadlineDate = (task: Task) => {
  const value = taskDeadline(task)
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T20:00:00+07:00`
    : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
      ? `${value}:00+07:00`
      : value
  return new Date(normalized)
}
const taskDeadlineDayMs = 24 * 60 * 60 * 1000
type TaskDeadlineState = 'on-track' | 'due-soon' | 'overdue' | 'escalated' | 'cancelled' | 'done'
const taskDeadlineInfo = (task: Task, now = appNow()) => {
  const status = taskStatusOf(task)
  const deadline = taskDeadlineDate(task)
  if (status === 'Hoàn thành') return { state: 'done' as TaskDeadlineState, overdueDays: 0, finalDaysRemaining: 0 }
  if (status === 'Đã hủy') return { state: 'cancelled' as TaskDeadlineState, overdueDays: 7, finalDaysRemaining: 0 }
  if (Number.isNaN(deadline.getTime())) return { state: 'on-track' as TaskDeadlineState, overdueDays: 0, finalDaysRemaining: 0 }

  const diffMs = now.getTime() - deadline.getTime()
  if (diffMs >= 7 * taskDeadlineDayMs) {
    return { state: 'cancelled' as TaskDeadlineState, overdueDays: Math.floor(diffMs / taskDeadlineDayMs), finalDaysRemaining: 0 }
  }
  if (diffMs >= 4 * taskDeadlineDayMs) {
    return {
      state: 'escalated' as TaskDeadlineState,
      overdueDays: Math.floor(diffMs / taskDeadlineDayMs),
      finalDaysRemaining: Math.max(1, Math.ceil((7 * taskDeadlineDayMs - diffMs) / taskDeadlineDayMs)),
    }
  }
  if (diffMs > 0) {
    return { state: 'overdue' as TaskDeadlineState, overdueDays: Math.max(1, Math.ceil(diffMs / taskDeadlineDayMs)), finalDaysRemaining: 0 }
  }
  if (Math.abs(diffMs) <= taskDeadlineDayMs) {
    return { state: 'due-soon' as TaskDeadlineState, overdueDays: 0, finalDaysRemaining: 0 }
  }
  return { state: 'on-track' as TaskDeadlineState, overdueDays: 0, finalDaysRemaining: 0 }
}
const taskDeadlineBadge = (task: Task, now = appNow()) => {
  const info = taskDeadlineInfo(task, now)
  if (info.state === 'due-soon') return { label: 'Sắp hết hạn', className: 'due-soon' }
  if (info.state === 'overdue') return { label: `Quá hạn ${info.overdueDays} ngày`, className: 'overdue' }
  if (info.state === 'escalated') return { label: `Còn ${info.finalDaysRemaining} ngày cuối`, className: 'escalated' }
  if (info.state === 'cancelled') return { label: 'Đã hủy do quá hạn', className: 'cancelled' }
  return null
}
const applyTaskDeadlineAutomation = (data: AppData, now = appNow()): AppData => {
  const nowIso = now.toISOString()
  const notifications: NotificationItem[] = []
  const logs: ActivityLog[] = []
  let changed = false
  const projectById = new Map(data.projects.map((project) => [project.id, project]))
  const adminIds = data.users.filter((user) => user.active && user.role === 'Quản trị viên').map((user) => user.id)
  const addEvent = (task: Task, recipientIds: string[], title: string, message: string, action: string) => {
    Array.from(new Set(recipientIds.filter(Boolean))).forEach((recipientId) => {
      notifications.push({
        id: uid('noti'),
        recipientId,
        title,
        message,
        projectId: task.projectId,
        taskId: task.id,
        linkView: 'tasks',
        createdAt: nowIso,
      })
    })
    logs.push({
      id: uid('log'),
      actorId: '',
      actorName: 'Hệ thống deadline',
      action,
      target: task.title,
      at: nowIso,
    })
  }
  const projectAdminIds = (task: Task) => [...adminIds, projectById.get(task.projectId)?.ownerId ?? '']

  const tasks = data.tasks.map((task) => {
    if (['Hoàn thành', 'Đã hủy'].includes(taskStatusOf(task))) return task
    const info = taskDeadlineInfo(task, now)
    if (info.state === 'cancelled' && !task.cancelledAt) {
      changed = true
      addEvent(
        task,
        [task.assigneeId, ...projectAdminIds(task)],
        'Task đã bị hủy do quá hạn',
        `Task "${task.title}" đã quá hạn 7 ngày và được hệ thống chuyển sang trạng thái Đã hủy.`,
        'Tự động hủy task quá hạn',
      )
      return { ...task, status: 'Đã hủy' as TaskStatus, cancelledAt: nowIso }
    }
    if (info.state === 'escalated' && !task.overdueEscalatedAt) {
      changed = true
      addEvent(
        task,
        [task.assigneeId, ...projectAdminIds(task)],
        'Yêu cầu hoàn thành task trong 3 ngày',
        `Task "${task.title}" đã quá hạn 4 ngày. Vui lòng hoàn thành trước ${formatDateTime(new Date(taskDeadlineDate(task).getTime() + 7 * taskDeadlineDayMs).toISOString())}.`,
        'Cảnh báo task quá hạn 4 ngày',
      )
      return { ...task, overdueEscalatedAt: nowIso }
    }
    if (info.state === 'due-soon' && !task.deadlineReminderAt) {
      changed = true
      addEvent(
        task,
        [task.assigneeId],
        'Task sắp tới deadline',
        `Task "${task.title}" cần hoàn thành trước ${formatDateTime(taskDeadline(task))}.`,
        'Nhắc task sắp tới deadline',
      )
      return { ...task, deadlineReminderAt: nowIso }
    }
    return task
  })

  if (!changed) return data
  return {
    ...data,
    tasks,
    notifications: [...notifications, ...(data.notifications ?? [])].slice(0, 500),
    activityLogs: [...logs, ...(data.activityLogs ?? [])].slice(0, 300),
  }
}
const formatWorkDuration = (startedAt?: string) => {
  if (!startedAt) return 'Chưa check-in'
  const diffMs = Math.max(0, appNow().getTime() - new Date(startedAt).getTime())
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  return `${hours} giờ ${minutes} phút`
}
const keywordTypeOf = (keyword: Keyword): KeywordType => keyword.keywordType ?? 'A'
const childTypeOf = (keyword: Keyword): KeywordType | null => {
  const type = keywordTypeOf(keyword)
  if (type === 'A') return 'B'
  if (type === 'B') return 'C'
  return null
}
const keywordDuplicateKey = (keyword: Keyword) =>
  `${keyword.projectId}:${keyword.term.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN')}`
const duplicateKeywordIdsOf = (keywords: Keyword[]) => {
  const groups = keywords.reduce<Map<string, Keyword[]>>((result, keyword) => {
    const key = keywordDuplicateKey(keyword)
    result.set(key, [...(result.get(key) ?? []), keyword])
    return result
  }, new Map())
  return new Set(
    Array.from(groups.values())
      .filter((group) => group.length > 1)
      .flatMap((group) => group.map((keyword) => keyword.id)),
  )
}
const keywordIsInArticles = (keyword: Keyword) =>
  keyword.articleImported === true ||
  Boolean(
    keyword.articleTaskId ||
    keyword.articleUrl?.trim() ||
    keyword.articleTitle?.trim() ||
    keyword.articleContent?.trim() ||
    keyword.articleAssigneeId?.trim(),
  )
const readHtmlFileAsDataUrl = async (file: File) => {
  const text = await file.text()
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(index, index + 0x8000))
  }
  return `data:text/html;charset=utf-8;base64,${window.btoa(binary)}`
}
const readFileAsBase64 = async (file: File) => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(index, index + 0x8000))
  }
  return window.btoa(binary)
}
const isHtmlFile = (file: File) =>
  file.type === 'text/html' || /\.(html?|xhtml)$/i.test(file.name)
const readApiJson = async (response: Response) => {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('application/json')) {
    const text = await response.text().catch(() => '')
    return {
      ok: false,
      message: `Response không phải JSON (${contentType || 'không rõ content-type'}). HTTP ${response.status}. ${text.replace(/\s+/g, ' ').trim().slice(0, 160)}`,
    }
  }
  return response.json().catch(() => ({ ok: false, message: `JSON không hợp lệ. HTTP ${response.status}` }))
}
const isHtmlGuideFile = (file: InternalNoteFile) =>
  file.fileType === htmlGuideFileType && file.fileUrl.startsWith('data:text/html')
const htmlGuideFileOf = (note: InternalNote, files: InternalNoteFile[]) =>
  files.find((file) => file.noteId === note.id && isHtmlGuideFile(file))
const openHtmlGuideFile = (file: InternalNoteFile) => {
  if (!isHtmlGuideFile(file)) return
  const popup = window.open('', '_blank')
  if (!popup) {
    window.alert('Trình duyệt đang chặn popup. Hãy cho phép popup để mở file HTML hướng dẫn.')
    return
  }
  popup.opener = null
  popup.document.open()
  popup.document.write(`
    <!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${file.fileName.replace(/[<>&"]/g, '')}</title>
        <style>
          html, body { margin: 0; min-height: 100%; }
          iframe { border: 0; width: 100vw; height: 100vh; display: block; }
        </style>
      </head>
      <body>
        <iframe sandbox="allow-forms allow-popups allow-same-origin" src="${file.fileUrl.replace(/"/g, '&quot;')}"></iframe>
      </body>
    </html>
  `)
  popup.document.close()
}
const analyticsSettingsOf = (project?: Project): AnalyticsSettings => ({
  ...emptyAnalyticsSettings,
  ...(project?.analytics ?? {}),
})
const searchConsoleSettingsOf = (project?: Project): SearchConsoleSettings => ({
  ...emptySearchConsoleSettings,
  ...(project?.searchConsole ?? {}),
})
const wordpressSettingsOf = (project?: Project): WordPressSettings => ({
  ...emptyWordPressSettings,
  ...(project?.wordpress ?? {}),
})
const wordpressErrorMessage = async (response: Response) => {
  let detail = ''
  try {
    const payload = await response.clone().json()
    detail = payload?.message || payload?.error?.message || payload?.code || ''
  } catch {
    try {
      detail = await response.clone().text()
    } catch {
      // Ignore unreadable error response bodies.
    }
  }
  if (response.status === 401 || response.status === 403) return `API key không đúng hoặc plugin chặn quyền truy cập. HTTP ${response.status}${detail ? ` - ${detail}` : ''}`
  if (response.status === 404) return 'Không tìm thấy endpoint. Kiểm tra Connector Endpoint có đúng dạng /wp-json/seo-ops/v1 và plugin SEO Ops đã kích hoạt chưa. HTTP 404'
  if (response.status >= 500) return `WordPress/server đang lỗi khi xử lý request. HTTP ${response.status}${detail ? ` - ${detail}` : ''}`
  return `WordPress trả về HTTP ${response.status}${detail ? ` - ${detail}` : ''}`
}
const formatFetchError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Không gọi được WordPress. Thường do sai URL, website không bật HTTPS hợp lệ, CORS Allowed Origin chưa đúng, hoặc hosting chặn REST API.'
  }
  return message
}
const normalizedSearchConsoleSiteUrl = (value: string) => {
  const trimmed = value.trim()
  return trimmed.startsWith('sc-domain:') ? trimmed : trimmed ? `${trimmed.replace(/\/+$/, '')}/` : ''
}
const searchConsoleErrorMessage = async (response: Response) => {
  let detail = ''
  try {
    const payload = await response.clone().json()
    detail = payload?.error?.message || payload?.message || ''
  } catch {
    // Ignore unreadable error response bodies.
  }
  if (response.status === 401) return 'Quyền Google không hợp lệ hoặc đã hết hạn. Hãy ngắt kết nối và đăng nhập Google lại.'
  if (response.status === 403) return 'Tài khoản Google chưa có quyền với Search Console property hoặc API chưa được bật.'
  if (response.status === 429) return 'Đã vượt giới hạn kiểm tra URL của Google Search Console. Hãy thử lại sau.'
  if (response.status === 503) return detail || 'Dự án chưa kết nối Google OAuth và server chưa có token Search Console dự phòng.'
  return `Google Search Console trả về HTTP ${response.status}${detail ? ` - ${detail}` : ''}`
}
const wordpressUrlWithKey = (endpoint: string, path: string, apiKey: string, params = '') => {
  const separator = params ? `?${params}&` : '?'
  return `${endpoint.replace(/\/$/, '')}/${path.replace(/^\//, '')}${separator}seo_ops_key=${encodeURIComponent(apiKey)}`
}
const analyticsWindowSize: Record<AnalyticsGranularity, number> = {
  day: 14,
  week: 8,
  month: 12,
  year: 5,
}
const analyticsDateRange: Record<AnalyticsGranularity, { startDate: string; endDate: string }> = {
  day: { startDate: '14daysAgo', endDate: 'today' },
  week: { startDate: '56daysAgo', endDate: 'today' },
  month: { startDate: '12monthsAgo', endDate: 'today' },
  year: { startDate: '5yearsAgo', endDate: 'today' },
}
const formatAnalyticsDate = (value: Date, granularity: AnalyticsGranularity) => {
  if (granularity === 'year') return String(value.getFullYear())
  if (granularity === 'month') return new Intl.DateTimeFormat('vi-VN', { timeZone: appTimeZone, month: '2-digit', year: 'numeric' }).format(value)
  if (granularity === 'week') return `Tuần ${new Intl.DateTimeFormat('vi-VN', { timeZone: appTimeZone, day: '2-digit', month: '2-digit' }).format(value)}`
  return new Intl.DateTimeFormat('vi-VN', { timeZone: appTimeZone, day: '2-digit', month: '2-digit' }).format(value)
}
const buildAnalyticsDate = (index: number, granularity: AnalyticsGranularity) => {
  const date = appNow()
  const reverseIndex = analyticsWindowSize[granularity] - index - 1
  if (granularity === 'day') date.setDate(date.getDate() - reverseIndex)
  if (granularity === 'week') date.setDate(date.getDate() - reverseIndex * 7)
  if (granularity === 'month') date.setMonth(date.getMonth() - reverseIndex)
  if (granularity === 'year') date.setFullYear(date.getFullYear() - reverseIndex)
  return date
}
const generateDemoAnalytics = (projectId: string, granularity: AnalyticsGranularity): AnalyticsPoint[] => {
  const seed = projectId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return Array.from({ length: analyticsWindowSize[granularity] }, (_, index) => {
    const date = buildAnalyticsDate(index, granularity)
    const factor = granularity === 'year' ? 4500 : granularity === 'month' ? 1200 : granularity === 'week' ? 360 : 70
    const activeUsers = Math.round(seed + factor + index * (factor * 0.09) + Math.sin(index + seed) * (factor * 0.08))
    const sessions = Math.round(activeUsers * 1.28)
    const pageViews = Math.round(sessions * 1.85)
    const engagementRate = Math.min(88, Math.max(42, 58 + ((index + seed) % 18)))
    return {
      id: `${projectId}-${granularity}-${date.toISOString().slice(0, 10)}`,
      projectId,
      granularity,
      label: formatAnalyticsDate(date, granularity),
      date: date.toISOString().slice(0, 10),
      activeUsers,
      sessions,
      pageViews,
      engagementRate,
    }
  })
}
const normalizeAnalyticsRows = (payload: unknown, projectId: string, granularity: AnalyticsGranularity): AnalyticsPoint[] => {
  const body = payload as { rows?: unknown[] }
  if (!Array.isArray(body.rows)) return []

  return body.rows.map((row, index) => {
    const record = row as {
      label?: string
      date?: string
      activeUsers?: number | string
      sessions?: number | string
      pageViews?: number | string
      screenPageViews?: number | string
      engagementRate?: number | string
      path?: string
      dimensionValues?: { value?: string }[]
      metricValues?: { value?: string }[]
    }
    const gaDate = record.dimensionValues?.[0]?.value
    const rawDate = record.date ?? (gaDate && /^\d{8}$/.test(gaDate) ? gaDate.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3') : '')
    const date = rawDate || buildAnalyticsDate(index, granularity).toISOString().slice(0, 10)
    const metrics = record.metricValues ?? []
    const activeUsers = Number(record.activeUsers ?? metrics[0]?.value ?? 0)
    const sessions = Number(record.sessions ?? metrics[1]?.value ?? 0)
    const pageViews = Number(record.pageViews ?? record.screenPageViews ?? metrics[2]?.value ?? 0)
    const engagementRate = Number(record.engagementRate ?? metrics[3]?.value ?? 0)
    return {
      id: `${projectId}-${granularity}-${date}-${index}`,
      projectId,
      granularity,
      label: record.label ?? record.path ?? formatAnalyticsDate(new Date(date), granularity),
      date,
      activeUsers,
      sessions,
      pageViews,
      engagementRate: engagementRate > 1 ? engagementRate : Math.round(engagementRate * 100),
    }
  })
}
const getViewFromHash = (): View => {
  const view = window.location.hash.replace('#', '')
  return ['overview', 'projects', 'entities', 'backlinks', 'keywords', 'articles', 'tasks', 'knowledge', 'social', 'tools', 'tool-article-writer', 'tool-article-settings', 'finance', 'people', 'progress', 'system'].includes(view)
    ? (view as View)
    : 'overview'
}
const setHashView = (view: View) => {
  window.history.replaceState(null, '', `#${view}`)
}

const permissionForView = (view: View) => {
  if (['projects', 'entities', 'backlinks', 'keywords', 'articles', 'tasks'].includes(view)) return 'Dự án'
  if (view === 'knowledge') return 'Ghi chú'
  if (view === 'social') return socialPermissionName
  if (view === 'tools' || view === 'tool-article-writer' || view === 'tool-article-settings') return toolPermissionName
  if (view === 'finance') return 'Tài chính'
  if (view === 'people') return 'Nhân sự'
  if (view === 'progress') return 'Tiến độ'
  if (view === 'system') return 'Hệ thống'
  return ''
}

const normalizeData = (data: AppData): AppData => ({
  ...data,
  projects: data.projects.map((project) => ({
    ...project,
    analytics: analyticsSettingsOf(project),
    searchConsole: searchConsoleSettingsOf(project),
    wordpress: wordpressSettingsOf(project),
  })),
  users: data.users.map((user) => ({
    ...user,
    password: user.password ?? '123456',
    permissions: user.role === 'Quản trị viên' ? permissions.flatMap((permission) => [permissionKey(permission, 'view'), permissionKey(permission, 'edit')]) : normalizePermissions(user.permissions),
    salaryType: user.salaryType ?? 'Lương theo tháng',
    salaryAmount: user.salaryAmount ?? 0,
    checkedInAt: user.checkedInAt ?? '',
    totalWorkedMs: user.totalWorkedMs ?? 0,
  })),
  keywords: data.keywords.map((keyword) => ({
    ...keyword,
    keywordType: keyword.keywordType ?? 'A',
    articleType: keyword.articleType ?? 'Informational Content',
    articleTitle: keyword.articleTitle ?? '',
    articleMetaDescription: keyword.articleMetaDescription ?? '',
    articleContent: keyword.articleContent ?? '',
    articleStatus: keyword.articleStatus ?? 'Chua viet',
    articleUpdatedAt: keyword.articleUpdatedAt ?? '',
    articleSource: keyword.articleSource ?? '',
    articleAssigneeId: keyword.articleAssigneeId ?? '',
    articleUrl: keyword.articleUrl ?? '',
    articleTaskId: keyword.articleTaskId ?? '',
    articleImported: keyword.articleImported ?? false,
    indexStatus: keyword.indexStatus ?? 'Chua check',
    indexCheckedAt: keyword.indexCheckedAt ?? '',
    indexCoverageState: keyword.indexCoverageState ?? '',
    indexLastCrawlAt: keyword.indexLastCrawlAt ?? '',
    indexInspectionLink: keyword.indexInspectionLink ?? '',
  })),
  transactions: data.transactions.map((transaction) => ({
    ...transaction,
    type: 'Chi',
    scope: transaction.scope ?? (transaction.projectId ? 'Chi riêng dự án' : 'Chi chung dự án'),
    spenderId: transaction.spenderId ?? '',
    settlementDate: transaction.settlementDate ?? '',
    payrollSettlementId: transaction.payrollSettlementId ?? '',
  })),
  tasks: data.tasks.map((task) => ({
    ...task,
    status: taskStatusOf(task),
    deadlineAt: task.deadlineAt ?? (task.dueDate ? `${task.dueDate}T17:30` : ''),
    assignedAt: task.assignedAt ?? '',
    acceptedAt: task.acceptedAt ?? '',
    completedAt: task.completedAt ?? '',
    approvedAt: task.approvedAt ?? '',
    rejectionReason: task.rejectionReason ?? '',
    revisionNote: task.revisionNote ?? '',
    estimatedHours: task.estimatedHours ?? 0,
    taskSalary: Number(task.taskSalary) || 0,
    salaryModule: validTaskSalaryModule(task.salaryModule) ? task.salaryModule : undefined,
    payrollSettlementId: task.payrollSettlementId ?? '',
    payrollSettledAt: task.payrollSettledAt ?? '',
    deadlineReminderAt: task.deadlineReminderAt ?? '',
    overdueEscalatedAt: task.overdueEscalatedAt ?? '',
    cancelledAt: task.cancelledAt ?? '',
  })),
  payrollSettlements: (data.payrollSettlements ?? []).map((settlement) => ({
    ...settlement,
    taskIds: settlement.taskIds ?? [],
    note: settlement.note ?? '',
  })),
  seoEntities: (data.seoEntities ?? []).map((entity) => ({
    ...entity,
    shortDescriptionHtml: entity.shortDescriptionHtml ?? '',
    longDescriptionHtml: entity.longDescriptionHtml ?? '',
    anchorText: entity.anchorText ?? '',
    anchorTextHtml: entity.anchorTextHtml ?? '',
    googleAccountEmail: entity.googleAccountEmail ?? '',
    googleAccountPassword: entity.googleAccountPassword ?? '',
    googleAccountPhone: entity.googleAccountPhone ?? '',
    googleBackupAccount: entity.googleBackupAccount ?? '',
    googleTwoFactorCode: entity.googleTwoFactorCode ?? '',
    defaultAccountId: entity.defaultAccountId ?? '',
    defaultAccountPassword: entity.defaultAccountPassword ?? '',
    defaultAccountEmail: entity.defaultAccountEmail ?? '',
  })),
  seoEntityPlatforms: (data.seoEntityPlatforms ?? []).map((platform) => {
    const legacyPlatform = platform as SeoEntityPlatform & {
      qualityScore?: number
      notes?: string
    }
    return {
      id: platform.id,
      name: platform.name ?? '',
      description: platform.description ?? '',
      domain: entityPlatformDomainOf(platform.domain ?? '', platform.description ?? '') || cleanDomainCandidate(platform.domain ?? ''),
      group: entityPlatformGroupOf(platform.group),
      defaultLinkType: pickEnum(String(platform.defaultLinkType ?? ''), entityLinkTypes, 'Nofollow'),
      backlinkType: platform.backlinkType ?? '',
      category: platform.category ?? '',
      niche: platform.niche ?? '',
      domainAuthority: entityDomainAuthorityOf(platform.domainAuthority ?? legacyPlatform.qualityScore),
      status: pickEnum(String(platform.status ?? ''), entityPlatformStatuses, 'Dùng được'),
      guideFileName: platform.guideFileName ?? '',
      guideUrl: platform.guideUrl ?? (legacyPlatform.notes?.startsWith('http') ? legacyPlatform.notes : ''),
    }
  }),
  seoEntityLinks: (data.seoEntityLinks ?? []).map((link) => ({
    ...link,
    loginWithGoogle: link.loginWithGoogle ?? false,
    useDefaultEntityAccount: link.useDefaultEntityAccount ?? false,
    loginAccount: link.loginAccount ?? link.accountUsed ?? '',
    loginPassword: link.loginPassword ?? '',
    loginEmail: link.loginEmail ?? '',
    accountUsed: link.accountUsed ?? link.loginAccount ?? '',
    taskId: link.taskId ?? '',
  })),
  seoEntityChecklist: [
    ...(data.seoEntityChecklist ?? []),
    ...(data.seoEntities ?? []).flatMap((entity) =>
      (data.seoEntityChecklist ?? []).some((item) => item.entityId === entity.id)
        ? []
        : entityChecklistTemplates.map((label, index) => ({
            id: `ec-${entity.id}-${index}`,
            projectId: entity.projectId,
            entityId: entity.id,
            label,
            done: false,
            updatedAt: '',
          })),
    ),
  ],
  seoEntitySchemas: data.seoEntitySchemas ?? [],
  seoBacklinkSources: data.seoBacklinkSources ?? [],
  seoBacklinks: (data.seoBacklinks ?? []).map((backlink) => ({
    ...backlink,
    backlinkScore: backlink.backlinkScore ?? 0,
    lastCheckedAt: backlink.lastCheckedAt ?? '',
  })),
  seoBacklinkPlans: (data.seoBacklinkPlans ?? []).map((plan) => ({ ...plan, taskId: plan.taskId ?? '' })),
  seoBacklinkCosts: data.seoBacklinkCosts ?? [],
  taskSalarySettings: taskSalarySettingsOf(data.taskSalarySettings),
  internalNotes: (data.internalNotes ?? []).map((note) => ({
    ...note,
    guideCode: note.guideCode ?? (note.noteType === 'Hướng dẫn thao tác' ? internalGuideCodeFromId(note.id) : ''),
    website: note.website ?? data.projects.find((project) => project.id === note.projectId)?.website ?? '',
    category: note.category ?? '',
    relatedUrl: note.relatedUrl ?? '',
    affectedArea: note.affectedArea ?? '',
    problemDescription: note.problemDescription ?? '',
    content: note.content ?? '',
    reason: note.reason ?? '',
    priority: note.priority ?? 'Trung bình',
    status: note.status ?? 'Nháp',
    visibility: note.visibility ?? 'Nội bộ',
    requestedBy: note.requestedBy ?? '',
    assignedTo: note.assignedTo ?? '',
    createdBy: note.createdBy ?? '',
    approvedBy: note.approvedBy ?? '',
    approvedAt: note.approvedAt ?? '',
    completedAt: note.completedAt ?? '',
    createdAt: note.createdAt ?? appNowIso(),
    updatedAt: note.updatedAt ?? note.createdAt ?? appNowIso(),
    tags: note.tags ?? [],
    extraNote: note.extraNote ?? '',
    version: note.version ?? 1,
  })),
  internalNoteTags: data.internalNoteTags ?? [],
  internalNoteFiles: data.internalNoteFiles ?? [],
  internalNoteVersions: data.internalNoteVersions ?? [],
  internalNoteComments: data.internalNoteComments ?? [],
  socialChannels: data.socialChannels ?? [],
  socialCampaigns: data.socialCampaigns ?? [],
  socialPosts: (data.socialPosts ?? []).map((post) => ({
    ...post,
    publishStatus:
      post.publishedAt || post.publishStatus === 'published'
        ? 'published'
        : post.scheduledAt && new Date(post.scheduledAt).getTime() < Date.now() && ['not_scheduled', 'scheduled'].includes(post.publishStatus)
          ? 'overdue'
          : post.publishStatus,
  })),
  socialPostMedia: data.socialPostMedia ?? [],
  socialPostApprovals: data.socialPostApprovals ?? [],
  socialPostComments: data.socialPostComments ?? [],
  socialPostMetrics: data.socialPostMetrics ?? [],
  socialContentTemplates: data.socialContentTemplates ?? [],
  analyticsReports: data.analyticsReports ?? [],
  notifications: data.notifications ?? [],
  activityLogs: data.activityLogs ?? [],
  entityGuideScanHistory: (data.entityGuideScanHistory ?? []).map((record) => ({
    fileName: entityGuideFileNameOf(record.fileName),
    exists: Boolean(record.exists),
    checkedAt: record.checkedAt ?? '',
    url: record.url ?? '',
  })).filter((record) => Boolean(record.fileName)),
})

const appBaseUrl = import.meta.env.BASE_URL || '/'
const appUrl = (path: string) => `${appBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
const entityGuideFileUrl = (fileName: string) => appUrl(`entity-guides/${encodeURIComponent(entityGuideFileNameOf(fileName))}`)
const apiDataUrl = appUrl('api/data')
const entityTargetUrlOf = (entity?: SeoEntity, project?: Project) => entity?.website?.trim() || project?.website || ''
const entityAnchorTextOf = (entity?: SeoEntity) => entity?.anchorText?.trim() || entity?.name || ''
const entityDisplayNameOf = (entity?: SeoEntity) => entity?.officialName?.trim() || entity?.name || ''
const entityUsedDescriptionOf = (entity?: SeoEntity) => entity?.shortDescription?.trim() || ''
const platformDomainUrl = (domain: string) => {
  const cleanDomain = domain.trim()
  if (!cleanDomain) return ''
  return /^https?:\/\//i.test(cleanDomain) ? cleanDomain : `https://${cleanDomain}`
}
const googleOAuthMessageFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const status = params.get('google_oauth')
  if (status === 'connected') return 'Đã kết nối tài khoản Google. Search Console và Google Analytics có thể dùng quyền vừa cấp.'
  if (status === 'error') return params.get('message') || 'Không kết nối được tài khoản Google.'
  return ''
}
const readStoredData = () => {
  const raw = localStorage.getItem(storageKey)
  return raw ? normalizeData(JSON.parse(raw)) : initialData
}

function useStoredData() {
  const [data, setData] = useState<AppData>(readStoredData)
  const [apiEnabled, setApiEnabled] = useState(false)
  const [loadingRemoteData, setLoadingRemoteData] = useState(true)

  useEffect(() => {
    fetch(apiDataUrl)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((remoteData) => {
        const next = normalizeData(remoteData?.data ?? remoteData)
        setData(next)
        localStorage.setItem(storageKey, JSON.stringify(next))
        setApiEnabled(true)
      })
      .catch(() => setApiEnabled(false))
      .finally(() => setLoadingRemoteData(false))
  }, [])

  const syncRemoteData = useCallback((next: AppData, options?: { allowLargeOverwrite?: boolean }) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (options?.allowLargeOverwrite) headers['x-seo-ops-allow-large-overwrite'] = 'true'
    fetch(apiDataUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(next),
    })
      .then(async (response) => {
        if (response.ok) {
          setApiEnabled(true)
          return
        }
        const payload = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
        if (response.status === 409 && ['SEO_OPS_CLEAN_OVERWRITE', 'SEO_OPS_LARGE_DATA_DROP'].includes(payload.code)) {
          const latestResponse = await fetch(apiDataUrl)
          if (latestResponse.ok) {
            const remoteData = await latestResponse.json()
            const latest = normalizeData(remoteData?.data ?? remoteData)
            setData(latest)
            localStorage.setItem(storageKey, JSON.stringify(latest))
            setApiEnabled(true)
            window.alert('Server đã chặn thao tác lưu vì dữ liệu trên trình duyệt thiếu nhiều bản ghi so với database thật. SEO Ops đã tải lại dữ liệu mới nhất từ server, bạn hãy thao tác lại trên bản vừa tải.')
            return
          }
        }
        setApiEnabled(false)
        window.alert(`Không lưu được dữ liệu lên server. ${payload.message || `HTTP ${response.status}`}`)
      })
      .catch(() => {
        setApiEnabled(false)
      })
  }, [])

  const updateData = useCallback((next: AppData, options?: { allowLargeOverwrite?: boolean }) => {
    setData(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
    syncRemoteData(next, options)
  }, [syncRemoteData])

  const reloadData = useCallback(() => {
    const latest = readStoredData()
    setData(latest)
    return latest
  }, [])

  const importData = useCallback((next: AppData) => {
    updateData(normalizeData(next), { allowLargeOverwrite: true })
  }, [updateData])

  return [data, updateData, reloadData, importData, apiEnabled, loadingRemoteData] as const
}

function App() {
  const [data, setData, reloadData, importData, apiEnabled, loadingRemoteData] = useStoredData()
  const projectFormRef = useRef<HTMLFormElement | null>(null)
  const wordpressFormRef = useRef<HTMLFormElement | null>(null)
  const [view, setView] = useState<View>(getViewFromHash)
  const [activeProjectId, setActiveProjectId] = useState(data.projects[0]?.id ?? '')
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('seo-demo-current-user') || '')
  const [loginError, setLoginError] = useState('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [keywordBuilder, setKeywordBuilder] = useState<Keyword | null>(null)
  const [editingKeywordId, setEditingKeywordId] = useState<string | null>(null)
  const [keywordFormType, setKeywordFormType] = useState<KeywordType>('A')
  const [quickKeywordOpen, setQuickKeywordOpen] = useState(false)
  const [quickKeywordStatus, setQuickKeywordStatus] = useState('')
  const [quickKeywordIssues, setQuickKeywordIssues] = useState<QuickKeywordIssue[]>([])
  const [expandedKeywordIds, setExpandedKeywordIds] = useState<Set<string>>(() => new Set())
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<Set<string>>(() => new Set())
  const [analyticsGranularity, setAnalyticsGranularity] = useState<AnalyticsGranularity>('day')
  const [analyticsStatus, setAnalyticsStatus] = useState('')
  const [searchConsoleStatus, setSearchConsoleStatus] = useState('')
  const [googleOAuthStatus, setGoogleOAuthStatus] = useState<GoogleOAuthStatus>(emptyGoogleOAuthStatus)
  const [googleOAuthLoading, setGoogleOAuthLoading] = useState(true)
  const [googleOAuthMessage, setGoogleOAuthMessage] = useState(googleOAuthMessageFromUrl)
  const [checkingKeywordIds, setCheckingKeywordIds] = useState<Set<string>>(() => new Set())
  const [checkingAllKeywords, setCheckingAllKeywords] = useState(false)
  const [wordpressStatus, setWordpressStatus] = useState('')
  const [articleToolLoading, setArticleToolLoading] = useState(false)
  const [articleToolStatus, setArticleToolStatus] = useState('')
  const [articleToolResult, setArticleToolResult] = useState<ArticleToolResult | null>(null)
  const [articleToolConfig, setArticleToolConfig] = useState<ArticleToolConfigStatus | null>(null)
  const [articleToolConfigStatus, setArticleToolConfigStatus] = useState('')
  const [articleToolConfigLoading, setArticleToolConfigLoading] = useState(false)
  const [articleToolTestingProvider, setArticleToolTestingProvider] = useState<ArticleToolTestProvider | ''>('')
  const [articleToolRegeneratingIndex, setArticleToolRegeneratingIndex] = useState<number | null>(null)
  const [articleToolHistory, setArticleToolHistory] = useState<ArticleToolHistoryItem[]>([])
  const [articleToolHistoryStatus, setArticleToolHistoryStatus] = useState('')
  const [articleToolHistoryLoading, setArticleToolHistoryLoading] = useState(false)
  const [articleToolEditorHtml, setArticleToolEditorHtml] = useState('')
  const [articleToolSavingHtml, setArticleToolSavingHtml] = useState(false)
  const [articleToolSingleImage, setArticleToolSingleImage] = useState<ArticleStandaloneImageResult | null>(null)
  const [articleToolSingleImageStatus, setArticleToolSingleImageStatus] = useState('')
  const [articleToolSingleImageLoading, setArticleToolSingleImageLoading] = useState(false)
  const [financeFilter, setFinanceFilter] = useState<FinanceFilter>('all')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [appZoom, setAppZoom] = useState(() => {
    const savedZoom = Number(localStorage.getItem(appZoomKey))
    return savedZoom >= 0.7 && savedZoom <= 1.2 ? savedZoom : defaultAppZoom
  })
  const [entityTab, setEntityTab] = useState<EntityTab>('overview')
  const [selectedEntityId, setSelectedEntityId] = useState('')
  const [entityImportStatus, setEntityImportStatus] = useState('')
  const [editingEntityPlatformId, setEditingEntityPlatformId] = useState<string | null>(null)
  const [selectedEntityLinkIds, setSelectedEntityLinkIds] = useState<Set<string>>(() => new Set())
  const [backlinkTab, setBacklinkTab] = useState<BacklinkTab>('overview')
  const [knowledgeTab, setKnowledgeTab] = useState<KnowledgeTab>('all')
  const [socialTab, setSocialTab] = useState<SocialTab>('overview')
  const [knowledgeSearch, setKnowledgeSearch] = useState('')
  const [knowledgeProjectFilter, setKnowledgeProjectFilter] = useState('all')
  const [knowledgeTypeFilter, setKnowledgeTypeFilter] = useState('all')
  const [knowledgeStatusFilter, setKnowledgeStatusFilter] = useState('all')
  const [knowledgePriorityFilter, setKnowledgePriorityFilter] = useState('all')
  const [knowledgeTagFilter, setKnowledgeTagFilter] = useState('all')
  const [entityGuideUploadStatus, setEntityGuideUploadStatus] = useState('')
  const [editingInternalNoteId, setEditingInternalNoteId] = useState<string | null>(null)
  const [entityLinkCredential, setEntityLinkCredential] = useState<EntityLinkCredential>(() => {
    const raw = localStorage.getItem(entityCredentialKey)
    const parsed = raw ? JSON.parse(raw) as Partial<EntityLinkCredential> : {}
    return {
      loginWithGoogle: parsed.loginWithGoogle ?? false,
      useDefaultEntityAccount: parsed.useDefaultEntityAccount ?? false,
      loginAccount: parsed.loginAccount ?? '',
      loginPassword: parsed.loginPassword ?? '',
      loginEmail: parsed.loginEmail ?? '',
      accountUsed: parsed.accountUsed ?? '',
    }
  })

  useEffect(() => {
    localStorage.setItem(appZoomKey, appZoom.toFixed(2))
  }, [appZoom])

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('google_oauth')) return
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash || '#projects'}`)
  }, [])

  const activeProjects = data.projects.filter((project) => !project.deletedAt)
  const deletedProjects = data.projects.filter((project) => project.deletedAt)
  const activeProjectIds = new Set(activeProjects.map((project) => project.id))
  const duplicateKeywordIds = duplicateKeywordIdsOf(data.keywords)
  const duplicateKeywordTaskIds = new Set(
    data.keywords
      .filter((keyword) => duplicateKeywordIds.has(keyword.id) && keyword.articleTaskId)
      .map((keyword) => keyword.articleTaskId as string),
  )
  const activeTasks = data.tasks.filter((task) => activeProjectIds.has(task.projectId) && !duplicateKeywordTaskIds.has(task.id))
  const activeKeywords = data.keywords.filter((keyword) => activeProjectIds.has(keyword.projectId) && !duplicateKeywordIds.has(keyword.id))
  const activeTransactions = data.transactions.filter((item) => !item.projectId || activeProjectIds.has(item.projectId))
  const companyTransactions = activeTransactions
  const visibleFinanceTransactions = companyTransactions.filter((item) => {
    if (financeFilter === 'general') return item.scope === 'Chi chung dự án'
    if (financeFilter === 'project') return item.scope !== 'Chi chung dự án'
    return true
  })
  const unsettledTransactions = companyTransactions.filter((item) => !item.settlementDate)
  const debtBySpender = data.users
    .map((user) => {
      const items = unsettledTransactions.filter((item) => item.spenderId === user.id)
      return {
        user,
        count: items.length,
        amount: items.reduce((sum, item) => sum + item.amount, 0),
      }
    })
    .filter((item) => item.count > 0)
  const selectedProject = activeProjects.find((project) => project.id === activeProjectId) ?? activeProjects[0]
  useEffect(() => {
    if (!selectedProject?.id || view !== 'projects') return
    let cancelled = false
    fetch(`${appUrl('api/google/oauth/status')}?projectId=${encodeURIComponent(selectedProject.id)}`)
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.message || `HTTP ${response.status}`)
        if (!cancelled) setGoogleOAuthStatus({
          configured: Boolean(payload.configured),
          connected: Boolean(payload.connected),
          connectedAt: String(payload.connectedAt || ''),
          scope: String(payload.scope || ''),
        })
        if (!cancelled) setGoogleOAuthLoading(false)
      })
      .catch((error) => {
        if (!cancelled) {
          setGoogleOAuthStatus(emptyGoogleOAuthStatus)
          setGoogleOAuthLoading(false)
          setGoogleOAuthMessage(`Không đọc được trạng thái kết nối Google. ${error instanceof Error ? error.message : ''}`)
        }
      })
    return () => {
      cancelled = true
    }
  }, [selectedProject?.id, view])
  useEffect(() => {
    if (!apiEnabled || loadingRemoteData) return
    const nextData = applyTaskDeadlineAutomation(data)
    if (nextData !== data) setData(nextData)
  }, [apiEnabled, data, loadingRemoteData, setData])
  const currentUser = data.users.find((user) => user.id === currentUserId && user.active)
  const isAdmin = currentUser?.role === 'Quản trị viên'
  const currentUserIdValue = currentUser?.id ?? ''
  const canAccessPermission = (permission: string, action: PermissionAction = 'view') => {
    if (isAdmin || !permission) return true
    const userPermissions = normalizePermissions(currentUser?.permissions ?? [])
    return action === 'view'
      ? userPermissions.includes(permissionKey(permission, 'view')) || userPermissions.includes(permissionKey(permission, 'edit'))
      : userPermissions.includes(permissionKey(permission, 'edit'))
  }
  const hasProjectViewPermission = canAccessPermission(permissionForView('projects'), 'view')
  const currentUserTaskIds = new Set(currentUserIdValue ? activeTasks.filter((task) => task.assigneeId === currentUserIdValue).map((task) => task.id) : [])
  const assignedArticleKeywordIds = new Set(
    currentUserIdValue
      ? activeKeywords
          .filter((keyword) =>
            keyword.articleAssigneeId === currentUserIdValue ||
            Boolean(keyword.articleTaskId && currentUserTaskIds.has(keyword.articleTaskId)),
          )
          .map((keyword) => keyword.id)
      : [],
  )
  const visibleAssignedKeywordIds = new Set(assignedArticleKeywordIds)
  const activeKeywordById = new Map(activeKeywords.map((keyword) => [keyword.id, keyword]))
  assignedArticleKeywordIds.forEach((keywordId) => {
    let parentId = activeKeywordById.get(keywordId)?.parentId
    while (parentId) {
      visibleAssignedKeywordIds.add(parentId)
      parentId = activeKeywordById.get(parentId)?.parentId
    }
  })
  const assignedProjectIds = new Set([
    ...activeTasks.filter((task) => task.assigneeId === currentUserIdValue).map((task) => task.projectId),
    ...activeKeywords.filter((keyword) => visibleAssignedKeywordIds.has(keyword.id)).map((keyword) => keyword.projectId),
  ])
  const canViewAssignedView = (targetView: View) => {
    if (targetView === 'tasks') return currentUserTaskIds.size > 0
    if (targetView === 'keywords' || targetView === 'articles') return assignedArticleKeywordIds.size > 0
    return false
  }
  const canView = (targetView: View) => canAccessPermission(permissionForView(targetView), 'view') || canViewAssignedView(targetView)
  const canEdit = (targetView: View) => canAccessPermission(permissionForView(targetView), 'edit')
  const canEditProjects = canEdit('projects')
  const canEditTasks = canEdit('tasks')
  const loadArticleToolConfig = useCallback(async () => {
    setArticleToolConfigLoading(true)
    try {
      const response = await fetch(appUrl('api/tools/article-compose/config'))
      const payload = await response.json().catch(() => ({ ok: false, message: 'Backend trả về phản hồi cấu hình không hợp lệ.' }))
      if (!response.ok || !payload.ok) throw new Error(payload.message || `HTTP ${response.status}`)
      setArticleToolConfig(payload.config)
      setArticleToolConfigStatus('')
    } catch (error) {
      setArticleToolConfigStatus(`Không đọc được cấu hình Viết bài. ${error instanceof Error ? error.message : ''}`.trim())
    } finally {
      setArticleToolConfigLoading(false)
    }
  }, [])

  const loadArticleToolHistory = useCallback(async () => {
    setArticleToolHistoryLoading(true)
    try {
      const response = await fetch(appUrl('api/tools/article-compose/history'))
      const payload = await response.json().catch(() => ({ ok: false, message: 'Backend trả về phản hồi lịch sử không hợp lệ.' }))
      if (!response.ok || !payload.ok) throw new Error(payload.message || `HTTP ${response.status}`)
      setArticleToolHistory(Array.isArray(payload.history) ? payload.history : [])
      setArticleToolHistoryStatus('')
    } catch (error) {
      setArticleToolHistoryStatus(`Không đọc được lịch sử bài viết. ${error instanceof Error ? error.message : ''}`.trim())
    } finally {
      setArticleToolHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!['tool-article-writer', 'tool-article-settings'].includes(view) || !currentUserIdValue) return
    void Promise.resolve().then(() => loadArticleToolConfig())
    if (view === 'tool-article-writer') void Promise.resolve().then(() => loadArticleToolHistory())
  }, [view, currentUserIdValue, loadArticleToolConfig, loadArticleToolHistory])
  const visibleProjects = hasProjectViewPermission ? activeProjects : activeProjects.filter((project) => assignedProjectIds.has(project.id))
  const activeProject = visibleProjects.find((project) => project.id === activeProjectId) ?? visibleProjects[0] ?? selectedProject
  const visibleProjectIdsSignature = visibleProjects.map((project) => project.id).join('|')
  useEffect(() => {
    if (!currentUserIdValue || visibleProjects.length === 0) return
    const savedProjectId = localStorage.getItem(activeProjectStorageKey(currentUserIdValue))
    if (savedProjectId && visibleProjects.some((project) => project.id === savedProjectId)) {
      if (savedProjectId !== activeProjectId) setActiveProjectId(savedProjectId)
      return
    }
    if (!visibleProjects.some((project) => project.id === activeProjectId)) {
      const fallbackProjectId = visibleProjects[0].id
      setActiveProjectId(fallbackProjectId)
      localStorage.setItem(activeProjectStorageKey(currentUserIdValue), fallbackProjectId)
    }
  }, [activeProjectId, currentUserIdValue, visibleProjectIdsSignature])
  const editingProject = editingProjectId ? data.projects.find((project) => project.id === editingProjectId) : undefined
  const canEditAssignedArticle = (keyword: Keyword) => assignedArticleKeywordIds.has(keyword.id)
  const projectTasks = data.tasks.filter((task) =>
    task.projectId === activeProject?.id &&
    !duplicateKeywordTaskIds.has(task.id) &&
    (hasProjectViewPermission || task.assigneeId === currentUserIdValue),
  )
  const currentUserTasks = activeTasks.filter((task) => task.assigneeId === currentUser?.id)
  const pendingUserTasks = currentUserTasks.filter((task) => taskStatusOf(task) === 'Chờ nhận')
  const activeUserTasks = currentUserTasks.filter((task) => ['Đang làm', 'Cần chỉnh sửa'].includes(taskStatusOf(task)))
  const reviewUserTasks = currentUserTasks.filter((task) => taskStatusOf(task) === 'Chờ duyệt')
  const approvedUserTasks = currentUserTasks.filter((task) => taskStatusOf(task) === 'Hoàn thành')
  const dueSoonTasks = activeTasks.filter((task) => taskDeadlineInfo(task).state === 'due-soon')
  const overdueTasks = activeTasks.filter((task) => ['overdue', 'escalated'].includes(taskDeadlineInfo(task).state))
  const cancelledDeadlineTasks = activeTasks.filter((task) => taskStatusOf(task) === 'Đã hủy')
  const taskSalarySettings = taskSalarySettingsOf(data.taskSalarySettings)
  const taskSalary = approvedUserTasks.filter((task) => !task.payrollSettlementId).reduce((sum, task) => sum + (task.taskSalary ?? 0), 0)
  const payrollSettlements = data.payrollSettlements ?? []
  const monthlyProjectTasks = activeTasks.filter((task) => {
    if (!taskDeadline(task)) return false
    const deadline = new Date(taskDeadline(task))
    const now = new Date()
    return deadline.getMonth() === now.getMonth() && deadline.getFullYear() === now.getFullYear()
  })
  const monthlyUserTasks = monthlyProjectTasks.filter((task) => task.assigneeId === currentUser?.id)
  const monthlyUserDone = monthlyUserTasks.filter((task) => taskStatusOf(task) === 'Hoàn thành').length
  const monthlySalaryRate = monthlyUserTasks.length ? (monthlyUserDone / monthlyUserTasks.length) * 100 : 0
  const monthlySalaryEstimate = ((currentUser?.salaryAmount ?? 0) * monthlySalaryRate) / 100
  const projectKeywords = data.keywords.filter((keyword) => keyword.projectId === activeProject?.id)
  const visibleProjectKeywords = hasProjectViewPermission ? projectKeywords : projectKeywords.filter((keyword) => visibleAssignedKeywordIds.has(keyword.id))
  const acceptedProjectKeywords = visibleProjectKeywords.filter((keyword) => !duplicateKeywordIds.has(keyword.id))
  const articleProjectKeywords = acceptedProjectKeywords.filter((keyword) => keywordIsInArticles(keyword) && (hasProjectViewPermission || assignedArticleKeywordIds.has(keyword.id)))
  const articleProjectKeywordIds = new Set(articleProjectKeywords.map((keyword) => keyword.id))
  const selectedImportableArticleCount = acceptedProjectKeywords.filter((keyword) => selectedKeywordIds.has(keyword.id) && !keywordIsInArticles(keyword)).length
  const duplicateProjectKeywordCount = visibleProjectKeywords.length - acceptedProjectKeywords.length
  const editingKeyword = editingKeywordId ? projectKeywords.find((keyword) => keyword.id === editingKeywordId) : undefined
  const projectTransactions = data.transactions.filter((item) => item.projectId === activeProject?.id)
  const projectEntities = (data.seoEntities ?? []).filter((entity) => entity.projectId === activeProject?.id)
  const activeEntity = selectedEntityId === 'new' ? undefined : projectEntities.find((entity) => entity.id === selectedEntityId) ?? projectEntities[0]
  const entityPlatforms = data.seoEntityPlatforms ?? []
  const editingEntityPlatform = editingEntityPlatformId ? entityPlatforms.find((platform) => platform.id === editingEntityPlatformId) : undefined
  const projectEntityLinks = (data.seoEntityLinks ?? []).filter((link) => link.projectId === activeProject?.id)
  const activeEntityLinks = projectEntityLinks.filter((link) => link.entityId === activeEntity?.id)
  const activeEntityChecklist = (data.seoEntityChecklist ?? []).filter((item) => item.entityId === activeEntity?.id)
  const activeEntitySchema = (data.seoEntitySchemas ?? []).find((schema) => schema.entityId === activeEntity?.id)
  const liveEntityLinks = activeEntityLinks.filter((link) => link.linkStatus === 'Live')
  const indexedEntityLinks = activeEntityLinks.filter((link) => link.indexStatus === 'Đã index')
  const napOkLinks = activeEntityLinks.filter((link) => link.napStatus === 'Đúng')
  const entityScore = activeEntity
    ? calculateEntityScore(activeEntity, activeEntityLinks, entityPlatforms, activeEntityChecklist, activeEntitySchema)
    : 0
  const backlinkSources = data.seoBacklinkSources ?? []
  const projectBacklinks = (data.seoBacklinks ?? []).filter((backlink) => backlink.projectId === activeProject?.id)
  const projectBacklinkPlans = (data.seoBacklinkPlans ?? []).filter((plan) => plan.projectId === activeProject?.id)
  const projectBacklinkCosts = (data.seoBacklinkCosts ?? []).filter((cost) => cost.projectId === activeProject?.id)
  const backlinkLive = projectBacklinks.filter((backlink) => backlink.linkStatus === 'Live')
  const backlinkErrors = projectBacklinks.filter((backlink) => ['Mất link', 'Sai URL đích', 'Sai anchor', '404', '403'].includes(backlink.linkStatus))
  const backlinkIndexed = projectBacklinks.filter((backlink) => backlink.indexStatus === 'Đã index')
  const referringDomains = new Set(projectBacklinks.map((backlink) => backlink.sourceDomain || backlinkDomain(backlink.sourceUrl)).filter(Boolean))
  const backlinkCostTotal = projectBacklinks.reduce((sum, backlink) => sum + backlink.cost, 0) + projectBacklinkCosts.reduce((sum, cost) => sum + cost.amount, 0)
  const backlinkAverageScore = projectBacklinks.length
    ? projectBacklinks.reduce((sum, backlink) => sum + (backlink.backlinkScore || calculateBacklinkScore(backlink, backlinkSources.find((source) => source.id === backlink.sourceId))), 0) / projectBacklinks.length
    : 0
  const internalNotes = data.internalNotes ?? []
  const internalNoteFiles = data.internalNoteFiles ?? []
  const internalNoteVersions = data.internalNoteVersions ?? []
  const internalNoteComments = data.internalNoteComments ?? []
  const internalNoteTags = data.internalNoteTags ?? []
  const editingInternalNote = editingInternalNoteId ? internalNotes.find((note) => note.id === editingInternalNoteId) : undefined
  const internalTagOptions = Array.from(new Set([...suggestedInternalTags, ...internalNoteTags.map((tag) => tag.name), ...internalNotes.flatMap((note) => note.tags)])).filter(Boolean)
  const filteredInternalNotes = internalNotes.filter((note) => {
    const tabMatches =
      knowledgeTab === 'all' ||
      (knowledgeTab === 'web-log' && ['Chỉnh sửa giao diện', 'Chỉnh sửa nội dung', 'Chỉnh sửa SEO', 'Chỉnh sửa code', 'Chỉnh sửa database'].includes(note.noteType)) ||
      (knowledgeTab === 'issues' && note.noteType === 'Lỗi website') ||
      (knowledgeTab === 'guides' && note.noteType === 'Hướng dẫn thao tác') ||
      (knowledgeTab === 'sops' && note.noteType === 'Quy trình nội bộ') ||
      (knowledgeTab === 'technical' && ['Chỉnh sửa code', 'Chỉnh sửa database', 'Cấu hình hệ thống'].includes(note.noteType)) ||
      (knowledgeTab === 'files' && internalNoteFiles.some((file) => file.noteId === note.id)) ||
      (knowledgeTab === 'archive' && (note.deletedAt || note.archivedAt || note.status === 'Lưu trữ'))
    if (!tabMatches) return false
    if (knowledgeTab !== 'archive' && (note.deletedAt || note.archivedAt || note.status === 'Lưu trữ')) return false
    if (knowledgeProjectFilter !== 'all' && note.projectId !== knowledgeProjectFilter) return false
    if (knowledgeTypeFilter !== 'all' && note.noteType !== knowledgeTypeFilter) return false
    if (knowledgeStatusFilter !== 'all' && note.status !== knowledgeStatusFilter) return false
    if (knowledgePriorityFilter !== 'all' && note.priority !== knowledgePriorityFilter) return false
    if (knowledgeTagFilter !== 'all' && !note.tags.includes(knowledgeTagFilter)) return false
    const query = knowledgeSearch.trim().toLowerCase()
    if (!query) return true
    const haystack = [
      internalGuideCodeOf(note),
      note.title,
      note.website,
      note.relatedUrl,
      note.affectedArea,
      note.problemDescription,
      note.content,
      note.reason,
      note.extraNote,
      note.tags.join(' '),
      data.users.find((user) => user.id === note.assignedTo)?.name ?? '',
      data.users.find((user) => user.id === note.createdBy)?.name ?? '',
    ].join(' ').toLowerCase()
    return haystack.includes(query)
  })
  const projectAnalyticsPoints = (data.analyticsReports ?? []).filter(
    (point) => point.projectId === activeProject?.id && point.granularity === analyticsGranularity,
  )
  const analyticsTotals = projectAnalyticsPoints.reduce(
    (totals, point) => ({
      activeUsers: totals.activeUsers + point.activeUsers,
      sessions: totals.sessions + point.sessions,
      pageViews: totals.pageViews + point.pageViews,
      engagementRate: totals.engagementRate + point.engagementRate,
    }),
    { activeUsers: 0, sessions: 0, pageViews: 0, engagementRate: 0 },
  )
  const analyticsAverageEngagement = projectAnalyticsPoints.length
    ? analyticsTotals.engagementRate / projectAnalyticsPoints.length
    : 0
  const projectExpense = projectTransactions.reduce((sum, item) => sum + item.amount, 0)
  const projectCompletion = projectTasks.length
    ? (projectTasks.filter((task) => task.status === 'Hoàn thành').length / projectTasks.length) * 100
    : 0
  const projectOverdueTasks = projectTasks.filter((task) => ['overdue', 'escalated'].includes(taskDeadlineInfo(task).state))
  const projectCancelledDeadlineTasks = projectTasks.filter((task) => taskStatusOf(task) === 'Đã hủy')

  const completedTasks = activeTasks.filter((task) => task.status === 'Hoàn thành').length
  const completionRate = activeTasks.length ? (completedTasks / activeTasks.length) * 100 : 0
  const expense = activeTransactions.reduce((sum, item) => sum + item.amount, 0)
  const avgPosition = activeKeywords.length
    ? activeKeywords.reduce((sum, keyword) => sum + keyword.position, 0) / activeKeywords.length
    : 0

  const staffProgress = data.users.map((user) => {
    const tasks = activeTasks.filter((task) => task.assigneeId === user.id)
    const done = tasks.filter((task) => task.status === 'Hoàn thành').length
    return { ...user, tasks: tasks.length, done, rate: tasks.length ? (done / tasks.length) * 100 : 0 }
  })

  const projectProgress = activeProjects.map((project) => {
    const tasks = data.tasks.filter((task) => task.projectId === project.id)
    const done = tasks.filter((task) => task.status === 'Hoàn thành').length
    return { ...project, tasks: tasks.length, done, rate: tasks.length ? (done / tasks.length) * 100 : 0 }
  })

  const ownerName = (id: string) => data.users.find((user) => user.id === id)?.name ?? 'Chưa gán'
  const editingUser = editingUserId ? data.users.find((user) => user.id === editingUserId) : undefined
  const editingTransaction = editingTransactionId ? data.transactions.find((item) => item.id === editingTransactionId) : undefined
  const activityLogs = data.activityLogs ?? []
  const currentNotifications = (data.notifications ?? []).filter((notification) => notification.recipientId === currentUser?.id)
  const unreadNotifications = currentNotifications.filter((notification) => !notification.readAt)
  const projectAdminRecipients = (projectId: string) => {
    const project = data.projects.find((item) => item.id === projectId)
    return Array.from(
      new Set([
        ...data.users.filter((user) => user.active && user.role === 'Quản trị viên').map((user) => user.id),
        project?.ownerId ?? '',
      ].filter(Boolean)),
    )
  }
  const withNotifications = (
    nextData: AppData,
    recipientIds: string[],
    title: string,
    message: string,
    options: { projectId?: string; taskId?: string; linkView?: View } = {},
  ): AppData => {
    const recipients = Array.from(new Set(recipientIds.filter((id) => id && id !== currentUser?.id)))
    if (recipients.length === 0) return nextData
    const notifications: NotificationItem[] = recipients.map((recipientId) => ({
      id: uid('noti'),
      recipientId,
      title,
      message,
      projectId: options.projectId,
      taskId: options.taskId,
      linkView: options.linkView ?? 'tasks',
      createdAt: appNowIso(),
    }))
    return {
      ...nextData,
      notifications: [...notifications, ...(nextData.notifications ?? [])].slice(0, 500),
    }
  }
  const notifyTaskAssignee = (nextData: AppData, task: Task, title = 'Task mới được giao') =>
    withNotifications(
      nextData,
      [task.assigneeId],
      title,
      `${task.title} đang chờ bạn nhận xử lý.`,
      { projectId: task.projectId, taskId: task.id, linkView: 'overview' },
    )
  const notifyProjectAdmins = (nextData: AppData, task: Task, title: string, message: string) =>
    withNotifications(nextData, projectAdminRecipients(task.projectId), title, message, {
      projectId: task.projectId,
      taskId: task.id,
      linkView: 'tasks',
    })
  const saveData = (nextData: AppData, action: string, target: string) => {
    const log: ActivityLog = {
      id: uid('log'),
      actorId: currentUser?.id ?? '',
      actorName: currentUser?.name ?? 'Hệ thống',
      action,
      target,
      at: appNowIso(),
    }
    setData({
      ...nextData,
      activityLogs: [log, ...(nextData.activityLogs ?? [])].slice(0, 300),
    })
  }
  const selectActiveProject = (projectId: string) => {
    setActiveProjectId(projectId)
    if (currentUserIdValue) localStorage.setItem(activeProjectStorageKey(currentUserIdValue), projectId)
    setEditingProjectId(null)
    setExpandedKeywordIds(new Set())
    setSelectedKeywordIds(new Set())
    setGoogleOAuthStatus(emptyGoogleOAuthStatus)
    setGoogleOAuthLoading(true)
  }
  const openNotification = (notification: NotificationItem) => {
    const nextData = {
      ...data,
      notifications: (data.notifications ?? []).map((item) =>
        item.id === notification.id && !item.readAt ? { ...item, readAt: appNowIso() } : item,
      ),
    }
    setData(nextData)
    if (notification.projectId) selectActiveProject(notification.projectId)
    if (notification.linkView && canView(notification.linkView)) goTo(notification.linkView)
    setNotificationsOpen(false)
  }
  const markAllNotificationsRead = () => {
    const nextData = {
      ...data,
      notifications: (data.notifications ?? []).map((item) =>
        item.recipientId === currentUser?.id && !item.readAt ? { ...item, readAt: appNowIso() } : item,
      ),
    }
    setData(nextData)
  }
  const downloadBackup = () => {
    const backup = {
      version: appVersion,
      exportedAt: appNowIso(),
      storageKey,
      data,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `seo-ops-backup-${appNowIso().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    saveData(data, 'Tải backup dữ liệu', 'Hệ thống')
  }
  const importBackupFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const payload = JSON.parse(await file.text())
      const nextData = payload?.data ?? payload
      if (!nextData?.projects || !nextData?.users) throw new Error('File không đúng định dạng backup SEO Ops.')
      importData(nextData)
      setTimeout(() => {
        saveData(normalizeData(nextData), 'Import backup dữ liệu', file.name)
      }, 0)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Không import được file backup.')
    } finally {
      event.target.value = ''
    }
  }
  const goTo = (nextView: View) => {
    if (!canView(nextView)) return
    setView(nextView)
    setHashView(nextView)
  }

  const openKnowledgeGuide = (reference: string) => {
    const normalizedReference = reference.trim()
    if (!normalizedReference) return
    if (guideReferenceIsUrl(normalizedReference)) {
      window.open(normalizedReference, '_blank', 'noopener,noreferrer')
      return
    }
    if (guideReferenceIsEntityHtmlFile(normalizedReference)) {
      window.open(entityGuideFileUrl(normalizedReference), '_blank', 'noopener,noreferrer')
      return
    }
    const guide = internalNotes.find((note) =>
      [note.id, internalGuideCodeOf(note)].some((value) => value.toLowerCase() === normalizedReference.toLowerCase()),
    )
    if (!guide || guide.deletedAt || guide.archivedAt || guide.status === 'Lưu trữ') {
      window.alert(`Không tìm thấy bài hướng dẫn nội bộ có mã "${normalizedReference}".`)
      return
    }
    const htmlGuide = htmlGuideFileOf(guide, internalNoteFiles)
    if (htmlGuide) {
      openHtmlGuideFile(htmlGuide)
      return
    }
    setKnowledgeTab('guides')
    setKnowledgeSearch(internalGuideCodeOf(guide))
    setKnowledgeProjectFilter('all')
    setKnowledgeTypeFilter('all')
    setKnowledgeStatusFilter('all')
    setKnowledgePriorityFilter('all')
    setKnowledgeTagFilter('all')
    setEditingInternalNoteId(null)
    goTo('knowledge')
  }

  const login = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim()
    const password = String(form.get('password')).trim()
    const user = data.users.find((item) => item.email.toLowerCase() === email.toLowerCase() && String(item.password ?? '123456') === password && item.active)
    if (!user) {
      setLoginError('Email hoặc mật khẩu không đúng.')
      return
    }
    setCurrentUserId(user.id)
    localStorage.setItem('seo-demo-current-user', user.id)
    setLoginError('')
    const normalizedUserPermissions = normalizePermissions(user.permissions)
    const nextView =
      user.role === 'Quản trị viên' ||
      !permissionForView(view) ||
      normalizedUserPermissions.includes(permissionKey(permissionForView(view), 'view')) ||
      normalizedUserPermissions.includes(permissionKey(permissionForView(view), 'edit'))
        ? view
        : 'overview'
    setView(nextView)
    setHashView(nextView)
    event.currentTarget.reset()
  }

  const logout = () => {
    reloadData()
    localStorage.removeItem('seo-demo-current-user')
    setCurrentUserId('')
    setView('overview')
    setHashView('overview')
  }

  const saveProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const existingProject = editingProjectId ? data.projects.find((item) => item.id === editingProjectId) : undefined
    const name = String(form.get('name')).trim()
    const website = String(form.get('website')).trim()
    const startDate = String(form.get('startDate')).trim()
    const endDate = String(form.get('endDate')).trim()
    const budget = Number(form.get('budget')) || 0

    if (!name || !website) {
      window.alert('Vui lòng nhập tên dự án và website.')
      return
    }
    if (budget < 0) {
      window.alert('Ngân sách không được nhỏ hơn 0.')
      return
    }
    if (startDate && endDate && startDate > endDate) {
      window.alert('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.')
      return
    }

    const project: Project = {
      ...(existingProject ?? {}),
      id: existingProject?.id ?? uid('p'),
      name,
      client: String(form.get('client')).trim(),
      website,
      startDate,
      endDate,
      budget,
      status: (String(form.get('status')) as ProjectStatus) || 'Đang SEO',
      ownerId: String(form.get('ownerId')),
    }
    const projects = existingProject
      ? data.projects.map((item) => (item.id === existingProject.id ? project : item))
      : [project, ...data.projects]

    saveData({ ...data, projects }, existingProject ? 'Cập nhật dự án' : 'Tạo dự án', project.name)
    selectActiveProject(project.id)
    if (!existingProject) event.currentTarget.reset()
  }

  const editProject = (projectId: string) => {
    setEditingProjectId(projectId)
    window.requestAnimationFrame(() => projectFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const archiveProject = (projectId: string) => {
    const project = data.projects.find((item) => item.id === projectId)
    if (!project || !window.confirm(`Bạn có chắc chắn muốn xóa dự án "${project.name}"? Dự án sẽ được chuyển vào khu vực khôi phục.`)) {
      return
    }

    const projects = data.projects.map((item) =>
      item.id === projectId ? { ...item, deletedAt: appNowIso() } : item,
    )
    const remainingProjects = projects.filter((item) => !item.deletedAt)
    saveData({ ...data, projects }, 'Xóa dự án', project.name)
    selectActiveProject(remainingProjects[0]?.id ?? '')
  }

  const restoreProject = (projectId: string) => {
    const project = data.projects.find((item) => item.id === projectId)
    if (!project) return

    const projects = data.projects.map((item) => {
      if (item.id !== projectId) return item
      const restoredProject = { ...item }
      delete restoredProject.deletedAt
      return restoredProject
    })
    saveData({ ...data, projects }, 'Khôi phục dự án', project.name)
    selectActiveProject(projectId)
  }

  const permanentlyDeleteProject = (projectId: string) => {
    const project = data.projects.find((item) => item.id === projectId)
    if (
      !project ||
      !window.confirm(
        `Bạn có chắc chắn muốn xóa vĩnh viễn dự án "${project.name}"? Toàn bộ keyword, task và giao dịch liên quan sẽ bị xóa và không thể khôi phục.`,
      )
    ) {
      return
    }

    saveData({
      ...data,
      projects: data.projects.filter((item) => item.id !== projectId),
      keywords: data.keywords.filter((item) => item.projectId !== projectId),
      tasks: data.tasks.filter((item) => item.projectId !== projectId),
      transactions: data.transactions.filter((item) => item.projectId !== projectId),
      analyticsReports: (data.analyticsReports ?? []).filter((item) => item.projectId !== projectId),
    }, 'Xóa vĩnh viễn dự án', project.name)
  }

  const saveAnalyticsSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeProject) return
    const form = new FormData(event.currentTarget)
    const settings: AnalyticsSettings = {
      ...analyticsSettingsOf(activeProject),
      propertyId: String(form.get('propertyId')).trim(),
      measurementId: String(form.get('measurementId')).trim(),
      apiEndpoint: String(form.get('apiEndpoint')).trim(),
      accessToken: String(form.get('accessToken')).trim(),
    }
    saveData({
      ...data,
      projects: data.projects.map((project) => (project.id === activeProject.id ? { ...project, analytics: settings } : project)),
    }, 'Cập nhật Google Analytics API', activeProject.name)
    setAnalyticsStatus('Đã lưu cấu hình Google Analytics cho dự án đang chọn.')
  }

  const saveSearchConsoleSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeProject) return
    const form = new FormData(event.currentTarget)
    const settings: SearchConsoleSettings = {
      ...searchConsoleSettingsOf(activeProject),
      siteUrl: normalizedSearchConsoleSiteUrl(String(form.get('siteUrl'))),
      apiEndpoint: String(form.get('apiEndpoint')).trim() || emptySearchConsoleSettings.apiEndpoint,
    }
    saveData({
      ...data,
      projects: data.projects.map((project) => (project.id === activeProject.id ? { ...project, searchConsole: settings } : project)),
    }, 'Cập nhật Google Search Console API', activeProject.name)
    setSearchConsoleStatus('Đã lưu cấu hình Search Console. Hãy kiểm tra một URL trước khi chạy hàng loạt.')
  }

  const connectGoogleAccount = () => {
    if (!activeProject) return
    window.location.assign(`${appUrl('api/google/oauth/start')}?projectId=${encodeURIComponent(activeProject.id)}`)
  }

  const disconnectGoogleAccount = async () => {
    if (!activeProject || !window.confirm('Ngắt kết nối Google khỏi dự án này? Search Console và Analytics sẽ không còn lấy dữ liệu qua tài khoản đã cấp quyền.')) return
    setGoogleOAuthMessage('Đang ngắt kết nối Google...')
    try {
      const response = await fetch(appUrl('api/google/oauth/disconnect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: activeProject.id }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || `HTTP ${response.status}`)
      setGoogleOAuthStatus({ ...googleOAuthStatus, connected: false, connectedAt: '', scope: '' })
      setGoogleOAuthMessage('Đã ngắt kết nối tài khoản Google khỏi dự án.')
    } catch (error) {
      setGoogleOAuthMessage(`Không ngắt được kết nối Google. ${error instanceof Error ? error.message : ''}`)
    }
  }

  const saveWordPressSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeProject) return
    const form = new FormData(event.currentTarget)
    const settings: WordPressSettings = {
      ...wordpressSettingsOf(activeProject),
      siteUrl: String(form.get('siteUrl')).trim().replace(/\/$/, ''),
      connectorEndpoint: String(form.get('connectorEndpoint')).trim().replace(/\/$/, ''),
      apiKey: String(form.get('apiKey')).trim(),
    }
    const endpoint = settings.connectorEndpoint || (settings.siteUrl ? `${settings.siteUrl}/wp-json/seo-ops/v1` : '')
    saveData({
      ...data,
      projects: data.projects.map((project) => (project.id === activeProject.id ? { ...project, wordpress: { ...settings, connectorEndpoint: endpoint } } : project)),
    }, 'Cập nhật kết nối WordPress', activeProject.name)
    setWordpressStatus('Đã lưu cấu hình WordPress Connector cho dự án đang chọn.')
  }

  const currentWordPressSettings = () => {
    if (!activeProject) return { settings: emptyWordPressSettings, endpoint: '' }
    const saved = wordpressSettingsOf(activeProject)
    const formElement = wordpressFormRef.current
    if (!formElement) {
      const endpoint = saved.connectorEndpoint || (saved.siteUrl ? `${saved.siteUrl.replace(/\/$/, '')}/wp-json/seo-ops/v1` : '')
      return { settings: saved, endpoint }
    }
    const form = new FormData(formElement)
    const siteUrl = String(form.get('siteUrl') || saved.siteUrl).trim().replace(/\/$/, '')
    const connectorEndpoint = String(form.get('connectorEndpoint') || saved.connectorEndpoint).trim().replace(/\/$/, '')
    const apiKey = String(form.get('apiKey') || saved.apiKey).trim()
    const endpoint = connectorEndpoint || (siteUrl ? `${siteUrl}/wp-json/seo-ops/v1` : '')
    return {
      settings: {
        ...saved,
        siteUrl,
        connectorEndpoint: endpoint,
        apiKey,
      },
      endpoint,
    }
  }

  const testWordPressConnection = async () => {
    if (!activeProject) return
    const { settings, endpoint } = currentWordPressSettings()
    if (!endpoint || !settings.apiKey) {
      setWordpressStatus('Lỗi cấu hình: thiếu Connector Endpoint hoặc API key. Endpoint thường có dạng https://tenmien.vn/wp-json/seo-ops/v1.')
      return
    }
    setWordpressStatus('Đang kiểm tra kết nối WordPress...')
    try {
      const response = await fetch(wordpressUrlWithKey(endpoint, 'site', settings.apiKey))
      if (!response.ok) throw new Error(await wordpressErrorMessage(response))
      const site = await response.json()
      const propertyId = site?.siteKit?.propertyId ? String(site.siteKit.propertyId) : analyticsSettingsOf(activeProject).propertyId
      const measurementId = site?.siteKit?.measurementId ? String(site.siteKit.measurementId) : analyticsSettingsOf(activeProject).measurementId
      const connectedAt = appNowIso()
      saveData({
        ...data,
        projects: data.projects.map((project) =>
          project.id === activeProject.id
            ? {
                ...project,
                wordpress: { ...wordpressSettingsOf(project), ...settings, connectorEndpoint: endpoint, lastConnectedAt: connectedAt },
                analytics: {
                  ...analyticsSettingsOf(project),
                  propertyId,
                  measurementId,
                  apiEndpoint: `${endpoint}/analytics/report`,
                  accessToken: settings.apiKey,
                },
              }
            : project,
        ),
      }, 'Kiểm tra kết nối WordPress', activeProject.name)
      setWordpressStatus(`Kết nối thành công: ${site?.name ?? activeProject.name}. Site Kit: ${site?.siteKit?.active ? 'đang bật' : 'chưa bật'}. Posts: ${site?.counts?.posts ?? 0}, Pages: ${site?.counts?.pages ?? 0}.`)
    } catch (error) {
      setWordpressStatus(`Không kết nối được WordPress Connector. ${formatFetchError(error)}`)
    }
  }

  const syncWordPressSite = async () => {
    await testWordPressConnection()
  }

  const syncWordPressContent = async (contentType: 'posts' | 'pages') => {
    if (!activeProject) return
    const { settings, endpoint } = currentWordPressSettings()
    if (!endpoint || !settings.apiKey) {
      setWordpressStatus('Lỗi cấu hình: thiếu Connector Endpoint hoặc API key. Hãy lưu kết nối trước khi đồng bộ.')
      return
    }
      setWordpressStatus(`Đang đồng bộ ${contentType === 'posts' ? 'bài viết' : 'page'} từ WordPress...`)
    try {
      const response = await fetch(wordpressUrlWithKey(endpoint, contentType, settings.apiKey, 'per_page=100'))
      if (!response.ok) throw new Error(await wordpressErrorMessage(response))
      const responseData = await response.json()
      const items: WordPressContentItem[] = Array.isArray(responseData.items) ? responseData.items : []
      const existingUrls = new Set(data.keywords.filter((keyword) => keyword.projectId === activeProject.id).map((keyword) => keyword.articleUrl || keyword.landingUrl))
      const importedKeywords: Keyword[] = items
        .filter((item) => item?.url && !existingUrls.has(String(item.url)))
        .slice(0, 100)
        .map((item) => {
          const seo = item.seo ?? {}
          const focusKeyword = String(seo.rankMathFocusKeyword || seo.yoastFocusKeyword || '').split(',')[0].trim()
          const title = String(item.title || item.slug || item.path || 'WordPress content')
          return {
            id: uid('k'),
            projectId: activeProject.id,
            keywordType: 'C',
            term: focusKeyword || title,
            landingUrl: String(item.path || item.url || ''),
            searchVolume: 0,
            keywordDifficulty: 0,
            searchIntent: 'Informational',
            position: 100,
            impressions: 0,
            clicks: 0,
            organicTraffic: 0,
            ctr: 0,
            articleType: item.type === 'page' ? 'Category Hub' : 'Informational Content',
            articleTitle: title,
            articleAssigneeId: '',
            articleUrl: String(item.url),
            articleTaskId: '',
            articleImported: true,
            indexStatus: 'Chua check',
            indexCheckedAt: '',
          }
        })
      saveData({
        ...data,
        keywords: [...importedKeywords, ...data.keywords],
        projects: data.projects.map((project) =>
          project.id === activeProject.id ? { ...project, wordpress: { ...wordpressSettingsOf(project), ...settings, connectorEndpoint: endpoint, lastSyncAt: appNowIso() } } : project,
        ),
      }, 'Đồng bộ nội dung WordPress', activeProject.name)
      setWordpressStatus(`Đã đồng bộ ${importedKeywords.length}/${items.length} ${contentType === 'posts' ? 'bài viết' : 'page'} mới từ WordPress vào module Keyword/Bài viết.`)
    } catch (error) {
      setWordpressStatus(`Không đồng bộ được WordPress. ${formatFetchError(error)}`)
    }
  }

  const syncAnalytics = async () => {
    if (!activeProject) return
    const settings = analyticsSettingsOf(activeProject)
    setAnalyticsStatus('Đang đồng bộ dữ liệu Google Analytics...')

    let points: AnalyticsPoint[]
    let action = 'Đồng bộ Google Analytics demo'
    try {
      const oauthEndpoint = googleOAuthStatus.connected ? appUrl('api/google/analytics/report') : ''
      const endpoint = oauthEndpoint || settings.apiEndpoint
      if (endpoint && settings.propertyId) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(!oauthEndpoint && settings.accessToken ? { 'X-SEO-OPS-KEY': settings.accessToken } : {}),
            ...(!oauthEndpoint && settings.accessToken ? { Authorization: `Bearer ${settings.accessToken}` } : {}),
          },
          body: JSON.stringify({
            projectId: activeProject.id,
            property: `properties/${settings.propertyId}`,
            propertyId: settings.propertyId,
            measurementId: settings.measurementId,
            granularity: analyticsGranularity,
            dateRanges: [analyticsDateRange[analyticsGranularity]],
            dimensions: [{ name: 'date' }],
            metrics: [
              { name: 'activeUsers' },
              { name: 'sessions' },
              { name: 'screenPageViews' },
              { name: 'engagementRate' },
            ],
          }),
        })
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => undefined)
          throw new Error(errorPayload?.message || `API trả về HTTP ${response.status}`)
        }
        points = normalizeAnalyticsRows(await response.json(), activeProject.id, analyticsGranularity)
        if (points.length === 0) throw new Error('API chưa trả về dòng dữ liệu hợp lệ')
        action = oauthEndpoint ? 'Đồng bộ Google Analytics OAuth' : 'Đồng bộ Google Analytics API'
      } else {
        points = generateDemoAnalytics(activeProject.id, analyticsGranularity)
      }
    } catch (error) {
      points = generateDemoAnalytics(activeProject.id, analyticsGranularity)
      setAnalyticsStatus(`Không gọi được API nội bộ, đang hiển thị dữ liệu demo. ${error instanceof Error ? error.message : ''}`)
    }

    const syncedAt = appNowIso()
    saveData({
      ...data,
      projects: data.projects.map((project) =>
        project.id === activeProject.id
          ? { ...project, analytics: { ...settings, lastSyncAt: syncedAt } }
          : project,
      ),
      analyticsReports: [
        ...(data.analyticsReports ?? []).filter(
          (point) => !(point.projectId === activeProject.id && point.granularity === analyticsGranularity),
        ),
        ...points,
      ],
    }, action, activeProject.name)

    if (action === 'Đồng bộ Google Analytics OAuth') {
      setAnalyticsStatus('Đồng bộ Google Analytics qua tài khoản Google thành công.')
    } else if (action === 'Đồng bộ Google Analytics API') {
      setAnalyticsStatus('Đồng bộ API nội bộ thành công. Dữ liệu đã được cập nhật cho dự án đang chọn.')
    } else if ((!settings.apiEndpoint && !googleOAuthStatus.connected) || !settings.propertyId) {
      setAnalyticsStatus('Chưa có kết nối Google/Property ID hoặc API Endpoint nên hệ thống đang dùng dữ liệu demo nội bộ.')
    }
  }

  const saveKeyword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canEditProjects) return
    if (!activeProject) return
    const form = new FormData(event.currentTarget)
    const keywordType = String(form.get('keywordType')) as KeywordType
    const parentId = keywordType === 'A' ? '' : String(form.get('parentId'))
    if (keywordType !== 'A' && !parentId) {
      window.alert(`Keyword loại ${keywordType} cần chọn keyword cấp cao hơn.`)
      return
    }
    const keyword: Keyword = {
      id: editingKeyword?.id ?? uid('k'),
      projectId: activeProject.id,
      parentId,
      keywordType,
      term: String(form.get('term')).trim(),
      landingUrl: String(form.get('landingUrl')).trim(),
      searchVolume: Number(form.get('searchVolume')) || 0,
      keywordDifficulty: Number(form.get('keywordDifficulty')) || 0,
      searchIntent: String(form.get('searchIntent')) as SearchIntent,
      position: Number(form.get('position')) || 100,
      impressions: Number(form.get('impressions')) || 0,
      clicks: Number(form.get('clicks')) || 0,
      organicTraffic: Number(form.get('organicTraffic')) || 0,
      ctr: Number(form.get('ctr')) || 0,
      articleType: editingKeyword?.articleType ?? 'Informational Content',
      articleTitle: editingKeyword?.articleTitle ?? '',
      articleAssigneeId: editingKeyword?.articleAssigneeId ?? '',
      articleUrl: editingKeyword?.articleUrl ?? '',
      articleTaskId: editingKeyword?.articleTaskId ?? '',
      articleImported: editingKeyword?.articleImported ?? false,
      indexStatus: editingKeyword?.indexStatus ?? 'Chua check',
      indexCheckedAt: editingKeyword?.indexCheckedAt ?? '',
    }
    const nextKeywords = editingKeyword
      ? data.keywords.map((item) => (item.id === editingKeyword.id ? keyword : item))
      : [keyword, ...data.keywords]
    const nextDuplicateIds = duplicateKeywordIdsOf(nextKeywords)
    const duplicateCount = nextKeywords
      .filter((item) => item.projectId === activeProject.id && nextDuplicateIds.has(item.id))
      .length
    saveData({
      ...data,
      keywords: nextKeywords,
    }, editingKeyword ? 'Sửa keyword' : 'Thêm keyword', keyword.term)
    setQuickKeywordStatus(duplicateCount ? `Hiện có ${duplicateCount} keyword trùng trong dự án đang chờ xử lý.` : '')
    setEditingKeywordId(null)
    setKeywordFormType('A')
    event.currentTarget.reset()
  }

  const developKeyword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canEditProjects) return
    if (!keywordBuilder) return

    const nextType = childTypeOf(keywordBuilder)
    if (!nextType) return

    const form = new FormData(event.currentTarget)
    const prefix = String(form.get('prefix')).trim()
    const suffix = String(form.get('suffix')).trim()
    const term = [prefix, keywordBuilder.term, suffix].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()

    const keyword: Keyword = {
      ...keywordBuilder,
      id: uid('k'),
      parentId: keywordBuilder.id,
      keywordType: nextType,
      term,
      landingUrl: '',
      searchVolume: 0,
      keywordDifficulty: 0,
      position: 100,
      impressions: 0,
      clicks: 0,
      organicTraffic: 0,
      ctr: 0,
      articleType: 'Informational Content',
      articleTitle: '',
      articleAssigneeId: '',
      articleUrl: '',
      articleTaskId: '',
      articleImported: false,
      indexStatus: 'Chua check',
      indexCheckedAt: '',
    }

    const parentIndex = data.keywords.findIndex((item) => item.id === keywordBuilder.id)
    const keywords =
      parentIndex >= 0
        ? [...data.keywords.slice(0, parentIndex + 1), keyword, ...data.keywords.slice(parentIndex + 1)]
        : [keyword, ...data.keywords]

    saveData({ ...data, keywords }, 'Phát triển keyword', keyword.term)
    setExpandedKeywordIds((current) => {
      const next = new Set(current)
      next.add(keywordBuilder.id)
      return next
    })
    setKeywordBuilder(null)
  }

  const importQuickKeywords = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canEditProjects) return
    if (!activeProject) return

    const lines = String(new FormData(event.currentTarget).get('quickKeywords') ?? '').split(/\r?\n/)
    const branch: Partial<Record<KeywordType, Keyword>> = {}
    const imported: Keyword[] = []
    const issues: QuickKeywordIssue[] = []

    lines.forEach((rawLine, index) => {
      const value = rawLine.trim()
      if (!value) return

      const match = value.match(/^([ABC])\s*:\s*(.+)$/i)
      if (!match || !match[2].trim()) {
        issues.push({ line: index + 1, text: 'Sai cú pháp. Dùng A: keyword, B: keyword hoặc C: keyword.' })
        return
      }

      const keywordType = match[1].toUpperCase() as KeywordType
      const term = match[2].trim()
      let parentId = ''

      if (keywordType === 'A') {
        delete branch.B
        delete branch.C
      } else if (keywordType === 'B') {
        if (!branch.A) {
          issues.push({ line: index + 1, text: 'Keyword B cần nằm sau một keyword A.' })
          return
        }
        parentId = branch.A.id
        delete branch.C
      } else {
        if (!branch.B) {
          issues.push({ line: index + 1, text: 'Keyword C cần nằm sau một keyword B.' })
          return
        }
        parentId = branch.B.id
      }

      const keyword: Keyword = {
        id: uid('k'),
        projectId: activeProject.id,
        parentId,
        keywordType,
        term,
        landingUrl: '',
        searchVolume: 0,
        keywordDifficulty: 0,
        searchIntent: 'Informational',
        position: 100,
        impressions: 0,
        clicks: 0,
        organicTraffic: 0,
        ctr: 0,
        articleType: 'Informational Content',
        articleTitle: '',
        articleAssigneeId: '',
        articleUrl: '',
        articleTaskId: '',
        articleImported: false,
        indexStatus: 'Chua check',
        indexCheckedAt: '',
      }

      imported.push(keyword)
      branch[keywordType] = keyword
    })

    setQuickKeywordIssues(issues)
    if (imported.length === 0) {
      setQuickKeywordStatus('Không có keyword hợp lệ để nhập.')
      return
    }

    const nextKeywords = [...data.keywords, ...imported]
    const nextDuplicateIds = duplicateKeywordIdsOf(nextKeywords)
    const duplicateCount = nextKeywords.filter((keyword) => keyword.projectId === activeProject.id && nextDuplicateIds.has(keyword.id)).length
    saveData({ ...data, keywords: nextKeywords }, 'Nhập nhanh keyword', `${imported.length} keyword`)
    setExpandedKeywordIds(new Set())
    setQuickKeywordStatus(`Đã nhập ${imported.length} keyword.${duplicateCount ? ` Hiện có ${duplicateCount} keyword trùng trong dự án đang chờ xử lý.` : ''}${issues.length ? ` Có ${issues.length} dòng lỗi được bỏ qua.` : ''}`)
    if (issues.length === 0) {
      setQuickKeywordOpen(false)
      event.currentTarget.reset()
    }
  }

  const inspectKeywordIndex = async (keyword: Keyword, settings: SearchConsoleSettings) => {
    const articleUrl = keyword.articleUrl?.trim()
    const checkedAt = appNowIso()
    if (!articleUrl) {
      return {
        indexStatus: 'Noindex' as KeywordIndexStatus,
        indexCheckedAt: checkedAt,
        indexCoverageState: 'Chưa có URL bài viết để kiểm tra',
        indexLastCrawlAt: '',
        indexInspectionLink: '',
      }
    }
    if (!settings.siteUrl || !settings.apiEndpoint) {
      throw new Error('Chưa cấu hình Google Search Console. Vào Dự án SEO để nhập Property URL và API Endpoint.')
    }

    const response = await fetch(settings.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: keyword.projectId,
        inspectionUrl: articleUrl,
        siteUrl: settings.siteUrl,
        languageCode: 'vi-VN',
      }),
    })
    if (!response.ok) throw new Error(await searchConsoleErrorMessage(response))
    const payload: SearchConsoleInspectionResult = await response.json()
    const result = payload.inspectionResult?.indexStatusResult
    return {
      indexStatus: result?.verdict === 'PASS' ? 'Index' as KeywordIndexStatus : 'Noindex' as KeywordIndexStatus,
      indexCheckedAt: checkedAt,
      indexCoverageState: result?.coverageState ?? 'Google không trả về chi tiết index',
      indexLastCrawlAt: result?.lastCrawlTime ?? '',
      indexInspectionLink: payload.inspectionResult?.inspectionResultLink ?? '',
    }
  }

  const checkKeywordIndex = async (keywordId: string) => {
    if (!canEditProjects) return
    const keyword = articleProjectKeywords.find((item) => item.id === keywordId)
    if (!keyword || checkingAllKeywords) return
    setCheckingKeywordIds((current) => new Set(current).add(keywordId))
    setSearchConsoleStatus(`Đang kiểm tra index: ${keyword.term}`)
    try {
      const result = await inspectKeywordIndex(keyword, searchConsoleSettingsOf(activeProject))
      saveData({
        ...data,
        keywords: data.keywords.map((item) => item.id === keywordId ? { ...item, ...result } : item),
        projects: activeProject
          ? data.projects.map((project) =>
              project.id === activeProject.id
                ? { ...project, searchConsole: { ...searchConsoleSettingsOf(project), lastCheckAt: result.indexCheckedAt } }
                : project,
            )
          : data.projects,
      }, 'Check index Google Search Console', keyword.term)
      setSearchConsoleStatus(`${keyword.term}: ${result.indexStatus === 'Index' ? 'Đã index' : 'Noindex'} - ${result.indexCoverageState}`)
    } catch (error) {
      setSearchConsoleStatus(error instanceof Error ? error.message : 'Không kiểm tra được index.')
    } finally {
      setCheckingKeywordIds((current) => {
        const next = new Set(current)
        next.delete(keywordId)
        return next
      })
    }
  }

  const checkAllKeywordIndexes = async () => {
    if (!canEditProjects) return
    if (!activeProject || articleProjectKeywords.length === 0) return
    const settings = searchConsoleSettingsOf(activeProject)
    const updates = new Map<string, Partial<Keyword>>()
    let indexed = 0
    let noindex = 0
    let failed = 0
    setCheckingAllKeywords(true)
    setSearchConsoleStatus(`Đang kiểm tra 0/${articleProjectKeywords.length} URL qua Google Search Console...`)
    try {
      for (const [index, keyword] of articleProjectKeywords.entries()) {
        try {
          const result = await inspectKeywordIndex(keyword, settings)
          updates.set(keyword.id, result)
          if (result.indexStatus === 'Index') indexed += 1
          else noindex += 1
        } catch (error) {
          failed += 1
          if (failed === 1) {
            setSearchConsoleStatus(error instanceof Error ? error.message : 'Không kiểm tra được Google Search Console.')
          }
        }
        if (keyword.articleUrl?.trim() && index < articleProjectKeywords.length - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 110))
        }
        if (failed === 0) {
          setSearchConsoleStatus(`Đang kiểm tra ${index + 1}/${articleProjectKeywords.length} URL qua Google Search Console...`)
        }
      }

      if (updates.size > 0) {
        const lastCheckAt = appNowIso()
        saveData({
          ...data,
          keywords: data.keywords.map((keyword) => ({ ...keyword, ...(updates.get(keyword.id) ?? {}) })),
          projects: data.projects.map((project) =>
            project.id === activeProject.id
              ? { ...project, searchConsole: { ...searchConsoleSettingsOf(project), lastCheckAt } }
              : project,
          ),
        }, 'Check index Google Search Console hàng loạt', `${updates.size} keyword`)
        setQuickKeywordStatus(`Đã kiểm tra index ${updates.size} keyword.`)
      }
      setSearchConsoleStatus(`Kết quả Google Search Console: ${indexed} Index, ${noindex} Noindex${failed ? `, ${failed} lỗi.` : '.'}`)
    } finally {
      setCheckingAllKeywords(false)
    }
  }

  const testSearchConsoleConnection = async () => {
    if (!activeProject) return
    const keyword = articleProjectKeywords.find((item) => item.articleUrl?.trim())
    if (!keyword) {
      setSearchConsoleStatus('Cần có ít nhất một keyword đã gắn URL bài viết để kiểm tra kết nối.')
      return
    }
    setSearchConsoleStatus(`Đang kiểm tra kết nối bằng URL: ${keyword.articleUrl}`)
    try {
      const result = await inspectKeywordIndex(keyword, searchConsoleSettingsOf(activeProject))
      saveData({
        ...data,
        projects: data.projects.map((project) =>
          project.id === activeProject.id
            ? { ...project, searchConsole: { ...searchConsoleSettingsOf(project), lastConnectedAt: appNowIso() } }
            : project,
        ),
      }, 'Kiểm tra kết nối Google Search Console', activeProject.name)
      setSearchConsoleStatus(`Kết nối thành công. URL mẫu: ${result.indexStatus === 'Index' ? 'Đã index' : 'Noindex'} - ${result.indexCoverageState}`)
    } catch (error) {
      setSearchConsoleStatus(error instanceof Error ? error.message : 'Không kết nối được Google Search Console.')
    }
  }

  const toggleKeywordCollapse = (keywordId: string) => {
    setExpandedKeywordIds((current) => {
      const next = new Set(current)
      if (next.has(keywordId)) {
        next.delete(keywordId)
      } else {
        next.add(keywordId)
      }
      return next
    })
  }

  const revealDuplicateKeyword = (keywordId: string) => {
    const source = projectKeywords.find((keyword) => keyword.id === keywordId)
    if (!source) return
    const target = projectKeywords.find((keyword) => keyword.id !== keywordId && keywordDuplicateKey(keyword) === keywordDuplicateKey(source))
    if (!target) return

    setExpandedKeywordIds((current) => {
      const next = new Set(current)
      let parentId = target.parentId
      while (parentId) {
        next.add(parentId)
        parentId = projectKeywords.find((keyword) => keyword.id === parentId)?.parentId
      }
      return next
    })
    window.requestAnimationFrame(() => {
      const row = document.getElementById(`keyword-row-${target.id}`)
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      row?.classList.add('duplicate-focus')
      window.setTimeout(() => row?.classList.remove('duplicate-focus'), 1600)
    })
  }

  const collectKeywordBranchIds = (keywordIds: Set<string>) => {
    const ids = new Set(keywordIds)
    let changed = true
    while (changed) {
      changed = false
      data.keywords.forEach((keyword) => {
        if (keyword.parentId && ids.has(keyword.parentId) && !ids.has(keyword.id)) {
          ids.add(keyword.id)
          changed = true
        }
      })
    }
    return ids
  }

  const toggleKeywordSelection = (keywordId: string) => {
    setSelectedKeywordIds((current) => {
      const next = new Set(current)
      if (next.has(keywordId)) {
        next.delete(keywordId)
      } else {
        next.add(keywordId)
      }
      return next
    })
  }

  const startEditKeyword = (keyword: Keyword) => {
    setEditingKeywordId(keyword.id)
    setKeywordFormType(keywordTypeOf(keyword))
    window.requestAnimationFrame(() => {
      document.querySelector('.keyword-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const importKeywordsToArticles = (keywordIds: Iterable<string>) => {
    if (!canEditProjects) return
    const requestedIds = new Set(keywordIds)
    const importableKeywords = acceptedProjectKeywords.filter((keyword) => requestedIds.has(keyword.id) && !keywordIsInArticles(keyword))
    if (importableKeywords.length === 0) {
      setQuickKeywordStatus('Chưa có keyword hợp lệ để đẩy sang module Bài viết.')
      return
    }
    const importableIds = new Set(importableKeywords.map((keyword) => keyword.id))
    saveData({
      ...data,
      keywords: data.keywords.map((item) => importableIds.has(item.id) ? { ...item, articleImported: true } : item),
    }, 'Thêm keyword vào Bài viết', `${importableKeywords.length} keyword`)
    setSelectedKeywordIds((current) => new Set([...current].filter((keywordId) => !importableIds.has(keywordId))))
    setQuickKeywordStatus(`Đã đẩy ${importableKeywords.length} keyword sang module Bài viết.`)
  }

  const importKeywordToArticles = (keywordId: string) => importKeywordsToArticles([keywordId])
  const importSelectedKeywordsToArticles = () => importKeywordsToArticles(selectedKeywordIds)

  const deleteKeywordFromArticles = (keywordId: string) => {
    if (!canEditProjects) return
    const keyword = data.keywords.find((item) => item.id === keywordId)
    if (!keyword || !keywordIsInArticles(keyword)) return
    const idsToDelete = collectKeywordBranchIds(new Set([keywordId]))
    const taskIdsToDelete = new Set(
      data.keywords
        .filter((item) => idsToDelete.has(item.id) && item.articleTaskId)
        .map((item) => item.articleTaskId as string),
    )
    const branchMessage = idsToDelete.size > 1 ? ` và ${idsToDelete.size - 1} keyword con` : ''
    if (!window.confirm(`Xóa vĩnh viễn keyword "${keyword.term}"${branchMessage} khỏi toàn hệ thống?\n\nKeyword sẽ biến mất khỏi cả Bài viết và Quản lý Keyword. Task bài viết liên kết cũng sẽ bị xóa.`)) {
      return
    }
    saveData({
      ...data,
      keywords: data.keywords.filter((item) => !idsToDelete.has(item.id)),
      tasks: data.tasks.filter((task) => !taskIdsToDelete.has(task.id)),
    }, 'Xóa keyword từ Bài viết', `${keyword.term}${branchMessage}`)
    setQuickKeywordStatus(`Đã xóa vĩnh viễn keyword "${keyword.term}"${branchMessage} khỏi toàn hệ thống.`)
  }

  const deleteSelectedKeywords = () => {
    if (!canEditProjects) return
    if (selectedKeywordIds.size === 0) return
    const idsToDelete = collectKeywordBranchIds(selectedKeywordIds)
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${idsToDelete.size} keyword đã chọn? Các keyword con cũng sẽ bị xóa.`)) {
      return
    }

    const taskIdsToDelete = new Set(
      data.keywords
        .filter((keyword) => idsToDelete.has(keyword.id) && keyword.articleTaskId)
        .map((keyword) => keyword.articleTaskId as string),
    )
    saveData({
      ...data,
      keywords: data.keywords.filter((keyword) => !idsToDelete.has(keyword.id)),
      tasks: data.tasks.filter((task) => !taskIdsToDelete.has(task.id)),
    }, 'Xóa keyword hàng loạt', `${idsToDelete.size} keyword`)
    setSelectedKeywordIds(new Set())
  }

  const updateKeywordArticle = (keywordId: string, updates: Partial<Pick<Keyword, 'articleType' | 'articleTitle' | 'articleMetaDescription' | 'articleContent' | 'articleStatus' | 'articleUpdatedAt' | 'articleSource' | 'articleAssigneeId' | 'articleUrl'>>) => {
    if (!canEditProjects && !assignedArticleKeywordIds.has(keywordId)) return
    const keywordToUpdate = data.keywords.find((keyword) => keyword.id === keywordId)
    const articleTask = keywordToUpdate?.articleTaskId ? data.tasks.find((task) => task.id === keywordToUpdate.articleTaskId) : undefined
    const articleTaskCompleted = articleTask ? taskStatusOf(articleTask) === 'Hoàn thành' : false
    const allowedUpdates = { ...updates }
    if (!canEditProjects && 'articleAssigneeId' in allowedUpdates) delete allowedUpdates.articleAssigneeId
    if (articleTaskCompleted) {
      if ('articleAssigneeId' in allowedUpdates) delete allowedUpdates.articleAssigneeId
      if ('articleUrl' in allowedUpdates) delete allowedUpdates.articleUrl
    }
    if (Object.keys(allowedUpdates).length === 0) return
    saveData({
      ...data,
      keywords: data.keywords.map((keyword) =>
        keyword.id === keywordId
          ? {
              ...keyword,
              ...allowedUpdates,
              ...('articleUrl' in allowedUpdates && allowedUpdates.articleUrl !== keyword.articleUrl
                ? { indexStatus: 'Chua check' as KeywordIndexStatus, indexCheckedAt: '' }
                : {}),
            }
          : keyword,
      ),
    }, 'Cập nhật bài viết keyword', data.keywords.find((keyword) => keyword.id === keywordId)?.term ?? keywordId)
  }

  const sendArticleTask = (keywordId: string) => {
    if (!canEditProjects) return
    const keyword = data.keywords.find((item) => item.id === keywordId)
    if (!keyword || !activeProject) return
    const linkedTask = keyword.articleTaskId ? data.tasks.find((task) => task.id === keyword.articleTaskId) : undefined
    if (linkedTask && taskStatusOf(linkedTask) === 'Hoàn thành') return
    if (!keyword.articleAssigneeId) {
      window.alert('Vui lòng chọn người phụ trách trước khi gửi task.')
      return
    }

    const title = `Viết bài: ${keyword.term}`
    const existingTask = keyword.articleTaskId ? data.tasks.find((task) => task.id === keyword.articleTaskId) : undefined
    const taskId = existingTask?.id ?? uid('t')
    const assignedAt = appNowIso()
    const deadlineAt = defaultTaskDeadlineInput(new Date(assignedAt))
    const articleTaskSalary = existingTask?.taskSalary ?? taskSalarySettings['Bài viết']
    const task: Task = existingTask
      ? {
          ...existingTask,
          title,
          assigneeId: keyword.articleAssigneeId,
          projectId: keyword.projectId,
          dueDate: taskDueDateFromDeadline(deadlineAt),
          deadlineAt,
          assignedAt,
          acceptedAt: '',
          completedAt: '',
          approvedAt: '',
          rejectionReason: '',
          revisionNote: '',
          deadlineReminderAt: '',
          overdueEscalatedAt: '',
          cancelledAt: '',
          taskSalary: articleTaskSalary,
          salaryModule: 'Bài viết',
          status: 'Chờ nhận',
        }
      : {
          id: taskId,
          projectId: keyword.projectId,
          title,
          assigneeId: keyword.articleAssigneeId,
          dueDate: taskDueDateFromDeadline(deadlineAt),
          deadlineAt,
          assignedAt,
          estimatedHours: 0,
          taskSalary: articleTaskSalary,
          salaryModule: 'Bài viết',
          status: 'Chờ nhận',
        }

    const nextData = {
      ...data,
      keywords: data.keywords.map((item) => (item.id === keywordId ? { ...item, articleTaskId: taskId } : item)),
      tasks: existingTask ? data.tasks.map((item) => (item.id === taskId ? task : item)) : [task, ...data.tasks],
    }
    saveData(
      notifyTaskAssignee(nextData, task, existingTask ? 'Task bài viết được phân lại' : 'Task bài viết mới'),
      existingTask ? 'Phân việc lại bài viết' : 'Gửi task bài viết',
      keyword.term,
    )
  }

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canEditTasks) return
    if (!activeProject) return
    const form = new FormData(event.currentTarget)
    const assignedAt = appNowIso()
    const deadlineAt = String(form.get('deadlineAt')) || defaultTaskDeadlineInput(new Date(assignedAt))
    const salaryModule = String(form.get('salaryModule'))
    const task: Task = {
      id: uid('t'),
      projectId: activeProject.id,
      title: String(form.get('title')).trim(),
      assigneeId: String(form.get('assigneeId')),
      dueDate: taskDueDateFromDeadline(deadlineAt),
      deadlineAt,
      assignedAt,
      estimatedHours: Number(form.get('estimatedHours')) || 0,
      taskSalary: Number(form.get('taskSalary')) || 0,
      salaryModule: validTaskSalaryModule(salaryModule) ? salaryModule : undefined,
      status: 'Chờ nhận',
    }
    saveData(notifyTaskAssignee({ ...data, tasks: [task, ...data.tasks] }, task), 'Thêm task', task.title)
    event.currentTarget.reset()
  }

  const saveExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const scope = String(form.get('scope')) as ExpenseScope
    const transaction: Transaction = {
      id: editingTransactionId ?? uid('m'),
      projectId: scope === 'Chi chung dự án' ? '' : String(form.get('projectId')),
      type: 'Chi',
      scope,
      spenderId: String(form.get('spenderId')),
      label: String(form.get('label')).trim(),
      amount: Number(form.get('amount')) || 0,
      date: String(form.get('date')),
      settlementDate: editingTransaction?.settlementDate ?? '',
    }
    saveData({
      ...data,
      transactions: editingTransactionId
        ? data.transactions.map((item) => (item.id === editingTransactionId ? transaction : item))
        : [transaction, ...data.transactions],
    }, editingTransactionId ? 'Sửa khoản chi' : 'Tạo khoản chi', transaction.label)
    setEditingTransactionId(null)
    event.currentTarget.reset()
  }

  const editExpense = (transactionId: string) => {
    setEditingTransactionId(transactionId)
  }

  const settleExpense = (transactionId: string) => {
    const transaction = data.transactions.find((item) => item.id === transactionId)
    if (!transaction) return
    const spenderName = ownerName(transaction.spenderId ?? '')
    if (!window.confirm(`Xác nhận đã giải ngân chi trả khoản "${transaction.label}" cho ${spenderName}?`)) return
    saveData({
      ...data,
      transactions: data.transactions.map((item) =>
        item.id === transactionId ? { ...item, settlementDate: appNowIso() } : item,
      ),
    }, 'Giải ngân công nợ', transaction.label)
  }

  const saveUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const role = String(form.get('role')) as Role
    const formPermissions = form.getAll('permissions').map(String)
    const user: User = {
      id: editingUserId ?? uid('u'),
      name: String(form.get('name')).trim(),
      email: String(form.get('email')).trim(),
      password: String(form.get('password')) || '123456',
      role,
      active: true,
      permissions: role === 'Quản trị viên' ? permissions.flatMap((permission) => [permissionKey(permission, 'view'), permissionKey(permission, 'edit')]) : formPermissions,
      salaryType: String(form.get('salaryType')) as SalaryType,
      salaryAmount: Number(form.get('salaryAmount')) || 0,
      checkedInAt: editingUser?.checkedInAt ?? '',
      totalWorkedMs: editingUser?.totalWorkedMs ?? 0,
    }
    saveData({
      ...data,
      users: editingUserId ? data.users.map((item) => (item.id === editingUserId ? user : item)) : [user, ...data.users],
    }, editingUserId ? 'Sửa nhân sự' : 'Thêm nhân sự', user.name)
    setEditingUserId(null)
    event.currentTarget.reset()
  }

  const saveTaskSalarySettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextSettings = taskSalaryModules.reduce((settings, module) => ({
      ...settings,
      [module]: Number(form.get(`taskSalary-${module}`)) || 0,
    }), {} as TaskSalarySettings)
    saveData({
      ...data,
      taskSalarySettings: nextSettings,
    }, 'Cập nhật lương theo task', 'Bài viết / Backlink / SEO Entity')
  }

  const settlePayroll = (userId: string, period: string) => {
    const user = data.users.find((item) => item.id === userId)
    if (!user) return
    const existingSettlement = payrollSettlements.find((settlement) => settlement.userId === userId && settlement.period === period)
    if (existingSettlement) {
      window.alert(`Nhân sự "${user.name}" đã chốt lương kỳ ${formatPayrollPeriod(period)}.`)
      return
    }
    const salaryType = user.salaryType ?? 'Lương theo tháng'
    const preview = payrollAmountForUser(user, activeTasks, period)
    const amount = Math.round(preview.amount)
    if (amount <= 0) {
      window.alert(`Không có lương cần chốt cho "${user.name}" trong kỳ ${formatPayrollPeriod(period)}.`)
      return
    }
    if (!window.confirm(`Chốt lương ${formatPayrollPeriod(period)} cho ${user.name}: ${currency.format(amount)}? Khoản này sẽ tự động thêm vào Tài chính.`)) return
    const settledAt = appNowIso()
    const settlementId = uid('pay')
    const transactionId = uid('m')
    const settlement: PayrollSettlement = {
      id: settlementId,
      userId,
      salaryType,
      period,
      amount,
      taskIds: preview.taskIds,
      transactionId,
      settledAt,
      createdBy: currentUser?.id ?? '',
      note: preview.basis,
    }
    const transaction: Transaction = {
      id: transactionId,
      projectId: '',
      type: 'Chi',
      scope: 'Chi chung dự án',
      spenderId: userId,
      label: `Chốt lương ${user.name} - ${formatPayrollPeriod(period)}`,
      amount,
      date: appDateInput(),
      settlementDate: settledAt,
      payrollSettlementId: settlementId,
    }
    const taskIds = new Set(preview.taskIds)
    const nextUsers = data.users.map((item) => {
      if (item.id !== userId || salaryType !== 'Lương theo giờ') return item
      return { ...item, checkedInAt: '', totalWorkedMs: 0 }
    })
    saveData({
      ...data,
      users: nextUsers,
      tasks: data.tasks.map((task) =>
        taskIds.has(task.id) ? { ...task, payrollSettlementId: settlementId, payrollSettledAt: settledAt } : task,
      ),
      transactions: [transaction, ...data.transactions],
      payrollSettlements: [settlement, ...payrollSettlements],
    }, 'Chốt lương nhân viên', `${user.name} - ${formatPayrollPeriod(period)}`)
  }

  const editUser = (userId: string) => {
    setEditingUserId(userId)
  }

  const deleteUser = (userId: string) => {
    const user = data.users.find((item) => item.id === userId)
    if (!user || user.id === currentUser?.id) return
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhân sự "${user.name}"?`)) return
    saveData({
      ...data,
      users: data.users.filter((item) => item.id !== userId),
      tasks: data.tasks.map((task) => (task.assigneeId === userId ? { ...task, assigneeId: '' } : task)),
      keywords: data.keywords.map((keyword) =>
        keyword.articleAssigneeId === userId ? { ...keyword, articleAssigneeId: '', articleTaskId: '' } : keyword,
      ),
      transactions: data.transactions.map((transaction) =>
        transaction.spenderId === userId ? { ...transaction, spenderId: '' } : transaction,
      ),
    }, 'Xóa nhân sự', user.name)
  }

  const checkIn = () => {
    if (!currentUser || currentUser.checkedInAt) return
    saveData({
      ...data,
      users: data.users.map((user) => (user.id === currentUser.id ? { ...user, checkedInAt: appNowIso() } : user)),
    }, 'Check-in làm việc', currentUser.name)
  }

  const checkOut = () => {
    if (!currentUser?.checkedInAt) return
    const sessionMs = Math.max(0, appNow().getTime() - new Date(currentUser.checkedInAt).getTime())
    saveData({
      ...data,
      users: data.users.map((user) =>
        user.id === currentUser.id
          ? { ...user, checkedInAt: '', totalWorkedMs: (user.totalWorkedMs ?? 0) + sessionMs }
          : user,
      ),
    }, 'Check-out làm việc', currentUser.name)
  }

  const acceptTask = (taskId: string) => {
    const task = data.tasks.find((item) => item.id === taskId)
    if (!task) return
    if (!canEditTasks && task.assigneeId !== currentUserIdValue) return
    const nextData = {
      ...data,
      tasks: data.tasks.map((item) =>
        item.id === taskId
          ? { ...item, status: 'Đang làm' as TaskStatus, acceptedAt: appNowIso(), rejectionReason: '', revisionNote: '' }
          : item,
      ),
    }
    saveData(
      notifyProjectAdmins(nextData, task, 'Nhân viên đã nhận task', `${ownerName(task.assigneeId)} đã nhận task: ${task.title}`),
      'Nhận task',
      task.title,
    )
  }

  const rejectTask = (taskId: string) => {
    const task = data.tasks.find((item) => item.id === taskId)
    if (!task) return
    if (!canEditTasks && task.assigneeId !== currentUserIdValue) return
    const reason = window.prompt('Nhập lý do từ chối task:')
    if (!reason) return
    const nextData = {
      ...data,
      tasks: data.tasks.map((item) =>
        item.id === taskId ? { ...item, status: 'Từ chối' as TaskStatus, rejectionReason: reason, acceptedAt: '' } : item,
      ),
    }
    saveData(
      notifyProjectAdmins(nextData, task, 'Nhân viên từ chối task', `${ownerName(task.assigneeId)} từ chối task "${task.title}". Lý do: ${reason}`),
      'Từ chối task',
      task.title,
    )
  }

  const submitTaskForReview = (taskId: string) => {
    const task = data.tasks.find((item) => item.id === taskId)
    if (!task) return
    if (!canEditTasks && task.assigneeId !== currentUserIdValue) return
    const nextData = {
      ...data,
      tasks: data.tasks.map((item) =>
        item.id === taskId ? { ...item, status: 'Chờ duyệt' as TaskStatus, completedAt: appNowIso() } : item,
      ),
    }
    saveData(
      notifyProjectAdmins(nextData, task, 'Task chờ duyệt', `${ownerName(task.assigneeId)} đã gửi hoàn thành task: ${task.title}`),
      'Gửi duyệt task',
      task.title,
    )
  }

  const approveTask = (taskId: string) => {
    if (!canEditTasks) return
    const task = data.tasks.find((item) => item.id === taskId)
    if (!task) return
    const nextData = {
      ...data,
      tasks: data.tasks.map((item) =>
        item.id === taskId ? { ...item, status: 'Hoàn thành' as TaskStatus, approvedAt: appNowIso(), revisionNote: '' } : item,
      ),
      seoEntityLinks: (data.seoEntityLinks ?? []).map((link) =>
        link.taskId === taskId ? { ...link, deploymentStatus: 'Đã live' as EntityDeploymentStatus } : link,
      ),
    }
    saveData(
      notifyTaskAssignee(nextData, task, 'Task đã được xác nhận hoàn thành'),
      'Xác nhận hoàn thành task',
      task.title,
    )
  }

  const requestTaskRevision = (taskId: string) => {
    if (!canEditTasks) return
    const task = data.tasks.find((item) => item.id === taskId)
    if (!task) return
    const note = window.prompt('Nhập nội dung cần chỉnh sửa:')
    if (!note) return
    const nextData = {
      ...data,
      tasks: data.tasks.map((item) =>
        item.id === taskId ? { ...item, status: 'Cần chỉnh sửa' as TaskStatus, revisionNote: note } : item,
      ),
    }
    saveData(
      notifyTaskAssignee(nextData, task, 'Task cần chỉnh sửa'),
      'Yêu cầu chỉnh sửa task',
      task.title,
    )
  }

  const reassignTask = (taskId: string, assigneeId: string) => {
    if (!canEditTasks) return
    const task = data.tasks.find((item) => item.id === taskId)
    if (!task) return
    const assignedAt = appNowIso()
    const deadlineAt = defaultTaskDeadlineInput(new Date(assignedAt))
    const updatedTask = { ...task, assigneeId, status: 'Chờ nhận' as TaskStatus, assignedAt, deadlineAt, dueDate: taskDueDateFromDeadline(deadlineAt) }
    const nextData = {
      ...data,
      tasks: data.tasks.map((item) =>
        item.id === taskId
          ? {
              ...item,
              assigneeId,
              status: 'Chờ nhận' as TaskStatus,
              assignedAt,
              dueDate: taskDueDateFromDeadline(deadlineAt),
              deadlineAt,
              acceptedAt: '',
              completedAt: '',
              approvedAt: '',
              rejectionReason: '',
              revisionNote: '',
              deadlineReminderAt: '',
              overdueEscalatedAt: '',
              cancelledAt: '',
            }
          : item,
      ),
    }
    saveData(notifyTaskAssignee(nextData, updatedTask, 'Task được phân lại'), 'Phân lại task', task.title)
  }

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    if (!canEditTasks) return
    const task = data.tasks.find((item) => item.id === taskId)
    if (!task) return
    const nextData = {
      ...data,
      tasks: data.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              approvedAt: status === 'Hoàn thành' ? appNowIso() : task.approvedAt,
              completedAt: status === 'Chờ duyệt' ? appNowIso() : task.completedAt,
            }
          : task,
      ),
      seoEntityLinks: (data.seoEntityLinks ?? []).map((link) =>
        link.taskId === taskId && status === 'Hoàn thành' ? { ...link, deploymentStatus: 'Đã live' as EntityDeploymentStatus } : link,
      ),
    }
    saveData(
      notifyProjectAdmins(
        status === 'Hoàn thành' || status === 'Cần chỉnh sửa' ? notifyTaskAssignee(nextData, task, `Task chuyển trạng thái: ${status}`) : nextData,
        task,
        'Trạng thái task thay đổi',
        `Task "${task.title}" chuyển sang trạng thái ${status}.`,
      ),
      'Cập nhật trạng thái task',
      task.title,
    )
  }

  const deleteTask = (taskId: string) => {
    if (!isAdmin) return
    const task = data.tasks.find((item) => item.id === taskId)
    if (!task) return
    if (!window.confirm(`Xóa task "${task.title}" khỏi hệ thống? Liên kết task trong bài viết, Entity, Backlink và chốt lương sẽ được gỡ.`)) return
    saveData({
      ...data,
      tasks: data.tasks.filter((item) => item.id !== taskId),
      keywords: data.keywords.map((keyword) => keyword.articleTaskId === taskId ? { ...keyword, articleTaskId: '' } : keyword),
      seoEntityLinks: (data.seoEntityLinks ?? []).map((link) => link.taskId === taskId ? { ...link, taskId: '' } : link),
      seoBacklinkPlans: (data.seoBacklinkPlans ?? []).map((plan) => plan.taskId === taskId ? { ...plan, taskId: '' } : plan),
      payrollSettlements: (data.payrollSettlements ?? []).map((settlement) => ({
        ...settlement,
        taskIds: settlement.taskIds.filter((item) => item !== taskId),
      })),
    }, 'Xóa task', task.title)
  }

  const saveEntityProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeProject) return
    const form = new FormData(event.currentTarget)
    const entityId = activeEntity?.id ?? uid('entity')
    const entity: SeoEntity = {
      id: entityId,
      projectId: activeProject.id,
      name: String(form.get('name')).trim(),
      officialName: String(form.get('officialName')).trim(),
      alternativeNames: String(form.get('alternativeNames')).trim(),
      entityType: String(form.get('entityType')) as EntityType,
      website: String(form.get('website')).trim(),
      logoUrl: String(form.get('logoUrl')).trim(),
      coverUrl: String(form.get('coverUrl')).trim(),
      shortDescription: String(form.get('shortDescription')).trim(),
      shortDescriptionHtml: String(form.get('shortDescriptionHtml')).trim(),
      longDescription: String(form.get('longDescription')).trim(),
      longDescriptionHtml: String(form.get('longDescriptionHtml')).trim(),
      anchorText: String(form.get('anchorText')).trim(),
      anchorTextHtml: String(form.get('anchorTextHtml')).trim(),
      industry: String(form.get('industry')).trim(),
      countryLanguage: String(form.get('countryLanguage')).trim(),
      phone: String(form.get('phone')).trim(),
      email: String(form.get('email')).trim(),
      address: String(form.get('address')).trim(),
      mapsUrl: String(form.get('mapsUrl')).trim(),
      status: String(form.get('status')) as EntityStatus,
      googleAccountEmail: String(form.get('googleAccountEmail')).trim(),
      googleAccountPassword: String(form.get('googleAccountPassword')).trim(),
      googleAccountPhone: String(form.get('googleAccountPhone')).trim(),
      googleBackupAccount: String(form.get('googleBackupAccount')).trim(),
      googleTwoFactorCode: String(form.get('googleTwoFactorCode')).trim(),
      defaultAccountId: String(form.get('defaultAccountId')).trim(),
      defaultAccountPassword: String(form.get('defaultAccountPassword')).trim(),
      defaultAccountEmail: String(form.get('defaultAccountEmail')).trim(),
    }
    const isUpdate = projectEntities.some((item) => item.id === entityId)
    const nextData: AppData = {
      ...data,
      seoEntities: isUpdate ? (data.seoEntities ?? []).map((item) => (item.id === entityId ? entity : item)) : [entity, ...(data.seoEntities ?? [])],
      seoEntityChecklist: isUpdate ? data.seoEntityChecklist : [...buildEntityChecklist(activeProject.id, entityId), ...(data.seoEntityChecklist ?? [])],
    }
    saveData(nextData, isUpdate ? 'Cập nhật hồ sơ Entity' : 'Tạo hồ sơ Entity', entity.name)
    if (isUpdate) window.alert('Đã cập nhật hồ sơ Entity.')
    setSelectedEntityId(entityId)
  }

  const createNewEntityProfile = () => {
    setSelectedEntityId('new')
    setEntityTab('profile')
  }

  const deleteEntityProfile = (entityId: string) => {
    const entity = (data.seoEntities ?? []).find((item) => item.id === entityId)
    if (!entity || !window.confirm(`Bạn có chắc chắn muốn xóa Entity "${entity.name}"? Link, checklist và schema liên quan cũng sẽ bị xóa.`)) return
    saveData({
      ...data,
      seoEntities: (data.seoEntities ?? []).filter((item) => item.id !== entityId),
      seoEntityLinks: (data.seoEntityLinks ?? []).filter((item) => item.entityId !== entityId),
      seoEntityChecklist: (data.seoEntityChecklist ?? []).filter((item) => item.entityId !== entityId),
      seoEntitySchemas: (data.seoEntitySchemas ?? []).filter((item) => item.entityId !== entityId),
    }, 'Xóa hồ sơ Entity', entity.name)
    setSelectedEntityId('')
  }

  const addEntityPlatform = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const platform: SeoEntityPlatform = {
      id: editingEntityPlatform?.id ?? uid('ep'),
      name: String(form.get('name')).trim(),
      domain: String(form.get('domain')).trim(),
      description: String(form.get('description')).trim(),
      group: String(form.get('group')) as EntityPlatformGroup,
      defaultLinkType: String(form.get('defaultLinkType')) as EntityLinkType,
      backlinkType: '',
      category: '',
      niche: '',
      domainAuthority: entityDomainAuthorityOf(form.get('domainAuthority')),
      status: String(form.get('status')) as EntityPlatformStatus,
      guideFileName: entityGuideFileNameOf(String(form.get('guideFileName')).trim()),
      guideUrl: String(form.get('guideUrl')).trim(),
    }
    saveData({
      ...data,
      seoEntityPlatforms: editingEntityPlatform
        ? (data.seoEntityPlatforms ?? []).map((item) => (item.id === editingEntityPlatform.id ? platform : item))
        : [platform, ...(data.seoEntityPlatforms ?? [])],
    }, editingEntityPlatform ? 'Cập nhật nền tảng Entity' : 'Thêm nền tảng Entity', platform.name)
    setEditingEntityPlatformId(null)
    event.currentTarget.reset()
  }

  const startEditEntityPlatform = (platformId: string) => {
    setEditingEntityPlatformId(platformId)
    window.requestAnimationFrame(() => document.querySelector('.entity-platform-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const importEntityPlatforms = (rows: Record<string, unknown>[], sourceLabel: string) => {
    const importedPlatforms = rows.map(mapPlatformImportRow).filter((platform): platform is SeoEntityPlatform => Boolean(platform))
    if (importedPlatforms.length === 0) {
      setEntityImportStatus(`Không tìm thấy nền tảng hợp lệ trong ${sourceLabel}. Cần tối thiểu cột Tên nền tảng và Domain.`)
      return
    }
    const repairedNames = new Set<string>()
    const existingPlatforms = data.seoEntityPlatforms ?? []
    const repairedPlatforms = existingPlatforms.map((platform) => {
      if (domainHasTld(platform.domain)) return platform
      const importedMatch = importedPlatforms.find((importedPlatform) =>
        normalizeImportHeader(importedPlatform.name) === normalizeImportHeader(platform.name) &&
        domainHasTld(importedPlatform.domain),
      )
      if (!importedMatch) return platform
      repairedNames.add(normalizeImportHeader(importedMatch.name))
      return {
        ...importedMatch,
        id: platform.id,
      }
    })
    const existingKeys = new Set(repairedPlatforms.map((platform) => normalizeImportHeader(`${platform.name}-${platform.domain}`)))
    const uniquePlatforms = importedPlatforms.filter((platform) =>
      !repairedNames.has(normalizeImportHeader(platform.name)) &&
      !existingKeys.has(normalizeImportHeader(`${platform.name}-${platform.domain}`)),
    )
    if (uniquePlatforms.length === 0 && repairedNames.size === 0) {
      setEntityImportStatus(`Các nền tảng trong ${sourceLabel} đã tồn tại, không import thêm dòng mới.`)
      return
    }
    saveData({
      ...data,
      seoEntityPlatforms: [...uniquePlatforms, ...repairedPlatforms],
    }, 'Import nền tảng Entity', `${uniquePlatforms.length} nền tảng từ ${sourceLabel}`)
    setEntityImportStatus(`Đã import ${uniquePlatforms.length}/${importedPlatforms.length} nền tảng từ ${sourceLabel}${repairedNames.size ? `, sửa domain cho ${repairedNames.size} nền tảng đã có` : ''}.`)
  }

  const importEntityPlatformsFromSheet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const sheetUrl = String(form.get('sheetUrl')).trim()
    if (!sheetUrl) return
    setEntityImportStatus('Đang tải dữ liệu Google Sheet...')
    try {
      const response = await fetch(googleSheetExportUrl(sheetUrl))
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      importEntityPlatforms(parseCsvRows(await response.text()), 'Google Sheet')
      event.currentTarget.reset()
    } catch (error) {
      setEntityImportStatus(`Không import được Google Sheet. Sheet cần public/published CSV. ${error instanceof Error ? error.message : ''}`)
    }
  }

  const importEntityPlatformsFromFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setEntityImportStatus(`Đang đọc file ${file.name}...`)
    try {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (extension === 'xlsx' || extension === 'xls') {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' })
        importEntityPlatforms(rows, file.name)
      } else {
        importEntityPlatforms(parseCsvRows(await file.text()), file.name)
      }
    } catch (error) {
      setEntityImportStatus(`Không đọc được file import. ${error instanceof Error ? error.message : ''}`)
    } finally {
      event.target.value = ''
    }
  }

  const updateEntityLinkCredential = (updates: Partial<EntityLinkCredential>) => {
    setEntityLinkCredential((current) => {
      const next = { ...current, ...updates }
      localStorage.setItem(entityCredentialKey, JSON.stringify(next))
      return next
    })
  }

  const addEntityLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeProject || !activeEntity) return
    const form = new FormData(event.currentTarget)
    const pendingLinkId = String(form.get('pendingLinkId'))
    const pendingLink = activeEntityLinks.find((link) => link.id === pendingLinkId)
    if (!pendingLink) {
      window.alert('Chọn một link chờ đã được đẩy từ Nền tảng Entity trước khi lưu.')
      return
    }
    const loginWithGoogle = form.get('loginWithGoogle') === 'on'
    const useDefaultEntityAccount = form.get('useDefaultEntityAccount') === 'on'
    const loginAccount = String(form.get('loginAccount')).trim()
    const loginPassword = String(form.get('loginPassword')).trim()
    const loginEmail = String(form.get('loginEmail')).trim()
    const accountUsed = String(form.get('accountUsed')).trim() || loginAccount || loginEmail
    const liveUrl = String(form.get('liveUrl')).trim()
    if (!liveUrl) {
      window.alert('Nhập URL live để hoàn tất Link Entity. Link chưa có URL live sẽ vẫn nằm trong danh sách chờ.')
      return
    }
    updateEntityLinkCredential({ loginWithGoogle, useDefaultEntityAccount, loginAccount, loginPassword, loginEmail, accountUsed })
    const submittedAssigneeId = String(form.get('assigneeId')).trim()
    const pendingTask = pendingLink.taskId ? data.tasks.find((task) => task.id === pendingLink.taskId) : undefined
    const resolvedAssigneeId = pendingLink.assigneeId || pendingTask?.assigneeId || submittedAssigneeId
    const link: SeoEntityLink = {
      ...pendingLink,
      loginWithGoogle,
      useDefaultEntityAccount,
      loginAccount,
      loginPassword,
      loginEmail,
      accountUsed,
      liveUrl,
      targetUrl: String(form.get('targetUrl')).trim() || entityTargetUrlOf(activeEntity, activeProject),
      anchorText: String(form.get('anchorText')).trim() || entityAnchorTextOf(activeEntity),
      displayName: String(form.get('displayName')).trim() || entityDisplayNameOf(activeEntity),
      usedDescription: String(form.get('usedDescription')).trim() || entityUsedDescriptionOf(activeEntity),
      assigneeId: resolvedAssigneeId,
      deployedDate: appNowIso(),
      deploymentStatus: pendingLink.deploymentStatus,
      notes: String(form.get('notes')).trim(),
    }
    saveData({
      ...data,
      seoEntityLinks: (data.seoEntityLinks ?? []).map((item) => (item.id === pendingLink.id ? link : item)),
    }, 'Cập nhật link chờ Entity', activeEntity.name)
    setSelectedEntityLinkIds((current) => new Set([...current].filter((linkId) => linkId !== pendingLink.id)))
    event.currentTarget.reset()
    updateEntityLinkCredential({ loginWithGoogle, useDefaultEntityAccount, loginAccount, loginPassword, loginEmail, accountUsed })
  }

  const buildEntityLinkFromPlatform = (platform: SeoEntityPlatform): SeoEntityLink | null => {
    if (!activeProject || !activeEntity) return null
    return {
      id: uid('el'),
      projectId: activeProject.id,
      entityId: activeEntity.id,
      platformId: platform.id,
      loginWithGoogle: false,
      useDefaultEntityAccount: false,
      loginAccount: '',
      loginPassword: '',
      loginEmail: '',
      accountUsed: '',
      liveUrl: '',
      targetUrl: entityTargetUrlOf(activeEntity, activeProject),
      anchorText: entityAnchorTextOf(activeEntity),
      displayName: entityDisplayNameOf(activeEntity),
      usedDescription: entityUsedDescriptionOf(activeEntity),
      assigneeId: '',
      deployedDate: '',
      deploymentStatus: 'Chưa làm',
      linkStatus: 'Chưa check',
      indexStatus: 'Chưa check',
      napStatus: 'Chưa check',
      taskId: '',
      notes: `Tạo nhanh từ nền tảng ${platform.name}.`,
    }
  }

  const duplicateEntityLinkPlatforms = (platformsToCheck: SeoEntityPlatform[]) => {
    const activePlatformById = new Map(entityPlatforms.map((platform) => [platform.id, platform]))
    const seenPlatformIds = new Set(activeEntityLinks.map((link) => link.platformId).filter(Boolean))
    const seenDomains = new Set(
      activeEntityLinks
        .map((link) => cleanDomainCandidate(activePlatformById.get(link.platformId)?.domain ?? ''))
        .filter(Boolean),
    )
    const duplicatePlatforms: SeoEntityPlatform[] = []
    platformsToCheck.forEach((platform) => {
      const domain = cleanDomainCandidate(platform.domain)
      if (seenPlatformIds.has(platform.id) || Boolean(domain && seenDomains.has(domain))) {
        duplicatePlatforms.push(platform)
        return
      }
      seenPlatformIds.add(platform.id)
      if (domain) seenDomains.add(domain)
    })
    return duplicatePlatforms
  }

  const alertDuplicateEntityLinks = (duplicatePlatforms: SeoEntityPlatform[]) => {
    if (!activeEntity || duplicatePlatforms.length === 0) return
    const names = duplicatePlatforms.map((platform) => `- ${platform.name}${platform.domain ? ` (${platform.domain})` : ''}`).join('\n')
    window.alert(`Các nền tảng sau đã có Link Entity trong hồ sơ "${activeEntity.name}", SEO Ops sẽ không tạo bản trùng:\n${names}`)
  }

  const createEntityLinkFromPlatform = (platformId: string) => {
    if (!canEditProjects || !activeProject || !activeEntity) return
    const platform = entityPlatforms.find((item) => item.id === platformId)
    if (!platform) return
    const duplicatePlatforms = duplicateEntityLinkPlatforms([platform])
    if (duplicatePlatforms.length > 0) {
      alertDuplicateEntityLinks(duplicatePlatforms)
      setEntityTab('links')
      return
    }
    const link = buildEntityLinkFromPlatform(platform)
    if (!link) return
    saveData({ ...data, seoEntityLinks: [link, ...(data.seoEntityLinks ?? [])] }, 'Đẩy nền tảng sang Link Entity', `${platform.name} - ${activeEntity.name}`)
    setSelectedEntityLinkIds(new Set([link.id]))
    setEntityTab('links')
  }

  const createEntityLinksFromPlatforms = (platformIds: string[]) => {
    if (!canEditProjects || !activeProject || !activeEntity || platformIds.length === 0) return false
    const selectedIdSet = new Set(platformIds)
    const selectedPlatforms = entityPlatforms.filter((platform) => selectedIdSet.has(platform.id))
    const duplicatePlatforms = duplicateEntityLinkPlatforms(selectedPlatforms)
    if (duplicatePlatforms.length > 0) alertDuplicateEntityLinks(duplicatePlatforms)
    const duplicatePlatformIds = new Set(duplicatePlatforms.map((platform) => platform.id))
    const uniquePlatforms = selectedPlatforms.filter((platform) => !duplicatePlatformIds.has(platform.id))
    const links = uniquePlatforms.map(buildEntityLinkFromPlatform).filter((link): link is SeoEntityLink => Boolean(link))
    if (links.length === 0) return false
    saveData({
      ...data,
      seoEntityLinks: [...links, ...(data.seoEntityLinks ?? [])],
    }, 'Đẩy hàng loạt nền tảng sang Link Entity', `${links.length} nền tảng - ${activeEntity.name}`)
    setSelectedEntityLinkIds(new Set(links.map((link) => link.id)))
    setEntityTab('links')
    return true
  }

  const deleteEntityPlatforms = (platformIds: string[]) => {
    if (!canEditProjects || platformIds.length === 0) return false
    const selectedIdSet = new Set(platformIds)
    const selectedPlatforms = entityPlatforms.filter((platform) => selectedIdSet.has(platform.id))
    if (selectedPlatforms.length === 0) return false
    if (!window.confirm(`Xóa ${selectedPlatforms.length} nền tảng Entity đã chọn khỏi kho nền tảng? Các Link Entity đã tạo trước đó sẽ không bị xóa.`)) return false
    saveData({
      ...data,
      seoEntityPlatforms: entityPlatforms.filter((platform) => !selectedIdSet.has(platform.id)),
    }, 'Xóa nền tảng Entity hàng loạt', `${selectedPlatforms.length} nền tảng`)
    if (editingEntityPlatformId && selectedIdSet.has(editingEntityPlatformId)) setEditingEntityPlatformId(null)
    return true
  }

  const updateEntityLink = (linkId: string, updates: Partial<SeoEntityLink>) => {
    const link = (data.seoEntityLinks ?? []).find((item) => item.id === linkId)
    saveData({
      ...data,
      seoEntityLinks: (data.seoEntityLinks ?? []).map((item) => (item.id === linkId ? { ...item, ...updates } : item)),
    }, 'Cập nhật link Entity', link?.liveUrl || linkId)
  }

  const deleteEntityLink = (linkId: string) => {
    const link = (data.seoEntityLinks ?? []).find((item) => item.id === linkId)
    if (!link) return
    const platformName = entityPlatforms.find((platform) => platform.id === link.platformId)?.name ?? 'Link Entity'
    if (!window.confirm(`Thu hồi và xóa Link Entity "${platformName}" khỏi hồ sơ hiện tại?`)) return
    saveData({
      ...data,
      seoEntityLinks: (data.seoEntityLinks ?? []).filter((item) => item.id !== linkId),
    }, 'Thu hồi Link Entity', platformName)
    setSelectedEntityLinkIds((current) => {
      const next = new Set(current)
      next.delete(linkId)
      return next
    })
  }

  const toggleEntityLinkSelection = (linkId: string) => {
    setSelectedEntityLinkIds((current) => {
      const next = new Set(current)
      if (next.has(linkId)) {
        next.delete(linkId)
      } else {
        next.add(linkId)
      }
      return next
    })
  }

  const selectIncompleteEntityLinks = () => {
    setSelectedEntityLinkIds(
      new Set(
        activeEntityLinks
          .filter((link) => link.deploymentStatus !== 'Đã live' || link.linkStatus !== 'Live' || link.indexStatus !== 'Đã index' || link.napStatus !== 'Đúng')
          .map((link) => link.id),
      ),
    )
  }

  const sendEntityLinkTasks = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeProject || !activeEntity || selectedEntityLinkIds.size === 0) return
    const form = new FormData(event.currentTarget)
    const assigneeId = String(form.get('assigneeId'))
    const deadlineAt = String(form.get('deadlineAt'))
    const entityTaskSalary = taskSalarySettings['SEO Entity']
    const selectedLinks = activeEntityLinks.filter((link) => selectedEntityLinkIds.has(link.id))
    const newTasks: Task[] = []
    const updatedTasks = data.tasks.map((task) => {
      const matchedLink = selectedLinks.find((link) => link.taskId === task.id)
      if (!matchedLink) return task
      return {
        ...task,
        assigneeId,
        dueDate: deadlineAt.slice(0, 10),
        deadlineAt,
        assignedAt: appNowIso(),
        status: 'Chờ nhận' as TaskStatus,
        acceptedAt: '',
        completedAt: '',
        approvedAt: '',
        rejectionReason: '',
        revisionNote: '',
        deadlineReminderAt: '',
        overdueEscalatedAt: '',
        cancelledAt: '',
        taskSalary: task.taskSalary ?? entityTaskSalary,
        salaryModule: 'SEO Entity' as TaskSalaryModule,
      }
    })
    const updatedLinks = (data.seoEntityLinks ?? []).map((link) => {
      if (!selectedEntityLinkIds.has(link.id)) return link
      const existingTask = link.taskId ? data.tasks.find((task) => task.id === link.taskId) : undefined
      const taskId = existingTask?.id ?? uid('t')
      if (!existingTask) {
        const platformName = entityPlatforms.find((platform) => platform.id === link.platformId)?.name ?? 'Nền tảng Entity'
        newTasks.push({
          id: taskId,
          projectId: activeProject.id,
          title: `Triển khai Entity: ${activeEntity.name} trên ${platformName}`,
          assigneeId,
          dueDate: deadlineAt.slice(0, 10),
          deadlineAt,
          assignedAt: appNowIso(),
          estimatedHours: 0,
          taskSalary: entityTaskSalary,
          salaryModule: 'SEO Entity',
          status: 'Chờ nhận',
        })
      }
      return {
        ...link,
        taskId,
        assigneeId,
        deploymentStatus: 'Đang làm' as EntityDeploymentStatus,
      }
    })
    const tasksForNotification = [
      ...updatedTasks.filter((task) => selectedLinks.some((link) => link.taskId === task.id)),
      ...newTasks,
    ]
    let nextData: AppData = {
      ...data,
      seoEntityLinks: updatedLinks,
      tasks: [...newTasks, ...updatedTasks],
    }
    tasksForNotification.forEach((task) => {
      nextData = notifyTaskAssignee(nextData, task, 'Task Entity mới')
    })
    saveData(nextData, 'Phân task nhanh Entity', `${selectedLinks.length} link cho ${ownerName(assigneeId)}`)
    setSelectedEntityLinkIds(new Set())
    event.currentTarget.reset()
  }

  const checkEntityLink = (linkId: string) => {
    const link = (data.seoEntityLinks ?? []).find((item) => item.id === linkId)
    const entity = (data.seoEntities ?? []).find((item) => item.id === link?.entityId)
    if (!link || !entity) return
    const hasLiveUrl = /^https?:\/\//i.test(link.liveUrl)
    const hasTargetUrl = link.liveUrl.toLowerCase().includes(link.targetUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase().split('/')[0] ?? '')
    const napStatus: EntityNapStatus =
      link.displayName.toLowerCase().includes(entity.name.toLowerCase().slice(0, 8)) || link.displayName.toLowerCase().includes(entity.officialName.toLowerCase().slice(0, 8))
        ? 'Đúng'
        : 'Sai tên'
    updateEntityLink(linkId, {
      linkStatus: hasLiveUrl ? (hasTargetUrl || !link.targetUrl ? 'Live' : 'Không tìm thấy URL đích') : '404',
      httpStatus: hasLiveUrl ? 200 : 404,
      indexStatus: hasLiveUrl ? 'Đã index' : 'Không thể check',
      napStatus,
      deploymentStatus: hasLiveUrl ? 'Đã live' : 'Lỗi',
      lastCheckedAt: appNowIso(),
    })
  }

  const toggleEntityChecklist = (itemId: string) => {
    const item = (data.seoEntityChecklist ?? []).find((entry) => entry.id === itemId)
    saveData({
      ...data,
      seoEntityChecklist: (data.seoEntityChecklist ?? []).map((entry) =>
        entry.id === itemId ? { ...entry, done: !entry.done, updatedAt: appNowIso() } : entry,
      ),
    }, 'Cập nhật checklist Entity', item?.label ?? itemId)
  }

  const generateEntitySchema = () => {
    if (!activeProject || !activeEntity) return
    const schemaType = activeEntity.entityType
    const schema = {
      '@context': 'https://schema.org',
      '@type': schemaType === 'Brand' ? 'Organization' : schemaType,
      name: activeEntity.officialName || activeEntity.name,
      alternateName: activeEntity.alternativeNames ? activeEntity.alternativeNames.split(',').map((item) => item.trim()) : undefined,
      url: activeEntity.website,
      logo: activeEntity.logoUrl || undefined,
      image: activeEntity.coverUrl || undefined,
      description: activeEntity.longDescription || activeEntity.shortDescription,
      telephone: activeEntity.phone || undefined,
      email: activeEntity.email || undefined,
      address: activeEntity.address || undefined,
      sameAs: activeEntityLinks.filter((link) => link.linkStatus === 'Live').map((link) => link.liveUrl),
    }
    const entitySchema: SeoEntitySchema = {
      id: activeEntitySchema?.id ?? uid('schema'),
      projectId: activeProject.id,
      entityId: activeEntity.id,
      schemaType,
      jsonLd: JSON.stringify(schema, null, 2),
      updatedAt: appNowIso(),
    }
    saveData({
      ...data,
      seoEntitySchemas: activeEntitySchema
        ? (data.seoEntitySchemas ?? []).map((item) => (item.id === activeEntitySchema.id ? entitySchema : item))
        : [entitySchema, ...(data.seoEntitySchemas ?? [])],
    }, 'Tạo Schema Entity', activeEntity.name)
  }

  const exportEntityCsv = (reportType: 'internal' | 'client' | 'score') => {
    if (!activeEntity) return
    const rows =
      reportType === 'score'
        ? [
            ['Entity', 'Score', 'Xếp loại', 'Link live', 'Link index', 'NAP đúng'],
            [activeEntity.name, entityScore, entityScoreRank(entityScore), liveEntityLinks.length, indexedEntityLinks.length, napOkLinks.length],
          ]
        : [
            reportType === 'internal'
              ? ['Entity', 'Nền tảng', 'URL live', 'URL đích', 'Người phụ trách', 'Trạng thái', 'Index', 'NAP', 'Ghi chú']
              : ['Entity', 'Nền tảng', 'URL public', 'Trạng thái live', 'Index', 'Ngày triển khai'],
            ...activeEntityLinks.map((link) =>
              reportType === 'internal'
                ? [
                    activeEntity.name,
                    entityPlatforms.find((platform) => platform.id === link.platformId)?.name ?? '',
                    link.liveUrl,
                    link.targetUrl,
                    ownerName(link.assigneeId),
                    link.linkStatus,
                    link.indexStatus,
                    link.napStatus,
                    link.notes,
                  ]
                : [
                    activeEntity.name,
                    entityPlatforms.find((platform) => platform.id === link.platformId)?.name ?? '',
                    link.liveUrl,
                    link.linkStatus,
                    link.indexStatus,
                    formatDateOnly(link.deployedDate),
                  ],
            ),
          ]
    const csv = rows.map((row) => row.map((cell) => escapeCsv(cell)).join(',')).join('\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `entity-${reportType}-${activeEntity.name.replace(/\s+/g, '-').toLowerCase()}.csv`
    link.click()
    URL.revokeObjectURL(url)
    saveData(data, 'Xuất báo cáo Entity', activeEntity.name)
  }

  const addBacklinkSource = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const source: SeoBacklinkSource = {
      id: uid('bs'),
      name: String(form.get('name')).trim(),
      domain: String(form.get('domain')).trim(),
      contactUrl: String(form.get('contactUrl')).trim(),
      sourceType: String(form.get('sourceType')) as BacklinkSourceType,
      topic: String(form.get('topic')).trim(),
      country: String(form.get('country')).trim(),
      language: String(form.get('language')).trim(),
      da: Number(form.get('da')) || 0,
      dr: Number(form.get('dr')) || 0,
      ur: Number(form.get('ur')) || 0,
      estimatedTraffic: Number(form.get('estimatedTraffic')) || 0,
      spamScore: Number(form.get('spamScore')) || 0,
      defaultLinkType: String(form.get('defaultLinkType')) as BacklinkLinkType,
      price: Number(form.get('price')) || 0,
      currency: String(form.get('currency')) || 'VND',
      linkDuration: String(form.get('linkDuration')).trim(),
      allowEdit: form.get('allowEdit') === 'on',
      allowAnchorChange: form.get('allowAnchorChange') === 'on',
      status: String(form.get('status')) as BacklinkSourceStatus,
      note: String(form.get('note')).trim(),
    }
    saveData({ ...data, seoBacklinkSources: [source, ...(data.seoBacklinkSources ?? [])] }, 'Thêm nguồn Backlink', source.name)
    event.currentTarget.reset()
  }

  const addBacklink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeProject) return
    const form = new FormData(event.currentTarget)
    const sourceUrl = String(form.get('sourceUrl')).trim()
    const sourceId = String(form.get('sourceId'))
    const source = backlinkSources.find((item) => item.id === sourceId)
    const backlink: SeoBacklink = {
      id: uid('bl'),
      projectId: activeProject.id,
      sourceId,
      sourceUrl,
      sourceDomain: String(form.get('sourceDomain')).trim() || source?.domain || backlinkDomain(sourceUrl),
      targetUrl: String(form.get('targetUrl')).trim(),
      anchorText: String(form.get('anchorText')).trim(),
      anchorType: String(form.get('anchorType')) as BacklinkAnchorType,
      linkType: String(form.get('linkType')) as BacklinkLinkType,
      backlinkType: String(form.get('backlinkType')) as BacklinkType,
      linkPosition: String(form.get('linkPosition')) as BacklinkPosition,
      assigneeId: String(form.get('assigneeId')),
      placedAt: String(form.get('placedAt')),
      expiredAt: String(form.get('expiredAt')),
      cost: Number(form.get('cost')) || 0,
      currency: String(form.get('currency')) || 'VND',
      deploymentStatus: String(form.get('deploymentStatus')) as BacklinkDeploymentStatus,
      approvalStatus: String(form.get('approvalStatus')) as BacklinkApprovalStatus,
      linkStatus: 'Chưa check',
      indexStatus: 'Chưa check',
      paymentStatus: String(form.get('paymentStatus')) as BacklinkPaymentStatus,
      backlinkScore: 0,
      lastCheckedAt: '',
      note: String(form.get('note')).trim(),
    }
    const scoredBacklink = { ...backlink, backlinkScore: calculateBacklinkScore(backlink, source) }
    saveData({ ...data, seoBacklinks: [scoredBacklink, ...(data.seoBacklinks ?? [])] }, 'Thêm Backlink', scoredBacklink.sourceUrl)
    event.currentTarget.reset()
  }

  const updateBacklink = (backlinkId: string, updates: Partial<SeoBacklink>) => {
    const backlink = (data.seoBacklinks ?? []).find((item) => item.id === backlinkId)
    saveData({
      ...data,
      seoBacklinks: (data.seoBacklinks ?? []).map((item) => {
        if (item.id !== backlinkId) return item
        const next = { ...item, ...updates }
        return { ...next, backlinkScore: calculateBacklinkScore(next, backlinkSources.find((source) => source.id === next.sourceId)) }
      }),
    }, 'Cập nhật Backlink', backlink?.sourceUrl || backlinkId)
  }

  const checkBacklink = (backlinkId: string) => {
    const backlink = (data.seoBacklinks ?? []).find((item) => item.id === backlinkId)
    if (!backlink) return
    const sourceOk = /^https?:\/\//i.test(backlink.sourceUrl)
    const domainOk = backlinkDomain(backlink.sourceUrl) === backlink.sourceDomain || !backlink.sourceDomain
    const linkStatus: BacklinkLinkStatus = !sourceOk ? '404' : domainOk ? 'Live' : 'Redirect'
    updateBacklink(backlinkId, {
      linkStatus,
      indexStatus: sourceOk ? 'Đã index' : 'Không thể check',
      approvalStatus: linkStatus === 'Live' ? 'Đã duyệt' : 'Cần sửa',
      deploymentStatus: linkStatus === 'Live' ? 'Đã đăng' : 'Lỗi',
      lastCheckedAt: appNowIso(),
    })
  }

  const addBacklinkPlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeProject) return
    const form = new FormData(event.currentTarget)
    const taskId = uid('t')
    const assignedAt = appNowIso()
    const plannedDate = String(form.get('plannedDate'))
    const deadlineAt = plannedDate ? `${plannedDate}T20:00` : defaultTaskDeadlineInput(new Date(assignedAt))
    const plan: SeoBacklinkPlan = {
      id: uid('bp'),
      projectId: activeProject.id,
      targetUrl: String(form.get('targetUrl')).trim(),
      targetKeyword: String(form.get('targetKeyword')).trim(),
      backlinkType: String(form.get('backlinkType')) as BacklinkType,
      plannedAnchor: String(form.get('plannedAnchor')).trim(),
      plannedQuantity: Number(form.get('plannedQuantity')) || 1,
      plannedDate,
      assigneeId: String(form.get('assigneeId')),
      taskId,
      status: 'Chưa làm',
      note: String(form.get('note')).trim(),
    }
    const task: Task = {
      id: taskId,
      projectId: activeProject.id,
      title: `Đi backlink: ${plan.targetKeyword}`,
      assigneeId: plan.assigneeId,
      dueDate: taskDueDateFromDeadline(deadlineAt),
      deadlineAt,
      assignedAt,
      estimatedHours: 0,
      taskSalary: taskSalarySettings.Backlink,
      salaryModule: 'Backlink',
      status: 'Chờ nhận',
    }
    saveData(
      notifyTaskAssignee({ ...data, seoBacklinkPlans: [plan, ...(data.seoBacklinkPlans ?? [])], tasks: [task, ...data.tasks] }, task, 'Task Backlink mới'),
      'Thêm kế hoạch Backlink',
      plan.targetKeyword,
    )
    event.currentTarget.reset()
  }

  const updateBacklinkPlan = (planId: string, status: BacklinkPlanStatus) => {
    const plan = (data.seoBacklinkPlans ?? []).find((item) => item.id === planId)
    saveData({
      ...data,
      seoBacklinkPlans: (data.seoBacklinkPlans ?? []).map((item) => (item.id === planId ? { ...item, status } : item)),
    }, 'Cập nhật kế hoạch Backlink', plan?.targetKeyword || planId)
  }

  const addBacklinkCost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeProject) return
    const form = new FormData(event.currentTarget)
    const cost: SeoBacklinkCost = {
      id: uid('bc'),
      projectId: activeProject.id,
      backlinkId: String(form.get('backlinkId')),
      sourceId: String(form.get('sourceId')),
      costType: String(form.get('costType')) as BacklinkCostType,
      amount: Number(form.get('amount')) || 0,
      currency: String(form.get('currency')) || 'VND',
      paidBy: String(form.get('paidBy')),
      paidAt: String(form.get('paidAt')),
      paymentStatus: String(form.get('paymentStatus')) as BacklinkPaymentStatus,
      invoiceUrl: String(form.get('invoiceUrl')).trim(),
      note: String(form.get('note')).trim(),
    }
    saveData({ ...data, seoBacklinkCosts: [cost, ...(data.seoBacklinkCosts ?? [])] }, 'Thêm chi phí Backlink', cost.costType)
    event.currentTarget.reset()
  }

  const exportBacklinkCsv = (reportType: 'internal' | 'client') => {
    if (!activeProject) return
    const rows = [
      reportType === 'internal'
        ? ['Dự án', 'URL nguồn', 'Domain', 'URL đích', 'Anchor', 'Loại link', 'Trạng thái', 'Index', 'Chi phí', 'Người phụ trách', 'Ghi chú']
        : ['Dự án', 'URL nguồn', 'URL đích', 'Anchor', 'Trạng thái', 'Index'],
      ...projectBacklinks.map((backlink) =>
        reportType === 'internal'
          ? [
              activeProject.name,
              backlink.sourceUrl,
              backlink.sourceDomain,
              backlink.targetUrl,
              backlink.anchorText,
              backlink.linkType,
              backlink.linkStatus,
              backlink.indexStatus,
              backlink.cost,
              ownerName(backlink.assigneeId),
              backlink.note,
            ]
          : [activeProject.name, backlink.sourceUrl, backlink.targetUrl, backlink.anchorText, backlink.linkStatus, backlink.indexStatus],
      ),
    ]
    const csv = rows.map((row) => row.map((cell) => escapeCsv(cell)).join(',')).join('\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `backlink-${reportType}-${activeProject.name.replace(/\s+/g, '-').toLowerCase()}.csv`
    link.click()
    URL.revokeObjectURL(url)
    saveData(data, 'Xuất báo cáo Backlink', activeProject.name)
  }

  const saveInternalNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const now = appNowIso()
    const formValue = (name: string, fallback = '') => {
      const value = form.get(name)
      return value === null ? fallback : String(value).trim()
    }
    const noteProjectId = formValue('projectId', editingInternalNote?.projectId || activeProject?.id || '')
    const project = data.projects.find((item) => item.id === noteProjectId)
    const noteId = editingInternalNote?.id ?? uid('in')
    const noteType = formValue(
      'noteType',
      editingInternalNote?.noteType ?? (knowledgeTab === 'guides' ? 'Hướng dẫn thao tác' : 'Chỉnh sửa giao diện'),
    ) as InternalNoteType
    const tags = formValue('tags', editingInternalNote?.tags.join(', ') ?? (noteType === 'Hướng dẫn thao tác' ? 'hướng-dẫn' : ''))
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    const nextNote: InternalNote = {
      id: noteId,
      guideCode: editingInternalNote?.guideCode ?? (noteType === 'Hướng dẫn thao tác' ? internalGuideCodeFromId(noteId) : ''),
      projectId: noteProjectId,
      website: formValue('website', editingInternalNote?.website ?? project?.website ?? '') || project?.website || '',
      title: formValue('title', editingInternalNote?.title ?? ''),
      noteType,
      category: formValue('category', editingInternalNote?.category ?? (noteType === 'Hướng dẫn thao tác' ? 'Admin' : 'SEO')),
      relatedUrl: formValue('relatedUrl', editingInternalNote?.relatedUrl ?? ''),
      affectedArea: formValue('affectedArea', editingInternalNote?.affectedArea ?? ''),
      problemDescription: formValue('problemDescription', editingInternalNote?.problemDescription ?? ''),
      content: formValue('content', editingInternalNote?.content ?? ''),
      reason: formValue('reason', editingInternalNote?.reason ?? ''),
      priority: formValue('priority', editingInternalNote?.priority ?? 'Trung bình') as InternalNotePriority,
      status: formValue('status', editingInternalNote?.status ?? 'Nháp') as InternalNoteStatus,
      visibility: noteType === 'Hướng dẫn thao tác'
        ? 'Nội bộ'
        : formValue('visibility', editingInternalNote?.visibility ?? 'Nội bộ') as InternalNoteVisibility,
      requestedBy: formValue('requestedBy', editingInternalNote?.requestedBy ?? ''),
      assignedTo: formValue('assignedTo', editingInternalNote?.assignedTo ?? currentUser?.id ?? ''),
      createdBy: editingInternalNote?.createdBy ?? currentUser?.id ?? '',
      approvedBy: editingInternalNote?.approvedBy ?? '',
      approvedAt: editingInternalNote?.approvedAt ?? '',
      completedAt: formValue('status', editingInternalNote?.status ?? 'Nháp') === 'Hoàn thành' ? editingInternalNote?.completedAt || now : editingInternalNote?.completedAt ?? '',
      createdAt: editingInternalNote?.createdAt ?? now,
      updatedAt: now,
      tags,
      extraNote: formValue('extraNote', editingInternalNote?.extraNote ?? ''),
      version: editingInternalNote ? editingInternalNote.version + 1 : 1,
      archivedAt: formValue('status', editingInternalNote?.status ?? 'Nháp') === 'Lưu trữ' ? editingInternalNote?.archivedAt || now : '',
      deletedAt: editingInternalNote?.deletedAt ?? '',
    }
    const version: InternalNoteVersion = {
      id: uid('inv'),
      noteId: nextNote.id,
      versionNumber: nextNote.version,
      title: nextNote.title,
      content: nextNote.content,
      changedBy: currentUser?.id ?? '',
      changeNote: formValue('changeNote') || (editingInternalNote ? 'Cập nhật ghi chú' : 'Tạo ghi chú'),
      createdAt: now,
    }
    const existingTagNames = new Set((data.internalNoteTags ?? []).map((tag) => tag.name.toLowerCase()))
    const newTags: InternalNoteTag[] = tags
      .filter((tag) => !existingTagNames.has(tag.toLowerCase()))
      .map((tag) => ({
        id: uid('tag'),
        name: tag,
        color: '#64748b',
        createdAt: now,
        updatedAt: now,
      }))
    saveData({
      ...data,
      internalNotes: editingInternalNote
        ? internalNotes.map((note) => (note.id === nextNote.id ? nextNote : note))
        : [nextNote, ...internalNotes],
      internalNoteTags: [...newTags, ...(data.internalNoteTags ?? [])],
      internalNoteVersions: [version, ...(data.internalNoteVersions ?? [])].slice(0, 800),
    }, editingInternalNote ? 'Cập nhật ghi chú nội bộ' : 'Tạo ghi chú nội bộ', nextNote.title)
    setEditingInternalNoteId(null)
    event.currentTarget.reset()
  }

  const uploadHtmlGuideNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isAdmin) return
    const form = new FormData(event.currentTarget)
    const pickedFile = form.get('htmlFile') as File | null
    if (!pickedFile || pickedFile.size === 0) {
      window.alert('Vui lòng chọn file HTML hướng dẫn.')
      return
    }
    if (!isHtmlFile(pickedFile)) {
      window.alert('Chỉ cho phép upload file .html/.htm để làm tài liệu hướng dẫn.')
      return
    }
    if (pickedFile.size > htmlGuideMaxBytes) {
      window.alert(`File HTML tối đa ${Math.round(htmlGuideMaxBytes / 1024 / 1024)}MB để tránh làm nặng database.`)
      return
    }

    try {
      const now = appNowIso()
      const noteProjectId = String(form.get('projectId')) || activeProject?.id || ''
      const project = data.projects.find((item) => item.id === noteProjectId)
      const title = String(form.get('title')).trim() || pickedFile.name.replace(/\.[^.]+$/, '')
      const tags = String(form.get('tags') || 'hướng-dẫn, html')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
      const noteId = uid('in')
      const note: InternalNote = {
        id: noteId,
        guideCode: internalGuideCodeFromId(noteId),
        projectId: noteProjectId,
        website: project?.website || '',
        title,
        noteType: 'Hướng dẫn thao tác',
        category: 'Admin',
        relatedUrl: '',
        affectedArea: 'Tài liệu nội bộ',
        problemDescription: `File HTML hướng dẫn: ${pickedFile.name}`,
        content: `Tài liệu hướng dẫn HTML được upload bởi admin. Nhấp vào ghi chú hoặc file đính kèm để mở.`,
        reason: String(form.get('reason')).trim(),
        priority: 'Trung bình',
        status: 'Đã duyệt',
        visibility: 'Nội bộ',
        requestedBy: '',
        assignedTo: currentUser?.id ?? '',
        createdBy: currentUser?.id ?? '',
        approvedBy: currentUser?.id ?? '',
        approvedAt: now,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
        tags,
        extraNote: '',
        version: 1,
      }
      const file: InternalNoteFile = {
        id: uid('inf'),
        noteId,
        fileName: pickedFile.name,
        fileUrl: await readHtmlFileAsDataUrl(pickedFile),
        fileType: htmlGuideFileType,
        fileSize: pickedFile.size,
        uploadedBy: currentUser?.id ?? '',
        createdAt: now,
      }
      const version: InternalNoteVersion = {
        id: uid('inv'),
        noteId,
        versionNumber: 1,
        title,
        content: note.content,
        changedBy: currentUser?.id ?? '',
        changeNote: `Upload file HTML hướng dẫn: ${pickedFile.name}`,
        createdAt: now,
      }
      const existingTagNames = new Set((data.internalNoteTags ?? []).map((tag) => tag.name.toLowerCase()))
      const newTags: InternalNoteTag[] = tags
        .filter((tag) => !existingTagNames.has(tag.toLowerCase()))
        .map((tag) => ({
          id: uid('tag'),
          name: tag,
          color: '#64748b',
          createdAt: now,
          updatedAt: now,
        }))
      saveData({
        ...data,
        internalNotes: [note, ...internalNotes],
        internalNoteFiles: [file, ...internalNoteFiles],
        internalNoteVersions: [version, ...internalNoteVersions].slice(0, 800),
        internalNoteTags: [...newTags, ...(data.internalNoteTags ?? [])],
      }, 'Upload nhanh hướng dẫn HTML', title)
      setKnowledgeTab('guides')
      event.currentTarget.reset()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Không upload được file HTML hướng dẫn.')
    }
  }

  const uploadEntityGuideHtml = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isAdmin) return
    const form = new FormData(event.currentTarget)
    const pickedFiles = form
      .getAll('entityGuideHtmlFiles')
      .filter((file): file is File => file instanceof File && file.size > 0)
    if (pickedFiles.length === 0) {
      setEntityGuideUploadStatus('Vui lòng chọn ít nhất một file HTML hướng dẫn Entity.')
      return
    }
    const invalidFile = pickedFiles.find((file) => !isHtmlFile(file))
    if (invalidFile) {
      setEntityGuideUploadStatus(`Chỉ cho phép upload file .html/.htm. File lỗi: ${invalidFile.name}`)
      return
    }
    const oversizedFile = pickedFiles.find((file) => file.size > htmlGuideMaxBytes)
    if (oversizedFile) {
      setEntityGuideUploadStatus(`File ${oversizedFile.name} vượt quá ${Math.round(htmlGuideMaxBytes / 1024 / 1024)}MB.`)
      return
    }
    setEntityGuideUploadStatus(`Đang upload ${pickedFiles.length} file hướng dẫn Entity...`)
    try {
      const files = await Promise.all(pickedFiles.map(async (file) => ({
        fileName: file.name,
        contentBase64: await readFileAsBase64(file),
      })))
      const response = await fetch(appUrl('api/entity-guides/upload'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      })
      const payload = await readApiJson(response)
      if (!response.ok || !payload.ok) throw new Error(payload.message || `HTTP ${response.status}`)
      const uploadedFiles = Array.isArray(payload.files) ? payload.files as EntityGuideScanRecord[] : []
      saveData({
        ...data,
        entityGuideScanHistory: mergeEntityGuideScanHistory(data.entityGuideScanHistory ?? [], uploadedFiles),
      }, 'Upload hướng dẫn Entity HTML', `${uploadedFiles.length} file`)
      setEntityGuideUploadStatus(`Đã upload ${uploadedFiles.length} file: ${uploadedFiles.map((file) => file.fileName).join(', ')}`)
      event.currentTarget.reset()
    } catch (error) {
      setEntityGuideUploadStatus(`Không upload được hướng dẫn Entity. ${error instanceof Error ? error.message : ''}`.trim())
    }
  }

  const scanEntityGuideFiles = async () => {
    const scanMap = new Map((data.entityGuideScanHistory ?? []).map((record) => [entityGuideFileKey(record.fileName), record]))
    const fileNames = Array.from(
      new Set(
        entityPlatforms
          .map((platform) => entityGuideFileNameOf(platform.guideFileName))
          .filter(Boolean)
          .filter((fileName) => !scanMap.get(entityGuideFileKey(fileName))?.exists),
      ),
    )
    if (fileNames.length === 0) {
      setEntityImportStatus('Không có file hướng dẫn Entity cần quét. Các file đã xanh sẽ được bỏ qua.')
      return
    }
    setEntityImportStatus(`Đang quét ${fileNames.length} file hướng dẫn Entity chưa xanh...`)
    try {
      const response = await fetch(appUrl('api/entity-guides/scan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileNames }),
      })
      const payload = await readApiJson(response)
      if (!response.ok || !payload.ok) throw new Error(payload.message || `HTTP ${response.status}`)
      const scannedFiles = Array.isArray(payload.files) ? payload.files as EntityGuideScanRecord[] : []
      const foundCount = scannedFiles.filter((file) => file.exists).length
      saveData({
        ...data,
        entityGuideScanHistory: mergeEntityGuideScanHistory(data.entityGuideScanHistory ?? [], scannedFiles),
      }, 'Quét file hướng dẫn Entity', `${foundCount}/${scannedFiles.length} file có sẵn`)
      setEntityImportStatus(`Đã quét ${scannedFiles.length} file chưa xanh. Tìm thấy ${foundCount} file trong thư mục hướng dẫn Entity.`)
    } catch (error) {
      setEntityImportStatus(`Không quét được file hướng dẫn Entity. ${error instanceof Error ? error.message : ''}`.trim())
    }
  }

  const archiveInternalNote = (noteId: string) => {
    const note = internalNotes.find((item) => item.id === noteId)
    if (!note) return
    saveData({
      ...data,
      internalNotes: internalNotes.map((item) => (item.id === noteId ? { ...item, status: 'Lưu trữ', archivedAt: appNowIso(), updatedAt: appNowIso() } : item)),
    }, 'Lưu trữ ghi chú nội bộ', note.title)
  }

  const deleteInternalNote = (noteId: string) => {
    const note = internalNotes.find((item) => item.id === noteId)
    if (!note || !window.confirm(`Xóa ghi chú "${note.title}" và chuyển vào Thùng rác / lưu trữ?`)) return
    saveData({
      ...data,
      internalNotes: internalNotes.map((item) => (item.id === noteId ? { ...item, deletedAt: appNowIso(), updatedAt: appNowIso() } : item)),
    }, 'Xóa mềm ghi chú nội bộ', note.title)
    setEditingInternalNoteId(null)
  }

  const restoreInternalNote = (noteId: string) => {
    const note = internalNotes.find((item) => item.id === noteId)
    if (!note) return
    saveData({
      ...data,
      internalNotes: internalNotes.map((item) =>
        item.id === noteId ? { ...item, status: item.status === 'Lưu trữ' ? 'Nháp' : item.status, archivedAt: '', deletedAt: '', updatedAt: appNowIso() } : item,
      ),
    }, 'Khôi phục ghi chú nội bộ', note.title)
  }

  const permanentlyDeleteInternalNote = (noteId: string) => {
    const note = internalNotes.find((item) => item.id === noteId)
    if (!note || !window.confirm(`Xóa vĩnh viễn ghi chú "${note.title}"?`)) return
    saveData({
      ...data,
      internalNotes: internalNotes.filter((item) => item.id !== noteId),
      internalNoteFiles: internalNoteFiles.filter((file) => file.noteId !== noteId),
      internalNoteVersions: internalNoteVersions.filter((version) => version.noteId !== noteId),
      internalNoteComments: internalNoteComments.filter((comment) => comment.noteId !== noteId),
    }, 'Xóa vĩnh viễn ghi chú nội bộ', note.title)
  }

  const approveInternalNote = (noteId: string) => {
    const note = internalNotes.find((item) => item.id === noteId)
    if (!note) return
    saveData({
      ...data,
      internalNotes: internalNotes.map((item) =>
        item.id === noteId ? { ...item, status: 'Đã duyệt', approvedBy: currentUser?.id ?? '', approvedAt: appNowIso(), updatedAt: appNowIso() } : item,
      ),
    }, 'Duyệt ghi chú nội bộ', note.title)
  }

  const addInternalNoteFile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const noteId = String(form.get('noteId'))
    const note = internalNotes.find((item) => item.id === noteId)
    if (!note) return
    const pickedFile = form.get('file') as File | null
    const externalUrl = String(form.get('fileUrl')).trim()
    const fileName = pickedFile?.name || String(form.get('fileName')).trim() || externalUrl || 'Tài liệu đính kèm'
    const file: InternalNoteFile = {
      id: uid('inf'),
      noteId,
      fileName,
      fileUrl: externalUrl || (pickedFile ? `local://${pickedFile.name}` : ''),
      fileType: String(form.get('fileType')).trim() || pickedFile?.type || 'Tài liệu',
      fileSize: pickedFile?.size || 0,
      uploadedBy: currentUser?.id ?? '',
      createdAt: appNowIso(),
    }
    saveData({ ...data, internalNoteFiles: [file, ...internalNoteFiles] }, 'Thêm file ghi chú nội bộ', note.title)
    event.currentTarget.reset()
  }

  const addInternalNoteComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const noteId = String(form.get('noteId'))
    const content = String(form.get('content')).trim()
    const note = internalNotes.find((item) => item.id === noteId)
    if (!note || !content) return
    const comment: InternalNoteComment = {
      id: uid('inc'),
      noteId,
      content,
      createdBy: currentUser?.id ?? '',
      createdAt: appNowIso(),
      updatedAt: appNowIso(),
    }
    saveData({ ...data, internalNoteComments: [comment, ...internalNoteComments] }, 'Bình luận ghi chú nội bộ', note.title)
    event.currentTarget.reset()
  }

  const saveArticleToolConfig = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canEdit('tool-article-writer')) {
      setArticleToolConfigStatus('Tài khoản chưa có quyền lưu cấu hình Công cụ.')
      return
    }
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setArticleToolConfigLoading(true)
    setArticleToolConfigStatus('Đang lưu cấu hình Viết bài...')
    try {
      const vertexCredentialsFile = form.get('vertexCredentialsFile')
      let vertexServiceAccountJson = String(form.get('vertexServiceAccountJson') || '').trim()
      if (vertexCredentialsFile instanceof File && vertexCredentialsFile.size > 0) {
        vertexServiceAccountJson = await vertexCredentialsFile.text()
      }
      const response = await fetch(appUrl('api/tools/article-compose/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageProvider: String(form.get('imageProvider') || 'google-ai').trim(),
          claudeGatewayBaseUrl: String(form.get('claudeGatewayBaseUrl') || '').trim(),
          claudeGatewayAuthHeader: String(form.get('claudeGatewayAuthHeader') || '').trim(),
          claudeModel: String(form.get('claudeModel') || '').trim(),
          claudeApiKey: String(form.get('claudeApiKey') || '').trim(),
          geminiApiBaseUrl: String(form.get('geminiApiBaseUrl') || '').trim(),
          geminiImageModel: String(form.get('geminiImageModel') || '').trim(),
          geminiApiKey: String(form.get('geminiApiKey') || '').trim(),
          vertexProjectId: String(form.get('vertexProjectId') || '').trim(),
          vertexRegion: String(form.get('vertexRegion') || '').trim(),
          vertexImageModel: String(form.get('vertexImageModel') || '').trim(),
          vertexCredentialsPath: String(form.get('vertexCredentialsPath') || '').trim(),
          vertexServiceAccountJson,
          clearClaudeApiKey: form.get('clearClaudeApiKey') === 'on',
          clearGeminiApiKey: form.get('clearGeminiApiKey') === 'on',
          clearVertexCredentials: form.get('clearVertexCredentials') === 'on',
        }),
      })
      const payload = await response.json().catch(() => ({ ok: false, message: 'Backend trả về phản hồi cấu hình không hợp lệ.' }))
      if (!response.ok || !payload.ok) throw new Error(payload.message || `HTTP ${response.status}`)
      setArticleToolConfig(payload.config)
      setArticleToolConfigStatus('Đã lưu cấu hình Viết bài trên server.')
      formElement.reset()
    } catch (error) {
      setArticleToolConfigStatus(`Không lưu được cấu hình. ${error instanceof Error ? error.message : ''}`.trim())
    } finally {
      setArticleToolConfigLoading(false)
    }
  }

  const testArticleToolConnection = async (provider: ArticleToolTestProvider) => {
    if (!canEdit('tool-article-writer')) {
      setArticleToolConfigStatus('Tài khoản chưa có quyền kiểm tra kết nối Công cụ.')
      return
    }
    const label = provider === 'claude' ? 'Claude' : provider === 'vertex' ? 'Vertex AI' : 'Imagen'
    setArticleToolTestingProvider(provider)
    setArticleToolConfigStatus(`Đang kiểm tra kết nối ${label}...`)
    try {
      const response = await fetch(`${appUrl('api/tools/article-compose/test')}?provider=${provider}`, { method: 'POST' })
      const payload = await response.json().catch(() => ({ ok: false, message: 'Backend trả về phản hồi kiểm tra không hợp lệ.' }))
      if (payload.config) setArticleToolConfig(payload.config)
      if (!response.ok) throw new Error(payload.message || `HTTP ${response.status}`)
      setArticleToolConfigStatus(payload.ok ? `Kiểm tra ${label} thành công.` : `Kiểm tra ${label} có lỗi, xem log bên dưới.`)
    } catch (error) {
      setArticleToolConfigStatus(`Không kiểm tra được ${label}. ${error instanceof Error ? error.message : ''}`.trim())
      await loadArticleToolConfig()
    } finally {
      setArticleToolTestingProvider('')
    }
  }

  const composeSeoArticle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canEdit('tool-article-writer')) {
      setArticleToolStatus('Tài khoản chưa có quyền sử dụng công cụ Viết bài.')
      return
    }
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const keyword = String(form.get('keyword') || '').trim()
    if (!keyword) {
      setArticleToolStatus('Vui lòng nhập từ khóa hoặc chủ đề cần soạn bài.')
      return
    }
    const imageProviderOverride: ArticleImageProvider = form.get('useVertexImageProvider') === 'on' ? 'vertex-ai' : 'google-ai'
    const imageProviderLabel = imageProviderOverride === 'vertex-ai' ? 'Vertex AI' : 'Imagen'
    setArticleToolLoading(true)
    setArticleToolStatus(`Đang gọi Claude để viết bài và ${imageProviderLabel} để tạo ảnh. Quá trình này có thể mất vài phút.`)
    setArticleToolResult(null)
    try {
      const response = await fetch(appUrl('api/tools/article-compose'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          targetAudience: String(form.get('targetAudience') || '').trim(),
          tone: String(form.get('tone') || '').trim(),
          wordCount: Number(form.get('wordCount') || 1800),
          presentationStyle: String(form.get('presentationStyle') || 'professional'),
          imageProviderOverride,
        }),
      })
      const payload = await response.json().catch(() => ({ ok: false, message: 'Backend trả về phản hồi không hợp lệ.' }))
      if (!response.ok || !payload.ok) throw new Error(payload.message || `HTTP ${response.status}`)
      setArticleToolResult(payload.result)
      setArticleToolEditorHtml(payload.result.html || '')
      setArticleToolStatus(`Đã tạo bài "${payload.result.topic}". File HTML và ảnh đã được lưu trên server.`)
      await loadArticleToolHistory()
      saveData(reloadData(), 'Viết bài SEO', payload.result.topic)
      formElement.reset()
    } catch (error) {
      setArticleToolStatus(`Không tạo được bài viết. ${error instanceof Error ? error.message : ''}`.trim())
    } finally {
      setArticleToolLoading(false)
    }
  }

  const regenerateArticleImage = async (error: ArticleToolImageError, imageProviderOverride?: ArticleImageProvider) => {
    if (!canEdit('tool-article-writer')) {
      setArticleToolStatus('Tài khoản chưa có quyền gen lại ảnh.')
      return
    }
    if (!articleToolResult?.runId) {
      setArticleToolStatus('Không tìm thấy mã bài viết để gen lại ảnh.')
      return
    }
    const index = Number(error.index ?? 0)
    setArticleToolRegeneratingIndex(index)
    setArticleToolStatus(`Đang gen lại ảnh ${index + 1}${imageProviderOverride === 'vertex-ai' ? ' bằng Vertex AI' : ''}...`)
    try {
      const response = await fetch(appUrl('api/tools/article-compose/regenerate-image'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: articleToolResult.runId,
          index,
          prompt: error.prompt,
          imageProviderOverride: imageProviderOverride || articleToolResult.imageProvider || '',
        }),
      })
      const payload = await response.json().catch(() => ({ ok: false, message: 'Backend trả về phản hồi gen lại ảnh không hợp lệ.' }))
      if (!response.ok || !payload.ok) throw new Error(payload.message || `HTTP ${response.status}`)
      const regeneratedImage = payload.result.image as ArticleToolImage
      setArticleToolResult((current) => {
        if (!current) return current
        return {
          ...current,
          html: payload.result.html,
          previewHtml: payload.result.previewHtml,
          htmlPath: payload.result.htmlPath,
          htmlUrl: payload.result.htmlUrl,
          sourcePath: payload.result.sourcePath,
          sourceUrl: payload.result.sourceUrl,
          images: [...current.images.filter((image) => Number(image.index ?? -1) !== index), regeneratedImage].sort((a, b) => Number(a.index ?? 0) - Number(b.index ?? 0)),
          imageErrors: current.imageErrors.filter((item) => Number(item.index ?? -1) !== index),
        }
      })
      setArticleToolEditorHtml(payload.result.html || '')
      await loadArticleToolHistory()
      if (payload.config) setArticleToolConfig(payload.config)
      setArticleToolStatus(`Đã gen lại ảnh ${index + 1} và cập nhật file HTML.`)
    } catch (err) {
      setArticleToolStatus(`Không gen lại được ảnh ${index + 1}. ${err instanceof Error ? err.message : ''}`.trim())
    } finally {
      setArticleToolRegeneratingIndex(null)
    }
  }

  const openArticleHistoryItem = async (runId: string, edit = false) => {
    setArticleToolHistoryStatus(edit ? 'Đang mở bài để chỉnh sửa...' : 'Đang mở bài đã tạo...')
    try {
      const response = await fetch(`${appUrl('api/tools/article-compose/history-item')}?runId=${encodeURIComponent(runId)}`)
      const payload = await response.json().catch(() => ({ ok: false, message: 'Backend trả về phản hồi bài viết không hợp lệ.' }))
      if (!response.ok || !payload.ok) throw new Error(payload.message || `HTTP ${response.status}`)
      setArticleToolResult(payload.result)
      setArticleToolEditorHtml(payload.result.html || '')
      if (Array.isArray(payload.history)) setArticleToolHistory(payload.history)
      setArticleToolHistoryStatus(edit ? 'Đã mở bài. Bạn có thể chỉnh sửa HTML bên dưới preview.' : 'Đã mở lại bài đã tạo.')
    } catch (error) {
      setArticleToolHistoryStatus(`Không mở được bài viết. ${error instanceof Error ? error.message : ''}`.trim())
    }
  }

  const saveArticleToolHtml = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!articleToolResult?.runId) {
      setArticleToolHistoryStatus('Chưa chọn bài viết để lưu chỉnh sửa.')
      return
    }
    setArticleToolSavingHtml(true)
    setArticleToolHistoryStatus('Đang lưu chỉnh sửa HTML...')
    try {
      const response = await fetch(appUrl('api/tools/article-compose/history-item'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: articleToolResult.runId,
          topic: articleToolResult.topic,
          html: articleToolEditorHtml,
        }),
      })
      const payload = await response.json().catch(() => ({ ok: false, message: 'Backend trả về phản hồi lưu HTML không hợp lệ.' }))
      if (!response.ok || !payload.ok) throw new Error(payload.message || `HTTP ${response.status}`)
      setArticleToolResult(payload.result)
      setArticleToolEditorHtml(payload.result.html || '')
      if (Array.isArray(payload.history)) setArticleToolHistory(payload.history)
      setArticleToolHistoryStatus('Đã lưu chỉnh sửa HTML và cập nhật file article.html.')
    } catch (error) {
      setArticleToolHistoryStatus(`Không lưu được chỉnh sửa HTML. ${error instanceof Error ? error.message : ''}`.trim())
    } finally {
      setArticleToolSavingHtml(false)
    }
  }

  const generateStandaloneArticleImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canEdit('tool-article-writer')) {
      setArticleToolSingleImageStatus('Tài khoản chưa có quyền tạo ảnh.')
      return
    }
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const prompt = String(form.get('prompt') || '').trim()
    if (!prompt) {
      setArticleToolSingleImageStatus('Vui lòng nhập mô tả ảnh.')
      return
    }
    const imageProviderOverride: ArticleImageProvider = form.get('useVertexImageProvider') === 'on' ? 'vertex-ai' : 'google-ai'
    setArticleToolSingleImageLoading(true)
    setArticleToolSingleImageStatus(`Đang tạo ảnh bằng ${imageProviderOverride === 'vertex-ai' ? 'Vertex AI' : 'Imagen'}...`)
    try {
      const response = await fetch(appUrl('api/tools/article-compose/generate-image'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageProviderOverride }),
      })
      const payload = await response.json().catch(() => ({ ok: false, message: 'Backend trả về phản hồi tạo ảnh không hợp lệ.' }))
      if (!response.ok || !payload.ok) throw new Error(payload.message || `HTTP ${response.status}`)
      setArticleToolSingleImage(payload.result)
      if (payload.config) setArticleToolConfig(payload.config)
      setArticleToolSingleImageStatus('Đã tạo ảnh đơn theo mô tả.')
      formElement.reset()
    } catch (error) {
      setArticleToolSingleImageStatus(`Không tạo được ảnh đơn. ${error instanceof Error ? error.message : ''}`.trim())
    } finally {
      setArticleToolSingleImageLoading(false)
    }
  }

  if (loadingRemoteData) return <LoadingPage />

  if (!currentUser) {
    return <LoginPage error={loginError} users={data.users} onRefresh={reloadData} onSubmit={login} />
  }

  const appShellStyle = {
    '--app-zoom': appZoom.toFixed(2),
    '--app-zoom-inverse': (1 / appZoom).toFixed(4),
  } as CSSProperties
  const changeAppZoom = (nextZoom: number) => setAppZoom(clampAppZoom(nextZoom))

  return (
    <div className="app-shell" style={appShellStyle}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>SEO Ops</strong>
            <span>Quản lý dự án SEO</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Điều hướng chính">
          <NavButton view="overview" current={view} label="Tổng quan" onClick={goTo} />
          {(hasProjectViewPermission || canViewAssignedView('keywords') || canViewAssignedView('articles') || canViewAssignedView('tasks')) && (
            <>
              {canView('projects') && <NavButton view="projects" current={view} label="Dự án SEO" onClick={goTo} />}
              <div className="nav-children" aria-label="Module con của Dự án SEO">
                {canView('keywords') && <NavButton view="keywords" current={view} label="Quản lý Keyword" onClick={goTo} child />}
                {canView('articles') && <NavButton view="articles" current={view} label="Bài viết" onClick={goTo} child />}
                {canView('entities') && <NavButton view="entities" current={view} label="SEO Entity" onClick={goTo} child />}
                {canView('backlinks') && <NavButton view="backlinks" current={view} label="Backlink" onClick={goTo} child />}
                {canView('tasks') && <NavButton view="tasks" current={view} label="Task công việc" onClick={goTo} child />}
              </div>
            </>
          )}
          {canAccessPermission(socialPermissionName, 'view') && <NavButton view="social" current={view} label="Social Planner" onClick={goTo} />}
          {canAccessPermission('Tài chính', 'view') && <NavButton view="finance" current={view} label="Tài chính" onClick={goTo} />}
          {canAccessPermission('Ghi chú', 'view') && <NavButton view="knowledge" current={view} label="Ghi chú & Tài liệu nội bộ" onClick={goTo} />}
          {canAccessPermission(toolPermissionName, 'view') && (
            <>
              <NavButton view="tools" current={view} label="Công cụ" onClick={goTo} />
              <div className="nav-children" aria-label="Module con của Công cụ">
                <NavButton view="tool-article-writer" current={view} label="Viết bài" onClick={goTo} child />
                <NavButton view="tool-article-settings" current={view} label="Cấu hình & Log" onClick={goTo} child />
              </div>
            </>
          )}
          {canAccessPermission('Nhân sự', 'view') && <NavButton view="people" current={view} label="Nhân sự" onClick={goTo} />}
          {canAccessPermission('Tiến độ', 'view') && <NavButton view="progress" current={view} label="Tiến độ" onClick={goTo} />}
          {canAccessPermission('Hệ thống', 'view') && (
            <>
              <div className="nav-section-label">Hệ thống</div>
              <div className="nav-children" aria-label="Module con của Hệ thống">
                <NavButton view="system" current={view} label="Quản lý" onClick={goTo} child />
              </div>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div>
            <strong>{currentUser.name}</strong>
            <span>{currentUser.role}</span>
          </div>
          <button type="button" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyeline">Quản lý vận hành SEO</p>
            <h1>{viewTitle(view)}</h1>
          </div>
          <div className="topbar-actions">
            <ZoomControl zoom={appZoom} onChange={changeAppZoom} />
            <NotificationBell
              notifications={currentNotifications}
              unreadCount={unreadNotifications.length}
              open={notificationsOpen}
              onToggle={() => setNotificationsOpen((current) => !current)}
              onOpen={openNotification}
              onMarkAllRead={markAllNotificationsRead}
            />
            {visibleProjects.length > 0 && (
              <label className="project-switcher">
                <span>Dự án đang xem</span>
                <select value={activeProject?.id ?? ''} onChange={(event) => selectActiveProject(event.target.value)}>
                  {visibleProjects.map((project) => (
                    <option value={project.id} key={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </header>

        {!canView(view) && (
          <Panel title="Không có quyền truy cập" action={currentUser?.role ?? 'Chưa đăng nhập'}>
            <EmptyState title="Tài khoản chưa được phân quyền" text="Vui lòng đăng nhập bằng tài khoản có quyền phù hợp hoặc liên hệ quản trị viên để cấp quyền." />
          </Panel>
        )}

        {view === 'overview' && canView(view) && (
          <section className="view-stack">
            {!isAdmin ? (
              <EmployeeOverview
                user={currentUser}
                tasks={currentUserTasks}
                projects={data.projects}
                pendingTasks={pendingUserTasks}
                activeTasks={activeUserTasks}
                reviewTasks={reviewUserTasks}
                approvedTasks={approvedUserTasks}
                taskSalary={taskSalary}
                monthlySalaryRate={monthlySalaryRate}
                monthlySalaryEstimate={monthlySalaryEstimate}
                onCheckIn={checkIn}
                onCheckOut={checkOut}
                onAcceptTask={acceptTask}
                onRejectTask={rejectTask}
                onSubmitTask={submitTaskForReview}
              />
            ) : (
              <>
                <div className="metric-grid task-overview-metrics">
                  <Metric title="Tổng dự án" value={activeProjects.length} note={`${projectProgress.filter((p) => p.status === 'Đang SEO').length} đang SEO`} icon="projects" tone="blue" />
                  <Metric title="Tổng chi phí" value={currency.format(expense)} note="Không tính doanh thu" icon="finance" tone="teal" />
                  <Metric title="Task hoàn thành" value={pct(completionRate)} note={`${completedTasks}/${activeTasks.length} công việc`} icon="completed" tone="green" />
                  <Metric title="Task quá hạn" value={overdueTasks.length} note={`${cancelledDeadlineTasks.length} đã hủy · ${dueSoonTasks.length} sắp hạn`} icon="overdue" tone="amber" />
                  <Metric title="Position TB" value={avgPosition.toFixed(1)} note={`${activeKeywords.length} keyword đang theo dõi`} icon="position" tone="violet" />
                </div>

                {(overdueTasks.length > 0 || cancelledDeadlineTasks.length > 0) && (
                  <Panel title="Cảnh báo task quá hạn" action={`${overdueTasks.length} cần xử lý · ${cancelledDeadlineTasks.length} đã hủy`} className="deadline-alert-panel">
                    <div className="deadline-alert-list">
                      {[...overdueTasks, ...cancelledDeadlineTasks].slice(0, 10).map((task) => {
                        const badge = taskDeadlineBadge(task)
                        return (
                          <article className={`deadline-alert-item ${badge?.className ?? ''}`} key={task.id}>
                            <div>
                              <strong>{task.title}</strong>
                              <span>{data.projects.find((project) => project.id === task.projectId)?.name ?? 'Dự án đã xóa'} · {ownerName(task.assigneeId)}</span>
                            </div>
                            <div>
                              {badge && <b className={`task-deadline-badge ${badge.className}`}>{badge.label}</b>}
                              <small>Hạn {formatDateTime(taskDeadline(task))}</small>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </Panel>
                )}

                <div className="dashboard-grid">
                  <Panel title="Thống kê chi phí công ty" action={currency.format(expense)}>
                    <BarChart
                      items={[
                        { label: 'Chi chung', value: activeTransactions.filter((item) => item.scope === 'Chi chung dự án').reduce((sum, item) => sum + item.amount, 0), color: '#2563eb' },
                        { label: 'Chi riêng', value: activeTransactions.filter((item) => item.scope !== 'Chi chung dự án').reduce((sum, item) => sum + item.amount, 0), color: '#dc2626' },
                        { label: 'Tổng chi', value: expense, color: '#0f766e' },
                      ]}
                    />
                  </Panel>
                  <Panel title="Tiến độ theo dự án" action={`${pct(completionRate)} chung`}>
                    <div className="progress-list">
                      {projectProgress.map((project) => (
                        <ProgressRow key={project.id} label={project.name} value={project.rate} meta={`${project.done}/${project.tasks} công việc`} />
                      ))}
                    </div>
                  </Panel>
                </div>

                <Panel title="Công việc gần đây" action="Theo tất cả dự án">
                  <TaskTable
                    tasks={activeTasks.slice(0, 6)}
                    keywords={data.keywords}
                    users={data.users}
                    projects={data.projects}
                    onStatus={updateTaskStatus}
                    onApprove={approveTask}
                    onRevision={requestTaskRevision}
                    onReassign={reassignTask}
                    onDeleteTask={deleteTask}
                    canDeleteTask={isAdmin}
                    canEdit
                  />
                </Panel>
              </>
            )}
          </section>
        )}

        {view === 'projects' && canView(view) && (
          <section className="view-stack">
            <div className="project-focus">
              <Panel title="Chọn dự án thực thi" action={`${activeProjects.length} dự án`}>
                {activeProjects.length === 0 ? (
                  <EmptyState title="Chưa có dự án SEO" text="Tạo dự án đầu tiên bằng biểu mẫu bên cạnh để bắt đầu theo dõi keyword và công việc." />
                ) : (
                  <div className="project-card-list">
                    {activeProjects.map((project) => {
                      const tasks = data.tasks.filter((task) => task.projectId === project.id)
                      const done = tasks.filter((task) => task.status === 'Hoàn thành').length
                      const keywords = data.keywords.filter((keyword) => keyword.projectId === project.id && !duplicateKeywordIds.has(keyword.id))
                      const isActive = activeProject?.id === project.id
                      return (
                        <button className={isActive ? 'project-card selected' : 'project-card'} key={project.id} onClick={() => selectActiveProject(project.id)} type="button">
                          <span>{project.status}</span>
                          <strong>{project.name}</strong>
                          <small>{project.website}</small>
                          <em>
                            {done}/{tasks.length} công việc · {keywords.length} keyword
                          </em>
                        </button>
                      )
                    })}
                  </div>
                )}
              </Panel>

              <Panel
                title={editingProject ? 'Chỉnh sửa dự án SEO' : 'Tạo dự án SEO'}
                action={canEditProjects ? (editingProject ? `Đang sửa: ${editingProject.name}` : 'Chỉ bắt buộc tên và website') : 'Chỉ xem'}
              >
                {canEditProjects ? (
                  <form className="project-editor-form" onSubmit={saveProject} ref={projectFormRef} key={editingProject?.id ?? 'new-project'}>
                    <label className="project-editor-wide">
                      <span>Tên dự án *</span>
                      <input name="name" placeholder="Ví dụ: SEO website thương hiệu" defaultValue={editingProject?.name} required />
                    </label>
                    <label className="project-editor-wide">
                      <span>Website *</span>
                      <input name="website" placeholder="https://tenmien.vn" defaultValue={editingProject?.website} required />
                    </label>
                    <label>
                      <span>Khách hàng</span>
                      <input name="client" placeholder="Tên khách hàng" defaultValue={editingProject?.client} />
                    </label>
                    <label>
                      <span>Ngân sách</span>
                      <input name="budget" placeholder="0" type="number" min="0" defaultValue={editingProject?.budget || ''} />
                    </label>
                    <label>
                      <span>Ngày bắt đầu</span>
                      <input name="startDate" type="date" defaultValue={editingProject?.startDate} />
                    </label>
                    <label>
                      <span>Ngày kết thúc</span>
                      <input name="endDate" type="date" defaultValue={editingProject?.endDate} />
                    </label>
                    <label>
                      <span>Trạng thái</span>
                      <select name="status" defaultValue={editingProject?.status ?? 'Đang SEO'}>
                        <option>Đang SEO</option>
                        <option>Tạm dừng</option>
                        <option>Hoàn thành</option>
                      </select>
                    </label>
                    <label>
                      <span>Người phụ trách</span>
                      <select name="ownerId" defaultValue={editingProject?.ownerId ?? ''}>
                        <option value="">Chưa gán phụ trách</option>
                        {data.users.map((user) => (
                          <option value={user.id} key={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="project-editor-actions">
                      {editingProject && (
                        <button className="secondary-button" type="button" onClick={() => setEditingProjectId(null)}>
                          Hủy chỉnh sửa
                        </button>
                      )}
                      <button type="submit">{editingProject ? 'Lưu thay đổi' : 'Tạo dự án'}</button>
                    </div>
                  </form>
                ) : (
                  <EmptyState title="Bạn chỉ có quyền xem" text="Tài khoản hiện tại chưa được cấp quyền chỉnh sửa dự án." />
                )}
              </Panel>
            </div>

            {activeProject && (
              <>
                <div className="metric-grid">
                  <Metric title="Tiến độ dự án" value={pct(projectCompletion)} note={`${projectTasks.filter((task) => task.status === 'Hoàn thành').length}/${projectTasks.length} công việc`} />
                  <Metric title="Keyword" value={acceptedProjectKeywords.length} note={`Position TB ${acceptedProjectKeywords.length ? (acceptedProjectKeywords.reduce((sum, item) => sum + item.position, 0) / acceptedProjectKeywords.length).toFixed(1) : '0'}`} />
                  <Metric title="Chi phí dự án" value={currency.format(projectExpense)} note="Tổng chi đang ghi nhận" />
                  <Metric title="Công nợ" value={projectTransactions.filter((item) => !item.settlementDate).length} note={activeProject.status} />
                </div>

                <div className="split-grid">
                  <Panel title="Chi tiết dự án" action={activeProject.status}>
                    <div className="project-detail">
                      <Detail label="Khách hàng" value={field(activeProject.client)} />
                      <Detail label="Website" value={activeProject.website} />
                      <Detail label="Phụ trách" value={ownerName(activeProject.ownerId)} />
                      <Detail label="Ngân sách" value={activeProject.budget ? currency.format(activeProject.budget) : 'Chưa cập nhật'} />
                      <Detail label="Ngày bắt đầu" value={formatDateOnly(activeProject.startDate)} />
                      <Detail label="Ngày kết thúc" value={formatDateOnly(activeProject.endDate)} />
                    </div>
                    {canEditProjects && <div className="panel-actions">
                      <button className="secondary-button" type="button" onClick={() => editProject(activeProject.id)}>
                        Chỉnh sửa dự án
                      </button>
                      <button className="danger-button" type="button" onClick={() => archiveProject(activeProject.id)}>
                        Xóa dự án
                      </button>
                    </div>}
                  </Panel>

                  <Panel title="Thống kê thực thi" action="Dự án đang chọn">
                    <div className="progress-list">
                      <ProgressRow label="Tiến độ công việc" value={projectCompletion} meta={`${projectTasks.length} công việc`} />
                      <ProgressRow label="CTR trung bình" value={acceptedProjectKeywords.length ? acceptedProjectKeywords.reduce((sum, keyword) => sum + keyword.ctr, 0) / acceptedProjectKeywords.length : 0} meta={`${acceptedProjectKeywords.length} keyword hợp lệ`} />
                      <ProgressRow label="Đã giải ngân" value={projectTransactions.length ? (projectTransactions.filter((item) => item.settlementDate).length / projectTransactions.length) * 100 : 0} meta={`${projectTransactions.filter((item) => item.settlementDate).length}/${projectTransactions.length} khoản chi`} />
                    </div>
                  </Panel>
                </div>

                <Panel title="Kết nối Google" action={googleOAuthStatus.connected ? 'Đã kết nối' : 'OAuth 2.0'}>
                  <div className="analytics-layout">
                    <div className="analytics-settings google-oauth-settings">
                      <div className="google-oauth-state">
                        <span className={googleOAuthStatus.connected ? 'pill income' : 'pill'}>
                          {googleOAuthLoading ? 'Đang kiểm tra' : googleOAuthStatus.connected ? 'Đã cấp quyền' : 'Chưa kết nối'}
                        </span>
                        <strong>Search Console và Google Analytics</strong>
                      </div>
                      <div className="analytics-form-actions">
                        <button type="button" onClick={connectGoogleAccount} disabled={!canEditProjects || googleOAuthLoading || !googleOAuthStatus.configured}>
                          {googleOAuthStatus.connected ? 'Kết nối lại Google' : 'Đăng nhập với Google'}
                        </button>
                        <button className="secondary-button" type="button" onClick={disconnectGoogleAccount} disabled={!canEditProjects || !googleOAuthStatus.connected}>
                          Ngắt kết nối
                        </button>
                      </div>
                      {!googleOAuthLoading && !googleOAuthStatus.configured && (
                        <p className="analytics-status">
                          Server chưa cấu hình Google OAuth Client hoặc khóa mã hóa token.
                        </p>
                      )}
                    </div>
                    <div className="analytics-report">
                      <div className="project-detail">
                        <Detail label="Trạng thái" value={googleOAuthStatus.connected ? 'Đã kết nối Google OAuth' : 'Chưa có quyền truy cập'} />
                        <Detail label="Kết nối gần nhất" value={formatDateTime(googleOAuthStatus.connectedAt)} />
                        <Detail label="Quyền sử dụng" value={googleOAuthStatus.connected ? 'Search Console, Analytics (chỉ đọc)' : '-'} />
                        <Detail label="Lưu token" value="Mã hóa tại backend" />
                      </div>
                      {googleOAuthMessage && <p className="analytics-status">{googleOAuthMessage}</p>}
                    </div>
                  </div>
                </Panel>

                <Panel title="Kết nối WordPress / Site Kit" action="SEO Ops Connector">
                  <div className="analytics-layout">
                    <form className="analytics-settings" onSubmit={saveWordPressSettings} key={`${activeProject.id}-wordpress`} ref={wordpressFormRef}>
                      <label>
                        <span>WordPress Site URL</span>
                        <input name="siteUrl" placeholder="https://tenmien.vn" defaultValue={wordpressSettingsOf(activeProject).siteUrl || activeProject.website} disabled={!canEditProjects} />
                      </label>
                      <label>
                        <span>Connector Endpoint</span>
                        <input name="connectorEndpoint" placeholder="https://tenmien.vn/wp-json/seo-ops/v1" defaultValue={wordpressSettingsOf(activeProject).connectorEndpoint} disabled={!canEditProjects} />
                      </label>
                      <label>
                        <span>SEO Ops API Key</span>
                        <input name="apiKey" placeholder="Dán API key trong plugin WordPress" defaultValue={wordpressSettingsOf(activeProject).apiKey} type="password" disabled={!canEditProjects} />
                      </label>
                      <div className="analytics-form-actions">
                        <button type="submit" disabled={!canEditProjects}>Lưu kết nối</button>
                        <button className="secondary-button" type="button" onClick={testWordPressConnection} disabled={!canEditProjects}>
                          Kiểm tra kết nối
                        </button>
                        <button className="secondary-button" type="button" onClick={syncWordPressSite} disabled={!canEditProjects}>
                          Đồng bộ site
                        </button>
                        <button className="secondary-button" type="button" onClick={() => syncWordPressContent('posts')} disabled={!canEditProjects}>
                          Đồng bộ bài viết
                        </button>
                        <button className="secondary-button" type="button" onClick={() => syncWordPressContent('pages')} disabled={!canEditProjects}>
                          Đồng bộ page
                        </button>
                      </div>
                      <p>
                        Cài plugin <code>SEO Ops</code>, sau đó copy API key từ WordPress Admin. Nếu dùng localhost, Allowed Origin trong WordPress là <code>http://127.0.0.1:5173</code>.
                      </p>
                    </form>
                    <div className="analytics-report">
                      <div className="project-detail">
                        <Detail label="Endpoint hiện tại" value={field(wordpressSettingsOf(activeProject).connectorEndpoint)} />
                        <Detail label="Kết nối gần nhất" value={formatDateTime(wordpressSettingsOf(activeProject).lastConnectedAt)} />
                        <Detail label="Đồng bộ gần nhất" value={formatDateTime(wordpressSettingsOf(activeProject).lastSyncAt)} />
                        <Detail label="Dữ liệu nhận về" value="Bài viết, page, trạng thái Site Kit, report Analytics proxy" />
                      </div>
                      {wordpressStatus && <p className="analytics-status">{wordpressStatus}</p>}
                    </div>
                  </div>
                </Panel>

                <Panel title="Google Search Console / Check Index" action="URL Inspection API">
                  <div className="analytics-layout">
                    <form className="analytics-settings" onSubmit={saveSearchConsoleSettings} key={`${activeProject.id}-search-console`}>
                      <label>
                        <span>Search Console Property URL</span>
                        <input name="siteUrl" placeholder="https://tenmien.vn/ hoặc sc-domain:tenmien.vn" defaultValue={searchConsoleSettingsOf(activeProject).siteUrl || normalizedSearchConsoleSiteUrl(activeProject.website)} disabled={!canEditProjects} />
                      </label>
                      <label>
                        <span>URL Inspection API Endpoint</span>
                        <input name="apiEndpoint" placeholder={emptySearchConsoleSettings.apiEndpoint} defaultValue={searchConsoleSettingsOf(activeProject).apiEndpoint} disabled={!canEditProjects} />
                      </label>
                      <div className="analytics-form-actions">
                        <button type="submit" disabled={!canEditProjects}>Lưu cài đặt</button>
                        <button className="secondary-button" type="button" onClick={testSearchConsoleConnection} disabled={!canEditProjects}>
                          Kiểm tra kết nối
                        </button>
                      </div>
                      <p>
                        Check Index dùng kết nối Google của dự án. Biến <code>SEO_OPS_SEARCH_CONSOLE_TOKEN</code> chỉ là cấu hình dự phòng cũ.
                      </p>
                    </form>
                    <div className="analytics-report">
                      <div className="project-detail">
                        <Detail label="Property đang dùng" value={field(searchConsoleSettingsOf(activeProject).siteUrl)} />
                        <Detail label="Endpoint" value={field(searchConsoleSettingsOf(activeProject).apiEndpoint)} />
                        <Detail label="Kết nối gần nhất" value={formatDateTime(searchConsoleSettingsOf(activeProject).lastConnectedAt)} />
                        <Detail label="Check index gần nhất" value={formatDateTime(searchConsoleSettingsOf(activeProject).lastCheckAt)} />
                      </div>
                      {searchConsoleStatus && <p className="analytics-status">{searchConsoleStatus}</p>}
                    </div>
                  </div>
                </Panel>

                <Panel title="Google Analytics" action="Tool nội bộ">
                  <div className="analytics-toolbar">
                    <div>
                      <strong>Thống kê truy cập của {activeProject.name}</strong>
                      <span>Chỉ cấu hình và lấy dữ liệu từ website thuộc dự án của bạn.</span>
                    </div>
                    <div className="analytics-tabs" aria-label="Chọn khoảng thống kê Google Analytics">
                      {(Object.keys(analyticsGranularityLabels) as AnalyticsGranularity[]).map((granularity) => (
                        <button
                          className={analyticsGranularity === granularity ? 'active' : ''}
                          key={granularity}
                          onClick={() => setAnalyticsGranularity(granularity)}
                          type="button"
                        >
                          {analyticsGranularityLabels[granularity]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="analytics-layout">
                    <form className="analytics-settings" onSubmit={saveAnalyticsSettings} key={activeProject.id}>
                      <label>
                        <span>GA4 Property ID</span>
                        <input name="propertyId" placeholder="123456789" defaultValue={analyticsSettingsOf(activeProject).propertyId} disabled={!canEditProjects} />
                      </label>
                      <label>
                        <span>Measurement ID</span>
                        <input name="measurementId" placeholder="G-XXXXXXXXXX" defaultValue={analyticsSettingsOf(activeProject).measurementId} disabled={!canEditProjects} />
                      </label>
                      <label>
                        <span>API Endpoint nội bộ dự phòng</span>
                        <input name="apiEndpoint" placeholder="https://api.tenmien.vn/google-analytics/report" defaultValue={analyticsSettingsOf(activeProject).apiEndpoint} disabled={!canEditProjects} />
                      </label>
                      <label>
                        <span>Access Token API dự phòng</span>
                        <input name="accessToken" placeholder="Bearer token nếu API nội bộ yêu cầu" defaultValue={analyticsSettingsOf(activeProject).accessToken} type="password" disabled={!canEditProjects} />
                      </label>
                      <div className="analytics-form-actions">
                        <button type="submit" disabled={!canEditProjects}>Lưu cài đặt</button>
                        <button className="secondary-button" type="button" onClick={syncAnalytics} disabled={!canEditProjects}>
                          Đồng bộ dữ liệu
                        </button>
                      </div>
                      <p>
                        Khi tài khoản Google đã kết nối, hệ thống ưu tiên lấy GA4 qua OAuth backend; cấu hình dự phòng chỉ được dùng khi chưa kết nối.
                      </p>
                    </form>

                    <div className="analytics-report">
                      <div className="analytics-metrics">
                        <Metric title="Active Users" value={analyticsTotals.activeUsers.toLocaleString('vi-VN')} note={analyticsGranularityLabels[analyticsGranularity]} />
                        <Metric title="Sessions" value={analyticsTotals.sessions.toLocaleString('vi-VN')} note="Phiên truy cập" />
                        <Metric title="Page Views" value={analyticsTotals.pageViews.toLocaleString('vi-VN')} note="Lượt xem trang" />
                        <Metric title="Engagement" value={pct(analyticsAverageEngagement)} note="Tỷ lệ tương tác TB" />
                      </div>
                      {projectAnalyticsPoints.length === 0 ? (
                        <EmptyState title="Chưa có dữ liệu Analytics" text="Nhấn Đồng bộ dữ liệu để lấy dữ liệu từ API nội bộ hoặc tạo dữ liệu demo cho dự án đang chọn." />
                      ) : (
                        <>
                          <AnalyticsChart points={projectAnalyticsPoints} />
                          <AnalyticsTable points={projectAnalyticsPoints} />
                        </>
                      )}
                      {analyticsSettingsOf(activeProject).lastSyncAt && (
                        <p className="analytics-sync-time">
                          Lần đồng bộ gần nhất: {formatDateTime(analyticsSettingsOf(activeProject).lastSyncAt)}
                        </p>
                      )}
                      {analyticsStatus && <p className="analytics-status">{analyticsStatus}</p>}
                    </div>
                  </div>
                </Panel>
              </>
            )}

            <Panel title="Dự án đã xóa" action={`${deletedProjects.length} dự án`}>
              {deletedProjects.length === 0 ? (
                <EmptyState title="Chưa có dự án đã xóa" text="Khi bạn xóa dự án, dự án sẽ nằm tại đây để có thể khôi phục hoặc xóa vĩnh viễn." />
              ) : (
                <div className="deleted-project-list">
                  {deletedProjects.map((project) => (
                    <article className="deleted-project-card" key={project.id}>
                      <div>
                        <strong>{project.name}</strong>
                        <span>{project.website}</span>
                        <small>Đã xóa: {project.deletedAt ? formatDateTime(project.deletedAt) : 'Chưa rõ thời gian'}</small>
                      </div>
                      {canEditProjects && (
                        <div className="deleted-project-actions">
                          <button className="secondary-button" type="button" onClick={() => restoreProject(project.id)}>
                            Khôi phục dự án
                          </button>
                          <button className="danger-button" type="button" onClick={() => permanentlyDeleteProject(project.id)}>
                            Xóa vĩnh viễn
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </Panel>
          </section>
        )}

        {view === 'keywords' && canView(view) && (
          <section className="view-stack">
            <div className="metric-grid">
              <Metric title="Keyword hợp lệ" value={acceptedProjectKeywords.length} note={duplicateProjectKeywordCount ? `${duplicateProjectKeywordCount} key trùng chờ xử lý` : activeProject?.name ?? 'Chưa có dự án'} />
              <Metric title="Search Volume" value={acceptedProjectKeywords.reduce((sum, item) => sum + item.searchVolume, 0).toLocaleString('vi-VN')} note="Không tính key trùng" />
              <Metric title="Position TB" value={acceptedProjectKeywords.length ? (acceptedProjectKeywords.reduce((sum, item) => sum + item.position, 0) / acceptedProjectKeywords.length).toFixed(1) : '0'} note="Không tính key trùng" />
              <Metric title="CTR TB" value={`${acceptedProjectKeywords.length ? (acceptedProjectKeywords.reduce((sum, item) => sum + item.ctr, 0) / acceptedProjectKeywords.length).toFixed(2) : '0'}%`} note="Không tính key trùng" />
            </div>

            <Panel title={editingKeyword ? 'Sửa key' : 'Thêm key'} action={canEditProjects ? 'Keyword Mapping' : 'Chỉ xem'}>
              {canEditProjects ? (
                <>
                <div className="keyword-quick-toolbar">
                  <button className="secondary-button" type="button" onClick={() => { setQuickKeywordOpen(true); setQuickKeywordStatus(''); setQuickKeywordIssues([]) }}>
                    Nhập nhanh keyword
                  </button>
                  <button className="secondary-button" type="button" onClick={importSelectedKeywordsToArticles} disabled={selectedImportableArticleCount === 0}>
                    Đẩy key đã chọn sang Bài viết
                  </button>
                  <button className="keyword-index-bulk-button" type="button" onClick={checkAllKeywordIndexes} disabled={checkingAllKeywords}>
                    {checkingAllKeywords ? 'Đang check...' : 'Check index hàng loạt'}
                  </button>
                  {quickKeywordStatus && <span>{quickKeywordStatus}</span>}
                </div>
                {searchConsoleStatus && <p className="analytics-status keyword-index-status">{searchConsoleStatus}</p>}
                <form className="keyword-form" onSubmit={saveKeyword} key={editingKeyword?.id ?? 'new-keyword'}>
                  <input name="term" placeholder="Keyword *" defaultValue={editingKeyword?.term ?? ''} required />
                  <select name="keywordType" value={keywordFormType} onChange={(event) => setKeywordFormType(event.target.value as KeywordType)}>
                    <option value="A">A. Short-tail</option>
                    <option value="B">B. Mid-tail</option>
                    <option value="C">C. Long-tail</option>
                  </select>
                  <select name="parentId" defaultValue={editingKeyword?.parentId ?? ''} disabled={keywordFormType === 'A'}>
                    <option value="">{keywordFormType === 'A' ? 'Không có keyword cha' : 'Chọn keyword cha'}</option>
                    {projectKeywords
                      .filter((keyword) => keyword.id !== editingKeyword?.id)
                      .filter((keyword) => keywordFormType === 'B' ? keywordTypeOf(keyword) === 'A' : keywordFormType === 'C' ? keywordTypeOf(keyword) === 'B' : false)
                      .map((keyword) => (
                        <option value={keyword.id} key={keyword.id}>
                          {keywordTypeOf(keyword)} - {keyword.term}
                        </option>
                      ))}
                  </select>
                  <input name="landingUrl" placeholder="Landing URL" defaultValue={editingKeyword?.landingUrl ?? ''} />
                  <input name="searchVolume" placeholder="Search Volume" type="number" min="0" defaultValue={editingKeyword?.searchVolume ?? ''} />
                  <input name="keywordDifficulty" placeholder="Keyword Difficulty" type="number" min="0" max="100" defaultValue={editingKeyword?.keywordDifficulty ?? ''} />
                  <select name="searchIntent" defaultValue={editingKeyword?.searchIntent ?? 'Informational'}>
                    <option>Informational</option>
                    <option>Commercial</option>
                    <option>Transactional</option>
                    <option>Navigational</option>
                  </select>
                  <input name="position" placeholder="Position" type="number" min="1" defaultValue={editingKeyword?.position ?? ''} />
                  <input name="impressions" placeholder="Impressions" type="number" min="0" defaultValue={editingKeyword?.impressions ?? ''} />
                  <input name="clicks" placeholder="Clicks" type="number" min="0" defaultValue={editingKeyword?.clicks ?? ''} />
                  <input name="organicTraffic" placeholder="Organic Traffic" type="number" min="0" defaultValue={editingKeyword?.organicTraffic ?? ''} />
                  <input name="ctr" placeholder="CTR (%)" type="number" min="0" step="0.01" defaultValue={editingKeyword?.ctr ?? ''} />
                  {editingKeyword && (
                    <button className="secondary-button" type="button" onClick={() => { setEditingKeywordId(null); setKeywordFormType('A') }}>
                      Hủy sửa
                    </button>
                  )}
                  <button type="submit">{editingKeyword ? 'Sửa key' : 'Thêm key'}</button>
                </form>
                </>
              ) : (
                <EmptyState title="Bạn chỉ có quyền xem" text="Tài khoản hiện tại chưa được cấp quyền chỉnh sửa keyword." />
              )}
            </Panel>

            <Panel title="Quản lý Keyword" action={`${projectKeywords.length} keyword${duplicateProjectKeywordCount ? ` · ${duplicateProjectKeywordCount} trùng` : ''}`}>
              <KeywordTable
                key={`keywords-${activeProject?.id ?? 'none'}`}
                keywords={projectKeywords}
                expandedKeywordIds={expandedKeywordIds}
                selectedKeywordIds={selectedKeywordIds}
                onToggleCollapse={toggleKeywordCollapse}
                onToggleSelect={toggleKeywordSelection}
                onDeleteSelected={deleteSelectedKeywords}
                onDevelopKeyword={setKeywordBuilder}
                onEditKeyword={startEditKeyword}
                onCheckIndex={checkKeywordIndex}
                checkingKeywordIds={checkingKeywordIds}
                checkingAllKeywords={checkingAllKeywords}
                duplicateKeywordIds={duplicateKeywordIds}
                articleKeywordIds={articleProjectKeywordIds}
                onImportArticle={importKeywordToArticles}
                onRevealDuplicate={revealDuplicateKeyword}
                canEdit={canEditProjects}
              />
            </Panel>
          </section>
        )}

        {view === 'articles' && canView(view) && (
          <section className="view-stack">
            <div className="metric-grid">
              <Metric title="Keyword cần bài viết" value={articleProjectKeywords.length} note="Chỉ tính key đã đẩy thủ công" />
              <Metric title="Đã gửi task" value={articleProjectKeywords.filter((keyword) => keyword.articleTaskId).length} note="Đã phân việc" />
              <Metric title="Đã có link" value={articleProjectKeywords.filter((keyword) => keyword.articleUrl).length} note="Đã cập nhật URL bài viết" />
              <Metric title="Chưa phân công" value={articleProjectKeywords.filter((keyword) => !keyword.articleAssigneeId).length} note="Cần chọn phụ trách" />
            </div>
            <Panel title="Bài viết" action={`${articleProjectKeywords.length} keyword đã nhập`}>
              <ArticleTable
                key={`articles-${activeProject?.id ?? 'none'}`}
                keywords={articleProjectKeywords}
                users={data.users}
                tasks={data.tasks}
                onUpdateKeyword={updateKeywordArticle}
                onSendTask={sendArticleTask}
                onDeleteKeyword={deleteKeywordFromArticles}
                canEdit={canEditProjects}
                canEditKeyword={canEditAssignedArticle}
              />
            </Panel>
          </section>
        )}

        {view === 'entities' && canView(view) && (
          <EntityModule
            activeProject={activeProject}
            activeEntity={activeEntity}
            projectEntities={projectEntities}
            entityPlatforms={entityPlatforms}
            activeEntityLinks={activeEntityLinks}
            tasks={data.tasks}
            entityGuideScanHistory={data.entityGuideScanHistory ?? []}
            activeEntityChecklist={activeEntityChecklist}
            activeEntitySchema={activeEntitySchema}
            entityTab={entityTab}
            selectedEntityId={selectedEntityId}
            users={data.users}
            canEdit={canEditProjects}
            entityScore={entityScore}
            liveLinks={liveEntityLinks.length}
            indexedLinks={indexedEntityLinks.length}
            napOkLinks={napOkLinks.length}
            importStatus={entityImportStatus}
            editingPlatform={editingEntityPlatform}
            rememberedCredential={entityLinkCredential}
            selectedLinkIds={selectedEntityLinkIds}
            onTab={setEntityTab}
            onSelectEntity={setSelectedEntityId}
            onNewEntity={createNewEntityProfile}
            onSaveEntity={saveEntityProfile}
            onDeleteEntity={deleteEntityProfile}
            onAddPlatform={addEntityPlatform}
            onEditPlatform={startEditEntityPlatform}
            onCreateLinkFromPlatform={createEntityLinkFromPlatform}
            onCreateLinksFromPlatforms={createEntityLinksFromPlatforms}
            onDeletePlatforms={deleteEntityPlatforms}
            onCancelEditPlatform={() => setEditingEntityPlatformId(null)}
            onImportPlatformSheet={importEntityPlatformsFromSheet}
            onImportPlatformFile={importEntityPlatformsFromFile}
            onScanEntityGuides={scanEntityGuideFiles}
            onAddLink={addEntityLink}
            onCredentialChange={updateEntityLinkCredential}
            onUpdateLink={updateEntityLink}
            onDeleteLink={deleteEntityLink}
            onCheckLink={checkEntityLink}
            onToggleLinkSelect={toggleEntityLinkSelection}
            onSelectIncompleteLinks={selectIncompleteEntityLinks}
            onSendLinkTasks={sendEntityLinkTasks}
            onToggleChecklist={toggleEntityChecklist}
            onGenerateSchema={generateEntitySchema}
            onExportReport={exportEntityCsv}
            onOpenGuide={openKnowledgeGuide}
          />
        )}

        {view === 'backlinks' && canView(view) && (
          <BacklinkModule
            activeProject={activeProject}
            sources={backlinkSources}
            backlinks={projectBacklinks}
            plans={projectBacklinkPlans}
            costs={projectBacklinkCosts}
            users={data.users}
            tab={backlinkTab}
            canEdit={canEditProjects}
            liveCount={backlinkLive.length}
            errorCount={backlinkErrors.length}
            indexedCount={backlinkIndexed.length}
            referringDomainCount={referringDomains.size}
            totalCost={backlinkCostTotal}
            averageScore={backlinkAverageScore}
            onTab={setBacklinkTab}
            onAddSource={addBacklinkSource}
            onAddBacklink={addBacklink}
            onUpdateBacklink={updateBacklink}
            onCheckBacklink={checkBacklink}
            onAddPlan={addBacklinkPlan}
            onUpdatePlan={updateBacklinkPlan}
            onAddCost={addBacklinkCost}
            onExport={exportBacklinkCsv}
          />
        )}

        {view === 'tasks' && canView(view) && (
          <section className="view-stack">
            <div className="metric-grid task-overview-metrics">
              <Metric title="Task dự án" value={projectTasks.length} note={activeProject?.name ?? 'Chưa có dự án'} />
              <Metric title="Hoàn thành" value={projectTasks.filter((task) => task.status === 'Hoàn thành').length} note={pct(projectCompletion)} />
              <Metric title="Đang làm" value={projectTasks.filter((task) => ['Đang làm', 'Cần chỉnh sửa'].includes(taskStatusOf(task))).length} note="Đang xử lý" />
              <Metric title="Chờ nhận" value={projectTasks.filter((task) => taskStatusOf(task) === 'Chờ nhận').length} note="Admin đã phân" />
              <Metric title="Task quá hạn" value={projectOverdueTasks.length} note={`${projectCancelledDeadlineTasks.length} đã hủy do quá hạn`} />
            </div>
            <Panel title="Thêm công việc" action={canEditTasks ? 'Theo dự án đang chọn' : 'Chỉ xem'}>
              {canEditTasks ? (
                <form className="form-grid" onSubmit={addTask}>
                  <input name="title" placeholder="Tên công việc" required />
                  <select name="assigneeId" required>
                    {data.users.map((user) => (
                      <option value={user.id} key={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <select name="salaryModule" aria-label="Nhóm lương task">
                    <option value="">Công việc khác</option>
                    {taskSalaryModules.map((module) => (
                      <option value={module} key={module}>{module}</option>
                    ))}
                  </select>
                  <input name="deadlineAt" aria-label="Thời gian yêu cầu hoàn thành" type="datetime-local" defaultValue={defaultTaskDeadlineInput()} required />
                  <input name="taskSalary" placeholder="Lương task" type="number" min="0" step="1000" />
                  <button type="submit">Phân công việc</button>
                </form>
              ) : (
                <EmptyState title="Bạn chỉ có quyền xem" text="Tài khoản hiện tại chưa được cấp quyền phân công hoặc chỉnh sửa task." />
              )}
            </Panel>
            <Panel title="Task công việc" action={`${projectTasks.filter((task) => task.status === 'Hoàn thành').length}/${projectTasks.length} xong`}>
              <TaskTable
                tasks={projectTasks}
                keywords={data.keywords}
                users={data.users}
                projects={data.projects}
                onStatus={updateTaskStatus}
                onApprove={approveTask}
                onRevision={requestTaskRevision}
                onReassign={reassignTask}
                onAcceptTask={acceptTask}
                onRejectTask={rejectTask}
                onSubmitTask={submitTaskForReview}
                onDeleteTask={deleteTask}
                canDeleteTask={isAdmin}
                currentUserId={currentUserIdValue}
                allowAssigneeWorkflow={!canEditTasks}
                compact
                canEdit={canEditTasks}
              />
            </Panel>
          </section>
        )}

        {view === 'knowledge' && canView(view) && (
          <KnowledgeModule
            notes={filteredInternalNotes}
            allNotes={internalNotes}
            files={internalNoteFiles}
            versions={internalNoteVersions}
            comments={internalNoteComments}
            projects={data.projects}
            users={data.users}
            tab={knowledgeTab}
            search={knowledgeSearch}
            projectFilter={knowledgeProjectFilter}
            typeFilter={knowledgeTypeFilter}
            statusFilter={knowledgeStatusFilter}
            priorityFilter={knowledgePriorityFilter}
            tagFilter={knowledgeTagFilter}
            tagOptions={internalTagOptions}
            editingNote={editingInternalNote}
            activeProjectId={activeProject?.id ?? ''}
            currentUser={currentUser}
            canEdit={canEdit('knowledge')}
            canUploadHtmlGuide={isAdmin}
            entityGuideUploadStatus={entityGuideUploadStatus}
            onTab={setKnowledgeTab}
            onSearch={setKnowledgeSearch}
            onProjectFilter={setKnowledgeProjectFilter}
            onTypeFilter={setKnowledgeTypeFilter}
            onStatusFilter={setKnowledgeStatusFilter}
            onPriorityFilter={setKnowledgePriorityFilter}
            onTagFilter={setKnowledgeTagFilter}
            onEdit={setEditingInternalNoteId}
            onCancelEdit={() => setEditingInternalNoteId(null)}
            onSave={saveInternalNote}
            onArchive={archiveInternalNote}
            onDelete={deleteInternalNote}
            onRestore={restoreInternalNote}
            onPermanentDelete={permanentlyDeleteInternalNote}
            onApprove={approveInternalNote}
            onUploadHtmlGuide={uploadHtmlGuideNote}
            onUploadEntityGuide={uploadEntityGuideHtml}
            onAddFile={addInternalNoteFile}
            onAddComment={addInternalNoteComment}
          />
        )}

        {view === 'social' && canView(view) && (
          <SocialPlannerModule
            key={activeProject?.id ?? 'social-all'}
            data={data}
            activeProjectId={activeProject?.id ?? ''}
            currentUser={currentUser}
            tab={socialTab}
            canEdit={canEdit('social')}
            onTab={setSocialTab}
            onSaveData={saveData}
          />
        )}

        {view === 'tools' && canView(view) && (
          <section className="view-stack">
            <Panel title="Công cụ hỗ trợ" action="Module cha">
              <EmptyState title="Chọn công cụ cần sử dụng" text="Mở module con Viết bài ở menu bên trái để cấu hình API, kiểm tra kết nối và tạo bài viết SEO." />
            </Panel>
          </section>
        )}

        {view === 'tool-article-writer' && canView(view) && (
          <ToolsModule
            canEdit={canEdit('tool-article-writer')}
            loading={articleToolLoading}
            status={articleToolStatus}
            result={articleToolResult}
            config={articleToolConfig}
            regeneratingImageIndex={articleToolRegeneratingIndex}
            history={articleToolHistory}
            historyStatus={articleToolHistoryStatus}
            historyLoading={articleToolHistoryLoading}
            editorHtml={articleToolEditorHtml}
            savingHtml={articleToolSavingHtml}
            singleImage={articleToolSingleImage}
            singleImageStatus={articleToolSingleImageStatus}
            singleImageLoading={articleToolSingleImageLoading}
            onCompose={composeSeoArticle}
            onRegenerateImage={regenerateArticleImage}
            onOpenHistoryItem={openArticleHistoryItem}
            onSaveHtml={saveArticleToolHtml}
            onEditorHtmlChange={setArticleToolEditorHtml}
            onGenerateSingleImage={generateStandaloneArticleImage}
            onReloadHistory={loadArticleToolHistory}
          />
        )}

        {view === 'tool-article-settings' && canView(view) && (
          <ToolArticleSettingsModule
            canEdit={canEdit('tool-article-settings')}
            config={articleToolConfig}
            configStatus={articleToolConfigStatus}
            configLoading={articleToolConfigLoading}
            testingProvider={articleToolTestingProvider}
            onSaveConfig={saveArticleToolConfig}
            onReloadConfig={loadArticleToolConfig}
            onTestConnection={testArticleToolConnection}
          />
        )}

        {view === 'finance' && canView(view) && (
          <section className="view-stack">
            <div className="metric-grid">
              <Metric title="Tổng chi phí" value={currency.format(companyTransactions.reduce((sum, item) => sum + item.amount, 0))} note="Không tính doanh thu" />
              <Metric title="Chi chung" value={currency.format(companyTransactions.filter((item) => item.scope === 'Chi chung dự án').reduce((sum, item) => sum + item.amount, 0))} note="Chi phí vận hành chung" />
              <Metric title="Chi riêng dự án" value={currency.format(companyTransactions.filter((item) => item.scope !== 'Chi chung dự án').reduce((sum, item) => sum + item.amount, 0))} note="Theo từng dự án" />
              <Metric title="Công nợ chưa giải ngân" value={currency.format(unsettledTransactions.reduce((sum, item) => sum + item.amount, 0))} note={`${unsettledTransactions.length} khoản chờ trả`} />
            </div>
            <div className="dashboard-grid">
              <Panel title={editingTransaction ? 'Sửa khoản chi' : 'Tạo khoản chi'} action={canEdit('finance') ? 'Chi phí dự án' : 'Chỉ xem'}>
                {canEdit('finance') ? (
                <form className="form-grid" onSubmit={saveExpense} key={editingTransaction?.id ?? 'new-expense'}>
                  <select name="scope" defaultValue={editingTransaction?.scope ?? 'Chi riêng dự án'}>
                    <option>Chi chung dự án</option>
                    <option>Chi riêng dự án</option>
                  </select>
                  <select name="projectId" defaultValue={editingTransaction?.projectId || activeProject?.id || ''}>
                    <option value="">Áp dụng cho chi chung</option>
                    {activeProjects.map((project) => (
                      <option value={project.id} key={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <select name="spenderId" defaultValue={editingTransaction?.spenderId ?? currentUser?.id ?? ''}>
                    <option value="">Người chi</option>
                    {data.users.map((user) => (
                      <option value={user.id} key={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <input name="label" placeholder="Nội dung chi" defaultValue={editingTransaction?.label ?? ''} required />
                  <input name="amount" placeholder="Số tiền" type="number" min="0" defaultValue={editingTransaction?.amount ?? ''} required />
                  <input name="date" aria-label="Ngày chi" type="date" defaultValue={editingTransaction?.date ?? ''} required />
                  <button type="submit">{editingTransaction ? 'Cập nhật khoản chi' : 'Lưu khoản chi'}</button>
                  {editingTransaction && (
                    <button className="secondary-button" type="button" onClick={() => setEditingTransactionId(null)}>
                      Hủy sửa
                    </button>
                  )}
                </form>
                ) : (
                  <EmptyState title="Bạn chỉ có quyền xem" text="Tài khoản hiện tại chưa được cấp quyền chỉnh sửa tài chính." />
                )}
              </Panel>
              <Panel title="Thống kê chi phí dự án đang xem" action={activeProject?.name ?? 'Chưa có dự án'}>
                <BarChart
                  items={[
                    { label: 'Chi riêng', value: projectExpense, color: '#dc2626' },
                    { label: 'Chi chung', value: activeTransactions.filter((item) => item.scope === 'Chi chung dự án').reduce((sum, item) => sum + item.amount, 0), color: '#2563eb' },
                  ]}
                />
              </Panel>
            </div>
            <Panel title="Công nợ theo người chi" action={`${debtBySpender.length} người còn công nợ`}>
              {debtBySpender.length === 0 ? (
                <EmptyState title="Không còn công nợ" text="Tất cả khoản chi đã được giải ngân cho người chi." />
              ) : (
                <div className="debt-grid">
                  {debtBySpender.map((item) => (
                    <article className="debt-card" key={item.user.id}>
                      <span>{item.user.name}</span>
                      <strong>{currency.format(item.amount)}</strong>
                      <small>{item.count} khoản chưa giải ngân</small>
                    </article>
                  ))}
                </div>
              )}
            </Panel>
            <Panel title="Lịch sử chi phí" action={`${visibleFinanceTransactions.length} dòng`}>
              <div className="finance-filter" aria-label="Chọn phạm vi chi phí">
                <button className={financeFilter === 'all' ? 'active' : ''} type="button" onClick={() => setFinanceFilter('all')}>
                  Tất cả
                </button>
                <button className={financeFilter === 'general' ? 'active' : ''} type="button" onClick={() => setFinanceFilter('general')}>
                  Chi chung
                </button>
                <button className={financeFilter === 'project' ? 'active' : ''} type="button" onClick={() => setFinanceFilter('project')}>
                  Chi theo dự án
                </button>
              </div>
              <TransactionTable
                transactions={visibleFinanceTransactions}
                projects={data.projects}
                users={data.users}
                onEdit={canEdit('finance') ? editExpense : undefined}
                onSettle={canEdit('finance') ? settleExpense : undefined}
              />
            </Panel>
          </section>
        )}

        {view === 'people' && canView(view) && (
          <section className="view-stack">
            <div className="split-grid">
              <Panel title={editingUser ? 'Sửa nhân sự' : 'Thêm nhân sự'} action={canEdit('people') ? 'Đăng nhập, phân quyền và lương' : 'Chỉ xem'}>
                {canEdit('people') ? (
                <form className="form-grid" onSubmit={saveUser} key={editingUser?.id ?? 'new-user'}>
                  <input name="name" placeholder="Họ tên" defaultValue={editingUser?.name ?? ''} required />
                  <input name="email" placeholder="Email đăng nhập" type="email" defaultValue={editingUser?.email ?? ''} required />
                  <input name="password" placeholder="Mật khẩu" type="text" defaultValue={editingUser?.password ?? '123456'} />
                  <select name="role" defaultValue={editingUser?.role ?? 'Trưởng nhóm SEO'}>
                    <option>Trưởng nhóm SEO</option>
                    <option>Nội dung</option>
                    <option>Tài chính</option>
                    <option>Chỉ xem</option>
                    <option>Quản trị viên</option>
                  </select>
                  <select name="salaryType" defaultValue={editingUser?.salaryType ?? 'Lương theo tháng'}>
                    {salaryTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <input name="salaryAmount" placeholder="Mức lương" type="number" min="0" defaultValue={editingUser?.salaryAmount ?? ''} />
                  <div className="permission-box permission-matrix">
                    {permissions.map((permission) => (
                      <div className="permission-module" key={permission}>
                        <strong>{permission}</strong>
                        {permissionActions.map((action) => (
                          <label key={action.value}>
                            <input
                              name="permissions"
                              type="checkbox"
                              value={permissionKey(permission, action.value)}
                              defaultChecked={
                                editingUser
                                  ? normalizePermissions(editingUser.permissions).includes(permissionKey(permission, action.value))
                                  : permission !== 'Nhân sự' && action.value === 'view'
                              }
                            />
                            {action.label}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                  <button type="submit">{editingUser ? 'Cập nhật nhân sự' : 'Tạo nhân sự'}</button>
                  {editingUser && (
                    <button className="secondary-button" type="button" onClick={() => setEditingUserId(null)}>
                      Hủy sửa
                    </button>
                  )}
                </form>
                ) : (
                  <EmptyState title="Bạn chỉ có quyền xem" text="Tài khoản hiện tại chưa được cấp quyền chỉnh sửa nhân sự." />
                )}
              </Panel>
              <Panel title="Hiệu suất nhân sự" action={`${data.users.length} tài khoản`}>
                <div className="progress-list">
                  {staffProgress.map((user) => (
                    <ProgressRow key={user.id} label={user.name} value={user.rate} meta={`${user.done}/${user.tasks} công việc`} />
                  ))}
                </div>
              </Panel>
            </div>
            <Panel title="Tùy chỉnh lương theo task" action="Bài viết / Backlink / SEO Entity">
              {canEdit('people') ? (
                <form className="form-grid" onSubmit={saveTaskSalarySettings}>
                  {taskSalaryModules.map((module) => (
                    <input
                      key={module}
                      name={`taskSalary-${module}`}
                      placeholder={`Lương ${module}`}
                      type="number"
                      min="0"
                      step="1000"
                      defaultValue={taskSalarySettings[module] || ''}
                    />
                  ))}
                  <button type="submit">Lưu tùy chỉnh lương task</button>
                </form>
              ) : (
                <EmptyState title="Bạn chỉ có quyền xem" text="Tài khoản hiện tại chưa được cấp quyền chỉnh sửa lương task." />
              )}
            </Panel>
            <PayrollSettlementPanel
              users={data.users}
              tasks={activeTasks}
              settlements={payrollSettlements}
              canEdit={canEdit('people')}
              onSettle={settlePayroll}
            />
            <Panel title="Danh sách nhân sự" action="Vai trò và quyền">
              <UserTable users={data.users} currentUserId={currentUser?.id ?? ''} onEdit={editUser} onDelete={deleteUser} canEdit={canEdit('people')} />
            </Panel>
          </section>
        )}

        {view === 'progress' && canView(view) && (
          <section className="view-stack">
            <div className="dashboard-grid">
              <Panel title="Hoàn thành theo nhân viên" action="Người phụ trách">
                <div className="progress-list">
                  {staffProgress.map((user) => (
                    <ProgressRow key={user.id} label={user.name} value={user.rate} meta={`${user.done}/${user.tasks} công việc`} />
                  ))}
                </div>
              </Panel>
              <Panel title="Hoàn thành theo dự án" action="Task dự án">
                <div className="progress-list">
                  {projectProgress.map((project) => (
                    <ProgressRow key={project.id} label={project.name} value={project.rate} meta={`${project.done}/${project.tasks} công việc`} />
                  ))}
                </div>
              </Panel>
            </div>
            <Panel title="Bảng công việc tổng hợp" action={`${activeTasks.length} công việc`}>
              <TaskTable
                tasks={activeTasks}
                keywords={data.keywords}
                users={data.users}
                projects={data.projects}
                onStatus={updateTaskStatus}
                onApprove={approveTask}
                onRevision={requestTaskRevision}
                onReassign={reassignTask}
                onDeleteTask={deleteTask}
                canDeleteTask={isAdmin}
                canEdit={canEdit('progress')}
              />
            </Panel>
          </section>
        )}

        {view === 'system' && canView(view) && (
          <section className="view-stack">
            <div className="metric-grid">
              <Metric title="Phiên bản" value={appVersion} note={apiEnabled ? 'Backend shared data' : 'LocalStorage fallback'} />
              <Metric title="Dữ liệu chung" value={apiEnabled ? 'API' : 'Local'} note={apiEnabled ? 'Đang dùng backend chung' : 'Fallback localStorage'} />
              <Metric title="Storage key" value={storageKey} note="Giữ dữ liệu test hiện tại" />
              <Metric title="Nhật ký" value={activityLogs.length} note="Tối đa 300 dòng gần nhất" />
              <Metric title="Backup" value="JSON" note="Tải toàn bộ dữ liệu hiện tại" />
            </div>
            <div className="dashboard-grid">
              <Panel title="Thông tin phiên bản" action="Hệ thống">
                <div className="project-detail">
                  <Detail label="Tên ứng dụng" value="SEO Ops Project Manager" />
                  <Detail label="Phiên bản" value={appVersion} />
                  <Detail label="Cơ chế lưu trữ" value={apiEnabled ? 'Backend API + database file' : 'LocalStorage fallback'} />
                  <Detail label="Cập nhật dữ liệu" value={apiEnabled ? 'Nhiều người dùng chung dữ liệu qua VPS' : 'Chưa kết nối backend, dữ liệu chỉ nằm trên trình duyệt'} />
                </div>
              </Panel>
              <Panel title="Backup dữ liệu" action="Tải về">
                <div className="backup-panel">
                  <p>File backup chứa toàn bộ dự án, keyword, bài viết, task, tài chính, nhân sự và nhật ký hoạt động hiện tại.</p>
                  <button type="button" onClick={downloadBackup}>
                    Tải backup JSON
                  </button>
                  <label className="backup-import">
                    <span>Import backup JSON</span>
                    <input type="file" accept="application/json,.json" onChange={importBackupFile} />
                  </label>
                </div>
              </Panel>
            </div>
            <Panel title="Nhật ký hoạt động toàn hệ thống" action={`${activityLogs.length} dòng`}>
              <ActivityLogTable logs={activityLogs} />
            </Panel>
          </section>
        )}
      </main>

        {keywordBuilder && (
          <KeywordBuilderModal
          keyword={keywordBuilder}
          onClose={() => setKeywordBuilder(null)}
          onSubmit={developKeyword}
          />
        )}
        {quickKeywordOpen && (
          <QuickKeywordModal
            issues={quickKeywordIssues}
            onClose={() => setQuickKeywordOpen(false)}
            onSubmit={importQuickKeywords}
          />
        )}
    </div>
  )
}

function viewTitle(view: View) {
  return {
    overview: 'Tổng quan công ty',
    projects: 'Dự án SEO',
    entities: 'Quản lý SEO Entity',
    backlinks: 'Quản lý Backlink',
    keywords: 'Quản lý Keyword',
    articles: 'Bài viết',
    tasks: 'Task công việc',
    knowledge: 'Ghi chú & Tài liệu nội bộ',
    social: 'Social Planner',
    tools: 'Công cụ',
    'tool-article-writer': 'Viết bài',
    'tool-article-settings': 'Cấu hình & Log',
    finance: 'Tài chính',
    people: 'Nhân sự',
    progress: 'Tiến độ',
    system: 'Hệ thống',
  }[view]
}

function LoadingPage() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand login-brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>SEO Ops</strong>
            <span>Quản lý dự án SEO</span>
          </div>
        </div>
        <div>
          <p className="eyeline">Đang tải dữ liệu</p>
          <h1>Kết nối dữ liệu hệ thống</h1>
          <p className="login-hint">SEO Ops đang đọc database online trước khi mở trang đăng nhập.</p>
        </div>
      </section>
    </main>
  )
}

function LoginPage({
  error,
  users,
  onRefresh,
  onSubmit,
}: {
  error: string
  users: User[]
  onRefresh: () => AppData
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const activeUsers = users.filter((user) => user.active)
  const fillLogin = (email: string) => {
    const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]')
    const passwordInput = document.querySelector<HTMLInputElement>('input[name="password"]')
    if (emailInput) emailInput.value = email
    if (passwordInput) passwordInput.value = ''
    passwordInput?.focus()
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand login-brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>SEO Ops</strong>
            <span>Quản lý dự án SEO</span>
          </div>
        </div>
        <div>
          <p className="eyeline">Đăng nhập tài khoản</p>
          <h1>Truy cập hệ thống</h1>
        </div>
        <form className="login-form" onSubmit={onSubmit}>
          <label>
            <span>Email</span>
            <input name="email" placeholder="anh@agency.vn" type="email" required autoFocus />
          </label>
          <label>
            <span>Mật khẩu</span>
            <input name="password" placeholder="Nhập mật khẩu" type="password" required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit">Đăng nhập</button>
        </form>
        <div className="login-account-list">
          <div className="login-account-head">
            <strong>Tài khoản đang hoạt động</strong>
            <button type="button" onClick={onRefresh}>
              Làm mới
            </button>
          </div>
          {activeUsers.map((user) => (
            <button type="button" key={user.id} onClick={() => fillLogin(user.email)}>
              <span>{user.name}</span>
              <small>{user.email} · {user.role}</small>
            </button>
          ))}
        </div>
        <p className="login-hint">Bấm vào một tài khoản để tự điền email, sau đó nhập mật khẩu của tài khoản đó.</p>
      </section>
    </main>
  )
}

function ZoomControl({ zoom, onChange }: { zoom: number; onChange: (zoom: number) => void }) {
  const zoomPercent = Math.round(zoom * 100)
  return (
    <div className="zoom-control" aria-label="Thu phóng giao diện">
      <button type="button" onClick={() => onChange(zoom - 0.1)} disabled={zoom <= 0.7} title="Thu nhỏ giao diện">
        -
      </button>
      <button type="button" className="zoom-value" onClick={() => onChange(defaultAppZoom)} title="Đưa về mặc định 80%">
        {zoomPercent}%
      </button>
      <button type="button" onClick={() => onChange(zoom + 0.1)} disabled={zoom >= 1.2} title="Phóng to giao diện">
        +
      </button>
    </div>
  )
}

function NotificationBell({
  notifications,
  unreadCount,
  open,
  onToggle,
  onOpen,
  onMarkAllRead,
}: {
  notifications: NotificationItem[]
  unreadCount: number
  open: boolean
  onToggle: () => void
  onOpen: (notification: NotificationItem) => void
  onMarkAllRead: () => void
}) {
  return (
    <div className="notification-box">
      <button className="notification-button" type="button" onClick={onToggle} aria-label="Mở thông báo hệ thống">
        <BellIcon />
        {unreadCount > 0 && <span>{unreadCount}</span>}
      </button>
      {open && (
        <div className="notification-panel">
          <div className="notification-head">
            <strong>Thông báo</strong>
            <button type="button" onClick={onMarkAllRead} disabled={unreadCount === 0}>
              Đã đọc tất cả
            </button>
          </div>
          {notifications.length === 0 ? (
            <EmptyState title="Chưa có thông báo" text="Thông báo task mới và thay đổi trạng thái sẽ xuất hiện tại đây." />
          ) : (
            <div className="notification-list">
              {notifications.slice(0, 12).map((notification) => (
                <button
                  className={notification.readAt ? 'notification-item' : 'notification-item unread'}
                  key={notification.id}
                  type="button"
                  onClick={() => onOpen(notification)}
                >
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <small>{formatDateTime(notification.createdAt)}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BellIcon() {
  return (
    <svg className="bell-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22a2.5 2.5 0 0 0 2.35-1.65h-4.7A2.5 2.5 0 0 0 12 22Zm7-6.5V11a7 7 0 0 0-5-6.7V3a2 2 0 0 0-4 0v1.3A7 7 0 0 0 5 11v4.5L3.4 17.1A1 1 0 0 0 4.1 18.8h15.8a1 1 0 0 0 .7-1.7L19 15.5ZM7 16.8V11a5 5 0 0 1 10 0v5.8H7Z" />
    </svg>
  )
}

function NavButton({
  view,
  current,
  label,
  onClick,
  child,
}: {
  view: View
  current: View
  label: string
  onClick: (view: View) => void
  child?: boolean
}) {
  return (
    <button className={`${current === view ? 'nav-item active' : 'nav-item'} ${child ? 'nav-child' : ''}`} onClick={() => onClick(view)} type="button">
      <MiniIcon name={view} />
      <span>{label}</span>
    </button>
  )
}

function MiniIcon({ name }: { name: string }) {
  return (
    <svg className="mini-icon" viewBox="0 0 24 24" aria-hidden="true">
      {name === 'overview' && <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-11h6V4h-6v5Z" />}
      {name === 'projects' && <path d="M4 5h16v4H4V5Zm0 6h10v8H4v-8Zm12 0h4v8h-4v-8Z" />}
      {name === 'entities' && <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 2.2L17.3 8 12 10.8 6.7 8 12 5.2Zm-5 4.4 4 2.1v6.5l-4-2V9.6Zm6 8.6v-6.5l4-2.1v6.6l-4 2Z" />}
      {name === 'backlinks' && <path d="M8.5 13.5 10 15l-1.8 1.8a3 3 0 0 1-4.2-4.2L7 9.6a3 3 0 0 1 4.2 0l.8.8-1.5 1.5-.8-.8a1 1 0 0 0-1.4 0l-3 3a1 1 0 0 0 1.4 1.4l1.8-2Zm7-3L14 9l1.8-1.8a3 3 0 0 1 4.2 4.2L17 14.4a3 3 0 0 1-4.2 0l-.8-.8 1.5-1.5.8.8a1 1 0 0 0 1.4 0l3-3a1 1 0 0 0-1.4-1.4l-1.8 2ZM8 17l8-8 1.4 1.4-8 8L8 17Z" />}
      {name === 'keywords' && <path d="M4 5h16v3H4V5Zm2 5h12v3H6v-3Zm-2 5h16v4H4v-4Z" />}
      {name === 'articles' && <path d="M5 4h14v16H5V4Zm3 4h8V6H8v2Zm0 4h8v-2H8v2Zm0 4h5v-2H8v2Z" />}
      {name === 'tasks' && <path d="M5 6h3v3H5V6Zm5 1h9v2h-9V7Zm-5 5h3v3H5v-3Zm5 1h9v2h-9v-2Zm-5 5h3v3H5v-3Zm5 1h9v2h-9v-2Z" />}
      {name === 'knowledge' && <path d="M5 4h11l3 3v13H5V4Zm10 1.8V8h2.2L15 5.8ZM8 9h8V7H8v2Zm0 4h8v-2H8v2Zm0 4h5v-2H8v2Z" />}
      {name === 'social' && <path d="M7 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c.5-4.3 2.2-6.5 5-6.5s4.5 2.2 5 6.5H2Zm10.5 0c.4-3.5 1.9-5.3 4.5-5.3s4.1 1.8 4.5 5.3h-9Z" />}
      {name === 'tools' && <path d="M9.2 4.2 11 6 7.8 9.2 6 7.4 9.2 4.2Zm4.5 1.1 5 5-8.9 8.9a3.5 3.5 0 0 1-4.9-4.9l8.8-9Zm1.2 3.4-8.6 8.6a1.5 1.5 0 1 0 2.1 2.1l8.6-8.6-2.1-2.1ZM16 15l2 2 2-2 1.4 1.4-2 2 2 2L20 21.8l-2-2-2 2-1.4-1.4 2-2-2-2L16 15Z" />}
      {name === 'tool-article-writer' && <path d="M5 4h14v16H5V4Zm3 4h8V6H8v2Zm0 4h8v-2H8v2Zm0 4h5v-2H8v2Z" />}
      {name === 'tool-article-settings' && <path d="M12 3a2 2 0 0 1 2 2v.3c.6.2 1.1.4 1.6.7l.2-.2a2 2 0 0 1 2.8 2.8l-.2.2c.3.5.5 1 .7 1.6h.3a2 2 0 1 1 0 4h-.3c-.2.6-.4 1.1-.7 1.6l.2.2a2 2 0 0 1-2.8 2.8l-.2-.2c-.5.3-1 .5-1.6.7v.3a2 2 0 1 1-4 0v-.3c-.6-.2-1.1-.4-1.6-.7l-.2.2a2 2 0 0 1-2.8-2.8l.2-.2c-.3-.5-.5-1-.7-1.6H5a2 2 0 1 1 0-4h.3c.2-.6.4-1.1.7-1.6l-.2-.2a2 2 0 0 1 2.8-2.8l.2.2c.5-.3 1-.5 1.6-.7V5a2 2 0 0 1 2-2Zm0 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />}
      {name === 'finance' && <path d="M5 19h14v-2H5v2Zm1-4h3V8H6v7Zm5 0h3V5h-3v10Zm5 0h3v-5h-3v5Z" />}
      {name === 'people' && <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19c.5-3.2 2.2-5 5-5s4.5 1.8 5 5H3Zm10.5 0c.4-2 1.4-3.4 3.4-3.4 1.9 0 3.1 1.2 3.5 3.4h-6.9Z" />}
      {name === 'progress' && <path d="M5 12.5 9 16l10-10 1.5 1.5L9 19 3.5 14 5 12.5Z" />}
      {name === 'system' && <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 2.3L17.5 8 12 10.7 6.5 8 12 5.3ZM6 9.7l5 2.5v6.1l-5-2.5V9.7Zm7 8.6v-6.1l5-2.5v6.1l-5 2.5Z" />}
    </svg>
  )
}

type MetricIconName = 'projects' | 'finance' | 'completed' | 'overdue' | 'position'
type MetricTone = 'blue' | 'teal' | 'green' | 'amber' | 'violet'

function MetricIcon({ name }: { name: MetricIconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'projects' && <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h4.2l2 2H18a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 18 19H6.5A2.5 2.5 0 0 1 4 16.5v-11Zm2.5-.5a.5.5 0 0 0-.5.5v2h12.5a.5.5 0 0 0-.5-.5h-6.1l-2-2H6.5ZM6 9.5v7a.5.5 0 0 0 .5.5H18a.5.5 0 0 0 .5-.5v-7H6Z" />}
      {name === 'finance' && <path d="M5 18.5h14v-2H5v2Zm1.5-4h3v-7h-3v7Zm4.5 0h3v-10h-3v10Zm4.5 0h3v-5h-3v5ZM4 21a1 1 0 0 1 0-2h16a1 1 0 1 1 0 2H4Z" />}
      {name === 'completed' && <path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm-1-6.2 6-6-1.4-1.4-4.6 4.6-2.1-2.1-1.4 1.4 3.5 3.5Z" />}
      {name === 'overdue' && <path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm1 4h-2v6.2l4.6 2.7 1-1.7-3.6-2.1V7Zm-1 11.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z" />}
      {name === 'position' && <path d="M4.5 18.5h15v2h-15v-2Zm1-2.5 4.3-4.3 3 3L19 8.5V13h2V5h-8v2h4.5l-4.7 4.7-3-3L4 14.5 5.5 16Z" />}
    </svg>
  )
}

function Metric({
  title,
  value,
  note,
  icon,
  tone = 'blue',
}: {
  title: string
  value: string | number
  note: string
  icon?: MetricIconName
  tone?: MetricTone
}) {
  return (
    <article className={`metric-card ${icon ? 'metric-card-with-icon' : ''} metric-tone-${tone}`}>
      <div className="metric-card-head">
        <span className="metric-title">{title}</span>
        {icon && (
          <span className="metric-icon">
            <MetricIcon name={icon} />
          </span>
        )}
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  )
}

function Panel({ title, action, children, className }: { title: string; action?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className ? `panel ${className}` : 'panel'}>
      <div className="panel-head">
        <h2>{title}</h2>
        {action && <span>{action}</span>}
      </div>
      {children}
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  )
}

function ProgressRow({ label, value, meta }: { label: string; value: number; meta: string }) {
  return (
    <div className="progress-row">
      <div>
        <strong>{label}</strong>
        <span>{meta}</span>
      </div>
      <div className="progress-track" aria-label={`${label} ${pct(value)}`}>
        <span style={{ width: pct(value) }} />
      </div>
      <b>{pct(value)}</b>
    </div>
  )
}

function BarChart({ items }: { items: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1)
  return (
    <div className="bar-chart">
      {items.map((item) => (
        <div className="bar-item" key={item.label}>
          <span>{item.label}</span>
          <div>
            <i style={{ width: `${(item.value / max) * 100}%`, background: item.color }} />
          </div>
          <strong>{currency.format(item.value)}</strong>
        </div>
      ))}
    </div>
  )
}

function AnalyticsChart({ points }: { points: AnalyticsPoint[] }) {
  const max = Math.max(...points.map((point) => point.activeUsers), 1)
  return (
    <div className="analytics-chart">
      {points.map((point) => (
        <div className="analytics-bar" key={point.id}>
          <span>{point.label}</span>
          <div>
            <i style={{ height: `${Math.max((point.activeUsers / max) * 100, 8)}%` }} />
          </div>
          <strong>{point.activeUsers.toLocaleString('vi-VN')}</strong>
        </div>
      ))}
    </div>
  )
}

function AnalyticsTable({ points }: { points: AnalyticsPoint[] }) {
  return (
    <div className="table-wrap">
      <table className="analytics-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Active Users</th>
            <th>Sessions</th>
            <th>Page Views</th>
            <th>Engagement</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.id}>
              <td>{point.label}</td>
              <td>{point.activeUsers.toLocaleString('vi-VN')}</td>
              <td>{point.sessions.toLocaleString('vi-VN')}</td>
              <td>{point.pageViews.toLocaleString('vi-VN')}</td>
              <td>{pct(point.engagementRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SocialPlannerModule({
  data,
  activeProjectId,
  currentUser,
  tab,
  canEdit,
  onTab,
  onSaveData,
}: {
  data: AppData
  activeProjectId: string
  currentUser: User
  tab: SocialTab
  canEdit: boolean
  onTab: (tab: SocialTab) => void
  onSaveData: (nextData: AppData, action: string, target: string) => void
}) {
  const channels = data.socialChannels ?? []
  const campaigns = data.socialCampaigns ?? []
  const posts = data.socialPosts ?? []
  const media = data.socialPostMedia ?? []
  const approvals = data.socialPostApprovals ?? []
  const comments = data.socialPostComments ?? []
  const metrics = data.socialPostMetrics ?? []
  const templates = data.socialContentTemplates ?? []
  const [projectFilter, setProjectFilter] = useState(activeProjectId || 'all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editingChannelId, setEditingChannelId] = useState('')
  const [editingCampaignId, setEditingCampaignId] = useState('')
  const [editingPostId, setEditingPostId] = useState('')
  const [editingTemplateId, setEditingTemplateId] = useState('')
  const [postSeedTemplateId, setPostSeedTemplateId] = useState('')
  const [metricPostId, setMetricPostId] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const parts = appDateParts(appNow())
    return `${parts.year}-${parts.month}`
  })
  const [calendarMode, setCalendarMode] = useState<'month' | 'list'>('month')
  const editingChannel = channels.find((item) => item.id === editingChannelId)
  const editingCampaign = campaigns.find((item) => item.id === editingCampaignId)
  const editingPost = posts.find((item) => item.id === editingPostId)
  const editingTemplate = templates.find((item) => item.id === editingTemplateId)
  const seededTemplate = templates.find((item) => item.id === postSeedTemplateId)
  const projectName = (id: string) => data.projects.find((item) => item.id === id)?.name ?? 'Chưa rõ dự án'
  const userName = (id: string) => data.users.find((item) => item.id === id)?.name ?? 'Chưa gán'
  const channelName = (id: string) => channels.find((item) => item.id === id)?.name ?? 'Chưa chọn kênh'
  const campaignName = (id: string) => campaigns.find((item) => item.id === id)?.name ?? 'Không thuộc chiến dịch'
  const formText = (form: FormData, name: string) => String(form.get(name) || '').trim()
  const formNumber = (form: FormData, name: string) => Math.max(0, Number(form.get(name)) || 0)
  const filteredPosts = posts.filter((post) => {
    if (projectFilter !== 'all' && post.projectId !== projectFilter) return false
    if (platformFilter !== 'all' && post.platform !== platformFilter) return false
    if (statusFilter !== 'all' && post.contentStatus !== statusFilter && post.publishStatus !== statusFilter) return false
    const query = search.trim().toLocaleLowerCase('vi-VN')
    if (!query) return true
    return [post.title, post.caption, post.hashtags, post.topic, channelName(post.channelId), campaignName(post.campaignId)]
      .join(' ')
      .toLocaleLowerCase('vi-VN')
      .includes(query)
  })
  const filteredChannels = channels.filter((channel) =>
    (projectFilter === 'all' || channel.projectId === projectFilter) &&
    (platformFilter === 'all' || channel.platform === platformFilter) &&
    (statusFilter === 'all' || channel.status === statusFilter),
  )
  const filteredCampaigns = campaigns.filter((campaign) =>
    (projectFilter === 'all' || campaign.projectId === projectFilter) &&
    (statusFilter === 'all' || campaign.status === statusFilter),
  )
  const waitingPosts = filteredPosts.filter((post) => post.contentStatus === 'waiting_approval')
  const reportMetrics = metrics.filter((metric) => filteredPosts.some((post) => post.id === metric.postId))
  const totals = reportMetrics.reduce(
    (sum, item) => ({
      impressions: sum.impressions + item.impressions,
      reach: sum.reach + item.reach,
      likes: sum.likes + item.likes,
      comments: sum.comments + item.comments,
      shares: sum.shares + item.shares,
      linkClicks: sum.linkClicks + item.linkClicks,
      revenue: sum.revenue + item.revenue,
    }),
    { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, linkClicks: 0, revenue: 0 },
  )
  const now = appNow()
  const today = appNowIso().slice(0, 10)
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const statusLabel: Record<string, string> = {
    active: 'Đang hoạt động',
    paused: 'Tạm dừng',
    login_error: 'Lỗi đăng nhập',
    lost_permission: 'Mất quyền',
    archived: 'Lưu trữ',
    draft: 'Nháp',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    writing: 'Đang viết',
    ready_for_design: 'Chờ thiết kế',
    waiting_approval: 'Chờ duyệt',
    revision_required: 'Cần sửa',
    approved: 'Đã duyệt',
    missing: 'Thiếu media',
    designing: 'Đang thiết kế',
    uploaded: 'Đã tải lên',
    used: 'Đã dùng',
    not_scheduled: 'Chưa lên lịch',
    scheduled: 'Đã lên lịch',
    published: 'Đã đăng',
    failed: 'Đăng lỗi',
    overdue: 'Quá hạn',
  }
  const socialStatus = (value: string) => <span className={`social-status status-${value}`}>{statusLabel[value] ?? value}</span>
  const saveChannel = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nowIso = appNowIso()
    const item: SocialChannel = {
      id: editingChannel?.id ?? uid('social-channel'),
      projectId: formText(form, 'projectId'),
      name: formText(form, 'name'),
      platform: formText(form, 'platform') as SocialPlatform,
      channelType: formText(form, 'channelType') as SocialChannelType,
      publicUrl: formText(form, 'publicUrl'),
      ownerUserId: formText(form, 'ownerUserId'),
      contentCategory: formText(form, 'contentCategory'),
      status: formText(form, 'status') as SocialChannelStatus,
      note: formText(form, 'note'),
      createdAt: editingChannel?.createdAt ?? nowIso,
      updatedAt: nowIso,
    }
    onSaveData({ ...data, socialChannels: editingChannel ? channels.map((row) => row.id === item.id ? item : row) : [item, ...channels] }, editingChannel ? 'Sửa kênh Social' : 'Thêm kênh Social', item.name)
    setEditingChannelId('')
    event.currentTarget.reset()
  }
  const saveCampaign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const startDate = formText(form, 'startDate')
    const endDate = formText(form, 'endDate')
    if (startDate && endDate && startDate > endDate) return window.alert('Ngày kết thúc phải sau ngày bắt đầu.')
    const nowIso = appNowIso()
    const item: SocialCampaign = {
      id: editingCampaign?.id ?? uid('social-campaign'),
      projectId: formText(form, 'projectId'),
      name: formText(form, 'name'),
      goal: formText(form, 'goal'),
      description: formText(form, 'description'),
      platforms: String(form.get('platforms') || '').split(',').map((value) => value.trim()).filter((value): value is SocialPlatform => socialPlatforms.includes(value as SocialPlatform)),
      startDate,
      endDate,
      budget: formNumber(form, 'budget'),
      currency: formText(form, 'currency') || 'VND',
      plannedPosts: formNumber(form, 'plannedPosts'),
      ownerUserId: formText(form, 'ownerUserId'),
      status: formText(form, 'status') as SocialCampaignStatus,
      note: formText(form, 'note'),
      createdAt: editingCampaign?.createdAt ?? nowIso,
      updatedAt: nowIso,
    }
    onSaveData({ ...data, socialCampaigns: editingCampaign ? campaigns.map((row) => row.id === item.id ? item : row) : [item, ...campaigns] }, editingCampaign ? 'Sửa chiến dịch Social' : 'Thêm chiến dịch Social', item.name)
    setEditingCampaignId('')
    event.currentTarget.reset()
  }
  const savePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nowIso = appNowIso()
    const scheduledAt = formText(form, 'scheduledAt')
    const item: SocialPost = {
      id: editingPost?.id ?? uid('social-post'),
      projectId: formText(form, 'projectId'),
      campaignId: formText(form, 'campaignId'),
      channelId: formText(form, 'channelId'),
      title: formText(form, 'title'),
      platform: formText(form, 'platform') as SocialPlatform,
      postType: formText(form, 'postType') as SocialPostType,
      topic: formText(form, 'topic'),
      caption: formText(form, 'caption'),
      hashtags: formText(form, 'hashtags'),
      cta: formText(form, 'cta'),
      attachedLink: formText(form, 'attachedLink'),
      scheduledAt,
      publishedAt: editingPost?.publishedAt ?? '',
      publishedUrl: editingPost?.publishedUrl ?? '',
      writerId: formText(form, 'writerId'),
      designerId: formText(form, 'designerId'),
      approverId: formText(form, 'approverId'),
      contentStatus: formText(form, 'contentStatus') as SocialContentStatus,
      mediaStatus: formText(form, 'mediaStatus') as SocialMediaStatus,
      publishStatus: editingPost?.publishStatus === 'published' ? 'published' : scheduledAt ? 'scheduled' : 'not_scheduled',
      priority: formText(form, 'priority') as SocialPriority,
      note: formText(form, 'note'),
      createdAt: editingPost?.createdAt ?? nowIso,
      updatedAt: nowIso,
    }
    onSaveData({ ...data, socialPosts: editingPost ? posts.map((row) => row.id === item.id ? item : row) : [item, ...posts] }, editingPost ? 'Sửa bài Social' : 'Tạo bài Social', item.title)
    setEditingPostId('')
    setPostSeedTemplateId('')
    event.currentTarget.reset()
  }
  const saveTemplate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nowIso = appNowIso()
    const item: SocialContentTemplate = {
      id: editingTemplate?.id ?? uid('social-template'),
      projectId: formText(form, 'projectId'),
      name: formText(form, 'name'),
      templateType: formText(form, 'templateType') as SocialTemplateType,
      platform: formText(form, 'platform') as SocialPlatform | '',
      captionTemplate: formText(form, 'captionTemplate'),
      hashtagTemplate: formText(form, 'hashtagTemplate'),
      ctaTemplate: formText(form, 'ctaTemplate'),
      note: formText(form, 'note'),
      createdBy: editingTemplate?.createdBy ?? currentUser.id,
      status: formText(form, 'status') as 'active' | 'archived',
      createdAt: editingTemplate?.createdAt ?? nowIso,
      updatedAt: nowIso,
    }
    onSaveData({ ...data, socialContentTemplates: editingTemplate ? templates.map((row) => row.id === item.id ? item : row) : [item, ...templates] }, editingTemplate ? 'Sửa mẫu Social' : 'Thêm mẫu Social', item.name)
    setEditingTemplateId('')
    event.currentTarget.reset()
  }
  const deleteRecord = (key: keyof AppData, id: string, label: string) => {
    if (!window.confirm(`Xóa ${label}?`)) return
    const records = (data[key] as { id: string }[] | undefined) ?? []
    onSaveData({ ...data, [key]: records.filter((item) => item.id !== id) }, `Xóa ${label}`, id)
  }
  const updatePost = (postId: string, changes: Partial<SocialPost>, action: string) => {
    const target = posts.find((post) => post.id === postId)
    if (!target) return
    const updated = { ...target, ...changes, updatedAt: appNowIso() }
    onSaveData({ ...data, socialPosts: posts.map((post) => post.id === postId ? updated : post) }, action, target.title)
  }
  const submitApproval = (post: SocialPost) => {
    if (!post.caption && !media.some((item) => item.postId === post.id)) return window.alert('Bài cần có caption hoặc media trước khi gửi duyệt.')
    const nowIso = appNowIso()
    const approval: SocialPostApproval = {
      id: uid('social-approval'),
      postId: post.id,
      approverId: post.approverId,
      status: 'pending',
      feedback: '',
      approvedAt: '',
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    onSaveData({
      ...data,
      socialPosts: posts.map((item) => item.id === post.id ? { ...item, contentStatus: 'waiting_approval', updatedAt: nowIso } : item),
      socialPostApprovals: [approval, ...approvals],
    }, 'Gửi duyệt bài Social', post.title)
  }
  const reviewPost = (post: SocialPost, approved: boolean) => {
    const feedback = approved ? '' : window.prompt('Nhập nội dung cần chỉnh sửa:')?.trim()
    if (!approved && !feedback) return
    const nowIso = appNowIso()
    const nextStatus: SocialApprovalStatus = approved ? 'approved' : 'revision_required'
    const nextApproval: SocialPostApproval = {
      id: uid('social-approval'),
      postId: post.id,
      approverId: currentUser.id,
      status: nextStatus,
      feedback: feedback ?? '',
      approvedAt: approved ? nowIso : '',
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    onSaveData({
      ...data,
      socialPosts: posts.map((item) => item.id === post.id ? {
        ...item,
        approverId: currentUser.id,
        contentStatus: approved ? 'approved' : 'revision_required',
        publishStatus: approved && item.scheduledAt ? 'scheduled' : item.publishStatus,
        updatedAt: nowIso,
      } : item),
      socialPostApprovals: [nextApproval, ...approvals],
    }, approved ? 'Duyệt bài Social' : 'Yêu cầu sửa bài Social', post.title)
  }
  const markPublished = (post: SocialPost) => {
    const url = window.prompt('Nhập URL bài đã đăng:', post.publishedUrl)?.trim()
    if (url === undefined) return
    updatePost(post.id, { publishedUrl: url, publishedAt: appNowIso(), publishStatus: 'published' }, 'Đánh dấu bài Social đã đăng')
  }
  const clonePost = (post: SocialPost) => {
    const clone: SocialPost = {
      ...post,
      id: uid('social-post'),
      title: `${post.title} (bản sao)`,
      contentStatus: 'draft',
      publishStatus: 'not_scheduled',
      publishedAt: '',
      publishedUrl: '',
      scheduledAt: '',
      createdAt: appNowIso(),
      updatedAt: appNowIso(),
    }
    onSaveData({ ...data, socialPosts: [clone, ...posts] }, 'Clone bài Social', post.title)
  }
  const saveMedia = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const file = form.get('file') as File | null
    let fileUrl = formText(form, 'fileUrl')
    let fileName = formText(form, 'fileName')
    if (file?.size) {
      fileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('Không đọc được file media.'))
        reader.readAsDataURL(file)
      })
      fileName = file.name
    }
    if (!fileUrl) return window.alert('Vui lòng chọn file hoặc nhập URL media.')
    const nowIso = appNowIso()
    const item: SocialPostMedia = {
      id: uid('social-media'),
      postId: formText(form, 'postId'),
      fileName: fileName || 'Media Social',
      fileUrl,
      fileType: formText(form, 'fileType') as SocialPostMedia['fileType'],
      uploadedBy: currentUser.id,
      status: formText(form, 'status') as SocialMediaStatus,
      note: formText(form, 'note'),
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    const nextPosts = posts.map((post) => post.id === item.postId ? { ...post, mediaStatus: item.status === 'approved' ? 'approved' as const : 'uploaded' as const, updatedAt: nowIso } : post)
    onSaveData({ ...data, socialPostMedia: [item, ...media], socialPosts: nextPosts }, 'Thêm media Social', item.fileName)
    formElement.reset()
  }
  const saveComment = (event: FormEvent<HTMLFormElement>, postId: string) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const content = formText(form, 'content')
    if (!content) return
    const comment: SocialPostComment = { id: uid('social-comment'), postId, content, createdBy: currentUser.id, createdAt: appNowIso() }
    onSaveData({ ...data, socialPostComments: [comment, ...comments] }, 'Bình luận bài Social', posts.find((post) => post.id === postId)?.title ?? postId)
    event.currentTarget.reset()
  }
  const saveMetric = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const postId = formText(form, 'postId')
    const nowIso = appNowIso()
    const existing = metrics.find((item) => item.postId === postId)
    const item: SocialPostMetric = {
      id: existing?.id ?? uid('social-metric'),
      postId,
      impressions: formNumber(form, 'impressions'),
      reach: formNumber(form, 'reach'),
      likes: formNumber(form, 'likes'),
      comments: formNumber(form, 'comments'),
      shares: formNumber(form, 'shares'),
      saves: formNumber(form, 'saves'),
      linkClicks: formNumber(form, 'linkClicks'),
      inboxCount: formNumber(form, 'inboxCount'),
      ordersCount: formNumber(form, 'ordersCount'),
      adSpend: formNumber(form, 'adSpend'),
      revenue: formNumber(form, 'revenue'),
      metricDate: formText(form, 'metricDate') || today,
      collectedBy: currentUser.id,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
    }
    onSaveData({ ...data, socialPostMetrics: existing ? metrics.map((row) => row.id === item.id ? item : row) : [item, ...metrics] }, 'Cập nhật metrics Social', posts.find((post) => post.id === postId)?.title ?? postId)
    setMetricPostId('')
    event.currentTarget.reset()
  }
  const exportSocialCsv = (publishedOnly = false) => {
    const exportPosts = filteredPosts.filter((post) => !publishedOnly || post.publishStatus === 'published')
    const rows = [
      ['Dự án', 'Chiến dịch', 'Nền tảng', 'Kênh', 'Tiêu đề', 'Caption', 'Hashtag', 'Link đính kèm', 'Lịch đăng', 'Trạng thái nội dung', 'Trạng thái đăng', 'URL đã đăng', 'Người viết', 'Reach', 'Impressions', 'Likes', 'Comments', 'Shares', 'Clicks', 'Doanh thu'],
      ...exportPosts.map((post) => {
        const metric = metrics.find((item) => item.postId === post.id)
        return [projectName(post.projectId), campaignName(post.campaignId), post.platform, channelName(post.channelId), post.title, post.caption, post.hashtags, post.attachedLink, post.scheduledAt, statusLabel[post.contentStatus], statusLabel[post.publishStatus], post.publishedUrl, userName(post.writerId), metric?.reach ?? 0, metric?.impressions ?? 0, metric?.likes ?? 0, metric?.comments ?? 0, metric?.shares ?? 0, metric?.linkClicks ?? 0, metric?.revenue ?? 0]
      }),
    ]
    const blob = new Blob([`\ufeff${rows.map((row) => row.map((cell) => escapeCsv(cell)).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = publishedOnly ? 'social-posts-published.csv' : 'social-calendar.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }
  const metricForPost = metrics.find((item) => item.postId === metricPostId)
  const localDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const localMonthKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const monthStart = new Date(`${calendarMonth}-01T00:00:00`)
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(monthStart)
    date.setDate(index - monthStart.getDay() + 1)
    return date
  })
  const moveMonth = (delta: number) => {
    const date = new Date(`${calendarMonth}-01T00:00:00`)
    date.setMonth(date.getMonth() + delta)
    setCalendarMonth(localMonthKey(date))
  }

  return (
    <section className="view-stack social-planner">
      <div className="entity-toolbar">
        <div className="entity-tabs social-tabs" role="tablist" aria-label="Social Planner">
          {socialTabs.map((item) => <button className={tab === item.id ? 'active' : ''} key={item.id} type="button" onClick={() => onTab(item.id)}>{item.label}</button>)}
        </div>
        <span className="social-permission-note">{canEdit ? 'Có quyền chỉnh sửa' : 'Chỉ xem'}</span>
      </div>

      <Panel title="Tìm kiếm & bộ lọc" action={`${filteredPosts.length} bài phù hợp`}>
        <div className="social-filter-grid">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tiêu đề, caption, hashtag..." />
          <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
            <option value="all">Tất cả dự án</option>
            {data.projects.filter((project) => !project.deletedAt).map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}
          </select>
          <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
            <option value="all">Tất cả nền tảng</option>
            {socialPlatforms.map((platform) => <option value={platform} key={platform}>{platform}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            {[...socialContentStatuses, ...socialPublishStatuses, ...socialChannelStatuses, ...socialCampaignStatuses].filter((value, index, values) => values.indexOf(value) === index).map((status) => <option value={status} key={status}>{statusLabel[status] ?? status}</option>)}
          </select>
        </div>
      </Panel>

      {tab === 'overview' && (
        <>
          <div className="metric-grid">
            <Metric title="Kênh đang quản lý" value={filteredChannels.filter((item) => item.status === 'active').length} note={`${filteredChannels.length} kênh phù hợp`} />
            <Metric title="Bài hôm nay" value={filteredPosts.filter((post) => post.scheduledAt.slice(0, 10) === today).length} note="Cần theo dõi lịch đăng" />
            <Metric title="Bài 7 ngày tới" value={filteredPosts.filter((post) => post.scheduledAt && new Date(post.scheduledAt) >= now && new Date(post.scheduledAt) <= weekEnd).length} note="Theo bộ lọc hiện tại" />
            <Metric title="Chờ duyệt" value={waitingPosts.length} note="Leader/Admin cần xử lý" />
            <Metric title="Cần sửa" value={filteredPosts.filter((post) => post.contentStatus === 'revision_required').length} note="Đang chờ cập nhật" />
            <Metric title="Đã đăng" value={filteredPosts.filter((post) => post.publishStatus === 'published').length} note="Đã có trạng thái published" />
            <Metric title="Lỗi / quá hạn" value={filteredPosts.filter((post) => ['failed', 'overdue'].includes(post.publishStatus)).length} note="Cần xử lý sớm" />
            <Metric title="Chiến dịch đang chạy" value={filteredCampaigns.filter((item) => item.status === 'active').length} note={`${filteredCampaigns.length} chiến dịch`} />
          </div>
          <Panel title="Bài cần xử lý gần nhất" action="Ưu tiên chờ duyệt, cần sửa, quá hạn">
            <SocialPostTable posts={filteredPosts.filter((post) => ['waiting_approval', 'revision_required'].includes(post.contentStatus) || ['failed', 'overdue'].includes(post.publishStatus)).slice(0, 12)} channels={channels} campaigns={campaigns} users={data.users} canEdit={canEdit} statusLabel={statusLabel} onEdit={(id) => { setEditingPostId(id); onTab('posts') }} onClone={clonePost} onSubmit={submitApproval} onApprove={(post) => reviewPost(post, true)} onRevision={(post) => reviewPost(post, false)} onPublished={markPublished} onFailed={(post) => updatePost(post.id, { publishStatus: 'failed' }, 'Đánh dấu bài Social lỗi')} onMetric={(id) => { setMetricPostId(id); onTab('reports') }} onDelete={(id) => deleteRecord('socialPosts', id, 'bài Social')} />
          </Panel>
        </>
      )}

      {tab === 'channels' && (
        <>
          {canEdit && <Panel title={editingChannel ? 'Sửa kênh mạng xã hội' : 'Thêm kênh mạng xã hội'} action={editingChannel ? editingChannel.name : 'Gắn theo dự án'}>
            <form className="social-form-grid" key={editingChannel?.id ?? 'new-channel'} onSubmit={saveChannel}>
              <select name="projectId" defaultValue={editingChannel?.projectId ?? activeProjectId} required>{data.projects.filter((project) => !project.deletedAt).map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select>
              <input name="name" defaultValue={editingChannel?.name} placeholder="Tên kênh" required />
              <select name="platform" defaultValue={editingChannel?.platform ?? 'facebook'}>{socialPlatforms.map((value) => <option value={value} key={value}>{value}</option>)}</select>
              <select name="channelType" defaultValue={editingChannel?.channelType ?? 'fanpage'}>{socialChannelTypes.map((value) => <option value={value} key={value}>{value}</option>)}</select>
              <input name="publicUrl" defaultValue={editingChannel?.publicUrl} placeholder="URL public" type="url" />
              <select name="ownerUserId" defaultValue={editingChannel?.ownerUserId}><option value="">Chưa gán người phụ trách</option>{data.users.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select>
              <input name="contentCategory" defaultValue={editingChannel?.contentCategory} placeholder="Chủ đề nội dung" />
              <select name="status" defaultValue={editingChannel?.status ?? 'active'}>{socialChannelStatuses.map((value) => <option value={value} key={value}>{statusLabel[value]}</option>)}</select>
              <textarea name="note" defaultValue={editingChannel?.note} placeholder="Ghi chú" />
              <div className="social-form-actions"><button type="submit">{editingChannel ? 'Lưu thay đổi' : 'Thêm kênh'}</button>{editingChannel && <button className="secondary-button" type="button" onClick={() => setEditingChannelId('')}>Hủy sửa</button>}</div>
            </form>
          </Panel>}
          <Panel title="Danh sách kênh" action={`${filteredChannels.length} kênh`}>
            <div className="social-card-list">{filteredChannels.map((channel) => <article className="social-card" key={channel.id}><div><strong>{channel.name}</strong><span>{platformLabel(channel.platform)} · {channel.channelType} · {projectName(channel.projectId)}</span><small>{userName(channel.ownerUserId)} · {channel.contentCategory || 'Chưa có chủ đề'}</small></div><div className="social-card-actions">{socialStatus(channel.status)}{channel.publicUrl && <a href={channel.publicUrl} target="_blank" rel="noreferrer">Mở kênh</a>}{canEdit && <><button type="button" onClick={() => setEditingChannelId(channel.id)}>Sửa</button><button className="danger-button" type="button" onClick={() => deleteRecord('socialChannels', channel.id, 'kênh Social')}>Xóa</button></>}</div></article>)}</div>
            {filteredChannels.length === 0 && <EmptyState title="Chưa có kênh phù hợp" text="Thêm fanpage, profile, group hoặc channel để lập lịch bài viết." />}
          </Panel>
        </>
      )}

      {tab === 'campaigns' && (
        <>
          {canEdit && <Panel title={editingCampaign ? 'Sửa chiến dịch Social' : 'Tạo chiến dịch Social'} action="Quản lý kế hoạch theo mục tiêu">
            <form className="social-form-grid" key={editingCampaign?.id ?? 'new-campaign'} onSubmit={saveCampaign}>
              <select name="projectId" defaultValue={editingCampaign?.projectId ?? activeProjectId} required>{data.projects.filter((project) => !project.deletedAt).map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select>
              <input name="name" defaultValue={editingCampaign?.name} placeholder="Tên chiến dịch" required />
              <input name="goal" defaultValue={editingCampaign?.goal} placeholder="Mục tiêu: nhận diện, traffic, bán hàng..." />
              <input name="platforms" defaultValue={editingCampaign?.platforms.join(', ')} placeholder="Nền tảng, cách nhau bằng dấu phẩy" />
              <input name="startDate" defaultValue={editingCampaign?.startDate} type="date" />
              <input name="endDate" defaultValue={editingCampaign?.endDate} type="date" />
              <input name="budget" defaultValue={editingCampaign?.budget} type="number" min="0" placeholder="Ngân sách" />
              <input name="currency" defaultValue={editingCampaign?.currency ?? 'VND'} placeholder="Đơn vị tiền" />
              <input name="plannedPosts" defaultValue={editingCampaign?.plannedPosts} type="number" min="0" placeholder="Số bài dự kiến" />
              <select name="ownerUserId" defaultValue={editingCampaign?.ownerUserId}><option value="">Chưa gán người phụ trách</option>{data.users.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select>
              <select name="status" defaultValue={editingCampaign?.status ?? 'draft'}>{socialCampaignStatuses.map((value) => <option value={value} key={value}>{statusLabel[value]}</option>)}</select>
              <textarea name="description" defaultValue={editingCampaign?.description} placeholder="Mô tả chiến dịch" />
              <textarea name="note" defaultValue={editingCampaign?.note} placeholder="Ghi chú nội bộ" />
              <div className="social-form-actions"><button type="submit">{editingCampaign ? 'Lưu thay đổi' : 'Tạo chiến dịch'}</button>{editingCampaign && <button className="secondary-button" type="button" onClick={() => setEditingCampaignId('')}>Hủy sửa</button>}</div>
            </form>
          </Panel>}
          <Panel title="Danh sách chiến dịch" action={`${filteredCampaigns.length} chiến dịch`}>
            <div className="table-wrap"><table><thead><tr><th>Chiến dịch</th><th>Dự án</th><th>Thời gian</th><th>Bài dự kiến / đã tạo</th><th>Phụ trách</th><th>Trạng thái</th><th></th></tr></thead><tbody>{filteredCampaigns.map((campaign) => <tr key={campaign.id}><td><strong>{campaign.name}</strong><small>{campaign.goal || 'Chưa đặt mục tiêu'}</small></td><td>{projectName(campaign.projectId)}</td><td>{campaign.startDate || '-'} → {campaign.endDate || '-'}</td><td>{campaign.plannedPosts} / {posts.filter((post) => post.campaignId === campaign.id).length}</td><td>{userName(campaign.ownerUserId)}</td><td>{socialStatus(campaign.status)}</td><td>{canEdit && <div className="table-actions"><button type="button" onClick={() => setEditingCampaignId(campaign.id)}>Sửa</button><button className="danger-button" type="button" onClick={() => deleteRecord('socialCampaigns', campaign.id, 'chiến dịch Social')}>Xóa</button></div>}</td></tr>)}</tbody></table></div>
          </Panel>
        </>
      )}

      {tab === 'posts' && (
        <>
          {canEdit && <Panel title={editingPost ? 'Sửa bài viết Social' : 'Tạo bài viết Social'} action={seededTemplate ? `Đang áp dụng mẫu: ${seededTemplate.name}` : 'Kế hoạch nội dung'}>
            <form className="social-form-grid social-post-form" key={`${editingPost?.id ?? 'new-post'}-${seededTemplate?.id ?? ''}`} onSubmit={savePost}>
              <select name="projectId" defaultValue={editingPost?.projectId ?? seededTemplate?.projectId ?? activeProjectId} required>{data.projects.filter((project) => !project.deletedAt).map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select>
              <select name="campaignId" defaultValue={editingPost?.campaignId}><option value="">Không thuộc chiến dịch</option>{campaigns.map((campaign) => <option value={campaign.id} key={campaign.id}>{campaign.name}</option>)}</select>
              <select name="platform" defaultValue={editingPost?.platform ?? seededTemplate?.platform ?? 'facebook'}>{socialPlatforms.map((value) => <option value={value} key={value}>{value}</option>)}</select>
              <select name="channelId" defaultValue={editingPost?.channelId}><option value="">Chưa chọn kênh</option>{channels.map((channel) => <option value={channel.id} key={channel.id}>{channel.name} · {channel.platform}</option>)}</select>
              <input name="title" defaultValue={editingPost?.title} placeholder="Tiêu đề nội bộ" required />
              <select name="postType" defaultValue={editingPost?.postType ?? 'image'}>{socialPostTypes.map((value) => <option value={value} key={value}>{value}</option>)}</select>
              <input name="topic" defaultValue={editingPost?.topic} placeholder="Chủ đề bài viết" />
              <input name="scheduledAt" defaultValue={editingPost?.scheduledAt} type="datetime-local" />
              <textarea className="social-caption-input" name="caption" defaultValue={editingPost?.caption ?? seededTemplate?.captionTemplate} placeholder="Caption bài viết" />
              <textarea name="hashtags" defaultValue={editingPost?.hashtags ?? seededTemplate?.hashtagTemplate} placeholder="#hashtag" />
              <input name="cta" defaultValue={editingPost?.cta ?? seededTemplate?.ctaTemplate} placeholder="CTA" />
              <input name="attachedLink" defaultValue={editingPost?.attachedLink} placeholder="Link đính kèm" type="url" />
              <select name="writerId" defaultValue={editingPost?.writerId ?? currentUser.id}><option value="">Chưa gán người viết</option>{data.users.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select>
              <select name="designerId" defaultValue={editingPost?.designerId}><option value="">Chưa gán thiết kế</option>{data.users.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select>
              <select name="approverId" defaultValue={editingPost?.approverId}><option value="">Chưa gán người duyệt</option>{data.users.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select>
              <select name="contentStatus" defaultValue={editingPost?.contentStatus ?? 'draft'}>{socialContentStatuses.map((value) => <option value={value} key={value}>{statusLabel[value]}</option>)}</select>
              <select name="mediaStatus" defaultValue={editingPost?.mediaStatus ?? 'missing'}>{socialMediaStatuses.map((value) => <option value={value} key={value}>{statusLabel[value]}</option>)}</select>
              <select name="priority" defaultValue={editingPost?.priority ?? 'normal'}>{socialPriorities.map((value) => <option value={value} key={value}>{value}</option>)}</select>
              <textarea name="note" defaultValue={editingPost?.note} placeholder="Ghi chú nội bộ" />
              <div className="social-form-actions"><button type="submit">{editingPost ? 'Lưu thay đổi' : 'Tạo bài viết'}</button>{(editingPost || seededTemplate) && <button className="secondary-button" type="button" onClick={() => { setEditingPostId(''); setPostSeedTemplateId('') }}>Hủy</button>}</div>
            </form>
          </Panel>}
          <Panel title="Bài viết Social" action={`${filteredPosts.length} bài`}>
            <SocialPostTable posts={filteredPosts} channels={channels} campaigns={campaigns} users={data.users} canEdit={canEdit} statusLabel={statusLabel} onEdit={setEditingPostId} onClone={clonePost} onSubmit={submitApproval} onApprove={(post) => reviewPost(post, true)} onRevision={(post) => reviewPost(post, false)} onPublished={markPublished} onFailed={(post) => updatePost(post.id, { publishStatus: 'failed' }, 'Đánh dấu bài Social lỗi')} onMetric={(id) => { setMetricPostId(id); onTab('reports') }} onDelete={(id) => deleteRecord('socialPosts', id, 'bài Social')} />
          </Panel>
        </>
      )}

      {tab === 'calendar' && (
        <Panel title="Lịch đăng bài" action={`${filteredPosts.filter((post) => post.scheduledAt).length} bài có lịch`}>
          <div className="social-calendar-toolbar"><div><button type="button" onClick={() => moveMonth(-1)}>‹</button><strong>{calendarMonth}</strong><button type="button" onClick={() => moveMonth(1)}>›</button></div><div><button className={calendarMode === 'month' ? 'active' : ''} type="button" onClick={() => setCalendarMode('month')}>Tháng</button><button className={calendarMode === 'list' ? 'active' : ''} type="button" onClick={() => setCalendarMode('list')}>Danh sách</button></div></div>
          {calendarMode === 'month' ? <div className="social-calendar-grid">{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => <strong className="social-calendar-weekday" key={day}>{day}</strong>)}{calendarDays.map((date) => { const key = localDateKey(date); const dayPosts = filteredPosts.filter((post) => post.scheduledAt.slice(0, 10) === key); return <article className={localMonthKey(date) === calendarMonth ? 'social-calendar-day' : 'social-calendar-day muted'} key={key}><span>{date.getDate()}</span>{dayPosts.slice(0, 4).map((post) => <button className={`calendar-post status-${post.publishStatus}`} type="button" key={post.id} onClick={() => { setEditingPostId(post.id); onTab('posts') }}><b>{post.scheduledAt.slice(11, 16)}</b>{post.title}</button>)}{dayPosts.length > 4 && <small>+{dayPosts.length - 4} bài</small>}</article> })}</div> : <SocialPostTable posts={filteredPosts.filter((post) => post.scheduledAt).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))} channels={channels} campaigns={campaigns} users={data.users} canEdit={canEdit} statusLabel={statusLabel} onEdit={(id) => { setEditingPostId(id); onTab('posts') }} onClone={clonePost} onSubmit={submitApproval} onApprove={(post) => reviewPost(post, true)} onRevision={(post) => reviewPost(post, false)} onPublished={markPublished} onFailed={(post) => updatePost(post.id, { publishStatus: 'failed' }, 'Đánh dấu bài Social lỗi')} onMetric={(id) => { setMetricPostId(id); onTab('reports') }} onDelete={(id) => deleteRecord('socialPosts', id, 'bài Social')} />}
        </Panel>
      )}

      {tab === 'approvals' && <Panel title="Duyệt nội dung" action={`${waitingPosts.length} bài chờ duyệt`}>
        <div className="social-approval-list">{waitingPosts.map((post) => <article className="social-approval-card" key={post.id}><header><div><strong>{post.title}</strong><span>{post.platform} · {channelName(post.channelId)} · {formatDateTime(post.scheduledAt)}</span></div>{socialStatus(post.contentStatus)}</header><p>{post.caption || 'Bài chưa có caption.'}</p><small>{post.hashtags} {post.cta}</small>{media.filter((item) => item.postId === post.id).length > 0 && <div className="social-media-preview">{media.filter((item) => item.postId === post.id).map((item) => item.fileType === 'image' ? <img src={item.fileUrl} alt={item.fileName} key={item.id} /> : <a href={item.fileUrl} target="_blank" rel="noreferrer" key={item.id}>{item.fileName}</a>)}</div>}<div className="social-approval-actions">{canEdit && <><button type="button" onClick={() => reviewPost(post, true)}>Duyệt bài</button><button className="secondary-button" type="button" onClick={() => reviewPost(post, false)}>Yêu cầu sửa</button></>}</div><form className="social-comment-form" onSubmit={(event) => saveComment(event, post.id)}><input name="content" placeholder="Bình luận nội bộ..." required /><button type="submit">Gửi</button></form><div className="social-comment-list">{comments.filter((item) => item.postId === post.id).map((item) => <p key={item.id}><strong>{userName(item.createdBy)}</strong> {item.content}<small>{formatDateTime(item.createdAt)}</small></p>)}</div></article>)}</div>
        {waitingPosts.length === 0 && <EmptyState title="Không có bài chờ duyệt" text="Bài được gửi duyệt sẽ xuất hiện tại đây." />}
      </Panel>}

      {tab === 'media' && (
        <>
          {canEdit && <Panel title="Thêm media" action="Upload nhanh hoặc dùng URL">
            <form className="social-form-grid" onSubmit={saveMedia}><select name="postId" required><option value="">Chọn bài viết</option>{posts.map((post) => <option value={post.id} key={post.id}>{post.title}</option>)}</select><input name="fileName" placeholder="Tên media" /><input name="fileUrl" type="url" placeholder="URL file ngoài" /><input name="file" type="file" accept="image/*,video/*,.pdf,.doc,.docx" /><select name="fileType" defaultValue="image"><option value="image">Ảnh</option><option value="video">Video</option><option value="document">Tài liệu</option><option value="design">File thiết kế</option></select><select name="status" defaultValue="uploaded">{socialMediaStatuses.filter((value) => value !== 'missing').map((value) => <option value={value} key={value}>{statusLabel[value]}</option>)}</select><input name="note" placeholder="Ghi chú media" /><button type="submit">Thêm media</button></form>
          </Panel>}
          <Panel title="Kho media" action={`${media.length} file`}>
            <div className="social-media-grid">{media.filter((item) => filteredPosts.some((post) => post.id === item.postId)).map((item) => <article className="social-media-card" key={item.id}>{item.fileType === 'image' ? <img src={item.fileUrl} alt={item.fileName} /> : <div className="social-file-placeholder">{item.fileType}</div>}<strong>{item.fileName}</strong><span>{posts.find((post) => post.id === item.postId)?.title}</span><small>{userName(item.uploadedBy)} · {statusLabel[item.status]}</small><div><a href={item.fileUrl} target="_blank" rel="noreferrer">Mở file</a>{canEdit && <button className="danger-button" type="button" onClick={() => deleteRecord('socialPostMedia', item.id, 'media Social')}>Xóa</button>}</div></article>)}</div>
          </Panel>
        </>
      )}

      {tab === 'templates' && (
        <>
          {canEdit && <Panel title={editingTemplate ? 'Sửa mẫu nội dung' : 'Tạo mẫu nội dung'} action="Caption, hashtag, CTA, kịch bản">
            <form className="social-form-grid" key={editingTemplate?.id ?? 'new-template'} onSubmit={saveTemplate}><select name="projectId" defaultValue={editingTemplate?.projectId ?? activeProjectId}><option value="">Dùng chung toàn hệ thống</option>{data.projects.filter((project) => !project.deletedAt).map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select><input name="name" defaultValue={editingTemplate?.name} placeholder="Tên mẫu" required /><select name="templateType" defaultValue={editingTemplate?.templateType ?? 'caption'}>{socialTemplateTypes.map((value) => <option value={value} key={value}>{value}</option>)}</select><select name="platform" defaultValue={editingTemplate?.platform}><option value="">Mọi nền tảng</option>{socialPlatforms.map((value) => <option value={value} key={value}>{value}</option>)}</select><textarea className="social-caption-input" name="captionTemplate" defaultValue={editingTemplate?.captionTemplate} placeholder="Caption mẫu / kịch bản" /><textarea name="hashtagTemplate" defaultValue={editingTemplate?.hashtagTemplate} placeholder="Hashtag mẫu" /><input name="ctaTemplate" defaultValue={editingTemplate?.ctaTemplate} placeholder="CTA mẫu" /><select name="status" defaultValue={editingTemplate?.status ?? 'active'}><option value="active">Đang dùng</option><option value="archived">Lưu trữ</option></select><textarea name="note" defaultValue={editingTemplate?.note} placeholder="Ghi chú" /><div className="social-form-actions"><button type="submit">{editingTemplate ? 'Lưu thay đổi' : 'Tạo mẫu'}</button>{editingTemplate && <button className="secondary-button" type="button" onClick={() => setEditingTemplateId('')}>Hủy sửa</button>}</div></form>
          </Panel>}
          <Panel title="Mẫu nội dung" action={`${templates.length} mẫu`}><div className="social-card-list">{templates.map((item) => <article className="social-card" key={item.id}><div><strong>{item.name}</strong><span>{item.templateType} · {item.platform || 'Mọi nền tảng'} · {item.projectId ? projectName(item.projectId) : 'Dùng chung'}</span><small>{item.captionTemplate.slice(0, 160) || item.hashtagTemplate || item.ctaTemplate}</small></div><div className="social-card-actions"><button type="button" onClick={() => { setPostSeedTemplateId(item.id); setEditingPostId(''); onTab('posts') }}>Tạo bài từ mẫu</button>{canEdit && <><button type="button" onClick={() => setEditingTemplateId(item.id)}>Sửa</button><button className="danger-button" type="button" onClick={() => deleteRecord('socialContentTemplates', item.id, 'mẫu Social')}>Xóa</button></>}</div></article>)}</div></Panel>
        </>
      )}

      {tab === 'reports' && (
        <>
          <div className="metric-grid"><Metric title="Tổng bài" value={filteredPosts.length} note={`${filteredPosts.filter((post) => post.publishStatus === 'published').length} đã đăng`} /><Metric title="Reach" value={totals.reach.toLocaleString('vi-VN')} note={`${totals.impressions.toLocaleString('vi-VN')} impressions`} /><Metric title="Tương tác" value={(totals.likes + totals.comments + totals.shares).toLocaleString('vi-VN')} note={`${totals.linkClicks.toLocaleString('vi-VN')} click`} /><Metric title="Doanh thu ghi nhận" value={currency.format(totals.revenue)} note="Nhập thủ công qua metrics" /></div>
          {canEdit && <Panel title="Nhập chỉ số bài viết" action={metricPostId ? posts.find((post) => post.id === metricPostId)?.title : 'Chọn bài đã đăng'}>
            <form className="social-metric-form" key={metricPostId} onSubmit={saveMetric}><select name="postId" value={metricPostId} onChange={(event) => setMetricPostId(event.target.value)} required><option value="">Chọn bài viết</option>{posts.filter((post) => post.publishStatus === 'published').map((post) => <option value={post.id} key={post.id}>{post.title}</option>)}</select>{['impressions', 'reach', 'likes', 'comments', 'shares', 'saves', 'linkClicks', 'inboxCount', 'ordersCount', 'adSpend', 'revenue'].map((field) => <input name={field} defaultValue={metricForPost?.[field as keyof SocialPostMetric] as number | undefined} type="number" min="0" placeholder={field} key={`${metricPostId}-${field}`} />)}<input name="metricDate" defaultValue={metricForPost?.metricDate ?? today} type="date" /><button type="submit" disabled={!metricPostId}>Lưu metrics</button></form>
          </Panel>}
          <Panel title="Báo cáo & xuất dữ liệu" action="Theo bộ lọc hiện tại"><div className="report-actions"><button type="button" onClick={() => exportSocialCsv(false)}>Xuất lịch đăng CSV</button><button type="button" onClick={() => exportSocialCsv(true)}>Xuất bài đã đăng CSV</button></div><div className="table-wrap"><table><thead><tr><th>Bài viết</th><th>Nền tảng</th><th>Trạng thái</th><th>Reach</th><th>Impressions</th><th>Tương tác</th><th>Clicks</th><th>Doanh thu</th></tr></thead><tbody>{filteredPosts.map((post) => { const item = metrics.find((metric) => metric.postId === post.id); return <tr key={post.id}><td><strong>{post.title}</strong><small>{channelName(post.channelId)}</small></td><td>{post.platform}</td><td>{socialStatus(post.publishStatus)}</td><td>{item?.reach.toLocaleString('vi-VN') ?? 0}</td><td>{item?.impressions.toLocaleString('vi-VN') ?? 0}</td><td>{((item?.likes ?? 0) + (item?.comments ?? 0) + (item?.shares ?? 0)).toLocaleString('vi-VN')}</td><td>{item?.linkClicks.toLocaleString('vi-VN') ?? 0}</td><td>{currency.format(item?.revenue ?? 0)}</td></tr> })}</tbody></table></div></Panel>
        </>
      )}
    </section>
  )
}

function SocialPostTable({
  posts,
  channels,
  campaigns,
  users,
  canEdit,
  statusLabel,
  onEdit,
  onClone,
  onSubmit,
  onApprove,
  onRevision,
  onPublished,
  onFailed,
  onMetric,
  onDelete,
}: {
  posts: SocialPost[]
  channels: SocialChannel[]
  campaigns: SocialCampaign[]
  users: User[]
  canEdit: boolean
  statusLabel: Record<string, string>
  onEdit: (id: string) => void
  onClone: (post: SocialPost) => void
  onSubmit: (post: SocialPost) => void
  onApprove: (post: SocialPost) => void
  onRevision: (post: SocialPost) => void
  onPublished: (post: SocialPost) => void
  onFailed: (post: SocialPost) => void
  onMetric: (id: string) => void
  onDelete: (id: string) => void
}) {
  const nameOf = (items: { id: string; name: string }[], id: string, fallback: string) => items.find((item) => item.id === id)?.name ?? fallback
  return posts.length === 0 ? <EmptyState title="Chưa có bài viết phù hợp" text="Tạo bài hoặc thay đổi bộ lọc để xem kế hoạch Social." /> : (
    <div className="table-wrap"><table className="social-post-table"><thead><tr><th>Bài viết</th><th>Nền tảng / kênh</th><th>Chiến dịch</th><th>Lịch đăng</th><th>Nội dung</th><th>Đăng bài</th><th>Người viết</th><th>Thao tác</th></tr></thead><tbody>{posts.map((post) => <tr key={post.id}><td><strong>{post.title}</strong><small>{post.postType} · {post.priority}</small></td><td>{platformLabel(post.platform)}<small>{nameOf(channels, post.channelId, 'Chưa chọn kênh')}</small></td><td>{nameOf(campaigns, post.campaignId, 'Không có')}</td><td>{post.scheduledAt ? formatDateTime(post.scheduledAt) : 'Chưa lên lịch'}</td><td><span className={`social-status status-${post.contentStatus}`}>{statusLabel[post.contentStatus]}</span><small>{statusLabel[post.mediaStatus]}</small></td><td><span className={`social-status status-${post.publishStatus}`}>{statusLabel[post.publishStatus]}</span>{post.publishedUrl && <a href={post.publishedUrl} target="_blank" rel="noreferrer">Mở bài</a>}</td><td>{nameOf(users, post.writerId, 'Chưa gán')}</td><td><div className="social-row-actions">{canEdit && <><button type="button" onClick={() => onEdit(post.id)}>Sửa</button><button type="button" onClick={() => onClone(post)}>Clone</button>{post.contentStatus !== 'waiting_approval' && post.contentStatus !== 'approved' && <button type="button" onClick={() => onSubmit(post)}>Gửi duyệt</button>}{post.contentStatus === 'waiting_approval' && <><button type="button" onClick={() => onApprove(post)}>Duyệt</button><button type="button" onClick={() => onRevision(post)}>Yêu cầu sửa</button></>}{post.publishStatus !== 'published' && <><button type="button" onClick={() => onPublished(post)}>Đã đăng</button><button type="button" onClick={() => onFailed(post)}>Đăng lỗi</button></>}<button type="button" onClick={() => onMetric(post.id)}>Metrics</button><button className="danger-button" type="button" onClick={() => onDelete(post.id)}>Xóa</button></>}</div></td></tr>)}</tbody></table></div>
  )
}

function platformLabel(platform: SocialPlatform) {
  return platform === 'shopee_feed' ? 'Shopee Feed' : platform.charAt(0).toUpperCase() + platform.slice(1)
}

function KnowledgeModule({
  notes,
  allNotes,
  files,
  versions,
  comments,
  projects,
  users,
  tab,
  search,
  projectFilter,
  typeFilter,
  statusFilter,
  priorityFilter,
  tagFilter,
  tagOptions,
  editingNote,
  activeProjectId,
  currentUser,
  canEdit,
  canUploadHtmlGuide,
  entityGuideUploadStatus,
  onTab,
  onSearch,
  onProjectFilter,
  onTypeFilter,
  onStatusFilter,
  onPriorityFilter,
  onTagFilter,
  onEdit,
  onCancelEdit,
  onSave,
  onArchive,
  onDelete,
  onRestore,
  onPermanentDelete,
  onApprove,
  onUploadHtmlGuide,
  onUploadEntityGuide,
  onAddFile,
  onAddComment,
}: {
  notes: InternalNote[]
  allNotes: InternalNote[]
  files: InternalNoteFile[]
  versions: InternalNoteVersion[]
  comments: InternalNoteComment[]
  projects: Project[]
  users: User[]
  tab: KnowledgeTab
  search: string
  projectFilter: string
  typeFilter: string
  statusFilter: string
  priorityFilter: string
  tagFilter: string
  tagOptions: string[]
  editingNote?: InternalNote
  activeProjectId: string
  currentUser?: User
  canEdit: boolean
  canUploadHtmlGuide: boolean
  entityGuideUploadStatus: string
  onTab: (tab: KnowledgeTab) => void
  onSearch: (value: string) => void
  onProjectFilter: (value: string) => void
  onTypeFilter: (value: string) => void
  onStatusFilter: (value: string) => void
  onPriorityFilter: (value: string) => void
  onTagFilter: (value: string) => void
  onEdit: (noteId: string | null) => void
  onCancelEdit: () => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onArchive: (noteId: string) => void
  onDelete: (noteId: string) => void
  onRestore: (noteId: string) => void
  onPermanentDelete: (noteId: string) => void
  onApprove: (noteId: string) => void
  onUploadHtmlGuide: (event: FormEvent<HTMLFormElement>) => void
  onUploadEntityGuide: (event: FormEvent<HTMLFormElement>) => void
  onAddFile: (event: FormEvent<HTMLFormElement>) => void
  onAddComment: (event: FormEvent<HTMLFormElement>) => void
}) {
  const activeNotes = allNotes.filter((note) => !note.deletedAt && note.status !== 'Lưu trữ')
  const completedNotes = activeNotes.filter((note) => ['Hoàn thành', 'Đã duyệt'].includes(note.status))
  const issueNotes = activeNotes.filter((note) => note.noteType === 'Lỗi website')
  const guideNotes = activeNotes.filter((note) => ['Hướng dẫn thao tác', 'Quy trình nội bộ'].includes(note.noteType))
  const canApprove = canEdit && ['Quản trị viên', 'Trưởng nhóm SEO'].includes(currentUser?.role ?? '')
  const userName = (id?: string) => users.find((user) => user.id === id)?.name ?? 'Chưa gán'
  const projectName = (id?: string) => projects.find((project) => project.id === id)?.name ?? 'Không gắn dự án'
  const defaultProjectId = editingNote?.projectId || activeProjectId || projects[0]?.id || ''
  const selectedNoteForDetail = editingNote ?? notes[0]
  const selectedHtmlGuideFile = selectedNoteForDetail ? htmlGuideFileOf(selectedNoteForDetail, files) : undefined
  const compactGuideForm = tab === 'guides' || editingNote?.noteType === 'Hướng dẫn thao tác'

  return (
    <section className="view-stack knowledge-module">
      <div className="metric-grid">
        <Metric title="Tổng ghi chú" value={activeNotes.length} note="Đang dùng nội bộ" />
        <Metric title="Nhật ký web" value={activeNotes.filter((note) => note.noteType.startsWith('Chỉnh sửa')).length} note="UI / SEO / code / database" />
        <Metric title="Lỗi đã lưu" value={issueNotes.length} note={`${issueNotes.filter((note) => note.status === 'Hoàn thành').length} đã xử lý`} />
        <Metric title="Tài liệu hướng dẫn" value={guideNotes.length} note={`${completedNotes.length} ghi chú đã duyệt/xong`} />
      </div>

      <Panel title="Điều hướng Knowledge Base" action={`${notes.length} kết quả`}>
        <div className="entity-tabs">
          {knowledgeTabs.map((item) => (
            <button className={tab === item.id ? 'active' : ''} key={item.id} type="button" onClick={() => onTab(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Tìm kiếm & bộ lọc" action="Từ khóa / URL / tag / người thực hiện">
        <div className="knowledge-filters">
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Tìm trong tiêu đề, nội dung, URL, tag, người thực hiện..." />
          <select value={projectFilter} onChange={(event) => onProjectFilter(event.target.value)}>
            <option value="all">Tất cả dự án</option>
            {projects.map((project) => (
              <option value={project.id} key={project.id}>{project.name}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={(event) => onTypeFilter(event.target.value)}>
            <option value="all">Tất cả loại ghi chú</option>
            {internalNoteTypes.map((type) => (
              <option value={type} key={type}>{type}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            {internalNoteStatuses.map((status) => (
              <option value={status} key={status}>{status}</option>
            ))}
          </select>
          <select value={priorityFilter} onChange={(event) => onPriorityFilter(event.target.value)}>
            <option value="all">Tất cả mức độ</option>
            {internalNotePriorities.map((priority) => (
              <option value={priority} key={priority}>{priority}</option>
            ))}
          </select>
          <select value={tagFilter} onChange={(event) => onTagFilter(event.target.value)}>
            <option value="all">Tất cả tag</option>
            {tagOptions.map((tag) => (
              <option value={tag} key={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </Panel>

      {canUploadHtmlGuide && tab === 'files' && (
        <div className="knowledge-upload-grid">
          <Panel title="Upload hướng dẫn Entity HTML" action="Lưu vào thư mục cấu hình">
            <form className="knowledge-entity-guide-upload-form" onSubmit={onUploadEntityGuide}>
              <input
                name="entityGuideHtmlFiles"
                type="file"
                accept=".html,.htm,text/html"
                multiple
                required
              />
              <button type="submit">Upload file Entity</button>
            </form>
            <p className="knowledge-html-hint">
              File được lưu vào thư mục `SEO_OPS_ENTITY_GUIDE_DIR`. Có thể chọn nhiều file .html/.htm cùng lúc; tên file được giữ theo tên upload.
            </p>
            {entityGuideUploadStatus && <p className="entity-import-status">{entityGuideUploadStatus}</p>}
          </Panel>
          <Panel title="Upload nhanh hướng dẫn HTML" action="Tạo ghi chú nội bộ">
            <form className="knowledge-html-upload-form" onSubmit={onUploadHtmlGuide}>
              <input name="title" placeholder="Tiêu đề ghi chú, bỏ trống sẽ dùng tên file" />
              <select name="projectId" defaultValue={defaultProjectId}>
                <option value="">Không gắn dự án</option>
                {projects.map((project) => (
                  <option value={project.id} key={project.id}>{project.name}</option>
                ))}
              </select>
              <input name="tags" placeholder="Tag: hướng-dẫn, sop, dev..." defaultValue="hướng-dẫn, html" />
              <input name="reason" placeholder="Mục đích tài liệu" />
              <input name="htmlFile" type="file" accept=".html,.htm,text/html" required />
              <button type="submit">Upload HTML</button>
            </form>
          </Panel>
        </div>
      )}

      {tab !== 'files' && (
        <div className="wide-left dashboard-grid">
          <Panel title={editingNote ? 'Sửa ghi chú' : 'Tạo ghi chú mới'} action={canEdit ? 'Knowledge Base' : 'Chỉ xem'}>
            {canEdit ? (
              <form className={`knowledge-form${compactGuideForm ? ' knowledge-guide-form' : ''}`} onSubmit={onSave} key={editingNote?.id ?? `new-note-${tab}`}>
                <input name="title" placeholder="Tiêu đề ghi chú *" defaultValue={editingNote?.title ?? ''} required />
                <select name="projectId" defaultValue={defaultProjectId}>
                  <option value="">Không gắn dự án</option>
                  {projects.map((project) => (
                    <option value={project.id} key={project.id}>{project.name}</option>
                  ))}
                </select>
                {compactGuideForm ? (
                  <>
                    <input name="noteType" type="hidden" value="Hướng dẫn thao tác" />
                    <input name="visibility" type="hidden" value="Nội bộ" />
                    <input name="status" type="hidden" value={editingNote?.status ?? 'Nháp'} />
                    <input name="priority" type="hidden" value={editingNote?.priority ?? 'Trung bình'} />
                    <input name="tags" type="hidden" value={editingNote?.tags.join(', ') || 'hướng-dẫn'} />
                    <div className="knowledge-guide-code">
                      <div>
                        <span>Mã bài hướng dẫn</span>
                        <strong>{editingNote ? internalGuideCodeOf(editingNote) : 'Tự sinh sau khi tạo'}</strong>
                        <small>Dán mã này vào mục Hướng dẫn của Nền tảng Entity để mở nhanh tài liệu.</small>
                      </div>
                      {editingNote && (
                        <button className="secondary-button" type="button" onClick={() => void navigator.clipboard?.writeText(internalGuideCodeOf(editingNote))}>
                          Copy mã ID
                        </button>
                      )}
                    </div>
                    <textarea className="knowledge-guide-content" name="content" placeholder="Nội dung hoặc các bước hướng dẫn *" defaultValue={editingNote?.content ?? ''} required />
                  </>
                ) : (
                  <>
                    <input name="website" placeholder="Website / landing page" defaultValue={editingNote?.website ?? ''} />
                    <select name="noteType" defaultValue={editingNote?.noteType ?? 'Chỉnh sửa giao diện'}>
                      {internalNoteTypes.map((type) => (
                        <option value={type} key={type}>{type}</option>
                      ))}
                    </select>
                    <select name="category" defaultValue={editingNote?.category ?? 'SEO'}>
                      {internalNoteCategories.map((category) => (
                        <option value={category} key={category}>{category}</option>
                      ))}
                    </select>
                    <input name="affectedArea" placeholder="Khu vực ảnh hưởng: homepage, checkout, admin..." defaultValue={editingNote?.affectedArea ?? ''} />
                    <input name="relatedUrl" placeholder="URL liên quan: /san-pham/poster-arsenal" defaultValue={editingNote?.relatedUrl ?? ''} />
                    <select name="assignedTo" defaultValue={editingNote?.assignedTo ?? currentUser?.id ?? ''}>
                      <option value="">Người thực hiện</option>
                      {users.map((user) => (
                        <option value={user.id} key={user.id}>{user.name}</option>
                      ))}
                    </select>
                    <select name="requestedBy" defaultValue={editingNote?.requestedBy ?? ''}>
                      <option value="">Người yêu cầu</option>
                      {users.map((user) => (
                        <option value={user.id} key={user.id}>{user.name}</option>
                      ))}
                    </select>
                    <select name="status" defaultValue={editingNote?.status ?? 'Nháp'}>
                      {internalNoteStatuses.map((status) => (
                        <option value={status} key={status}>{status}</option>
                      ))}
                    </select>
                    <select name="priority" defaultValue={editingNote?.priority ?? 'Trung bình'}>
                      {internalNotePriorities.map((priority) => (
                        <option value={priority} key={priority}>{priority}</option>
                      ))}
                    </select>
                    <select name="visibility" defaultValue={editingNote?.visibility ?? 'Nội bộ'}>
                      {internalNoteVisibilityOptions.map((visibility) => (
                        <option value={visibility} key={visibility}>{visibility}</option>
                      ))}
                    </select>
                    <input name="tags" placeholder="Tag, cách nhau bằng dấu phẩy: SEO, UI, schema..." defaultValue={editingNote?.tags.join(', ') ?? ''} />
                    <textarea name="problemDescription" placeholder="Mô tả vấn đề / trước khi sửa đang bị gì" defaultValue={editingNote?.problemDescription ?? ''} />
                    <textarea name="content" placeholder="Nội dung đã chỉnh sửa hoặc các bước hướng dẫn *" defaultValue={editingNote?.content ?? ''} required />
                    <textarea name="reason" placeholder="Lý do chỉnh sửa / mục đích tài liệu" defaultValue={editingNote?.reason ?? ''} />
                    <textarea name="extraNote" placeholder="Ghi chú thêm, checklist, lỗi thường gặp, cách xử lý..." defaultValue={editingNote?.extraNote ?? ''} />
                    <input name="changeNote" placeholder="Ghi chú phiên bản: bổ sung bước check index..." />
                  </>
                )}
                <div className="knowledge-form-actions">
                  {editingNote && <button className="danger-button" type="button" onClick={() => onDelete(editingNote.id)}>Xóa ghi chú</button>}
                  {editingNote && <button className="secondary-button" type="button" onClick={onCancelEdit}>Hủy sửa</button>}
                  <button type="submit">{editingNote ? 'Lưu phiên bản mới' : 'Tạo ghi chú'}</button>
                </div>
              </form>
            ) : (
              <EmptyState title="Bạn chỉ có quyền xem" text="Tài khoản hiện tại chưa được cấp quyền tạo hoặc sửa ghi chú nội bộ." />
            )}
          </Panel>

          <Panel title="Chi tiết nhanh" action={selectedNoteForDetail ? `V${selectedNoteForDetail.version}` : 'Chưa chọn'}>
            {selectedNoteForDetail ? (
              <div className="knowledge-detail">
                <Detail label="Tiêu đề" value={selectedNoteForDetail.title} />
                <Detail label="Dự án" value={projectName(selectedNoteForDetail.projectId)} />
                <Detail label="Website / URL" value={`${field(selectedNoteForDetail.website)} ${selectedNoteForDetail.relatedUrl ? `· ${selectedNoteForDetail.relatedUrl}` : ''}`} />
                <Detail label="Loại / trạng thái" value={`${selectedNoteForDetail.noteType} · ${selectedNoteForDetail.status}`} />
                <Detail label="Người thực hiện" value={userName(selectedNoteForDetail.assignedTo)} />
                <Detail label="Cập nhật" value={formatDateTime(selectedNoteForDetail.updatedAt)} />
                {internalGuideCodeOf(selectedNoteForDetail) && (
                  <div className="knowledge-detail-guide-code">
                    <Detail label="Mã bài hướng dẫn" value={internalGuideCodeOf(selectedNoteForDetail)} />
                    <button className="secondary-button" type="button" onClick={() => void navigator.clipboard?.writeText(internalGuideCodeOf(selectedNoteForDetail))}>
                      Copy mã ID
                    </button>
                  </div>
                )}
                {selectedHtmlGuideFile && (
                  <button className="secondary-button knowledge-open-html-button" type="button" onClick={() => openHtmlGuideFile(selectedHtmlGuideFile)}>
                    Mở file HTML hướng dẫn
                  </button>
                )}
                <p>{selectedNoteForDetail.content}</p>
                <div className="knowledge-tags">
                  {selectedNoteForDetail.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </div>
            ) : (
              <EmptyState title="Chưa có ghi chú phù hợp" text="Tạo ghi chú đầu tiên hoặc nới bộ lọc tìm kiếm để xem dữ liệu." />
            )}
          </Panel>
        </div>
      )}

      {tab === 'files' ? (
        <KnowledgeFilesPanel notes={allNotes} files={files} users={users} canEdit={canEdit} onAddFile={onAddFile} />
      ) : (
        <Panel title="Danh sách ghi chú" action={`${notes.length} ghi chú`}>
          <KnowledgeNoteTable
            notes={notes}
            files={files}
            versions={versions}
            comments={comments}
            projects={projects}
            users={users}
            canEdit={canEdit}
            canApprove={canApprove}
            onEdit={onEdit}
            onArchive={onArchive}
            onDelete={onDelete}
            onRestore={onRestore}
            onPermanentDelete={onPermanentDelete}
            onApprove={onApprove}
            onAddFile={onAddFile}
            onAddComment={onAddComment}
          />
        </Panel>
      )}
    </section>
  )
}

function KnowledgeNoteTable({
  notes,
  files,
  versions,
  comments,
  projects,
  users,
  canEdit,
  canApprove,
  onEdit,
  onArchive,
  onDelete,
  onRestore,
  onPermanentDelete,
  onApprove,
  onAddFile,
  onAddComment,
}: {
  notes: InternalNote[]
  files: InternalNoteFile[]
  versions: InternalNoteVersion[]
  comments: InternalNoteComment[]
  projects: Project[]
  users: User[]
  canEdit: boolean
  canApprove: boolean
  onEdit: (noteId: string | null) => void
  onArchive: (noteId: string) => void
  onDelete: (noteId: string) => void
  onRestore: (noteId: string) => void
  onPermanentDelete: (noteId: string) => void
  onApprove: (noteId: string) => void
  onAddFile: (event: FormEvent<HTMLFormElement>) => void
  onAddComment: (event: FormEvent<HTMLFormElement>) => void
}) {
  const userName = (id?: string) => users.find((user) => user.id === id)?.name ?? 'Chưa gán'
  const projectName = (id?: string) => projects.find((project) => project.id === id)?.name ?? 'Không gắn dự án'
  if (notes.length === 0) {
    return <EmptyState title="Không có ghi chú phù hợp" text="Thử tìm theo URL, tag, dự án hoặc tạo ghi chú mới cho lần chỉnh sửa tiếp theo." />
  }

  return (
    <div className="knowledge-list">
      {notes.map((note) => {
        const noteFiles = files.filter((file) => file.noteId === note.id)
        const htmlGuideFile = htmlGuideFileOf(note, noteFiles)
        const noteVersions = versions.filter((version) => version.noteId === note.id)
        const noteComments = comments.filter((comment) => comment.noteId === note.id)
        const isArchived = Boolean(note.deletedAt || note.archivedAt || note.status === 'Lưu trữ')
        return (
          <article
            className={`knowledge-card${htmlGuideFile ? ' has-html-guide' : ''}`}
            key={note.id}
            onClick={(event) => {
              const target = event.target instanceof HTMLElement ? event.target : null
              if (htmlGuideFile && !target?.closest('button, a, input, select, textarea, summary, details, label')) {
                openHtmlGuideFile(htmlGuideFile)
              }
            }}
          >
            <div className="knowledge-card-main">
              <div className="knowledge-card-head">
                <div>
                  <span className={`note-priority priority-${note.priority.toLowerCase().replaceAll(' ', '-')}`}>{note.priority}</span>
                  <h3>
                    {htmlGuideFile ? (
                      <button className="knowledge-title-button" type="button" onClick={() => openHtmlGuideFile(htmlGuideFile)}>
                        {note.title}
                      </button>
                    ) : (
                      note.title
                    )}
                  </h3>
                  <small>{projectName(note.projectId)} · {field(note.website)} · {field(note.relatedUrl)}</small>
                  {internalGuideCodeOf(note) && <small className="knowledge-guide-id">Mã hướng dẫn: {internalGuideCodeOf(note)}</small>}
                  {htmlGuideFile && <small className="knowledge-html-hint">Nhấp tiêu đề để mở file HTML hướng dẫn</small>}
                </div>
                <span className="note-status">{note.status}</span>
              </div>
              <p>{note.problemDescription || note.content}</p>
              <div className="knowledge-meta">
                {internalGuideCodeOf(note) && (
                  <button className="knowledge-copy-code" type="button" onClick={() => void navigator.clipboard?.writeText(internalGuideCodeOf(note))}>
                    Copy {internalGuideCodeOf(note)}
                  </button>
                )}
                <span>{note.noteType}</span>
                <span>{note.affectedArea || 'Chưa ghi khu vực'}</span>
                <span>Thực hiện: {userName(note.assignedTo)}</span>
                <span>Cập nhật: {formatDateTime(note.updatedAt)}</span>
              </div>
              <div className="knowledge-tags">
                {note.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <details className="knowledge-extra">
                <summary>Nội dung, file, version và bình luận</summary>
                <div className="knowledge-extra-grid">
                  <div>
                    <strong>Nội dung</strong>
                    <p>{note.content || 'Chưa có nội dung.'}</p>
                    {note.reason && <p><b>Lý do:</b> {note.reason}</p>}
                    {note.extraNote && <p><b>Ghi chú thêm:</b> {note.extraNote}</p>}
                  </div>
                  <div>
                    <strong>File đính kèm</strong>
                    {noteFiles.length === 0 ? <p>Chưa có file.</p> : noteFiles.map((file) => (
                      <KnowledgeFileLink file={file} key={file.id} />
                    ))}
                    {canEdit && (
                      <form className="knowledge-mini-form" onSubmit={onAddFile}>
                        <input type="hidden" name="noteId" value={note.id} />
                        <input name="fileName" placeholder="Tên file/link" />
                        <input name="fileUrl" placeholder="Link Drive/Figma/Github..." />
                        <input name="fileType" placeholder="Loại file" />
                        <input name="file" type="file" />
                        <button type="submit">Thêm file</button>
                      </form>
                    )}
                  </div>
                  <div>
                    <strong>Version</strong>
                    {noteVersions.length === 0 ? <p>Chưa có version.</p> : noteVersions.map((version) => (
                      <p key={version.id}>V{version.versionNumber}: {version.changeNote || version.title} · {formatDateTime(version.createdAt)}</p>
                    ))}
                  </div>
                  <div>
                    <strong>Bình luận</strong>
                    {noteComments.length === 0 ? <p>Chưa có bình luận.</p> : noteComments.map((comment) => (
                      <p key={comment.id}>{userName(comment.createdBy)}: {comment.content}</p>
                    ))}
                    {canEdit && (
                      <form className="knowledge-mini-form" onSubmit={onAddComment}>
                        <input type="hidden" name="noteId" value={note.id} />
                        <input name="content" placeholder="Trao đổi nội bộ..." required />
                        <button type="submit">Gửi</button>
                      </form>
                    )}
                  </div>
                </div>
              </details>
            </div>
            {canEdit && (
              <div className="knowledge-card-actions">
                {!isArchived ? (
                  <>
                    <button className="secondary-button" type="button" onClick={() => onEdit(note.id)}>Sửa</button>
                    {canApprove && note.status === 'Chờ duyệt' && <button type="button" onClick={() => onApprove(note.id)}>Duyệt</button>}
                    <button className="secondary-button" type="button" onClick={() => onArchive(note.id)}>Lưu trữ</button>
                    <button className="danger-button" type="button" onClick={() => onDelete(note.id)}>Xóa</button>
                  </>
                ) : (
                  <>
                    <button className="secondary-button" type="button" onClick={() => onRestore(note.id)}>Khôi phục</button>
                    <button className="danger-button" type="button" onClick={() => onPermanentDelete(note.id)}>Xóa vĩnh viễn</button>
                  </>
                )}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

function KnowledgeFileLink({ file }: { file: InternalNoteFile }) {
  if (isHtmlGuideFile(file)) {
    return (
      <button className="knowledge-file-link" type="button" onClick={() => openHtmlGuideFile(file)}>
        {file.fileName}
      </button>
    )
  }
  return file.fileUrl ? <a href={file.fileUrl} target="_blank" rel="noreferrer">{file.fileName}</a> : <span>{file.fileName}</span>
}

function KnowledgeFilesPanel({
  notes,
  files,
  users,
  canEdit,
  onAddFile,
}: {
  notes: InternalNote[]
  files: InternalNoteFile[]
  users: User[]
  canEdit: boolean
  onAddFile: (event: FormEvent<HTMLFormElement>) => void
}) {
  const noteTitle = (id: string) => notes.find((note) => note.id === id)?.title ?? 'Ghi chú đã xóa'
  const userName = (id?: string) => users.find((user) => user.id === id)?.name ?? 'Chưa rõ'
  return (
    <div className="dashboard-grid">
      <Panel title="Thêm file đính kèm" action={canEdit ? 'Ảnh, video, Excel, PDF, link ngoài' : 'Chỉ xem'}>
        {canEdit ? (
          <form className="knowledge-file-form" onSubmit={onAddFile}>
            <select name="noteId" required>
              <option value="">Chọn ghi chú</option>
              {notes.filter((note) => !note.deletedAt).map((note) => (
                <option value={note.id} key={note.id}>{note.title}</option>
              ))}
            </select>
            <input name="fileName" placeholder="Tên file hoặc mô tả" />
            <input name="fileUrl" placeholder="Link Google Drive / Figma / Github / website" />
            <input name="fileType" placeholder="Loại file: ảnh trước/sau, video, PDF..." />
            <input name="file" type="file" />
            <button type="submit">Lưu file</button>
          </form>
        ) : (
          <EmptyState title="Bạn chỉ có quyền xem" text="Tài khoản hiện tại chưa được cấp quyền thêm file đính kèm." />
        )}
      </Panel>
      <Panel title="Kho file đính kèm" action={`${files.length} file`}>
        {files.length === 0 ? (
          <EmptyState title="Chưa có file" text="File đính kèm sẽ giúp lưu ảnh trước/sau, video hướng dẫn, file mẫu và link ngoài liên quan." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Ghi chú</th>
                  <th>Loại</th>
                  <th>Người tải</th>
                  <th>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id}>
                    <td><KnowledgeFileLink file={file} /></td>
                    <td>{noteTitle(file.noteId)}</td>
                    <td>{file.fileType}</td>
                    <td>{userName(file.uploadedBy)}</td>
                    <td>{formatDateTime(file.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function ToolsModule({
  canEdit,
  loading,
  status,
  result,
  config,
  regeneratingImageIndex,
  history,
  historyStatus,
  historyLoading,
  editorHtml,
  savingHtml,
  singleImage,
  singleImageStatus,
  singleImageLoading,
  onCompose,
  onRegenerateImage,
  onOpenHistoryItem,
  onSaveHtml,
  onEditorHtmlChange,
  onGenerateSingleImage,
  onReloadHistory,
}: {
  canEdit: boolean
  loading: boolean
  status: string
  result: ArticleToolResult | null
  config: ArticleToolConfigStatus | null
  regeneratingImageIndex: number | null
  history: ArticleToolHistoryItem[]
  historyStatus: string
  historyLoading: boolean
  editorHtml: string
  savingHtml: boolean
  singleImage: ArticleStandaloneImageResult | null
  singleImageStatus: string
  singleImageLoading: boolean
  onCompose: (event: FormEvent<HTMLFormElement>) => void
  onRegenerateImage: (error: ArticleToolImageError, imageProviderOverride?: ArticleImageProvider) => void
  onOpenHistoryItem: (runId: string, edit?: boolean) => void
  onSaveHtml: (event: FormEvent<HTMLFormElement>) => void
  onEditorHtmlChange: (value: string) => void
  onGenerateSingleImage: (event: FormEvent<HTMLFormElement>) => void
  onReloadHistory: () => void
}) {
  const imageProviderLabel = config?.imageProvider === 'vertex-ai' ? 'Vertex AI' : 'Imagen'
  const presentationLabel = (style: ArticlePresentationStyle) => {
    if (style === 'wordpress') return 'WordPress (HTML)'
    if (style === 'raw') return 'Raw - Văn bản thuần'
    return 'Trình bày chuyên nghiệp'
  }
  return (
    <section className="view-stack tools-module">
      <div className="metric-grid">
        <Metric title="Module con" value="Viết bài" note="Tự động hóa quy trình tạo bài SEO" />
        <Metric title="AI nội dung" value="Claude" note={config?.claudeConfigured ? 'Đã cấu hình' : 'Chưa có key'} />
        <Metric title="AI hình ảnh" value={imageProviderLabel} note={config?.imageProvider === 'vertex-ai' ? (config?.vertexConfigured ? 'Đã cấu hình' : 'Thiếu Vertex') : (config?.geminiConfigured ? 'Đã cấu hình' : 'Chưa có key')} />
        <Metric title="Output" value="HTML" note="Có preview và lưu file .html kèm ảnh" />
      </div>

      <Panel title="Tạo bài viết SEO" action={canEdit ? `Claude Gateway + ${imageProviderLabel}` : 'Chỉ xem'}>
        <form className="tool-compose-form" onSubmit={onCompose}>
          <label>
            <span>Từ khóa / chủ đề</span>
            <textarea name="keyword" placeholder="Ví dụ: poster bóng đá Arsenal" required disabled={!canEdit || loading} />
          </label>
          <label>
            <span>Dạng trình bày</span>
            <select name="presentationStyle" defaultValue="professional" disabled={!canEdit || loading}>
              <option value="professional">Trình bày chuyên nghiệp</option>
              <option value="wordpress">WordPress (HTML)</option>
              <option value="raw">Raw - Văn bản thuần</option>
            </select>
          </label>
          <label>
            <span>Đối tượng đọc</span>
            <input name="targetAudience" placeholder="Ví dụ: khách hàng đang tìm sản phẩm, nhân viên SEO, chủ shop..." disabled={!canEdit || loading} />
          </label>
          <label>
            <span>Giọng văn</span>
            <input name="tone" placeholder="Chuyên nghiệp, dễ đọc, thuyết phục" disabled={!canEdit || loading} />
          </label>
          <label>
            <span>Độ dài mục tiêu</span>
            <select name="wordCount" defaultValue="1800" disabled={!canEdit || loading}>
              <option value="1200">Khoảng 1.200 từ</option>
              <option value="1800">Khoảng 1.800 từ</option>
              <option value="2500">Khoảng 2.500 từ</option>
              <option value="3500">Khoảng 3.500 từ</option>
            </select>
          </label>
          <label className="tool-inline-check">
            <input name="useVertexImageProvider" type="checkbox" defaultChecked={config?.imageProvider === 'vertex-ai'} disabled={!canEdit || loading || !config?.vertexConfigured} />
            <span>Tạo ảnh bằng Vertex AI</span>
          </label>
          <button type="submit" disabled={!canEdit || loading}>
            {loading ? 'Đang viết bài...' : 'Tạo bài viết SEO'}
          </button>
        </form>
        {status && <p className="tool-status">{status}</p>}
        {!canEdit && (
          <EmptyState title="Chưa có quyền chạy công cụ" text="Admin cần cấp quyền Chỉnh sửa cho module Công cụ nếu muốn tài khoản này gọi API tạo bài." />
        )}
      </Panel>

      {result && (
        <Panel title="Preview bài viết HTML" action={presentationLabel(result.presentationStyle)}>
          <div className="tool-result-grid">
            <div className="tool-result-actions">
              <a className="secondary-button" href={result.htmlUrl} target="_blank" rel="noreferrer">
                Mở file HTML
              </a>
              <a className="secondary-button" href={result.sourceUrl} target="_blank" rel="noreferrer">
                Xem source
              </a>
              <button className="secondary-button" type="button" onClick={() => void navigator.clipboard?.writeText(result.html)}>
                Copy HTML
              </button>
              <span>{result.images.length} ảnh đã tạo</span>
              {result.imageErrors.length > 0 && <span>{result.imageErrors.length} ảnh lỗi</span>}
            </div>
            <iframe className="tool-html-preview" title="Preview bài viết HTML" srcDoc={result.previewHtml} />
            <details className="tool-source-details">
              <summary>Xem mã HTML</summary>
              <textarea className="tool-source-preview" value={result.html} readOnly />
            </details>
            <div className="tool-image-list">
              {result.images.map((image, index) => (
                <a href={image.fileUrl} target="_blank" rel="noreferrer" key={`${image.fileUrl}-${index}`}>
                  <span>Ảnh {index + 1}</span>
                  <small>{image.relativePath}</small>
                </a>
              ))}
              {result.imageErrors.map((error, index) => (
                <article className="tool-image-error" key={`${error.prompt}-${index}`}>
                  <strong>Ảnh lỗi {Number(error.index ?? index) + 1}</strong>
                  <small>{error.message}</small>
                  <div className="tool-image-error-actions">
                    <button type="button" className="secondary-button" onClick={() => onRegenerateImage(error)} disabled={!canEdit || loading || regeneratingImageIndex === Number(error.index ?? index)}>
                      {regeneratingImageIndex === Number(error.index ?? index) ? 'Đang gen...' : 'Gen lại ảnh'}
                    </button>
                    {config?.vertexConfigured && (
                      <button type="button" className="secondary-button" onClick={() => onRegenerateImage(error, 'vertex-ai')} disabled={!canEdit || loading || regeneratingImageIndex === Number(error.index ?? index)}>
                        Gen bằng Vertex AI
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {result && (
        <Panel title="Chỉnh sửa / bổ sung HTML" action={result.runId}>
          <form className="tool-edit-form" onSubmit={onSaveHtml}>
            <textarea value={editorHtml} onChange={(event) => onEditorHtmlChange(event.currentTarget.value)} />
            <div className="tool-result-actions">
              <button type="submit" disabled={!canEdit || savingHtml}>{savingHtml ? 'Đang lưu...' : 'Lưu chỉnh sửa HTML'}</button>
              <button className="secondary-button" type="button" onClick={() => void navigator.clipboard?.writeText(editorHtml)}>Copy HTML đã sửa</button>
            </div>
          </form>
        </Panel>
      )}

      <Panel title="Lịch sử bài đã tạo" action={historyLoading ? 'Đang tải' : `${history.length} bài`}>
        <div className="tool-result-actions">
          <button className="secondary-button" type="button" onClick={onReloadHistory} disabled={historyLoading}>Tải lại lịch sử</button>
        </div>
        {historyStatus && <p className="tool-status">{historyStatus}</p>}
        {history.length === 0 ? (
          <EmptyState title="Chưa có lịch sử" text="Các bài tạo mới sẽ được lưu vào đây để mở lại, chỉnh sửa bổ sung và copy HTML." />
        ) : (
          <div className="tool-history-list">
            {history.map((item) => (
              <article className="tool-history-card" key={item.runId}>
                <div>
                  <strong>{item.topic || item.runId}</strong>
                  <small>{presentationLabel(item.presentationStyle)} · {formatDateTime(item.updatedAt || item.generatedAt)}</small>
                  <small>{item.images?.length || 0} ảnh · {item.imageErrors?.length || 0} ảnh lỗi</small>
                </div>
                <div className="tool-result-actions">
                  <button className="secondary-button" type="button" onClick={() => onOpenHistoryItem(item.runId)}>Mở lại</button>
                  <button className="secondary-button" type="button" onClick={() => onOpenHistoryItem(item.runId, true)}>Chỉnh sửa</button>
                  <a className="secondary-button" href={item.htmlUrl} target="_blank" rel="noreferrer">HTML</a>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Tạo ảnh đơn theo mô tả" action={config?.vertexConfigured ? 'Imagen hoặc Vertex AI' : 'Imagen'}>
        <form className="tool-compose-form" onSubmit={onGenerateSingleImage}>
          <label>
            <span>Mô tả ảnh</span>
            <textarea name="prompt" placeholder="Mô tả ảnh bằng tiếng Anh để AI tạo ảnh tốt hơn" required disabled={!canEdit || singleImageLoading} />
          </label>
          <label className="tool-inline-check">
            <input name="useVertexImageProvider" type="checkbox" defaultChecked={config?.imageProvider === 'vertex-ai'} disabled={!canEdit || singleImageLoading || !config?.vertexConfigured} />
            <span>Tạo ảnh bằng Vertex AI</span>
          </label>
          <button type="submit" disabled={!canEdit || singleImageLoading}>{singleImageLoading ? 'Đang tạo ảnh...' : 'Tạo ảnh đơn'}</button>
        </form>
        {singleImageStatus && <p className="tool-status">{singleImageStatus}</p>}
        {singleImage && (
          <div className="tool-single-image-result">
            <a href={singleImage.image.fileUrl} target="_blank" rel="noreferrer">
              <img src={singleImage.image.fileUrl} alt="Ảnh AI đã tạo" />
            </a>
            <div className="tool-result-actions">
              <a className="secondary-button" href={singleImage.image.fileUrl} target="_blank" rel="noreferrer">Mở ảnh</a>
              <button className="secondary-button" type="button" onClick={() => void navigator.clipboard?.writeText(singleImage.image.fileUrl)}>Copy URL ảnh</button>
            </div>
          </div>
        )}
      </Panel>
    </section>
  )
}

function ToolArticleSettingsModule({
  canEdit,
  config,
  configStatus,
  configLoading,
  testingProvider,
  onSaveConfig,
  onReloadConfig,
  onTestConnection,
}: {
  canEdit: boolean
  config: ArticleToolConfigStatus | null
  configStatus: string
  configLoading: boolean
  testingProvider: ArticleToolTestProvider | ''
  onSaveConfig: (event: FormEvent<HTMLFormElement>) => void
  onReloadConfig: () => void
  onTestConnection: (provider: ArticleToolTestProvider) => void
}) {
  const logs = config?.logs ?? []
  const imageProviderLabel = config?.imageProvider === 'vertex-ai' ? 'Vertex AI' : 'Imagen'
  return (
    <section className="view-stack tools-module">
      <div className="metric-grid">
        <Metric title="Claude" value={config?.claudeConfigured ? 'OK' : 'Thiếu'} note={config?.claudeModel || 'Chưa cấu hình model'} />
        <Metric title="Imagen" value={config?.geminiConfigured ? 'OK' : 'Thiếu'} note={config?.geminiImageModel || 'Google AI API'} />
        <Metric title="Vertex AI" value={config?.vertexConfigured ? 'OK' : 'Thiếu'} note={config?.vertexRegion || 'us-central1'} />
        <Metric title="Nguồn ảnh" value={imageProviderLabel} note="Mặc định cho công cụ Viết bài" />
      </div>

      <Panel title="Cấu hình Viết bài" action={config?.articleComposerConfigured ? 'Đã sẵn sàng' : 'Thiếu cấu hình'}>
        <form className="tool-config-form" onSubmit={onSaveConfig} key={config?.updatedAt || 'article-tool-config'}>
          <label>
            <span>Nguồn tạo ảnh</span>
            <select name="imageProvider" defaultValue={config?.imageProvider || 'google-ai'} disabled={!canEdit || configLoading}>
              <option value="google-ai">Google AI API / Imagen</option>
              <option value="vertex-ai">Google Cloud Vertex AI</option>
            </select>
          </label>
          <label>
            <span>Claude Gateway base URL</span>
            <input name="claudeGatewayBaseUrl" defaultValue={config?.claudeGatewayBaseUrl || 'https://1gw.gwai.cloud'} disabled={!canEdit || configLoading} />
          </label>
          <label>
            <span>Claude auth header</span>
            <input name="claudeGatewayAuthHeader" defaultValue={config?.claudeGatewayAuthHeader || 'x-api-key'} disabled={!canEdit || configLoading} />
          </label>
          <label>
            <span>Claude model</span>
            <input name="claudeModel" defaultValue={config?.claudeModel || 'claude-3-5-sonnet'} disabled={!canEdit || configLoading} />
          </label>
          <label>
            <span>Claude API key</span>
            <input name="claudeApiKey" type="password" placeholder={config?.claudeConfigured ? 'Đã có key, để trống nếu không đổi' : 'Nhập Claude API key'} disabled={!canEdit || configLoading} />
          </label>
          <label>
            <span>Google AI API base URL</span>
            <input name="geminiApiBaseUrl" defaultValue={config?.geminiApiBaseUrl || 'https://generativelanguage.googleapis.com'} disabled={!canEdit || configLoading} />
          </label>
          <label>
            <span>Imagen image model</span>
            <input name="geminiImageModel" defaultValue={config?.geminiImageModel || 'imagen-4.0-fast-generate-001'} disabled={!canEdit || configLoading} />
          </label>
          <label>
            <span>Google AI API key</span>
            <input name="geminiApiKey" type="password" placeholder={config?.geminiConfigured ? 'Đã có key, để trống nếu không đổi' : 'Nhập Google AI API key'} disabled={!canEdit || configLoading} />
          </label>
          <label>
            <span>Vertex AI Project ID</span>
            <input name="vertexProjectId" defaultValue={config?.vertexProjectId || ''} placeholder="my-google-cloud-project" disabled={!canEdit || configLoading} />
          </label>
          <label>
            <span>Vertex AI Region</span>
            <input name="vertexRegion" defaultValue={config?.vertexRegion || 'us-central1'} placeholder="us-central1" disabled={!canEdit || configLoading} />
          </label>
          <label>
            <span>Vertex AI image model</span>
            <input name="vertexImageModel" defaultValue={config?.vertexImageModel || 'imagen-4.0-fast-generate-001'} disabled={!canEdit || configLoading} />
          </label>
          <label>
            <span>Service Account JSON file</span>
            <input name="vertexCredentialsFile" type="file" accept=".json,application/json" disabled={!canEdit || configLoading} />
          </label>
          <label>
            <span>Service Account JSON paste</span>
            <textarea name="vertexServiceAccountJson" placeholder="Dán nội dung credentials.json nếu không upload file" disabled={!canEdit || configLoading} />
          </label>
          <label>
            <span>Credentials path trên server</span>
            <input name="vertexCredentialsPath" placeholder="Tùy chọn: /path/to/credentials.json" disabled={!canEdit || configLoading} />
          </label>
          <div className="tool-config-checks">
            <label>
              <input name="clearClaudeApiKey" type="checkbox" disabled={!canEdit || configLoading} />
              Xóa Claude key đã lưu
            </label>
            <label>
              <input name="clearGeminiApiKey" type="checkbox" disabled={!canEdit || configLoading} />
              Xóa Google AI key đã lưu
            </label>
            <label>
              <input name="clearVertexCredentials" type="checkbox" disabled={!canEdit || configLoading} />
              Xóa Vertex credentials đã lưu
            </label>
          </div>
          <div className="tool-config-actions">
            <button type="submit" disabled={!canEdit || configLoading}>
              {configLoading ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
            <button className="secondary-button" type="button" onClick={() => onTestConnection('claude')} disabled={!canEdit || configLoading || Boolean(testingProvider)}>
              {testingProvider === 'claude' ? 'Đang kiểm tra Claude...' : 'Kiểm tra Claude'}
            </button>
            <button className="secondary-button" type="button" onClick={() => onTestConnection('gemini')} disabled={!canEdit || configLoading || Boolean(testingProvider)}>
              {testingProvider === 'gemini' ? 'Đang kiểm tra Imagen...' : 'Kiểm tra Imagen'}
            </button>
            <button className="secondary-button" type="button" onClick={() => onTestConnection('vertex')} disabled={!canEdit || configLoading || Boolean(testingProvider)}>
              {testingProvider === 'vertex' ? 'Đang kiểm tra Vertex...' : 'Kiểm tra Vertex'}
            </button>
            <button className="secondary-button" type="button" onClick={onReloadConfig} disabled={configLoading}>
              Tải lại
            </button>
          </div>
        </form>
        <div className="tool-config-status-list">
          <span className={config?.claudeConfigured ? 'ready' : ''}>Claude {config?.claudeConfigured ? 'đã cấu hình' : 'chưa có key'}</span>
          <span className={config?.geminiConfigured ? 'ready' : ''}>Imagen {config?.geminiConfigured ? 'đã cấu hình' : 'chưa có key'}</span>
          <span className={config?.vertexConfigured ? 'ready' : ''}>Vertex AI {config?.vertexConfigured ? 'đã cấu hình' : 'thiếu Project/Region/credentials'}</span>
          <span>Nguồn ảnh: {imageProviderLabel}</span>
          <span>Output: {config?.outputDir || 'SEO_OPS_DB_DIR/tools'}</span>
        </div>
        {configStatus && <p className="tool-status">{configStatus}</p>}
      </Panel>

      <Panel title="Log kết nối & lỗi" action={`${logs.length} dòng`}>
        {logs.length === 0 ? (
          <EmptyState title="Chưa có log" text="Bấm Kiểm tra Claude, Kiểm tra Imagen, Kiểm tra Vertex hoặc chạy Viết bài để ghi log kết quả và lỗi API tại đây." />
        ) : (
          <div className="tool-log-list">
            {logs.map((log) => (
              <article className={`tool-log-card ${log.status}`} key={log.id}>
                <div>
                  <strong>{log.message}</strong>
                  <small>{formatDateTime(log.at)} · {log.action}</small>
                </div>
                {log.details.length > 0 && (
                  <div className="tool-log-details">
                    {log.details.map((detail, index) => (
                      <span className={detail.ok ? 'ready' : 'error'} key={`${log.id}-${detail.provider}-${index}`}>
                        {detail.provider}: {detail.message}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </Panel>
    </section>
  )
}

function BacklinkModule({
  activeProject,
  sources,
  backlinks,
  plans,
  costs,
  users,
  tab,
  canEdit,
  liveCount,
  errorCount,
  indexedCount,
  referringDomainCount,
  totalCost,
  averageScore,
  onTab,
  onAddSource,
  onAddBacklink,
  onUpdateBacklink,
  onCheckBacklink,
  onAddPlan,
  onUpdatePlan,
  onAddCost,
  onExport,
}: {
  activeProject?: Project
  sources: SeoBacklinkSource[]
  backlinks: SeoBacklink[]
  plans: SeoBacklinkPlan[]
  costs: SeoBacklinkCost[]
  users: User[]
  tab: BacklinkTab
  canEdit: boolean
  liveCount: number
  errorCount: number
  indexedCount: number
  referringDomainCount: number
  totalCost: number
  averageScore: number
  onTab: (tab: BacklinkTab) => void
  onAddSource: (event: FormEvent<HTMLFormElement>) => void
  onAddBacklink: (event: FormEvent<HTMLFormElement>) => void
  onUpdateBacklink: (backlinkId: string, updates: Partial<SeoBacklink>) => void
  onCheckBacklink: (backlinkId: string) => void
  onAddPlan: (event: FormEvent<HTMLFormElement>) => void
  onUpdatePlan: (planId: string, status: BacklinkPlanStatus) => void
  onAddCost: (event: FormEvent<HTMLFormElement>) => void
  onExport: (reportType: 'internal' | 'client') => void
}) {
  if (!activeProject) {
    return (
      <section className="view-stack">
        <EmptyState title="Chưa có dự án SEO" text="Tạo hoặc chọn dự án trước khi quản lý backlink." />
      </section>
    )
  }

  const anchorGroups = backlinkAnchorTypes.map((type) => {
    const items = backlinks.filter((backlink) => backlink.anchorType === type)
    return { type, count: items.length, rate: backlinks.length ? (items.length / backlinks.length) * 100 : 0 }
  })

  return (
    <section className="view-stack">
      <div className="metric-grid">
        <Metric title="Tổng backlink" value={backlinks.length} note={`${liveCount} link live`} />
        <Metric title="Backlink lỗi" value={errorCount} note="Mất link / 404 / sai anchor" />
        <Metric title="Đã index" value={indexedCount} note={`${referringDomainCount} referring domain`} />
        <Metric title="Chi phí" value={currency.format(totalCost)} note={`Score TB ${averageScore.toFixed(1)} - ${backlinkScoreRank(averageScore)}`} />
      </div>

      <Panel title="Điều hướng Backlink" action={activeProject.name}>
        <div className="entity-tabs">
          {backlinkTabs.map((item) => (
            <button className={tab === item.id ? 'active' : ''} type="button" key={item.id} onClick={() => onTab(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </Panel>

      {tab === 'overview' && (
        <div className="dashboard-grid">
          <Panel title="Tổng quan Backlink" action={backlinkScoreRank(averageScore)}>
            <BarChart
              items={[
                { label: 'Live', value: liveCount, color: '#0f766e' },
                { label: 'Index', value: indexedCount, color: '#2563eb' },
                { label: 'Dofollow', value: backlinks.filter((item) => item.linkType === 'Dofollow').length, color: '#16a34a' },
                { label: 'Lỗi', value: errorCount, color: '#dc2626' },
              ]}
            />
          </Panel>
          <Panel title="Chỉ số nguồn" action={`${referringDomainCount} domain`}>
            <div className="project-detail">
              <Detail label="Dofollow" value={`${backlinks.filter((item) => item.linkType === 'Dofollow').length}`} />
              <Detail label="Nofollow" value={`${backlinks.filter((item) => item.linkType === 'Nofollow').length}`} />
              <Detail label="Redirect" value={`${backlinks.filter((item) => item.linkType === 'Redirect').length}`} />
              <Detail label="Chưa index" value={`${backlinks.filter((item) => item.indexStatus !== 'Đã index').length}`} />
            </div>
          </Panel>
        </div>
      )}

      {tab === 'sources' && (
        <>
          <Panel title="Thêm nguồn Backlink" action={canEdit ? 'Kho nguồn dùng chung' : 'Chỉ xem'}>
            <form className="backlink-source-form" onSubmit={onAddSource}>
              <input name="name" placeholder="Tên nguồn" required disabled={!canEdit} />
              <input name="domain" placeholder="Domain" required disabled={!canEdit} />
              <input name="contactUrl" placeholder="URL liên hệ" disabled={!canEdit} />
              <select name="sourceType" disabled={!canEdit}>{backlinkSourceTypes.map((item) => <option key={item}>{item}</option>)}</select>
              <input name="topic" placeholder="Chủ đề" disabled={!canEdit} />
              <input name="country" placeholder="Quốc gia" defaultValue="Việt Nam" disabled={!canEdit} />
              <input name="language" placeholder="Ngôn ngữ" defaultValue="Tiếng Việt" disabled={!canEdit} />
              <input name="da" placeholder="DA" type="number" min="0" disabled={!canEdit} />
              <input name="dr" placeholder="DR" type="number" min="0" disabled={!canEdit} />
              <input name="ur" placeholder="UR" type="number" min="0" disabled={!canEdit} />
              <input name="estimatedTraffic" placeholder="Traffic ước tính" type="number" min="0" disabled={!canEdit} />
              <input name="spamScore" placeholder="Spam Score" type="number" min="0" disabled={!canEdit} />
              <select name="defaultLinkType" disabled={!canEdit}>{backlinkLinkTypes.map((item) => <option key={item}>{item}</option>)}</select>
              <input name="price" placeholder="Giá đặt link" type="number" min="0" disabled={!canEdit} />
              <input name="currency" placeholder="Tiền tệ" defaultValue="VND" disabled={!canEdit} />
              <input name="linkDuration" placeholder="Thời hạn link" defaultValue="Vĩnh viễn" disabled={!canEdit} />
              <select name="status" disabled={!canEdit}>{backlinkSourceStatuses.map((item) => <option key={item}>{item}</option>)}</select>
              <label><input name="allowEdit" type="checkbox" disabled={!canEdit} /> Có được sửa bài</label>
              <label><input name="allowAnchorChange" type="checkbox" disabled={!canEdit} /> Có được thay anchor</label>
              <input name="note" placeholder="Ghi chú" disabled={!canEdit} />
              <button type="submit" disabled={!canEdit}>Thêm nguồn</button>
            </form>
          </Panel>
          <BacklinkSourceTable sources={sources} />
        </>
      )}

      {tab === 'links' && (
        <>
          <Panel title="Thêm Backlink đã triển khai" action={canEdit ? activeProject.name : 'Chỉ xem'}>
            <form className="backlink-form" onSubmit={onAddBacklink}>
              <select name="sourceId" disabled={!canEdit}>{sources.map((source) => <option value={source.id} key={source.id}>{source.name}</option>)}</select>
              <input name="sourceUrl" placeholder="URL nguồn" required disabled={!canEdit} />
              <input name="sourceDomain" placeholder="Domain nguồn" disabled={!canEdit} />
              <input name="targetUrl" placeholder="URL đích" defaultValue={activeProject.website} required disabled={!canEdit} />
              <input name="anchorText" placeholder="Anchor text" disabled={!canEdit} />
              <select name="anchorType" disabled={!canEdit}>{backlinkAnchorTypes.map((item) => <option key={item}>{item}</option>)}</select>
              <select name="linkType" disabled={!canEdit}>{backlinkLinkTypes.map((item) => <option key={item}>{item}</option>)}</select>
              <select name="backlinkType" disabled={!canEdit}>{backlinkTypes.map((item) => <option key={item}>{item}</option>)}</select>
              <select name="linkPosition" disabled={!canEdit}>{backlinkPositions.map((item) => <option key={item}>{item}</option>)}</select>
              <select name="assigneeId" disabled={!canEdit}>{users.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select>
              <input name="placedAt" type="date" aria-label="Ngày đặt link" disabled={!canEdit} />
              <input name="expiredAt" type="date" aria-label="Ngày hết hạn" disabled={!canEdit} />
              <input name="cost" placeholder="Chi phí" type="number" min="0" disabled={!canEdit} />
              <input name="currency" placeholder="Tiền tệ" defaultValue="VND" disabled={!canEdit} />
              <select name="deploymentStatus" disabled={!canEdit}>{backlinkDeploymentStatuses.map((item) => <option key={item}>{item}</option>)}</select>
              <select name="approvalStatus" disabled={!canEdit}>{backlinkApprovalStatuses.map((item) => <option key={item}>{item}</option>)}</select>
              <select name="paymentStatus" disabled={!canEdit}>{backlinkPaymentStatuses.map((item) => <option key={item}>{item}</option>)}</select>
              <input name="note" placeholder="Ghi chú" disabled={!canEdit} />
              <button type="submit" disabled={!canEdit}>Lưu Backlink</button>
            </form>
          </Panel>
          <BacklinkTable backlinks={backlinks} sources={sources} users={users} canEdit={canEdit} onUpdate={onUpdateBacklink} onCheck={onCheckBacklink} />
        </>
      )}

      {tab === 'plans' && (
        <>
          <Panel title="Lập kế hoạch đi backlink" action={canEdit ? activeProject.name : 'Chỉ xem'}>
            <form className="backlink-plan-form" onSubmit={onAddPlan}>
              <input name="targetUrl" placeholder="URL cần SEO" defaultValue={activeProject.website} disabled={!canEdit} />
              <input name="targetKeyword" placeholder="Từ khóa mục tiêu" required disabled={!canEdit} />
              <select name="backlinkType" disabled={!canEdit}>{backlinkTypes.map((item) => <option key={item}>{item}</option>)}</select>
              <input name="plannedAnchor" placeholder="Anchor dự kiến" disabled={!canEdit} />
              <input name="plannedQuantity" placeholder="Số backlink dự kiến" type="number" min="1" defaultValue="1" disabled={!canEdit} />
              <input name="plannedDate" type="date" aria-label="Ngày dự kiến" defaultValue={defaultTaskDeadlineInput().slice(0, 10)} disabled={!canEdit} />
              <select name="assigneeId" disabled={!canEdit}>{users.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select>
              <input name="note" placeholder="Ghi chú" disabled={!canEdit} />
              <button type="submit" disabled={!canEdit}>Thêm kế hoạch</button>
            </form>
          </Panel>
          <BacklinkPlanTable plans={plans} users={users} canEdit={canEdit} onUpdatePlan={onUpdatePlan} />
        </>
      )}

      {tab === 'anchors' && (
        <Panel title="Quản lý Anchor Text" action={`${backlinks.length} backlink`}>
          <div className="progress-list">
            {anchorGroups.map((anchor) => (
              <ProgressRow key={anchor.type} label={anchor.type} value={anchor.rate} meta={`${anchor.count} anchor`} />
            ))}
          </div>
          {(anchorGroups.find((item) => item.type === 'Exact match')?.rate ?? 0) > 35 && (
            <p className="entity-import-status">Cảnh báo: Exact match đang cao hơn 35%, nên cân bằng thêm brand, URL trần hoặc generic.</p>
          )}
        </Panel>
      )}

      {tab === 'check' && (
        <Panel title="Check Backlink" action="Live / Anchor / Index">
          <BacklinkTable backlinks={backlinks} sources={sources} users={users} canEdit={canEdit} onUpdate={onUpdateBacklink} onCheck={onCheckBacklink} compact />
        </Panel>
      )}

      {tab === 'costs' && (
        <>
          <Panel title="Thêm chi phí Backlink" action={currency.format(totalCost)}>
            <form className="backlink-cost-form" onSubmit={onAddCost}>
              <select name="backlinkId" disabled={!canEdit}>{backlinks.map((backlink) => <option value={backlink.id} key={backlink.id}>{backlink.sourceDomain || backlink.sourceUrl}</option>)}</select>
              <select name="sourceId" disabled={!canEdit}>{sources.map((source) => <option value={source.id} key={source.id}>{source.name}</option>)}</select>
              <select name="costType" disabled={!canEdit}>{backlinkCostTypes.map((item) => <option key={item}>{item}</option>)}</select>
              <input name="amount" placeholder="Số tiền" type="number" min="0" required disabled={!canEdit} />
              <input name="currency" placeholder="Tiền tệ" defaultValue="VND" disabled={!canEdit} />
              <select name="paidBy" disabled={!canEdit}>{users.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select>
              <input name="paidAt" type="date" aria-label="Ngày thanh toán" disabled={!canEdit} />
              <select name="paymentStatus" disabled={!canEdit}>{backlinkPaymentStatuses.map((item) => <option key={item}>{item}</option>)}</select>
              <input name="invoiceUrl" placeholder="Hóa đơn / ảnh xác nhận URL" disabled={!canEdit} />
              <input name="note" placeholder="Ghi chú" disabled={!canEdit} />
              <button type="submit" disabled={!canEdit}>Lưu chi phí</button>
            </form>
          </Panel>
          <BacklinkCostTable costs={costs} backlinks={backlinks} sources={sources} users={users} />
        </>
      )}

      {tab === 'reports' && (
        <Panel title="Báo cáo Backlink" action={activeProject.name}>
          <div className="report-actions">
            <button type="button" onClick={() => onExport('internal')}>Xuất báo cáo nội bộ CSV</button>
            <button type="button" onClick={() => onExport('client')}>Xuất báo cáo khách hàng CSV</button>
          </div>
        </Panel>
      )}
    </section>
  )
}

function BacklinkSourceTable({ sources }: { sources: SeoBacklinkSource[] }) {
  return (
    <Panel title="Kho nguồn Backlink" action={`${sources.length} nguồn`}>
      <div className="table-wrap">
        <table className="backlink-source-table">
          <thead>
            <tr>
              <th>Nguồn</th>
              <th>Domain</th>
              <th>Loại</th>
              <th>Chủ đề</th>
              <th>DA/DR/UR</th>
              <th>Traffic</th>
              <th>Spam</th>
              <th>Link type</th>
              <th>Giá</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td>{source.name}</td>
                <td>{source.domain}</td>
                <td>{source.sourceType}</td>
                <td>{source.topic}</td>
                <td>{source.da}/{source.dr}/{source.ur}</td>
                <td>{source.estimatedTraffic.toLocaleString('vi-VN')}</td>
                <td>{source.spamScore}</td>
                <td>{source.defaultLinkType}</td>
                <td>{currency.format(source.price)}</td>
                <td>{source.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function BacklinkTable({
  backlinks,
  sources,
  users,
  canEdit,
  compact,
  onUpdate,
  onCheck,
}: {
  backlinks: SeoBacklink[]
  sources: SeoBacklinkSource[]
  users: User[]
  canEdit: boolean
  compact?: boolean
  onUpdate: (backlinkId: string, updates: Partial<SeoBacklink>) => void
  onCheck: (backlinkId: string) => void
}) {
  if (backlinks.length === 0) {
    return <EmptyState title="Chưa có backlink" text="Thêm backlink đã triển khai để theo dõi live, index, anchor và chi phí." />
  }

  return (
    <div className="table-wrap">
      <table className="backlink-table">
        <thead>
          <tr>
            <th>URL nguồn</th>
            <th>URL đích</th>
            <th>Anchor</th>
            {!compact && <th>Nguồn</th>}
            {!compact && <th>Nhân sự</th>}
            <th>Link</th>
            <th>Index</th>
            <th>Duyệt</th>
            <th>Score</th>
            <th>Check</th>
          </tr>
        </thead>
        <tbody>
          {backlinks.map((backlink) => (
            <tr key={backlink.id}>
              <td>
                {backlink.sourceUrl ? <a href={backlink.sourceUrl} target="_blank" rel="noreferrer">{backlink.sourceDomain || backlink.sourceUrl}</a> : 'Chưa có URL'}
                {backlink.lastCheckedAt && <small className="entity-link-note">Check: {formatDateTime(backlink.lastCheckedAt)}</small>}
              </td>
              <td>{backlink.targetUrl}</td>
              <td>{backlink.anchorText}<small className="entity-link-note">{backlink.anchorType}</small></td>
              {!compact && <td>{sources.find((source) => source.id === backlink.sourceId)?.name ?? backlink.sourceDomain}</td>}
              {!compact && <td>{users.find((user) => user.id === backlink.assigneeId)?.name ?? 'Chưa gán'}</td>}
              <td>
                <select value={backlink.linkStatus} onChange={(event) => onUpdate(backlink.id, { linkStatus: event.target.value as BacklinkLinkStatus })} disabled={!canEdit}>
                  {backlinkLinkStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </td>
              <td>
                <select value={backlink.indexStatus} onChange={(event) => onUpdate(backlink.id, { indexStatus: event.target.value as BacklinkIndexStatus })} disabled={!canEdit}>
                  {backlinkIndexStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </td>
              <td>
                <select value={backlink.approvalStatus} onChange={(event) => onUpdate(backlink.id, { approvalStatus: event.target.value as BacklinkApprovalStatus })} disabled={!canEdit}>
                  {backlinkApprovalStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </td>
              <td>{backlink.backlinkScore || calculateBacklinkScore(backlink, sources.find((source) => source.id === backlink.sourceId))}</td>
              <td>
                <button className="secondary-button" type="button" onClick={() => onCheck(backlink.id)} disabled={!canEdit}>Check</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BacklinkPlanTable({ plans, users, canEdit, onUpdatePlan }: { plans: SeoBacklinkPlan[]; users: User[]; canEdit: boolean; onUpdatePlan: (planId: string, status: BacklinkPlanStatus) => void }) {
  return (
    <Panel title="Kế hoạch đi link" action={`${plans.length} kế hoạch`}>
      <div className="table-wrap">
        <table className="backlink-plan-table">
          <thead>
            <tr>
              <th>URL cần SEO</th>
              <th>Từ khóa</th>
              <th>Loại</th>
              <th>Anchor</th>
              <th>Số lượng</th>
              <th>Ngày dự kiến</th>
              <th>Nhân sự</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.targetUrl}</td>
                <td>{plan.targetKeyword}</td>
                <td>{plan.backlinkType}</td>
                <td>{plan.plannedAnchor}</td>
                <td>{plan.plannedQuantity}</td>
                <td>{formatDateOnly(plan.plannedDate)}</td>
                <td>{users.find((user) => user.id === plan.assigneeId)?.name ?? 'Chưa gán'}</td>
                <td>
                  <select value={plan.status} onChange={(event) => onUpdatePlan(plan.id, event.target.value as BacklinkPlanStatus)} disabled={!canEdit}>
                    {backlinkPlanStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function BacklinkCostTable({ costs, backlinks, sources, users }: { costs: SeoBacklinkCost[]; backlinks: SeoBacklink[]; sources: SeoBacklinkSource[]; users: User[] }) {
  return (
    <Panel title="Chi phí Backlink" action={`${costs.length} khoản`}>
      <div className="table-wrap">
        <table className="backlink-cost-table">
          <thead>
            <tr>
              <th>Loại chi phí</th>
              <th>Nguồn</th>
              <th>Backlink</th>
              <th>Số tiền</th>
              <th>Người thanh toán</th>
              <th>Ngày thanh toán</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {costs.map((cost) => {
              const backlink = backlinks.find((item) => item.id === cost.backlinkId)
              return (
                <tr key={cost.id}>
                  <td>{cost.costType}</td>
                  <td>{sources.find((source) => source.id === cost.sourceId)?.name ?? backlink?.sourceDomain ?? 'Chưa chọn'}</td>
                  <td>{backlink?.sourceUrl ?? 'Không gắn backlink'}</td>
                  <td>{currency.format(cost.amount)}</td>
                  <td>{users.find((user) => user.id === cost.paidBy)?.name ?? 'Chưa chọn'}</td>
                  <td>{formatDateOnly(cost.paidAt)}</td>
                  <td>{cost.paymentStatus}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function EntityModule({
  activeProject,
  activeEntity,
  projectEntities,
  entityPlatforms,
  activeEntityLinks,
  tasks,
  entityGuideScanHistory,
  activeEntityChecklist,
  activeEntitySchema,
  entityTab,
  selectedEntityId,
  users,
  canEdit,
  entityScore,
  liveLinks,
  indexedLinks,
  napOkLinks,
  importStatus,
  editingPlatform,
  rememberedCredential,
  selectedLinkIds,
  onTab,
  onSelectEntity,
  onNewEntity,
  onSaveEntity,
  onDeleteEntity,
  onAddPlatform,
  onEditPlatform,
  onCreateLinkFromPlatform,
  onCreateLinksFromPlatforms,
  onDeletePlatforms,
  onCancelEditPlatform,
  onImportPlatformSheet,
  onImportPlatformFile,
  onScanEntityGuides,
  onAddLink,
  onCredentialChange,
  onUpdateLink,
  onDeleteLink,
  onCheckLink,
  onToggleLinkSelect,
  onSelectIncompleteLinks,
  onSendLinkTasks,
  onToggleChecklist,
  onGenerateSchema,
  onExportReport,
  onOpenGuide,
}: {
  activeProject?: Project
  activeEntity?: SeoEntity
  projectEntities: SeoEntity[]
  entityPlatforms: SeoEntityPlatform[]
  activeEntityLinks: SeoEntityLink[]
  tasks: Task[]
  entityGuideScanHistory: EntityGuideScanRecord[]
  activeEntityChecklist: SeoEntityChecklistItem[]
  activeEntitySchema?: SeoEntitySchema
  entityTab: EntityTab
  selectedEntityId: string
  users: User[]
  canEdit: boolean
  entityScore: number
  liveLinks: number
  indexedLinks: number
  napOkLinks: number
  importStatus: string
  editingPlatform?: SeoEntityPlatform
  rememberedCredential: EntityLinkCredential
  selectedLinkIds: Set<string>
  onTab: (tab: EntityTab) => void
  onSelectEntity: (entityId: string) => void
  onNewEntity: () => void
  onSaveEntity: (event: FormEvent<HTMLFormElement>) => void
  onDeleteEntity: (entityId: string) => void
  onAddPlatform: (event: FormEvent<HTMLFormElement>) => void
  onEditPlatform: (platformId: string) => void
  onCreateLinkFromPlatform: (platformId: string) => void
  onCreateLinksFromPlatforms: (platformIds: string[]) => boolean
  onDeletePlatforms: (platformIds: string[]) => boolean
  onCancelEditPlatform: () => void
  onImportPlatformSheet: (event: FormEvent<HTMLFormElement>) => void
  onImportPlatformFile: (event: ChangeEvent<HTMLInputElement>) => void
  onScanEntityGuides: () => void
  onAddLink: (event: FormEvent<HTMLFormElement>) => void
  onCredentialChange: (updates: Partial<EntityLinkCredential>) => void
  onUpdateLink: (linkId: string, updates: Partial<SeoEntityLink>) => void
  onDeleteLink: (linkId: string) => void
  onCheckLink: (linkId: string) => void
  onToggleLinkSelect: (linkId: string) => void
  onSelectIncompleteLinks: () => void
  onSendLinkTasks: (event: FormEvent<HTMLFormElement>) => void
  onToggleChecklist: (itemId: string) => void
  onGenerateSchema: () => void
  onExportReport: (reportType: 'internal' | 'client' | 'score') => void
  onOpenGuide: (reference: string) => void
}) {
  const defaultPendingAssigneeId = users.find((user) => user.role === 'Quản trị viên')?.id ?? users[0]?.id ?? ''
  const [pendingLinkAssigneeId, setPendingLinkAssigneeId] = useState(defaultPendingAssigneeId)
  const userIdsSignature = users.map((user) => user.id).join('|')

  useEffect(() => {
    if (!defaultPendingAssigneeId) return
    if (!pendingLinkAssigneeId || !users.some((user) => user.id === pendingLinkAssigneeId)) {
      setPendingLinkAssigneeId(defaultPendingAssigneeId)
    }
  }, [defaultPendingAssigneeId, pendingLinkAssigneeId, userIdsSignature, users])

  if (!activeProject) {
    return (
      <section className="view-stack">
        <EmptyState title="Chưa có dự án SEO" text="Tạo hoặc chọn dự án trước khi quản lý SEO Entity." />
      </section>
    )
  }

  const activeEntityId = activeEntity?.id ?? ''
  const allPendingEntityLinks = activeEntityLinks.filter((link) => !link.liveUrl.trim())
  const selectedPendingAssignee = users.find((user) => user.id === pendingLinkAssigneeId)
  const selectedPendingAssigneeIsAdmin = selectedPendingAssignee?.role === 'Quản trị viên'
  const pendingEntityLinks = selectedPendingAssigneeIsAdmin
    ? allPendingEntityLinks
    : allPendingEntityLinks.filter((link) => {
        const linkedTask = link.taskId ? tasks.find((task) => task.id === link.taskId) : undefined
        return Boolean(link.taskId && pendingLinkAssigneeId && (linkedTask?.assigneeId === pendingLinkAssigneeId || link.assigneeId === pendingLinkAssigneeId))
      })
  const firstPendingEntityLink = pendingEntityLinks[0]
  const setEntityLinkFormField = (form: HTMLFormElement | null, name: string, value: string) => {
    const field = form?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
    if (field) field.value = value
  }
  const setEntityLinkFormDefaults = (form: HTMLFormElement | null, link?: SeoEntityLink) => {
    if (!form || !link) return
    setEntityLinkFormField(form, 'targetUrl', entityTargetUrlOf(activeEntity, activeProject))
    setEntityLinkFormField(form, 'anchorText', entityAnchorTextOf(activeEntity))
    setEntityLinkFormField(form, 'displayName', entityDisplayNameOf(activeEntity))
    setEntityLinkFormField(form, 'usedDescription', entityUsedDescriptionOf(activeEntity))
    setEntityLinkFormField(form, 'assigneeId', link.assigneeId)
  }
  const syncEntityLinkProfileDefaults = (form: HTMLFormElement | null) => {
    if (!form || !activeEntity) return
    setEntityLinkFormField(form, 'targetUrl', entityTargetUrlOf(activeEntity, activeProject))
    setEntityLinkFormField(form, 'anchorText', entityAnchorTextOf(activeEntity))
    setEntityLinkFormField(form, 'displayName', entityDisplayNameOf(activeEntity))
    setEntityLinkFormField(form, 'usedDescription', entityUsedDescriptionOf(activeEntity))
  }
  const entityDefaultCredential = {
    loginAccount: activeEntity?.defaultAccountId ?? '',
    loginPassword: activeEntity?.defaultAccountPassword ?? '',
    loginEmail: activeEntity?.defaultAccountEmail ?? '',
    accountUsed: activeEntity?.defaultAccountId ?? activeEntity?.defaultAccountEmail ?? '',
  }
  const hasEntityDefaultCredential = Boolean(
    entityDefaultCredential.loginAccount ||
    entityDefaultCredential.loginPassword ||
    entityDefaultCredential.loginEmail,
  )
  const applyEntityDefaultCredential = (checked: boolean) => {
    onCredentialChange({
      useDefaultEntityAccount: checked,
      ...(checked ? entityDefaultCredential : {}),
    })
  }

  return (
    <section className="view-stack">
      <div className="metric-grid">
        <Metric title="Entity Score" value={entityScore} note={entityScoreRank(entityScore)} />
        <Metric title="Link live" value={liveLinks} note={`${activeEntityLinks.length} link đang quản lý`} />
        <Metric title="Đã index" value={indexedLinks} note="Theo trạng thái đã ghi nhận" />
        <Metric title="NAP đúng" value={napOkLinks} note="Tên, SĐT, địa chỉ đồng bộ" />
      </div>

      <Panel title="Điều hướng SEO Entity" action={activeProject.name}>
        <div className="entity-toolbar">
          <select value={selectedEntityId === 'new' ? 'new' : activeEntityId} onChange={(event) => onSelectEntity(event.target.value)}>
            <option value="new">Tạo hồ sơ Entity mới</option>
            {projectEntities.map((entity) => (
              <option value={entity.id} key={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
          <button className="secondary-button" type="button" onClick={onNewEntity} disabled={!canEdit}>
            Tạo mới
          </button>
        </div>
        <div className="entity-tabs">
          {entityTabs.map((tab) => (
            <button className={entityTab === tab.id ? 'active' : ''} type="button" key={tab.id} onClick={() => onTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      </Panel>

      {entityTab === 'overview' && (
        <div className="dashboard-grid">
          <Panel title="Tổng quan Entity" action={activeEntity?.status ?? 'Chưa có hồ sơ'}>
            {activeEntity ? (
              <div className="project-detail">
                <Detail label="Tên chuẩn" value={activeEntity.officialName || activeEntity.name} />
                <Detail label="Loại entity" value={activeEntity.entityType} />
                <Detail label="Website chính" value={field(activeEntity.website)} />
                <Detail label="Ngành nghề" value={field(activeEntity.industry)} />
                <Detail label="SĐT" value={field(activeEntity.phone)} />
                <Detail label="Địa chỉ" value={field(activeEntity.address)} />
              </div>
            ) : (
              <EmptyState title="Chưa có hồ sơ Entity" text="Tạo hồ sơ entity chuẩn để bắt đầu quản lý nền tảng, link và schema." />
            )}
          </Panel>
          <Panel title="Tình trạng triển khai" action={entityScoreRank(entityScore)}>
            <BarChart
              items={[
                { label: 'Live', value: liveLinks, color: '#0f766e' },
                { label: 'Index', value: indexedLinks, color: '#2563eb' },
                { label: 'NAP đúng', value: napOkLinks, color: '#16a34a' },
                { label: 'Lỗi', value: activeEntityLinks.filter((link) => ['404', '403', 'Mất link'].includes(link.linkStatus)).length, color: '#dc2626' },
              ]}
            />
          </Panel>
        </div>
      )}

      {entityTab === 'profile' && (
        <Panel title={activeEntity ? 'Hồ sơ Entity' : 'Tạo hồ sơ Entity'} action={canEdit ? 'Thông tin chuẩn NAP' : 'Chỉ xem'}>
          <form className="entity-profile-form" onSubmit={onSaveEntity} key={activeEntity?.id ?? 'new-entity'}>
            <input name="name" placeholder="Tên entity *" defaultValue={activeEntity?.name ?? ''} required disabled={!canEdit} />
            <input name="officialName" placeholder="Tên chuẩn" defaultValue={activeEntity?.officialName ?? ''} disabled={!canEdit} />
            <input name="alternativeNames" placeholder="Tên thay thế" defaultValue={activeEntity?.alternativeNames ?? ''} disabled={!canEdit} />
            <select name="entityType" defaultValue={activeEntity?.entityType ?? 'Brand'} disabled={!canEdit}>
              {entityTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <input name="website" placeholder="Website chính" defaultValue={activeEntity?.website ?? activeProject.website} disabled={!canEdit} />
            <input name="logoUrl" placeholder="Logo URL" defaultValue={activeEntity?.logoUrl ?? ''} disabled={!canEdit} />
            <input name="coverUrl" placeholder="Ảnh bìa URL" defaultValue={activeEntity?.coverUrl ?? ''} disabled={!canEdit} />
            <input name="industry" placeholder="Ngành nghề" defaultValue={activeEntity?.industry ?? ''} disabled={!canEdit} />
            <input name="countryLanguage" placeholder="Quốc gia / ngôn ngữ" defaultValue={activeEntity?.countryLanguage ?? 'Việt Nam / Tiếng Việt'} disabled={!canEdit} />
            <input name="phone" placeholder="SĐT" defaultValue={activeEntity?.phone ?? ''} disabled={!canEdit} />
            <input name="email" placeholder="Email" type="email" defaultValue={activeEntity?.email ?? ''} disabled={!canEdit} />
            <input name="address" placeholder="Địa chỉ" defaultValue={activeEntity?.address ?? ''} disabled={!canEdit} />
            <input name="mapsUrl" placeholder="Google Maps URL" defaultValue={activeEntity?.mapsUrl ?? ''} disabled={!canEdit} />
            <select name="status" defaultValue={activeEntity?.status ?? 'Đang dùng'} disabled={!canEdit}>
              {entityStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            <fieldset className="entity-account-fieldset">
              <legend>Thông tin tài khoản Google</legend>
              <input name="googleAccountEmail" placeholder="Email Google" type="email" defaultValue={activeEntity?.googleAccountEmail ?? ''} disabled={!canEdit} />
              <input name="googleAccountPassword" placeholder="Mật khẩu Google" type="text" autoComplete="off" defaultValue={activeEntity?.googleAccountPassword ?? ''} disabled={!canEdit} />
              <input name="googleAccountPhone" placeholder="Số điện thoại" defaultValue={activeEntity?.googleAccountPhone ?? ''} disabled={!canEdit} />
              <input name="googleBackupAccount" placeholder="Tài khoản backup" defaultValue={activeEntity?.googleBackupAccount ?? ''} disabled={!canEdit} />
              <input name="googleTwoFactorCode" placeholder="Mã 2FA" type="text" autoComplete="off" defaultValue={activeEntity?.googleTwoFactorCode ?? ''} disabled={!canEdit} />
            </fieldset>
            <fieldset className="entity-account-fieldset">
              <legend>Tài khoản mặc định</legend>
              <input name="defaultAccountId" placeholder="Tài khoản (ID)" defaultValue={activeEntity?.defaultAccountId ?? ''} disabled={!canEdit} />
              <input name="defaultAccountPassword" placeholder="Mật khẩu" type="text" autoComplete="off" defaultValue={activeEntity?.defaultAccountPassword ?? ''} disabled={!canEdit} />
              <input name="defaultAccountEmail" placeholder="Email" type="email" defaultValue={activeEntity?.defaultAccountEmail ?? ''} disabled={!canEdit} />
            </fieldset>
            <div className="entity-profile-text-grid">
              <label className="entity-profile-text-field">
                <span>Mô tả ngắn - Text raw</span>
                <textarea name="shortDescription" placeholder="Mô tả ngắn dạng text" defaultValue={activeEntity?.shortDescription ?? ''} disabled={!canEdit} />
              </label>
              <label className="entity-profile-text-field">
                <span>Mô tả ngắn - HTML raw</span>
                <textarea name="shortDescriptionHtml" placeholder="<p>Mô tả ngắn dạng HTML</p>" defaultValue={activeEntity?.shortDescriptionHtml ?? ''} disabled={!canEdit} />
              </label>
            </div>
            <div className="entity-profile-text-grid">
              <label className="entity-profile-text-field">
                <span>Mô tả dài - Text raw</span>
                <textarea name="longDescription" placeholder="Mô tả dài dạng text" defaultValue={activeEntity?.longDescription ?? ''} disabled={!canEdit} />
              </label>
              <label className="entity-profile-text-field">
                <span>Mô tả dài - HTML raw</span>
                <textarea name="longDescriptionHtml" placeholder="<section>Mô tả dài dạng HTML</section>" defaultValue={activeEntity?.longDescriptionHtml ?? ''} disabled={!canEdit} />
              </label>
            </div>
            <div className="entity-profile-text-grid">
              <label className="entity-profile-text-field">
                <span>Anchor Text - Text raw</span>
                <textarea name="anchorText" placeholder="Anchor text dùng khi triển khai Entity" defaultValue={activeEntity?.anchorText ?? ''} disabled={!canEdit} />
              </label>
              <label className="entity-profile-text-field">
                <span>Anchor Text - HTML raw</span>
                <textarea name="anchorTextHtml" placeholder="<strong>Anchor text</strong>" defaultValue={activeEntity?.anchorTextHtml ?? ''} disabled={!canEdit} />
              </label>
            </div>
            <button type="submit" disabled={!canEdit}>{activeEntity ? 'Cập nhật hồ sơ Entity' : 'Tạo hồ sơ Entity'}</button>
            {activeEntity && (
              <button className="danger-button" type="button" onClick={() => onDeleteEntity(activeEntity.id)} disabled={!canEdit}>
                Xóa Entity
              </button>
            )}
          </form>
        </Panel>
      )}

      {entityTab === 'platforms' && (
        <>
          <Panel title="Import nền tảng Entity" action="Google Sheet / Excel">
            <div className="entity-import-grid">
              <form className="entity-import-form" onSubmit={onImportPlatformSheet}>
                <input name="sheetUrl" placeholder="Google Sheet public URL hoặc CSV URL" disabled={!canEdit} />
                <button type="submit" disabled={!canEdit}>Import từ Google Sheet</button>
              </form>
              <label className="entity-file-import">
                <span>Import file Excel / CSV</span>
                <input type="file" accept=".xlsx,.xls,.csv,.tsv" onChange={onImportPlatformFile} disabled={!canEdit} />
              </label>
            </div>
            <p className="entity-import-hint">
              Hỗ trợ chuẩn CSV: STT, Tên Website, Mô tả, DA Score, Link Type, Tên File HTML. Nếu có cột Nhóm hệ thống cũng tự nhận; Domain có thể lấy tự động từ phần mô tả trong ngoặc.
            </p>
            {importStatus && <p className="entity-import-status">{importStatus}</p>}
          </Panel>
          <Panel title={editingPlatform ? 'Sửa nền tảng Entity' : 'Thêm nền tảng Entity'} action={canEdit ? 'Kho nền tảng dùng chung' : 'Chỉ xem'}>
            <form className="entity-platform-form" onSubmit={onAddPlatform} key={editingPlatform?.id ?? 'new-entity-platform'}>
              <label className="entity-platform-field">
                <span>Tên nền tảng</span>
                <input name="name" placeholder="Ví dụ: Medium" defaultValue={editingPlatform?.name ?? ''} required disabled={!canEdit} />
              </label>
              <label className="entity-platform-field">
                <span>Domain</span>
                <input name="domain" placeholder="medium.com" defaultValue={editingPlatform?.domain ?? ''} required disabled={!canEdit} />
              </label>
              <label className="entity-platform-field entity-platform-description-field">
                <span>Mô tả</span>
                <textarea name="description" placeholder="Mô tả ngắn cách tạo link / profile trên nền tảng" defaultValue={editingPlatform?.description ?? ''} disabled={!canEdit} />
              </label>
              <label className="entity-platform-field">
                <span>Nhóm <EntityPlatformGroupHelp /></span>
                <select name="group" defaultValue={editingPlatform?.group ?? 'Profile Link'} disabled={!canEdit}>{entityPlatformGroups.map((item) => <option key={item}>{item}</option>)}</select>
              </label>
              <label className="entity-platform-field">
                <span>Loại link</span>
                <select name="defaultLinkType" defaultValue={editingPlatform?.defaultLinkType ?? 'Nofollow'} disabled={!canEdit}>{entityLinkTypes.map((item) => <option key={item}>{item}</option>)}</select>
              </label>
              <label className="entity-platform-field">
                <span>Điểm DA</span>
                <input name="domainAuthority" placeholder="0-100" type="number" min="0" max="100" defaultValue={editingPlatform?.domainAuthority ?? ''} disabled={!canEdit} />
              </label>
              <label className="entity-platform-field">
                <span>Trạng thái</span>
                <select name="status" defaultValue={editingPlatform?.status ?? 'Dùng được'} disabled={!canEdit}>{entityPlatformStatuses.map((item) => <option key={item}>{item}</option>)}</select>
              </label>
              <label className="entity-platform-field entity-platform-guide-field">
                <span>Tên file HTML</span>
                <input name="guideFileName" placeholder="apple-com-sub-domain-guide.html" defaultValue={editingPlatform?.guideFileName ?? ''} disabled={!canEdit} />
              </label>
              <label className="entity-platform-field entity-platform-guide-field">
                <span>Hướng dẫn khác</span>
                <input name="guideUrl" placeholder="Mã HD-XXXXXXXX hoặc link hướng dẫn độc lập" defaultValue={editingPlatform?.guideUrl ?? ''} disabled={!canEdit} />
              </label>
              <div className="entity-platform-form-actions">
                {editingPlatform && (
                  <button className="secondary-button" type="button" onClick={onCancelEditPlatform}>Hủy sửa</button>
                )}
                <button type="submit" disabled={!canEdit}>{editingPlatform ? 'Lưu chỉnh sửa' : 'Thêm nền tảng'}</button>
              </div>
            </form>
          </Panel>
          <EntityPlatformTable
            platforms={entityPlatforms}
            canEdit={canEdit}
            canCreateLink={Boolean(activeEntity)}
            onEdit={onEditPlatform}
            onCreateLink={onCreateLinkFromPlatform}
            onCreateLinks={onCreateLinksFromPlatforms}
            onDeletePlatforms={onDeletePlatforms}
            scanHistory={entityGuideScanHistory}
            onScanGuides={onScanEntityGuides}
            onOpenGuide={onOpenGuide}
          />
        </>
      )}

      {entityTab === 'links' && (
        <>
          <Panel title="Thêm Link Entity" action={activeEntity?.name ?? 'Chưa chọn Entity'}>
            {activeEntity ? (
              allPendingEntityLinks.length > 0 ? (
              <>
              <div className="entity-link-filter-row">
                <label>
                  <span>Nhân sự xử lý</span>
                  <select value={pendingLinkAssigneeId} onChange={(event) => setPendingLinkAssigneeId(event.target.value)} disabled={!canEdit}>
                    {users.map((user) => (
                      <option value={user.id} key={user.id}>{user.name}{user.role === 'Quản trị viên' ? ' - xem tất cả' : ''}</option>
                    ))}
                  </select>
                </label>
                <small>{selectedPendingAssigneeIsAdmin ? `${allPendingEntityLinks.length} link chờ` : `${pendingEntityLinks.length}/${allPendingEntityLinks.length} link được phân cho nhân sự này`}</small>
              </div>
              {pendingEntityLinks.length > 0 ? (
              <form className="entity-link-form" onSubmit={onAddLink} key={firstPendingEntityLink?.id ?? 'pending-link-form'}>
                <select
                  name="pendingLinkId"
                  required
                  disabled={!canEdit}
                  onChange={(event) => {
                    const nextLink = pendingEntityLinks.find((link) => link.id === event.target.value)
                    setEntityLinkFormDefaults(event.currentTarget.form, nextLink)
                  }}
                >
                  {pendingEntityLinks.map((link) => {
                    const platform = entityPlatforms.find((item) => item.id === link.platformId)
                    return (
                      <option value={link.id} key={link.id}>
                        {platform?.name ?? 'Nền tảng đã xóa'} - {platform?.domain || link.targetUrl || entityTargetUrlOf(activeEntity, activeProject)}
                      </option>
                    )
                  })}
                </select>
                <input type="hidden" name="assigneeId" value={pendingLinkAssigneeId} readOnly />
                <fieldset className="entity-link-account-box">
                  <legend>Tài khoản đăng nhập</legend>
                  <label className="entity-google-login">
                    <input
                      name="useDefaultEntityAccount"
                      type="checkbox"
                      checked={rememberedCredential.useDefaultEntityAccount}
                      onChange={(event) => applyEntityDefaultCredential(event.target.checked)}
                      disabled={!canEdit || !hasEntityDefaultCredential}
                    />
                    Dùng tài khoản mặc định của Entity
                  </label>
                  <label className="entity-google-login">
                    <input
                      name="loginWithGoogle"
                      type="checkbox"
                      checked={rememberedCredential.loginWithGoogle}
                      onChange={(event) => onCredentialChange({ loginWithGoogle: event.target.checked })}
                      disabled={!canEdit}
                    />
                    Đăng nhập bằng tài khoản Google
                  </label>
                  {!hasEntityDefaultCredential && <small>Hồ sơ Entity chưa có tài khoản mặc định để tự điền.</small>}
                  <input
                    name="loginAccount"
                    placeholder="Tài khoản đăng nhập / ID"
                    value={rememberedCredential.loginAccount}
                    onChange={(event) => onCredentialChange({ loginAccount: event.target.value, useDefaultEntityAccount: false })}
                    disabled={!canEdit}
                  />
                  <input
                    name="loginEmail"
                    placeholder="Email đăng nhập"
                    type="email"
                    value={rememberedCredential.loginEmail}
                    onChange={(event) => onCredentialChange({ loginEmail: event.target.value, useDefaultEntityAccount: false })}
                    disabled={!canEdit}
                  />
                  <input
                    name="loginPassword"
                    placeholder="Mật khẩu"
                    type="text"
                    autoComplete="off"
                    value={rememberedCredential.loginPassword}
                    onChange={(event) => onCredentialChange({ loginPassword: event.target.value, useDefaultEntityAccount: false })}
                    disabled={!canEdit}
                  />
                  <input
                    name="accountUsed"
                    placeholder="Tài khoản sử dụng"
                    value={rememberedCredential.accountUsed}
                    onChange={(event) => onCredentialChange({ accountUsed: event.target.value, useDefaultEntityAccount: false })}
                    disabled={!canEdit}
                  />
                </fieldset>
                <input name="liveUrl" placeholder="URL live" disabled={!canEdit} />
                <div className="entity-link-sync-row">
                  <span>Tự điền từ hồ sơ Entity</span>
                  <button
                    className="icon-button entity-sync-button"
                    type="button"
                    title="Đồng bộ dữ liệu từ hồ sơ Entity"
                    onClick={(event) => syncEntityLinkProfileDefaults(event.currentTarget.form)}
                    disabled={!canEdit}
                  >
                    ↻
                  </button>
                </div>
                <input name="targetUrl" placeholder="URL đích / Link website" defaultValue={entityTargetUrlOf(activeEntity, activeProject)} disabled={!canEdit} />
                <input name="anchorText" placeholder="Anchor Text" defaultValue={entityAnchorTextOf(activeEntity)} disabled={!canEdit} />
                <input name="displayName" placeholder="Tên hiển thị / Tên chuẩn" defaultValue={entityDisplayNameOf(activeEntity)} disabled={!canEdit} />
                <textarea name="usedDescription" placeholder="Mô tả đã dùng" defaultValue={entityUsedDescriptionOf(activeEntity)} disabled={!canEdit} />
                <textarea name="notes" placeholder="Ghi chú nội bộ" disabled={!canEdit} />
                <button type="submit" disabled={!canEdit}>Lưu link chờ</button>
              </form>
              ) : (
                <EmptyState title="Không có link chờ cho nhân sự này" text="Nhân sự này chưa được phân task Link Entity. Chọn quản trị viên để xem tất cả link chờ." />
              )
              }
              </>
              ) : (
                <EmptyState title="Chưa có link chờ" text="Vào tab Nền tảng Entity, bấm nút + hoặc chọn hàng loạt để đẩy nền tảng sang Link Entity trước." />
              )
            ) : (
              <EmptyState title="Chưa có hồ sơ Entity" text="Tạo hồ sơ Entity trước khi thêm link triển khai." />
            )}
          </Panel>
          <Panel title="Phân task nhanh Link Entity" action={`${selectedLinkIds.size} link được chọn`}>
            {activeEntityLinks.length === 0 ? (
              <EmptyState title="Chưa có link để phân task" text="Thêm Link Entity trước khi phân việc nhanh cho nhân viên." />
            ) : (
              <form className="entity-task-form" onSubmit={onSendLinkTasks}>
                <button className="secondary-button" type="button" onClick={onSelectIncompleteLinks} disabled={!canEdit}>
                  Chọn link chưa hoàn thành
                </button>
                <select name="assigneeId" disabled={!canEdit} required>
                  {users.map((user) => (
                    <option value={user.id} key={user.id}>{user.name}</option>
                  ))}
                </select>
                <input name="deadlineAt" type="datetime-local" aria-label="Hạn hoàn thành task Entity" defaultValue={defaultTaskDeadlineInput()} disabled={!canEdit} required />
                <button type="submit" disabled={!canEdit || selectedLinkIds.size === 0}>Gửi task cho nhân viên</button>
              </form>
            )}
          </Panel>
          <EntityLinkTable
            links={activeEntityLinks}
            tasks={tasks}
            platforms={entityPlatforms}
            users={users}
            canEdit={canEdit}
            selectedLinkIds={selectedLinkIds}
            onToggleSelect={onToggleLinkSelect}
            onUpdate={onUpdateLink}
            onDelete={onDeleteLink}
            onCheck={onCheckLink}
            onOpenGuide={onOpenGuide}
          />
        </>
      )}

      {entityTab === 'checklist' && (
        <Panel title="Checklist Entity" action={activeEntity?.name ?? 'Chưa chọn Entity'}>
          {activeEntityChecklist.length === 0 ? (
            <EmptyState title="Chưa có checklist" text="Checklist mẫu sẽ được tạo tự động khi bạn tạo hồ sơ Entity mới." />
          ) : (
            <div className="entity-checklist">
              {activeEntityChecklist.map((item) => (
                <label key={item.id}>
                  <input type="checkbox" checked={item.done} onChange={() => onToggleChecklist(item.id)} disabled={!canEdit} />
                  <span>{item.label}</span>
                  <small>{item.updatedAt ? formatDateTime(item.updatedAt) : 'Chưa cập nhật'}</small>
                </label>
              ))}
            </div>
          )}
        </Panel>
      )}

      {entityTab === 'schema' && (
        <Panel title="Schema Entity" action={activeEntitySchema ? formatDateTime(activeEntitySchema.updatedAt) : 'Chưa tạo'}>
          {activeEntity ? (
            <div className="schema-panel">
              <button className="secondary-button" type="button" onClick={onGenerateSchema} disabled={!canEdit}>
                Tạo / cập nhật JSON-LD
              </button>
              <pre>{activeEntitySchema?.jsonLd ?? 'Chưa có schema. Bấm nút tạo để sinh schema cơ bản từ hồ sơ Entity.'}</pre>
            </div>
          ) : (
            <EmptyState title="Chưa có hồ sơ Entity" text="Tạo hồ sơ Entity trước khi sinh schema." />
          )}
        </Panel>
      )}

      {entityTab === 'check' && (
        <Panel title="Check Entity" action="Live / Index / NAP">
          <EntityLinkTable
            links={activeEntityLinks}
            tasks={tasks}
            platforms={entityPlatforms}
            users={users}
            canEdit={canEdit}
            selectedLinkIds={selectedLinkIds}
            onToggleSelect={onToggleLinkSelect}
            onUpdate={onUpdateLink}
            onDelete={onDeleteLink}
            onCheck={onCheckLink}
            onOpenGuide={onOpenGuide}
            compact
          />
        </Panel>
      )}

      {entityTab === 'reports' && (
        <Panel title="Báo cáo Entity" action={activeEntity?.name ?? 'Chưa chọn Entity'}>
          {activeEntity ? (
            <div className="report-actions">
              <button type="button" onClick={() => onExportReport('internal')}>Xuất báo cáo nội bộ CSV</button>
              <button type="button" onClick={() => onExportReport('client')}>Xuất báo cáo khách hàng CSV</button>
              <button type="button" onClick={() => onExportReport('score')}>Xuất Entity Score CSV</button>
            </div>
          ) : (
            <EmptyState title="Chưa có dữ liệu báo cáo" text="Tạo hồ sơ Entity và thêm link trước khi xuất báo cáo." />
          )}
        </Panel>
      )}
    </section>
  )
}

function EntityPlatformGroupHelp() {
  return (
    <span className="entity-group-help" tabIndex={0} aria-label="Xem chú thích các nhóm nền tảng Entity">
      ?
      <span className="entity-group-tooltip" role="tooltip">
        <strong>Phân loại nền tảng Entity</strong>
        {entityPlatformGroups.map((group) => (
          <span key={group}>
            <b>{group}</b>
            <small>{entityPlatformGroupDescriptions[group]}</small>
          </span>
        ))}
      </span>
    </span>
  )
}

type EntityPlatformSortOption = 'default' | 'da-desc' | 'da-asc' | 'name-asc' | 'name-desc'
type EntityPlatformGuideFilter = 'all' | 'with-guide' | 'without-guide'

function EntityPlatformTable({
  platforms,
  canEdit,
  canCreateLink,
  onEdit,
  onCreateLink,
  onCreateLinks,
  onDeletePlatforms,
  scanHistory,
  onScanGuides,
  onOpenGuide,
}: {
  platforms: SeoEntityPlatform[]
  canEdit: boolean
  canCreateLink: boolean
  onEdit: (platformId: string) => void
  onCreateLink: (platformId: string) => void
  onCreateLinks: (platformIds: string[]) => boolean
  onDeletePlatforms: (platformIds: string[]) => boolean
  scanHistory: EntityGuideScanRecord[]
  onScanGuides: () => void
  onOpenGuide: (reference: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<EntityPlatformSortOption>('default')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [groupFilter, setGroupFilter] = useState<EntityPlatformGroup | 'all'>('all')
  const [linkTypeFilter, setLinkTypeFilter] = useState<EntityLinkType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<EntityPlatformStatus | 'all'>('all')
  const [guideFilter, setGuideFilter] = useState<EntityPlatformGuideFilter>('all')
  const [minDa, setMinDa] = useState('')
  const [maxDa, setMaxDa] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(() => new Set())
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const minimumDa = minDa === '' ? null : Number(minDa)
  const maximumDa = maxDa === '' ? null : Number(maxDa)
  const hasAdvancedFilter =
    groupFilter !== 'all' ||
    linkTypeFilter !== 'all' ||
    statusFilter !== 'all' ||
    guideFilter !== 'all' ||
    minDa !== '' ||
    maxDa !== ''
  const filteredPlatforms = platforms
    .filter((platform) => {
      const searchable = [
        platform.name,
        platform.domain,
        platform.description,
        platform.group,
        platform.defaultLinkType,
        platform.status,
        platform.guideFileName,
        platform.guideUrl,
      ]
        .join(' ')
        .toLowerCase()
      const matchesSearch = !normalizedQuery || searchable.includes(normalizedQuery)
      const matchesGroup = groupFilter === 'all' || platform.group === groupFilter
      const matchesLinkType = linkTypeFilter === 'all' || platform.defaultLinkType === linkTypeFilter
      const matchesStatus = statusFilter === 'all' || platform.status === statusFilter
      const hasGuide = Boolean(platform.guideFileName || platform.guideUrl)
      const matchesGuide =
        guideFilter === 'all' ||
        (guideFilter === 'with-guide' && hasGuide) ||
        (guideFilter === 'without-guide' && !hasGuide)
      const da = Number(platform.domainAuthority ?? 0)
      const matchesMinDa = minimumDa === null || Number.isNaN(minimumDa) || da >= minimumDa
      const matchesMaxDa = maximumDa === null || Number.isNaN(maximumDa) || da <= maximumDa
      return matchesSearch && matchesGroup && matchesLinkType && matchesStatus && matchesGuide && matchesMinDa && matchesMaxDa
    })
    .sort((a, b) => {
      if (sortBy === 'da-desc') return Number(b.domainAuthority ?? 0) - Number(a.domainAuthority ?? 0)
      if (sortBy === 'da-asc') return Number(a.domainAuthority ?? 0) - Number(b.domainAuthority ?? 0)
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'vi')
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name, 'vi')
      return 0
    })
  const totalPages = Math.max(1, Math.ceil(filteredPlatforms.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStart = (safeCurrentPage - 1) * pageSize
  const pagedPlatforms = filteredPlatforms.slice(pageStart, pageStart + pageSize)
  const pagedPlatformIds = pagedPlatforms.map((platform) => platform.id)
  const existingPlatformIdSet = new Set(platforms.map((platform) => platform.id))
  const selectedPlatformIdList = Array.from(selectedPlatformIds).filter((platformId) => existingPlatformIdSet.has(platformId))
  const currentPageFullySelected = pagedPlatformIds.length > 0 && pagedPlatformIds.every((platformId) => selectedPlatformIds.has(platformId))
  const scanRecordByFile = new Map(scanHistory.map((record) => [entityGuideFileKey(record.fileName), record]))
  const guideStateOf = (platform: SeoEntityPlatform) => {
    const fileName = entityGuideFileNameOf(platform.guideFileName)
    const fileRecord = fileName ? scanRecordByFile.get(entityGuideFileKey(fileName)) : undefined
    const externalReference = platform.guideUrl.trim()
    if (fileName && fileRecord?.exists) {
      return { status: 'ready' as const, reference: fileName, title: `Đã tìm thấy file ${fileName}` }
    }
    if (externalReference) {
      return { status: 'ready' as const, reference: externalReference, title: 'Mở hướng dẫn độc lập' }
    }
    if (fileName) {
      return {
        status: 'missing' as const,
        reference: fileName,
        title: fileRecord?.checkedAt ? `Chưa tìm thấy file ${fileName}. Lần quét: ${formatDateTime(fileRecord.checkedAt)}` : `Chưa quét thấy file ${fileName}`,
      }
    }
    return { status: 'none' as const, reference: '', title: 'Chưa có hướng dẫn' }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSortBy('default')
    setGroupFilter('all')
    setLinkTypeFilter('all')
    setStatusFilter('all')
    setGuideFilter('all')
    setMinDa('')
    setMaxDa('')
    setCurrentPage(1)
  }
  const togglePlatformSelection = (platformId: string) => {
    setSelectedPlatformIds((current) => {
      const next = new Set(current)
      if (next.has(platformId)) {
        next.delete(platformId)
      } else {
        next.add(platformId)
      }
      return next
    })
  }
  const toggleCurrentPageSelection = () => {
    setSelectedPlatformIds((current) => {
      const next = new Set(current)
      if (currentPageFullySelected) {
        pagedPlatformIds.forEach((platformId) => next.delete(platformId))
      } else {
        pagedPlatformIds.forEach((platformId) => next.add(platformId))
      }
      return next
    })
  }
  const pushSelectedPlatforms = () => {
    if (onCreateLinks(selectedPlatformIdList)) setSelectedPlatformIds(new Set())
  }
  const deleteSelectedPlatforms = () => {
    if (onDeletePlatforms(selectedPlatformIdList)) setSelectedPlatformIds(new Set())
  }

  return (
    <Panel title="Kho nền tảng Entity" action={`${platforms.length} nền tảng`}>
      <div className="entity-platform-browser">
        <label className="entity-platform-search-box">
          <span className="entity-platform-search-icon">⌕</span>
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setCurrentPage(1)
            }}
            placeholder="Tìm theo tên, domain, nhóm, trạng thái hoặc mã hướng dẫn..."
          />
        </label>

        <div className="entity-platform-toolbar">
          <label className="entity-platform-sort-group">
            <span>Sort By:</span>
            <select value={sortBy} onChange={(event) => {
              setSortBy(event.target.value as EntityPlatformSortOption)
              setCurrentPage(1)
            }}>
              <option value="default">Thứ tự hiện tại</option>
              <option value="da-desc">DA cao đến thấp</option>
              <option value="da-asc">DA thấp đến cao</option>
              <option value="name-asc">Tên A đến Z</option>
              <option value="name-desc">Tên Z đến A</option>
            </select>
          </label>
          <button className={`entity-platform-filter-toggle ${filtersOpen ? 'is-active' : ''}`} type="button" onClick={() => setFiltersOpen((current) => !current)}>
            Advanced Filters
          </button>
          <span className="entity-platform-results-info">
            Hiển thị {filteredPlatforms.length} / {platforms.length} nền tảng
          </span>
        </div>

        {filtersOpen && (
          <div className="entity-platform-filter-panel">
            <div className="entity-platform-filter-head">
              <strong>Bộ lọc nâng cao</strong>
              {hasAdvancedFilter && (
                <button type="button" onClick={resetFilters}>
                  Xóa lọc
                </button>
              )}
            </div>
            <div className="entity-platform-filter-grid">
              <label title={entityPlatformGroupTooltipText}>
                <span>Nhóm <EntityPlatformGroupHelp /></span>
                <select value={groupFilter} onChange={(event) => {
                  setGroupFilter(event.target.value as EntityPlatformGroup | 'all')
                  setCurrentPage(1)
                }}>
                  <option value="all">Tất cả nhóm</option>
                  {entityPlatformGroups.map((group) => (
                    <option value={group} key={group}>{group}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Loại link</span>
                <select value={linkTypeFilter} onChange={(event) => {
                  setLinkTypeFilter(event.target.value as EntityLinkType | 'all')
                  setCurrentPage(1)
                }}>
                  <option value="all">Tất cả loại link</option>
                  {entityLinkTypes.map((type) => (
                    <option value={type} key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Trạng thái</span>
                <select value={statusFilter} onChange={(event) => {
                  setStatusFilter(event.target.value as EntityPlatformStatus | 'all')
                  setCurrentPage(1)
                }}>
                  <option value="all">Tất cả trạng thái</option>
                  {entityPlatformStatuses.map((status) => (
                    <option value={status} key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Hướng dẫn</span>
                <select value={guideFilter} onChange={(event) => {
                  setGuideFilter(event.target.value as EntityPlatformGuideFilter)
                  setCurrentPage(1)
                }}>
                  <option value="all">Tất cả</option>
                  <option value="with-guide">Có hướng dẫn</option>
                  <option value="without-guide">Chưa có hướng dẫn</option>
                </select>
              </label>
              <label>
                <span>DA từ</span>
                <input value={minDa} onChange={(event) => {
                  setMinDa(event.target.value)
                  setCurrentPage(1)
                }} type="number" min="0" max="100" placeholder="0" />
              </label>
              <label>
                <span>DA đến</span>
                <input value={maxDa} onChange={(event) => {
                  setMaxDa(event.target.value)
                  setCurrentPage(1)
                }} type="number" min="0" max="100" placeholder="100" />
              </label>
            </div>
          </div>
        )}

        <div className="entity-platform-bulk-toolbar">
          <label>
            <input
              type="checkbox"
              checked={currentPageFullySelected}
              onChange={toggleCurrentPageSelection}
              disabled={!canEdit || pagedPlatformIds.length === 0}
            />
            <span>Chọn trang này</span>
          </label>
          <strong>{selectedPlatformIdList.length} nền tảng được chọn</strong>
          <div className="entity-platform-bulk-actions">
            <button className="secondary-button" type="button" onClick={() => setSelectedPlatformIds(new Set())} disabled={selectedPlatformIdList.length === 0}>
              Bỏ chọn
            </button>
            <button type="button" onClick={pushSelectedPlatforms} disabled={!canCreateLink || selectedPlatformIdList.length === 0}>
              Đẩy sang Link Entity
            </button>
            <button className="secondary-button" type="button" onClick={onScanGuides} disabled={!canEdit}>
              Quét file hướng dẫn
            </button>
            <button className="danger-button" type="button" onClick={deleteSelectedPlatforms} disabled={!canEdit || selectedPlatformIdList.length === 0}>
              Xóa đã chọn
            </button>
          </div>
        </div>

        {filteredPlatforms.length > 0 && (
          <TablePagination
            currentPage={safeCurrentPage}
            pageSize={pageSize}
            totalItems={filteredPlatforms.length}
            totalPages={totalPages}
            itemLabel="nền tảng"
            pageSizeOptions={[50, 100, 300]}
            onPageChange={setCurrentPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize)
              setCurrentPage(1)
            }}
          />
        )}

        {filteredPlatforms.length === 0 ? (
          <EmptyState title="Không có nền tảng phù hợp" text="Thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc nâng cao." />
        ) : (
          <div className="entity-platform-card-list">
            {pagedPlatforms.map((platform) => {
              const domainUrl = /^https?:\/\//i.test(platform.domain) ? platform.domain : `https://${platform.domain}`
              const guideState = guideStateOf(platform)
              const guideReference = guideState.reference
              return (
                <article className={`entity-platform-card${selectedPlatformIds.has(platform.id) ? ' is-selected' : ''}`} key={platform.id}>
                  <label className="entity-platform-select-control" title={`Chọn ${platform.name}`}>
                    <input
                      type="checkbox"
                      checked={selectedPlatformIds.has(platform.id)}
                      onChange={() => togglePlatformSelection(platform.id)}
                      disabled={!canEdit}
                      aria-label={`Chọn nền tảng ${platform.name}`}
                    />
                  </label>
                  <div className="entity-platform-card-left">
                    <div className="entity-platform-card-icon" aria-hidden="true">
                      {platform.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="entity-platform-card-info">
                      <div className="entity-platform-card-title-row">
                        <h3>{platform.name}</h3>
                        <span className="entity-platform-free-badge">Free</span>
                        {canEdit && (
                          <span className="entity-platform-row-actions">
                            <button
                              className="entity-platform-action-button entity-platform-edit-button"
                              type="button"
                              onClick={() => onEdit(platform.id)}
                              title={`Sửa nền tảng ${platform.name}`}
                              aria-label={`Sửa nền tảng ${platform.name}`}
                            >
                              ✎
                            </button>
                            <button
                              className="entity-platform-action-button entity-platform-push-button"
                              type="button"
                              onClick={() => onCreateLink(platform.id)}
                              disabled={!canCreateLink}
                              title={canCreateLink ? `Đẩy ${platform.name} sang Link Entity` : 'Tạo hồ sơ Entity trước khi thêm Link Entity'}
                              aria-label={`Đẩy ${platform.name} sang Link Entity`}
                            >
                              +
                            </button>
                          </span>
                        )}
                      </div>
                      <p>
                        {platform.description || `Tạo Entity trên ${platform.name} (${platform.domain}) với loại link ${platform.defaultLinkType.toLowerCase()}.`}
                      </p>
                      <div className="entity-platform-card-tags">
                        <span className="entity-platform-tag entity-platform-tag-da">DA {platform.domainAuthority}</span>
                        <span className={`entity-platform-tag entity-platform-tag-link entity-link-type-${platform.defaultLinkType.toLowerCase()}`}>{platform.defaultLinkType}</span>
                        <span className="entity-platform-tag entity-platform-tag-type">{platform.group}</span>
                        <span className="entity-platform-tag entity-platform-tag-status">{platform.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="entity-platform-card-actions">
                    {guideReference ? (
                      <button
                        className={`entity-platform-view-button guide-${guideState.status}`}
                        type="button"
                        onClick={() => guideState.status === 'ready' && onOpenGuide(guideReference)}
                        disabled={guideState.status !== 'ready'}
                        title={guideState.title}
                      >
                        {guideState.status === 'missing' ? 'Thiếu file HTML' : guideReferenceIsEntityHtmlFile(guideReference) ? 'Mở file HTML' : guideReferenceIsUrl(guideReference) ? 'Xem hướng dẫn' : `Mở ${guideReference}`}
                      </button>
                    ) : (
                      <span className="entity-platform-guide-empty">Chưa có HD</span>
                    )}
                    <a className="entity-platform-visit-button" href={domainUrl} target="_blank" rel="noreferrer" title={`Truy cập ${platform.domain}`}>
                      ↗
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {filteredPlatforms.length > pageSize && (
          <TablePagination
            currentPage={safeCurrentPage}
            pageSize={pageSize}
            totalItems={filteredPlatforms.length}
            totalPages={totalPages}
            itemLabel="nền tảng"
            pageSizeOptions={[50, 100, 300]}
            onPageChange={setCurrentPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize)
              setCurrentPage(1)
            }}
          />
        )}
      </div>
    </Panel>
  )
}

function EntityLinkTable({
  links,
  tasks,
  platforms,
  users,
  canEdit,
  selectedLinkIds,
  compact,
  onToggleSelect,
  onUpdate,
  onDelete,
  onCheck,
  onOpenGuide,
}: {
  links: SeoEntityLink[]
  tasks: Task[]
  platforms: SeoEntityPlatform[]
  users: User[]
  canEdit: boolean
  selectedLinkIds: Set<string>
  compact?: boolean
  onToggleSelect: (linkId: string) => void
  onUpdate: (linkId: string, updates: Partial<SeoEntityLink>) => void
  onDelete: (linkId: string) => void
  onCheck: (linkId: string) => void
  onOpenGuide: (reference: string) => void
}) {
  if (links.length === 0) {
    return <EmptyState title="Chưa có Link Entity" text="Thêm link entity đã triển khai để theo dõi trạng thái live, index và NAP." />
  }

  return (
    <div className="table-wrap">
      <table className="entity-link-table">
        <thead>
          <tr>
            {!compact && <th>Chọn</th>}
            <th>Nền tảng</th>
            <th>URL live</th>
            {!compact && <th>Người phụ trách</th>}
            {!compact && <th>Tài khoản</th>}
            <th>Triển khai</th>
            <th>Link</th>
            <th>Index</th>
            <th>NAP</th>
            <th>Check</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => {
            const linkedTask = link.taskId ? tasks.find((task) => task.id === link.taskId) : undefined
            const approvedByTask = linkedTask ? taskStatusOf(linkedTask) === 'Hoàn thành' : false
            const platform = platforms.find((item) => item.id === link.platformId)
            const platformUrl = platform ? platformDomainUrl(platform.domain) : ''
            const guideReference = entityPlatformGuideReferenceOf(platform)
            const deploymentView = approvedByTask
              ? { label: 'Đã hoàn thành', className: 'done' }
              : link.taskId
                ? { label: 'Đang làm', className: 'doing' }
                : { label: 'Chưa làm', className: 'idle' }
            return (
            <tr key={link.id}>
              {!compact && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedLinkIds.has(link.id)}
                    onChange={() => onToggleSelect(link.id)}
                    disabled={!canEdit}
                    aria-label={`Chọn link ${link.liveUrl || link.id}`}
                  />
                </td>
              )}
              <td>
                <div className="entity-link-platform-cell">
                  <span>
                    <strong>{platform?.name ?? 'Nền tảng đã xóa'}</strong>
                    {guideReference && (
                      <button
                        className="icon-button entity-platform-guide-icon"
                        type="button"
                        title="Mở hướng dẫn nền tảng"
                        onClick={() => onOpenGuide(guideReference)}
                      >
                        ?
                      </button>
                    )}
                  </span>
                  {platformUrl && <a href={platformUrl} target="_blank" rel="noreferrer">{platform?.domain}</a>}
                </div>
              </td>
              <td>
                {link.liveUrl ? <a href={link.liveUrl} target="_blank" rel="noreferrer">{link.liveUrl}</a> : 'Chưa cập nhật'}
                {link.lastCheckedAt && <small className="entity-link-note">Check: {formatDateTime(link.lastCheckedAt)}</small>}
              </td>
              {!compact && <td>{users.find((user) => user.id === link.assigneeId)?.name ?? 'Chưa gán'}</td>}
              {!compact && (
                <td>
                  {link.loginWithGoogle ? <span className="pill income">Google</span> : <span className="pill">Thường</span>}
                  {link.useDefaultEntityAccount && <span className="pill">Mặc định</span>}
                  <small className="entity-link-note">{link.loginAccount || link.accountUsed || 'Chưa lưu tài khoản'}</small>
                  {link.loginEmail && <small className="entity-link-note">{link.loginEmail}</small>}
                </td>
              )}
              <td>
                <span className={`entity-link-deployment-status ${deploymentView.className}`}>{deploymentView.label}</span>
              </td>
              <td>
                <select value={link.linkStatus} onChange={(event) => onUpdate(link.id, { linkStatus: event.target.value as EntityLiveStatus })} disabled={!canEdit}>
                  {entityLiveStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </td>
              <td>
                <select value={link.indexStatus} onChange={(event) => onUpdate(link.id, { indexStatus: event.target.value as EntityIndexStatus })} disabled={!canEdit}>
                  {entityIndexStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </td>
              <td>
                <select value={link.napStatus} onChange={(event) => onUpdate(link.id, { napStatus: event.target.value as EntityNapStatus })} disabled={!canEdit}>
                  {entityNapStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </td>
              <td>
                <div className="entity-link-row-actions">
                  <button className="secondary-button" type="button" onClick={() => onCheck(link.id)} disabled={!canEdit}>
                    Check nhanh
                  </button>
                  <button className="danger-button" type="button" onClick={() => onDelete(link.id)} disabled={!canEdit}>
                    Thu hồi
                  </button>
                </div>
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const keywordTooltips = {
  keyword: 'Từ khóa chính cần theo dõi và tối ưu.',
  article: 'Keyword chỉ vào module Bài viết sau khi nhấn icon cạnh keyword hoặc chọn nhiều keyword rồi đẩy thủ công.',
  indexStatus: 'Chỉ khả dụng khi keyword đã có trong module Bài viết. Trạng thái đỏ là chưa check, xám là noindex, xanh là index.',
  searchVolume: 'Lượng tìm kiếm trung bình mỗi tháng, thể hiện nhu cầu thị trường.',
  keywordDifficulty: 'Độ khó từ khóa từ 0-100. Dự án mới nên ưu tiên KD thấp.',
  searchIntent: 'Ý định tìm kiếm để quyết định định dạng nội dung phù hợp.',
  position: 'Thứ hạng trung bình hiện tại của URL trên SERP cho từ khóa đó.',
  impressions: 'Số lần trang xuất hiện trước người dùng khi họ tìm từ khóa.',
  clicksTraffic: 'Clicks là lượt nhấp; Organic Traffic là truy cập thực tế từ tìm kiếm tự nhiên.',
  ctr: 'Click-Through Rate = Clicks / Impressions. CTR thấp cần tối ưu Title và Meta Description.',
}

function Th({ label, tip }: { label: string; tip: string }) {
  return (
    <th>
      <span className="th-with-help">
        {label}
        <i title={tip} aria-label={tip}>
          ?
        </i>
      </span>
    </th>
  )
}

function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  itemLabel,
  pageSizeOptions = [25, 50, 100],
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  itemLabel: string
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const firstItem = totalItems ? (currentPage - 1) * pageSize + 1 : 0
  const lastItem = Math.min(totalItems, currentPage * pageSize)

  return (
    <div className="table-pagination">
      <label className="table-page-size">
        <span>Hiển thị</span>
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {pageSizeOptions.map((size) => (
            <option value={size} key={size}>{size}</option>
          ))}
        </select>
        <span>{itemLabel} / trang</span>
      </label>
      <div className="table-page-controls">
        <span>{firstItem}-{lastItem} / {totalItems}</span>
        <button className="secondary-button" type="button" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>Trước</button>
        <strong>Trang {currentPage} / {totalPages}</strong>
        <button className="secondary-button" type="button" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>Sau</button>
      </div>
    </div>
  )
}

function KeywordTable({
  keywords,
  expandedKeywordIds,
  selectedKeywordIds,
  onToggleCollapse,
  onToggleSelect,
  onDeleteSelected,
  onDevelopKeyword,
  onEditKeyword,
  onCheckIndex,
  checkingKeywordIds,
  checkingAllKeywords,
  duplicateKeywordIds,
  articleKeywordIds,
  onImportArticle,
  onRevealDuplicate,
  canEdit,
}: {
  keywords: Keyword[]
  expandedKeywordIds: Set<string>
  selectedKeywordIds: Set<string>
  onToggleCollapse: (keywordId: string) => void
  onToggleSelect: (keywordId: string) => void
  onDeleteSelected: () => void
  onDevelopKeyword: (keyword: Keyword) => void
  onEditKeyword: (keyword: Keyword) => void
  onCheckIndex: (keywordId: string) => void
  checkingKeywordIds: Set<string>
  checkingAllKeywords: boolean
  duplicateKeywordIds: Set<string>
  articleKeywordIds: Set<string>
  onImportArticle: (keywordId: string) => void
  onRevealDuplicate: (keywordId: string) => void
  canEdit: boolean
}) {
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [showUnlinkedKeywords, setShowUnlinkedKeywords] = useState(false)

  const keywordByParent = keywords.reduce<Record<string, Keyword[]>>((groups, keyword) => {
    const parentId = keyword.parentId || 'root'
    groups[parentId] = [...(groups[parentId] || []), keyword]
    return groups
  }, {})
  const keywordIds = new Set(keywords.map((keyword) => keyword.id))
  const rootKeywords = keywords.filter((keyword) => keywordTypeOf(keyword) === 'A')
  const unlinkedKeywords = keywords.filter((keyword) =>
    keywordTypeOf(keyword) !== 'A' && (!keyword.parentId || !keywordIds.has(keyword.parentId)),
  )
  const totalPages = Math.max(1, Math.ceil(rootKeywords.length / pageSize))
  const page = Math.min(currentPage, totalPages)
  const paginatedRoots = rootKeywords.slice((page - 1) * pageSize, page * pageSize)

  const rows: { keyword: Keyword; level: number; hidden: boolean; hasChildren: boolean }[] = []
  const pushRows = (items: Keyword[], level: number, hidden: boolean) => {
    items.forEach((keyword) => {
      const children = keywordByParent[keyword.id] || []
      const isCollapsed = children.length > 0 && !expandedKeywordIds.has(keyword.id)
      rows.push({ keyword, level, hidden, hasChildren: children.length > 0 })
      pushRows(children, level + 1, hidden || isCollapsed)
    })
  }

  pushRows(paginatedRoots, 0, false)
  if (showUnlinkedKeywords) pushRows(unlinkedKeywords, 0, false)

  const revealDuplicateOnPage = (keywordId: string) => {
    const source = keywords.find((keyword) => keyword.id === keywordId)
    const target = source && keywords.find((keyword) => keyword.id !== keywordId && keywordDuplicateKey(keyword) === keywordDuplicateKey(source))
    if (target) {
      let rootId = target.id
      let parentId = target.parentId
      while (parentId) {
        rootId = parentId
        parentId = keywords.find((keyword) => keyword.id === parentId)?.parentId ?? ''
      }
      const rootIndex = rootKeywords.findIndex((keyword) => keyword.id === rootId)
      if (rootIndex >= 0) setCurrentPage(Math.floor(rootIndex / pageSize) + 1)
    }
    onRevealDuplicate(keywordId)
  }

  if (keywords.length === 0) {
    return <EmptyState title="Chưa có keyword" text="Thêm key đầu tiên để lập bản đồ từ khóa và theo dõi hiệu suất SEO cho dự án này." />
  }

  return (
    <>
      <div className="bulk-actions">
        <span>{selectedKeywordIds.size} keyword được chọn</span>
        <div className="bulk-action-buttons">
          {unlinkedKeywords.length > 0 && (
            <button className="secondary-button" onClick={() => setShowUnlinkedKeywords((current) => !current)} type="button">
              {showUnlinkedKeywords ? 'Ẩn' : 'Hiện'} {unlinkedKeywords.length} key B/C chưa liên kết
            </button>
          )}
          <button className="danger-button" disabled={!canEdit || selectedKeywordIds.size === 0} onClick={onDeleteSelected} type="button">
            Xóa key đã chọn
          </button>
        </div>
      </div>
      <TablePagination
        currentPage={page}
        pageSize={pageSize}
        totalItems={rootKeywords.length}
        totalPages={totalPages}
        itemLabel="nhóm key A"
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
      />
      <div className="table-wrap keyword-table-wrap">
        <table className="keyword-table">
        <thead>
          <tr>
            <th>Chọn</th>
            <Th label="Keyword" tip={keywordTooltips.keyword} />
            <Th label="Bài viết" tip={keywordTooltips.article} />
            <Th label="Check index" tip={keywordTooltips.indexStatus} />
            <Th label="Search Volume" tip={keywordTooltips.searchVolume} />
            <Th label="Keyword Difficulty" tip={keywordTooltips.keywordDifficulty} />
            <Th label="Search Intent" tip={keywordTooltips.searchIntent} />
            <Th label="Position" tip={keywordTooltips.position} />
            <Th label="Impressions" tip={keywordTooltips.impressions} />
            <Th label="Clicks & Organic Traffic" tip={keywordTooltips.clicksTraffic} />
            <Th label="CTR" tip={keywordTooltips.ctr} />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ keyword, level, hidden, hasChildren }) => {
            const isDuplicate = duplicateKeywordIds.has(keyword.id)
            const isInArticles = articleKeywordIds.has(keyword.id)
            const canImportArticle = !isInArticles
            return (
            <tr
              className={`${hidden ? 'keyword-row hidden' : `keyword-row level-${level}`} ${isDuplicate ? 'duplicate' : ''}`}
              id={`keyword-row-${keyword.id}`}
              key={keyword.id}
            >
              <td>
                <div className="keyword-row-actions">
                  <input
                    checked={selectedKeywordIds.has(keyword.id)}
                    onChange={() => onToggleSelect(keyword.id)}
                    disabled={!canEdit}
                    type="checkbox"
                    aria-label={`Chọn keyword ${keyword.term}`}
                  />
                  <button className="keyword-edit-button" type="button" onClick={() => onEditKeyword(keyword)} disabled={!canEdit} title="Sửa keyword" aria-label={`Sửa keyword ${keyword.term}`}>
                    ✎
                  </button>
                </div>
              </td>
              <td>
                <div className="keyword-tree-cell" style={{ paddingLeft: `${level * 22}px` }}>
                  <button
                    className="tree-toggle"
                    disabled={!hasChildren}
                    onClick={() => onToggleCollapse(keyword.id)}
                    type="button"
                    aria-label={expandedKeywordIds.has(keyword.id) ? 'Thu gọn keyword' : 'Mở rộng keyword'}
                  >
                    {hasChildren ? (expandedKeywordIds.has(keyword.id) ? '-' : '+') : ''}
                  </button>
                  <span className={`keyword-type-badge type-${keywordTypeOf(keyword)}`}>{keywordTypeOf(keyword)}</span>
                  <strong>{keyword.term}</strong>
                  {canImportArticle && (
                    <button
                      className="keyword-article-import-button"
                      onClick={() => onImportArticle(keyword.id)}
                      type="button"
                      disabled={!canEdit || isDuplicate}
                      title={isDuplicate ? 'Xử lý keyword trùng trước khi đưa vào Bài viết.' : 'Thêm keyword này vào module Bài viết'}
                      aria-label={`Thêm ${keyword.term} vào module Bài viết`}
                    >
                      ↗
                    </button>
                  )}
                  {isDuplicate && (
                    <button
                      className="keyword-duplicate-warning"
                      onClick={() => revealDuplicateOnPage(keyword.id)}
                      type="button"
                      title="Keyword bị trùng. Nhấn để tới keyword trùng."
                      aria-label={`Tới keyword trùng của ${keyword.term}`}
                    >
                      !
                    </button>
                  )}
                  {canEdit && childTypeOf(keyword) && (
                    <button className="develop-keyword-button" onClick={() => onDevelopKeyword(keyword)} type="button" title={`Phát triển lên keyword loại ${childTypeOf(keyword)}`}>
                      +
                    </button>
                  )}
                </div>
              </td>
              <td>
                {isDuplicate ? (
                  <span className="keyword-duplicate-pending">Chờ xử lý trùng</span>
                ) : !isInArticles ? (
                  <span className="keyword-article-pending">Chưa nhập</span>
                ) : keyword.articleUrl ? (
                  <a href={keyword.articleUrl} target="_blank" rel="noreferrer">Mở bài viết</a>
                ) : (
                  <span className="keyword-article-ready">Đã nhập</span>
                )}
              </td>
              <td>
                {!isInArticles ? (
                  <span className="keyword-index-unavailable">Chưa khả dụng</span>
                ) : (
                  <button
                    className={`keyword-index-button status-${keyword.indexStatus === 'Index' ? 'indexed' : keyword.indexStatus === 'Noindex' ? 'noindex' : 'unchecked'}`}
                    type="button"
                    disabled={!canEdit || isDuplicate || checkingAllKeywords || checkingKeywordIds.has(keyword.id)}
                    onClick={() => onCheckIndex(keyword.id)}
                    title={keyword.indexCheckedAt ? `Kiểm tra lúc ${formatDateTime(keyword.indexCheckedAt)}` : 'Chưa kiểm tra'}
                  >
                    {checkingKeywordIds.has(keyword.id) ? 'Đang check' : keyword.indexStatus === 'Index' ? 'Index' : keyword.indexStatus === 'Noindex' ? 'Noindex' : 'Check'}
                  </button>
                )}
              </td>
              <td>{keyword.searchVolume.toLocaleString('vi-VN')}</td>
              <td>{keyword.keywordDifficulty}/100</td>
              <td>{keyword.searchIntent}</td>
              <td>#{keyword.position}</td>
              <td>{keyword.impressions.toLocaleString('vi-VN')}</td>
              <td>
                {keyword.clicks.toLocaleString('vi-VN')} / {keyword.organicTraffic.toLocaleString('vi-VN')}
              </td>
              <td>{keyword.ctr.toFixed(2)}%</td>
            </tr>
            )
          })}
        </tbody>
        </table>
      </div>
      <TablePagination
        currentPage={page}
        pageSize={pageSize}
        totalItems={rootKeywords.length}
        totalPages={totalPages}
        itemLabel="nhóm key A"
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
      />
    </>
  )
}

type ArticleEditableField = 'articleTitle' | 'articleUrl'

type ArticleFieldEditState = {
  keywordId: string
  field: ArticleEditableField
  value: string
}

const compactWords = (value: string, maxWords: number) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const words = trimmed.split(/\s+/)
  return words.length > maxWords ? `${words.slice(0, maxWords).join(' ')}...` : trimmed
}

const compactChars = (value: string, maxChars: number) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const chars = Array.from(trimmed)
  return chars.length > maxChars ? `${chars.slice(0, maxChars).join('')}...` : trimmed
}

function ArticleTable({
  keywords,
  users,
  tasks,
  onUpdateKeyword,
  onSendTask,
  onDeleteKeyword,
  canEdit,
  canEditKeyword,
}: {
  keywords: Keyword[]
  users: User[]
  tasks: Task[]
  onUpdateKeyword: (keywordId: string, updates: Partial<Pick<Keyword, 'articleType' | 'articleTitle' | 'articleMetaDescription' | 'articleContent' | 'articleStatus' | 'articleUpdatedAt' | 'articleSource' | 'articleAssigneeId' | 'articleUrl'>>) => void
  onSendTask: (keywordId: string) => void
  onDeleteKeyword: (keywordId: string) => void
  canEdit: boolean
  canEditKeyword?: (keyword: Keyword) => boolean
}) {
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)
  const [editingArticleField, setEditingArticleField] = useState<ArticleFieldEditState | null>(null)
  const [articleSaveNotice, setArticleSaveNotice] = useState('')
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const editingDraft = keywords.find((keyword) => keyword.id === editingDraftId)
  const canEditArticle = (keyword: Keyword) => canEdit || Boolean(canEditKeyword?.(keyword))
  const taskById = new Map(tasks.map((task) => [task.id, task]))
  const canEditDraft = editingDraft ? canEditArticle(editingDraft) : false
  const totalPages = Math.max(1, Math.ceil(keywords.length / pageSize))
  const page = Math.min(currentPage, totalPages)
  const paginatedKeywords = keywords.slice((page - 1) * pageSize, page * pageSize)
  const statusLabels: Record<ArticleDraftStatus, string> = {
    'Chua viet': 'Chưa viết',
    'Ban nhap AI': 'Bản nháp AI',
    'Cho duyet': 'Chờ duyệt',
    'Da duyet': 'Đã duyệt',
    'Can chinh sua': 'Cần chỉnh sửa',
  }

  useEffect(() => {
    if (!articleSaveNotice) return undefined
    const timer = window.setTimeout(() => setArticleSaveNotice(''), 1800)
    return () => window.clearTimeout(timer)
  }, [articleSaveNotice])

  const startArticleFieldEdit = (keyword: Keyword, field: ArticleEditableField) => {
    setEditingArticleField({
      keywordId: keyword.id,
      field,
      value: field === 'articleTitle' ? keyword.articleTitle ?? '' : keyword.articleUrl ?? '',
    })
  }

  const saveArticleFieldEdit = () => {
    if (!editingArticleField) return
    const keyword = keywords.find((item) => item.id === editingArticleField.keywordId)
    if (!keyword || !canEditArticle(keyword)) return
    const articleTask = keyword.articleTaskId ? taskById.get(keyword.articleTaskId) : undefined
    const articleTaskCompleted = articleTask ? taskStatusOf(articleTask) === 'Hoàn thành' : false
    if (editingArticleField.field === 'articleUrl' && articleTaskCompleted) return
    const updates = editingArticleField.field === 'articleTitle'
      ? { articleTitle: editingArticleField.value }
      : { articleUrl: editingArticleField.value }
    onUpdateKeyword(keyword.id, updates)
    setEditingArticleField(null)
    setArticleSaveNotice('Đã lưu thay đổi bài viết.')
  }

  if (keywords.length === 0) {
    return <EmptyState title="Chưa có keyword" text="Chọn keyword trong Quản lý Keyword và đẩy thủ công sang module Bài viết." />
  }

  return (
    <>
    <TablePagination
      currentPage={page}
      pageSize={pageSize}
      totalItems={keywords.length}
      totalPages={totalPages}
      itemLabel="bài viết"
      onPageChange={setCurrentPage}
      onPageSizeChange={(size) => {
        setPageSize(size)
        setCurrentPage(1)
      }}
    />
    <div className="table-wrap article-table-wrap">
      <table className="article-table">
        <colgroup>
          <col className="article-col-keyword" />
          <col className="article-col-title" />
          <col className="article-col-type" />
          <col className="article-col-article-type" />
          <col className="article-col-assignee" />
          <col className="article-col-task" />
          <col className="article-col-draft" />
          <col className="article-col-url" />
          <col className="article-col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Tiêu đề bài viết</th>
            <th>Loại key</th>
            <th>Loại bài viết</th>
            <th>Người phụ trách</th>
            <th>Gửi task</th>
            <th>Bản nháp</th>
            <th>Link bài viết</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {paginatedKeywords.map((keyword) => {
            const canEditRow = canEditArticle(keyword)
            const articleTask = keyword.articleTaskId ? taskById.get(keyword.articleTaskId) : undefined
            const articleTaskCompleted = articleTask ? taskStatusOf(articleTask) === 'Hoàn thành' : false
            const editingTitle = editingArticleField?.keywordId === keyword.id && editingArticleField.field === 'articleTitle'
            const editingUrl = editingArticleField?.keywordId === keyword.id && editingArticleField.field === 'articleUrl'
            const articleTitle = keyword.articleTitle?.trim()
            const articleUrl = keyword.articleUrl?.trim()
            const articleTitleFull = articleTitle || `Tiêu đề bài viết # ${keyword.term}`
            return (
            <tr className={articleTaskCompleted ? 'article-row-completed' : undefined} key={keyword.id}>
              <td>
                <span className="article-keyword-text" title={keyword.term}>{keyword.term}</span>
              </td>
              <td>
                {editingTitle ? (
                  <div className="article-inline-editor">
                    <input
                      value={editingArticleField.value}
                      onChange={(event) => setEditingArticleField({ ...editingArticleField, value: event.target.value })}
                      placeholder={`Tiêu đề bài viết # ${keyword.term}`}
                      disabled={!canEditRow}
                    />
                    <button className="secondary-button article-save-button" type="button" onClick={saveArticleFieldEdit} disabled={!canEditRow}>
                      Lưu
                    </button>
                    <button className="ghost-button article-cancel-button" type="button" onClick={() => setEditingArticleField(null)}>
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="article-field-view">
                    <span className={articleTitle ? undefined : 'muted-text'} title={articleTitleFull}>{compactWords(articleTitleFull, 5)}</span>
                    <button className="icon-button article-edit-button" type="button" onClick={() => startArticleFieldEdit(keyword, 'articleTitle')} disabled={!canEditRow} title="Sửa tiêu đề bài viết" aria-label={`Sửa tiêu đề bài viết ${keyword.term}`}>
                      ✎
                    </button>
                  </div>
                )}
              </td>
              <td>
                <span className={`keyword-type-badge type-${keywordTypeOf(keyword)}`}>{keywordTypeOf(keyword)}</span>
              </td>
              <td>
                <select
                  value={keyword.articleType ?? 'Informational Content'}
                  onChange={(event) => onUpdateKeyword(keyword.id, { articleType: event.target.value as ArticleType })}
                  disabled={!canEditRow}
                >
                  {articleTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={keyword.articleAssigneeId ?? ''}
                  onChange={(event) => onUpdateKeyword(keyword.id, { articleAssigneeId: event.target.value })}
                  disabled={!canEdit || articleTaskCompleted}
                >
                  <option value="">Chưa chọn</option>
                  {users.map((user) => (
                    <option value={user.id} key={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                {articleTaskCompleted ? (
                  <span className="article-task-completed">Hoàn thành</span>
                ) : (
                  <button className="secondary-button" type="button" onClick={() => onSendTask(keyword.id)} disabled={!canEdit}>
                    {keyword.articleTaskId ? 'Phân việc lại' : 'Gửi Task'}
                  </button>
                )}
              </td>
              <td>
                <div className="article-draft-cell">
                  <span>{statusLabels[keyword.articleStatus ?? 'Chua viet']}</span>
                  <button className="secondary-button" type="button" onClick={() => setEditingDraftId(keyword.id)}>
                    {keyword.articleContent ? (canEditRow ? 'Xem / sửa' : 'Xem') : canEditRow ? 'Soạn bài' : 'Xem'}
                  </button>
                </div>
              </td>
              <td>
                {editingUrl ? (
                  <div className="article-inline-editor">
                    <input
                      value={editingArticleField.value}
                      onChange={(event) => setEditingArticleField({ ...editingArticleField, value: event.target.value })}
                      placeholder="https://..."
                      disabled={!canEditRow || articleTaskCompleted}
                      title={articleTaskCompleted ? 'Link bài viết đã khóa vì task đã được xác nhận hoàn thành.' : undefined}
                    />
                    <button className="secondary-button article-save-button" type="button" onClick={saveArticleFieldEdit} disabled={!canEditRow || articleTaskCompleted}>
                      Lưu
                    </button>
                    <button className="ghost-button article-cancel-button" type="button" onClick={() => setEditingArticleField(null)}>
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="article-field-view">
                    {articleUrl ? (
                      <a href={articleUrl} target="_blank" rel="noreferrer" title={articleUrl}>{compactChars(articleUrl, 15)}</a>
                    ) : (
                      <span className="muted-text">Chưa có link</span>
                    )}
                    <button
                      className="icon-button article-edit-button"
                      type="button"
                      onClick={() => startArticleFieldEdit(keyword, 'articleUrl')}
                      disabled={!canEditRow || articleTaskCompleted}
                      title={articleTaskCompleted ? 'Link bài viết đã khóa vì task đã được xác nhận hoàn thành.' : 'Sửa link bài viết'}
                      aria-label={`Sửa link bài viết ${keyword.term}`}
                    >
                      ✎
                    </button>
                  </div>
                )}
              </td>
              <td>
                <button className="danger-button article-remove-button" type="button" onClick={() => onDeleteKeyword(keyword.id)} disabled={!canEdit}>
                  Xóa keyword
                </button>
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    <TablePagination
      currentPage={page}
      pageSize={pageSize}
      totalItems={keywords.length}
      totalPages={totalPages}
      itemLabel="bài viết"
      onPageChange={setCurrentPage}
      onPageSizeChange={(size) => {
        setPageSize(size)
        setCurrentPage(1)
      }}
    />
    {editingDraft && (
      <div className="modal-backdrop" role="presentation">
        <section className="article-draft-modal" role="dialog" aria-modal="true" aria-labelledby="article-draft-title">
          <div className="panel-head">
            <div>
              <h2 id="article-draft-title">Bản nháp bài viết</h2>
              <span>{editingDraft.term}</span>
            </div>
            <button className="secondary-button" type="button" onClick={() => setEditingDraftId(null)}>Đóng</button>
          </div>
          <div className="article-draft-form">
            <label>
              <span>Tiêu đề</span>
              <input value={editingDraft.articleTitle ?? ''} onChange={(event) => onUpdateKeyword(editingDraft.id, { articleTitle: event.target.value })} disabled={!canEditDraft} />
            </label>
            <label>
              <span>Trạng thái</span>
              <select value={editingDraft.articleStatus ?? 'Chua viet'} onChange={(event) => onUpdateKeyword(editingDraft.id, { articleStatus: event.target.value as ArticleDraftStatus })} disabled={!canEditDraft}>
                {(Object.keys(statusLabels) as ArticleDraftStatus[]).map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </label>
            <label className="wide">
              <span>Meta description</span>
              <textarea rows={2} value={editingDraft.articleMetaDescription ?? ''} onChange={(event) => onUpdateKeyword(editingDraft.id, { articleMetaDescription: event.target.value })} disabled={!canEditDraft} />
            </label>
            <label className="wide">
              <span>Nội dung bài viết (Markdown / HTML)</span>
              <textarea
                className="article-content-editor"
                rows={18}
                value={editingDraft.articleContent ?? ''}
                onChange={(event) => onUpdateKeyword(editingDraft.id, { articleContent: event.target.value, articleUpdatedAt: appNowIso(), articleSource: 'SEO Ops' })}
                disabled={!canEditDraft}
              />
            </label>
            <p className="article-draft-meta">Nguồn: {editingDraft.articleSource || 'Chưa có'} | Cập nhật: {formatDateTime(editingDraft.articleUpdatedAt ?? '')}</p>
          </div>
        </section>
      </div>
    )}
    {articleSaveNotice && <div className="article-save-toast" role="status">{articleSaveNotice}</div>}
    </>
  )
}

function QuickKeywordModal({
  issues,
  onClose,
  onSubmit,
}: {
  issues: QuickKeywordIssue[]
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="quick-keyword-modal" role="dialog" aria-modal="true" aria-labelledby="quick-keyword-title">
        <div className="panel-head">
          <h2 id="quick-keyword-title">Nhập nhanh keyword</h2>
          <button className="secondary-button" type="button" onClick={onClose}>Đóng</button>
        </div>
        <form className="quick-keyword-form" onSubmit={onSubmit}>
          <label>
            <span>Mỗi dòng một keyword theo cấp A, B hoặc C</span>
            <textarea
              name="quickKeywords"
              autoFocus
              required
              rows={13}
              placeholder={'A: pháo hoa Bộ Công an\nB: mua pháo hoa Bộ Công an\nC: mua pháo hoa Bộ Công an ở đâu\nA: quy định pháo hoa'}
            />
          </label>
          <p>Keyword B tự liên kết với keyword A gần nhất phía trên; keyword C tự liên kết với keyword B gần nhất trong cùng nhánh.</p>
          <p>Keyword trùng vẫn được nhập để xử lý trong bảng quản lý, nhưng tạm thời không đồng bộ sang module Bài viết cho tới khi chỉ còn một keyword cùng tên.</p>
          {issues.length > 0 && (
            <div className="quick-keyword-issues" role="alert">
              {issues.map((issue) => (
                <span key={`${issue.line}-${issue.text}`}>Dòng {issue.line}: {issue.text}</span>
              ))}
            </div>
          )}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose}>Hủy</button>
            <button type="submit">Nhập keyword</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function KeywordBuilderModal({
  keyword,
  onClose,
  onSubmit,
}: {
  keyword: Keyword
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const nextType = childTypeOf(keyword)

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="keyword-modal" role="dialog" aria-modal="true" aria-labelledby="keyword-builder-title">
        <div className="panel-head">
          <h2 id="keyword-builder-title">Phát triển keyword loại {nextType}</h2>
          <span>{keywordTypeLabels[keywordTypeOf(keyword)]}</span>
        </div>
        <form className="keyword-builder-form" onSubmit={onSubmit}>
          <label>
            <span>Tiền tố</span>
            <input name="prefix" placeholder="VD: báo giá" autoFocus />
          </label>
          <div className="keyword-builder-core">
            <span>Keyword gốc</span>
            <strong>{keyword.term}</strong>
          </div>
          <label>
            <span>Hậu tố</span>
            <input name="suffix" placeholder="VD: tại Hà Nội" />
          </label>
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose}>
              Hủy
            </button>
            <button type="submit">Tạo keyword loại {nextType}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function EmployeeOverview({
  user,
  tasks,
  projects,
  pendingTasks,
  activeTasks,
  reviewTasks,
  approvedTasks,
  taskSalary,
  monthlySalaryRate,
  monthlySalaryEstimate,
  onCheckIn,
  onCheckOut,
  onAcceptTask,
  onRejectTask,
  onSubmitTask,
}: {
  user: User
  tasks: Task[]
  projects: Project[]
  pendingTasks: Task[]
  activeTasks: Task[]
  reviewTasks: Task[]
  approvedTasks: Task[]
  taskSalary: number
  monthlySalaryRate: number
  monthlySalaryEstimate: number
  onCheckIn: () => void
  onCheckOut: () => void
  onAcceptTask: (taskId: string) => void
  onRejectTask: (taskId: string) => void
  onSubmitTask: (taskId: string) => void
}) {
  const salaryType = user.salaryType ?? 'Lương theo tháng'
  const totalWorkedMs = (user.totalWorkedMs ?? 0) + (user.checkedInAt ? Math.max(0, appNow().getTime() - new Date(user.checkedInAt).getTime()) : 0)
  const workedHours = totalWorkedMs / 3600000
  const hourlySalary = salaryType === 'Lương theo giờ' ? workedHours * (user.salaryAmount ?? 0) : 0

  return (
    <>
      <div className="metric-grid">
        <Metric title="Task chờ nhận" value={pendingTasks.length} note="Cần phản hồi" />
        <Metric title="Đang xử lý" value={activeTasks.length} note="Đang làm hoặc cần chỉnh sửa" />
        <Metric title="Chờ admin duyệt" value={reviewTasks.length} note="Đã gửi hoàn thành" />
        <Metric title="Đã tính công" value={approvedTasks.length} note="Task hoàn thành" />
      </div>

      <div className="dashboard-grid">
        {salaryType === 'Lương theo giờ' && (
          <Panel title="Check-in làm việc" action="Lương theo giờ">
            <div className="employee-paybox">
              <Detail label="Trạng thái" value={user.checkedInAt ? 'Đang làm việc' : 'Chưa check-in'} />
              <Detail label="Phiên hiện tại" value={formatWorkDuration(user.checkedInAt)} />
              <Detail label="Tổng giờ ghi nhận" value={`${workedHours.toFixed(2)} giờ`} />
              <Detail label="Lương tạm tính" value={currency.format(hourlySalary)} />
              <div className="panel-actions">
                <button className="secondary-button" type="button" onClick={onCheckIn} disabled={Boolean(user.checkedInAt)}>
                  Check-in
                </button>
                <button className="danger-button" type="button" onClick={onCheckOut} disabled={!user.checkedInAt}>
                  Check-out
                </button>
              </div>
            </div>
          </Panel>
        )}

        {salaryType === 'Lương theo task' && (
          <Panel title="Lương theo task" action="Tính theo task đã duyệt">
            <div className="employee-paybox">
              <Detail label="Cách tính" value="Cộng lương riêng của từng task" />
              <Detail label="Task đã được admin xác nhận" value={`${approvedTasks.length} task`} />
              <Detail label="Lương tạm tính" value={currency.format(taskSalary)} />
              <Detail label="Task đang chờ duyệt" value={`${reviewTasks.length} task`} />
            </div>
          </Panel>
        )}

        {salaryType === 'Lương theo tháng' && (
          <Panel title="Lương theo tháng" action="Theo tiến độ tháng hiện tại">
            <div className="employee-paybox">
              <Detail label="Lương tháng" value={currency.format(user.salaryAmount ?? 0)} />
              <Detail label="Tiến độ task tháng" value={pct(monthlySalaryRate)} />
              <Detail label="Lương tạm tính" value={currency.format(monthlySalaryEstimate)} />
              <Detail label="Cách tính" value="Task được giao trong tháng và đã được admin xác nhận" />
            </div>
          </Panel>
        )}

        <Panel title="Thông báo task" action={`${tasks.length} task được giao`}>
          {tasks.length === 0 ? (
            <EmptyState title="Chưa có task được giao" text="Khi admin phân công, task sẽ xuất hiện tại đây để nhận hoặc từ chối." />
          ) : (
            <div className="employee-task-list">
              {tasks.map((task) => {
                const deadlineBadge = taskDeadlineBadge(task)
                return (
                <article className={`employee-task-card status-${taskStatusOf(task).replace(/\s+/g, '-').toLowerCase()} ${deadlineBadge?.className ?? ''}`} key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{projects.find((project) => project.id === task.projectId)?.name ?? 'Dự án đã xóa'}</span>
                    <small>Giao: {formatDateTime(task.assignedAt)} · Hạn: {formatDateTime(taskDeadline(task))}</small>
                    {deadlineBadge && <b className={`task-deadline-badge ${deadlineBadge.className}`}>{deadlineBadge.label}</b>}
                    {task.rejectionReason && <small>Từ chối: {task.rejectionReason}</small>}
                    {task.revisionNote && <small>Cần chỉnh sửa: {task.revisionNote}</small>}
                  </div>
                  <div className="employee-task-actions">
                    <span className="task-status-badge">{taskStatusOf(task)}</span>
                    {taskStatusOf(task) === 'Chờ nhận' && (
                      <>
                        <button className="secondary-button" type="button" onClick={() => onAcceptTask(task.id)}>
                          Nhận task
                        </button>
                        <button className="danger-button" type="button" onClick={() => onRejectTask(task.id)}>
                          Từ chối
                        </button>
                      </>
                    )}
                    {['Đang làm', 'Cần chỉnh sửa'].includes(taskStatusOf(task)) && (
                      <button className="secondary-button" type="button" onClick={() => onSubmitTask(task.id)}>
                        Gửi hoàn thành
                      </button>
                    )}
                  </div>
                </article>
                )
              })}
            </div>
          )}
        </Panel>
      </div>
    </>
  )
}

function TaskTable({
  tasks,
  keywords = [],
  users,
  projects,
  onStatus,
  onApprove,
  onRevision,
  onReassign,
  onAcceptTask,
  onRejectTask,
  onSubmitTask,
  onDeleteTask,
  currentUserId,
  allowAssigneeWorkflow,
  canEdit,
  canDeleteTask,
  compact,
}: {
  tasks: Task[]
  keywords?: Keyword[]
  users: User[]
  projects: Project[]
  onStatus: (taskId: string, status: TaskStatus) => void
  onApprove: (taskId: string) => void
  onRevision: (taskId: string) => void
  onReassign: (taskId: string, assigneeId: string) => void
  onAcceptTask?: (taskId: string) => void
  onRejectTask?: (taskId: string) => void
  onSubmitTask?: (taskId: string) => void
  onDeleteTask?: (taskId: string) => void
  currentUserId?: string
  allowAssigneeWorkflow?: boolean
  canEdit: boolean
  canDeleteTask?: boolean
  compact?: boolean
}) {
  if (tasks.length === 0) {
    return <EmptyState title="Chưa có công việc" text="Thêm task đầu tiên để theo dõi tiến độ thực thi của dự án." />
  }

  const articleKeywordByTaskId = new Map(
    keywords
      .filter((keyword) => keyword.articleTaskId && keyword.articleTitle?.trim() && keyword.articleUrl?.trim())
      .map((keyword) => [keyword.articleTaskId as string, keyword]),
  )

  return (
    <div className="table-wrap">
      <table className={compact ? 'task-table compact' : 'task-table'}>
        <thead>
          <tr>
            <th>Công việc</th>
            {!compact && <th>Dự án</th>}
            <th>Nhân sự</th>
            {compact ? <th>Thời hạn</th> : <><th>Thời gian giao</th><th>Yêu cầu hoàn thành</th></>}
            <th>Lương task</th>
            <th>Trạng thái</th>
            {(canEdit || allowAssigneeWorkflow) && <th>Tác vụ</th>}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const canUseAssigneeWorkflow = Boolean(allowAssigneeWorkflow && currentUserId && task.assigneeId === currentUserId)
            const canShowTaskActions = canEdit || canUseAssigneeWorkflow || canDeleteTask
            const status = taskStatusOf(task)
            const deadlineBadge = taskDeadlineBadge(task)
            const showAdminReviewActions = canEdit && status === 'Chờ duyệt'
            const articleKeyword = articleKeywordByTaskId.get(task.id)
            const canOpenArticle = Boolean(articleKeyword && ['Chờ duyệt', 'Hoàn thành'].includes(status))
            return (
            <tr className={deadlineBadge ? `task-deadline-${deadlineBadge.className}` : undefined} key={task.id}>
              <td>
                {canOpenArticle && articleKeyword?.articleUrl ? (
                  <a className="task-table-title article-task-title-link" href={articleKeyword.articleUrl.trim()} target="_blank" rel="noreferrer" title={`Mở bài viết: ${articleKeyword.articleTitle?.trim()}`}>
                    {task.title}
                  </a>
                ) : (
                  <strong className="task-table-title">{task.title}</strong>
                )}
              </td>
              {!compact && <td>{projects.find((project) => project.id === task.projectId)?.name}</td>}
              <td>
                <select
                  className="status-select"
                  value={task.assigneeId}
                  onChange={(event) => onReassign(task.id, event.target.value)}
                  disabled={!canEdit}
                >
                  <option value="">Chưa gán</option>
                  {users.map((user) => (
                    <option value={user.id} key={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </td>
              {compact ? (
                <td className="task-time-cell">
                  <span>Giao {formatDateTime(task.assignedAt)}</span>
                  <strong>Hạn {formatDateTime(taskDeadline(task))}</strong>
                  {deadlineBadge && <b className={`task-deadline-badge ${deadlineBadge.className}`}>{deadlineBadge.label}</b>}
                </td>
              ) : (
                <>
                  <td>{formatDateTime(task.assignedAt)}</td>
                  <td className="task-time-cell">
                    <strong>{formatDateTime(taskDeadline(task))}</strong>
                    {deadlineBadge && <b className={`task-deadline-badge ${deadlineBadge.className}`}>{deadlineBadge.label}</b>}
                  </td>
                </>
              )}
              <td>
                <strong>{currency.format(task.taskSalary ?? 0)}</strong>
                {task.salaryModule && <small className="task-note task-module">{task.salaryModule}</small>}
              </td>
              <td>
                <select className="status-select" value={status} onChange={(event) => onStatus(task.id, event.target.value as TaskStatus)} disabled={!canEdit || status === 'Đã hủy'}>
                  {editableTaskStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                {task.rejectionReason && <small className="task-note">Từ chối: {task.rejectionReason}</small>}
                {task.revisionNote && <small className="task-note revision">Cần sửa: {task.revisionNote}</small>}
              </td>
              {canShowTaskActions && (
                <td>
                  <div className="table-actions task-table-actions">
                    {showAdminReviewActions && (
                      <>
                        <button className="secondary-button task-action-button" type="button" onClick={() => onApprove(task.id)}>
                          Xác nhận
                        </button>
                        <button className="danger-button task-action-button" type="button" onClick={() => onRevision(task.id)}>
                          Cần sửa
                        </button>
                      </>
                    )}
                    {canUseAssigneeWorkflow && status === 'Chờ nhận' && (
                      <>
                        <button className="secondary-button task-action-button" type="button" onClick={() => onAcceptTask?.(task.id)}>
                          Nhận task
                        </button>
                        <button className="danger-button task-action-button" type="button" onClick={() => onRejectTask?.(task.id)}>
                          Từ chối
                        </button>
                      </>
                    )}
                    {canUseAssigneeWorkflow && ['Đang làm', 'Cần chỉnh sửa'].includes(status) && (
                      <button className="secondary-button task-action-button" type="button" onClick={() => onSubmitTask?.(task.id)}>
                        Gửi hoàn thành
                      </button>
                    )}
                    {canDeleteTask && (
                      <button className="danger-button task-action-button" type="button" onClick={() => onDeleteTask?.(task.id)}>
                        Xóa
                      </button>
                    )}
                    {!showAdminReviewActions && !(canUseAssigneeWorkflow && ['Chờ nhận', 'Đang làm', 'Cần chỉnh sửa'].includes(status)) && !canDeleteTask && <span className="task-action-empty">—</span>}
                  </div>
                </td>
              )}
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TransactionTable({
  transactions,
  projects,
  users,
  onEdit,
  onSettle,
}: {
  transactions: Transaction[]
  projects: Project[]
  users: User[]
  onEdit?: (transactionId: string) => void
  onSettle?: (transactionId: string) => void
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ngày chi</th>
            <th>Ngày giải ngân</th>
            <th>Phạm vi</th>
            <th>Dự án</th>
            <th>Người chi</th>
            <th>Nội dung</th>
            <th>Số tiền</th>
            {(onEdit || onSettle) && <th>Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{formatDateOnly(transaction.date)}</td>
              <td>{transaction.settlementDate ? formatDateOnly(transaction.settlementDate) : 'Công nợ'}</td>
              <td>{transaction.scope ?? 'Chi riêng dự án'}</td>
              <td>{transaction.scope === 'Chi chung dự án' ? 'Chi chung' : projects.find((project) => project.id === transaction.projectId)?.name ?? 'Dự án đã xóa'}</td>
              <td>{users.find((user) => user.id === transaction.spenderId)?.name ?? 'Chưa chọn'}</td>
              <td>{transaction.label}</td>
              <td>{currency.format(transaction.amount)}</td>
              {(onEdit || onSettle) && (
                <td>
                  <div className="table-actions">
                    {onSettle && (
                      <button className="secondary-button" type="button" onClick={() => onSettle(transaction.id)} disabled={Boolean(transaction.settlementDate)}>
                        Giải ngân
                      </button>
                    )}
                    {onEdit && (
                      <button className="secondary-button" type="button" onClick={() => onEdit(transaction.id)}>
                        Sửa
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PayrollSettlementPanel({
  users,
  tasks,
  settlements,
  canEdit,
  onSettle,
}: {
  users: User[]
  tasks: Task[]
  settlements: PayrollSettlement[]
  canEdit: boolean
  onSettle: (userId: string, period: string) => void
}) {
  const [period, setPeriod] = useState(currentPayrollPeriod)
  const rows = users.map((user) => {
    const preview = payrollAmountForUser(user, tasks, period)
    const amount = Math.round(preview.amount)
    const settlement = settlements.find((item) => item.userId === user.id && item.period === period)
    return { user, preview, amount, settlement }
  })
  const totalAmount = rows.reduce((sum, row) => sum + (row.settlement ? row.settlement.amount : row.amount), 0)

  return (
    <Panel title="Chốt lương nhân viên" action={`${formatPayrollPeriod(period)} - ${currency.format(totalAmount)}`}>
      <div className="payroll-toolbar">
        <label>
          <span>Kỳ lương</span>
          <input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} />
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nhân sự</th>
              <th>Loại lương</th>
              <th>Cơ sở tính</th>
              <th>Số tiền</th>
              <th>Trạng thái</th>
              {canEdit && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ user, preview, amount, settlement }) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.salaryType ?? 'Lương theo tháng'}</td>
                <td>{preview.basis}</td>
                <td>{currency.format(settlement?.amount ?? amount)}</td>
                <td>
                  {settlement ? (
                    <span className="pill income">Đã chốt {formatDateOnly(settlement.settledAt)}</span>
                  ) : (
                    <span className="pill">Chưa chốt</span>
                  )}
                </td>
                {canEdit && (
                  <td>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => onSettle(user.id, period)}
                      disabled={Boolean(settlement) || amount <= 0}
                    >
                      Chốt lương
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function ActivityLogTable({ logs }: { logs: ActivityLog[] }) {
  if (logs.length === 0) {
    return <EmptyState title="Chưa có nhật ký" text="Các thao tác tạo, sửa, xóa, backup dữ liệu sẽ được ghi tại đây." />
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Người thao tác</th>
            <th>Hành động</th>
            <th>Đối tượng</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.at)}</td>
              <td>{log.actorName}</td>
              <td>{log.action}</td>
              <td>{log.target}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UserTable({
  users,
  currentUserId,
  onEdit,
  onDelete,
  canEdit,
}: {
  users: User[]
  currentUserId: string
  onEdit: (userId: string) => void
  onDelete: (userId: string) => void
  canEdit: boolean
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Loại lương</th>
            <th>Mức lương</th>
            <th>Quyền truy cập</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.salaryType ?? 'Chưa cập nhật'}</td>
              <td>{currency.format(user.salaryAmount ?? 0)}</td>
              <td>{formatPermissionList(user.permissions)}</td>
              <td>
                <span className="pill income">{user.active ? 'Hoạt động' : 'Khóa'}</span>
              </td>
              <td>
                <div className="table-actions">
                  <button className="secondary-button" type="button" onClick={() => onEdit(user.id)} disabled={!canEdit}>
                    Sửa
                  </button>
                  <button className="danger-button" disabled={!canEdit || user.id === currentUserId} type="button" onClick={() => onDelete(user.id)}>
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App

