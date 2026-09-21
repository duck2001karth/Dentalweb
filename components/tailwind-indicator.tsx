export function TailwindIndicator() {
  if (process.env.NODE_ENV === "production") return null

  return (
    <div className="fixed bottom-2 left-2 z-50 flex h-7 px-2 items-center justify-center rounded-md bg-[#0b0f19] font-mono text-xs text-white shadow-md">
      <div className="block sm:hidden">xs</div>
      <div className="hidden sm:block md:hidden">sm</div>
      <div className="hidden md:block lg:hidden">md</div>
      <div className="hidden lg:block xl:hidden">lg</div>
      <div className="hidden xl:block 2xl:hidden">xl</div>
      <div className="hidden 2xl:block">2xl</div>
    </div>
  )
}