const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

// All company APIs are mocked; no production data is read or modified.
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    for (const role of ['admin', 'user']) {
      const page = await browser.newPage({ viewport: role === 'user' ? { width: 390, height: 844 } : { width: 1440, height: 1000 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let reads = 0;
      const sites = [
        { _id: 's1', customerName: 'Alpha Site', status: 'pending', addedBy: 'Alice', startDate: '2026-11-06', selectedWorkers: ['Worker A'] },
        { _id: 's2', customerName: 'Beta Site', status: 'pending', addedBy: 'Bob', startDate: '2026-11-07', selectedWorkers: [] },
        { _id: 's3', customerName: 'Running Site', status: 'running', addedBy: 'Alice', startDate: '2026-11-06' },
      ];
      const current = { _id: 'w1', siteName: 'Current Work', date: '2026-11-06', supervisor: 'Alice', addedBy: 'Alice', plannedWork: 'Fit interlocks', status: 'Planned' };
      const old = { _id: 'w2', siteName: 'Historic Work', date: '2026-06-01', supervisor: 'Bob', addedBy: 'Bob', task: 'Old task', notes: 'Notes kept', archived: true, status: 'Completed' };
      await page.route('https://interlock-backend.onrender.com/api/**', async route => {
        const url = new URL(route.request().url());
        const path = url.pathname.slice(4);
        let data = [];
        if (path === '/login') data = { _id: 'tester', name: 'Tester', username: 'tester', role };
        else if (path === '/sitework') data = sites;
        else if (path === '/workplan') { reads++; data = url.searchParams.get('archive') === 'true' ? [current, old] : [current]; }
        else if (path === '/dashboard/summary') data = {};
        await route.fulfill({ json: data });
      });
      await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5179/');
      await page.getByPlaceholder('Enter username').fill('tester');
      await page.getByPlaceholder('Enter password').fill('test');
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      if (role === 'admin') await page.getByRole('button', { name: 'Admin Panel', exact: true }).click();
      await page.getByRole('button', { name: /^Plans Submitted planned sites/ }).click();
      await page.getByText('4 plan(s)', { exact: true }).waitFor();
      assert.equal(await page.getByRole('row').count(), 5);
      assert.equal(await page.getByRole('cell', { name: 'Running Site', exact: true }).count(), 0);
      const field = (label, tag = 'input') => page.locator('label').filter({ hasText: label }).locator('..').locator(tag).first();
      await field('Supervisor', 'select').selectOption('Alice');
      await page.getByText('2 plan(s)', { exact: true }).waitFor();
      await field('From Date').fill('2026-11-06');
      await field('To Date').fill('2026-11-06');
      await page.getByText('2 plan(s)', { exact: true }).waitFor();
      await field('To Date').fill('2026-11-05');
      await page.getByRole('alert').filter({ hasText: 'From Date' }).waitFor();
      await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
      await page.getByRole('tab', { name: 'Work Plans', exact: true }).click();
      await page.getByText('2 plan(s)', { exact: true }).waitFor();
      await page.getByRole('row').filter({ hasText: 'Historic Work' }).getByRole('button', { name: 'Open', exact: true }).click();
      await page.getByText('Notes kept', { exact: true }).waitFor();
      await page.locator('.app-modal').getByRole('button', { name: /[x\u00d7]/ }).click();
      await page.getByRole('tab', { name: 'Planned Sites', exact: true }).click();
      await page.getByText('2 plan(s)', { exact: true }).waitFor();
      await page.getByRole('row').filter({ hasText: 'Alpha Site' }).getByRole('button', { name: 'Open', exact: true }).click();
      await page.getByText('Worker A', { exact: true }).waitFor();
      await page.locator('.app-modal').getByRole('button', { name: /[x\u00d7]/ }).click();
      await page.getByRole('button', { name: 'Refresh plans', exact: true }).click();
      await page.getByText('2 plan(s)', { exact: true }).waitFor();
      assert.ok(reads >= 4);
      await page.screenshot({ path: `${process.env.TEMP}/pk-plans-${role}.png`, fullPage: true });
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS: admin and office Plans tiles, both plan sources, archived plans, deduplication, supervisor/date filters, invalid range, details, refresh, desktop/mobile.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
