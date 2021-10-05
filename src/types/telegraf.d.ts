import { Scenes, session, WizardContextWizard } from 'telegraf'
import I18N from 'telegraf-i18n'

declare module 'telegraf' {
  export class Context {
    dbuser: any
    i18n: I18N
    session: session
    scene: Scenes
    wizard: WizardContextWizard
  }
}
