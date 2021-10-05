import { Context, Scenes } from 'telegraf'
import { deleteMessage } from '.'

const unwrapCallback = async (ctx: Context, nextScene: any) => {
  const nextSceneId = await Promise.resolve(nextScene(ctx))
  if (nextSceneId) return ctx.scene.enter(nextSceneId, ctx.scene.state)
  return ctx.scene.leave()
}

/**
 * Takes steps as arguments and returns a sceneFactory
 *
 * Additionally does the following things:
 * 1. Makes sure next step only triggers on `message` or `callbackQuery`
 * 2. Passes second argument - doneCallback to each step to be called when scene is finished
 * https://github.com/telegraf/telegraf/issues/705#issuecomment-549445360
 */
export const composeWizardScene = (...advancedSteps: any[]) =>
  /**
   * Branching extension enabled sceneFactory
   * @param sceneId {string}
   * @param nextScene {function} - async func that returns nextSceneType
   */
  function createWizardScene(sceneId: string, nextScene: any) {
    return new Scenes.WizardScene(
      sceneId,
      ...advancedSteps.map((stepFn) => async (ctx: Context, next: any) => {
        /** ignore user action if it is neither message, nor callbackQuery */
        if (!ctx.message && !ctx.callbackQuery) return

        if (typeof stepFn !== 'function') {
          stepFn = stepFn.handler
        }

        return stepFn(ctx, () => unwrapCallback(ctx, nextScene), next)
      })
    )
  }

type TSceneOpts = {
  id: string
  cancelButton: string
  leaveCb?: (ctx: Context) => void
  startCb?: (ctx: Context) => void
}

export function createScene(opts: TSceneOpts) {
  const { id, cancelButton, leaveCb, startCb } = opts
  const scene = new Scenes.BaseScene(id)
  const leave = (ctx: Context, cb?: (ctx: Context) => void) => {
    deleteMessage(ctx)
    cb && cb(ctx)
    ctx.scene.leave()
  }

  scene.action(cancelButton, (ctx) => leave(ctx))
  scene.command(['start', 'help', 'cancel'], (ctx) => leave(ctx, startCb))
  scene.leave((ctx) => leaveCb && leaveCb(ctx))

  return scene
}
