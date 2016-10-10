var request = require('request-promise')
var htmlparser = require('htmlparser2')
var fs = require('fs')

request = request.defaults({jar: true, followAllRedirects: true})

const user = process.env.IGEM_USER
const password = process.env.IGEM_PASSWORD
const loginBase = 'https://igem.org/Login2'
const ghostBase = process.env.GHOST_URL
const assetsBase = ghostBase + '/themes/wiki-2016/assets/'
const contentBase = ghostBase + '/'
const fileNameBase = 'T--Stockholm--'
const fileBase = 'http://2016.igem.org/File:T--Stockholm--'
const uploadUrl = 'http://2016.igem.org/Special:Upload'
const editBase = 'http://2016.igem.org/wiki/index.php?action=edit&title=Team:Stockholm'
const submitBase = 'http://2016.igem.org/wiki/index.php?action=submit&title=Team:Stockholm'

console.log('Logging in...')
request.post(loginBase).form({username: user, password: password, Login: 'Login', return_to: ''}).then((body) => {
  // console.log(body)
  console.log('success')
  return processEverything()
}).catch((error) => {
  console.error(error)
})

const processEverything = function () {
  const pages = {
    '/team': '/Team',
    '/attributions': '/Attributions',
    '/collaborations': '/Collaborations'
  }

  var promises = []
  for (const page in pages) {
    let newPage
    promises.push(getGhost(page).then((newContent) => {
      // Get everything between the main tags
      newContent = newContent.substring(newContent.lastIndexOf('<main class="content">'), newContent.lastIndexOf('</main>') + 7)
      newContent = '{{Template:Stockholm}}<html><div class="site-wrapper post-template">'.concat(newContent)
      newContent = newContent.concat('</div></html>{{Template:Stockholm/Footer}}')
      newPage = newContent

      return getToken(pages[page])
    }).then((tokens) => {
      return editPage(pages[page], tokens, newPage)
    })
  )
  }

  return Promise.all(promises)
}

var getGhost = function (page) {
  return request.get(ghostBase + page)
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
