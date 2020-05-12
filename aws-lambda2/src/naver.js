/** 금아마스크WHITE */
const kuma_white = 'https://smartstore.naver.com/kumaelectron/products/4922095600'
/** 금아 블랙마스크 */
const kuma_black = 'https://smartstore.naver.com/kumaelectron/products/4813999869'
/** 금아덴탈마스크 */
const kuma_dental = 'https://smartstore.naver.com/kumaelectron/products/4754238400'
const test_product = 'https://smartstore.naver.com/kumaelectron/products/4836415470'
const aer_mask = 'https://smartstore.naver.com/aer-shop/products/4722827602'

/** 네이버 로그인 */
const login = async (page, userId, password) => {
  try {
    await page.goto('https://www.naver.com')
    await page.click('#account > a.link_login')
    await page.waitForSelector('#id')

    // await page.type('#id', userId)
    // await page.type('#pw', password)
    /* 네이버 CAPTCHA 무력화 */
    await page.evaluate((id, pw) => {
      document.querySelector('#id').value = id;
      document.querySelector('#pw').value = pw;
    }, userId, password)

    await Promise.all([
      page.click('#log\\.login'),
      page.waitForNavigation({waitUntil: 'networkidle0'})
    ])
    await page.waitFor(2000)

    // Check Login Success
    const elementHandle = await page.$('iframe#minime');
    const frame = await elementHandle.contentFrame();
    await frame.waitForSelector('div.email');
    const email = await frame.$eval('div.email', el => el.textContent);
    console.log('Naver Login Suceess, %s', email)
    return true
  } catch (err) {
    console.log('Naver Login Failed!!!')
    console.log(err)
    return false
  }
}

/** 상품 구매 */
const buyProduct = async (page) => {
  // 옵션선택(for 아에르)
  await page.select('select._combination_option', '14322412681')
  // 구매하기 클릭
  await Promise.all([
    page.click('span.buy > a'),
    page.waitForNavigation({waitUntil: 'networkidle0'})
  ])

  // 일반결제
  await page.waitForSelector('#generalPayments')
  await page.click('#generalPayments')
  await page.waitForSelector('#pay1', {visible: true, timeout: 2000})
  // 실시간계좌이체
  await page.click('#pay1')
  // 나중에결제
  await page.click('#pay18')
  // 전체 동의하기
  await page.click('#allAgree')
  await page.click('button.btn_payment')
  await page.waitForNavigation({waitUntil: 'networkidle0'})

  if (await page.$('.order_number')) {
    const orderNo = await page.$eval('.order_number', el => el.textContent);
    console.log('Order No : %s', orderNo)
    return true
  }
  return false
}

module.exports.product = kuma_white
module.exports.login = login
module.exports.buyProduct = buyProduct
