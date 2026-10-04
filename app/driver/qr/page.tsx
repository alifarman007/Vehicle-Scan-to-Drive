import type { Metadata } from "next"

import { BottomBar } from "@/components/bottom-bar"
import { DriverQrCard } from "@/components/driver-qr-card"
import { PrintButton } from "@/components/driver/print-button"
import { Wordmark } from "@/components/logo"
import { PlateChip } from "@/components/plate-chip"
import { QrImage } from "@/components/qr"
import { TopBar } from "@/components/top-bar"
import { formatCode, qrUrl } from "@/lib/codes"
import { toMe } from "@/lib/data"
import { getAppOrigin } from "@/lib/origin"
import { requirePageProfile } from "@/lib/session"
import { strings } from "@/lib/strings"

export const metadata: Metadata = { title: strings.myQr.title }

/** The driver's QR, with a print layout to stick in the car. */
export default async function MyQrPage() {
  const driver = await requirePageProfile("driver")
  const value = qrUrl(await getAppOrigin(), driver.code)

  return (
    <>
      <TopBar backHref="/driver" />
      <main className="flex flex-1 flex-col print:hidden">
        <div className="px-5">
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{strings.myQr.title}</h1>
          <p className="mt-1 text-[16px] text-muted-foreground">{strings.myQr.subtitle}</p>
        </div>
        <div className="px-4 pt-5">
          <DriverQrCard me={toMe(driver)} qrValue={value} showIdentity />
        </div>
        <BottomBar>
          <PrintButton />
        </BottomBar>
      </main>

      {/* Print-only sheet: large QR that survives a scratched, sun-faded print. */}
      <section className="hidden flex-col items-center px-8 pt-10 text-center text-black print:flex">
        <Wordmark />
        <h1 className="mt-8 text-[34px] leading-tight font-bold">{strings.myQr.printHeading}</h1>
        <p className="mt-2 text-[20px]">{strings.myQr.printBody}</p>
        <div className="mt-8 w-[11cm]">
          <QrImage value={value} level="Q" />
        </div>
        <p className="mt-4 pl-[0.3em] font-mono text-[34px] font-semibold tracking-[0.3em]">
          {formatCode(driver.code)}
        </p>
        <p className="mt-6 text-[20px] font-medium">{driver.name}</p>
        {driver.vehicleNo ? <PlateChip className="mt-3" size="lg" value={driver.vehicleNo} /> : null}
      </section>
    </>
  )
}
