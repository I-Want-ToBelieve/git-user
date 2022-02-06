#!/usr/bin/env zx
/* eslint-disable node/shebang */
import fs from 'fs/promises'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import { Dirent, move } from 'fs-extra'
import { $ } from 'zx'

/** @see https://stackoverflow.com/questions/64383909/dirname-is-not-defined-in-node-14-version */
const dirname = (path_str: string) => fileURLToPath(new URL(path_str, import.meta.url))

const BUILD_PATH = dirname('../dist/')

const is_js_file = (file: Dirent) => file.isFile() && path.extname(file.name) === '.js'
const files = (
  await fs.readdir(BUILD_PATH, {
    withFileTypes: true,
  })
).filter((it) => is_js_file(it))
console.log(files)

const add_chmod = async (path_str: string) => {
  return $`chmod +x ${path_str}`
}

const rm_ext = async (path_str: string) => {
  const { dir, name } = path.parse(path_str)
  const new_path = `${dir}/${name}`
  await move(path_str, new_path, { overwrite: true })
  return new_path
}

await Promise.all(
  files.map(async (it) => {
    let path_str = dirname(`../dist/${it.name}`)

    if (it.name.includes('git-')) {
      path_str = await rm_ext(path_str)
    }

    return add_chmod(path_str)
  })
)
