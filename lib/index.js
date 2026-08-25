export const name = 'dsh-windows-tool-fix'

export function apply(ctx) {
  if (process.platform === 'win32') {
    ctx.logger.info(name + ': new sessions default to minimal-gitbash; no shipped files modified')
  }
}
