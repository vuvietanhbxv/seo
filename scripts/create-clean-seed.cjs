const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const cleanSeed = {
  users: [
    {
      id: 'u-admin',
      name: 'Admin SEO Ops',
      email: 'admin@seo-ops.local',
      password: '123456',
      role: 'Quản trị viên',
      active: true,
      permissions: [],
      salaryType: 'Lương theo tháng',
      salaryAmount: 0,
      checkedInAt: '',
      totalWorkedMs: 0,
    },
  ],
  projects: [],
  keywords: [],
  tasks: [],
  transactions: [],
  analyticsReports: [],
  notifications: [],
  activityLogs: [],
  seoEntities: [],
  seoEntityPlatforms: [],
  seoEntityLinks: [],
  seoEntityChecklist: [],
  seoEntitySchemas: [],
  seoBacklinkSources: [],
  seoBacklinks: [],
  seoBacklinkPlans: [],
  seoBacklinkCosts: [],
  internalNotes: [],
  internalNoteTags: [],
  internalNoteFiles: [],
  internalNoteVersions: [],
  internalNoteComments: [],
}

const destinations = [
  path.join(rootDir, 'public', 'seo-ops-seed.json'),
  path.join(rootDir, 'deploy', 'seo-ops-web', 'seo-ops-seed.json'),
  path.join(rootDir, 'deploy', 'seo-ops-xampp', 'seo-ops-seed.json'),
]

for (const destination of destinations) {
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.writeFileSync(destination, `${JSON.stringify(cleanSeed, null, 2)}\n`, 'utf8')
}

console.log('Created clean installation seed files without project runtime data.')
