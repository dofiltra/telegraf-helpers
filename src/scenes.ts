import { Context, Scenes } from "telegraf"

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
