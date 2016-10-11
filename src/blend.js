var request = require('request-promise')
var htmlparser = require('htmlparser2')

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
  const pages = [
    ['', ''],
    ['/project', '/Project'],
    ['/in-short', '/In-short'],
    ['/our-path', '/Our-path'],
    ['/background', '/Background'],
    ['/combat-proteins', '/Combat-proteins'],
    // ['/sortase', '/Sortase'],
    ['/parts', '/Parts'],
    ['/collection', '/Collection'],
    ['/composites', '/Composites'],
    ['/wetlab', '/Wetlab'],
    ['/experiments', '/Experiments'],
    ['/lab-book', '/Lab-book'],
    ['/protocols', '/Protocols'],
    ['/results', '/Results'],
    ['/proof-of-concept', '/Proof-of-concept'],
    ['/demonstrate', '/Demonstrate'],
    ['/practises', '/Practises'],
    ['/teaching', '/Teaching'],
    ['/evolving', '/Evolving'],
    // ['/collaboration', '/Collaboration'],
    ['/health', '/Health'],
    ['/integrated', '/Integrated'],
    ['/team', '/Team'],
    ['/collaborations', '/Collaborations'],
    ['/attributions', '/Attributions'],
    ['/sponsors', '/Sponsors'],
    ['/notebook', '/Notebook'],
    ['/nic', '/NiC'],
    // ['/nic-workshops', '/NiC-workshops'],
    // ['/mini-jamboree', '/Mini-jamboree'],
    // ['/photo-album', '/Photo-album'],
    ['/safety', '/Safety'],
    ['/patients-in-mind', '/Patients-in-mind'],
    ['/safety-card', '/Safety-card']
  ]

  // Execute all pages sequentially
  pages.reduce(function (cur, next) {
    return cur.then(function () {
      return processPage(next[0], next[1])
    })
  }, Promise.resolve()).then(function () {
    console.log('all done')
  })
}

var processPage = function (oldUrl, newUrl) {
  let newPage
  return request.get(ghostBase + oldUrl).then((newContent) => {
    // Get everything between the main tags
    newContent = newContent.substring(newContent.lastIndexOf('<main class="content">'), newContent.lastIndexOf('</main>') + 7)
    newContent = '{{Template:Stockholm}}<html><div class="site-wrapper post-template">'.concat(newContent)
    newContent = newContent.concat('</div></html>{{Template:Stockholm/Footer}}')
    newPage = newContent

    return getToken(newUrl)
  }).then((tokens) => {
    return editPage(newUrl, tokens, newPage)
  })
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
