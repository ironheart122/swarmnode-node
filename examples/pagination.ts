import SwarmNodeAI from '@swarmnode-ai/sdk'

const swarmnode = new SwarmNodeAI({
  apiKey: process.env.SWARMNODE_API_KEY,
})

async function run() {
  // Method 1: Using async iterator (recommended)
  // This is the most convenient way to iterate through all pages
  const stores = await swarmnode.stores.list()
  for await (const store of stores) {
    console.log('Store:', store.name)
  }

  // Method 2: Manual pagination
  // Useful when you need more control over the pagination process
  let currentPage = await swarmnode.stores.list()

  console.log('currentPage: ', currentPage)

  while (true) {
    // Get information about current page
    const pageNumber = currentPage.getCurrentPageNumber()
    const items = currentPage.getItems()

    console.log(`Page ${pageNumber} - Items: ${items.length}`)
    items.forEach((store) => console.log('Store:', store.name))

    if (!currentPage.hasNextPage()) {
      break
    }

    const nextPage = await currentPage.getNextPage()

    if (!nextPage) {
      break
    }
    currentPage = nextPage
  }

  // Method 3: Fetch specific page
  // Useful when you need to jump to a specific page
  // Do note that if page number is out of range, it will throw an error. Handle it accordingly.

  const pageNumber = 2
  const specificPage = await swarmnode.stores.list({ page: pageNumber })
  console.log(`Items on page ${pageNumber}:`, specificPage.getItems().length)
}

// Start the example
run().catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
