import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type View = 'overview' | 'projects' | 'keywords' | 'articles' | 'tasks' | 'finance' | 'people' | 'progress' | 'system'
type ProjectStatus = 'Đang SEO' | 'Tạm dừng' | 'Hoàn thành'
type TaskStatus = 'Cần làm' | 'Đang làm' | 'Hoàn thành'
type TransactionType = 'Thu' | 'Chi'
type Role = 'Quản trị viên' | 'Trưởng nhóm SEO' | 'Nội dung' | 'Tài chính' | 'Chỉ xem'
type SearchIntent = 'Informational' | 'Commercial' | 'Transactional' | 'Navigational'
type KeywordType = 'A' | 'B' | 'C'
type SalaryType = 'Lương theo giờ' | 'Lương theo tháng' | 'Lương theo task'
type ExpenseScope = 'Chi chung dự án' | 'Chi riêng dự án'
type ArticleType =
  | 'Informational Content'
  | 'Commercial Investigation / Review Content'
  | 'Transactional Content'
  | 'Category Hub'

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
  articleAssigneeId?: string
  articleUrl?: string
  articleTaskId?: string
}

type Task = {
  id: string
  projectId: string
  title: string
  assigneeId: string
  dueDate: string
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
}

type ActivityLog = {
  id: string
  actorId: string
  actorName: string
  action: string
  target: string
  at: string
}

type AppData = {
  projects: Project[]
  keywords: Keyword[]
  tasks: Task[]
  transactions: Transaction[]
  users: User[]
  activityLogs?: ActivityLog[]
}

const storageKey = 'seo-demo-data-v5'
const appVersion = '1.0.0'
const permissions = ['Dự án', 'Tài chính', 'Nhân sự', 'Tiến độ', 'Hệ thống']
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

const initialData: AppData = {
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
}

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const pct = (value: number) => `${Math.round(value)}%`
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
const field = (value: string | number | undefined, fallback = 'Chưa cập nhật') =>
  value === undefined || value === '' || value === 0 ? fallback : String(value)
const keywordTypeOf = (keyword: Keyword): KeywordType => keyword.keywordType ?? 'A'
const childTypeOf = (keyword: Keyword): KeywordType | null => {
  const type = keywordTypeOf(keyword)
  if (type === 'A') return 'B'
  if (type === 'B') return 'C'
  return null
}
const getViewFromHash = (): View => {
  const view = window.location.hash.replace('#', '')
  return ['overview', 'projects', 'keywords', 'articles', 'tasks', 'finance', 'people', 'progress', 'system'].includes(view)
    ? (view as View)
    : 'overview'
}
const setHashView = (view: View) => {
  window.history.replaceState(null, '', `#${view}`)
}

const permissionForView = (view: View) => {
  if (['projects', 'keywords', 'articles', 'tasks'].includes(view)) return 'Dự án'
  if (view === 'finance') return 'Tài chính'
  if (view === 'people') return 'Nhân sự'
  if (view === 'progress') return 'Tiến độ'
  if (view === 'system') return 'Hệ thống'
  return ''
}

const normalizeData = (data: AppData): AppData => ({
  ...data,
  users: data.users.map((user) => ({
    ...user,
    password: user.password ?? '123456',
    salaryType: user.salaryType ?? 'Lương theo tháng',
    salaryAmount: user.salaryAmount ?? 0,
  })),
  keywords: data.keywords.map((keyword) => ({
    ...keyword,
    keywordType: keyword.keywordType ?? 'A',
    articleType: keyword.articleType ?? 'Informational Content',
    articleAssigneeId: keyword.articleAssigneeId ?? '',
    articleUrl: keyword.articleUrl ?? '',
    articleTaskId: keyword.articleTaskId ?? '',
  })),
  transactions: data.transactions.map((transaction) => ({
    ...transaction,
    type: 'Chi',
    scope: transaction.scope ?? (transaction.projectId ? 'Chi riêng dự án' : 'Chi chung dự án'),
    spenderId: transaction.spenderId ?? '',
    settlementDate: transaction.settlementDate ?? '',
  })),
  activityLogs: data.activityLogs ?? [],
})

