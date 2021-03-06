const { Subscription } = require('../models')

module.exports = async (req, res, next) => {
  if (!req.session.githubToken) {
    return next(new Error('Unauthorized'))
  }

  const { github, client, isAdmin } = res.locals

  const { installationId } = req.params
  try {
    const { data: { login } } = await github.users.get()
    // get the installation to see if the user is an admin of it
    const { data: installation } = await client.apps.getInstallation({ installation_id: installationId })
    // get all subscriptions from the database for this installation ID
    const subscriptions = await Subscription.getAllForInstallation(installationId)
    // Only show the page if the logged in user is an admin of this installation
    if (await isAdmin({
      org: installation.account.login,
      username: login,
      type: installation.target_type
    })) {
      const { data: info } = await client.apps.get({})
      return res.render('github-subscriptions.hbs', {
        csrfToken: req.csrfToken(),
        installation,
        info,
        subscriptions,
        hasSubscriptions: subscriptions.length > 0
      })
    } else {
      return next(new Error('Unauthorized'))
    }
  } catch (err) {
    console.log(`Unable to show subscription page. error=${err}, installation=${req.params.installationId}`)
    return next(new Error('Not Found'))
  }
}
