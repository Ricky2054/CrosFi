'use client'

import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

type Props = {
  spec: Record<string, any>
}

function ReactSwagger({ spec }: Props) {
  return (
    <div className="swagger-ui-wrapper">
      <SwaggerUI 
        spec={spec}
        docExpansion="list"
        defaultModelsExpandDepth={1}
        defaultModelExpandDepth={1}
        tryItOutEnabled={true}
        requestInterceptor={(request) => {
          // Add any custom request headers or modifications here
          return request
        }}
        responseInterceptor={(response) => {
          // Handle responses if needed
          return response
        }}
      />
    </div>
  )
}

export default ReactSwagger
