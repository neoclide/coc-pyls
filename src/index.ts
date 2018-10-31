import which from 'which'
import { ExtensionContext, LanguageClient, ServerOptions, workspace, services, LanguageClientOptions, RevealOutputChannelOn } from 'coc.nvim'

export async function activate(context: ExtensionContext): Promise<void> {
  let { subscriptions } = context
  const config = workspace.getConfiguration().get('pyls', {}) as any
  const enable = config.enable
  if (enable === false) return
  const command = config.commandPath || 'pyls'
  try {
    which.sync(command)
  } catch (e) {
    let items = [
      'Install python-language-server with pip',
      'Install python-language-server with pip3',
      'Checkout documentation of python-language-server'
    ]
    let idx = await workspace.showQuickpick(items, `${command} not found in $PATH`)
    if (idx == -1 && idx > 2) return
    if (idx == 2) {
      workspace.nvim.call('coc#util#open_url', ['https://github.com/palantir/python-language-server#installation'], true) // tslint:disable-line
      return
    }
    let cmd = `${idx == 1 ? 'pip' : 'pip3'} install python-language-server`
    let res = await workspace.runTerminalCommand(cmd)
    if (!res.success) return
  }

  let serverOptions: ServerOptions = {
    command,
    args: ['-vv']
  }

  let clientOptions: LanguageClientOptions = {
    documentSelector: ['python'],
    synchronize: {
      configurationSection: 'pyls'
    },
    outputChannelName: 'pyls',
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    initializationOptions: config.initializationOptions || {}
  }

  let client = new LanguageClient('pyls', 'Python language server', serverOptions, clientOptions)

  subscriptions.push(
    services.registLanguageClient(client)
  )
}
