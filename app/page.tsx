export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="font-display text-display-md text-on-surface mb-4">
          EventFlow
        </h1>
        <p className="text-body-lg text-on-surface-variant mb-8">
          Event registration and check-in platform coming soon.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="btn-primary px-6 py-3 font-label text-label-md">
            Get Started
          </button>
          <button className="btn-secondary px-6 py-3 font-label text-label-md">
            Learn More
          </button>
        </div>
      </div>
    </main>
  )
}