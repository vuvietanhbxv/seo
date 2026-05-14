import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type View = 'overview' | 'projects' | 'finance' | 'people' | 'progress'
type ProjectStatus = 'Dang SEO' | 'Tam dung' | 'Hoan thanh'
type TaskStatus = 'Todo' | 'Doing' | 'Done'
type TransactionType = 'Thu' | 'Chi'
type Role = 'Admin' | 'SEO Lead' | 'Content' | 'Finance' | 'Viewer'

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
}

type Keyword = {
  id: string
  projectId: string
  term: string
  intent: 'Thong tin' | 'Thuong mai' | 'Dieu huong'
  currentRank: number
  targetRank: number
  volume: number
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
  label: string
  amount: number
  date: string
}

type User = {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  permissions: string[]
}

type AppData = {
  projects: Project[]
  keywords: Keyword[]
  tasks: Task[]
  transactions: Transaction[]
  users: User[]
}

const permissions = ['Du an', 'Tai chinh', 'Nhan su', 'Tien do']

const initialData: AppData = {
  users: [
    {
      id: 'u1',
      name: 'Nguyen Minh Anh',
      email: 'anh@agency.vn',
      role: 'Admin',
      active: true,
      permissions: permissions,
    },
    {
      id: 'u2',
      name: 'Tran Bao Long',
      email: 'long@agency.vn',
      role: 'SEO Lead',
      active: true,
      permissions: ['Du an', 'Tien do'],
    },
    {
      id: 'u3',
      name: 'Le Hoai Nam',
      email: 'nam@agency.vn',
      role: 'Content',
      active: true,
      permissions: ['Du an'],
    },
    {
      id: 'u4',
      name: 'Pham Thu Ha',
      email: 'ha@agency.vn',
      role: 'Finance',
      active: true,
      permissions: ['Tai chinh'],
    },
  ],
  projects: [
    {
      id: 'p1',
      name: 'SEO Website Noi That',
      client: 'An Gia Decor',
      website: 'angia-decor.vn',
      startDate: '2026-05-01',
      endDate: '2026-09-30',
      budget: 180000000,
      status: 'Dang SEO',
      ownerId: 'u2',
    },
    {
      id: 'p2',
      name: 'SEO Nha khoa Local',
      client: 'SmileCare',
      website: 'smilecare.vn',
      startDate: '2026-04-10',
      endDate: '2026-08-10',
      budget: 96000000,
      status: 'Dang SEO',
      ownerId: 'u1',
    },
  ],
  keywords: [
    {
      id: 'k1',
      projectId: 'p1',
      term: 'thiet ke noi that chung cu',
      intent: 'Thuong mai',
      currentRank: 18,
      targetRank: 5,
      volume: 3200,
    },
    {
      id: 'k2',
      projectId: 'p1',
      term: 'bao gia thi cong noi that',
      intent: 'Thuong mai',
      currentRank: 11,
      targetRank: 3,
      volume: 1900,
    },
    {
      id: 'k3',
      projectId: 'p2',
      term: 'nha khoa quan 1',
      intent: 'Dieu huong',
      currentRank: 7,
      targetRank: 3,
      volume: 880,
    },
  ],
  tasks: [
    {
      id: 't1',
      projectId: 'p1',
      title: 'Audit technical SEO va Core Web Vitals',
      assigneeId: 'u2',
      dueDate: '2026-05-18',
      status: 'Done',
    },
    {
      id: 't2',
      projectId: 'p1',
      title: 'Len outline 12 bai content chuyen muc',
      assigneeId: 'u3',
      dueDate: '2026-05-24',
      status: 'Doing',
    },
    {
      id: 't3',
      projectId: 'p2',
      title: 'Toi uu Google Business Profile',
      assigneeId: 'u2',
      dueDate: '2026-05-22',
      status: 'Doing',
    },
    {
      id: 't4',
      projectId: 'p2',
      title: 'Viet landing page dich vu nieng rang',
      assigneeId: 'u3',
      dueDate: '2026-05-28',
      status: 'Todo',
    },
  ],
  transactions: [
    {
      id: 'm1',
      projectId: 'p1',
      type: 'Thu',
      label: 'Tam ung hop dong thang 5',
      amount: 45000000,
      date: '2026-05-03',
    },
    {
      id: 'm2',
      projectId: 'p1',
      type: 'Chi',
      label: 'Chi phi content va backlink',
      amount: 12000000,
      date: '2026-05-09',
    },
    {
      id: 'm3',
      projectId: 'p2',
      type: 'Thu',
      label: 'Thanh toan goi local SEO',
      amount: 28000000,
      date: '2026-05-05',
    },
    {
      id: 'm4',
      projectId: 'p2',
      type: 'Chi',
      label: 'Chi phi citation va media',
      amount: 6400000,
      date: '2026-05-12',
    },
  ],
}

