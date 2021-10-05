import { Context } from 'telegraf'

export async function deleteMessage(ctx: Context) {
  try {
    return await ctx.deleteMessage()
  } catch (e) {
    return { error: e }
  }
}