function useStoredData() {
  const [data, setData] = useState<AppData>(() => {
    const raw = localStorage.getItem(storageKey)
    return raw ? normalizeData(JSON.parse(raw)) : initialData
  })

  const updateData = (next: AppData) => {
    setData(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  return [data, updateData] as const
}

function App() {
  const [data, setData] = useStoredData()
  const [view, setView] = useState<View>(getViewFromHash)
  const [activeProjectId, setActiveProjectId] = useState(data.projects[0]?.id ?? '')
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('seo-demo-current-user') || '')
  const [loginError, setLoginError] = useState('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [keywordBuilder, setKeywordBuilder] = useState<Keyword | null>(null)
  const [collapsedKeywordIds, setCollapsedKeywordIds] = useState<Set<string>>(() => new Set())
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<Set<string>>(() => new Set())

  const activeProjects = data.projects.filter((project) => !project.deletedAt)
  const deletedProjects = data.projects.filter((project) => project.deletedAt)
  const activeProjectIds = new Set(activeProjects.map((project) => project.id))
  const activeTasks = data.tasks.filter((task) => activeProjectIds.has(task.projectId))
  const activeKeywords = data.keywords.filter((keyword) => activeProjectIds.has(keyword.projectId))
  const activeTransactions = data.transactions.filter((item) => activeProjectIds.has(item.projectId))
  const activeProject = activeProjects.find((project) => project.id === activeProjectId) ?? activeProjects[0]
  const currentUser = data.users.find((user) => user.id === currentUserId && user.active)
  const isAdmin = currentUser?.role === 'Quản trị viên'
  const hasPermission = (permission: string) => isAdmin || !permission || Boolean(currentUser?.permissions.includes(permission))
  const canView = (targetView: View) => hasPermission(permissionForView(targetView))
  const projectTasks = data.tasks.filter((task) => task.projectId === activeProject?.id)
  const projectKeywords = data.keywords.filter((keyword) => keyword.projectId === activeProject?.id)
  const projectTransactions = data.transactions.filter((item) => item.projectId === activeProject?.id)
  const projectExpense = projectTransactions.reduce((sum, item) => sum + item.amount, 0)
  const projectCompletion = projectTasks.length
    ? (projectTasks.filter((task) => task.status === 'Hoàn thành').length / projectTasks.length) * 100
    : 0

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
  const saveData = (nextData: AppData, action: string, target: string) => {
    const log: ActivityLog = {
      id: uid('log'),
      actorId: currentUser?.id ?? '',
      actorName: currentUser?.name ?? 'Hệ thống',
      action,
      target,
      at: new Date().toISOString(),
    }
    setData({
      ...nextData,
      activityLogs: [log, ...(nextData.activityLogs ?? [])].slice(0, 300),
    })
  }
  const downloadBackup = () => {
    const backup = {
      version: appVersion,
      exportedAt: new Date().toISOString(),
      storageKey,
      data,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `seo-ops-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    saveData(data, 'Tải backup dữ liệu', 'Hệ thống')
  }
  const goTo = (nextView: View) => {
    if (!canView(nextView)) return
    setView(nextView)
    setHashView(nextView)
  }

  const login = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim()
    const password = String(form.get('password'))
    const user = data.users.find((item) => item.email === email && item.password === password && item.active)
    if (!user) {
      setLoginError('Email hoặc mật khẩu không đúng.')
      return
    }
    setCurrentUserId(user.id)
    localStorage.setItem('seo-demo-current-user', user.id)
    setLoginError('')
    const nextView = isAdmin || user.permissions.includes(permissionForView(view)) || !permissionForView(view) ? view : 'overview'
    setView(nextView)
    setHashView(nextView)
    event.currentTarget.reset()
  }

  const logout = () => {
    localStorage.removeItem('seo-demo-current-user')
    setCurrentUserId('')
    setView('overview')
    setHashView('overview')
  }

  const addProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const project: Project = {
      id: uid('p'),
      name: String(form.get('name')).trim(),
      client: String(form.get('client')).trim(),
      website: String(form.get('website')).trim(),
      startDate: String(form.get('startDate')).trim(),
      endDate: String(form.get('endDate')).trim(),
      budget: Number(form.get('budget')) || 0,
      status: (String(form.get('status')) as ProjectStatus) || 'Đang SEO',
      ownerId: String(form.get('ownerId')),
    }
    saveData({ ...data, projects: [project, ...data.projects] }, 'Tạo dự án', project.name)
    setActiveProjectId(project.id)
    event.currentTarget.reset()
  }

  const archiveProject = (projectId: string) => {
    const project = data.projects.find((item) => item.id === projectId)
    if (!project || !window.confirm(`Bạn có chắc chắn muốn xóa dự án "${project.name}"? Dự án sẽ được chuyển vào khu vực khôi phục.`)) {
      return
    }

    const projects = data.projects.map((item) =>
      item.id === projectId ? { ...item, deletedAt: new Date().toISOString() } : item,
    )
    const remainingProjects = projects.filter((item) => !item.deletedAt)
    saveData({ ...data, projects }, 'Xóa dự án', project.name)
    setActiveProjectId(remainingProjects[0]?.id ?? '')
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
    setActiveProjectId(projectId)
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
    }, 'Xóa vĩnh viễn dự án', project.name)
  }

  const addKeyword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeProject) return
    const form = new FormData(event.currentTarget)
    const keyword: Keyword = {
      id: uid('k'),
      projectId: activeProject.id,
      keywordType: 'A',
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
      articleType: 'Informational Content',
      articleAssigneeId: '',
      articleUrl: '',
      articleTaskId: '',
    }
    saveData({ ...data, keywords: [keyword, ...data.keywords] }, 'Thêm keyword', keyword.term)
    event.currentTarget.reset()
  }

  const developKeyword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
      articleAssigneeId: '',
      articleUrl: '',
      articleTaskId: '',
    }

    const parentIndex = data.keywords.findIndex((item) => item.id === keywordBuilder.id)
    const keywords =
      parentIndex >= 0
        ? [...data.keywords.slice(0, parentIndex + 1), keyword, ...data.keywords.slice(parentIndex + 1)]
        : [keyword, ...data.keywords]

    saveData({ ...data, keywords }, 'Phát triển keyword', keyword.term)
    setCollapsedKeywordIds((current) => {
      const next = new Set(current)
      next.delete(keywordBuilder.id)
      return next
    })
    setKeywordBuilder(null)
  }

  const toggleKeywordCollapse = (keywordId: string) => {
    setCollapsedKeywordIds((current) => {
      const next = new Set(current)
      if (next.has(keywordId)) {
        next.delete(keywordId)
      } else {
        next.add(keywordId)
      }
      return next
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

  const deleteSelectedKeywords = () => {
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

  const updateKeywordArticle = (keywordId: string, updates: Partial<Pick<Keyword, 'articleType' | 'articleAssigneeId' | 'articleUrl'>>) => {
    saveData({
      ...data,
      keywords: data.keywords.map((keyword) => (keyword.id === keywordId ? { ...keyword, ...updates } : keyword)),
    }, 'Cập nhật bài viết keyword', data.keywords.find((keyword) => keyword.id === keywordId)?.term ?? keywordId)
  }

  const sendArticleTask = (keywordId: string) => {
    const keyword = data.keywords.find((item) => item.id === keywordId)
    if (!keyword || !activeProject) return
    if (!keyword.articleAssigneeId) {
      window.alert('Vui lòng chọn người phụ trách trước khi gửi task.')
      return
    }

    const title = `Viết bài: ${keyword.term}`
    const existingTask = keyword.articleTaskId ? data.tasks.find((task) => task.id === keyword.articleTaskId) : undefined
    const taskId = existingTask?.id ?? uid('t')
    const task: Task = existingTask
      ? { ...existingTask, title, assigneeId: keyword.articleAssigneeId, projectId: keyword.projectId }
      : {
          id: taskId,
          projectId: keyword.projectId,
          title,
          assigneeId: keyword.articleAssigneeId,
          dueDate: '',
          status: 'Cần làm',
        }

    saveData({
      ...data,
      keywords: data.keywords.map((item) => (item.id === keywordId ? { ...item, articleTaskId: taskId } : item)),
      tasks: existingTask ? data.tasks.map((item) => (item.id === taskId ? task : item)) : [task, ...data.tasks],
    }, existingTask ? 'Phân việc lại bài viết' : 'Gửi task bài viết', keyword.term)
  }

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeProject) return
    const form = new FormData(event.currentTarget)
    const task: Task = {
      id: uid('t'),
      projectId: activeProject.id,
      title: String(form.get('title')).trim(),
      assigneeId: String(form.get('assigneeId')),
      dueDate: String(form.get('dueDate')),
      status: 'Cần làm',
    }
    saveData({ ...data, tasks: [task, ...data.tasks] }, 'Thêm task', task.title)
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
      settlementDate: String(form.get('settlementDate')),
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

  const saveUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const user: User = {
      id: editingUserId ?? uid('u'),
      name: String(form.get('name')).trim(),
      email: String(form.get('email')).trim(),
      password: String(form.get('password')) || '123456',
      role: String(form.get('role')) as Role,
      active: true,
      permissions: form.getAll('permissions').map(String),
      salaryType: String(form.get('salaryType')) as SalaryType,
      salaryAmount: Number(form.get('salaryAmount')) || 0,
    }
    saveData({
      ...data,
      users: editingUserId ? data.users.map((item) => (item.id === editingUserId ? user : item)) : [user, ...data.users],
    }, editingUserId ? 'Sửa nhân sự' : 'Thêm nhân sự', user.name)
    setEditingUserId(null)
    event.currentTarget.reset()
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

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    saveData({
      ...data,
      tasks: data.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    }, 'Cập nhật trạng thái task', data.tasks.find((task) => task.id === taskId)?.title ?? taskId)
  }

  if (!currentUser) {
    return <LoginPage error={loginError} onSubmit={login} />
  }

  return (
    <div className="app-shell">
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
          {hasPermission('Dự án') && (
            <>
              <NavButton view="projects" current={view} label="Dự án SEO" onClick={goTo} />
              <div className="nav-children" aria-label="Module con của Dự án SEO">
                <NavButton view="keywords" current={view} label="Quản lý Keyword" onClick={goTo} child />
                <NavButton view="articles" current={view} label="Bài viết" onClick={goTo} child />
                <NavButton view="tasks" current={view} label="Task công việc" onClick={goTo} child />
              </div>
            </>
          )}
          {hasPermission('Tài chính') && <NavButton view="finance" current={view} label="Tài chính" onClick={goTo} />}
          {hasPermission('Nhân sự') && <NavButton view="people" current={view} label="Nhân sự" onClick={goTo} />}
          {hasPermission('Tiến độ') && <NavButton view="progress" current={view} label="Tiến độ" onClick={goTo} />}
          {hasPermission('Hệ thống') && (
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
          {activeProjects.length > 0 && (
            <label className="project-switcher">
              <span>Dự án đang xem</span>
              <select value={activeProject?.id ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {activeProjects.map((project) => (
                  <option value={project.id} key={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </header>

        {!canView(view) && (
          <Panel title="Không có quyền truy cập" action={currentUser?.role ?? 'Chưa đăng nhập'}>
            <EmptyState title="Tài khoản chưa được phân quyền" text="Vui lòng đăng nhập bằng tài khoản có quyền phù hợp hoặc liên hệ quản trị viên để cấp quyền." />
          </Panel>
        )}

        {view === 'overview' && canView(view) && (
          <section className="view-stack">
            <div className="metric-grid">
              <Metric title="Tổng dự án" value={activeProjects.length} note={`${projectProgress.filter((p) => p.status === 'Đang SEO').length} đang SEO`} />
              <Metric title="Tổng chi phí" value={currency.format(expense)} note="Không tính doanh thu" />
              <Metric title="Task hoàn thành" value={pct(completionRate)} note={`${completedTasks}/${activeTasks.length} công việc`} />
              <Metric title="Position TB" value={avgPosition.toFixed(1)} note={`${activeKeywords.length} keyword đang theo dõi`} />
            </div>

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
              <TaskTable tasks={activeTasks.slice(0, 6)} users={data.users} projects={data.projects} onStatus={updateTaskStatus} />
            </Panel>
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
                      const keywords = data.keywords.filter((keyword) => keyword.projectId === project.id)
                      const isActive = activeProject?.id === project.id
                      return (
                        <button className={isActive ? 'project-card selected' : 'project-card'} key={project.id} onClick={() => setActiveProjectId(project.id)} type="button">
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

              <Panel title="Tạo dự án SEO" action="Chỉ bắt buộc tên và website">
                <form className="form-grid compact" onSubmit={addProject}>
                  <input name="name" placeholder="Tên dự án *" required />
                  <input name="website" placeholder="Website *" required />
                  <input name="client" placeholder="Khách hàng" />
                  <input name="budget" placeholder="Ngân sách" type="number" min="0" />
                  <input name="startDate" aria-label="Ngày bắt đầu" type="date" />
                  <input name="endDate" aria-label="Ngày kết thúc" type="date" />
                  <select name="status">
                    <option>Đang SEO</option>
                    <option>Tạm dừng</option>
                    <option>Hoàn thành</option>
                  </select>
                  <select name="ownerId">
                    <option value="">Chưa gán phụ trách</option>
                    {data.users.map((user) => (
                      <option value={user.id} key={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit">Tạo dự án</button>
                </form>
              </Panel>
            </div>

            {activeProject && (
              <>
                <div className="metric-grid">
                  <Metric title="Tiến độ dự án" value={pct(projectCompletion)} note={`${projectTasks.filter((task) => task.status === 'Hoàn thành').length}/${projectTasks.length} công việc`} />
                  <Metric title="Keyword" value={projectKeywords.length} note={`Position TB ${projectKeywords.length ? (projectKeywords.reduce((sum, item) => sum + item.position, 0) / projectKeywords.length).toFixed(1) : '0'}`} />
                  <Metric title="Chi phí dự án" value={currency.format(projectExpense)} note="Tổng chi đang ghi nhận" />
                  <Metric title="Chưa quyết toán" value={projectTransactions.filter((item) => !item.settlementDate).length} note={activeProject.status} />
                </div>

                <div className="split-grid">
                  <Panel title="Chi tiết dự án" action={activeProject.status}>
                    <div className="project-detail">
                      <Detail label="Khách hàng" value={field(activeProject.client)} />
                      <Detail label="Website" value={activeProject.website} />
                      <Detail label="Phụ trách" value={ownerName(activeProject.ownerId)} />
                      <Detail label="Ngân sách" value={activeProject.budget ? currency.format(activeProject.budget) : 'Chưa cập nhật'} />
                      <Detail label="Ngày bắt đầu" value={field(activeProject.startDate)} />
                      <Detail label="Ngày kết thúc" value={field(activeProject.endDate)} />
                    </div>
                    <div className="panel-actions">
                      <button className="danger-button" type="button" onClick={() => archiveProject(activeProject.id)}>
                        Xóa dự án
                      </button>
                    </div>
                  </Panel>

                  <Panel title="Thống kê thực thi" action="Dự án đang chọn">
                    <div className="progress-list">
                      <ProgressRow label="Tiến độ công việc" value={projectCompletion} meta={`${projectTasks.length} công việc`} />
                      <ProgressRow label="CTR trung bình" value={projectKeywords.length ? projectKeywords.reduce((sum, keyword) => sum + keyword.ctr, 0) / projectKeywords.length : 0} meta={`${projectKeywords.length} keyword`} />
                      <ProgressRow label="Đã quyết toán" value={projectTransactions.length ? (projectTransactions.filter((item) => item.settlementDate).length / projectTransactions.length) * 100 : 0} meta={`${projectTransactions.filter((item) => item.settlementDate).length}/${projectTransactions.length} khoản chi`} />
                    </div>
                  </Panel>
                </div>
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
                        <small>Đã xóa: {project.deletedAt ? new Date(project.deletedAt).toLocaleString('vi-VN') : 'Chưa rõ thời gian'}</small>
                      </div>
                      <div className="deleted-project-actions">
                        <button className="secondary-button" type="button" onClick={() => restoreProject(project.id)}>
                          Khôi phục dự án
                        </button>
                        <button className="danger-button" type="button" onClick={() => permanentlyDeleteProject(project.id)}>
                          Xóa vĩnh viễn
                        </button>
                      </div>
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
              <Metric title="Keyword của dự án" value={projectKeywords.length} note={activeProject?.name ?? 'Chưa có dự án'} />
              <Metric title="Search Volume" value={projectKeywords.reduce((sum, item) => sum + item.searchVolume, 0).toLocaleString('vi-VN')} note="Tổng lượng tìm kiếm" />
              <Metric title="Position TB" value={projectKeywords.length ? (projectKeywords.reduce((sum, item) => sum + item.position, 0) / projectKeywords.length).toFixed(1) : '0'} note="Thứ hạng trung bình" />
              <Metric title="CTR TB" value={`${projectKeywords.length ? (projectKeywords.reduce((sum, item) => sum + item.ctr, 0) / projectKeywords.length).toFixed(2) : '0'}%`} note="Tỷ lệ nhấp trung bình" />
            </div>

            <Panel title="Thêm key" action="Keyword Mapping">
              <form className="keyword-form" onSubmit={addKeyword}>
                <input name="term" placeholder="Keyword *" required />
                <input name="landingUrl" placeholder="Landing URL" />
                <input name="searchVolume" placeholder="Search Volume" type="number" min="0" />
                <input name="keywordDifficulty" placeholder="Keyword Difficulty" type="number" min="0" max="100" />
                <select name="searchIntent">
                  <option>Informational</option>
                  <option>Commercial</option>
                  <option>Transactional</option>
                  <option>Navigational</option>
                </select>
                <input name="position" placeholder="Position" type="number" min="1" />
                <input name="impressions" placeholder="Impressions" type="number" min="0" />
                <input name="clicks" placeholder="Clicks" type="number" min="0" />
                <input name="organicTraffic" placeholder="Organic Traffic" type="number" min="0" />
                <input name="ctr" placeholder="CTR (%)" type="number" min="0" step="0.01" />
                <button type="submit">Thêm key</button>
              </form>
            </Panel>

            <Panel title="Quản lý Keyword" action={`${projectKeywords.length} keyword`}>
              <KeywordTable
                keywords={projectKeywords}
                collapsedKeywordIds={collapsedKeywordIds}
                selectedKeywordIds={selectedKeywordIds}
                onToggleCollapse={toggleKeywordCollapse}
                onToggleSelect={toggleKeywordSelection}
                onDeleteSelected={deleteSelectedKeywords}
                onDevelopKeyword={setKeywordBuilder}
              />
            </Panel>
          </section>
        )}

        {view === 'articles' && canView(view) && (
          <section className="view-stack">
            <div className="metric-grid">
              <Metric title="Keyword cần bài viết" value={projectKeywords.length} note={activeProject?.name ?? 'Chưa có dự án'} />
              <Metric title="Đã gửi task" value={projectKeywords.filter((keyword) => keyword.articleTaskId).length} note="Đã phân việc" />
              <Metric title="Đã có link" value={projectKeywords.filter((keyword) => keyword.articleUrl).length} note="Đã cập nhật URL bài viết" />
              <Metric title="Chưa phân công" value={projectKeywords.filter((keyword) => !keyword.articleAssigneeId).length} note="Cần chọn phụ trách" />
            </div>
            <Panel title="Bài viết" action={`${projectKeywords.length} keyword`}>
              <ArticleTable
                keywords={projectKeywords}
                users={data.users}
                onUpdateKeyword={updateKeywordArticle}
                onSendTask={sendArticleTask}
              />
            </Panel>
          </section>
        )}

        {view === 'tasks' && canView(view) && (
          <section className="view-stack">
            <div className="metric-grid">
              <Metric title="Task dự án" value={projectTasks.length} note={activeProject?.name ?? 'Chưa có dự án'} />
              <Metric title="Hoàn thành" value={projectTasks.filter((task) => task.status === 'Hoàn thành').length} note={pct(projectCompletion)} />
              <Metric title="Đang làm" value={projectTasks.filter((task) => task.status === 'Đang làm').length} note="Đang xử lý" />
              <Metric title="Cần làm" value={projectTasks.filter((task) => task.status === 'Cần làm').length} note="Chưa bắt đầu" />
            </div>
            <Panel title="Thêm công việc" action="Theo dự án đang chọn">
              <form className="form-grid" onSubmit={addTask}>
                <input name="title" placeholder="Tên công việc" required />
                <select name="assigneeId" required>
                  {data.users.map((user) => (
                    <option value={user.id} key={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <input name="dueDate" aria-label="Hạn hoàn thành" type="date" required />
                <button type="submit">Thêm công việc</button>
              </form>
            </Panel>
            <Panel title="Task công việc" action={`${projectTasks.filter((task) => task.status === 'Hoàn thành').length}/${projectTasks.length} xong`}>
              <TaskTable tasks={projectTasks} users={data.users} projects={data.projects} onStatus={updateTaskStatus} compact />
            </Panel>
          </section>
        )}

        {view === 'finance' && canView(view) && (
          <section className="view-stack">
            <div className="metric-grid">
              <Metric title="Tổng chi phí" value={currency.format(expense)} note="Không tính doanh thu" />
              <Metric title="Chi chung" value={currency.format(activeTransactions.filter((item) => item.scope === 'Chi chung dự án').reduce((sum, item) => sum + item.amount, 0))} note="Chi phí vận hành chung" />
              <Metric title="Chi riêng dự án" value={currency.format(activeTransactions.filter((item) => item.scope !== 'Chi chung dự án').reduce((sum, item) => sum + item.amount, 0))} note="Theo từng dự án" />
              <Metric title="Chưa quyết toán" value={activeTransactions.filter((item) => !item.settlementDate).length} note="Cần chi trả cho người chi" />
            </div>
            <div className="dashboard-grid">
              <Panel title={editingTransaction ? 'Sửa khoản chi' : 'Tạo khoản chi'} action="Chi phí dự án">
                <form className="form-grid" onSubmit={saveExpense} key={editingTransaction?.id ?? 'new-expense'}>
                  <select name="scope" defaultValue={editingTransaction?.scope ?? 'Chi riêng dự án'}>
                    <option>Chi chung dự án</option>
                    <option>Chi riêng dự án</option>
                  </select>
                  <select name="projectId" required>
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
                  <input name="settlementDate" aria-label="Ngày quyết toán" type="date" defaultValue={editingTransaction?.settlementDate ?? ''} />
                  <button type="submit">{editingTransaction ? 'Cập nhật khoản chi' : 'Lưu khoản chi'}</button>
                  {editingTransaction && (
                    <button className="secondary-button" type="button" onClick={() => setEditingTransactionId(null)}>
                      Hủy sửa
                    </button>
                  )}
                </form>
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
            <Panel title="Lịch sử chi phí" action={`${activeTransactions.length} dòng`}>
              <TransactionTable transactions={activeTransactions} projects={data.projects} users={data.users} onEdit={isAdmin ? editExpense : undefined} />
            </Panel>
          </section>
        )}

        {view === 'people' && canView(view) && (
          <section className="view-stack">
            <div className="split-grid">
              <Panel title={editingUser ? 'Sửa nhân sự' : 'Thêm nhân sự'} action="Đăng nhập, phân quyền và lương">
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
                  <div className="permission-box">
                    {permissions.map((permission) => (
                      <label key={permission}>
                        <input
                          name="permissions"
                          type="checkbox"
                          value={permission}
                          defaultChecked={editingUser ? editingUser.permissions.includes(permission) : permission !== 'Nhân sự'}
                        />
                        {permission}
                      </label>
                    ))}
                  </div>
                  <button type="submit">{editingUser ? 'Cập nhật nhân sự' : 'Tạo nhân sự'}</button>
                  {editingUser && (
                    <button className="secondary-button" type="button" onClick={() => setEditingUserId(null)}>
                      Hủy sửa
                    </button>
                  )}
                </form>
              </Panel>
              <Panel title="Hiệu suất nhân sự" action={`${data.users.length} tài khoản`}>
                <div className="progress-list">
                  {staffProgress.map((user) => (
                    <ProgressRow key={user.id} label={user.name} value={user.rate} meta={`${user.done}/${user.tasks} công việc`} />
                  ))}
                </div>
              </Panel>
            </div>
            <Panel title="Danh sách nhân sự" action="Vai trò và quyền">
              <UserTable users={data.users} currentUserId={currentUser?.id ?? ''} onEdit={editUser} onDelete={deleteUser} />
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
              <TaskTable tasks={activeTasks} users={data.users} projects={data.projects} onStatus={updateTaskStatus} />
            </Panel>
          </section>
        )}

        {view === 'system' && canView(view) && (
          <section className="view-stack">
            <div className="metric-grid">
              <Metric title="Phiên bản" value={appVersion} note="Demo localStorage" />
              <Metric title="Storage key" value={storageKey} note="Giữ dữ liệu test hiện tại" />
              <Metric title="Nhật ký" value={activityLogs.length} note="Tối đa 300 dòng gần nhất" />
              <Metric title="Backup" value="JSON" note="Tải toàn bộ dữ liệu hiện tại" />
            </div>
            <div className="dashboard-grid">
              <Panel title="Thông tin phiên bản" action="Hệ thống">
                <div className="project-detail">
                  <Detail label="Tên ứng dụng" value="SEO Ops Project Manager" />
                  <Detail label="Phiên bản" value={appVersion} />
                  <Detail label="Cơ chế lưu trữ" value="LocalStorage demo" />
                  <Detail label="Cập nhật dữ liệu" value="Không đổi storageKey để giữ dữ liệu test" />
                </div>
              </Panel>
              <Panel title="Backup dữ liệu" action="Tải về">
                <div className="backup-panel">
                  <p>File backup chứa toàn bộ dự án, keyword, bài viết, task, tài chính, nhân sự và nhật ký hoạt động hiện tại.</p>
                  <button type="button" onClick={downloadBackup}>
                    Tải backup JSON
                  </button>
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
    </div>
  )
}

function viewTitle(view: View) {
  return {
    overview: 'Tổng quan công ty',
    projects: 'Dự án SEO',
    keywords: 'Quản lý Keyword',
    articles: 'Bài viết',
    tasks: 'Task công việc',
    finance: 'Tài chính',
    people: 'Nhân sự',
    progress: 'Tiến độ',
    system: 'Hệ thống',
  }[view]
}

function LoginPage({ error, onSubmit }: { error: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
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
            <input name="password" placeholder="123456" type="password" required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit">Đăng nhập</button>
        </form>
        <p className="login-hint">Tài khoản demo dùng mật khẩu mặc định: 123456.</p>
      </section>
    </main>
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
      {name === 'keywords' && <path d="M4 5h16v3H4V5Zm2 5h12v3H6v-3Zm-2 5h16v4H4v-4Z" />}
      {name === 'articles' && <path d="M5 4h14v16H5V4Zm3 4h8V6H8v2Zm0 4h8v-2H8v2Zm0 4h5v-2H8v2Z" />}
      {name === 'tasks' && <path d="M5 6h3v3H5V6Zm5 1h9v2h-9V7Zm-5 5h3v3H5v-3Zm5 1h9v2h-9v-2Zm-5 5h3v3H5v-3Zm5 1h9v2h-9v-2Z" />}
      {name === 'finance' && <path d="M5 19h14v-2H5v2Zm1-4h3V8H6v7Zm5 0h3V5h-3v10Zm5 0h3v-5h-3v5Z" />}
      {name === 'people' && <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19c.5-3.2 2.2-5 5-5s4.5 1.8 5 5H3Zm10.5 0c.4-2 1.4-3.4 3.4-3.4 1.9 0 3.1 1.2 3.5 3.4h-6.9Z" />}
      {name === 'progress' && <path d="M5 12.5 9 16l10-10 1.5 1.5L9 19 3.5 14 5 12.5Z" />}
      {name === 'system' && <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 2.3L17.5 8 12 10.7 6.5 8 12 5.3ZM6 9.7l5 2.5v6.1l-5-2.5V9.7Zm7 8.6v-6.1l5-2.5v6.1l-5 2.5Z" />}
    </svg>
  )
}

function Metric({ title, value, note }: { title: string; value: string | number; note: string }) {
  return (
    <article className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  )
}

function Panel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <section className="panel">
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

const keywordTooltips = {
  keyword: 'Từ khóa chính cần theo dõi và tối ưu.',
  landingUrl: 'URL đích được map với từ khóa trong kế hoạch nội dung hoặc tối ưu sản phẩm.',
  article: 'Link bài viết đã xuất bản hoặc đang được cập nhật từ module Bài viết.',
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

function KeywordTable({
  keywords,
  collapsedKeywordIds,
  selectedKeywordIds,
  onToggleCollapse,
  onToggleSelect,
  onDeleteSelected,
  onDevelopKeyword,
}: {
  keywords: Keyword[]
  collapsedKeywordIds: Set<string>
  selectedKeywordIds: Set<string>
  onToggleCollapse: (keywordId: string) => void
  onToggleSelect: (keywordId: string) => void
  onDeleteSelected: () => void
  onDevelopKeyword: (keyword: Keyword) => void
}) {
  if (keywords.length === 0) {
    return <EmptyState title="Chưa có keyword" text="Thêm key đầu tiên để lập bản đồ từ khóa và theo dõi hiệu suất SEO cho dự án này." />
  }

  const keywordByParent = keywords.reduce<Record<string, Keyword[]>>((groups, keyword) => {
    const parentId = keyword.parentId || 'root'
    groups[parentId] = [...(groups[parentId] || []), keyword]
    return groups
  }, {})

  const rows: { keyword: Keyword; level: number; hidden: boolean; hasChildren: boolean }[] = []
  const pushRows = (items: Keyword[], level: number, hidden: boolean) => {
    items.forEach((keyword) => {
      const children = keywordByParent[keyword.id] || []
      const isCollapsed = collapsedKeywordIds.has(keyword.id)
      rows.push({ keyword, level, hidden, hasChildren: children.length > 0 })
      pushRows(children, level + 1, hidden || isCollapsed)
    })
  }

  pushRows(keywordByParent.root || [], 0, false)

  return (
    <>
      <div className="bulk-actions">
        <span>{selectedKeywordIds.size} keyword được chọn</span>
        <button className="danger-button" disabled={selectedKeywordIds.size === 0} onClick={onDeleteSelected} type="button">
          Xóa key đã chọn
        </button>
      </div>
      <div className="table-wrap keyword-table-wrap">
        <table className="keyword-table">
        <thead>
          <tr>
            <th>Chọn</th>
            <Th label="Keyword" tip={keywordTooltips.keyword} />
            <Th label="Landing URL" tip={keywordTooltips.landingUrl} />
            <Th label="Bài viết" tip={keywordTooltips.article} />
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
          {rows.map(({ keyword, level, hidden, hasChildren }) => (
            <tr className={hidden ? 'keyword-row hidden' : `keyword-row level-${level}`} key={keyword.id}>
              <td>
                <input
                  checked={selectedKeywordIds.has(keyword.id)}
                  onChange={() => onToggleSelect(keyword.id)}
                  type="checkbox"
                  aria-label={`Chọn keyword ${keyword.term}`}
                />
              </td>
              <td>
                <div className="keyword-tree-cell" style={{ paddingLeft: `${level * 22}px` }}>
                  <button
                    className="tree-toggle"
                    disabled={!hasChildren}
                    onClick={() => onToggleCollapse(keyword.id)}
                    type="button"
                    aria-label={collapsedKeywordIds.has(keyword.id) ? 'Mở rộng keyword' : 'Thu gọn keyword'}
                  >
                    {hasChildren ? (collapsedKeywordIds.has(keyword.id) ? '+' : '-') : ''}
                  </button>
                  <span className={`keyword-type-badge type-${keywordTypeOf(keyword)}`}>{keywordTypeOf(keyword)}</span>
                  <strong>{keyword.term}</strong>
                  {childTypeOf(keyword) && (
                    <button className="develop-keyword-button" onClick={() => onDevelopKeyword(keyword)} type="button" title={`Phát triển lên keyword loại ${childTypeOf(keyword)}`}>
                      +
                    </button>
                  )}
                </div>
              </td>
              <td>{field(keyword.landingUrl)}</td>
              <td>{keyword.articleUrl ? <a href={keyword.articleUrl} target="_blank" rel="noreferrer">Mở bài viết</a> : 'Chưa cập nhật'}</td>
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
          ))}
        </tbody>
        </table>
      </div>
    </>
  )
}

function ArticleTable({
  keywords,
  users,
  onUpdateKeyword,
  onSendTask,
}: {
  keywords: Keyword[]
  users: User[]
  onUpdateKeyword: (keywordId: string, updates: Partial<Pick<Keyword, 'articleType' | 'articleAssigneeId' | 'articleUrl'>>) => void
  onSendTask: (keywordId: string) => void
}) {
  if (keywords.length === 0) {
    return <EmptyState title="Chưa có keyword" text="Thêm keyword ở module Quản lý Keyword, danh sách bài viết sẽ tự động đồng bộ tại đây." />
  }

  return (
    <div className="table-wrap article-table-wrap">
      <table className="article-table">
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Loại key</th>
            <th>Loại bài viết</th>
            <th>Người phụ trách</th>
            <th>Gửi task</th>
            <th>Link bài viết</th>
          </tr>
        </thead>
        <tbody>
          {keywords.map((keyword) => (
            <tr key={keyword.id}>
              <td>{keyword.term}</td>
              <td>
                <span className={`keyword-type-badge type-${keywordTypeOf(keyword)}`}>{keywordTypeOf(keyword)}</span>
              </td>
              <td>
                <select
                  value={keyword.articleType ?? 'Informational Content'}
                  onChange={(event) => onUpdateKeyword(keyword.id, { articleType: event.target.value as ArticleType })}
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
                <button className="secondary-button" type="button" onClick={() => onSendTask(keyword.id)}>
                  {keyword.articleTaskId ? 'Phân việc lại' : 'Gửi Task'}
                </button>
              </td>
              <td>
                <input
                  value={keyword.articleUrl ?? ''}
                  onChange={(event) => onUpdateKeyword(keyword.id, { articleUrl: event.target.value })}
                  placeholder="https://..."
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

function TaskTable({
  tasks,
  users,
  projects,
  onStatus,
  compact,
}: {
  tasks: Task[]
  users: User[]
  projects: Project[]
  onStatus: (taskId: string, status: TaskStatus) => void
  compact?: boolean
}) {
  if (tasks.length === 0) {
    return <EmptyState title="Chưa có công việc" text="Thêm task đầu tiên để theo dõi tiến độ thực thi của dự án." />
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Công việc</th>
            {!compact && <th>Dự án</th>}
            <th>Nhân sự</th>
            <th>Hạn hoàn thành</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.title}</td>
              {!compact && <td>{projects.find((project) => project.id === task.projectId)?.name}</td>}
              <td>{users.find((user) => user.id === task.assigneeId)?.name ?? 'Chưa gán'}</td>
              <td>{field(task.dueDate)}</td>
              <td>
                <select className="status-select" value={task.status} onChange={(event) => onStatus(task.id, event.target.value as TaskStatus)}>
                  <option>Cần làm</option>
                  <option>Đang làm</option>
                  <option>Hoàn thành</option>
                </select>
              </td>
            </tr>
          ))}
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
}: {
  transactions: Transaction[]
  projects: Project[]
  users: User[]
  onEdit?: (transactionId: string) => void
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ngày chi</th>
            <th>Ngày quyết toán</th>
            <th>Phạm vi</th>
            <th>Dự án</th>
            <th>Người chi</th>
            <th>Nội dung</th>
            <th>Số tiền</th>
            {onEdit && <th>Sửa</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{field(transaction.date)}</td>
              <td>{field(transaction.settlementDate, 'Chưa quyết toán')}</td>
              <td>{transaction.scope ?? 'Chi riêng dự án'}</td>
              <td>{transaction.scope === 'Chi chung dự án' ? 'Chi chung' : projects.find((project) => project.id === transaction.projectId)?.name ?? 'Dự án đã xóa'}</td>
              <td>{users.find((user) => user.id === transaction.spenderId)?.name ?? 'Chưa chọn'}</td>
              <td>{transaction.label}</td>
              <td>{currency.format(transaction.amount)}</td>
              {onEdit && (
                <td>
                  <button className="secondary-button" type="button" onClick={() => onEdit(transaction.id)}>
                    Sửa
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
              <td>{new Date(log.at).toLocaleString('vi-VN')}</td>
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
}: {
  users: User[]
  currentUserId: string
  onEdit: (userId: string) => void
  onDelete: (userId: string) => void
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
              <td>{user.permissions.join(', ') || 'Chỉ xem'}</td>
              <td>
                <span className="pill income">{user.active ? 'Hoạt động' : 'Khóa'}</span>
              </td>
              <td>
                <div className="table-actions">
                  <button className="secondary-button" type="button" onClick={() => onEdit(user.id)}>
                    Sửa
                  </button>
                  <button className="danger-button" disabled={user.id === currentUserId} type="button" onClick={() => onDelete(user.id)}>
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
