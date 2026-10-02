import {useEffect, useState} from 'react'

import './App.css'
type HelloMessage = {
  message: string;
}
function App() {
  const [message,setMessage] = useState('Loading...');
  const [error,setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMessage() {
      try {
        const response = await fetch('/api/hello', {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          }
        })
        if(!response.ok) {
          throw new Error('Could not load the message')
        }
        const data: HelloMessage = await response.json()
        setMessage(data.message)
      } catch(error) {
        if(controller.signal.aborted){
          return
        }
        setError(
            error instanceof Error ? error.message: "Something went wrong. ",
        )
      }
    }
    loadMessage();
    return () => controller.abort()
  },[])

  return (
      <main>
        <h1>SpendTempo</h1>
        <p>{error ?? message}</p>
      </main>
  )
}

export default App
