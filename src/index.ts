#!/usr/bin/env node
import process from 'node:process'

import Table from 'cli-table3'
import * as commander from 'commander'
import Conf, { Options } from 'conf'
import ini from 'ini'
import omelette from 'omelette'
import { $, chalk, fs, os, path } from 'zx'

type Account = {
  name: string
  email: string
}

const createTable = (options?: Table.TableConstructorOptions) =>
  new Table(options)
const createConfig = <T>(options?: Options<T>) => new Conf(options)

/**
 * @see https://github.com/sindresorhus/conf#cwd
 */
const config = createConfig<{
  accounts: Account[]
}>({
  projectName: 'git.user',
  configName: 'config',
  fileExtension: 'json',
  projectSuffix: '',
  defaults: {
    accounts: [],
  },
})

const table = createTable({
  head: ['name', 'email'],
})

const autocompletion = () => {
  const accounts = config.get('accounts')
  const getAllUsers = () =>
    accounts.reduce<string[]>((ass, { name, email }) => {
      return [...ass, name, email]
    }, [])

  /**
   * @see https://github.com/f/omelette#autocompletion-tree
   */
  const completion = omelette(`git-user <action> <users>`)

  // Bind events for every template part.
  completion.on('action', ({ reply }) => {
    reply(['list', 'use', 'add', 'remove', 'init'])
  })

  completion.on('users', ({ reply }) => {
    reply(getAllUsers())
  })

  completion.init()
}

autocompletion()

/**
 * @see https://ihateregex.io/expr/email/
 */
const EMAIL_REGEX = /[^\t\n\r @]+@[^\t\n\r @]+\.[^\t\n\r @]+/

const trim = (value: string) => value.trim()

const verify_email = (value: string) => {
  const value_ = trim(value)
  const result = EMAIL_REGEX.test(trim(value_))

  if (!result) {
    throw new commander.InvalidArgumentError(
      'Because it is not a valid email address.'
    )
  }

  return value_
}

type Actions = 'init' | 'add' | 'remove' | 'list' | 'use'

const list = () => {
  const accounts = config.get('accounts')

  if (accounts.length >= 0) {
    const git_config = ini.parse(
      fs.readFileSync(path.resolve(os.homedir(), '.gitconfig'), 'utf-8')
    )
    const { user } = git_config as {
      user: Account
    }
    const hasUser = user?.name && user?.email

    table.push(
      ...config
        .get('accounts')
        .reduce<string[][]>((previous, { name, email }) => {
          return [
            ...previous,
            hasUser && user.name.includes(name) && user.email.includes(email)
              ? [chalk.green(name), chalk.green(email)]
              : [name, email],
          ]
        }, [])
    )
    console.log(table.toString())
    return true
  }

  return false
}

const actions: Record<Actions, (...args: any[]) => boolean | Promise<boolean>> =
  {
    init() {
      const git_config = ini.parse(
        fs.readFileSync(path.resolve(os.homedir(), '.gitconfig'), 'utf-8')
      )
      const { user } = git_config

      if (user?.name && user?.email) {
        const { name, email } = user as Account

        config.set('accounts', [{ name, email }])

        list()

        return true
      }

      config.set('accounts', [])

      return false
    },
    add({ name, email }: Account) {
      const accounts = config.get('accounts')
      const account = accounts.some(
        (it) => it.name === name || it.email === email
      )

      if (!account) {
        config.set('accounts', [
          ...config.get('accounts'),
          {
            name,
            email,
          },
        ])

        list()

        return true
      }

      return false
    },
    remove({ value }: { value: string }) {
      const accounts = config.get('accounts')
      const account = accounts.some(
        (it) => it.name === value || it.email === value
      )

      if (account) {
        config.set(
          'accounts',
          accounts.filter((it) => !(it.name === value || it.email === value))
        )

        list()

        return true
      }

      return false
    },
    list,
    async use({ value }: { value: string }) {
      const accounts = config.get('accounts')
      const account = accounts.find(
        (it) => it.name === value || it.email === value
      )

      if (account) {
        /**
         * @see https://docs.github.com/en/get-started/getting-started-with-git/setting-your-username-in-git#about-git-usernames
         */

        await $`git config --global user.email ${account.email}`
        await $`git config --global user.name ${account.name}`

        list()

        return true
      }

      return false
    },
  }

const program = commander.createCommand()

program.name('git user').version('0.0.0')

program
  .command('init')
  .description(
    'initialize the git-user configuration with the current git global configuration.'
  )
  .action(() => {
    void actions.init()
  })

program
  .command('add')
  .description('add the given username and email to the data list.')
  .argument('<name>', 'the name of the github account.', trim)
  .argument('<email>', 'the email of the github account.', verify_email)
  .action((name: string, email: string) => {
    void actions.add({ name, email })
  })

program
  .command('remove')
  .description(
    'remove the data from the list based on the given username or email.'
  )
  .argument('<name|email>', 'the name or email of the github account.', trim)
  .action((value: string) => {
    void actions.remove({ value })
  })

program
  .command('list')
  .description('list all git users, currently in use will be marked with *.')
  .action(() => {
    void actions.list()
  })

program
  .command('use')
  .description('use the user based on the given username or email.')
  .argument('<name|email>', 'the name or email of the github account.', trim)
  .action((value: string) => {
    void actions.use({ value })
  })

program.parse(process.argv)
