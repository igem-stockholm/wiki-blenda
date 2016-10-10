var request = require('request-promise')
request = request.defaults({jar: true, followAllRedirects: true})

const user = process.env.IGEM_USER
const password = process.env.IGEM_PASSWORD
const loginBase = 'https://igem.org/Login2'
const ghostBase = 'https://wiki.igem.se'
const editBase = 'http://2016.igem.org/wiki/index.php?action=edit&title=Team:Stockholm'

request.post(loginBase).form({username: user, password: password, Login: 'Login', return_to: ''}).then((body) => {
  console.log(body)
  processEverything()
}).catch((error) => {
  console.error(error)
})

const processEverything = function () {
  const pages = {
    '/team': '/Team'
  }

  for (const page in pages) {
    getGhost(page).then((newContent) => {
      console.log(newContent)
    })
  }
}

var getGhost = function (page) {
  return request.get(ghostBase + page).then((body) => {
    return Promise.resolve(body)
  })
}
