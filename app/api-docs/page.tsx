import { getApiDocs } from '@/lib/swagger'
import ReactSwagger from './react-swagger'
import { Header } from '@/components/header'

export default async function ApiDocsPage() {
  const spec = await getApiDocs()
  
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">📚 API Documentation</h1>
            <p className="text-muted-foreground">
              Interactive API documentation for CrosFi DeFi Protocol
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border">
            <ReactSwagger spec={spec} />
          </div>
        </div>
      </div>
    </main>
  )
}
