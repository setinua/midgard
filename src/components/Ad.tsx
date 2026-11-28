import Script from 'next/script'
import { AD_SLOTS, type AdSlotId } from '../globals/Ads'
import { getAds, img } from '../lib/data'
import type { Ad as AdsGlobal } from '../payload-types'
import { AdCode, AdsenseUnit } from './AdClient'
import { AdLabel } from './Blocks'

type Campaign = NonNullable<AdsGlobal['top']>

/** The banner booked for a place, if it is switched on, within its dates and filled in. */
export const pickCampaign = (ads: AdsGlobal | null | undefined, slot: AdSlotId, now = new Date()): Campaign | null => {
  if (!ads?.enabled) return null
  const c = ads[slot]
  if (!c?.active) return null
  if (c.startsAt && new Date(c.startsAt) > now) return null
  if (c.endsAt && new Date(c.endsAt) < now) return null
  const kind = c.kind || 'adsense'
  if (kind === 'adsense') return c.adSlot?.trim() && ads.adsenseClient?.trim() ? c : null
  if (kind === 'code') return c.code?.trim() ? c : null
  return img(c.image)?.url ? c : null
}

function Creative({ c, slot, client }: { c: Campaign; slot: AdSlotId; client: string }) {
  const kind = c.kind || 'adsense'
  if (kind === 'adsense') {
    return (
      <>
        <Script id="adsbygoogle-js" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`} strategy="afterInteractive" crossOrigin="anonymous" />
        <AdsenseUnit client={client} slot={c.adSlot!.trim()} />
      </>
    )
  }
  if (kind === 'code') return <AdCode code={c.code!} />
  const desktop = img(c.image)!
  const mobile = img(c.mobileImage)
  const [w, h] = AD_SLOTS[slot].desktop
  const picture = (
    <picture>
      {mobile?.url && <source media="(max-width: 767px)" srcSet={mobile.url} />}
      <img src={desktop.url!} alt={c.alt || c.advertiser || 'Реклама'} width={w} height={h} loading={slot === 'top' ? 'eager' : 'lazy'} />
    </picture>
  )
  return c.url ? (
    <a href={c.url} rel="sponsored noopener" target="_blank" className="adslot__fill">{picture}</a>
  ) : (
    <div className="adslot__fill">{picture}</div>
  )
}

/**
 * One of the three banner places. Renders nothing unless a banner is switched on for it; when it is, the box has a
 * fixed size and the «Реклама» mark (ТЗ 1.1, розділ 10). Not for search, static pages or partner materials.
 */
export async function AdSlot({ slot, className }: { slot: AdSlotId; className?: string }) {
  const ads = await getAds()
  const c = pickCampaign(ads, slot)
  if (!c) return null
  return (
    <aside className={`adslot adslot--${slot}${className ? ` ${className}` : ''}`} aria-label="Реклама" data-slot={AD_SLOTS[slot].label}>
      <AdLabel />
      <div className="adslot__box">
        <Creative c={c} slot={slot} client={ads!.adsenseClient!.trim()} />
      </div>
    </aside>
  )
}