function useStoredData() {
  const [data, setData] = useState<AppData>(() => {
    const raw = localStorage.getItem('seo-demo-data')
    return raw ? JSON.parse(raw) : initialData
  })

  const updateData = (next: AppData) => {
    setData(next)
    localStorage.setItem('seo-demo-data', JSON.stringify(next))
  }

  return [data, updateData] as const
}

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const pct = (value: number) => `${Math.round(value)}%`
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`

function App() {
  const [data, setData] = useStoredData()
  const [view, setView] = useState<View>('overview')
  const [activeProjectId, setActiveProjectId] = useState(data.projects[0]?.id ?? '')

  const activeProject = data.projects.find((project) => project.id === activeProjectId) ?? data.projects[0]
  const projectTasks = data.tasks.filter((task) => task.projectId === activeProject?.id)
  const projectKeywords = data.keywords.filter((keyword) => keyword.projectId === activeProject?.id)
  const projectTransactions = data.transactions.filter((item) => item.projectId === activeProject?.id)

  const completedTasks = data.tasks.filter((task) => task.status === 'Done').length
  const completionRate = data.tasks.length ? (completedTasks / data.tasks.length) * 100 : 0
  const revenue = data.transactions.filter((item) => item.type === 'Thu').reduce((sum, item) => sum + item.amount, 0)
  const expense = data.transactions.filter((item) => item.type === 'Chi').reduce((sum, item) => sum + item.amount, 0)
  const avgKeywordRank = data.keywords.length
    ? data.keywords.reduce((sum, keyword) => sum + keyword.currentRank, 0) / data.keywords.length
    : 0

  const staffProgress = useMemo(
    () =>
      data.users.map((user) => {
        const tasks = data.tasks.filter((task) => task.assigneeId === user.id)
        const done = tasks.filter((task) => task.status === 'Done').length
        return { ...user, tasks: tasks.length, done, rate: tasks.length ? (done / tasks.length) * 100 : 0 }
      }),
    [data.tasks, data.users],
  )

  const projectProgress = useMemo(
    () =>
      data.projects.map((project) => {
        const tasks = data.tasks.filter((task) => task.projectId === project.id)
        const done = tasks.filter((task) => task.status === 'Done').length
        return { ...project, tasks: tasks.length, done, rate: tasks.length ? (done / tasks.length) * 100 : 0 }
      }),
    [data.projects, data.tasks],
  )

  const addProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const project: Project = {
      id: uid('p'),
      name: String(form.get('name')),
      client: String(form.get('client')),
      website: String(form.get('website')),
      startDate: String(form.get('startDate')),
      endDate: String(form.get('endDate')),
      budget: Number(form.get('budget')) || 0,
      status: 'Dang SEO',
      ownerId: String(form.get('ownerId')),
    }
    setData({ ...data, projects: [project, ...data.projects] })
    setActiveProjectId(project.id)
    event.currentTarget.reset()
  }

  const addKeyword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeProject) return
    const form = new FormData(event.currentTarget)
    const keyword: Keyword = {
      id: uid('k'),
      projectId: activeProject.id,
      term: String(form.get('term')),
      intent: String(form.get('intent')) as Keyword['intent'],
      currentRank: Number(form.get('currentRank')) || 100,
      targetRank: Number(form.get('targetRank')) || 10,
      volume: Number(form.get('volume')) || 0,
    }
    setData({ ...data, keywords: [keyword, ...data.keywords] })
    event.currentTarget.reset()
  }

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeProject) return
    const form = new FormData(event.currentTarget)
    const task: Task = {
      id: uid('t'),
      projectId: activeProject.id,
      title: String(form.get('title')),
      assigneeId: String(form.get('assigneeId')),
      dueDate: String(form.get('dueDate')),
      status: 'Todo',
    }
    setData({ ...data, tasks: [task, ...data.tasks] })
    event.currentTarget.reset()
  }

  const addTransaction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const transaction: Transaction = {
      id: uid('m'),
      projectId: String(form.get('projectId')),
      type: String(form.get('type')) as TransactionType,
      label: String(form.get('label')),
      amount: Number(form.get('amount')) || 0,
      date: String(form.get('date')),
    }
    setData({ ...data, transactions: [transaction, ...data.transactions] })
    event.currentTarget.reset()
  }

  const addUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const user: User = {
      id: uid('u'),
      name: String(form.get('name')),
      email: String(form.get('email')),
      role: String(form.get('role')) as Role,
      active: true,
      permissions: form.getAll('permissions').map(String),
    }
    setData({ ...data, users: [user, ...data.users] })
    event.currentTarget.reset()
  }

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setData({
      ...data,
      tasks: data.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    })
  }

  const ownerName = (id: string) => data.users.find((user) => user.id === id)?.name ?? 'Chua gan'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>SEO Ops</strong>
            <span>Project Manager</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {[
            ['overview', 'Tong quan'],
            ['projects', 'Du an SEO'],
            ['finance', 'Tai chinh'],
            ['people', 'Nhan su'],
            ['progress', 'Tien do'],
          ].map(([id, label]) => (
            <button
              className={view === id ? 'nav-item active' : 'nav-item'}
              key={id}
              onClick={() => setView(id as View)}
              type="button"
            >
              <MiniIcon name={id} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>Du lieu demo</span>
          <button type="button" onClick={() => setData(initialData)}>
            Reset
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyeline">Quan ly van hanh SEO</p>
            <h1>{viewTitle(view)}</h1>
          </div>
          <label className="project-switcher">
            <span>Du an dang xem</span>
            <select value={activeProject?.id ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
              {data.projects.map((project) => (
                <option value={project.id} key={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        </header>

        {view === 'overview' && (
          <section className="view-stack">
            <div className="metric-grid">
              <Metric title="Tong du an" value={data.projects.length} note={`${projectProgress.filter((p) => p.status === 'Dang SEO').length} dang SEO`} />
              <Metric title="Doanh thu" value={currency.format(revenue)} note={`Loi nhuan ${currency.format(revenue - expense)}`} />
              <Metric title="Task hoan thanh" value={pct(completionRate)} note={`${completedTasks}/${data.tasks.length} task`} />
              <Metric title="Rank TB" value={avgKeywordRank.toFixed(1)} note={`${data.keywords.length} keyword dang theo doi`} />
            </div>

            <div className="dashboard-grid">
              <Panel title="Tai chinh cong ty" action={currency.format(revenue - expense)}>
                <BarChart
                  items={[
                    { label: 'Thu', value: revenue, color: '#0f766e' },
                    { label: 'Chi', value: expense, color: '#dc2626' },
                    { label: 'Loi nhuan', value: Math.max(revenue - expense, 0), color: '#2563eb' },
                  ]}
                />
              </Panel>
              <Panel title="Tien do theo du an" action={`${pct(completionRate)} chung`}>
                <div className="progress-list">
                  {projectProgress.map((project) => (
                    <ProgressRow key={project.id} label={project.name} value={project.rate} meta={`${project.done}/${project.tasks} task`} />
                  ))}
                </div>
              </Panel>
            </div>

            <Panel title="Task gan day" action="Theo tat ca du an">
              <TaskTable tasks={data.tasks.slice(0, 6)} users={data.users} projects={data.projects} onStatus={updateTaskStatus} />
            </Panel>
          </section>
        )}

        {view === 'projects' && activeProject && (
          <section className="view-stack">
            <div className="split-grid">
              <Panel title="Chi tiet du an" action={activeProject.status}>
                <div className="project-detail">
                  <div>
                    <span>Khach hang</span>
                    <strong>{activeProject.client}</strong>
                  </div>
                  <div>
                    <span>Website</span>
                    <strong>{activeProject.website}</strong>
                  </div>
                  <div>
                    <span>Phu trach</span>
                    <strong>{ownerName(activeProject.ownerId)}</strong>
                  </div>
                  <div>
                    <span>Ngan sach</span>
                    <strong>{currency.format(activeProject.budget)}</strong>
                  </div>
                </div>
                <ProgressRow label="Tien do rieng du an" value={projectTasks.length ? (projectTasks.filter((task) => task.status === 'Done').length / projectTasks.length) * 100 : 0} meta={`${projectTasks.length} task`} />
              </Panel>

              <Panel title="Tao du an SEO" action="Moi">
                <form className="form-grid compact" onSubmit={addProject}>
                  <input name="name" placeholder="Ten du an" required />
                  <input name="client" placeholder="Khach hang" required />
                  <input name="website" placeholder="Website" required />
                  <input name="budget" placeholder="Ngan sach" type="number" min="0" required />
                  <input name="startDate" type="date" required />
                  <input name="endDate" type="date" required />
                  <select name="ownerId" required>
                    {data.users.map((user) => (
                      <option value={user.id} key={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit">Tao du an</button>
                </form>
              </Panel>
            </div>

            <div className="dashboard-grid wide-left">
              <Panel title="Keyword SEO" action={`${projectKeywords.length} keyword`}>
                <form className="inline-form" onSubmit={addKeyword}>
                  <input name="term" placeholder="Keyword" required />
                  <select name="intent">
                    <option>Thuong mai</option>
                    <option>Thong tin</option>
                    <option>Dieu huong</option>
                  </select>
                  <input name="currentRank" placeholder="Rank hien tai" type="number" min="1" required />
                  <input name="targetRank" placeholder="Muc tieu" type="number" min="1" required />
                  <input name="volume" placeholder="Volume" type="number" min="0" required />
                  <button type="submit">Them</button>
                </form>
                <KeywordTable keywords={projectKeywords} />
              </Panel>

              <Panel title="Task viec" action={`${projectTasks.filter((task) => task.status === 'Done').length}/${projectTasks.length} xong`}>
                <form className="form-grid compact" onSubmit={addTask}>
                  <input name="title" placeholder="Ten task" required />
                  <select name="assigneeId" required>
                    {data.users.map((user) => (
                      <option value={user.id} key={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <input name="dueDate" type="date" required />
                  <button type="submit">Them task</button>
                </form>
                <TaskTable tasks={projectTasks} users={data.users} projects={data.projects} onStatus={updateTaskStatus} compact />
              </Panel>
            </div>
          </section>
        )}

        {view === 'finance' && (
          <section className="view-stack">
            <div className="metric-grid">
              <Metric title="Tong thu" value={currency.format(revenue)} note="Tat ca du an" />
              <Metric title="Tong chi" value={currency.format(expense)} note="Chi phi thuc hien" />
              <Metric title="Loi nhuan" value={currency.format(revenue - expense)} note="Tam tinh" />
              <Metric title="Du an co giao dich" value={new Set(data.transactions.map((item) => item.projectId)).size} note="Dang theo doi" />
            </div>
            <div className="dashboard-grid">
              <Panel title="Them thu chi" action="Theo du an">
                <form className="form-grid" onSubmit={addTransaction}>
                  <select name="projectId" required>
                    {data.projects.map((project) => (
                      <option value={project.id} key={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <select name="type">
                    <option>Thu</option>
                    <option>Chi</option>
                  </select>
                  <input name="label" placeholder="Noi dung" required />
                  <input name="amount" placeholder="So tien" type="number" min="0" required />
                  <input name="date" type="date" required />
                  <button type="submit">Luu giao dich</button>
                </form>
              </Panel>
              <Panel title="Thu chi du an dang xem" action={activeProject?.name ?? ''}>
                <BarChart
                  items={[
                    { label: 'Thu', value: projectTransactions.filter((item) => item.type === 'Thu').reduce((sum, item) => sum + item.amount, 0), color: '#0f766e' },
                    { label: 'Chi', value: projectTransactions.filter((item) => item.type === 'Chi').reduce((sum, item) => sum + item.amount, 0), color: '#dc2626' },
                  ]}
                />
              </Panel>
            </div>
            <Panel title="Lich su giao dich" action={`${data.transactions.length} dong`}>
              <TransactionTable transactions={data.transactions} projects={data.projects} />
            </Panel>
          </section>
        )}

        {view === 'people' && (
          <section className="view-stack">
            <div className="split-grid">
              <Panel title="Tao tai khoan nhan su" action="Phan quyen">
                <form className="form-grid" onSubmit={addUser}>
                  <input name="name" placeholder="Ho ten" required />
                  <input name="email" placeholder="Email" type="email" required />
                  <select name="role">
                    <option>SEO Lead</option>
                    <option>Content</option>
                    <option>Finance</option>
                    <option>Viewer</option>
                    <option>Admin</option>
                  </select>
                  <div className="permission-box">
                    {permissions.map((permission) => (
                      <label key={permission}>
                        <input name="permissions" type="checkbox" value={permission} defaultChecked={permission !== 'Nhan su'} />
                        {permission}
                      </label>
                    ))}
                  </div>
                  <button type="submit">Tao nhan su</button>
                </form>
              </Panel>
              <Panel title="Hieu suat nhan su" action={`${data.users.length} tai khoan`}>
                <div className="progress-list">
                  {staffProgress.map((user) => (
                    <ProgressRow key={user.id} label={user.name} value={user.rate} meta={`${user.done}/${user.tasks} task`} />
                  ))}
                </div>
              </Panel>
            </div>
            <Panel title="Danh sach nhan su" action="Vai tro va quyen">
              <UserTable users={data.users} />
            </Panel>
          </section>
        )}

        {view === 'progress' && (
          <section className="view-stack">
            <div className="dashboard-grid">
              <Panel title="Hoan thanh theo nhan vien" action="Task owner">
                <div className="progress-list">
                  {staffProgress.map((user) => (
                    <ProgressRow key={user.id} label={user.name} value={user.rate} meta={`${user.done}/${user.tasks} task`} />
                  ))}
                </div>
              </Panel>
              <Panel title="Hoan thanh theo du an" action="Project task">
                <div className="progress-list">
                  {projectProgress.map((project) => (
                    <ProgressRow key={project.id} label={project.name} value={project.rate} meta={`${project.done}/${project.tasks} task`} />
                  ))}
                </div>
              </Panel>
            </div>
            <Panel title="Bang task tong hop" action={`${data.tasks.length} task`}>
              <TaskTable tasks={data.tasks} users={data.users} projects={data.projects} onStatus={updateTaskStatus} />
            </Panel>
          </section>
        )}
      </main>
    </div>
  )
}

function viewTitle(view: View) {
  return {
    overview: 'Tong quan cong ty',
    projects: 'Du an SEO',
    finance: 'Tai chinh',
    people: 'Nhan su',
    progress: 'Tien do',
  }[view]
}

function MiniIcon({ name }: { name: string }) {
  return (
    <svg className="mini-icon" viewBox="0 0 24 24" aria-hidden="true">
      {name === 'overview' && <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-11h6V4h-6v5Z" />}
      {name === 'projects' && <path d="M4 5h16v4H4V5Zm0 6h10v8H4v-8Zm12 0h4v8h-4v-8Z" />}
      {name === 'finance' && <path d="M5 19h14v-2H5v2Zm1-4h3V8H6v7Zm5 0h3V5h-3v10Zm5 0h3v-5h-3v5Z" />}
      {name === 'people' && <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19c.5-3.2 2.2-5 5-5s4.5 1.8 5 5H3Zm10.5 0c.4-2 1.4-3.4 3.4-3.4 1.9 0 3.1 1.2 3.5 3.4h-6.9Z" />}
      {name === 'progress' && <path d="M5 12.5 9 16l10-10 1.5 1.5L9 19 3.5 14 5 12.5Z" />}
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

function KeywordTable({ keywords }: { keywords: Keyword[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Intent</th>
            <th>Rank</th>
            <th>Muc tieu</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          {keywords.map((keyword) => (
            <tr key={keyword.id}>
              <td>{keyword.term}</td>
              <td>{keyword.intent}</td>
              <td>#{keyword.currentRank}</td>
              <td>Top {keyword.targetRank}</td>
              <td>{keyword.volume.toLocaleString('vi-VN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Task</th>
            {!compact && <th>Du an</th>}
            <th>Nhan su</th>
            <th>Deadline</th>
            <th>Trang thai</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.title}</td>
              {!compact && <td>{projects.find((project) => project.id === task.projectId)?.name}</td>}
              <td>{users.find((user) => user.id === task.assigneeId)?.name}</td>
              <td>{task.dueDate}</td>
              <td>
                <select className="status-select" value={task.status} onChange={(event) => onStatus(task.id, event.target.value as TaskStatus)}>
                  <option>Todo</option>
                  <option>Doing</option>
                  <option>Done</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TransactionTable({ transactions, projects }: { transactions: Transaction[]; projects: Project[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ngay</th>
            <th>Du an</th>
            <th>Noi dung</th>
            <th>Loai</th>
            <th>So tien</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.date}</td>
              <td>{projects.find((project) => project.id === transaction.projectId)?.name}</td>
              <td>{transaction.label}</td>
              <td>
                <span className={transaction.type === 'Thu' ? 'pill income' : 'pill expense'}>{transaction.type}</span>
              </td>
              <td>{currency.format(transaction.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UserTable({ users }: { users: User[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ho ten</th>
            <th>Email</th>
            <th>Vai tro</th>
            <th>Quyen truy cap</th>
            <th>Trang thai</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.permissions.join(', ') || 'Chi xem'}</td>
              <td>
                <span className="pill income">{user.active ? 'Hoat dong' : 'Khoa'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
