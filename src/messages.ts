import _ from 'lodash'
import { Context, Telegraf } from 'telegraf'
import { Message } from 'telegraf/typings/core/types/typegram'
import { File as f } from 'typegram/manage'
import fetch from 'node-fetch'

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

export async function ignoreOldMessageUpdates(ctx: Context, next: () => any) {
  const { chat, from, updateType, message } = ctx
  const time = new Date().getTime() / 1000
  const isOldTime = message && time - message.date < 5 * 60

  if (updateType !== 'message' || isOldTime) {
    return next()
  }

  return from && chat && message && `Ignoring message from ${from.id} at ${chat.id} (${time}:${message.date})`
}

export function getHtmlTagName(type: string) {
  switch (type) {
    case 'bold':
      return 'b'
    case 'italic':
      return 'i'
    case 'underline':
      return 'u'
    case 'strikethrough':
      return 's'
    case 'code':
      return 'code'
    case 'pre':
      return 'pre'
    case 'mention':
    case 'hashtag':
    case 'text_link':
      return 'a'
  }

  return type[0]
}

export function messageToHtml(ctx: Context) {
  try {
    const message = (ctx?.message || (ctx?.update as any)?.message) as any
    const text = message?.text || message?.caption
    const entities = message?.entities || message?.caption_entities || []
    const uniqEntities: any[] = _.uniqBy(entities, 'offset')
    const result: string[] = []
    let lastOffset = 0

    if (!text) {
      return { result: '', error: 'empty text' }
    }

    for (const ent of uniqEntities) {
      const tagName = getHtmlTagName(ent.type)
      result.push(
        ...[
          text.slice(lastOffset, ent.offset),
          `<${tagName}>`,
          text.slice(ent.offset, ent.offset + ent.length),
          `</${tagName}>`
        ]
      )
      lastOffset = ent.offset + ent.length
    }

    result.push(text.slice(lastOffset, text.length))

    return { result: result.join('').replaceAll('\n', '<br/>') }
  } catch (error) {
    return { error }
  }
}

export function extractMedia(ctx: Context) {
  const message = (ctx?.message || (ctx?.update as any)?.message) as any

  const sticker = message?.sticker
  const animation = message?.animation
  const video = message?.video
  const photo = message?.photo && (message?.photo[1] || message?.photo[0])

  return photo || sticker || animation || video
}

export async function extractBase64(bot: Telegraf, fileId: string | f, isAnimated = false) {
  if (!fileId) {
    return ''
  }
  try {
    const dataType = isAnimated ? 'image/gif' : 'image/png'
    const photoLink = await bot.telegram.getFileLink(fileId)
    const base64 = photoLink && (await (await fetch(photoLink.href)).buffer()).toString('base64')
    return (photoLink && `data:${dataType};base64,${base64}`) || ''
  } catch {
    //
  }
  return ''
}
