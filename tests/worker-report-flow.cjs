const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

// Mock every backend request so this regression test cannot change live records.
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept('Correct worker amount'));
    const site = { _id: 'site1', customerName: 'Test Site', addedBy: 'Tester', status: 'running', selectedWorkers: ['Test Worker'] };
    const worker = { _id: 'worker1', name: 'Test Worker', workerType: 'Site Worker', role: 'Site Worker', status: 'Active' };
    let docs = [{ _id: 'report1', date: '2026-11-05', entrySection: 'site', addedBy: 'Tester', siteId: 'site1', siteName: 'Test Site', dayNotes: 'Keep these notes', payments: [{ type: 'Site Payment Received', amount: 1000 }], totalReceived: 1000, workerEntries: [{ workerName: 'Test Worker', siteId: 'site1', siteName: 'Test Site', workCategory: 'Fitting', attendance: 'present', workArea: 10, rate: 100, salary: 1000, amountEarned: 1000, paymentGiven: 200, pending: 800 }] }];
    const writes = [];
    await page.route('https://interlock-backend.onrender.com/api/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname.slice(4);
      let data = [];
      if (path === '/login') data = { _id: 'tester', name: 'Tester', username: 'tester', role: 'supervisor' };
      else if (path === '/devices/check') data = { status: 'approved' };
      else if (path === '/sitework') data = [site];
      else if (path === '/workers') data = [worker];
      else if (path === '/dailyreport' && request.method() === 'GET') data = docs;
      else if (path.startsWith('/dailyreport') && request.method() !== 'GET') {
        const body = request.postDataJSON();
        writes.push({ method: request.method(), body });
        const id = path.split('/')[2] || 'report2';
        data = { ...body, _id: id };
        docs = [data, ...docs.filter(doc => doc._id !== id)];
      } else if (path.startsWith('/workers/reports/site')) data = { worker: { ...worker, totalEarnings: 1000, totalPaid: 200, totalPending: 800 }, history: [], sites: [], monthly: [] };
      await route.fulfill({ json: data });
    });
    const field = (label, tag = 'input') => page.locator('label').filter({ hasText: label }).locator('..').locator(tag).first();
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5178/');
    await page.getByPlaceholder('Enter username').fill('tester');
    await page.getByPlaceholder('Enter password').fill('test');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.getByRole('button', { name: 'Daily Report', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Purchases', exact: true }).count(), 0);
    await page.getByRole('button', { name: /Workers[\s\S]*1/ }).click();
    await page.getByRole('button', { name: /View Report/ }).click();
    await page.getByRole('button', { name: 'Edit & Resubmit', exact: true }).click();
    assert.equal(await field('Rate').inputValue(), '100');
    await page.getByRole('button', { name: 'Edit Entry', exact: true }).click();
    assert.equal(await field('Rate').inputValue(), '100');
    await field('Rate').fill('50');
    await page.getByRole('button', { name: 'Resubmit Daily Report', exact: true }).click();
    await page.getByRole('button', { name: 'Resubmit Daily Report', exact: true }).waitFor({ state: 'detached' });
    assert.equal(writes.length, 1);
    assert.equal(writes[0].method, 'PUT');
    assert.equal(writes[0].body.workerEntries.length, 1);
    assert.equal(writes[0].body.workerEntries[0].amountEarned, 500);
    assert.equal(writes[0].body.workerEntries[0].pending, 300);
    assert.equal(writes[0].body.dayNotes, 'Keep these notes');
    assert.equal(writes[0].body.payments[0].amount, 1000);
    await page.getByText('Showing 1 matching worker report(s)', { exact: true }).waitFor();
    await page.screenshot({ path: `${process.env.TEMP}/pk-worker-report-desktop.png`, fullPage: true });
    await page.getByRole('button', { name: '+ Workers', exact: false }).click();
    await field('Site *', 'select').selectOption('site1');
    await field('Worker Name', 'select').selectOption('Test Worker');
    await field('Work Category', 'select').selectOption('Fitting');
    await field('Work Area').fill('3');
    await field('Rate').fill('25');
    await page.getByRole('button', { name: 'Submit Workers Entry', exact: true }).click();
    await page.getByRole('button', { name: 'Submit Workers Entry', exact: true }).waitFor({ state: 'detached' });
    assert.equal(writes[1].method, 'POST');
    assert.equal(writes[1].body.workerEntries[0].salary, 75);
    assert.equal(writes[1].body.workerEntries[0].siteName, 'Test Site');
    await page.getByRole('button', { name: 'Worker Ledger', exact: true }).click();
    await page.getByText('Test Worker', { exact: true }).first().click();
    await page.getByText('Submitted Worker Reports', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Open Report', exact: true }).first().click();
    await page.getByRole('button', { name: 'Edit & Resubmit', exact: true }).click();
    await page.getByRole('button', { name: 'Edit Entry', exact: true }).first().waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    assert.ok((await page.locator('aside').boundingBox()).x + (await page.locator('aside').boundingBox()).width <= 1);
    const modalBox = await page.locator('.app-modal').boundingBox();
    assert.ok(modalBox.x >= 0 && modalBox.x + modalBox.width <= 391);
    await page.screenshot({ path: `${process.env.TEMP}/pk-worker-report-mobile.png`, fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: worker visibility, saved-value editing, lower-amount resubmission, unrelated data preserved, direct worker submission, ledger report actions, supervisor purchases hidden.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
