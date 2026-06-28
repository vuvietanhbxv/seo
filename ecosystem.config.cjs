module.exports = {
  apps: [
    {
      name: 'seoops',
      cwd: '/home/seoops/htdocs/seoops.sumu.id.vn',
      script: 'app.js',
      exec_mode: 'fork',
      instances: 1,
      time: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '3000',
        SEO_OPS_BASE_PATH: '/',
        SEO_OPS_STORAGE_DRIVER: 'json',
        SEO_OPS_DB_DIR: '/home/seoops/seo-ops-storage',
        SEO_OPS_ENTITY_GUIDE_DIR: '/home/seoops/seo-ops-storage/Entity Guide',
        SEO_OPS_TOOL_OUTPUT_DIR: '/home/seoops/seo-ops-storage/tools',
        SEO_OPS_DB_BACKUPS: '50',
      },
    },
  ],
}
