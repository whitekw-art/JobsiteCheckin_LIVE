export type TrialOffer = {
  label: string
  sub: string
  fine: string
  url: string
}

export const TRIAL_OFFERS: Record<string, TrialOffer> = {
  'titan-monthly-14-upfront': {
    label: 'Try Titan free for 14 days',
    sub: 'Full Access — no charge until your trial ends.',
    fine: 'Card required to start · payment begins on day 15 - discount codes eligible · Cancel anytime before then, no charge',
    url: 'https://buy.stripe.com/28E7sL6Ra9FtdIMfHY48000',
  },
  'titan-monthly-30-upfront': {
    label: 'Try Titan free for 30 days',
    sub: 'Full Access — no charge until your trial ends.',
    fine: 'Card required to start · payment begins on day 31 - discount codes eligible · Cancel anytime before then, no charge',
    url: 'https://buy.stripe.com/7sYdR92AU2d1bAE0N448001',
  },
  'titan-annual-30-upfront': {
    label: 'Try Titan free for 30 days',
    sub: 'Full Access — no charge until your trial ends.',
    fine: 'Card required to start · payment begins on day 31 - discount codes eligible · Cancel anytime before then, no charge',
    url: 'https://buy.stripe.com/6oU6oH7Ve18X6gk0N448002',
  },
  'titan-monthly-14-postpay': {
    label: 'Try Titan free for 14 days',
    sub: 'Full Access — no charge until your trial ends.',
    fine: 'No card required to start · payment begins on day 15 - discount codes eligible · Cancel anytime before then, no charge',
    url: 'https://buy.stripe.com/00wbJ17Ve18X6gk1R848003',
  },
  'titan-monthly-30-postpay': {
    label: 'Try Titan free for 30 days',
    sub: 'Full Access — no charge until your trial ends.',
    fine: 'No card required to start · payment begins on day 31 - discount codes eligible · Cancel anytime before then, no charge',
    url: 'https://buy.stripe.com/9B64gz5N604TdIM8fw48004',
  },
  'titan-annual-30-postpay': {
    label: 'Try Titan free for 30 days',
    sub: 'Full Access — no charge until your trial ends.',
    fine: 'No card required to start · payment begins on day 31 - discount codes eligible · Cancel anytime before then, no charge',
    url: 'https://buy.stripe.com/14AdR9ejC2d15cgcvM48005',
  },
}
