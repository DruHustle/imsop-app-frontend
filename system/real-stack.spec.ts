import {expect,test} from '@playwright/test';
import {readFileSync} from 'node:fs';
const fixture=JSON.parse(readFileSync('/tmp/imsop-browser-fixture.json','utf8'));
const password='Isolated-test-password-123';
async function login(page:any){await page.goto('/#/login');await page.getByLabel('Email',{exact:true}).fill(fixture.email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign In',exact:true}).click();await expect(page.getByRole('heading',{name:'Operational overview'})).toBeVisible();}
test('real signed intake, persisted review actions, reload, notifications and exact Assistant context',async({page})=>{
 await login(page);
 await page.goto('/#/supply-chain/shipments');await expect(page.getByRole('link',{name:'SYSTEM-SHP-10',exact:true}).filter({visible:true})).toBeVisible();
 await page.goto('/#/insights/recommendations');await expect(page.getByRole('heading',{name:'Exception review',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Review case',exact:true}).click();
 await page.getByLabel('Review note',{exact:true}).fill('Reviewed arrival evidence; follow-up assigned in isolated verification.');
 expect((await Promise.all([page.waitForResponse(r=>r.url().includes('/actions')&&r.request().method()==='POST'),page.getByRole('button',{name:'Acknowledge',exact:true}).click()]))[0].status()).toBe(200);await expect(page.getByRole('region',{name:'Review SYSTEM-SHP-10',exact:true})).toBeHidden();
 await page.reload();await page.getByRole('button',{name:'Review case',exact:true}).click();await expect(page.getByText(/acknowledge ·/)).toBeVisible();
 expect((await Promise.all([page.waitForResponse(r=>r.url().includes('/actions')&&r.request().method()==='POST'),page.getByLabel('Assign to',{exact:true}).selectOption(String(fixture.userId))]))[0].status()).toBe(200);await expect(page.getByRole('region',{name:'Review SYSTEM-SHP-10',exact:true})).toBeHidden();
 await page.getByRole('button',{name:'Review case',exact:true}).click();await page.getByLabel('Review note',{exact:true}).fill('Follow-up completed; carrier status remains delayed.');expect((await Promise.all([page.waitForResponse(r=>r.url().includes('/actions')&&r.request().method()==='POST'),page.getByRole('button',{name:'Save note',exact:true}).click()]))[0].status()).toBe(200);await expect(page.getByRole('region',{name:'Review SYSTEM-SHP-10',exact:true})).toBeHidden();
 await page.getByRole('button',{name:'Review case',exact:true}).click();expect((await Promise.all([page.waitForResponse(r=>r.url().includes('/actions')&&r.request().method()==='POST'),page.getByRole('button',{name:'Resolve review',exact:true}).click()]))[0].status()).toBe(200);await expect(page.getByRole('region',{name:'Review SYSTEM-SHP-10',exact:true})).toBeHidden();await page.reload();await expect(page.getByText('resolved',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Notifications',exact:true}).click();await expect(page.getByText('In-app review notifications · External delivery unavailable')).toBeVisible();await page.getByRole('button',{name:'Mark read',exact:true}).first().click();await page.keyboard.press('Escape');
 await page.screenshot({path:'verification/remediation/review-desktop.png',fullPage:true});
 await page.goto(`/#/insights/assistant?item=shipment:${fixture.shipmentId}&q=${encodeURIComponent('Compare SYSTEM-SHP-10 and SYSTEM-SHP-1')}`);
 await expect(page.getByRole('log')).not.toContainText('SYSTEM-SHP-10:');await page.getByRole('button',{name:'Send',exact:true}).click();
 await expect(page.getByRole('log')).toContainText('SYSTEM-SHP-10: Delayed');await expect(page.getByRole('log')).toContainText('SYSTEM-SHP-1 was not found');await expect(page.getByRole('log')).toContainText('mode: Parcel');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'verification/remediation/assistant-mobile.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('exact backend mail link works during demo identity, is scrubbed, survives retry, and cannot replay',async({page,request})=>{
 const response=await request.post('http://127.0.0.1:18067/api/auth/request-reset',{data:{email:fixture.email},headers:{'x-forwarded-for':'192.0.2.230'}});expect(response.status()).toBe(202);
 let link='';await expect.poll(async()=>{const messages=await (await request.get('http://127.0.0.1:18027/messages')).json();const mail=messages.find((m:any)=>m.text.includes(fixture.email));if(mail)link=mail.text.replace(/=\n/g,'').replace(/=3D/g,'=').match(/http:\/\/127\.0\.0\.1:4189\/[^\s<>]+/)?.[0]||'';return !!link;},{timeout:20000}).toBe(true);
 await page.goto('/#/login');await page.getByRole('button',{name:'Admin',exact:true}).click();await page.getByRole('button',{name:'Sign In',exact:true}).click();await expect(page.getByRole('heading',{name:'Operational overview'})).toBeVisible();
 await page.goto(link);await expect(page.getByLabel('New Password',{exact:true})).toBeVisible();expect(page.url()).not.toContain('token=');
 await page.getByLabel('New Password',{exact:true}).fill('short12');await page.getByLabel('Confirm Password',{exact:true}).fill('short12');await page.getByRole('button',{name:'Reset Password',exact:true}).click();await expect(page.getByRole('heading',{name:'Reset Password',exact:true})).toBeVisible();
 await page.getByLabel('New Password',{exact:true}).fill('Browser-new-password-123');await page.getByLabel('Confirm Password',{exact:true}).fill('Browser-new-password-123');await page.context().setOffline(true);await page.getByRole('button',{name:'Reset Password',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await page.context().setOffline(false);await page.getByRole('button',{name:'Reset Password',exact:true}).click();await expect(page.getByRole('heading',{name:'Password Reset!'})).toBeVisible();
 await page.screenshot({path:'verification/remediation/recovery-success.png',fullPage:true});
 await page.goto(link);await page.getByLabel('New Password',{exact:true}).fill('Browser-new-password-456');await page.getByLabel('Confirm Password',{exact:true}).fill('Browser-new-password-456');await page.getByRole('button',{name:'Reset Password',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'invalid, expired or already used'})).toBeVisible();
 await page.reload();await expect(page.getByRole('heading',{name:'Invalid Link',exact:true})).toBeVisible();
});
