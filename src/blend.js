var request = require('request-promise')
var htmlparser = require('htmlparser2')
let cheerio = require('cheerio')

request = request.defaults({jar: true, followAllRedirects: true})

const user = process.env.IGEM_USER
const password = process.env.IGEM_PASSWORD
const loginBase = 'https://igem.org/Login2'
const ghostBase = process.env.GHOST_URL
const fileNameBase = 'T--Stockholm--'
const editBase = 'http://2016.igem.org/wiki/index.php?action=edit&title=Team:Stockholm'
const submitBase = 'http://2016.igem.org/wiki/index.php?action=submit&title=Team:Stockholm'

console.log('Logging in...')
request.post(loginBase).form({username: user, password: password, Login: 'Login', return_to: ''}).then((body) => {
  // console.log(body)
  console.log('Logged in!')
  return processEverything()
}).catch((error) => {
  console.error(error)
})

const processEverything = function () {
  const pages = [
    ['', ''],
    ['/description', '/Description'],
    ['/parts', '/Parts'],
    ['/basic-parts', '/Basic_Parts'],
    ['/part-collection', '/Part_Collection'],
    ['/experiments', '/Experiments'],
    ['/lab-book', '/Labbook'],
    ['/protocols', '/Protocols'],
    ['/proof-of-concept', '/Proof'],
    ['/results', '/Results'],
    ['/practises', '/HP/Gold'],
    ['/card', '/HP/Silver'],
    ['/integrated_practices', '/Integrated_practices'],
    ['/engagement', '/Engagement'],
    ['/team', '/Team'],
    ['/collaborations', '/Collaborations'],
    ['/attributions', '/Attributions'],
    ['/sponsors', '/Sponsors'],
    ['/diary', '/Diary'],
    ['/nic', '/NiC'],
    ['/safety', '/Safety']
  ]

  // Execute all pages sequentially
  pages.reduce(function (cur, next) {
    return cur.then(function () {
      return processPage(next[0], next[1])
    })
  }, Promise.resolve()).then(function () {
    console.log('Script finished successfully!')
  })
}

var processPage = function (oldUrl, newUrl) {
  let newPage
  return request.get(ghostBase + oldUrl).then((newContent) => {
    // Get everything between the main tags
    newContent = newContent.substring(newContent.lastIndexOf('<main class="content">'), newContent.lastIndexOf('</main>') + 7)
    newContent = '{{Template:Stockholm}}<html><div class="site-wrapper post-template">'.concat(newContent)
    newContent = newContent.concat('</div></html>{{Template:Stockholm/Footer}}')
    return processImages(newContent)
  }).then((newContent) => {
    newPage = newContent
    return getToken(newUrl)
  }).then((tokens) => {
    return editPage(newUrl, tokens, newPage)
  })
}

var processImages = function (content) {
  // var promises = []
  let $ = cheerio.load(content)

  $('img').filter(function (i, el) {
    return $(this).attr('src').indexOf('/content/images/') === 0
  }).each(function (i, elem) {
    let newLink = newFileName($(this).attr('src'))
    $(this).replaceWith('[[File:' + newLink + '|link=]]')
  })

  var newContent = $.html()

  newContent = newContent.replace(/\[\[File:/g, '</html>[[File:').replace(/\|link=\]\]/g, '|link=]]<html>')

  return Promise.resolve(newContent)
}

var getToken = function (page) {
  return new Promise((resolve, reject) => {
    let tokens = {}
    var parser = new htmlparser.Parser({
      onopentag: function (name, attribs) {
        if (name === 'input' && attribs.name === 'wpEditToken') {
          tokens['wpEditToken'] = attribs.value
        }
        if (name === 'input' && attribs.name === 'wpStarttime') {
          tokens['wpStarttime'] = attribs.value
        }
        if (name === 'input' && attribs.name === 'wpEdittime') {
          tokens['wpEdittime'] = attribs.value
        }
        if (name === 'input' && attribs.name === 'wpAutoSummary') {
          tokens['wpAutoSummary'] = attribs.value
        }
      }
    }, {decodeEntities: true})

    request.get(editBase + page).then((html) => {
      parser.write(html)
      parser.end()
      resolve(tokens)
    })
  })
}

const newFileName = function (path) {
  // remove /content/images/
  return fileNameBase + path.substr(16).split('/').join('-')
}

var editPage = function (page, tokens, newContent) {
  var formData = {
    // Pass a simple key-value pair
    wpAntispam: '',
    wpSection: '',
    wpStarttime: tokens['wpStarttime'],
    wpEdittime: tokens['wpEdittime'],
    wpAutoSummary: tokens['wpAutoSummary'],
    wpLicense: '',
    wpWatchthis: '0',
    wpTextbox1: newContent,
    wpSave: 'Save page',
    format: 'text/x-wiki',
    model: 'wikitext',
    wpEditToken: tokens['wpEditToken'],
    wpUltimateParam: '1'
  }

  return request.post(submitBase + page).form(formData).then((body) => {
    console.log('Submit successful: ' + page)
  }).catch((error) => {
    console.log('Error: ' + error)
  })
}
