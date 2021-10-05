import { Context } from 'telegraf'
import { Message } from 'telegraf/typings/core/types/typegram'

export async function deleteMessage(ctx: Context) {
  try {
    return await ctx.deleteMessage()
  } catch (e) {
    return { error: e }
  }
}

export function extractEntities(message?: Message, type?: string) {
  const { text = '', entities = [] } = { ...message }
  const extractedEntities: string[] = []

  entities
    .filter((x) => x.type === type)
    .forEach((ent) => {
      let sliced = text.slice(ent.offset, ent.offset + ent.length)
      if (type === 'url' && !sliced.startsWith('http')) {
        sliced = `https://${sliced}`
      }
      extractedEntities.push(sliced)
    })

  return extractedEntities
}
