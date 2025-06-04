

export default function Home() {
  return (<>
    <main className="flex min-h-screen items-center justify-center bg-gray-700 p-6">
      <div className="text-center bg-blue-700 shadow-md rounded-xl p-8 max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-200">
          Telegram Chat API Endpoint
        </h1>
        <p className="text-gray-200">
          This backend powers the chat system for{' '}
          <a
            href="https://mycoco.site"
            className="text-blue-300 hover:underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            mycoco.site
          </a>
        </p>
      </div>
    </main>
  </>);
}
