import { Schema, Context } from 'koishi'
import Couple from './couple'
import './types'

export const name = 'marry'
export const using = ['database'] as const

export const Config : Schema<marry.Config> = Schema.object({
  keyword: Schema.union([
    Schema.array(String),
    Schema.transform(String, keyword => [keyword]),
  ] as const).description('触发娶群友的关键词').default(['今日老婆']),
  excludedUsers: Schema.array(Schema.object({
    platform: Schema.string().description('平台名（QQ平台名为onebot）').required(),
    id: Schema.string().description('用户ID').required(),
    note: Schema.string().description('备注（可不填此项）'),
  })).description('排除的用户').default([{ platform: 'onebot', id: '2854196310', note: 'Q群管家' }]),
})

export async function apply(ctx: Context, config: marry.Config) {
  ctx.i18n.define('zh', require('./locales/zh-CN'))

  const couple = new Couple(ctx, config)

  ctx.middleware((session, next) => {
    for (const i of config.keyword) {
      if (session.content === i) session.execute('marry')
    }
    return next()
  })

  ctx.command('marry')
    .action(async ({ session }) => {
      if (session.subtype === 'private') return
      const marriedUser = await couple.getCouple(session)

      // if there are no user to pick, return with "members-too-few"
      if (!marriedUser) return <i18n path=".members-too-few" />
      return <>
        <quote id={session.messageId} />
        <i18n path=".today-couple" />{marriedUser.nickname ? marriedUser.nickname : marriedUser.username}
        <image url={marriedUser.avatar} />
      </>
    })
}
